import { QuizResponse, AnalysisResult } from './ai/types';
import RedisService from './redis';

export interface SessionData {
  id: string;
  quiz?: QuizResponse;
  results?: AnalysisResult;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

class SessionService {
  private static instance: SessionService;
  private redis: RedisService;
  private inMemoryStore: Map<string, SessionData>;

  private constructor() {
    this.redis = RedisService.getInstance();
    this.inMemoryStore = new Map();
  }

  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new session
   */
  async createSession(sessionId?: string): Promise<SessionData> {
    const id = sessionId || this.generateSessionId();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

    const sessionData: SessionData = {
      id,
      createdAt: now,
      updatedAt: now,
      expiresAt
    };

    await this.saveSession(sessionData);
    return sessionData;
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      // Try Redis first
      const cacheKey = RedisService.getSessionKey(sessionId);
      const redisData = await this.redis.getJson<SessionData>(cacheKey);

      if (redisData) {
        // Check if expired
        if (new Date() > new Date(redisData.expiresAt)) {
          await this.deleteSession(sessionId);
          return null;
        }
        return redisData;
      }

      // Fallback to in-memory
      const memoryData = this.inMemoryStore.get(sessionId);
      if (memoryData) {
        // Check if expired
        if (new Date() > new Date(memoryData.expiresAt)) {
          this.inMemoryStore.delete(sessionId);
          return null;
        }
        return memoryData;
      }

      return null;
    } catch (error) {
      console.warn('⚠️ Session get error:', error);
      return null;
    }
  }

  /**
   * Save session data
   */
  async saveSession(sessionData: SessionData): Promise<boolean> {
    sessionData.updatedAt = new Date().toISOString();

    try {
      // Try Redis first
      const cacheKey = RedisService.getSessionKey(sessionData.id);
      const ttlSeconds = Math.floor((new Date(sessionData.expiresAt).getTime() - Date.now()) / 1000);

      if (ttlSeconds > 0) {
        const success = await this.redis.setJson(cacheKey, sessionData, ttlSeconds);
        if (success) {
          return true;
        }
      }

      // Fallback to in-memory
      this.inMemoryStore.set(sessionData.id, sessionData);
      return true;
    } catch (error) {
      console.warn('⚠️ Session save error:', error);

      // Always fallback to in-memory
      this.inMemoryStore.set(sessionData.id, sessionData);
      return true;
    }
  }

  /**
   * Update session with quiz data
   */
  async updateSessionQuiz(sessionId: string, quiz: QuizResponse): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      // Create new session with quiz
      const newSession = await this.createSession(sessionId);
      newSession.quiz = quiz;
      return await this.saveSession(newSession);
    }

    session.quiz = quiz;
    return await this.saveSession(session);
  }

  /**
   * Update session with results
   */
  async updateSessionResults(sessionId: string, results: AnalysisResult): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    session.results = results;
    return await this.saveSession(session);
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const cacheKey = RedisService.getSessionKey(sessionId);
      await this.redis.del(cacheKey);
      this.inMemoryStore.delete(sessionId);
      return true;
    } catch (error) {
      console.warn('⚠️ Session delete error:', error);
      this.inMemoryStore.delete(sessionId);
      return true;
    }
  }

  /**
   * Extend session expiry
   */
  async extendSession(sessionId: string, additionalMinutes: number = 30): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    const newExpiryTime = new Date(Date.now() + additionalMinutes * 60 * 1000).toISOString();
    session.expiresAt = newExpiryTime;

    return await this.saveSession(session);
  }
}

export default SessionService;