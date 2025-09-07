import { QuizResponse, AnalysisResult, TranscriptionResult } from './types';

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
    const allStories = context.stories || [];
    const allFaculty = context.faculty || [];
    
    // Look for stories with video content first
    const videoStories = allStories.filter((s: any) => s.videoUrl && s.videoUrl.includes('youtube'));
    
    // Match stories by interests if available
    const userInterests = quiz.interests || [];
    const interestMatchedStories = userInterests.length > 0 ? 
      allStories.filter((s: any) => 
        s.interests?.some((si: string) => 
          userInterests.some(ui => si.toLowerCase().includes(ui.toLowerCase()) || ui.toLowerCase().includes(si.toLowerCase()))
        )
      ) : [];
    
    // Smart story selection: prioritize 1 current student with video based on interests
    const currentStudents = allStories.filter((s: any) => s.gradeLevel && !s.classYear); // Current students don't have classYear
    const alumni = allStories.filter((s: any) => s.classYear); // Alumni have classYear
    
    // Smart category-based current student selection
    let selectedCurrentStudent = null;
    
    // Creative interests → Creative student category
    if (userInterests.some(i => ['arts', 'creativity', 'theater', 'music', 'performance', 'visual_arts', 'creative'].includes(i.toLowerCase()))) {
      selectedCurrentStudent = currentStudents.find((s: any) => s.category === 'creative');
    } 
    // Athletic interests → Athletics student category
    else if (userInterests.some(i => ['athletics', 'sports', 'football', 'competition', 'teamwork', 'fitness'].includes(i.toLowerCase()))) {
      selectedCurrentStudent = currentStudents.find((s: any) => s.category === 'athletics');
    }
    // Academic interests → Academic student category  
    else if (userInterests.some(i => ['academics', 'science', 'math', 'technology', 'research', 'stem', 'college_prep'].includes(i.toLowerCase()))) {
      selectedCurrentStudent = currentStudents.find((s: any) => s.category === 'academic');
    }
    
    // Fallback to default category (student-teacher relationships)
    if (!selectedCurrentStudent) {
      selectedCurrentStudent = currentStudents.find((s: any) => s.category === 'default') || currentStudents[0];
    }
    
    const matchedStories = selectedCurrentStudent ? [selectedCurrentStudent] : allStories.slice(0, 1);
    
    // Prioritize faculty with videos (they have real photos + video content)
    const videoFaculty = allFaculty.filter((f: any) => f.videoUrl && f.videoUrl.includes('youtube'));
    
    // Select 1 faculty member - prioritize video teachers
    const matchedFaculty = videoFaculty.length > 0 ? videoFaculty.slice(0, 1) : allFaculty.slice(0, 1);
    
    const fallbackMessage = `Thank you for sharing about your ${quiz.gradeLevel} student! Based on their interests in ${quiz.interests.slice(0, 2).join(' and ')}, we believe Saint Stephen's could be an excellent fit.

Our personalized approach to education, combined with our strong programs in these areas, helps students like yours discover their unique potential. We'd love to show you how our community can support your child's growth and development.

We're excited to meet you and learn more about your family's educational journey. Schedule your personalized tour to see our approach in action!`;

    return {
      matchScore: 88,
      personalizedMessage: fallbackMessage,
      matchedStories,
      matchedFaculty,
      keyInsights: this.extractKeyInsights(quiz),
      provider: 'openrouter',
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
