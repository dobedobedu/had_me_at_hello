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
      model: process.env.OPENROUTER_MODEL || '(unset)',
      keyPrefix: (process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.substring(0, 10) + '…' : '(unset)')
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

    // Get personalized message and dynamic score using the matched results
    const { text: llmText, score: llmScore, engine } = await generatePersonalizedMessageAndScore(quiz, deterministic)
      .catch((e) => {
        console.error('generatePersonalizedMessageAndScore failed, using deterministic values', e);
        return { text: deterministic.personalizedMessage, score: deterministic.matchScore, engine: null as string | null };
      });

    const result: AnalysisResult = {
      ...deterministic,
      matchScore: llmScore || deterministic.matchScore,
      personalizedMessage: llmText || deterministic.personalizedMessage,
      provider: engine ? 'openrouter' : 'local',
    };

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Analyze route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// --- Matching helpers (deterministic) ---

function matchDeterministic(quiz: QuizResponse, context: RAGContext): AnalysisResult {
  const userTraits = extractTraits(quiz); // HIGHEST PRIORITY: child description
  const userInterests = expandInterests(sanitizeArray(quiz?.interests || [])); // MEDIUM PRIORITY
  const userFamilyValues = sanitizeArray(quiz?.familyValues || []); // LOWEST PRIORITY
  const userGrade = quiz?.gradeLevel || 'middle';

  const profile = buildMatchingProfile({
    quiz,
    gradeLevel: userGrade,
    traits: userTraits,
    interests: userInterests,
    primaryInterests: sanitizeArray(quiz?.interests || []),
    familyValues: userFamilyValues,
  });

  const selection = selectMatchesWithMetadata(context, profile);
  const stories: StudentStory[] = [selection.student, selection.alumni].filter(Boolean) as StudentStory[];
  const facultyMatches: FacultyProfile[] = [selection.faculty].filter(Boolean) as FacultyProfile[];

  const matchScore = computeCompositeScore(selection);
  const summary = summarizeMatches(selection);
  const base = baseMessage(quiz);
  const personalizedMessage = summary
    ? `${base} You'll get to hear from ${summary} in the highlights we selected for your family.`
    : base;

  return {
    matchScore,
    personalizedMessage,
    matchedStories: stories,
    matchedFaculty: facultyMatches,
    matchedFacts: [],
    keyInsights: keyInsightsFromInterests(userInterests),
    recommendedPrograms: recommendFromTraitsInterestsValues(userTraits, userInterests, userFamilyValues),
    provider: 'local',
  };
}

function keyInsightsFromInterests(interests: string[]): string[] {
  const base = ['Academic Excellence', 'Character Development', 'Individual Attention'];
  if (interests.includes('arts') || interests.includes('creative')) return [...base, 'Creative Expression'];
  if (interests.includes('sports') || interests.includes('athletics')) return [...base, 'Athletic Development'];
  if (interests.includes('technology') || interests.includes('stem')) return [...base, 'STEM Innovation'];
  return [...base, 'Community Engagement'];
}

