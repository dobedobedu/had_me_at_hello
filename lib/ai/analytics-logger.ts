import { QuizResponse } from './types';
import { SemanticResults } from './semantic-search';
import { LLMSelectionResult } from './llm-selection-engine';

interface MatchingAnalytics {
  sessionId: string;
  timestamp: number;

  // Input data
  quiz: {
    childDescription: string;
    interests: string[];
    gradeLevel: string;
    familyValues: string[];
    timeline: string;
  };

  // Semantic search results
  semanticResults?: {
    studentsFound: number;
    facultyFound: number;
    alumniFound: number;
    topSimilarities: {
      student?: number;
      faculty?: number;
      alumni?: number;
    };
    processingTimeMs: number;
  };

  // LLM selection details
  llmSelection?: {
    selectedStudentId: string;
    selectedFacultyId: string;
    selectedAlumniId?: string;
    reasoning: string;
    score: number;
    processingTimeMs: number;
  };

  // Performance metrics
  performance: {
    totalMs: number;
    semanticMs?: number;
    llmMs?: number;
    cacheLoadMs?: number;
  };

  // Final results
  results: {
    provider: string;
    matchScore: number;
    fallbackUsed?: boolean;
    errorEncountered?: boolean;
  };

  // Comparison data (for A/B testing)
  comparison?: {
    deterministicWouldSelect?: {
      studentId?: string;
      facultyId?: string;
    };
    semanticBypass?: {
      studentsSkipped: string[];
      facultySkipped: string[];
    };
  };
}

class AnalyticsLogger {
  private static instance: AnalyticsLogger;
  private logs: MatchingAnalytics[] = [];
  private sessionCounter = 0;

  private constructor() {}

  static getInstance(): AnalyticsLogger {
    if (!AnalyticsLogger.instance) {
      AnalyticsLogger.instance = new AnalyticsLogger();
    }
    return AnalyticsLogger.instance;
  }

  /**
   * Generate unique session ID
   */
  generateSessionId(): string {
    this.sessionCounter++;
    return `session_${Date.now()}_${this.sessionCounter}`;
  }

  /**
   * Log matching analytics
   */
  logMatching(analytics: MatchingAnalytics) {
    this.logs.push(analytics);

    // Keep only last 100 logs in memory
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }

