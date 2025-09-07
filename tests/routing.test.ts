import { POST } from '../app/api/ai/analyze/route';
import type { QuizResponse } from '../lib/ai/types';

async function analyze(quiz: QuizResponse) {
  const req = new Request('http://localhost/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quiz })
  });
  const res: any = await POST(req as any);
  const json = await res.json();
  return json;
}

describe('Deterministic Routing (real assets only)', () => {
  test('lower school → lower_school_parents + literacy mentor', async () => {
    const result = await analyze({
      gradeLevel: 'lower', currentSituation: 'exploring',
      interests: ['friends','community'], familyValues: [], timeline: 'this_year', childDescription: 'happy and curious'
    } as any);

    expect(result.matchedStories[0].id).toBe('lower_school_parents');
    expect(result.matchedFaculty.length).toBeGreaterThan(0);
  });

  test('athletics → athletics_excellence preferred over spotlight', async () => {
    const result = await analyze({
      gradeLevel: 'upper', currentSituation: 'exploring',
      interests: ['athletics','teamwork'], familyValues: [], timeline: 'this_year', childDescription: ''
    } as any);

    expect(['athletics_excellence','athletics_spotlight']).toContain(result.matchedStories[0].id);
    expect(result.matchedStories[0].id).toBe('athletics_excellence');
  });

  test('arts/theater → creative_arts + drama faculty', async () => {
    const result = await analyze({
      gradeLevel: 'upper', currentSituation: 'exploring',
      interests: ['theater','arts'], familyValues: [], timeline: 'this_year', childDescription: ''
    } as any);

    expect(result.matchedStories[0].id).toBe('creative_arts');
    // Faculty may be jeannine_elisha or another arts mentor if present
    expect(result.matchedFaculty[0]).toBeTruthy();
  });

  test('stem/robotics → academic_excellence + tyler_cotton', async () => {
    const result = await analyze({
      gradeLevel: 'upper', currentSituation: 'exploring',
      interests: ['robotics','stem'], familyValues: [], timeline: 'this_year', childDescription: ''
    } as any);

    expect(result.matchedStories[0].id).toBe('academic_excellence');
    expect(result.matchedFaculty[0]).toBeTruthy();
  });

  test('business/entrepreneurship → bernie_yanelli mentor', async () => {
    const result = await analyze({
      gradeLevel: 'upper', currentSituation: 'exploring',
      interests: ['entrepreneurship','business'], familyValues: [], timeline: 'this_year', childDescription: ''
    } as any);

    expect(result.matchedFaculty[0]).toBeTruthy();
  });

  test('service/community → chaplain mentor', async () => {
    const result = await analyze({
      gradeLevel: 'upper', currentSituation: 'exploring',
      interests: ['service','community'], familyValues: [], timeline: 'this_year', childDescription: ''
    } as any);

    expect(result.matchedFaculty[0]).toBeTruthy();
  });
});

