import * as fs from 'fs';
import * as path from 'path';
import { QuizResponse } from './types';
import { embed } from 'ai';
import RedisService from '../redis';

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
  private redis: RedisService;
  private profileEmbeddingCache: Map<string, number[]> = new Map(); // In-memory session cache

  private constructor() {
    this.redis = RedisService.getInstance();
  }

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
      // Try Redis first
      const cacheKey = RedisService.getEmbeddingsCacheKey();
      const redisCache = await this.redis.getJson<EmbeddingCache>(cacheKey);

      if (redisCache) {
        console.log(`📚 Loaded embeddings from Redis: ${redisCache.items.length} items, model: ${redisCache.model}`);
        this.cache = redisCache;
        return;
      }

      // Fallback to file system
      const cacheFile = path.join(process.cwd(), 'knowledge/.cache/embeddings.json');

      if (!fs.existsSync(cacheFile)) {
        throw new Error(`Embeddings cache not found at ${cacheFile}. Run 'npm run build:embeddings' first.`);
      }

      const cacheData = fs.readFileSync(cacheFile, 'utf8');
      this.cache = JSON.parse(cacheData);

      console.log(`📚 Loaded embeddings from file: ${this.cache!.items.length} items, model: ${this.cache!.model}`);

      // Cache to Redis for next time (fire and forget, 24 hours)
      this.redis.setJson(cacheKey, this.cache, 86400).catch(error =>
        console.warn('⚠️ Failed to cache embeddings to Redis:', error)
      );

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
   * Generate embedding for user profile with in-memory and Redis caching
   * Uses Vercel AI Gateway if available, falls back to direct OpenAI, then mock embeddings
   */
  async generateProfileEmbedding(profileText: string): Promise<number[]> {
    if (!this.cache) throw new Error('Embeddings cache not loaded');

    const profileHash = await this.generateTextHash(profileText);

    // Check in-memory cache first (fastest)
    if (this.profileEmbeddingCache.has(profileHash)) {
      console.log('⚡ Using in-memory cached profile embedding');
      return this.profileEmbeddingCache.get(profileHash)!;
    }

    // Check Redis cache (slower but persistent across instances)
    const cacheKey = RedisService.getProfileEmbeddingCacheKey(profileHash);
    try {
      const cachedEmbedding = await this.redis.getJson<number[]>(cacheKey);
      if (cachedEmbedding) {
        console.log('⚡ Using Redis cached profile embedding');
        // Cache in memory for next time
        this.profileEmbeddingCache.set(profileHash, cachedEmbedding);
        return cachedEmbedding;
      }
    } catch (error) {
      console.warn('⚠️ Failed to check profile embedding Redis cache:', error);
    }

    // Generate new embedding
    const startTime = Date.now();
    let embedding: number[];

    // Check if we should use real embeddings or mock embeddings based on cache model
    const isUsingMockEmbeddings = this.cache.model.includes('mock');

    if (isUsingMockEmbeddings) {
      console.log('🔧 Using mock embeddings for development (cache model: ' + this.cache.model + ')');
      embedding = await this.generateMockEmbedding(profileText);
    } else {
      // Try Vercel AI Gateway first
      const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY;
      if (AI_GATEWAY_API_KEY && AI_GATEWAY_API_KEY !== 'your_ai_gateway_api_key_here') {
        try {
          embedding = await this.generateVercelEmbedding(profileText, AI_GATEWAY_API_KEY);
        } catch (error) {
          console.warn('⚠️ Vercel AI Gateway failed, trying direct OpenAI:', error);
          const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
          if (OPENAI_API_KEY) {
            embedding = await this.generateOpenAIEmbedding(profileText, OPENAI_API_KEY);
          } else {
            console.warn('⚠️ No embedding API available, falling back to mock embeddings');
            embedding = await this.generateMockEmbedding(profileText);
          }
        }
      } else {
        // Fallback to direct OpenAI API
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        if (OPENAI_API_KEY) {
          embedding = await this.generateOpenAIEmbedding(profileText, OPENAI_API_KEY);
        } else {
          // Final fallback to mock embeddings
          console.warn('⚠️ No embedding API available, falling back to mock embeddings');
          embedding = await this.generateMockEmbedding(profileText);
        }
      }
    }

    const embeddingTime = Date.now() - startTime;
    console.log(`🧮 Generated profile embedding in ${embeddingTime}ms`);

    // Cache in memory immediately (fast)
    this.profileEmbeddingCache.set(profileHash, embedding);

    // Cache to Redis fire-and-forget (don't block the request)
    void this.redis.setJson(cacheKey, embedding, 3600).catch(error =>
      console.warn('⚠️ Failed to cache profile embedding to Redis (fire-and-forget):', error)
    );

    return embedding;
  }

  /**
   * Generate embedding using Vercel AI SDK
   */
  private async generateVercelEmbedding(profileText: string, apiKey: string): Promise<number[]> {
    const embeddingModel = process.env.EMBEDDING_MODEL || 'openai/text-embedding-3-small';

    try {
      const result = await embed({
        model: embeddingModel,
        value: profileText,
      });

      return result.embedding;
    } catch (error) {
      console.error('Failed to generate Vercel AI SDK embedding:', error);
      throw error; // Re-throw to allow fallback
    }
  }

  /**
   * Generate embedding using OpenAI API
   */
  private async generateOpenAIEmbedding(profileText: string, apiKey: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: profileText
        })
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error('OpenAI API error:', {
          status: response.status,
          statusText: response.statusText,
          response: responseText.substring(0, 500)
        });
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      try {
        const data = JSON.parse(responseText);
        return data.data[0].embedding;
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', {
          parseError,
          responseText: responseText.substring(0, 500)
        });
        throw new Error('Invalid JSON response from OpenAI API');
      }
    } catch (error) {
      console.error('Failed to generate OpenAI embedding:', error);
      throw new Error('Could not generate OpenAI embedding for profile');
    }
  }

  /**
   * Generate hash for profile text
   */
  private async generateTextHash(text: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
  }

  /**
   * Generate deterministic mock embedding using the same method as build-embeddings.ts
   */
  private async generateMockEmbedding(profileText: string): Promise<number[]> {
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

  /**
   * Clear in-memory profile embedding cache
   */
  clearProfileEmbeddingCache(): void {
    this.profileEmbeddingCache.clear();
    console.log('🧹 Cleared in-memory profile embedding cache');
  }

  /**
   * Get profile embedding cache stats
   */
  getProfileEmbeddingCacheStats() {
    return {
      inMemoryCacheSize: this.profileEmbeddingCache.size,
      profiles: Array.from(this.profileEmbeddingCache.keys()).map(key => key.substring(0, 8) + '...')
    };
  }
}

export { SemanticSearchService, type SemanticResults, type SemanticCandidate };