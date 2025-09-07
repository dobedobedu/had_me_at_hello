import { OpenRouterClient } from '../lib/ai/openrouter-client';
import { QuizResponse, RAGContext } from '../lib/ai/types';
import storiesData from '../knowledge/current-student-stories.json';
import facultyData from '../knowledge/faculty-story.json';
import factsData from '../knowledge/facts.json';

describe('RAG Accuracy Tests', () => {
  const client = new OpenRouterClient();
  const context: RAGContext = {
    stories: storiesData.stories as any[],
    faculty: facultyData.faculty as any[],
    facts: factsData.facts as any[]
  };

  describe('Story Matching Tests', () => {
    test('should match athletic students with sports-focused stories', async () => {
      const quiz: QuizResponse = {
        gradeLevel: 'high',
        currentSituation: 'seeking_change',
        interests: ['athletics', 'leadership'],
        familyValues: ['academic_excellence', 'character_building'],
        timeline: 'next_fall',
        childDescription: 'My daughter is a competitive tennis player who also loves team sports'
      };

      const result = await client.analyze(quiz, context);
      
      // Check that matched stories include athletes
      expect(result.matchedStories.length).toBeGreaterThan(0);
      const firstStory = result.matchedStories[0];
      
      // Should match stories with athletic interests
      expect(firstStory.interests.some(i => 
        i.toLowerCase().includes('sport') || 
        i.toLowerCase().includes('tennis') ||
        i.toLowerCase().includes('athletic')
      )).toBe(true);
    });

    test('should match STEM interests with appropriate stories', async () => {
      const quiz: QuizResponse = {
        gradeLevel: 'middle',
        currentSituation: 'exploring_options',
        interests: ['science', 'technology', 'building'],
        familyValues: ['innovation', 'academic_excellence'],
        timeline: 'this_year',
        childDescription: 'Loves robotics and coding, always building things'
      };

      const result = await client.analyze(quiz, context);
      
      const matchedInterests = result.matchedStories[0]?.interests || [];
      expect(matchedInterests.some(i => 
        i.toLowerCase().includes('stem') || 
        i.toLowerCase().includes('science') ||
        i.toLowerCase().includes('tech') ||
        i.toLowerCase().includes('robotics')
      )).toBe(true);
    });

    test('should prioritize grade level matches', async () => {
      const quiz: QuizResponse = {
        gradeLevel: 'lower',
        currentSituation: 'new_to_area',
        interests: ['arts', 'music', 'friends'],
        familyValues: ['safe_environment', 'small_classes'],
        timeline: 'this_year',
        childDescription: 'Creative kindergartener who loves to paint and sing'
      };

      const result = await client.analyze(quiz, context);
      
      // Should match lower school stories
      if (result.matchedStories[0]?.gradeLevel) {
        expect(['lower', 'elementary'].includes(result.matchedStories[0].gradeLevel)).toBe(true);
      }
    });
  });

  describe('Faculty Matching Tests', () => {
    test('should match faculty based on specialization overlap', async () => {
      const quiz: QuizResponse = {
        gradeLevel: 'high',
        currentSituation: 'seeking_change',
        interests: ['arts', 'music', 'drama'],
        familyValues: ['character_building', 'global_perspective'],
        timeline: 'next_fall',
        childDescription: 'Passionate about visual arts and theater'
      };

      const result = await client.analyze(quiz, context);
      
      expect(result.matchedFaculty.length).toBeGreaterThan(0);
      const faculty = result.matchedFaculty[0];
      
      // Should match faculty who specialize in arts
      expect(faculty.specializesIn.some(s => 
        s.toLowerCase().includes('art') || 
        s.toLowerCase().includes('music') ||
        s.toLowerCase().includes('drama') ||
        s.toLowerCase().includes('theater')
      )).toBe(true);
    });

    test('should match mentorship-focused faculty for small class values', async () => {
      const quiz: QuizResponse = {
        gradeLevel: 'intermediate',
        currentSituation: 'planning_ahead',
        interests: ['reading', 'writing', 'languages'],
        familyValues: ['small_classes', 'character_building'],
        timeline: 'within_2_years',
        childDescription: 'Needs individual attention and mentorship'
      };

      const result = await client.analyze(quiz, context);
      
      // Faculty match should exist for mentorship values
      expect(result.matchedFaculty.length).toBeGreaterThan(0);
    });
  });

  describe('Match Score Tests', () => {
    test('should calculate higher scores for better matches', async () => {
      // Perfect match scenario
      const perfectMatch: QuizResponse = {
        gradeLevel: 'high',
        currentSituation: 'seeking_change',
        interests: ['stem', 'athletics', 'service'],
        familyValues: ['academic_excellence', 'character_building', 'global_perspective'],
        timeline: 'this_year',
        childDescription: 'Scholar athlete interested in marine science and tennis'
      };

      // Poor match scenario
      const poorMatch: QuizResponse = {
        gradeLevel: 'high',
        currentSituation: 'just_exploring',
        interests: ['business'],
        familyValues: ['safe_environment'],
        timeline: 'just_exploring',
        childDescription: 'Not sure what they want'
      };

      const perfectResult = await client.analyze(perfectMatch, context);
      const poorResult = await client.analyze(poorMatch, context);

      // Perfect match should have higher score
      expect(perfectResult.matchScore).toBeGreaterThan(poorResult.matchScore);
      
      // Both should be in reasonable range (70-95)
      expect(perfectResult.matchScore).toBeGreaterThanOrEqual(70);
      expect(perfectResult.matchScore).toBeLessThanOrEqual(95);
      expect(poorResult.matchScore).toBeGreaterThanOrEqual(70);
      expect(poorResult.matchScore).toBeLessThanOrEqual(95);
    });
  });

  describe('Description Keyword Matching Tests', () => {
    test('should boost scores for description keyword matches', async () => {
      const quiz: QuizResponse = {
        gradeLevel: 'middle',
        currentSituation: 'seeking_change',
        interests: ['science', 'nature'],
        familyValues: ['innovation'],
        timeline: 'next_fall',
        childDescription: 'Loves marine biology and ocean conservation'
      };

      const result = await client.analyze(quiz, context);
      
      // Should prioritize stories mentioning marine/ocean/conservation
      const stories = result.matchedStories;
      expect(stories.length).toBeGreaterThan(0);
      
      // At least one story should relate to marine science
      const hasMarineRelated = stories.some(s => 
        s.storyTldr.toLowerCase().includes('marine') ||
        s.storyTldr.toLowerCase().includes('ocean') ||
        s.interests.some(i => i.toLowerCase().includes('marine'))
      );
      
      expect(hasMarineRelated).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle minimal quiz data gracefully', async () => {
      const minimalQuiz: QuizResponse = {
        gradeLevel: 'middle',
        currentSituation: 'exploring_options',
        interests: [],
        familyValues: [],
        timeline: 'just_exploring',
        childDescription: ''
      };

      const result = await client.analyze(minimalQuiz, context);
      
      // Should still return valid results
      expect(result.matchScore).toBeGreaterThan(0);
      expect(result.matchedStories.length).toBeGreaterThan(0);
      expect(result.personalizedMessage).toBeTruthy();
    });

    test('should handle non-matching interests gracefully', async () => {
      const quiz: QuizResponse = {
        gradeLevel: 'high',
        currentSituation: 'new_to_area',
        interests: ['underwater_basketweaving', 'time_travel', 'unicorn_training'],
        familyValues: ['teleportation', 'mind_reading'],
        timeline: 'next_fall',
        childDescription: 'Interested in impossible things'
      };

      const result = await client.analyze(quiz, context);
      
      // Should still provide matches based on grade level
      expect(result.matchedStories.length).toBeGreaterThan(0);
      expect(result.matchScore).toBeGreaterThanOrEqual(70);
    });
  });

  describe('RAG System Validation', () => {
    test('should not use embeddings or vector search', () => {
      // Verify we're using direct JSON matching, not embeddings
      const clientCode = client.constructor.toString();
      expect(clientCode).not.toContain('embedding');
      expect(clientCode).not.toContain('vector');
      expect(clientCode).not.toContain('cosine');
    });

    test('should prioritize exact matches over semantic similarity', async () => {
      const quiz: QuizResponse = {
        gradeLevel: 'high',
        currentSituation: 'seeking_change',
        interests: ['tennis'], // Exact match
        familyValues: ['academic_excellence'],
        timeline: 'this_year',
        childDescription: 'Competitive tennis player'
      };

      const result = await client.analyze(quiz, context);
      
      // Should match stories with exact "tennis" interest
      const hasExactTennisMatch = result.matchedStories.some(s =>
        s.interests.some(i => i.toLowerCase() === 'tennis')
      );
      
      expect(hasExactTennisMatch).toBe(true);
    });
  });
});

