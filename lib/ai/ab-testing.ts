import { QuizResponse } from './types';

interface ABTestConfig {
  enabled: boolean;
  hybridPercentage: number; // 0-100, percentage of requests to use hybrid system
  semanticThreshold: number;
  studentCandidates: number;
  facultyCandidates: number;
  alumniCandidates: number;
}

class ABTestingService {
  private static instance: ABTestingService;
  private config: ABTestConfig;

  private constructor() {
    this.config = {
      enabled: false, // Disable A/B testing - always use hybrid
      hybridPercentage: 100, // Force hybrid for testing Vercel AI Gateway
      semanticThreshold: 0.2,
      studentCandidates: 5,
      facultyCandidates: 4,
      alumniCandidates: 4
    };
  }

  static getInstance(): ABTestingService {
    if (!ABTestingService.instance) {
      ABTestingService.instance = new ABTestingService();
    }
    return ABTestingService.instance;
  }

  /**
   * Determine if request should use hybrid system
   */
  shouldUseHybrid(quiz: QuizResponse): boolean {
    if (!this.config.enabled) return true; // Always use hybrid when A/B testing is disabled

    // Use session-consistent hashing based on quiz content
    const hashInput = [
      quiz.threeWords || quiz.childDescription || '',
      (quiz.interests || []).join(','),
      quiz.gradeLevel || '',
      quiz.timeline || ''
    ].join('|');

    const hash = this.simpleHash(hashInput);
    const percentage = hash % 100;

    return percentage < this.config.hybridPercentage;
  }

  /**
   * Get semantic search configuration
   */
  getSemanticConfig() {
    return {
      studentsCount: this.config.studentCandidates,
      facultyCount: this.config.facultyCandidates,
      alumniCount: this.config.alumniCandidates,
      threshold: this.config.semanticThreshold
    };
  }


  /**
   * Update A/B test configuration
   */
  updateConfig(newConfig: Partial<ABTestConfig>) {
    this.config = { ...this.config, ...newConfig };
    console.log('📊 A/B test config updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): ABTestConfig {
    return { ...this.config };
  }

  /**
   * Simple hash function for consistent assignment
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get A/B test assignment info for debugging
   */
  getAssignmentInfo(quiz: QuizResponse) {
    const shouldUseHybrid = this.shouldUseHybrid(quiz);
    const hashInput = [
      quiz.threeWords || quiz.childDescription || '',
      (quiz.interests || []).join(','),
      quiz.gradeLevel || '',
      quiz.timeline || ''
    ].join('|');

    return {
      assignment: shouldUseHybrid ? 'hybrid' : 'legacy',
      hybridPercentage: this.config.hybridPercentage,
      hashInput: hashInput.substring(0, 50) + '...',
      hash: this.simpleHash(hashInput) % 100
    };
  }
}

export { ABTestingService, type ABTestConfig };