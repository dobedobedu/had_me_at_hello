import { createClient } from 'redis';

class RedisService {
  private static instance: RedisService;
  private client: ReturnType<typeof createClient> | null = null;

  private constructor() {}

  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  async getClient() {
    if (!process.env.REDIS_URL) {
      console.log('🔧 Redis not configured, using local fallback');
      return null;
    }

    if (!this.client) {
      this.client = createClient({ url: process.env.REDIS_URL });

      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('🔗 Redis connected successfully');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis ready for operations');
      });
    }

    if (!this.client.isOpen) {
      await this.client.connect();
    }

    return this.client;
  }

  async disconnect() {
    if (this.client && this.client.isOpen) {
      await this.client.disconnect();
    }
  }

  // High-level cache operations
  async get(key: string): Promise<string | null> {
    const client = await this.getClient();
    if (!client) return null;

    try {
      return await client.get(key);
    } catch (error) {
      console.error('❌ Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    const client = await this.getClient();
    if (!client) return false;

    try {
      if (ttlSeconds) {
        await client.setEx(key, ttlSeconds, value);
      } else {
        await client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('❌ Redis SET error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    const client = await this.getClient();
    if (!client) return false;

    try {
      await client.del(key);
      return true;
    } catch (error) {
      console.error('❌ Redis DEL error:', error);
      return false;
    }
  }

  // JSON operations
  async getJson<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('❌ JSON parse error:', error);
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(value);
      return await this.set(key, jsonString, ttlSeconds);
    } catch (error) {
      console.error('❌ JSON stringify error:', error);
      return false;
    }
  }

  // Cache key generators
  static getMatchCacheKey(quizHash: string): string {
    return `match:${quizHash}`;
  }

  static getEmbeddingsCacheKey(): string {
    return 'embeddings:cache:v1';
  }

  static getSessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  static getProfileEmbeddingCacheKey(profileHash: string): string {
    return `profile_embedding:${profileHash}`;
  }
}

export default RedisService;