// Test smart tour recommendations for different kid archetypes

function testTourRecommendations(archetype, interests) {
  console.log(`\n🎯 ${archetype.toUpperCase()}`);
  console.log('=' .repeat(50));
  console.log('Interests:', interests);
  
  // Same category mapping as our enhanced system
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

  const matchesCategory = (category) => 
    interests.some(interest => 
      category.some(keyword => 
        interest.toLowerCase().includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(interest.toLowerCase())
      )
    );

  // Mock results for testing
  const mockResults = {
    matchedFaculty: [{ firstName: 'Tyler', title: 'STEAM Teacher' }]
  };

  // All possible tour options
  const allTourOptions = [
    // Universal
    {
      id: 'meet-faculty',
      title: `Meet ${mockResults.matchedFaculty[0].firstName}`,
      description: `${mockResults.matchedFaculty[0].title} - Your personalized connection`,
      priority: 1,
      categories: ['all']
    },
    {
      id: 'small-class',
      title: 'Sit in on a Small Class',
      description: 'Experience our 9:1 student-teacher ratio firsthand',
      priority: 2,
      categories: ['all']
    },
    
    // Athletics options
    {
      id: 'athletics-practice',
      title: 'Watch Team Practice',
      description: '19 varsity sports, 20 state championships - See our competitive spirit',
      priority: 2,
      categories: ['athletics']
    },
    {
      id: 'athletics-facilities',
      title: 'Tour Athletic Facilities',
      description: 'State-of-the-art gym, fields, and training equipment',
      priority: 3,
      categories: ['athletics']
    },
    
    // STEM/Academic options
    {
      id: 'steam-center',
      title: 'Explore STEAM Innovation Center',
      description: 'Maker spaces, robotics lab, and hands-on engineering projects',
      priority: 2,
      categories: ['academics', 'entrepreneurs']
    },
    {
      id: 'marine-lab',
      title: 'Visit Marine Science Lab',
      description: 'Living coral reef, marine research, and cutting-edge science',
      priority: 3,
      categories: ['academics']
    },
    {
      id: 'computer-lab',
      title: 'See Computer Science Labs',
      description: 'Programming, coding bootcamps, and tech innovation spaces',
      priority: 3,
      categories: ['academics']
    },
    
    // Creative options
    {
      id: 'arts-showcase',
      title: 'Explore Arts Programs',
      description: 'Student galleries, 600-seat theater, music studios, and creative spaces',
      priority: 2,
      categories: ['creativity']
    },
    {
      id: 'performing-arts',
      title: 'Visit Performing Arts Center',
      description: 'Theater productions, music performances, and dance studios',
      priority: 3,
      categories: ['creativity']
    },
    
    // Community/Faith options
    {
      id: 'chapel-service',
      title: 'Experience Chapel Service',
      description: 'Spiritual life, community worship, and character development',
      priority: 2,
      categories: ['community']
    },
    {
      id: 'service-projects',
      title: 'See Community Service in Action',
      description: 'Student-led volunteer work and local community partnerships',
      priority: 3,
      categories: ['community']
    },
    
    // Business/Leadership options
    {
      id: 'student-government',
      title: 'Meet Student Leaders',
      description: 'Student government, entrepreneurship club, and leadership development',
      priority: 3,
      categories: ['entrepreneurs']
    },
    {
      id: 'college-counseling',
      title: 'Meet College Counselors',
      description: '100% college acceptance rate, $2.3M in scholarships annually',
      priority: 3,
      categories: ['academics', 'entrepreneurs']
    }
  ];

  // Get recommendations
  let recommendedOptions = [];
  
  // Add universal options
  recommendedOptions.push(...allTourOptions.filter(opt => 
    opt.categories.includes('all') && opt.priority <= 2
  ));

  // Add category-specific options
  if (matchesCategory(categoryMapping.athletics)) {
    recommendedOptions.push(...allTourOptions.filter(opt => 
      opt.categories.includes('athletics') && opt.priority <= 2
    ));
  }
  
  if (matchesCategory(categoryMapping.academics)) {
    recommendedOptions.push(...allTourOptions.filter(opt => 
      opt.categories.includes('academics') && opt.priority <= 2
    ));
  }
  
  if (matchesCategory(categoryMapping.creativity)) {
    recommendedOptions.push(...allTourOptions.filter(opt => 
      opt.categories.includes('creativity') && opt.priority <= 2
    ));
  }
  
  if (matchesCategory(categoryMapping.community)) {
    recommendedOptions.push(...allTourOptions.filter(opt => 
      opt.categories.includes('community') && opt.priority <= 2
    ));
  }
  
  if (matchesCategory(categoryMapping.entrepreneurs)) {
    recommendedOptions.push(...allTourOptions.filter(opt => 
      opt.categories.includes('entrepreneurs') && opt.priority <= 2
    ));
  }

  // Fill remaining slots
  const remainingSlots = 4 - recommendedOptions.length;
  if (remainingSlots > 0) {
    const additionalOptions = allTourOptions.filter(opt => 
      !recommendedOptions.some(rec => rec.id === opt.id) && opt.priority === 3
    );
    recommendedOptions.push(...additionalOptions.slice(0, remainingSlots));
  }

  // Remove duplicates and limit
  const uniqueOptions = recommendedOptions.filter((option, index, self) => 
    index === self.findIndex(opt => opt.id === option.id)
  );

  console.log('\n📅 RECOMMENDED TOUR OPTIONS:');
  uniqueOptions.slice(0, 4).forEach((option, index) => {
    console.log(`${index + 1}. ${option.title}`);
    console.log(`   ${option.description}`);
  });

  console.log('\n🎯 CATEGORY MATCHES:');
  console.log(`- Athletics: ${matchesCategory(categoryMapping.athletics)}`);
  console.log(`- Academics: ${matchesCategory(categoryMapping.academics)}`);
  console.log(`- Creativity: ${matchesCategory(categoryMapping.creativity)}`);
  console.log(`- Community: ${matchesCategory(categoryMapping.community)}`);
  console.log(`- Business: ${matchesCategory(categoryMapping.entrepreneurs)}`);
}

// Test different kid archetypes
testTourRecommendations('Athletic Kid', ['sporty', 'competition', 'teamwork']);
testTourRecommendations('STEM Kid', ['robotics', 'coding', 'engineering']);
testTourRecommendations('Artsy Kid', ['creative', 'music', 'theater']);
testTourRecommendations('Church Kid', ['faith', 'community', 'service']);
testTourRecommendations('Business Kid', ['entrepreneur', 'leadership', 'ambitious']);
testTourRecommendations('Multi-Interest Kid', ['tennis', 'coding', 'artsy', 'volunteer']);

console.log('\n✅ Smart tour recommendations test completed!');