    // Console logging for development
    this.consoleLogSummary(analytics);
  }

  /**
   * Console log summary for debugging
   */
  private consoleLogSummary(analytics: MatchingAnalytics) {
    console.log('\n📊 MATCHING ANALYTICS SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('👤 Profile:', {
      description: analytics.quiz.childDescription.substring(0, 50) + '...',
      interests: analytics.quiz.interests.join(', '),
      grade: analytics.quiz.gradeLevel,
      timeline: analytics.quiz.timeline
    });

    if (analytics.semanticResults) {
      console.log('🔍 Semantic Search:', {
        candidates: `${analytics.semanticResults.studentsFound}S/${analytics.semanticResults.facultyFound}F/${analytics.semanticResults.alumniFound}A`,
        topSimilarity: analytics.semanticResults.topSimilarities,
        timeMs: analytics.semanticResults.processingTimeMs
      });
    }

    if (analytics.llmSelection) {
      console.log('🧠 LLM Selection:', {
        selections: `${analytics.llmSelection.selectedStudentId}|${analytics.llmSelection.selectedFacultyId}|${analytics.llmSelection.selectedAlumniId || 'none'}`,
        score: analytics.llmSelection.score,
        timeMs: analytics.llmSelection.processingTimeMs
      });
      console.log('💭 Reasoning:', analytics.llmSelection.reasoning);
    }

    console.log('⚡ Performance:', {
      total: `${analytics.performance.totalMs}ms`,
      breakdown: `${analytics.performance.semanticMs || 0}ms semantic + ${analytics.performance.llmMs || 0}ms LLM`,
      provider: analytics.results.provider
    });

    if (analytics.comparison?.semanticBypass) {
      console.log('🔄 Semantic Bypass:', {
        studentsSkipped: analytics.comparison.semanticBypass.studentsSkipped.length,
        facultySkipped: analytics.comparison.semanticBypass.facultySkipped.length
      });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Build analytics from matching process
   */
  buildAnalytics(
    sessionId: string,
    quiz: QuizResponse,
    semanticResults: SemanticResults | undefined,
    llmSelection: LLMSelectionResult | undefined,
    finalResults: any,
    performanceMetrics: any
  ): MatchingAnalytics {
    const analytics: MatchingAnalytics = {
      sessionId,
      timestamp: Date.now(),

      quiz: {
        childDescription: quiz.threeWords || quiz.childDescription || '',
        interests: quiz.interests || [],
        gradeLevel: quiz.gradeLevel || '',
        familyValues: quiz.familyValues || [],
        timeline: quiz.timeline || ''
      },

      performance: {
        totalMs: performanceMetrics?.totalMs || 0,
        semanticMs: performanceMetrics?.semanticSearchMs,
        llmMs: performanceMetrics?.llmSelectionMs,
      },

      results: {
        provider: finalResults.provider || 'unknown',
        matchScore: finalResults.matchScore || 0,
        fallbackUsed: finalResults.fallbackUsed || false,
      }
    };

    // Add semantic results if available
    if (semanticResults) {
      analytics.semanticResults = {
        studentsFound: semanticResults.students.length,
        facultyFound: semanticResults.faculty.length,
        alumniFound: semanticResults.alumni.length,
        topSimilarities: {
          student: semanticResults.students[0]?.semanticScore,
          faculty: semanticResults.faculty[0]?.semanticScore,
          alumni: semanticResults.alumni[0]?.semanticScore,
        },
        processingTimeMs: semanticResults.processingTimeMs
      };
    }

    // Add LLM selection if available
    if (llmSelection) {
      analytics.llmSelection = {
        selectedStudentId: llmSelection.selectedStudent || '',
        selectedFacultyId: llmSelection.selectedFaculty || '',
        selectedAlumniId: llmSelection.selectedAlumni || undefined,
        reasoning: llmSelection.reasoning,
        score: llmSelection.matchScore,
        processingTimeMs: llmSelection.processingTimeMs
      };
    }

    // Add comparison data for A/B testing
    if (semanticResults && llmSelection) {
      const semanticBypass = this.calculateSemanticBypass(semanticResults, llmSelection);
      if (semanticBypass.studentsSkipped.length > 0 || semanticBypass.facultySkipped.length > 0) {
        analytics.comparison = { semanticBypass };
      }
    }

    return analytics;
  }

  /**
   * Calculate which semantic candidates were bypassed by LLM
   */
  private calculateSemanticBypass(semanticResults: SemanticResults, llmSelection: LLMSelectionResult) {
    const studentsSkipped = semanticResults.students
      .filter(s => s.id !== llmSelection.selectedStudent)
      .map(s => s.id);

    const facultySkipped = semanticResults.faculty
      .filter(f => f.id !== llmSelection.selectedFaculty)
      .map(f => f.id);

    return { studentsSkipped, facultySkipped };
  }

  /**
   * Get recent analytics for debugging
   */
  getRecentAnalytics(count = 10): MatchingAnalytics[] {
    return this.logs.slice(-count);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    if (this.logs.length === 0) return null;

    const recentLogs = this.logs.slice(-20);
    const semanticTimes = recentLogs.map(l => l.performance.semanticMs).filter(Boolean) as number[];
    const llmTimes = recentLogs.map(l => l.performance.llmMs).filter(Boolean) as number[];
    const totalTimes = recentLogs.map(l => l.performance.totalMs);

    return {
      totalRequests: this.logs.length,
      recentRequests: recentLogs.length,
      avgSemanticMs: semanticTimes.length > 0 ? Math.round(semanticTimes.reduce((a, b) => a + b, 0) / semanticTimes.length) : null,
      avgLlmMs: llmTimes.length > 0 ? Math.round(llmTimes.reduce((a, b) => a + b, 0) / llmTimes.length) : null,
      avgTotalMs: Math.round(totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length),
      providers: this.getProviderStats(recentLogs),
      fallbackRate: recentLogs.filter(l => l.results.fallbackUsed).length / recentLogs.length
    };
  }

  /**
   * Get provider statistics
   */
  private getProviderStats(logs: MatchingAnalytics[]) {
    const providers: Record<string, number> = {};
    logs.forEach(log => {
      providers[log.results.provider] = (providers[log.results.provider] || 0) + 1;
    });
    return providers;
  }

  /**
   * Export analytics as JSON (for analysis)
   */
  exportAnalytics() {
    return {
      exported: Date.now(),
      totalLogs: this.logs.length,
      logs: this.logs
    };
  }
}

export { AnalyticsLogger, type MatchingAnalytics };