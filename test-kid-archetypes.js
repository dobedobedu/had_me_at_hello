// Test expanded kid archetypes matching system

const alumniData = require('./knowledge/alumni-story.json');
const facultyData = require('./knowledge/faculty-story.json');
const currentStudentData = require('./knowledge/current-student-stories.json');

function testKidArchetype(testName, interests) {
  console.log(`\n🎯 ${testName.toUpperCase()}`);
  console.log('=' .repeat(60));
  console.log('Input interests:', interests);
  
  const allStories = [...currentStudentData.stories, ...alumniData.stories];
  
  // Expanded category mapping system for different kid archetypes
  const categoryMapping = {
    athletics: [
      'athletics', 'sports', 'football', 'basketball', 'tennis', 'soccer', 
      'baseball', 'volleyball', 'track', 'field', 'swimming', 'polo', 
      'golf', 'wrestling', 'cross country', 'lacrosse', 'competition', 
      'teamwork', 'fitness', 'coaching', 'championship', 'training',
      'athletic', 'sporty', 'active', 'physical', 'outdoorsy'
    ],
    academics: [
      'academics', 'science', 'math', 'mathematics', 'technology', 'research', 
      'stem', 'college_prep', 'engineering', 'physics', 'chemistry', 
      'biology', 'computer science', 'literature', 'history', 'geography',
      'economics', 'business', 'leadership', 'scholarship', 'learning',
      'computer', 'coding', 'programming', 'tech', 'robotics', 'chess',
      'intellectual', 'studious', 'analytical', 'logical', 'curious',
      'lego', 'building', 'construction', 'maker', 'hands-on', 'crafting',
      'woodworking', 'mechanical', 'inventor', 'builder', 'tinkering'
    ],
    creativity: [
      'arts', 'creativity', 'creative', 'theater', 'theatre', 'music', 
      'performance', 'visual_arts', 'art', 'painting', 'drawing', 'design', 
      'dance', 'singing', 'drama', 'sculpture', 'photography', 'writing', 
      'poetry', 'storytelling', 'imagination', 'artistic', 'innovative',
      'artsy', 'musical', 'goth', 'alternative', 'indie', 'bohemian',
      'expressive', 'unique', 'unconventional', 'individualistic',
      'introvert', 'introverted', 'quiet', 'reserved', 'thoughtful'
    ],
    community: [
      'community', 'service', 'volunteer', 'helping', 'social', 'friendship',
      'collaboration', 'mentorship', 'civic', 'charity', 'outreach',
      'support', 'care', 'empathy', 'giving back', 'making a difference',
      'church', 'faith', 'spiritual', 'religious', 'ministry', 'mission'
    ],
    entrepreneurs: [
      'business', 'entrepreneur', 'entrepreneurial', 'startup', 'innovation',
      'leadership', 'ambitious', 'driven', 'competitive', 'goal-oriented',
      'visionary', 'strategic', 'risk-taking', 'self-motivated'
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

  console.log('\n🎯 CATEGORY MATCHES:');
  console.log(`- Athletics (sporty kids): ${matchesCategory(categoryMapping.athletics)}`);
  console.log(`- Academics (chess/lego/computer kids): ${matchesCategory(categoryMapping.academics)}`);
  console.log(`- Creativity (artsy/goth/introvert kids): ${matchesCategory(categoryMapping.creativity)}`);
  console.log(`- Community (church/service kids): ${matchesCategory(categoryMapping.community)}`);
  console.log(`- Entrepreneurs (business kids): ${matchesCategory(categoryMapping.entrepreneurs)}`);

  // Test faculty recommendations with updated logic
  const getFacultyRecommendations = () => {
    const facultyMap = {
      business: ['bernie_yanelli'], 
      entrepreneurship: ['bernie_yanelli'],
      entrepreneur: ['bernie_yanelli'],
      entrepreneurial: ['bernie_yanelli'],
      economics: ['bernie_yanelli'],
      stem: ['tyler_cotton'],
      math: ['tyler_cotton'],
      mathematics: ['tyler_cotton'],
      engineering: ['tyler_cotton'],
      technology: ['tyler_cotton'],
      computer: ['tyler_cotton'],
      coding: ['tyler_cotton'],
      programming: ['tyler_cotton'],
      robotics: ['tyler_cotton'],
      lego: ['tyler_cotton'],
      building: ['tyler_cotton'],
      maker: ['tyler_cotton'],
      chess: ['tyler_cotton'], // Logic/analytical thinking
      creativity: ['david_johnson'],
      creative: ['david_johnson'], 
      writing: ['david_johnson'],
      literature: ['david_johnson'],
      english: ['david_johnson'],
      arts: ['david_johnson'],
      artsy: ['david_johnson'],
      goth: ['david_johnson'], // Alternative creative expression
      alternative: ['david_johnson'],
      music: ['david_johnson'],
      musical: ['david_johnson'],
      introvert: ['david_johnson'], // Quiet creative types
      introverted: ['david_johnson'],
      history: ['patrick_whelan'],
      government: ['patrick_whelan'],
      social_studies: ['patrick_whelan'],
      athletics: ['cole_hudson'],
      sports: ['cole_hudson'],
      competition: ['cole_hudson'],
      athletic: ['cole_hudson'],
      sporty: ['cole_hudson'],
      reading: ['jennifer_batson'],
      foundational_skills: ['jennifer_batson'],
      literacy: ['jennifer_batson'],
      church: ['cori_rigney'], // Chaplain for faith-based interests
      faith: ['cori_rigney'],
      spiritual: ['cori_rigney'],
      religious: ['cori_rigney'],
      default: ['patrick_whelan'] // Teacher of the Year
    };
    
    const recommendedIds = new Set();
    const specificMatches = new Set();
    
    // Priority 1: Specific keyword matches
    interests.forEach(interest => {
      const interestLower = interest.toLowerCase();
      Object.entries(facultyMap).forEach(([key, facultyIds]) => {
        if (key !== 'default' && (interestLower.includes(key) || key.includes(interestLower))) {
          facultyIds.forEach(id => {
            specificMatches.add(id);
            recommendedIds.add(id);
          });
        }
      });
    });
    
    // Priority 2: Broad category matches
    if (specificMatches.size === 0) {
      if (matchesCategory(categoryMapping.athletics)) recommendedIds.add('cole_hudson');
      if (matchesCategory(categoryMapping.academics)) {
        recommendedIds.add('tyler_cotton');
        recommendedIds.add('patrick_whelan');
      }
      if (matchesCategory(categoryMapping.creativity)) recommendedIds.add('david_johnson');
      if (matchesCategory(categoryMapping.community)) recommendedIds.add('cori_rigney');
      if (matchesCategory(categoryMapping.entrepreneurs)) recommendedIds.add('bernie_yanelli');
    }
    
    if (recommendedIds.size === 0) recommendedIds.add('patrick_whelan');
    
    return Array.from(recommendedIds);
  };
  
  const recommendedFacultyIds = getFacultyRecommendations();
  const selectedFaculty = facultyData.faculty.filter(f => 
    recommendedFacultyIds.includes(f.id)
  )[0];

  console.log(`\n👨‍🏫 RECOMMENDED FACULTY: ${selectedFaculty ? `${selectedFaculty.firstName} ${selectedFaculty.lastName} (${selectedFaculty.title})` : 'None'}`);
}

// Test various kid archetypes
testKidArchetype('Artsy Kid', ['artsy', 'creative', 'unique']);
testKidArchetype('Athletic Kid', ['sporty', 'active', 'competition']);
testKidArchetype('Music Kid', ['musical', 'performance', 'creative']);
testKidArchetype('Goth Kid', ['goth', 'alternative', 'unconventional']);
testKidArchetype('Computer Kid', ['computer', 'coding', 'tech']);
testKidArchetype('Community Service Kid', ['volunteer', 'helping', 'service']);
testKidArchetype('Church Kid', ['church', 'faith', 'spiritual']);
testKidArchetype('Introvert Kid', ['introvert', 'quiet', 'thoughtful']);
testKidArchetype('Business Kid', ['entrepreneur', 'ambitious', 'leadership']);
testKidArchetype('Lego Kid', ['lego', 'building', 'construction']);
testKidArchetype('Chess Kid', ['chess', 'analytical', 'logical']);
testKidArchetype('Maker Kid', ['maker', 'hands-on', 'tinkering']);
testKidArchetype('Multiple Archetypes', ['artsy', 'sporty', 'computer', 'church']);

console.log('\n✅ Kid archetype testing completed!');