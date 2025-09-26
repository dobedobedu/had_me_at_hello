import { QuizResponse, AnalysisResult, StudentStory, FacultyProfile } from './types';
import { SemanticSearchService, SemanticResults } from './semantic-search';
import { createLLMSelectionEngine, LLMSelectionResult } from './llm-selection-engine';
import { buildMatchingProfile } from './deterministic-matcher';
import { extractTraits, expandInterests } from './matcher-utils';
import { AnalyticsLogger } from './analytics-logger';
import RedisService from '../redis';
import crypto from 'crypto';

interface HybridMatchResult extends AnalysisResult {
  semanticResults?: SemanticResults;
  llmSelection?: LLMSelectionResult;
  fallbackUsed?: boolean;
  performanceMetrics?: {
    semanticSearchMs: number;
    llmSelectionMs: number;
    totalMs: number;
  };
}

interface HybridMatchOptions {
  useSemanticSearch?: boolean;
  useLLMSelection?: boolean;
  semanticOptions?: {
    studentsCount?: number;
    facultyCount?: number;
    alumniCount?: number;
    threshold?: number;
  };
}

class HybridMatchingService {
  private static instance: HybridMatchingService;
  private semanticService: SemanticSearchService;
  private llmEngine: ReturnType<typeof createLLMSelectionEngine>;
  private analytics: AnalyticsLogger;
  private redis: RedisService;

  private constructor() {
    this.semanticService = SemanticSearchService.getInstance();
    this.llmEngine = createLLMSelectionEngine();
    this.analytics = AnalyticsLogger.getInstance();
    this.redis = RedisService.getInstance();
  }

  static getInstance(): HybridMatchingService {
    if (!HybridMatchingService.instance) {
      HybridMatchingService.instance = new HybridMatchingService();
    }
    return HybridMatchingService.instance;
  }

  /**
   * Generate cache key for quiz matching
   */
  private generateCacheKey(quiz: QuizResponse): string {
    const keyData = {
      description: quiz.threeWords || quiz.childDescription || '',
      interests: (quiz.interests || []).sort(),
      grade: quiz.gradeLevel || '',
      timeline: quiz.timeline || '',
      values: (quiz.familyValues || []).sort()
    };

    const hash = crypto.createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex')
      .substring(0, 16);

    return RedisService.getMatchCacheKey(hash);
  }

  /**
   * Try to get cached result
   */
  private async getCachedResult(quiz: QuizResponse): Promise<HybridMatchResult | null> {
    const cacheKey = this.generateCacheKey(quiz);

    try {
      const cached = await this.redis.getJson<HybridMatchResult>(cacheKey);
      if (cached) {
        console.log(`💾 Cache HIT for key: ${cacheKey}`);
        // Add cache indicator
        return { ...cached, provider: (cached.provider + ':cached') as any };
      }
    } catch (error) {
      console.warn('⚠️ Cache get failed:', error);
    }

    return null;
  }

  /**
   * Cache the result
   */
  private async cacheResult(quiz: QuizResponse, result: HybridMatchResult): Promise<void> {
    const cacheKey = this.generateCacheKey(quiz);

    try {
      // Cache for 1 hour (3600 seconds)
      await this.redis.setJson(cacheKey, result, 3600);
      console.log(`💾 Cached result for key: ${cacheKey}`);
    } catch (error) {
      console.warn('⚠️ Cache set failed:', error);
    }
  }

  /**
   * Main hybrid matching method with caching
   */
  async match(
    quiz: QuizResponse,
    context: any,
    options: HybridMatchOptions = {}
  ): Promise<HybridMatchResult> {
    const sessionId = this.analytics.generateSessionId();
    const startTime = Date.now();
    const {
      useSemanticSearch = true,
      useLLMSelection = true,
      semanticOptions = {}
    } = options;

    console.log(`🔍 Starting hybrid matching [${sessionId}]...`);
    console.log('📋 Quiz profile:', {
      childDescription: quiz.threeWords || quiz.childDescription,
      interests: quiz.interests,
      gradeLevel: quiz.gradeLevel,
      timeline: quiz.timeline
    });

    // Try cache first with a small timeout to avoid race conditions
    try {
      const cachedResult = await Promise.race([
        this.getCachedResult(quiz),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 200)) // 200ms timeout
      ]);

