import { OpenRouterClient } from './utils/openrouter-client';
import { QuizResponse, RAGContext } from '../lib/ai/types';
import studentsData from '../knowledge/current-student-stories.json';
import alumniData from '../knowledge/alumni-story.json';
import facultyData from '../knowledge/faculty-story.json';
import factsData from '../knowledge/facts.json';

const context: RAGContext = {
  stories: ([...studentsData.stories, ...alumniData.stories] as any[]),
  faculty: (facultyData.faculty as any[]),
  facts: (factsData.facts as any[])
};

// 20 representative scenarios across grades and interests
const scenarios: QuizResponse[] = [
  { gradeLevel: 'upper', currentSituation: 'seeking_change', interests: ['athletics','leadership'], familyValues: ['character_building'], timeline: 'this_year', childDescription: 'competitive and team oriented' },
  { gradeLevel: 'upper', currentSituation: 'exploring_options', interests: ['stem','robotics','coding'], familyValues: ['innovation'], timeline: 'next_fall', childDescription: 'curious builder' },
  { gradeLevel: 'upper', currentSituation: 'exploring', interests: ['arts','music','drama'], familyValues: [], timeline: 'this_year', childDescription: 'creative and expressive' },
  { gradeLevel: 'middle', currentSituation: 'new_to_area', interests: ['tennis','athletics'], familyValues: ['small_classes'], timeline: 'this_year', childDescription: 'disciplined and focused' },
  { gradeLevel: 'middle', currentSituation: 'seeking_change', interests: ['technology','engineering'], familyValues: [], timeline: 'next_fall', childDescription: 'hands on tinkerer' },
  { gradeLevel: 'intermediate', currentSituation: 'exploring', interests: ['reading','building','science'], familyValues: [], timeline: 'this_year', childDescription: 'curious and kind' },
  { gradeLevel: 'lower', currentSituation: 'exploring', interests: ['play','music','friends'], familyValues: [], timeline: 'this_year', childDescription: 'outgoing and joyful' },
  { gradeLevel: 'upper', currentSituation: 'exploring', interests: ['business','entrepreneurship'], familyValues: ['leadership'], timeline: 'this_year', childDescription: 'visionary self starter' },
  { gradeLevel: 'upper', currentSituation: 'exploring', interests: ['service','community'], familyValues: ['character_building'], timeline: 'this_year', childDescription: 'empathetic and thoughtful' },
  { gradeLevel: 'upper', currentSituation: 'exploring', interests: ['media','design'], familyValues: [], timeline: 'this_year', childDescription: 'creative maker' },
  { gradeLevel: 'middle', currentSituation: 'exploring', interests: ['science','math'], familyValues: [], timeline: 'this_year', childDescription: 'analytical and curious' },
  { gradeLevel: 'middle', currentSituation: 'exploring', interests: ['arts','theater'], familyValues: [], timeline: 'this_year', childDescription: 'expressive and brave' },
  { gradeLevel: 'intermediate', currentSituation: 'exploring', interests: ['sports','teamwork'], familyValues: [], timeline: 'this_year', childDescription: 'active and social' },
  { gradeLevel: 'upper', currentSituation: 'exploring', interests: ['writing','literature'], familyValues: [], timeline: 'this_year', childDescription: 'thoughtful storyteller' },
  { gradeLevel: 'upper', currentSituation: 'exploring', interests: ['golf','athletics'], familyValues: [], timeline: 'this_year', childDescription: 'focused competitor' },
  { gradeLevel: 'upper', currentSituation: 'exploring', interests: ['swimming','athletics'], familyValues: [], timeline: 'this_year', childDescription: 'disciplined athlete' },
  { gradeLevel: 'upper', currentSituation: 'exploring', interests: ['photography','media'], familyValues: [], timeline: 'this_year', childDescription: 'visual creative' },
  { gradeLevel: 'upper', currentSituation: 'exploring', interests: ['biology','science'], familyValues: [], timeline: 'this_year', childDescription: 'inquisitive researcher' },
  { gradeLevel: 'middle', currentSituation: 'exploring', interests: ['robotics','coding'], familyValues: [], timeline: 'this_year', childDescription: 'young engineer' },
  { gradeLevel: 'intermediate', currentSituation: 'exploring', interests: ['music','arts'], familyValues: [], timeline: 'this_year', childDescription: 'musical student' }
];

describe('Top scenarios coverage', () => {
  const client = new OpenRouterClient();

  scenarios.forEach((quiz, idx) => {
    test(`scenario ${idx + 1}: ${quiz.gradeLevel} – ${quiz.interests.join(', ')}`, async () => {
      const result = await client.analyze(quiz, context);
      expect(result).toBeTruthy();
      // Structural expectations
      expect(result.matchedStories.length).toBeGreaterThan(0);
      expect(result.matchedFaculty.length).toBeGreaterThan(0);
      expect(result.matchScore).toBeGreaterThanOrEqual(70);
      expect(result.matchScore).toBeLessThanOrEqual(95);
      // Prefer video when available
      const hasVideoStory = result.matchedStories.some((s: any) => typeof s.videoUrl === 'string');
      const hasVideoFaculty = result.matchedFaculty.some((f: any) => typeof f.videoUrl === 'string');
      expect(hasVideoStory || hasVideoFaculty).toBe(true);
    });
  });
});

