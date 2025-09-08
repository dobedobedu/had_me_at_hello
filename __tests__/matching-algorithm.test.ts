import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock the route handler functions for testing
// We'll extract the functions from the route file and test them in isolation

interface QuizResponse {
  gradeLevel?: string;
  childDescription?: string;
  threeWords?: string;
  interests?: string[];
  familyValues?: string[];
  selectedCharacteristics?: string[];
}

interface RAGContext {
  stories: any[];
  faculty: any[];
  facts: any[];
}

interface AnalysisResult {
  matchScore: number;
  personalizedMessage: string;
  matchedStories: any[];
  matchedFaculty: any[];
  matchedFacts: any[];
  keyInsights: string[];
  recommendedPrograms: string[];
  provider: string;
}

// Mock faculty data for testing
const mockFaculty = [
  { id: 'tyler_cotton', firstName: 'Tyler', lastName: 'Cotton', title: 'STEM Teacher', videoUrl: 'https://youtube.com/watch?v=test1' },
  { id: 'jeannine_elisha', firstName: 'Jeannine', lastName: 'Elisha', title: 'Arts Teacher' },
  { id: 'cori_rigney', firstName: 'Cori', lastName: 'Rigney', title: 'Service Coordinator' },
  { id: 'bernie_yanelli', firstName: 'Bernie', lastName: 'Yanelli', title: 'Business Teacher' },
  { id: 'patrick_whelan', firstName: 'Patrick', lastName: 'Whelan', title: 'History Teacher' },
  { id: 'david_johnson', firstName: 'David', lastName: 'Johnson', title: 'English Teacher' },
  { id: 'jamie_moore', firstName: 'Jamie', lastName: 'Moore', title: 'Language Arts Teacher' },
  { id: 'cole_hudson', firstName: 'Cole', lastName: 'Hudson', title: 'Athletics Director' },
  { id: 'jennifer_batson', firstName: 'Jennifer', lastName: 'Batson', title: 'Lower School Teacher' },
  { id: 'andrew_hasbrouck', firstName: 'Andrew', lastName: 'Hasbrouck', title: 'Lower School Teacher' }
];

const mockStudents = [
  { id: 'creative_arts', name: 'Betsy', achievement: 'Creative Arts Excellence', videoUrl: 'https://youtube.com/watch?v=test2' },
  { id: 'athletics_excellence', name: 'Jake', achievement: 'Athletic Excellence', videoUrl: 'https://youtube.com/watch?v=test3' },
  { id: 'academic_excellence', name: 'Sarah', achievement: 'Academic Excellence' },
  { id: 'student_teacher_relationships', name: 'Alex', achievement: 'Strong Relationships' },
  { id: 'lower_school_parents', name: 'Emma', achievement: 'Lower School Success' }
];

const mockContext: RAGContext = {
  stories: mockStudents,
  faculty: mockFaculty,
  facts: []
};

// Extract and adapt functions from the route file for testing
function sanitizeArray(arr: any[]): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((x) => typeof x === 'string' && x.trim().length > 0).map((s) => s.toLowerCase());
}

function extractTraits(quiz: QuizResponse): string[] {
  const traits: string[] = [];
  traits.push(...sanitizeArray(quiz?.selectedCharacteristics || []));
  const desc = (quiz?.childDescription || quiz?.threeWords || '').toLowerCase();
  if (desc) {
    const tokens = desc.match(/[a-zA-Z][a-zA-Z\-]+/g) || [];
    const stop = new Set(['and','the','a','an','of','to','with','who','is','are','for','about','very','really']);
    const picked: string[] = [];
    for (const t of tokens) {
      if (!stop.has(t) && picked.indexOf(t) === -1) picked.push(t);
      if (picked.length >= 5) break;
    }
    traits.push(...picked);
  }
  return traits;
}

function expandInterests(ints: string[]): string[] {
  const map: Record<string, string[]> = {
    athletics: ['sports','tennis','soccer','basketball','football','swimming','track','golf','volleyball','competition','team','fitness','athletic'],
    stem: ['science','technology','engineering','math','robotics','coding','programming','computer','steam','physics','chemistry','biology'],
    creativity: ['arts','art','visual','design','music','theater','drama','writing','literature','media','film','photography','creative'],
    community: ['service','volunteer','leadership','mentorship','church','faith','spiritual','religious','community'],
  };
  const out = new Set<string>();
  for (const i of ints) {
    out.add(i);
    for (const [cat, kws] of Object.entries(map)) {
      if (i.includes(cat) || kws.some(k => i.includes(k) || k.includes(i))) {
        out.add(cat);
        kws.forEach(k => out.add(k));
      }
    }
  }
  return Array.from(out);
}