      if (cachedResult) {
        console.log(`💾 Cache HIT - returning cached result (${Date.now() - startTime}ms)`);
        return cachedResult;
      }
    } catch (error) {
      console.warn('⚠️ Cache check failed, proceeding with fresh analysis:', error);
    }

    let result: HybridMatchResult;
    let semanticResults: SemanticResults | undefined;
    let llmSelection: LLMSelectionResult | undefined;

    try {
      if (useSemanticSearch && useLLMSelection) {
        const matchResult = await this.semanticLLMMatch(quiz, context, semanticOptions);
        result = matchResult;
        semanticResults = matchResult.semanticResults;
        llmSelection = matchResult.llmSelection;
      } else if (useSemanticSearch) {
        const matchResult = await this.semanticDeterministicMatch(quiz, context, semanticOptions);
        result = matchResult;
        semanticResults = matchResult.semanticResults;
      } else {
        result = await this.deterministicMatch(quiz, context);
      }

    } catch (error) {
      console.warn(`⚠️ Hybrid matching failed [${sessionId}], falling back to deterministic:`, error);
      result = await this.deterministicFallback(quiz, context, {
        fallbackUsed: true,
        errorEncountered: true
      });
    }

    // Log analytics
    const analytics = this.analytics.buildAnalytics(
      sessionId,
      quiz,
      semanticResults,
      llmSelection,
      result,
      result.performanceMetrics
    );
    this.analytics.logMatching(analytics);

    // Cache the result (fire and forget)
    this.cacheResult(quiz, result).catch(error =>
      console.warn('⚠️ Failed to cache result:', error)
    );

    return result;
  }

  /**
   * Semantic search + LLM selection (full hybrid)
   */
  private async semanticLLMMatch(
    quiz: QuizResponse,
    context: any,
    semanticOptions: any
  ): Promise<HybridMatchResult> {
    const totalStartTime = Date.now();

    // Step 1: Semantic search
    console.log('🔍 Performing semantic search...');
    const semanticStartTime = Date.now();
    const semanticResults = await this.semanticService.searchSemantic(quiz, semanticOptions);
    const semanticSearchMs = Date.now() - semanticStartTime;

    console.log('📊 Semantic search results:', {
      students: semanticResults.students.length,
      faculty: semanticResults.faculty.length,
      alumni: semanticResults.alumni.length,
      processingMs: semanticSearchMs
    });

    // Step 2: LLM selection
    console.log('🧠 Performing LLM selection...');
    const llmStartTime = Date.now();
    const llmSelection = await this.llmEngine.selectOptimalMatches(quiz, semanticResults);
    const llmSelectionMs = Date.now() - llmStartTime;

    console.log('🎯 LLM selections:', {
      student: llmSelection.selectedStudent,
      faculty: llmSelection.selectedFaculty,
      alumni: llmSelection.selectedAlumni,
      score: llmSelection.matchScore,
      processingMs: llmSelectionMs
    });

    // Step 3: Build final result
    const result = await this.buildHybridResult(quiz, semanticResults, llmSelection);
    const totalMs = Date.now() - totalStartTime;

    return {
      ...result,
      semanticResults,
      llmSelection,
      performanceMetrics: {
        semanticSearchMs,
        llmSelectionMs,
        totalMs
      },
      provider: 'hybrid:semantic+llm'
    };
  }

  /**
   * Semantic search + deterministic selection
   */
  private async semanticDeterministicMatch(
    quiz: QuizResponse,
    context: any,
    semanticOptions: any
  ): Promise<HybridMatchResult> {
    const startTime = Date.now();

    // Semantic search
    const semanticResults = await this.semanticService.searchSemantic(quiz, semanticOptions);

    // Build profile for deterministic scoring
    const profile = buildMatchingProfile({
      quiz,
      gradeLevel: quiz.gradeLevel || 'middle',
      traits: extractTraits(quiz),
      interests: expandInterests(quiz.interests || []),
      primaryInterests: quiz.interests || [],
      familyValues: quiz.familyValues || []
    });

    // If semantic search returned no results, fall back to full deterministic matching
    if (semanticResults.students.length === 0 && semanticResults.faculty.length === 0 && semanticResults.alumni.length === 0) {
      console.warn('🔍 Semantic search returned no candidates, falling back to full deterministic matching');
      const { selectMatchesWithMetadata, computeCompositeScore } = await import('./deterministic-matcher');
      const selection = selectMatchesWithMetadata(context, profile);
      const matchScore = computeCompositeScore(selection);

      return {
        matchScore,
        personalizedMessage: this.generateBasicMessage(quiz, selection.student, selection.faculty),
        matchedStories: [selection.student, selection.alumni].filter(Boolean) as StudentStory[],
        matchedFaculty: [selection.faculty].filter(Boolean) as FacultyProfile[],
        keyInsights: this.generateKeyInsights(quiz),
        recommendedPrograms: this.recommendPrograms(quiz),
        semanticResults,
        performanceMetrics: {
          semanticSearchMs: semanticResults.processingTimeMs,
          llmSelectionMs: 0,
          totalMs: Date.now() - startTime
        },
        provider: 'hybrid:semantic+deterministic:fallback' as const
      };
    }

    // Apply deterministic scoring to semantic candidates
    const { debugScoreStory, debugScoreFaculty } = await import('./deterministic-matcher');

    // Score and select best student from semantic candidates
    let bestStudent = null;
    let bestStudentScore = 0;
    for (const candidate of semanticResults.students) {
      const score = debugScoreStory(candidate.metadata, profile);
      if (score > bestStudentScore) {
        bestStudent = candidate.metadata;
        bestStudentScore = score;
      }
    }

    // Score and select best faculty from semantic candidates
    let bestFaculty = null;
    let bestFacultyScore = 0;
    for (const candidate of semanticResults.faculty) {
      const score = debugScoreFaculty(candidate.metadata, profile);
      if (score > bestFacultyScore) {
        bestFaculty = candidate.metadata;
        bestFacultyScore = score;
      }
    }

    // Score and select best alumni from semantic candidates
    let bestAlumni = null;
    let bestAlumniScore = 0;
    for (const candidate of semanticResults.alumni) {
      const score = debugScoreStory(candidate.metadata, profile);
      if (score > bestAlumniScore) {
        bestAlumni = candidate.metadata;
        bestAlumniScore = score;
      }
    }

    // Calculate composite score based on deterministic scores
    const base = 82;
    const studentBonus = bestStudent ? Math.min(bestStudentScore / 4, 10) : 0;
    const facultyBonus = bestFaculty ? Math.min(bestFacultyScore / 4, 10) : 0;
    const alumniBonus = bestAlumni ? Math.min(bestAlumniScore / 5, 6) : 0;
    const matchScore = Math.max(Math.round(Math.min(base + studentBonus + facultyBonus + alumniBonus, 96)), 78);

    const totalMs = Date.now() - startTime;

    return {
      matchScore,
      personalizedMessage: this.generateBasicMessage(quiz, bestStudent, bestFaculty),
      matchedStories: [bestStudent, bestAlumni].filter(Boolean) as StudentStory[],
      matchedFaculty: [bestFaculty].filter(Boolean) as FacultyProfile[],
      keyInsights: this.generateKeyInsights(quiz),
      recommendedPrograms: this.recommendPrograms(quiz),
      semanticResults,
      performanceMetrics: {
        semanticSearchMs: semanticResults.processingTimeMs,
        llmSelectionMs: 0,
        totalMs
      },
      provider: 'hybrid:semantic+deterministic' as const
    };
  }

  /**
   * Pure deterministic matching (fallback)
   */
  private async deterministicMatch(quiz: QuizResponse, context: any): Promise<HybridMatchResult> {
    // Use local implementation to avoid circular imports
    return this.localDeterministicMatch(quiz, context);
  }

  /**
   * Local deterministic matching implementation
   */
  private async localDeterministicMatch(quiz: QuizResponse, context: any): Promise<HybridMatchResult> {
    const userTraits = extractTraits(quiz);
    const userInterests = expandInterests(quiz?.interests || []);
    const userFamilyValues = quiz?.familyValues || [];

    const profile = buildMatchingProfile({
      quiz,
      gradeLevel: quiz?.gradeLevel || 'middle',
      traits: userTraits,
      interests: userInterests,
      primaryInterests: quiz?.interests || [],
      familyValues: userFamilyValues,
    });

    // Use the proper deterministic scoring logic
    const { selectMatchesWithMetadata, computeCompositeScore } = await import('./deterministic-matcher');
    const selection = selectMatchesWithMetadata(context, profile);
    const matchScore = computeCompositeScore(selection);

    return {
      matchScore,
      personalizedMessage: this.generateBasicMessage(quiz, selection.student, selection.faculty),
      matchedStories: [selection.student, selection.alumni].filter(Boolean) as StudentStory[],
      matchedFaculty: [selection.faculty].filter(Boolean) as FacultyProfile[],
      keyInsights: this.generateKeyInsights(quiz),
      recommendedPrograms: this.recommendPrograms(quiz),
      provider: 'hybrid:deterministic' as const
    };
  }

  /**
   * Build final result from semantic + LLM selection
   */
  private async buildHybridResult(
    quiz: QuizResponse,
    semanticResults: SemanticResults,
    llmSelection: LLMSelectionResult
  ): Promise<Omit<HybridMatchResult, 'semanticResults' | 'llmSelection' | 'performanceMetrics' | 'provider'>> {
    // Find selected items from semantic results
    const selectedStudent = semanticResults.students.find(s => s.id === llmSelection.selectedStudent)?.metadata;
    const selectedFaculty = semanticResults.faculty.find(f => f.id === llmSelection.selectedFaculty)?.metadata;
    const selectedAlumni = llmSelection.selectedAlumni
      ? semanticResults.alumni.find(a => a.id === llmSelection.selectedAlumni)?.metadata
      : null;

    return {
      matchScore: llmSelection.matchScore,
      personalizedMessage: llmSelection.personalizedMessage,
      matchedStories: [selectedStudent, selectedAlumni].filter(Boolean) as StudentStory[],
      matchedFaculty: [selectedFaculty].filter(Boolean) as FacultyProfile[],
      keyInsights: this.generateKeyInsights(quiz),
      recommendedPrograms: this.recommendPrograms(quiz),
      processingTime: llmSelection.processingTimeMs
    };
  }

  /**
   * Deterministic fallback with error context
   */
  private async deterministicFallback(
    quiz: QuizResponse,
    context: any,
    metadata: any = {}
  ): Promise<HybridMatchResult> {
    const fallbackResult = await this.deterministicMatch(quiz, context);
    return {
      ...fallbackResult,
      ...metadata,
      provider: 'deterministic:fallback'
    };
  }

  /**
   * Generate basic personalized message
   */
  private generateBasicMessage(quiz: QuizResponse, student: any, faculty: any): string {
    const childDesc = quiz.threeWords || quiz.childDescription || 'your child';
    const studentName = student?.firstName || 'our students';
    const facultyName = faculty ? `${faculty.formalTitle || 'Mr./Ms.'} ${faculty.lastName || faculty.firstName}` : 'our faculty';

    return `Based on "${childDesc}", we think ${studentName} and ${facultyName} would be wonderful connections for your family to explore at Saint Stephen's. We'd love to arrange a visit where you can meet them and see our campus firsthand.`;
  }

  /**
   * Generate key insights based on quiz
   */
  private generateKeyInsights(quiz: QuizResponse): string[] {
    const base = ['Academic Excellence', 'Character Development', 'Individual Attention'];
    const interests = quiz.interests || [];

    if (interests.some(i => ['arts', 'creativity', 'music', 'theater'].includes(i))) {
      base.push('Creative Expression');
    }
    if (interests.some(i => ['athletics', 'sports', 'competition'].includes(i))) {
      base.push('Athletic Development');
    }
    if (interests.some(i => ['science', 'technology', 'stem', 'engineering'].includes(i))) {
      base.push('STEM Innovation');
    }
    if (interests.some(i => ['community', 'service', 'leadership'].includes(i))) {
      base.push('Leadership & Service');
    }

    return base.slice(0, 4); // Limit to 4 insights
  }

  /**
   * Recommend programs based on quiz
   */
  private recommendPrograms(quiz: QuizResponse): string[] {
    const programs = new Set(['College Preparatory Program']);
    const interests = quiz.interests || [];
    const traits = extractTraits(quiz);

    if (interests.some(i => ['athletics', 'sports'].includes(i)) ||
        traits.some(t => ['athletic', 'competitive'].includes(t))) {
      programs.add('Athletics Program');
    }
    if (interests.some(i => ['arts', 'creativity', 'music', 'theater'].includes(i)) ||
        traits.some(t => ['creative', 'artistic'].includes(t))) {
      programs.add('Fine Arts Program');
    }
    if (interests.some(i => ['science', 'technology', 'stem'].includes(i)) ||
        traits.some(t => ['analytical', 'curious', 'smart'].includes(t))) {
      programs.add('STEAM Program');
    }
    if (interests.some(i => ['community', 'service', 'leadership'].includes(i)) ||
        traits.some(t => ['kind', 'helpful', 'leader'].includes(t))) {
      programs.add('Leadership & Service');
    }

    return Array.from(programs).slice(0, 3);
  }

  /**
   * Get service statistics for debugging
   */
  async getStats() {
    return {
      semantic: this.semanticService.getCacheStats(),
      timestamp: Date.now()
    };
  }
}

export { HybridMatchingService, type HybridMatchResult, type HybridMatchOptions };