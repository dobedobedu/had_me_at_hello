import fs from 'fs';
import path from 'path';
import { QuizResponse } from './types';

interface NormalizedItem {
  id: string;
  category: 'student' | 'faculty' | 'alumni' | 'fact';
  textForEmbedding: string;
  metadata: any;
  hasVideo: boolean;
  gradeRelevance: string[];
}

interface EmbeddingCache {
  items: NormalizedItem[];
  vectors: number[][];
  model: string;
  timestamp: number;
  contentHash: string;
}

interface SemanticCandidate extends NormalizedItem {
  similarity: number;
  semanticScore: number;
}

interface SemanticResults {
  students: SemanticCandidate[];
  faculty: SemanticCandidate[];
  alumni: SemanticCandidate[];
  queryEmbedding: number[];
  processingTimeMs: number;
}

class SemanticSearchService {
  private static instance: SemanticSearchService;
  private cache: EmbeddingCache | null = null;
  private cacheLoadPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): SemanticSearchService {
    if (!SemanticSearchService.instance) {
      SemanticSearchService.instance = new SemanticSearchService();
    }
    return SemanticSearchService.instance;
  }

  async loadCache(): Promise<void> {
    if (this.cache) return; // Already loaded
    if (this.cacheLoadPromise) return this.cacheLoadPromise; // Loading in progress

    this.cacheLoadPromise = this.doLoadCache();
    return this.cacheLoadPromise;
  }

  private async doLoadCache(): Promise<void> {
    try {
      const cacheFile = path.join(process.cwd(), 'knowledge/.cache/embeddings.json');

      if (!fs.existsSync(cacheFile)) {
        throw new Error(`Embeddings cache not found at ${cacheFile}. Run 'npm run build:embeddings' first.`);
      }

      const cacheData = fs.readFileSync(cacheFile, 'utf8');
      this.cache = JSON.parse(cacheData);

      console.log(`📚 Loaded embeddings cache: ${this.cache!.items.length} items, model: ${this.cache!.model}`);
    } catch (error) {
      console.error('❌ Failed to load embeddings cache:', error);
      throw error;
    }
  }

  /**
   * Create weighted profile embedding text with 3x emphasis on child description
   */
  buildProfileEmbeddingText(quiz: QuizResponse): string {
    const threeWords = quiz.threeWords || quiz.childDescription || '';
    const interests = (quiz.interests || []).join(' ');
    const familyValues = (quiz.familyValues || []).join(' ');

    // Build weighted text with heavy emphasis on child description
    const profileParts = [
      `Child: ${threeWords}`,
      threeWords, // 2x additional weight
      threeWords, // 3x total weight
      `Interests: ${interests}`,
      `Values: ${familyValues}`,
      `Grade: ${quiz.gradeLevel}`
    ].filter(Boolean);

    return profileParts.join('. ');
  }

  /**
   * Generate embedding for user profile
   * For now, use the same mock method as the cache. In production, this would call the API.
   */
  async generateProfileEmbedding(profileText: string): Promise<number[]> {
    // TODO: Replace with actual API call to OpenRouter
    // For now, use the same deterministic method as our mock cache
    const crypto = await import('crypto');
    const hash = crypto.createHash('md5').update(profileText).digest('hex');
    const dimensions = 1536;
    const vector: number[] = [];

    for (let i = 0; i < dimensions; i++) {
      const charCode = hash.charCodeAt(i % hash.length);
      vector.push((charCode - 128) / 128);
    }

    return vector;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Perform semantic search and return categorized candidates
   */
  async searchSemantic(
    quiz: QuizResponse,
    options: {
      studentsCount?: number;
      facultyCount?: number;
      alumniCount?: number;
      threshold?: number;
    } = {}
  ): Promise<SemanticResults> {
    const startTime = Date.now();

    // Ensure cache is loaded
    await this.loadCache();
    if (!this.cache) throw new Error('Embeddings cache not loaded');

    const {
      studentsCount = 5,
      facultyCount = 4,
      alumniCount = 4,
      threshold = 0.2
    } = options;

    // 1. Build profile embedding
    const profileText = this.buildProfileEmbeddingText(quiz);
    const queryEmbedding = await this.generateProfileEmbedding(profileText);

    // 2. Calculate similarities for all items
    const similarities: SemanticCandidate[] = this.cache.items.map((item, index) => {
      const similarity = this.cosineSimilarity(queryEmbedding, this.cache!.vectors[index]);
      return {
        ...item,
        similarity,
        semanticScore: Math.round(similarity * 100) / 100 // Round to 2 decimals
      };
    });

    // 3. Filter by threshold and categorize
    const filteredSimilarities = similarities.filter(item => item.similarity > threshold);

    const students = filteredSimilarities
      .filter(item => item.category === 'student')
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, studentsCount);

    const faculty = filteredSimilarities
      .filter(item => item.category === 'faculty')
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, facultyCount);

    const alumni = filteredSimilarities
      .filter(item => item.category === 'alumni')
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, alumniCount);

    const processingTimeMs = Date.now() - startTime;

    return {
      students,
      faculty,
      alumni,
      queryEmbedding,
      processingTimeMs
    };
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats() {
    if (!this.cache) return null;

    return {
      totalItems: this.cache.items.length,
      model: this.cache.model,
      timestamp: this.cache.timestamp,
      contentHash: this.cache.contentHash,
      categories: {
        students: this.cache.items.filter(i => i.category === 'student').length,
        faculty: this.cache.items.filter(i => i.category === 'faculty').length,
        alumni: this.cache.items.filter(i => i.category === 'alumni').length,
      },
      withVideos: this.cache.items.filter(i => i.hasVideo).length
    };
  }

  /**
   * Force reload cache (useful for development)
   */
  async reloadCache(): Promise<void> {
    this.cache = null;
    this.cacheLoadPromise = null;
    await this.loadCache();
  }
}

export { SemanticSearchService, type SemanticResults, type SemanticCandidate };