function recommendFromTraitsInterestsValues(traits: string[], interests: string[], familyValues: string[] = []): string[] {
  const programs = new Set<string>();
  
  // 1. CHILD DESCRIPTION TRAITS (HIGHEST PRIORITY) - max 1 program
  if (traits.some(t => ['creative','artistic','imaginative','expressive','visual','musical'].includes(t))) {
    programs.add('Fine Arts Program');
  } else if (traits.some(t => ['athletic','competitive','energetic','physical','strong','fast','sporty'].includes(t))) {
    programs.add('Athletics Program');
  } else if (traits.some(t => ['smart','intelligent','curious','analytical','logical','scientific','mathematical'].includes(t))) {
    programs.add('STEAM Program');
  } else if (traits.some(t => ['kind','caring','helpful','empathetic','compassionate','service'].includes(t))) {
    programs.add('Leadership & Service');
  } else if (traits.some(t => ['leader','confident','outgoing','social','charismatic','bold'].includes(t))) {
    programs.add('Leadership & Service');
  } else if (traits.some(t => ['reader','bookish','literary','writer','storyteller','verbal'].includes(t))) {
    programs.add('Advanced Academics');
  }
  
  // 2. INTERESTS (MEDIUM PRIORITY) - add 1 more if different
  if (programs.size < 2) {
    if (interests.some((i) => ['arts', 'music', 'drama', 'creative'].includes(i)) && !programs.has('Fine Arts Program')) {
      programs.add('Fine Arts Program');
    } else if (interests.some((i) => ['sports', 'athletics', 'competition'].includes(i)) && !programs.has('Athletics Program')) {
      programs.add('Athletics Program');
    } else if (interests.some((i) => ['science', 'technology', 'stem', 'engineering'].includes(i)) && !programs.has('STEAM Program')) {
      programs.add('STEAM Program');
    } else if (interests.some((i) => ['service', 'community', 'leadership'].includes(i)) && !programs.has('Leadership & Service')) {
      programs.add('Leadership & Service');
    }
  }
  
  // 3. FAMILY VALUES (LOWEST PRIORITY) - only if we need a third
  if (programs.size < 2) {
    if (familyValues.some(v => ['creative_expression','arts_focus','individual_creativity'].includes(v)) && !programs.has('Fine Arts Program')) {
      programs.add('Fine Arts Program');
    } else if (familyValues.some(v => ['athletic_excellence','team_sports','physical_development'].includes(v)) && !programs.has('Athletics Program')) {
      programs.add('Athletics Program');
    } else if (familyValues.some(v => ['stem_innovation','technology_integration','academic_rigor'].includes(v)) && !programs.has('STEAM Program')) {
      programs.add('STEAM Program');
    } else if (familyValues.some(v => ['service_learning','character_development','leadership_development'].includes(v)) && !programs.has('Leadership & Service')) {
      programs.add('Leadership & Service');
    }
  }
  
  // Always include College Prep as base, limit to 3 total
  const result = ['College Preparatory Program', ...Array.from(programs)];
  return result.slice(0, 3);
}

