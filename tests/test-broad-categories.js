// Test the enhanced broad category matching system

const alumniData = require('./knowledge/alumni-story.json');
const facultyData = require('./knowledge/faculty-story.json');
const currentStudentData = require('./knowledge/current-student-stories.json');

function testBroadCategoryMatching(testName, interests) {
  console.log(`\n🎯 ${testName.toUpperCase()}`);
  console.log('Input interests:', interests);
  
  const allStories = [...currentStudentData.stories, ...alumniData.stories];
  
  // Broad category mapping system (same as in results page)
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

  // Function to check if interests match any category
  const matchesCategory = (category) => 
    interests.some(interest => 
      category.some(keyword => 
        interest.toLowerCase().includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(interest.toLowerCase())
      )
    );

  // Test category matches
  console.log('Category matches:');
  console.log('- Athletics:', matchesCategory(categoryMapping.athletics));
  console.log('- Academics:', matchesCategory(categoryMapping.academics));
  console.log('- Creativity:', matchesCategory(categoryMapping.creativity));
  console.log('- Community:', matchesCategory(categoryMapping.community));
  
  // Test faculty recommendations
  const getFacultyRecommendations = () => {
    const facultyMap = {
      // Business/Entrepreneurship interests
      business: ['bernie_yanelli'], 
      entrepreneurship: ['bernie_yanelli'],
      economics: ['bernie_yanelli'],
      
      // STEAM/Math/Engineering interests  
      stem: ['tyler_cotton'],
      math: ['tyler_cotton'],
      mathematics: ['tyler_cotton'],
      engineering: ['tyler_cotton'],
      technology: ['tyler_cotton'],
      
      // Creative/Arts interests
      creativity: ['david_johnson'],
      creative: ['david_johnson'], 
      writing: ['david_johnson'],
      literature: ['david_johnson'],
      english: ['david_johnson'],
      arts: ['david_johnson'],
      
      // History/Social Studies interests
      history: ['patrick_whelan'],
      government: ['patrick_whelan'],
      social_studies: ['patrick_whelan'],
      
      // Athletics interests
      athletics: ['cole_hudson'],
      sports: ['cole_hudson'],
      competition: ['cole_hudson'],
      
      // Younger kids (elementary focus)
      reading: ['jennifer_batson'],
      foundational_skills: ['jennifer_batson'],
      literacy: ['jennifer_batson'],
      
      // Default recommendation
      default: ['patrick_whelan'] // Teacher of the Year
    };
    
    const recommendedIds = new Set();
    
    // Add specific recommendations based on interests
    interests.forEach(interest => {
      const interestLower = interest.toLowerCase();
      Object.entries(facultyMap).forEach(([key, facultyIds]) => {
        if (interestLower.includes(key) || key.includes(interestLower)) {
          facultyIds.forEach(id => recommendedIds.add(id));
        }
      });
    });
    
    // Add category-based recommendations
    if (matchesCategory(categoryMapping.athletics)) recommendedIds.add('cole_hudson');
    if (matchesCategory(categoryMapping.academics)) {
      recommendedIds.add('tyler_cotton'); // STEM
      recommendedIds.add('patrick_whelan'); // Social Studies
    }
    if (matchesCategory(categoryMapping.creativity)) recommendedIds.add('david_johnson');
    
    // If no specific matches, use default recommendation
    if (recommendedIds.size === 0) recommendedIds.add('patrick_whelan');
    
    return Array.from(recommendedIds);
  };
  
  const recommendedFacultyIds = getFacultyRecommendations();
  const recommendedFaculty = facultyData.faculty.filter(f => 
    recommendedFacultyIds.includes(f.id)
  );
  
  console.log('Recommended Faculty:', recommendedFaculty.map(f => 
    `${f.firstName} ${f.lastName} (${f.title})`
  ));
  
  // Test alumni matching
  const categoryMatchedAlumni = allStories.filter(s => {
    if (!s.classYear || !s.videoUrl || !s.videoUrl.includes('youtube')) return false;
    
    return s.interests?.some(storyInterest => {
      const storyInterestLower = storyInterest.toLowerCase();
      
      // Check if story interest matches any of our broad categories
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
  
  console.log('Category-matched Alumni:', categoryMatchedAlumni.map(s => 
    `${s.firstName} ${s.lastName} (${s.interests?.join(', ')})`
  ));
}

// Test various scenarios
testBroadCategoryMatching('Tennis + Athletics', ['tennis', 'athletics', 'tennis']);
testBroadCategoryMatching('Basketball', ['basketball', 'teamwork']);
testBroadCategoryMatching('Science + Math', ['science', 'mathematics']);
testBroadCategoryMatching('Creative Writing', ['creative', 'writing', 'storytelling']);
testBroadCategoryMatching('Business + Economics', ['business', 'entrepreneurship']);
testBroadCategoryMatching('History + Social Studies', ['history', 'government']);
testBroadCategoryMatching('Community Service', ['community', 'volunteer', 'helping']);
testBroadCategoryMatching('Track and Field', ['track', 'field', 'running']);
testBroadCategoryMatching('Art + Design', ['art', 'design', 'visual']);