function recommendFromTraitsInterestsValues(traits: string[], interests: string[], familyValues: string[] = []): string[] {
  const programs = new Set<string>();
  
  // 1. CHILD DESCRIPTION TRAITS (HIGHEST PRIORITY) - max 1 program
  if (traits.some(t => ['creative','artistic','imaginative','expressive','visual','musical'].includes(t))) {
    programs.add('Fine Arts Program');
  } else if (traits.some(t => ['athletic','competitive','energetic','physical','strong','fast','sporty'].includes(t))) {
    programs.add('Athletics Program');
  } else if (traits.some(t => ['smart','intelligent','curious','analytical','logical','scientific','mathematical'].includes(t))) {
    programs.add('STEAM Program');
  } else if (traits.some(t => ['kind','caring','helpful','empathetic','compassionate','service'].includes(t))) {
    programs.add('Leadership & Service');
  } else if (traits.some(t => ['leader','confident','outgoing','social','charismatic','bold'].includes(t))) {
    programs.add('Leadership & Service');
  } else if (traits.some(t => ['reader','bookish','literary','writer','storyteller','verbal'].includes(t))) {
    programs.add('Advanced Academics');
  }
  
  // 2. INTERESTS (MEDIUM PRIORITY) - add 1 more if different
  if (programs.size < 2) {
    if (interests.some((i) => ['arts', 'music', 'drama', 'creative'].includes(i)) && !programs.has('Fine Arts Program')) {
      programs.add('Fine Arts Program');
    } else if (interests.some((i) => ['sports', 'athletics', 'competition'].includes(i)) && !programs.has('Athletics Program')) {
      programs.add('Athletics Program');
    } else if (interests.some((i) => ['science', 'technology', 'stem', 'engineering'].includes(i)) && !programs.has('STEAM Program')) {
      programs.add('STEAM Program');
    } else if (interests.some((i) => ['service', 'community', 'leadership'].includes(i)) && !programs.has('Leadership & Service')) {
      programs.add('Leadership & Service');
    }
  }
  
  // 3. FAMILY VALUES (LOWEST PRIORITY) - only if we need a third
  if (programs.size < 2) {
    if (familyValues.some(v => ['creative_expression','arts_focus','individual_creativity'].includes(v)) && !programs.has('Fine Arts Program')) {
      programs.add('Fine Arts Program');
    } else if (familyValues.some(v => ['athletic_excellence','team_sports','physical_development'].includes(v)) && !programs.has('Athletics Program')) {
      programs.add('Athletics Program');
    } else if (familyValues.some(v => ['stem_innovation','technology_integration','academic_rigor'].includes(v)) && !programs.has('STEAM Program')) {
      programs.add('STEAM Program');
    } else if (familyValues.some(v => ['service_learning','character_development','leadership_development'].includes(v)) && !programs.has('Leadership & Service')) {
      programs.add('Leadership & Service');
    }
  }
  
  // Always include College Prep as base, limit to 3 total
  const result = ['College Preparatory Program', ...Array.from(programs)];
  return result.slice(0, 3);
}

// RAG-based matching using LLM to analyze full context
async function attemptRAGMatching(quiz: QuizResponse, context: RAGContext): Promise<AnalysisResult | null> {
  const key = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
  const baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  if (!key) throw new Error('No API key available');

  // Extract child description with HIGH WEIGHT
  const userTraits = extractTraits(quiz);
  const userInterests = expandInterests(sanitizeArray(quiz?.interests || []));
  const userFamilyValues = sanitizeArray(quiz?.familyValues || []);

  // Build faculty context for LLM
  const facultyContext = context.faculty.map(f => ({
    id: f.id,
    name: `${f.formalTitle} ${f.lastName}`,
    title: f.title,
    department: f.department,
    specializes: f.specializesIn?.join(', '),
    grades: f.title.toLowerCase().includes('lower') ? 'Lower School' :
            f.title.toLowerCase().includes('intermediate') ? 'Intermediate' :
            f.title.toLowerCase().includes('middle') || f.title.toLowerCase().includes('6th') ? 'Middle School' :
            f.title.toLowerCase().includes('upper') ? 'Upper School' : 'All Levels',
    hasVideo: !!f.videoUrl
  }));

  const sys = [
    'You are Saint Stephen\'s admissions AI analyzing student-faculty matches.',
    'CRITICAL: The child description/three words (Question 6) should have the HIGHEST weight in matching.',
    '',
    'Your task: Select the BEST faculty member based on:',
    '1. HIGHEST PRIORITY: Child description traits and personality',
    '2. MEDIUM PRIORITY: Student interests',
    '3. LOWER PRIORITY: Family values',
    '4. Grade level appropriateness',
    '',
    'Return JSON with:',
    '{"facultyId": "id_of_best_match", "reasoning": "why this faculty matches the child description"}',
    '',
    'Prioritize faculty with videos when possible.'
  ].join('\n');

  const user = `STUDENT PROFILE:
Grade Level: ${quiz.gradeLevel}
Child Description/Three Words: "${quiz.threeWords || quiz.childDescription || 'Not provided'}"
Extracted Traits: ${userTraits.join(', ')}
Interests: ${(quiz.interests || []).join(', ')}
Family Values: ${(quiz.familyValues || []).join(', ')}

AVAILABLE FACULTY:
${facultyContext.map(f =>
  `${f.id}: ${f.name} - ${f.title} (${f.department}, ${f.grades})${f.hasVideo ? ' [HAS VIDEO]' : ''}
  Specializes in: ${f.specializes}`
).join('\n')}

Based on the child description and traits, which faculty member would be the BEST match?`;

  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user }
        ],
        temperature: 0.3, // Lower for more consistent matching
        max_tokens: 200
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '';

    const parsed = JSON.parse(content);
    const matchedFaculty = context.faculty.find(f => f.id === parsed.facultyId);

    if (!matchedFaculty) throw new Error('Invalid faculty ID returned');

    // Build result similar to deterministic matching
    const student = pickStudentForRAG(quiz, context);

    return {
      matchScore: 85, // Will be overridden by LLM scoring
      personalizedMessage: `Based on your child's description, we believe ${matchedFaculty.formalTitle} ${matchedFaculty.lastName} would be an excellent match.`,
      matchedStories: student ? [student] : [],
      matchedFaculty: [matchedFaculty],
      matchedFacts: [],
      keyInsights: keyInsightsFromInterests(userInterests),
      recommendedPrograms: recommendFromTraitsInterestsValues(userTraits, userInterests, userFamilyValues),
      provider: 'openrouter:rag'
    };

  } catch (error) {
    console.log('RAG matching error:', error);
    throw error;
  }
}