function pickFacultyByPriority(userTraits: string[], userInterests: string[], userFamilyValues: string[], userGrade: string, facultyArr: any[]): any {
  const isLower = userGrade === 'lower' || userGrade === 'elementary' || userGrade === 'intermediate';
  const fById = (id: string) => facultyArr.find((f) => f.id === id);

  // 1. CHILD DESCRIPTION TRAITS (HIGHEST PRIORITY)
  if (userTraits.some(t => ['creative','artistic','imaginative','expressive','visual','musical'].includes(t))) {
    return (fById('jeannine_elisha') || facultyArr[0]);
  }
  if (userTraits.some(t => ['athletic','competitive','energetic','physical','strong','fast','sporty'].includes(t))) {
    return (fById('tyler_cotton')?.videoUrl ? fById('tyler_cotton') : (fById('cole_hudson') || facultyArr[0]));
  }
  if (userTraits.some(t => ['smart','intelligent','curious','analytical','logical','scientific','mathematical'].includes(t))) {
    return (fById('tyler_cotton') || facultyArr[0]);
  }
  if (userTraits.some(t => ['kind','caring','helpful','empathetic','compassionate','service'].includes(t))) {
    return (fById('cori_rigney') || facultyArr[0]);
  }
  if (userTraits.some(t => ['leader','confident','outgoing','social','charismatic','bold'].includes(t))) {
    return (fById('bernie_yanelli') || fById('patrick_whelan') || facultyArr[0]);
  }
  if (userTraits.some(t => ['reader','bookish','literary','writer','storyteller','verbal'].includes(t))) {
    return (fById('david_johnson') || fById('jamie_moore') || facultyArr[0]);
  }

  // 2. INTERESTS (MEDIUM PRIORITY)
  if (userInterests.some(i => ['arts','music','theater','drama','creative'].includes(i))) {
    return (fById('jeannine_elisha') || facultyArr[0]);
  }
  if (userInterests.some(i => ['athletics','sports','tennis','football'].includes(i))) {
    return (fById('tyler_cotton')?.videoUrl ? fById('tyler_cotton') : (fById('cole_hudson') || facultyArr[0]));
  }
  if (userInterests.some(i => ['stem','science','technology','engineering','robotics','coding','programming','math'].includes(i))) {
    return (fById('tyler_cotton') || facultyArr[0]);
  }
  if (userInterests.some(i => ['service','community','faith','church','spiritual'].includes(i))) {
    return (fById('cori_rigney') || facultyArr[0]);
  }
  if (userInterests.some(i => ['business','entrepreneurship','economics','leadership'].includes(i))) {
    return (fById('bernie_yanelli') || fById('patrick_whelan') || facultyArr[0]);
  }
  if (userInterests.some(i => ['english','writing','literature'].includes(i))) {
    return (fById('david_johnson') || fById('jamie_moore') || facultyArr[0]);
  }

  // 3. FAMILY VALUES (LOWEST PRIORITY)
  if (userFamilyValues.some(v => ['creative_expression','arts_focus','individual_creativity'].includes(v))) {
    return (fById('jeannine_elisha') || facultyArr[0]);
  }
  if (userFamilyValues.some(v => ['athletic_excellence','team_sports','physical_development'].includes(v))) {
    return (fById('tyler_cotton')?.videoUrl ? fById('tyler_cotton') : (fById('cole_hudson') || facultyArr[0]));
  }
  if (userFamilyValues.some(v => ['stem_innovation','technology_integration','academic_rigor'].includes(v))) {
    return (fById('tyler_cotton') || facultyArr[0]);
  }
  if (userFamilyValues.some(v => ['character_development','service_learning','faith_based_education'].includes(v))) {
    return (fById('cori_rigney') || facultyArr[0]);
  }

  // 4. GRADE-BASED DEFAULTS
  if (isLower && !userInterests.some(i => ['athletics','sports'].includes(i))) {
    return (fById('jennifer_batson') || fById('david_johnson') || fById('andrew_hasbrouck') || facultyArr[0]);
  }

  // 5. FALLBACK
  const videoFaculty = facultyArr.filter((f: any) => typeof f.videoUrl === 'string' && f.videoUrl.includes('youtube'));
  return (videoFaculty[0] || facultyArr[0]);
}

