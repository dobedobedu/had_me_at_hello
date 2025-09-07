export interface TranscriptionResult {
  text: string;
  confidence?: number;
  provider: 'groq' | 'openai' | 'webSpeech';
  duration?: number;
}

export interface AnalysisResult {
  matchScore: number;
  personalizedMessage: string;
  matchedStories: StudentStory[];
  matchedFaculty: FacultyProfile[];
  matchedFacts?: SchoolFact[];
  keyInsights: string[];
  recommendedPrograms?: string[];
  provider?: 'lmstudio' | 'openai' | 'claude' | 'openrouter' | 'local' | 'client-fallback' | `hybrid:${string}`;
  processingTime?: number;
}

export interface StudentStory {
  id: string;
  firstName: string;
  lastName?: string;
  classYear?: string;
  currentRole?: string;
  photoUrl?: string;
  interests: string[];
  storyTldr: string;
  achievement: string;
  parentQuote?: string;
  quote?: string;
  gradeLevel?: string;
}

export interface FacultyProfile {
  id: string;
  firstName: string;
  lastName?: string;
  title: string;
  photoUrl?: string;
  videoUrl?: string;
  videoUrl2?: string;
  specializesIn: string[];
  whyStudentsLoveThem: string;
  department?: string;
  yearsAtSSES?: number;
  education?: string;
  awards?: string[];
  notableAlumni?: string[];
  achievements?: string[];
  isAdministrator?: boolean;
}

export interface SchoolFact {
  id: string;
  gradeLevel: string;
  fact: string;
  context: string;
  category?: string;
  videoUrl?: string;
  videoTitle?: string;
  priority?: string;
}

export interface QuizResponse {
  gradeLevel: 'lower' | 'intermediate' | 'middle' | 'upper' | 'prek-k' | 'elementary' | 'high';
  currentSituation: string;
  interests: string[];
  familyValues: string[];
  timeline: string;
  childDescription: string;
  selectedCharacteristics?: string[];
  additionalNotes?: string;
  voiceTranscript?: string;
}

export interface AIProvider {
  name: string;
  analyze(quiz: QuizResponse, context: RAGContext): Promise<AnalysisResult>;
  transcribe?(audio: Blob): Promise<TranscriptionResult>;
  isAvailable(): Promise<boolean>;
}

export interface RAGContext {
  stories: StudentStory[];
  faculty: FacultyProfile[];
  facts: SchoolFact[];
}

export interface ModelConfig {
  provider: 'lmstudio' | 'openai' | 'groq' | 'claude';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface PerformanceMetrics {
  provider: string;
  requestTime: number;
  tokenCount?: number;
  cost?: number;
  quality?: number;
  timestamp: Date;
}
