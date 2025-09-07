// Test the final enhanced RAG system with proper card ordering

const alumniData = require('./knowledge/alumni-story.json');
const facultyData = require('./knowledge/faculty-story.json');
const currentStudentData = require('./knowledge/current-student-stories.json');

function testFinalRAGSystem(testName, interests) {
  console.log(`\n🎯 ${testName.toUpperCase()}`);
  console.log('=' .repeat(50));
  console.log('Input interests:', interests);
  
  const allStories = [...currentStudentData.stories, ...alumniData.stories];
  
  // Broad category mapping system
  const categoryMapping = {
    athletics: [
      'athletics', 'sports', 'football', 'basketball', 'tennis', 'soccer', 
      'baseball', 'volleyball', 'track', 'field', 'swimming', 'polo', 
      'golf', 'wrestling', 'cross country', 'lacrosse', 'competition', 
      'teamwork', 'fitness', 'coaching', 'championship', 'training'
    ],
    academics: [
      'academics', 'science', 'math', 'mathematics', 'technology', 'research', 
      'stem', 'college_prep', 'engineering', 'physics', 'chemistry', 
      'biology', 'computer science', 'literature', 'history', 'geography',
      'economics', 'business', 'leadership', 'scholarship', 'learning'
    ],
    creativity: [
      'arts', 'creativity', 'creative', 'theater', 'theatre', 'music', 
      'performance', 'visual_arts', 'art', 'painting', 'drawing', 'design', 
      'dance', 'singing', 'drama', 'sculpture', 'photography', 'writing', 
      'poetry', 'storytelling', 'imagination', 'artistic', 'innovative'
    ],
    community: [
      'community', 'service', 'volunteer', 'helping', 'social', 'friendship',
      'collaboration', 'mentorship', 'civic', 'charity', 'outreach',
      'support', 'care', 'empathy', 'giving back', 'making a difference'
    ]
  };

  const matchesCategory = (category) => 
    interests.some(interest => 
      category.some(keyword => 
        interest.toLowerCase().includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(interest.toLowerCase())
      )
    );

  // Current student selection
  const currentStudents = allStories.filter(s => s.gradeLevel && !s.classYear);
  const candidateStudents = [];
  
  if (matchesCategory(categoryMapping.creativity)) {
    candidateStudents.push(...currentStudents.filter(s => s.category === 'creative'));
  }
  if (matchesCategory(categoryMapping.athletics)) {
    candidateStudents.push(...currentStudents.filter(s => s.category === 'athletics'));
  }
  if (matchesCategory(categoryMapping.academics)) {
    candidateStudents.push(...currentStudents.filter(s => s.category === 'academic'));
  }
  if (candidateStudents.length === 0 || Math.random() > 0.7) {
    candidateStudents.push(...currentStudents.filter(s => s.category === 'default'));
  }

  // Alumni matching
  const categoryMatchedAlumni = allStories.filter(s => {
    if (!s.classYear || !s.videoUrl || !s.videoUrl.includes('youtube')) return false;
    
    return s.interests?.some(storyInterest => {
      const storyInterestLower = storyInterest.toLowerCase();
      return (matchesCategory(categoryMapping.athletics) && 
              categoryMapping.athletics.some(keyword => storyInterestLower.includes(keyword.toLowerCase()))) ||
             (matchesCategory(categoryMapping.academics) && 
              categoryMapping.academics.some(keyword => storyInterestLower.includes(keyword.toLowerCase()))) ||
             (matchesCategory(categoryMapping.creativity) && 
              categoryMapping.creativity.some(keyword => storyInterestLower.includes(keyword.toLowerCase()))) ||
             (matchesCategory(categoryMapping.community) && 
              categoryMapping.community.some(keyword => storyInterestLower.includes(keyword.toLowerCase())));
    });
  });

  candidateStudents.push(...categoryMatchedAlumni.slice(0, 2));

  // Separate current students and alumni
  const currentStudentCandidates = candidateStudents.filter(s => s.gradeLevel && !s.classYear);
  const alumniCandidates = candidateStudents.filter(s => s.classYear);
  
  const selectedCurrentStudent = currentStudentCandidates.length > 0 ? currentStudentCandidates[0] : null;
  const selectedAlumni = alumniCandidates.length > 0 ? alumniCandidates[0] : null;

  // Faculty recommendations
  const getFacultyRecommendations = () => {
    const facultyMap = {
      business: ['bernie_yanelli'], 
      entrepreneurship: ['bernie_yanelli'],
      economics: ['bernie_yanelli'],
      stem: ['tyler_cotton'],
      math: ['tyler_cotton'],
      mathematics: ['tyler_cotton'],
      engineering: ['tyler_cotton'],
      technology: ['tyler_cotton'],
      creativity: ['david_johnson'],
      creative: ['david_johnson'], 
      writing: ['david_johnson'],
      literature: ['david_johnson'],
      english: ['david_johnson'],
      arts: ['david_johnson'],
      history: ['patrick_whelan'],
      government: ['patrick_whelan'],
      social_studies: ['patrick_whelan'],
      athletics: ['cole_hudson'],
      sports: ['cole_hudson'],
      competition: ['cole_hudson'],
      reading: ['jennifer_batson'],
      foundational_skills: ['jennifer_batson'],
      literacy: ['jennifer_batson'],
      default: ['patrick_whelan']
    };
    
    const recommendedIds = new Set();
    
    // Priority 1: Specific keyword matches (highest priority)
    const specificMatches = new Set();
    interests.forEach(interest => {
      const interestLower = interest.toLowerCase();
      Object.entries(facultyMap).forEach(([key, facultyIds]) => {
        // Exclude 'default' from specific matches
        if (key !== 'default' && (interestLower.includes(key) || key.includes(interestLower))) {
          facultyIds.forEach(id => {
            specificMatches.add(id);
            recommendedIds.add(id);
          });
        }
      });
    });
    
    // Priority 2: Broad category matches (only if no specific matches)
    if (specificMatches.size === 0) {
      if (matchesCategory(categoryMapping.athletics)) recommendedIds.add('cole_hudson');
      if (matchesCategory(categoryMapping.academics)) {
        recommendedIds.add('tyler_cotton');
        recommendedIds.add('patrick_whelan');
      }
      if (matchesCategory(categoryMapping.creativity)) recommendedIds.add('david_johnson');
    }
    
    if (recommendedIds.size === 0) recommendedIds.add('patrick_whelan');
    
    return Array.from(recommendedIds);
  };
  
  const recommendedFacultyIds = getFacultyRecommendations();
  const selectedFaculty = facultyData.faculty.filter(f => 
    recommendedFacultyIds.includes(f.id)
  )[0];

  // Results
  console.log('\n📋 RESULTS:');
  console.log(`Current Student: ${selectedCurrentStudent ? `${selectedCurrentStudent.firstName} ${selectedCurrentStudent.lastName} (${selectedCurrentStudent.category})` : 'None'}`);
  console.log(`Faculty: ${selectedFaculty ? `${selectedFaculty.firstName} ${selectedFaculty.lastName} (${selectedFaculty.title})` : 'None'}`);
  console.log(`Alumni (Bottom Card): ${selectedAlumni ? `${selectedAlumni.firstName} ${selectedAlumni.lastName} (Class of ${selectedAlumni.classYear})` : 'None'}`);
  
  console.log('\n🎯 Category Matches:');
  console.log(`- Athletics: ${matchesCategory(categoryMapping.athletics)}`);
  console.log(`- Academics: ${matchesCategory(categoryMapping.academics)}`);
  console.log(`- Creativity: ${matchesCategory(categoryMapping.creativity)}`);
  console.log(`- Community: ${matchesCategory(categoryMapping.community)}`);
}

// Test various scenarios to ensure proper matching and card ordering
testFinalRAGSystem('Tennis Interest (Original Issue)', ['tennis', 'athletics', 'competition']);
testFinalRAGSystem('Basketball & Teamwork', ['basketball', 'teamwork', 'sports']);
testFinalRAGSystem('Creative Writing', ['creative', 'writing', 'storytelling', 'arts']);
testFinalRAGSystem('STEM & Engineering', ['stem', 'engineering', 'mathematics', 'technology']);
testFinalRAGSystem('Business & Entrepreneurship', ['business', 'entrepreneurship', 'economics']);
testFinalRAGSystem('History & Government', ['history', 'government', 'social_studies']);
testFinalRAGSystem('Multiple Categories', ['tennis', 'creative', 'mathematics', 'community']);

console.log('\n✅ Final RAG system test completed!');