describe('Matching Algorithm Tests', () => {
  describe('Priority Weighting System', () => {
    it('should prioritize child description over interests', () => {
      const quiz: QuizResponse = {
        childDescription: 'creative artistic imaginative',
        interests: ['athletics', 'sports'],
        familyValues: ['academic_rigor'],
        gradeLevel: 'middle'
      };

      const traits = extractTraits(quiz);
      const interests = expandInterests(sanitizeArray(quiz.interests || []));
      const familyValues = sanitizeArray(quiz.familyValues || []);
      
      const faculty = pickFacultyByPriority(traits, interests, familyValues, quiz.gradeLevel!, mockFaculty);
      const programs = recommendFromTraitsInterestsValues(traits, interests, familyValues);

      // Should match Arts faculty (from traits) NOT athletics faculty (from interests)
      expect(faculty.firstName).toBe('Jeannine');
      expect(faculty.lastName).toBe('Elisha');
      
      // Should recommend Fine Arts Program (from traits) as first specialized program
      expect(programs).toContain('Fine Arts Program');
      expect(programs).toContain('College Preparatory Program');
    });

    it('should use interests when child description is vague', () => {
      const quiz: QuizResponse = {
        childDescription: 'nice good happy', // vague traits
        interests: ['science', 'technology', 'robotics'],
        familyValues: ['creative_expression'],
        gradeLevel: 'upper'
      };

      const traits = extractTraits(quiz);
      const interests = expandInterests(sanitizeArray(quiz.interests || []));
      const familyValues = sanitizeArray(quiz.familyValues || []);
      
      const faculty = pickFacultyByPriority(traits, interests, familyValues, quiz.gradeLevel!, mockFaculty);
      const programs = recommendFromTraitsInterestsValues(traits, interests, familyValues);

      // Should fall back to interests and match STEM faculty
      expect(faculty.firstName).toBe('Tyler');
      expect(faculty.lastName).toBe('Cotton');
      
      // Should recommend STEAM Program from interests
      expect(programs).toContain('STEAM Program');
    });

    it('should use family values as final fallback', () => {
      const quiz: QuizResponse = {
        childDescription: 'sweet lovely wonderful', // generic traits
        interests: ['reading'], // weak interests
        familyValues: ['athletic_excellence', 'team_sports'],
        gradeLevel: 'middle'
      };

      const traits = extractTraits(quiz);
      const interests = expandInterests(sanitizeArray(quiz.interests || []));
      const familyValues = sanitizeArray(quiz.familyValues || []);
      
      const programs = recommendFromTraitsInterestsValues(traits, interests, familyValues);

      // Should fall back to family values and include athletics
      expect(programs).toContain('Athletics Program');
    });
  });

  describe('Recommendation Limits', () => {
    it('should limit recommendations to maximum 3 programs', () => {
      const quiz: QuizResponse = {
        childDescription: 'creative athletic smart leader',
        interests: ['arts', 'sports', 'science', 'music', 'drama'],
        familyValues: ['stem_innovation', 'creative_expression', 'athletic_excellence'],
        gradeLevel: 'upper'
      };

      const traits = extractTraits(quiz);
      const interests = expandInterests(sanitizeArray(quiz.interests || []));
      const familyValues = sanitizeArray(quiz.familyValues || []);
      
      const programs = recommendFromTraitsInterestsValues(traits, interests, familyValues);

      expect(programs.length).toBeLessThanOrEqual(3);
      expect(programs).toContain('College Preparatory Program'); // Always included
    });

    it('should always include College Preparatory Program', () => {
      const testCases = [
        { childDescription: 'creative', interests: ['arts'], familyValues: [] },
        { childDescription: 'athletic', interests: ['sports'], familyValues: [] },
        { childDescription: '', interests: [], familyValues: [] }
      ];

      testCases.forEach(quiz => {
        const traits = extractTraits(quiz);
        const interests = expandInterests(sanitizeArray(quiz.interests || []));
        const familyValues = sanitizeArray(quiz.familyValues || []);
        
        const programs = recommendFromTraitsInterestsValues(traits, interests, familyValues);
        
        expect(programs).toContain('College Preparatory Program');
      });
    });

    it('should avoid duplicate programs', () => {
      const quiz: QuizResponse = {
        childDescription: 'creative artistic',
        interests: ['arts', 'music'],
        familyValues: ['creative_expression', 'arts_focus'],
        gradeLevel: 'middle'
      };

      const traits = extractTraits(quiz);
      const interests = expandInterests(sanitizeArray(quiz.interests || []));
      const familyValues = sanitizeArray(quiz.familyValues || []);
      
      const programs = recommendFromTraitsInterestsValues(traits, interests, familyValues);
      
      // Should only have one instance of Fine Arts Program despite multiple creative signals
      const fineArtsCount = programs.filter(p => p === 'Fine Arts Program').length;
      expect(fineArtsCount).toBe(1);
    });
  });

  describe('Trait Extraction', () => {
    it('should extract meaningful words from child description', () => {
      const quiz: QuizResponse = {
        childDescription: 'My child is very creative and artistic with a curious mind'
      };

      const traits = extractTraits(quiz);
      
      expect(traits).toContain('creative');
      expect(traits).toContain('artistic');
      expect(traits).toContain('curious');
      // Note: "mind" may be dropped due to 5-word limit, which is expected behavior
      expect(traits.length).toBeLessThanOrEqual(5);
      expect(traits).not.toContain('very'); // Stop word
      expect(traits).not.toContain('and'); // Stop word
    });

    it('should handle threeWords field', () => {
      const quiz: QuizResponse = {
        threeWords: 'smart athletic kind'
      };

      const traits = extractTraits(quiz);
      
      expect(traits).toContain('smart');
      expect(traits).toContain('athletic');
      expect(traits).toContain('kind');
    });

    it('should limit traits to 5 words', () => {
      const quiz: QuizResponse = {
        childDescription: 'creative artistic smart athletic kind helpful generous outgoing confident bold'
      };

      const traits = extractTraits(quiz);
      
      expect(traits.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Faculty Matching', () => {
    it('should match creative traits to Arts faculty', () => {
      const traits = ['creative', 'artistic'];
      const interests: string[] = [];
      const familyValues: string[] = [];
      
      const faculty = pickFacultyByPriority(traits, interests, familyValues, 'middle', mockFaculty);
      
      expect(faculty.firstName).toBe('Jeannine');
      expect(faculty.title).toBe('Arts Teacher');
    });

    it('should match athletic traits to Sports faculty', () => {
      const traits = ['athletic', 'competitive'];
      const interests: string[] = [];
      const familyValues: string[] = [];
      
      const faculty = pickFacultyByPriority(traits, interests, familyValues, 'middle', mockFaculty);
      
      // Should prefer Tyler Cotton (has video) over Cole Hudson for athletics
      expect(faculty.firstName).toBe('Tyler');
    });

    it('should match smart/curious traits to STEM faculty', () => {
      const traits = ['smart', 'curious', 'analytical'];
      const interests: string[] = [];
      const familyValues: string[] = [];
      
      const faculty = pickFacultyByPriority(traits, interests, familyValues, 'upper', mockFaculty);
      
      expect(faculty.firstName).toBe('Tyler');
      expect(faculty.title).toBe('STEM Teacher');
    });

    it('should use grade-based defaults for lower school', () => {
      const traits = ['sweet', 'happy']; // generic traits
      const interests: string[] = [];
      const familyValues: string[] = [];
      
      const faculty = pickFacultyByPriority(traits, interests, familyValues, 'lower', mockFaculty);
      
      // Should default to lower school faculty
      expect(['Jennifer', 'David', 'Andrew']).toContain(faculty.firstName);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty inputs gracefully', () => {
      const quiz: QuizResponse = {
        gradeLevel: 'middle'
      };

      const traits = extractTraits(quiz);
      const interests = expandInterests([]);
      const familyValues: string[] = [];
      
      const faculty = pickFacultyByPriority(traits, interests, familyValues, quiz.gradeLevel!, mockFaculty);
      const programs = recommendFromTraitsInterestsValues(traits, interests, familyValues);

      expect(faculty).toBeTruthy(); // Should return some faculty
      expect(programs).toContain('College Preparatory Program');
      expect(programs.length).toBeGreaterThan(0);
    });

    it('should handle null/undefined values', () => {
      const quiz: QuizResponse = {
        childDescription: undefined,
        interests: undefined,
        familyValues: undefined,
        gradeLevel: 'middle'
      };

      expect(() => {
        const traits = extractTraits(quiz);
        const interests = expandInterests([]);
        const familyValues: string[] = [];
        
        pickFacultyByPriority(traits, interests, familyValues, quiz.gradeLevel!, mockFaculty);
        recommendFromTraitsInterestsValues(traits, interests, familyValues);
      }).not.toThrow();
    });

    it('should handle mixed case and special characters', () => {
      const quiz: QuizResponse = {
        childDescription: 'CREATIVE, Artistic-minded & Super-Smart!!!'
      };

      const traits = extractTraits(quiz);
      
      expect(traits).toContain('creative');
      expect(traits).toContain('artistic-minded');
      expect(traits).toContain('super-smart');
    });
  });
});