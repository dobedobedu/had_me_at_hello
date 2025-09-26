import { QuizResponse, AnalysisResult } from './types';
import { SemanticResults, SemanticCandidate } from './semantic-search';
import { generateText } from 'ai';

interface LLMSelectionResult {
  selectedStudent?: string;
  selectedFaculty?: string;
  selectedAlumni?: string | null;
  reasoning: string;
  matchScore: number;
  personalizedMessage: string;
  confidence?: number;
  processingTimeMs: number;
}

interface LLMSelectionEngine {
  selectOptimalMatches(
    quiz: QuizResponse,
    semanticResults: SemanticResults
  ): Promise<LLMSelectionResult>;
}

class GrokSelectionEngine implements LLMSelectionEngine {
  private aiGatewayKey: string;
  private model: string;

  constructor() {
    this.aiGatewayKey = process.env.AI_GATEWAY_API_KEY || '';
    this.model = process.env.CHAT_MODEL || 'xai/grok-4-fast-non-reasoning';

    if (!this.aiGatewayKey || this.aiGatewayKey === 'your_ai_gateway_api_key_here') {
      throw new Error('AI_GATEWAY_API_KEY is required for LLM selection');
    }

    console.log('🚀 Using Vercel AI Gateway for LLM selection');
  }

  /**
   * Build rich system prompt for admissions director role
   */
  private buildSystemPrompt(): string {
    return [
      'You are the experienced admissions director at Saint Stephen\'s Episcopal School with 20+ years of helping families find perfect educational fits.',
      '',
      'Your expertise includes:',
      '- Understanding child development and learning styles',
      '- Matching student personalities with faculty mentorship styles',
      '- Creating compelling admissions narratives that drive enrollment',
      '- Balancing authentic fit with strategic enrollment goals',
      '',
      'SELECTION CRITERIA (in order of importance):',
      '1. PERSONALITY FIT: How well does the child\'s description match the student story and faculty approach?',
      '2. DEVELOPMENTAL STAGE: Are the stories/faculty appropriate for the child\'s grade and maturity?',
      '3. NARRATIVE ARC: Do the selections create a compelling story of growth from current student → faculty mentorship → alumni outcomes?',
      '4. ENROLLMENT APPEAL: Will these selections convince this specific family to choose Saint Stephen\'s?',
      '',
      'CONSTRAINTS:',
      '- Must select exactly 1 current student (required)',
      '- Must select exactly 1 faculty member (required)',
      '- May select 1 alumni if there\'s a compelling match (optional)',
      '- STRONGLY PRIORITIZE VIDEO CONTENT: When fit quality is equal, always choose candidates with "Video: Available ✓"',
      '- Video testimonials create powerful emotional connections that drive enrollment decisions',
      '- Current student videos are most compelling - they show authentic peer experiences',
      '- Faculty videos demonstrate teaching style and personality beyond text descriptions',
      '- Consider family timeline and urgency',
      '',
      'OUTPUT FORMAT:',
      'Return valid JSON only, no additional text:',
      '{',
      '  "selectedStudent": "story_id",',
      '  "selectedFaculty": "faculty_id",',
      '  "selectedAlumni": "alumni_id_or_null",',
      '  "reasoning": "2-3 sentences explaining why these selections create the perfect admissions story for this specific child and family",',
      '  "matchScore": 85-100,',
      '  "personalizedMessage": "Warm, specific 2-4 sentence message for the visiting family that connects their child to these selections and invites engagement"',
      '}'
    ].join('\n');
  }

