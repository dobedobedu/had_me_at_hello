import alumniData from '../knowledge/alumni-story.json';
import facultyData from '../knowledge/faculty-story.json';
import currentStudentData from '../knowledge/current-student-stories.json';
import factsData from '../knowledge/facts.json';

describe('Knowledge Base Loading Tests', () => {
  describe('Alumni Stories', () => {
    test('should load alumni data successfully', () => {
      expect(alumniData).toBeDefined();
      expect(alumniData.stories).toBeDefined();
      expect(Array.isArray(alumniData.stories)).toBe(true);
      expect(alumniData.stories.length).toBeGreaterThan(0);
    });

    test('should have proper alumni story structure', () => {
      const story = alumniData.stories[0];
      
      expect(story).toHaveProperty('id');
      expect(story).toHaveProperty('firstName');
      expect(story).toHaveProperty('lastName');
      expect(story).toHaveProperty('classYear');
      expect(story).toHaveProperty('currentRole');
      expect(story).toHaveProperty('interests');
      expect(story).toHaveProperty('storyTldr');
      expect(story).toHaveProperty('achievement');
      expect(story).toHaveProperty('quote');
      expect(story).toHaveProperty('gradeLevel');
      
      expect(Array.isArray(story.interests)).toBe(true);
    });

    test('should have notable alumni profiles', () => {
      const notableAlumni = [
        'jim_courier_87',
        'ryan_roslansky_96',
        'brandon_silverman_98',
        'janelle_coutts_04',
        'sydney_brown_18'
      ];

      notableAlumni.forEach(id => {
        const alumnus = alumniData.stories.find(s => s.id === id);
        expect(alumnus).toBeDefined();
        expect(alumnus?.currentRole).toBeTruthy();
        expect(alumnus?.achievement).toBeTruthy();
      });
    });

    test('should have diverse career paths represented', () => {
      const careerFields = new Set();
      
      alumniData.stories.forEach(story => {
        story.interests.forEach(interest => {
          careerFields.add(interest.toLowerCase());
        });
      });
      
      // Should have at least 10 different career-related interests
      expect(careerFields.size).toBeGreaterThanOrEqual(10);
      
      // Check for key fields
      const expectedFields = ['technology', 'business', 'athletics', 'science', 'arts'];
      expectedFields.forEach(field => {
        expect([...careerFields].some(career => career.includes(field))).toBe(true);
      });
    });
  });

  describe('Faculty Stories', () => {
    test('should load faculty data successfully', () => {
      expect(facultyData).toBeDefined();
      expect(facultyData.faculty).toBeDefined();
      expect(Array.isArray(facultyData.faculty)).toBe(true);
      expect(facultyData.faculty.length).toBeGreaterThan(0);
    });

    test('should have proper faculty story structure', () => {
      const faculty = facultyData.faculty[0];
      
      expect(faculty).toHaveProperty('id');
      expect(faculty).toHaveProperty('firstName');
      expect(faculty).toHaveProperty('title');
      expect(faculty).toHaveProperty('specializesIn');
      expect(faculty).toHaveProperty('whyStudentsLoveThem');
      expect(faculty).toHaveProperty('department');
      
      expect(Array.isArray(faculty.specializesIn)).toBe(true);
    });

    test('should have key administrators', () => {
      const keyAdministrators = [
        'peter_kraft',
        'anna_conn',
        'joel_erby',
        'andrew_hasbrouck',
        'cole_hudson'
      ];

      keyAdministrators.forEach(id => {
        const admin = facultyData.faculty.find(f => f.id === id);
        expect(admin).toBeDefined();
        expect(admin?.isAdministrator).toBe(true);
      });
    });

    test('should cover all major academic departments', () => {
      const departments = new Set(
        facultyData.faculty.map(f => f.department).filter(Boolean)
      );
      
      const expectedDepartments = [
        'English', 'Mathematics', 'Science', 'Social Studies', 
        'Arts', 'Athletics', 'Business'
      ];
      
      expectedDepartments.forEach(dept => {
        expect([...departments].some(d => d.includes(dept))).toBe(true);
      });
    });
  });

  describe('Current Student Stories', () => {
    test('should load current student data successfully', () => {
      expect(currentStudentData).toBeDefined();
      expect(currentStudentData.stories).toBeDefined();
      expect(Array.isArray(currentStudentData.stories)).toBe(true);
      expect(currentStudentData.stories.length).toBeGreaterThan(0);
    });

    test('should have proper student story structure', () => {
      const story = currentStudentData.stories[0];
      
      expect(story).toHaveProperty('id');
      expect(story).toHaveProperty('firstName');
      expect(story).toHaveProperty('interests');
      expect(story).toHaveProperty('storyTldr');
      expect(story).toHaveProperty('achievement');
      expect(story).toHaveProperty('gradeLevel');
      
      expect(Array.isArray(story.interests)).toBe(true);
    });

    test('should represent diverse grade levels', () => {
      const gradeLevels = new Set(
        currentStudentData.stories.map(s => s.gradeLevel)
      );
      
      expect(gradeLevels.has('high')).toBe(true);
      expect(gradeLevels.size).toBeGreaterThanOrEqual(2);
    });

    test('should connect current students to alumni paths', () => {
      // Verify that current students reference alumni in their stories
      const storiesWithAlumniConnections = currentStudentData.stories.filter(story =>
        story.storyTldr.toLowerCase().includes('following') ||
        story.parentQuote?.toLowerCase().includes('alumni') ||
        story.studentQuote?.toLowerCase().includes('alumni')
      );
      
      expect(storiesWithAlumniConnections.length).toBeGreaterThan(0);
    });
  });

  describe('School Facts', () => {
    test('should load facts data successfully', () => {
      expect(factsData).toBeDefined();
      expect(factsData.facts).toBeDefined();
      expect(Array.isArray(factsData.facts)).toBe(true);
      expect(factsData.facts.length).toBeGreaterThan(0);
    });

    test('should have proper facts structure', () => {
      const fact = factsData.facts[0];
      
      expect(fact).toHaveProperty('id');
      expect(fact).toHaveProperty('gradeLevel');
      expect(fact).toHaveProperty('fact');
      expect(fact).toHaveProperty('context');
      expect(fact).toHaveProperty('category');
    });

    test('should cover different grade levels', () => {
      const gradeLevels = new Set(
        factsData.facts.map(f => f.gradeLevel)
      );
      
      expect(gradeLevels.has('all')).toBe(true);
      expect(gradeLevels.has('high')).toBe(true);
      expect(gradeLevels.size).toBeGreaterThanOrEqual(3);
    });

    test('should have key statistical facts', () => {
      const keyFacts = [
        'college_acceptance',
        'class_size_elementary',
        'class_size_high',
        'financial_aid'
      ];

      keyFacts.forEach(factId => {
        const fact = factsData.facts.find(f => f.id === factId);
        expect(fact).toBeDefined();
        expect(fact?.fact).toBeTruthy();
      });
    });
  });

  describe('Data Consistency', () => {
    test('should have consistent grade level values across all data', () => {
      const validGradeLevels = ['all', 'high', 'middle', 'lower', 'elementary', 'intermediate'];
      
      // Check alumni
      alumniData.stories.forEach(story => {
        expect(validGradeLevels).toContain(story.gradeLevel);
      });
      
      // Check current students
      currentStudentData.stories.forEach(story => {
        expect(validGradeLevels).toContain(story.gradeLevel);
      });
      
      // Check facts
      factsData.facts.forEach(fact => {
        expect(validGradeLevels).toContain(fact.gradeLevel);
      });
    });

    test('should have valid interest categories across all data', () => {
      const allInterests = new Set();
      
      // Collect from alumni
      alumniData.stories.forEach(story => {
        story.interests.forEach(interest => allInterests.add(interest));
      });
      
      // Collect from current students
      currentStudentData.stories.forEach(story => {
        story.interests.forEach(interest => allInterests.add(interest));
      });
      
      // Collect from faculty specializations
      facultyData.faculty.forEach(faculty => {
        faculty.specializesIn?.forEach(spec => allInterests.add(spec));
      });
      
      // Should have comprehensive interest coverage
      expect(allInterests.size).toBeGreaterThanOrEqual(20);
      
      // No empty interests
      expect([...allInterests].every(interest => interest && interest.trim().length > 0)).toBe(true);
    });
  });

  describe('RAG Integration Readiness', () => {
    test('should have data structure compatible with RAG context', () => {
      const ragContext = {
        stories: currentStudentData.stories,
        faculty: facultyData.faculty,
        facts: factsData.facts
      };
      
      expect(ragContext.stories).toBeDefined();
      expect(ragContext.faculty).toBeDefined();
      expect(ragContext.facts).toBeDefined();
      
      // Verify each has the expected structure for matching
      expect(ragContext.stories.every(s => s.interests && s.gradeLevel)).toBe(true);
      expect(ragContext.faculty.every(f => f.specializesIn)).toBe(true);
      expect(ragContext.facts.every(f => f.category && f.gradeLevel)).toBe(true);
    });
  });
});