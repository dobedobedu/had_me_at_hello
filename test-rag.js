// Test the RAG system logic

const alumniData = require('./knowledge/alumni-story.json');
const facultyData = require('./knowledge/faculty-story.json');
const currentStudentData = require('./knowledge/current-student-stories.json');

function testRAGLogic(interests, quizData = {}) {
  console.log('\n=== RAG Logic Test ===');
  console.log('Input interests:', interests);
  
  const allStories = [...currentStudentData.stories, ...alumniData.stories];
  
  // Find stories with video content first, then by interest match
  const videoStories = allStories.filter(s => s.videoUrl && s.videoUrl.includes('youtube'));
  console.log('Total stories with video:', videoStories.length);
  
  const interestMatchedStories = allStories.filter(s => 
    s.interests?.some(si => interests.some(ui => si.toLowerCase().includes(ui.toLowerCase())))
  );
  console.log('Interest-matched stories:', interestMatchedStories.length);
  console.log('Interest-matched names:', interestMatchedStories.map(s => `${s.firstName} ${s.lastName} (${s.interests?.join(', ')})`));
  
  // Current logic - only current students
  const currentStudents = allStories.filter(s => s.gradeLevel && !s.classYear);
  console.log('Current students available:', currentStudents.length);
  console.log('Current student categories:', currentStudents.map(s => `${s.firstName} - ${s.category}`));
  
  // Check athletics matching
  const athleticsMatched = interests.some(i => ['athletics', 'sports', 'football', 'competition', 'teamwork', 'fitness'].includes(i.toLowerCase()));
  console.log('Athletics keywords matched:', athleticsMatched);
  
  // Tennis-specific check
  const tennisMatched = interests.some(i => i.toLowerCase().includes('tennis'));
  console.log('Tennis mentioned:', tennisMatched);
  
  // Find athletics current students
  const athleticsStudents = currentStudents.filter(s => s.category === 'athletics');
  console.log('Athletics current students:', athleticsStudents.map(s => `${s.firstName} ${s.lastName}`));
  
  // Faculty check - Enhanced
  const videoFaculty = facultyData.faculty.filter(f => f.videoUrl && f.videoUrl.includes('youtube'));
  console.log('Video faculty available:', videoFaculty.map(f => `${f.firstName} ${f.lastName} - ${f.title}`));
  
  const interestMatchedFaculty = facultyData.faculty.filter(f => 
    f.specializesIn?.some(spec => interests.some(interest => 
      spec.toLowerCase().includes(interest.toLowerCase()) ||
      interest.toLowerCase().includes(spec.toLowerCase())
    ))
  );
  console.log('Interest-matched faculty:', interestMatchedFaculty.map(f => `${f.firstName} ${f.lastName} - ${f.title} (${f.specializesIn?.join(', ')})`));
  
  // Check tennis-specific matches
  const tennisKeywords = ['tennis', 'athletics'];
  const tennisMatchedFaculty = facultyData.faculty.filter(f => 
    f.specializesIn?.some(spec => tennisKeywords.some(keyword => 
      spec.toLowerCase().includes(keyword.toLowerCase())
    ))
  );
  console.log('Tennis/Athletics faculty:', tennisMatchedFaculty.map(f => `${f.firstName} ${f.lastName} - ${f.title}`));
  
  return {
    interestMatchedStories,
    athleticsStudents,
    videoFaculty
  };
}

// Test 1: Tennis + Athletics
console.log('🎾 TEST 1: Tennis + Athletics');
testRAGLogic(['tennis', 'athletics', 'tennis', 'tennis']);

// Test 2: Just athletics
console.log('\n🏃 TEST 2: Just Athletics');
testRAGLogic(['athletics', 'sports']);

// Test 3: Football
console.log('\n🏈 TEST 3: Football');
testRAGLogic(['football', 'competition']);