  /**
   * Build detailed user prompt with candidate information
   */
  private buildUserPrompt(quiz: QuizResponse, semanticResults: SemanticResults): string {
    const formatCandidate = (candidate: SemanticCandidate, index: number) => {
      const metadata = candidate.metadata;

      if (candidate.category === 'student') {
        return [
          `${index + 1}. ID: ${candidate.id}`,
          `   Name: ${metadata.firstName}`,
          `   Story: ${metadata.achievement}`,
          `   Interests: ${metadata.interests?.join(', ') || 'N/A'}`,
          `   Personality: ${metadata.personaDescriptors?.join(', ') || 'N/A'}`,
          `   Grade Focus: ${metadata.gradeBands?.join('/') || metadata.gradeLevel || 'All'}`,
          `   Video: ${candidate.hasVideo ? 'Available ✓' : 'None'}`,
          `   Similarity: ${candidate.semanticScore}`,
          `   Parent Quote: "${metadata.parentQuote || 'N/A'}"`,
          `   Student Quote: "${metadata.studentQuote || 'N/A'}"`
        ].join('\n');
      } else if (candidate.category === 'faculty') {
        return [
          `${index + 1}. ID: ${candidate.id}`,
          `   Name: ${metadata.formalTitle || 'Mr./Ms.'} ${metadata.lastName || metadata.firstName}`,
          `   Title: ${metadata.title}`,
          `   Department: ${metadata.department || 'N/A'}`,
          `   Specializes: ${metadata.specializesIn?.join(', ') || 'N/A'}`,
          `   Why Students Love: ${metadata.whyStudentsLoveThem}`,
          `   Grade Focus: ${metadata.gradeBands?.join('/') || 'All Levels'}`,
          `   Experience: ${metadata.yearsAtSSES ? metadata.yearsAtSSES + ' years' : 'N/A'}`,
          `   Video: ${candidate.hasVideo ? 'Available ✓' : 'None'}`,
          `   Similarity: ${candidate.semanticScore}`,
          `   Keywords: ${metadata.interestKeywords?.join(', ') || 'N/A'}`
        ].join('\n');
      } else { // alumni
        return [
          `${index + 1}. ID: ${candidate.id}`,
          `   Name: ${metadata.firstName} ${metadata.lastName || ''}`,
          `   Class: ${metadata.classYear || 'N/A'}`,
          `   Current Role: ${metadata.currentRole || 'N/A'}`,
          `   Achievement: ${metadata.achievement}`,
          `   Interests: ${metadata.interests?.join(', ') || 'N/A'}`,
          `   Video: ${candidate.hasVideo ? 'Available ✓' : 'None'}`,
          `   Similarity: ${candidate.semanticScore}`,
          `   Quote: "${metadata.quote || 'N/A'}"`
        ].join('\n');
      }
    };

    return [
      'FAMILY PROFILE:',
      `Child Description: "${quiz.threeWords || quiz.childDescription || 'Not provided'}" (PRIMARY MATCHING FACTOR)`,
      `Selected Interests: ${(quiz.interests || []).join(', ') || 'None specified'}`,
      `Grade Level: ${quiz.gradeLevel}`,
      `Family Values: ${(quiz.familyValues || []).join(', ') || 'None specified'}`,
      `Timeline: ${quiz.timeline}`,
      `Additional Context: ${quiz.additionalNotes || 'None'}`,
      '',
      'SEMANTIC SEARCH RESULTS:',
      `Query Processing: Found ${semanticResults.students.length + semanticResults.faculty.length + semanticResults.alumni.length} relevant candidates in ${semanticResults.processingTimeMs}ms`,
      '',
      'CURRENT STUDENT OPTIONS (choose exactly 1):',
      semanticResults.students.length > 0
        ? semanticResults.students.map(formatCandidate).join('\n\n')
        : 'No current student candidates found',
      '',
      'FACULTY OPTIONS (choose exactly 1):',
      semanticResults.faculty.length > 0
        ? semanticResults.faculty.map(formatCandidate).join('\n\n')
        : 'No faculty candidates found',
      '',
      'ALUMNI OPTIONS (choose 1 if compelling match, or none):',
      semanticResults.alumni.length > 0
        ? semanticResults.alumni.map(formatCandidate).join('\n\n')
        : 'No alumni candidates found',
      '',
      'TASK:',
      'As Saint Stephen\'s admissions director, analyze this family profile and select the optimal matches that will:',
      '1. Best match the child\'s personality and interests',
      '2. Create the most compelling admissions narrative',
      '3. Maximize enrollment likelihood for this specific family',
      '4. PRIORITIZE VIDEO CONTENT: Choose video-enabled candidates when personality/interest fit is comparable',
      '',
      'DECISION FRAMEWORK:',
      '• If multiple candidates fit equally well → CHOOSE THE ONE WITH VIDEO',
      '• Video testimonials show authentic student/faculty experiences',
      '• Parents connecting with video stories leads to campus visits and enrollment',
      '• Focus heavily on the child description - this is the most important factor',
      '',
      'Return your selections in the specified JSON format with reasoning that mentions video prioritization when applicable.'
    ].join('\n');
  }