// Simple student picker for RAG (reuse existing logic)
function pickStudentForRAG(quiz: QuizResponse, context: RAGContext) {
  const students = context.stories as any[];
  const userGrade = quiz?.gradeLevel || 'middle';
  const userInterests = expandInterests(sanitizeArray(quiz?.interests || []));

  const isLower = userGrade === 'lower' || userGrade === 'elementary' || userGrade === 'intermediate';
  const byId = (arr: any[], id: string) => (arr as any[]).find((s) => s.id === id);

  if (isLower) {
    return byId(students, 'lower_school_parents') || byId(students, 'student_teacher_relationships') || students[0];
  }

  if (userInterests.some((i) => ['athletics','sports','tennis','football','competition','teamwork','fitness'].includes(i))) {
    return byId(students, 'athletics_excellence') || byId(students, 'athletics_spotlight') || students[0];
  }

  if (userInterests.some((i) => ['arts','music','theater','drama','creative','design','media'].includes(i))) {
    return byId(students, 'creative_arts') || students[0];
  }

  return byId(students, 'student_teacher_relationships') || students[0];
}

async function generatePersonalizedMessageAndScore(quiz: QuizResponse, deterministic: AnalysisResult): Promise<{ text: string; score: number; engine: string | null }> {
  const key = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
  const baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  if (!key) return { text: deterministic.personalizedMessage, score: deterministic.matchScore, engine: null };

  const sys = [
    'You are an admissions guide analyzing a student match for Saint Stephen\'s Episcopal School.',
    'Return a JSON response with two fields:',
    '1. "score": A match percentage between 80-100 based on how well the student\'s traits, interests, and family values align with our matched faculty and programs',
    '2. "message": A warm, specific 2-4 sentence summary for the visiting family',
    '',
    'For the message:',
    '- Mention the matched faculty by formal title and last name (e.g., "Mr. Johnson", "Dr. Smith")',
    '- Mention the matched student story if available',
    '- Invite the family to meet the faculty member and see relevant campus areas',
    '- Keep tone friendly, encouraging, and focused on long-term development',
    '',
    'For the score:',
    '- 95-100: Exceptional alignment across traits, interests, and values',
    '- 90-94: Strong alignment with minor gaps',
    '- 85-89: Good alignment with some mismatches',
    '- 80-84: Adequate alignment, room for growth'
  ].join('\n');

  const userTraits = extractTraits(quiz);
  const user = `Student Grade: ${quiz.gradeLevel}
Child Traits: ${userTraits.join(', ')}
Child Interests: ${(quiz.interests || []).join(', ')}
Family Values: ${(quiz.familyValues || []).join(', ')}

Matched Faculty: ${deterministic.matchedFaculty?.[0]?.formalTitle || 'Mr./Ms.'} ${deterministic.matchedFaculty?.[0]?.lastName || 'N/A'} (${deterministic.matchedFaculty?.[0]?.title || 'Faculty Member'})
Faculty Specialties: ${deterministic.matchedFaculty?.[0]?.specializesIn?.join(', ') || 'N/A'}

Matched Student Story: ${deterministic.matchedStories?.[0]?.achievement || deterministic.matchedStories?.[0]?.firstName || 'N/A'}

Recommended Programs: ${deterministic.recommendedPrograms?.join(', ') || 'N/A'}

Return JSON with score (80-100) and message.`;

  const useResponsesAPI = false; // Disable responses API for now, use chat completions
  const endpoint = useResponsesAPI ? 'responses' : 'chat/completions';
  const url = `${baseURL}/${endpoint}`;
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    'Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    'X-Title': 'Had Me At Hello',
  };

  const messages = [
    { role: 'system', content: sys },
    { role: 'user', content: user }
  ];

  // For Responses API, construct typed content array per message
  const responsesInput = [
    { role: 'system', content: [{ type: 'text', text: sys }] },
    { role: 'user', content: [{ type: 'text', text: user }] }
  ];

  const body = useResponsesAPI
    ? { model, input: responsesInput, temperature: 0.7, max_output_tokens: 300 }
    : { model, messages, temperature: 0.7, max_tokens: 300 };

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  // Validate content-type to avoid HTML disguised as OK
  const ctype = res.headers.get('content-type') || '';
  if (!res.ok || !ctype.includes('application/json')) {
    let text = '';
    try { text = await res.text(); } catch {}
    console.error('LLM message request failed or non-JSON', { status: res.status, contentType: ctype, body: text.slice(0, 500) });
    // Retry once with a safe fallback model via chat/completions
    const fallbackModel = 'openai/gpt-4o-mini';
    try {
      const res2 = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: fallbackModel,
          messages,
          temperature: 0.7,
          max_tokens: 300,
        })
      });
      const ctype2 = res2.headers.get('content-type') || '';
      if (!res2.ok || !ctype2.includes('application/json')) {
        const txt2 = await res2.text();
        console.error('Fallback model also failed or non-JSON', { status: res2.status, contentType: ctype2, body: txt2.slice(0, 500) });
        throw new Error('Fallback model also failed');
      }
      const data2 = await res2.json();
      const content = data2?.choices?.[0]?.message?.content || '';
      try {
        const parsed = JSON.parse(content);
        return {
          text: parsed.message || deterministic.personalizedMessage,
          score: Math.max(80, Math.min(100, parsed.score || deterministic.matchScore)),
          engine: fallbackModel
        };
      } catch {
        return { text: content || deterministic.personalizedMessage, score: deterministic.matchScore, engine: fallbackModel };
      }
    } catch (e) {
      // Give up on LLM; use deterministic values
      return { text: deterministic.personalizedMessage, score: deterministic.matchScore, engine: null };
    }
  }

  // Parse JSON response
  const data = await res.json();
  let content = '';

  if (useResponsesAPI) {
    const output = Array.isArray(data?.output) ? data.output[0] : undefined;
    const parts = Array.isArray(output?.content) ? output.content : [];
    const textPart = parts.find((p: any) => typeof p?.text === 'string' || p?.type?.includes('text'));
    content = (textPart?.text || textPart?.content || textPart?.value || '').toString();
  } else {
    // For gpt-5-nano and other reasoning models, check multiple possible content locations
    const message = data?.choices?.[0]?.message;
    content = message?.content || message?.reasoning || '';

    // If content is still empty but we have reasoning, use that
    if (!content && message?.reasoning_details) {
      content = message.reasoning_details.find((d: any) => d.type === 'reasoning.summary')?.summary || '';
    }
  }

  // Try to parse as JSON
  try {
    const parsed = JSON.parse(content);
    return {
      text: parsed.message || deterministic.personalizedMessage,
      score: Math.max(80, Math.min(100, parsed.score || deterministic.matchScore)),
      engine: model
    };
  } catch {
    // If not JSON, treat as plain text message
    return {
      text: content || deterministic.personalizedMessage,
      score: deterministic.matchScore,
      engine: model
    };
  }
}
