import { describe, it, expect } from '@jest/globals';
import { POST } from '../app/api/ai/analyze/route';

// Mock the environment variables
process.env.OPENROUTER_API_KEY = 'test-key';
process.env.OPENROUTER_MODEL = 'openai/gpt-4o-mini';

describe('API Integration Tests', () => {
  describe('/api/ai/analyze', () => {
    it('should prioritize child description in matching', async () => {
      const requestBody = {
        quiz: {
          gradeLevel: 'middle',
          childDescription: 'creative artistic imaginative',
          interests: ['athletics', 'sports'], // Different from child description
          familyValues: ['academic_rigor'] // Different from both
        }
      };

      const request = new Request('http://localhost:3000/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      // Should match Arts faculty based on child description, not athletics
      expect(data.matchedFaculty).toBeDefined();
      expect(data.matchedFaculty[0].firstName).toBe('Jeannine');
      expect(data.matchedFaculty[0].lastName).toBe('Elisha');

      // Should recommend Fine Arts Program based on child description
      expect(data.recommendedPrograms).toContain('Fine Arts Program');
      expect(data.recommendedPrograms).toContain('College Preparatory Program');
      expect(data.recommendedPrograms.length).toBeLessThanOrEqual(3);
    });

    it('should fallback to interests when child description is generic', async () => {
      const requestBody = {
        quiz: {
          gradeLevel: 'upper',
          childDescription: 'nice sweet wonderful',
          interests: ['science', 'technology', 'robotics'],
          familyValues: ['creative_expression']
        }
      };

      const request = new Request('http://localhost:3000/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      // Should match STEM faculty based on interests
      expect(data.matchedFaculty[0].firstName).toBe('Tyler');
      expect(data.matchedFaculty[0].lastName).toBe('Cotton');

      // Should recommend STEAM Program
      expect(data.recommendedPrograms).toContain('STEAM Program');
    });

    it('should handle empty quiz gracefully', async () => {
      const requestBody = {
        quiz: {
          gradeLevel: 'middle'
        }
      };

      const request = new Request('http://localhost:3000/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.matchedFaculty).toBeDefined();
      expect(data.recommendedPrograms).toBeDefined();
      expect(data.recommendedPrograms).toContain('College Preparatory Program');
      expect(data.matchScore).toBeGreaterThan(0);
    });

    it('should limit recommendations to 2-3 programs max', async () => {
      const requestBody = {
        quiz: {
          gradeLevel: 'upper',
          childDescription: 'creative athletic smart leader kind helpful',
          interests: ['arts', 'sports', 'science', 'music', 'drama', 'writing'],
          familyValues: ['stem_innovation', 'creative_expression', 'athletic_excellence', 'service_learning']
        }
      };

      const request = new Request('http://localhost:3000/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      // Despite many inputs, should limit to max 3 programs
      expect(data.recommendedPrograms.length).toBeLessThanOrEqual(3);
      expect(data.recommendedPrograms).toContain('College Preparatory Program');
      
      // Should focus on top trait (creative) for primary recommendation
      expect(data.recommendedPrograms).toContain('Fine Arts Program');
    });

    it('should return proper response structure', async () => {
      const requestBody = {
        quiz: {
          gradeLevel: 'middle',
          childDescription: 'curious analytical',
          interests: ['science'],
          familyValues: ['academic_rigor']
        }
      };

      const request = new Request('http://localhost:3000/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      // Verify response structure
      expect(data).toHaveProperty('matchScore');
      expect(data).toHaveProperty('personalizedMessage');
      expect(data).toHaveProperty('matchedStories');
      expect(data).toHaveProperty('matchedFaculty');
      expect(data).toHaveProperty('matchedFacts');
      expect(data).toHaveProperty('keyInsights');
      expect(data).toHaveProperty('recommendedPrograms');
      expect(data).toHaveProperty('provider');

      expect(Array.isArray(data.matchedStories)).toBe(true);
      expect(Array.isArray(data.matchedFaculty)).toBe(true);
      expect(Array.isArray(data.recommendedPrograms)).toBe(true);
      expect(Array.isArray(data.keyInsights)).toBe(true);
    });

    it('should handle missing quiz parameter', async () => {
      const requestBody = {};

      const request = new Request('http://localhost:3000/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing quiz');
    });
  });
});