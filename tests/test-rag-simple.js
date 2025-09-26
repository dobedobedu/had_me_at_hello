// Simple test to check RAG matching
const quizData = {
  gradeLevel: 'high',
  currentSituation: 'seeking_change',
  interests: ['entrepreneurship', 'technology', 'AI'],
  familyValues: ['innovation', 'academic_excellence'],
  timeline: 'this_year',
  childDescription: 'Tech-savvy student interested in entrepreneurship and AI'
};

console.log('Testing RAG with quiz data:');
console.log('Interests:', quizData.interests);

// Make a request to the results page
console.log('\nTo test: Visit http://localhost:3000/quiz and complete with these interests:');
console.log('- Entrepreneurship');
console.log('- Technology');
console.log('- AI');
console.log('\nExpected: Should match with David Kim (tech founder) not Sarah Martinez (Broadway)');