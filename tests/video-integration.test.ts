import factsData from '../knowledge/facts.json';
import facultyData from '../knowledge/faculty-story.json';

describe('Video Integration Tests', () => {
  describe('Facts Video Content', () => {
    test('should have student-teacher video with high priority', () => {
      const studentTeacherFact = factsData.facts.find(
        fact => fact.id === 'student_teacher_relationships'
      );

      expect(studentTeacherFact).toBeDefined();
      expect(studentTeacherFact?.priority).toBe('high');
      expect(studentTeacherFact?.videoUrl).toBe('https://youtu.be/chFGkSoSXqg');
      expect(studentTeacherFact?.videoTitle).toBe('Students Talk About Their Teachers');
      expect(studentTeacherFact?.category).toBe('community');
    });

    test('should have all required video properties for high-priority facts', () => {
      const highPriorityFacts = factsData.facts.filter(fact => fact.priority === 'high');
      
      expect(highPriorityFacts.length).toBeGreaterThan(0);
      
      highPriorityFacts.forEach(fact => {
        expect(fact.videoUrl).toBeTruthy();
        expect(fact.videoTitle).toBeTruthy();
        expect(fact.videoUrl).toMatch(/^https:\/\/(www\.)?youtu\.?be/);
      });
    });
  });

  describe('Faculty Video Content', () => {
    test('should have correct video URLs for updated faculty', () => {
      const expectedVideoFaculty = [
        { id: 'tyler_cotton', videoUrl: 'https://www.youtube.com/watch?v=qydHeyOCVUo' },
        { id: 'patrick_whelan', videoUrl: 'https://youtu.be/v0O8tugOOLQ' },
        { id: 'david_johnson', videoUrl: 'https://www.youtube.com/watch?v=M4uIGP9yZqQ' },
        { id: 'jennifer_batson', videoUrl: 'https://www.youtube.com/watch?v=TTvbZyWYd2U' },
        { id: 'bernie_yanelli', videoUrl: 'https://www.youtube.com/watch?v=0_tBfPeDy2k' },
        { id: 'andrew_angelo', videoUrl: 'https://www.youtube.com/watch?v=8dla2PGFWpI' }
      ];

      expectedVideoFaculty.forEach(expected => {
        const faculty = facultyData.faculty.find(f => f.id === expected.id);
        expect(faculty).toBeDefined();
        expect(faculty?.videoUrl).toBe(expected.videoUrl);
        
        // Verify YouTube URL format
        expect(faculty?.videoUrl).toMatch(/^https:\/\/(www\.)?youtu\.?be/);
      });
    });

    test('should have Andrew Angelo as new faculty member', () => {
      const andrew = facultyData.faculty.find(f => f.id === 'andrew_angelo');
      
      expect(andrew).toBeDefined();
      expect(andrew?.firstName).toBe('Andrew');
      expect(andrew?.lastName).toBe('Angelo');
      expect(andrew?.videoUrl).toBe('https://www.youtube.com/watch?v=8dla2PGFWpI');
      expect(andrew?.specializesIn).toContain('education');
    });

    test('should have all video URLs in proper YouTube format', () => {
      const facultyWithVideos = facultyData.faculty.filter(f => f.videoUrl && f.videoUrl !== '');
      
      expect(facultyWithVideos.length).toBeGreaterThan(0);
      
      facultyWithVideos.forEach(faculty => {
        expect(faculty.videoUrl).toMatch(
          /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+$/
        );
      });
    });
  });

  describe('Video Content for RAG', () => {
    test('should provide video content accessible to RAG system', () => {
      // Check that video content is structured for AI matching
      const videoFacts = factsData.facts.filter(fact => fact.videoUrl);
      const videoFaculty = facultyData.faculty.filter(f => f.videoUrl && f.videoUrl !== '');
      
      expect(videoFacts.length).toBeGreaterThan(0);
      expect(videoFaculty.length).toBeGreaterThan(0);
      
      // Verify video facts have context for matching
      videoFacts.forEach(fact => {
        expect(fact.context).toBeTruthy();
        expect(fact.category).toBeTruthy();
        expect(fact.fact).toBeTruthy();
      });
      
      // Verify video faculty have specializations for matching
      videoFaculty.forEach(faculty => {
        expect(faculty.specializesIn).toBeDefined();
        expect(faculty.whyStudentsLoveThem).toBeTruthy();
      });
    });

    test('should have video content that matches common parent interests', () => {
      const commonInterests = ['education', 'teaching', 'arts', 'science', 'technology', 'athletics'];
      
      const videoFacts = factsData.facts.filter(fact => fact.videoUrl);
      const videoFaculty = facultyData.faculty.filter(f => f.videoUrl && f.videoUrl !== '');
      
      // Check that video content covers diverse interests
      const coveredInterests = new Set();
      
      videoFacts.forEach(fact => {
        if (fact.category) {
          coveredInterests.add(fact.category);
        }
      });
      
      videoFaculty.forEach(faculty => {
        faculty.specializesIn?.forEach(spec => {
          coveredInterests.add(spec);
        });
      });
      
      // Should cover at least 3 different areas
      expect(coveredInterests.size).toBeGreaterThanOrEqual(3);
    });
  });
});