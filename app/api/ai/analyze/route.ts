import { NextResponse } from 'next/server';
import type { QuizResponse, RAGContext, AnalysisResult, StudentStory, FacultyProfile } from '@/lib/ai/types';
import alumniData from '@/knowledge/alumni-story.json';
import facultyData from '@/knowledge/faculty-story.json';
import currentStudentData from '@/knowledge/current-student-stories.json';
import factsData from '@/knowledge/facts.json';
import {
  buildMatchingProfile,
  computeCompositeScore,
  selectMatchesWithMetadata,
  summarizeMatches,
} from '@/lib/ai/deterministic-matcher';
import { sanitizeArray, extractTraits, expandInterests, baseMessage } from '@/lib/ai/matcher-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    console.log('[/api/ai/analyze] env check', {
      aiGatewayKeyPrefix: (process.env.AI_GATEWAY_API_KEY ? process.env.AI_GATEWAY_API_KEY.substring(0, 10) + '…' : '(unset)'),
      chatModel: process.env.CHAT_MODEL || '(unset)'
    });

    const body = await request.json();
    const quiz: QuizResponse = body?.quiz;
    const forceHybrid = body?.useHybrid; // Explicit override
    const forceLegacy = body?.useLegacy; // Explicit override

    if (!quiz) {
      return NextResponse.json({ error: 'Missing quiz' }, { status: 400 });
    }

    // A/B Testing: Determine which system to use
    const { ABTestingService } = await import('../../../../lib/ai/ab-testing');
    const abTesting = ABTestingService.getInstance();

    let useHybrid: boolean;
    if (forceHybrid !== undefined) {
      useHybrid = forceHybrid;
    } else if (forceLegacy) {
      useHybrid = false;
    } else {
      useHybrid = abTesting.shouldUseHybrid(quiz);
    }

    const assignmentInfo = abTesting.getAssignmentInfo(quiz);
    console.log('🧪 A/B Test Assignment:', assignmentInfo);

    // Build RAG context on the server
    const context: RAGContext = {
      stories: [...(currentStudentData as any).stories, ...(alumniData as any).stories],
      faculty: (facultyData as any).faculty,
      facts: (factsData as any).facts,
    } as any;

    // A/B Testing: Choose between hybrid and legacy matching
    if (useHybrid) {
      console.log('🚀 Using hybrid semantic+LLM matching');
      try {
        const { HybridMatchingService } = await import('../../../../lib/ai/hybrid-matcher');
        const hybridService = HybridMatchingService.getInstance();

        const semanticConfig = abTesting.getSemanticConfig();
        const result = await hybridService.match(quiz, context, {
          useSemanticSearch: true,
          useLLMSelection: true,
          semanticOptions: semanticConfig
        });

        console.log('✅ Hybrid matching completed:', {
          provider: result.provider,
          matchScore: result.matchScore,
          performanceMs: result.performanceMetrics?.totalMs
        });

        return NextResponse.json(result);

      } catch (hybridError) {
        console.warn('⚠️ Hybrid matching failed, falling back to legacy:', hybridError);
        // Fall through to legacy matching
      }
    }

    // Legacy matching system (fallback)
    console.log('🔄 Using legacy deterministic matching');
    const deterministic = matchDeterministic(quiz, context);

    const result: AnalysisResult = {
      ...deterministic,
      provider: 'fallback',
    };

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Analyze route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// --- Matching helpers (deterministic) ---

function matchDeterministic(quiz: QuizResponse, context: RAGContext): AnalysisResult {
  // Build matching profile based on user responses
  const profile = buildMatchingProfile({
    quiz,
    gradeLevel: quiz.gradeLevel || 'middle',
    interests: sanitizeArray(quiz?.interests || []),
    familyValues: sanitizeArray(quiz?.familyValues || []),
    traits: extractTraits(quiz),
    primaryInterests: sanitizeArray(quiz?.interests || []).slice(0, 2)
  });

  // Get matches with metadata
  const selection = selectMatchesWithMetadata(context, profile);

  // Calculate match score from individual scores
  const scores = [selection.studentScore, selection.facultyScore, selection.alumniScore].filter(s => s > 0);
  const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0.8;
  const matchScore = Math.round(avgScore * 100);

  // Generate insights and recommendations
  const userInterests = expandInterests(sanitizeArray(quiz?.interests || []));
  const keyInsights = keyInsightsFromInterests(userInterests);
  const recommendedPrograms = recommendFromTraitsInterestsValues(
    extractTraits(quiz),
    userInterests,
    sanitizeArray(quiz?.familyValues || [])
  );

  return {
    matchScore,
    personalizedMessage: summarizeMatches(selection) || 'Welcome to Saint Stephen\'s! We\'re excited to help you find your perfect fit.',
    matchedStories: selection.student ? [selection.student] : [],
    matchedFaculty: selection.faculty ? [selection.faculty] : [],
    matchedFacts: [],
    keyInsights,
    recommendedPrograms,
    provider: 'local'
  };
}

function keyInsightsFromInterests(interests: string[]): string[] {
  const insights: string[] = [];

  if (interests.some(i => ['athletics', 'sports'].includes(i))) {
    insights.push('Strong athletics program with state championships');
  }
  if (interests.some(i => ['arts', 'music', 'theater'].includes(i))) {
    insights.push('Award-winning arts and music programs');
  }
  if (interests.some(i => ['science', 'technology', 'engineering'].includes(i))) {
    insights.push('STEM-focused curriculum with lab research opportunities');
  }

  return insights.slice(0, 3);
}

function recommendFromTraitsInterestsValues(traits: string[], interests: string[], familyValues: string[] = []): string[] {
  const programs = new Set<string>();

  // Add interest-based programs
  if (interests.some(i => ['athletics', 'sports'].includes(i))) {
    programs.add('Athletic Programs');
  }
  if (interests.some(i => ['arts', 'music'].includes(i))) {
    programs.add('Fine Arts Program');
  }
  if (interests.some(i => ['science', 'technology'].includes(i))) {
    programs.add('STEM Program');
  }

  // Always include College Prep as base, limit to 3 total
  const result = ['College Preparatory Program', ...Array.from(programs)];
  return result.slice(0, 3);
}