// Integration test to verify full RAG pipeline
describe('Full RAG Pipeline Integration', () => {
  test('should complete full analysis pipeline', async () => {
    const client = new OpenRouterClient();
    const quiz: QuizResponse = {
      gradeLevel: 'high',
      currentSituation: 'seeking_change',
      interests: ['stem', 'arts', 'athletics'],
      familyValues: ['academic_excellence', 'small_classes', 'character_building'],
      timeline: 'next_fall',
      childDescription: 'Well-rounded student who excels in math and plays violin'
    };

    const startTime = Date.now();
    const result = await client.analyze(quiz, context);
    const endTime = Date.now();

    // Verify all expected fields are present
    expect(result).toHaveProperty('matchScore');
    expect(result).toHaveProperty('personalizedMessage');
    expect(result).toHaveProperty('matchedStories');
    expect(result).toHaveProperty('matchedFaculty');
    expect(result).toHaveProperty('keyInsights');
    expect(result).toHaveProperty('provider');
    expect(result).toHaveProperty('processingTime');

    // Performance check - should be reasonably fast since no embeddings
    expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max

    // Content quality checks
    expect(result.matchedStories.length).toBeLessThanOrEqual(3);
    expect(result.matchedFaculty.length).toBeLessThanOrEqual(2);
    expect(result.personalizedMessage.length).toBeGreaterThan(100);
    expect(result.keyInsights.length).toBeGreaterThan(0);
  });
});