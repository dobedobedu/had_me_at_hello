import { QuizResponse, AnalysisResult, TranscriptionResult, RAGContext, StudentStory, FacultyProfile } from './types';
import {
  buildMatchingProfile,
  computeCompositeScore,
  selectMatchesWithMetadata,
  summarizeMatches,
} from './deterministic-matcher';
import { sanitizeArray, extractTraits, expandInterests, baseMessage } from './matcher-utils';

export class AIService {
  private static instance: AIService;

  private constructor() {
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async analyze(quiz: QuizResponse, context: any): Promise<AnalysisResult> {
    try {
      console.log('[AIService] analyze → posting to /api/ai/analyze', { grade: quiz?.gradeLevel, interests: quiz?.interests?.length || 0 });
      // Call server route; server loads knowledge and talks to OpenRouter
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz })
      });
      if (!res.ok) {
        let body = '';
        try { body = await res.text(); } catch {}
        console.error('[AIService] analyze API non-OK', { status: res.status, body: body.slice(0, 300) });
        throw new Error(`Analyze API error: ${res.status}`);
      }
      const data = await res.json();
      console.log('[AIService] analyze → result provider', data?.provider);
      return data as AnalysisResult;
    } catch (error) {
      console.error('❌ Analysis API failed, using local fallback:', error);
      // Local fallback response
      return this.getFallbackResponse(quiz, context);
    }
  }

  private getFallbackResponse(quiz: QuizResponse, context: any): AnalysisResult {
    // Intelligent fallback matching logic - avoid always taking first 2 stories
    const profile = buildMatchingProfile({
      quiz,
      gradeLevel: quiz?.gradeLevel || 'middle',
      traits: extractTraits(quiz),
      interests: expandInterests(sanitizeArray(quiz?.interests || [])),
      primaryInterests: sanitizeArray(quiz?.interests || []),
      familyValues: sanitizeArray(quiz?.familyValues || []),
    });

    let selection = selectMatchesWithMetadata(context as RAGContext, profile);

    const fallbackFacultyIds = ['bernie_yanelli', 'patrick_whelan', 'rachel_ward'];
    const fallbackFacultyPool = (context.faculty as FacultyProfile[] | undefined)?.filter((f) =>
      fallbackFacultyIds.includes(f.id)
    );

    if (fallbackFacultyPool && fallbackFacultyPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * fallbackFacultyPool.length);
      const randomFaculty = fallbackFacultyPool[randomIndex];
      if (randomFaculty) {
        selection = {
          ...selection,
          faculty: randomFaculty,
        };
      }
    }

    const matchedStories = [selection.student, selection.alumni].filter(Boolean) as StudentStory[];
    const matchedFaculty = [selection.faculty].filter(Boolean) as FacultyProfile[];

    const matchScore = computeCompositeScore(selection);
    const summary = summarizeMatches(selection);
    const base = baseMessage(quiz);
    const personalizedMessage = summary
      ? `${base} You'll get to hear from ${summary} in the highlights we selected for your family.`
      : base;

    return {
      matchScore,
      personalizedMessage,
      matchedStories,
      matchedFaculty,
      keyInsights: this.extractKeyInsights(quiz),
      provider: 'local',
      processingTime: 0
    };
  }

  private extractKeyInsights(quiz: QuizResponse): string[] {
    const insights = [];
    
    if (quiz.interests.length > 0) {
      insights.push(`Strong interest in ${quiz.interests[0]}`);
    }
    
    if (quiz.familyValues.includes('small_classes')) {
      insights.push('Values personalized attention');
    }
    
    if (quiz.timeline === 'this_year') {
      insights.push('Ready to start soon');
    }
    
    return insights;
  }

  async transcribe(audioBlob: Blob): Promise<TranscriptionResult> {
    // OpenRouter doesn't support audio transcription
    // Use browser's Web Speech API instead
    throw new Error('Audio transcription not supported. Please use the browser voice input during recording.');
  }

  getCurrentProvider(): string {
    return 'openrouter';
  }
}