  /**
   * Call LLM API for selection using Vercel AI SDK
   */
  private async callLLMAPI(systemPrompt: string, userPrompt: string): Promise<any> {
    try {
      // Add timeout wrapper for Grok calls
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Grok request timeout after 30s')), 30000);
      });

      const generatePromise = generateText({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        maxOutputTokens: 800,
      });

      const result = await Promise.race([generatePromise, timeoutPromise]) as any;

      if (!result.text) {
        throw new Error('No content received from Vercel AI Gateway');
      }

      return JSON.parse(result.text);
    } catch (error) {
      console.warn('⚠️ Vercel AI Gateway (Grok) failed, trying GPT-4o-mini via AI Gateway:', error);

      // Try GPT-4o-mini via AI Gateway as fallback
      return await this.callAIGatewayFallback(systemPrompt, userPrompt);
    }
  }

  /**
   * Call GPT-4o-mini via AI Gateway (fallback)
   */
  private async callAIGatewayFallback(systemPrompt: string, userPrompt: string): Promise<any> {
    console.log('🧠 Using GPT-4o-mini via AI Gateway fallback...');

    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      maxOutputTokens: 800,
    });

    if (!result.text) {
      throw new Error('No content received from GPT-4o-mini via AI Gateway');
    }

    // Clean up the response - remove markdown code blocks if present
    let cleanText = result.text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return JSON.parse(cleanText);
  }


  /**
   * Main selection method
   */
  async selectOptimalMatches(
    quiz: QuizResponse,
    semanticResults: SemanticResults
  ): Promise<LLMSelectionResult> {
    const startTime = Date.now();

    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(quiz, semanticResults);

      console.log('🧠 Calling LLM for AI-powered selection...');
      const llmResponse = await this.callLLMAPI(systemPrompt, userPrompt);

      // Validate LLM response
      if (!llmResponse.selectedStudent || !llmResponse.selectedFaculty) {
        throw new Error('LLM did not select required student and faculty');
      }

      // Verify selections exist in semantic results
      const selectedStudentExists = semanticResults.students.some(s => s.id === llmResponse.selectedStudent);
      const selectedFacultyExists = semanticResults.faculty.some(f => f.id === llmResponse.selectedFaculty);

      if (!selectedStudentExists) {
        throw new Error(`LLM selected invalid student ID: ${llmResponse.selectedStudent}`);
      }
      if (!selectedFacultyExists) {
        throw new Error(`LLM selected invalid faculty ID: ${llmResponse.selectedFaculty}`);
      }

      const processingTimeMs = Date.now() - startTime;

      return {
        selectedStudent: llmResponse.selectedStudent,
        selectedFaculty: llmResponse.selectedFaculty,
        selectedAlumni: llmResponse.selectedAlumni,
        reasoning: llmResponse.reasoning,
        matchScore: Math.max(85, Math.min(100, llmResponse.matchScore || 90)),
        personalizedMessage: llmResponse.personalizedMessage,
        processingTimeMs
      };

    } catch (error) {
      console.error('❌ LLM selection failed:', error);
      throw error;
    }
  }
}

/**
 * Factory function to create appropriate LLM engine
 */
export function createLLMSelectionEngine(): LLMSelectionEngine {
  return new GrokSelectionEngine();
}

export { GrokSelectionEngine, type LLMSelectionResult, type LLMSelectionEngine };