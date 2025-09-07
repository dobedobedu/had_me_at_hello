import { QuizResponse, AnalysisResult, TranscriptionResult } from './types';

export class OpenRouterClient {
  private apiKey: string | null;
  private baseURL: string;
  private model: string;

  constructor() {
    // Try to get API key from localStorage first (for client-side)
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('aiSettings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          this.apiKey = settings.openrouterKey || process.env.OPENROUTER_API_KEY || null;
        } catch {
          this.apiKey = process.env.OPENROUTER_API_KEY || null;
        }
      } else {
        this.apiKey = process.env.OPENROUTER_API_KEY || null;
      }
    } else {
      // Server-side: use environment variable
      this.apiKey = process.env.OPENROUTER_API_KEY || null;
    }
    
    this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
    
    // Debug logging for production
    console.log('OpenRouter Client initialized:', {
      hasApiKey: !!this.apiKey,
      baseURL: this.baseURL,
      model: this.model,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'not set',
      source: typeof window !== 'undefined' ? 'client' : 'server'
    });
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      console.log('OpenRouter API key not configured');
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('OpenRouter availability check failed:', error);
      return false;
    }
  }

  async analyze(quiz: QuizResponse, context: any): Promise<AnalysisResult> {
    const start = Date.now();
    try {
      // If no key, fall back immediately
      if (!this.apiKey) {
        console.warn('⚠️ No OpenRouter API key configured; using fallback');
        const result = this.getFallbackAnalysis(quiz, context);
        return { ...result, provider: 'local', processingTime: Date.now() - start } as AnalysisResult;
      }

      const prompt = this.buildAnalysisPrompt(quiz, context);

      const sys = [
        'You are helping admissions match a prospective student to school content.',
        'Output STRICT JSON only, no prose before or after.',
        'If exact interest matches are missing, bridge the gap by:',
        '- Using broad categories: athletics, academics/STEM, creativity/arts, community/service.',
        '- Prioritizing items with YouTube video URLs (richer storytelling).',
        '- Respecting grade levels: lower (PK3–3), intermediate (4–6), middle (7–8), upper (9–12).',
        'Indices in arrays are 1-based indexes of the lists provided in the prompt.',
      ].join('\n');

      const useResponsesAPI = /gpt-5/i.test(this.model);
      const endpoint = useResponsesAPI ? 'responses' : 'chat/completions';
      const url = `${this.baseURL}/${endpoint}`;

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': (typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001')) as string,
        'Referer': (typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001')) as string,
        'X-Title': 'Had Me At Hello',
      };

      const messages = [
        { role: 'system', content: sys },
        { role: 'user', content: prompt }
      ];

      const body = useResponsesAPI
        ? {
            model: this.model,
            input: messages,
            temperature: 0.2,
            max_output_tokens: 800,
            response_format: { type: 'json_object' }
          }
        : {
            model: this.model,
            messages,
            temperature: 0.2,
            top_p: 1,
            max_tokens: 800,
            response_format: { type: 'json_object' }
          };

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        let errBody = '';
        try { errBody = await res.text(); } catch {}
        console.error('❌ OpenRouter request failed', { status: res.status, body: errBody.slice(0, 500) });
        // If model is unavailable, try a safe fallback model once
        if (res.status === 400 || res.status === 404) {
          const fallbackModel = 'openai/gpt-4o-mini';
          console.log('🔁 Retrying with fallback model:', fallbackModel);
          const res2 = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': (typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001')) as string,
              'Referer': (typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001')) as string,
              'X-Title': 'Had Me At Hello',
            },
            body: JSON.stringify({
              model: fallbackModel,
              messages: [
                { role: 'system', content: sys },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3,
            })
          });
          if (res2.ok) {
            const data2 = await res2.json();
            const content2 = data2?.choices?.[0]?.message?.content || '';
            const parsed2 = this.parseAnalysisResponse(content2, context);
            return { ...parsed2, provider: `openrouter:${fallbackModel}`, processingTime: Date.now() - start } as AnalysisResult;
          }
          console.error('❌ Fallback model request also failed', { status: res2.status, body: (await res2.text()).slice(0, 500) });
        }
        const result = this.getFallbackAnalysis(quiz, context);
        return { ...result, provider: 'local', processingTime: Date.now() - start } as AnalysisResult;
      }

      const data = await res.json();
      let content = '';
      if (useResponsesAPI) {
        const output = Array.isArray(data?.output) ? data.output[0] : undefined;
        const parts = Array.isArray(output?.content) ? output.content : [];
        const textPart = parts.find((p: any) => typeof p?.text === 'string' || p?.type?.includes('text'));
        content = (textPart?.text || textPart?.content || textPart?.value || '').toString();
      } else {
        content = data?.choices?.[0]?.message?.content || '';
      }
      const parsed = this.parseAnalysisResponse(content, context);
      return { ...parsed, provider: 'openrouter', processingTime: Date.now() - start } as AnalysisResult;

    } catch (err) {
      console.error('❌ OpenRouter analyze error:', err);
      const result = this.getFallbackAnalysis(quiz, context);
      return { ...result, provider: 'local', processingTime: Date.now() - start } as AnalysisResult;
    }
  }

  async transcribe(audioBlob: Blob): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    // OpenRouter doesn't support audio transcription directly
    // For now, throw an error suggesting alternative methods
    throw new Error('Audio transcription not supported with OpenRouter. Please use the browser\'s built-in speech recognition or switch to text input.');
  }

  private buildAnalysisPrompt(quiz: QuizResponse, context: any): string {
    try {
      console.log('🏗️ Building analysis prompt...');
      
      const { stories, faculty, facts } = context;
      
      // Validate arrays exist and have content
      if (!Array.isArray(stories) || stories.length === 0) {
        console.warn('⚠️ Stories array is empty or invalid:', stories?.length || 'undefined');
      }
      if (!Array.isArray(faculty) || faculty.length === 0) {
        console.warn('⚠️ Faculty array is empty or invalid:', faculty?.length || 'undefined');
      }
      if (!Array.isArray(facts) || facts.length === 0) {
        console.warn('⚠️ Facts array is empty or invalid:', facts?.length || 'undefined');
      }
      
      console.log('📊 Building prompt sections...');
      const studentSummary = this.buildStudentSummary(quiz);
      console.log('✅ Student summary built');
      
      const storiesSections = stories.map((story: any, idx: number) => {
        try {
          return this.buildStorySummary(story, idx + 1);
        } catch (err) {
          console.error(`❌ Error building story ${idx + 1}:`, err);
          return `${idx + 1}. [Story data error]`;
        }
      }).join('\n\n');
      console.log('✅ Stories sections built');
      
      const facultySections = faculty.map((f: any, idx: number) => {
        try {
          return this.buildFacultySummary(f, idx + 1);
        } catch (err) {
          console.error(`❌ Error building faculty ${idx + 1}:`, err);
          return `${idx + 1}. [Faculty data error]`;
        }
      }).join('\n\n');
      console.log('✅ Faculty sections built');
      
      const factsSections = facts.map((fact: any, idx: number) => {
        try {
          return this.buildFactSummary(fact, idx + 1);
        } catch (err) {
          console.error(`❌ Error building fact ${idx + 1}:`, err);
          return `${idx + 1}. [Fact data error]`;
        }
      }).join('\n\n');
      console.log('✅ Facts sections built');
    
      // Create rich text summaries for LLM matching
      const prompt = `
Match this prospective student with the most relevant stories, faculty, and content at Saint Stephen's Episcopal School.

STUDENT PROFILE TO MATCH:
${studentSummary}

AVAILABLE STUDENT STORIES & ALUMNI:
${storiesSections}

AVAILABLE FACULTY:
${facultySections}

KEY SCHOOL FACTS & HIGHLIGHTS:
${factsSections}

Please provide a JSON response with:
{
  "matchScore": number (75-95),
  "personalizedMessage": "encouraging message about why this is a great match",
  "matchedStoryIds": [array of 1-2 most relevant story indices],
  "matchedFacultyIds": [array of 1-2 most relevant faculty indices], 
  "matchedFactIds": [array of 1-3 most relevant fact indices],
  "keyInsights": [array of 3-4 key strengths/interests that connect],
  "recommendedPrograms": [array of 2-3 specific programs]
}

MATCHING INSTRUCTIONS:
- Prioritize stories/faculty with VIDEO CONTENT (marked with 🎥) as these provide rich examples
- Match interests semantically (e.g., "technology" matches "STEAM", "coding", "engineering")
- Consider grade level appropriateness
- Highlight unique connections and specific examples
- Be encouraging and specific in your matching rationale`;
      
      console.log('✅ Complete prompt built, final length:', prompt.length);
      return prompt;
      
    } catch (error) {
      console.error('❌ Error building prompt:', error);
      throw new Error('Failed to build analysis prompt');
    }
  }

  private buildStudentSummary(quiz: QuizResponse): string {
    // Handle edge cases with fallbacks
    const gradeLevel = this.normalizeGradeLevel(quiz.gradeLevel || 'middle');
    const interests = this.sanitizeArray(quiz.interests || []);
    const familyValues = this.sanitizeArray(quiz.familyValues || []);
    const characteristics = this.sanitizeArray(quiz.selectedCharacteristics || [])
      .map(id => this.formatCharacteristicForPrompt(id))
      .join(', ');
    
    // Clean and truncate description to prevent prompt injection
    const description = this.sanitizeText(quiz.childDescription || 'Parent seeking best educational fit');
    const notes = this.sanitizeText(quiz.additionalNotes || '');
    
    return `Grade Level: ${gradeLevel}
Student Description: ${description}
Key Interests: ${interests.length > 0 ? interests.join(', ') : 'Open to exploring all areas'} 
Learning Style: ${characteristics || 'Adaptable learner who thrives in supportive environments'}
Family Values: ${familyValues.length > 0 ? familyValues.join(', ') : 'Quality education and character development'}
Timeline: ${this.normalizeTimeline(quiz.timeline || 'exploring_options')}
Additional Context: ${notes || 'Family is exploring educational options and wants to learn more'}`;
  }

  private buildStorySummary(story: any, index: number): string {
    // Handle missing or malformed story data
    if (!story || !story.firstName) return `${index}. [Story data unavailable]`;
    
    const videoTag = this.hasValidVideo(story.videoUrl) ? '🎥 VIDEO AVAILABLE' : '';
    const name = `${story.firstName} ${story.lastName || ''}`.trim();
    const classYear = story.classYear ? `Class of ${story.classYear}` : 'Current Student';
    const interests = this.sanitizeArray(story.interests || []);
    
    return `${index}. ${name} (${classYear}) ${videoTag}
Achievement: ${this.sanitizeText(story.achievement || story.storyTldr || 'Outstanding student accomplishments')}
Current Role: ${this.sanitizeText(story.currentRole || 'Student pursuing their passions')}
Interests: ${interests.length > 0 ? interests.join(', ') : 'Diverse academic interests'}
Quote: "${this.sanitizeText(story.quote || story.studentQuote || story.parentQuote || 'Passionate about learning and growth')}"
Grade Level: ${story.gradeLevel || 'all'}`;
  }

  private buildFacultySummary(faculty: any, index: number): string {
    // Handle missing or malformed faculty data
    if (!faculty || !faculty.firstName) return `${index}. [Faculty data unavailable]`;
    
    const videoTag = this.hasValidVideo(faculty.videoUrl) ? '🎥 VIDEO AVAILABLE' : '';
    const name = `${faculty.firstName} ${faculty.lastName || ''}`.trim();
    const title = this.sanitizeText(faculty.title || 'Faculty Member');
    const specializations = this.sanitizeArray(faculty.specializesIn || []);
    const notableAlumni = this.sanitizeArray(faculty.notableAlumni || []);
    
    return `${index}. ${name} - ${title} ${videoTag}
Department: ${faculty.department || 'Academic Affairs'}
Specializes In: ${specializations.length > 0 ? specializations.join(', ') : 'General education and student development'}
Why Students Love Them: ${this.sanitizeText(faculty.whyStudentsLoveThem || 'Dedicated to student success and learning')}
Experience: ${faculty.yearsAtSSES ? `${faculty.yearsAtSSES} years at SSES` : 'Experienced educator with deep commitment to Saint Stephen\'s'}
${notableAlumni.length > 0 ? `Notable Alumni: ${notableAlumni.join(', ')}` : ''}`;
  }

  private buildFactSummary(fact: any, index: number): string {
    // Handle missing or malformed fact data
    if (!fact || !fact.fact) return `${index}. [Fact data unavailable]`;
    
    const videoTag = this.hasValidVideo(fact.videoUrl) ? '🎥 VIDEO CONTENT' : '';
    const priorityTag = fact.priority === 'high' ? '⭐ HIGH PRIORITY' : '';
    
    return `${index}. ${this.sanitizeText(fact.fact)} ${priorityTag} ${videoTag}
Context: ${this.sanitizeText(fact.context || 'Important information about Saint Stephen\'s')}
Category: ${fact.category || 'general'}
Applies to: ${fact.gradeLevel || 'all'} school level
${fact.videoTitle ? `Video: "${this.sanitizeText(fact.videoTitle)}"` : ''}`;
  }

  // Edge case handling utilities
  private sanitizeText(text: string, maxLength: number = 500): string {
    if (!text || typeof text !== 'string') return '';
    
    // Remove potential prompt injection attempts
    return text
      .replace(/[<>{}[\]]/g, '') // Remove potentially problematic characters
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
      .slice(0, maxLength) // Truncate if too long
      .trim();
  }

  private sanitizeArray(arr: any[]): string[] {
    if (!Array.isArray(arr)) return [];
    
    return arr
      .filter(item => item && typeof item === 'string')
      .map(item => this.sanitizeText(item, 100))
      .filter(item => item.length > 0)
      .slice(0, 10); // Limit array size
  }

  private hasValidVideo(videoUrl: string): boolean {
    if (!videoUrl || typeof videoUrl !== 'string') return false;
    
    // Check for valid YouTube URLs
    return videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  }

  private normalizeGradeLevel(gradeLevel: string): string {
    const gradeMap: Record<string, string> = {
      'prek-k': 'Lower School (Pre-K to K)',
      'elementary': 'Lower School (Grades 1-5)',
      'lower': 'Lower School (PK3–3)',
      'intermediate': 'Intermediate School (Grades 4-6)',
      'middle': 'Middle School (Grades 7-8)',
      'high': 'Upper School (Grades 9-12)',
      'upper': 'Upper School (Grades 9-12)'
    };

    return gradeMap[gradeLevel] || 'Middle School (Grades 6-8)';
  }

  private normalizeTimeline(timeline: string): string {
    const timelineMap: Record<string, string> = {
      'this_year': 'Starting this academic year',
      'next_fall': 'Planning for next fall enrollment',
      'within_2_years': 'Considering enrollment within 2 years',
      'just_exploring': 'Currently exploring educational options',
      'exploring_options': 'Currently exploring educational options'
    };
    
    return timelineMap[timeline] || 'Currently exploring educational options';
  }

  private formatCharacteristicForPrompt(id: string): string {
    const labels: Record<string, string> = {
      'curious': 'naturally curious',
      'focused': 'strong focus',
      'creative': 'creative thinker',
      'analytical': 'analytical mind',
      'outgoing': 'outgoing and social',
      'thoughtful': 'thoughtful and considerate',
      'leader': 'natural leader',
      'collaborator': 'team player',
      'arts': 'interested in arts & creativity',
      'sports': 'enjoys sports & movement',
      'stem': 'passionate about science & technology',
      'service': 'values helping others',
      'hands-on': 'hands-on learner',
      'visual': 'visual learner',
      'discussion': 'learns through discussion',
      'independent': 'independent learner'
    };
    return labels[id] || this.sanitizeText(id);
  }

  private parseAnalysisResponse(content: string, context: any): AnalysisResult {
    try {
      console.log('🔍 Parsing OpenRouter response, content length:', content?.length || 0);
      
      // Validate context
      const { stories, faculty, facts } = context || {};
      if (!Array.isArray(stories) || !Array.isArray(faculty) || !Array.isArray(facts)) {
        console.error('❌ Invalid context structure in parseAnalysisResponse');
        throw new Error('Invalid context data structure');
      }

      // Try to extract JSON from the response
      console.log('🔍 Looking for JSON in response...');
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ No JSON found in OpenRouter response:', content?.substring(0, 200));
        throw new Error('No JSON found in response');
      }

      console.log('🔍 Found JSON match, attempting to parse...');
      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed OpenRouter JSON response');
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('❌ Failed JSON content:', jsonMatch[0].substring(0, 500));
        throw new Error('Failed to parse OpenRouter JSON response');
      }

      // Safe ID mapping with bounds checking
      const matchedStories = this.safeMapIds(parsed.matchedStoryIds, stories).slice(0, 2);
      const matchedFaculty = this.safeMapIds(parsed.matchedFacultyIds, faculty).slice(0, 2);
      const matchedFacts = this.safeMapIds(parsed.matchedFactIds, facts).slice(0, 3);

      return {
        matchScore: this.validateScore(parsed.matchScore),
        personalizedMessage: this.sanitizeText(parsed.personalizedMessage) || 
          'We\'re excited to learn more about your child and show you what makes Saint Stephen\'s special!',
        matchedStories,
        matchedFaculty,
        matchedFacts,
        keyInsights: this.sanitizeArray(parsed.keyInsights || []).slice(0, 4) || 
          ['Academic Excellence', 'Character Development', 'Community Focus'],
        recommendedPrograms: this.sanitizeArray(parsed.recommendedPrograms || []).slice(0, 3) || 
          ['Liberal Arts', 'Athletics', 'Fine Arts']
      };
    } catch (error) {
      console.error('❌ Error parsing OpenRouter response:', error);
      console.error('❌ Error type:', error instanceof Error ? error.name : typeof error);
      console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
      console.log('📦 Falling back to built-in analysis...');
      return this.getFallbackAnalysis({} as QuizResponse, context);
    }
  }

  private safeMapIds(ids: any[], sourceArray: any[]): any[] {
    if (!Array.isArray(ids) || !Array.isArray(sourceArray)) return [];
    
    return ids
      .filter(id => typeof id === 'number' && id > 0 && id <= sourceArray.length)
      .map(id => sourceArray[id - 1])
      .filter(Boolean);
  }

  private validateScore(score: any): number {
    const numScore = typeof score === 'number' ? score : parseFloat(score);
    if (isNaN(numScore)) return 85;
    return Math.min(Math.max(numScore, 75), 95);
  }

  private getFallbackAnalysis(quiz: QuizResponse, context: any): AnalysisResult {
    try {
      console.log('📦 Starting fallback analysis with safe data handling');
      const { stories = [], faculty = [], facts = [] } = context || {};
      
      // Validate arrays
      if (!Array.isArray(stories) || !Array.isArray(faculty) || !Array.isArray(facts)) {
        throw new Error('Invalid context structure in fallback');
      }

      // Safe interest extraction and normalization
      const userInterests = this.sanitizeArray(quiz?.interests || [])
        .map(i => i.toLowerCase())
        .filter(i => i.length > 0);
      
      const userGrade = quiz?.gradeLevel || 'middle';
      
      // Score stories with safety checks
      const scoredStories = stories
        .filter(story => story && story.firstName) // Filter out invalid stories
        .map((story: any) => {
          let score = 5; // Base score for valid story
          const storyInterests = this.sanitizeArray(story.interests || [])
            .map(i => i.toLowerCase());
          
          // Interest matching with null safety
          const interestMatches = userInterests.filter(ui => 
            storyInterests.some(si => si.includes(ui) || ui.includes(si))
          ).length;
          score += interestMatches * 10;
          
          // Grade level matching
          if (story.gradeLevel === userGrade || story.gradeLevel === 'all') {
            score += 5;
          }
          
          // Boost for video content with validation
          if (this.hasValidVideo(story.videoUrl)) {
            score += 8; // Higher boost for video content
          }
          
          return { story, score };
        })
        .sort((a, b) => b.score - a.score);
      
      // Score faculty with safety checks
      const scoredFaculty = faculty
        .filter(f => f && f.firstName) // Filter out invalid faculty
        .map((f: any) => {
          let score = 3; // Base score for valid faculty
          const specializations = this.sanitizeArray(f.specializesIn || [])
            .map(s => s.toLowerCase());
          
          // Interest matching with specializations
          const interestMatches = userInterests.filter(ui =>
            specializations.some(spec => 
              spec.includes(ui) || ui.includes(spec) ||
              this.isSemanticMatch(ui, spec)
            )
          ).length;
          score += interestMatches * 12;
          
          // Major boost for video content - prioritize video teachers
          if (this.hasValidVideo(f.videoUrl)) {
            score += 25; // Much higher boost for video teachers (they have real photos + videos)
          }
          
          // Boost for administrators
          if (f.isAdministrator) {
            score += 3;
          }
          
          return { faculty: f, score };
        })
        .sort((a, b) => b.score - a.score);
      
      // Find high-priority facts with videos, with safety checks
      const highPriorityFacts = facts
        .filter(fact => fact && fact.fact && fact.priority === 'high')
        .sort((a, b) => this.hasValidVideo(b.videoUrl) ? 1 : -1); // Video facts first
      
      // Return 1 student + 1 faculty (goal: show one teacher and one current student)
      const finalStories = scoredStories.length > 0 ? 
        scoredStories.slice(0, 1).map(s => s.story) : 
        stories.slice(0, 1);
        
      const finalFaculty = scoredFaculty.length > 0 ? 
        scoredFaculty.slice(0, 1).map(f => f.faculty) : 
        faculty.slice(0, 1);
      
      return {
        matchScore: this.calculateFallbackScore(scoredStories, scoredFaculty),
        personalizedMessage: this.generatePersonalizedMessage(quiz, finalStories, finalFaculty),
        matchedStories: finalStories,
        matchedFaculty: finalFaculty,
        matchedFacts: highPriorityFacts.slice(0, 3),
        keyInsights: this.generateKeyInsights(userInterests),
        recommendedPrograms: this.generateRecommendedPrograms(userInterests)
      };
    } catch (error) {
      console.error('Error in fallback analysis:', error);
      
      // Ultimate fallback with minimal data
      return this.getMinimalFallback();
    }
  }

  private isSemanticMatch(interest: string, specialization: string): boolean {
    const semanticMappings: Record<string, string[]> = {
      'technology': ['steam', 'coding', 'engineering', 'computer', 'robotics'],
      'math': ['mathematics', 'steam', 'engineering', 'science'],
      'arts': ['visual', 'creative', 'music', 'theater', 'drama'],
      'science': ['biology', 'chemistry', 'physics', 'stem', 'research'],
      'sports': ['athletics', 'physical', 'fitness', 'competition'],
      'writing': ['english', 'literature', 'journalism', 'communication'],
      'business': ['economics', 'entrepreneurship', 'finance', 'leadership']
    };
    
    for (const [key, values] of Object.entries(semanticMappings)) {
      if ((interest.includes(key) || key.includes(interest)) &&
          values.some(v => specialization.includes(v) || v.includes(specialization))) {
        return true;
      }
    }
    
    return false;
  }

  private calculateFallbackScore(scoredStories: any[], scoredFaculty: any[]): number {
    const topStoryScore = scoredStories[0]?.score || 0;
    const topFacultyScore = scoredFaculty[0]?.score || 0;
    const baseScore = 78;
    const bonusScore = Math.min((topStoryScore + topFacultyScore) / 4, 12);
    // Nudge to avoid ties when inputs are weakly differentiated
    const tieBreaker = (topStoryScore > 0 ? 0.3 : 0) + (topFacultyScore > 0 ? 0.2 : 0);
    return Math.min(baseScore + bonusScore + tieBreaker, 93);
  }

  private generatePersonalizedMessage(quiz: QuizResponse, stories: any[], faculty: any[]): string {
    const interests = this.sanitizeArray(quiz?.interests || []);
    const gradeLevel = this.normalizeGradeLevel(quiz?.gradeLevel || 'middle');
    
    if (interests.length > 0) {
      return `Based on your interest in ${interests.slice(0, 2).join(' and ')}, we believe ${gradeLevel} at Saint Stephen's could be an excellent fit! Our personalized approach and dedicated faculty create the perfect environment for your child to thrive.`;
    }
    
    return "We're excited to learn more about your child and show you what makes Saint Stephen's Episcopal School special! Our community-focused approach to education creates an environment where every student can discover their passions and reach their potential.";
  }

  private generateKeyInsights(interests: string[]): string[] {
    const baseInsights = ['Academic Excellence', 'Character Development', 'Individual Attention'];
    
    if (interests.includes('arts') || interests.includes('creative')) {
      return [...baseInsights, 'Creative Expression'];
    }
    if (interests.includes('sports') || interests.includes('athletics')) {
      return [...baseInsights, 'Athletic Development'];
    }
    if (interests.includes('technology') || interests.includes('stem')) {
      return [...baseInsights, 'STEM Innovation'];
    }
    
    return [...baseInsights, 'Community Engagement'];
  }

  private generateRecommendedPrograms(interests: string[]): string[] {
    const programs = ['College Preparatory Program'];
    
    if (interests.some(i => ['arts', 'music', 'drama', 'creative'].includes(i))) {
      programs.push('Fine Arts Program');
    }
    if (interests.some(i => ['sports', 'athletics', 'competition'].includes(i))) {
      programs.push('Athletics Program');
    }
    if (interests.some(i => ['science', 'technology', 'stem', 'engineering'].includes(i))) {
      programs.push('STEAM Program');
    }
    if (interests.some(i => ['service', 'community', 'leadership'].includes(i))) {
      programs.push('Leadership & Service');
    }
    
    return programs.slice(0, 3).length > 1 ? programs.slice(0, 3) : 
      ['College Preparatory Program', 'Fine Arts', 'Athletics'];
  }

  private getMinimalFallback(): AnalysisResult {
    return {
      matchScore: 82,
      personalizedMessage: "Thank you for your interest in Saint Stephen's Episcopal School! We'd love to share more about our community-focused approach to education and how we help every student discover their unique potential.",
      matchedStories: [],
      matchedFaculty: [],
      matchedFacts: [],
      keyInsights: ['Academic Excellence', 'Character Development', 'Community Focus'],
      recommendedPrograms: ['College Preparatory Program', 'Fine Arts', 'Athletics']
    };
  }
}
