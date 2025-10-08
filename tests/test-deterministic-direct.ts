#!/usr/bin/env tsx

import fs from 'fs';
import { buildMatchingProfile, selectMatchesWithMetadata, computeCompositeScore } from './lib/ai/deterministic-matcher';
import { extractTraits, expandInterests } from './lib/ai/matcher-utils';
import { QuizResponse, RAGContext } from './lib/ai/types';

// Import knowledge data
import alumniData from './knowledge/alumni-story.json';
import facultyData from './knowledge/faculty-story.json';
import currentStudentData from './knowledge/current-student-stories.json';

// Build RAG context
const ragContext: RAGContext = {
  stories: currentStudentData.stories,
  faculty: facultyData.faculty,
  facts: []
};

// Load personas
const personasData = JSON.parse(fs.readFileSync('./personas/south-florida-families.json', 'utf8'));

function testPersonaDeterministic(persona: any, index: number) {
  console.log(`\n=== ${index + 1}. ${persona.name} ===`);
  console.log(`Family: ${persona.family}`);
  console.log(`Child: "${persona.quizResponse.threeWords}"`);
  console.log(`Interests: ${persona.quizResponse.interests.join(', ')}`);
  console.log(`Values: ${persona.quizResponse.familyValues.join(', ')}`);

  const quiz: QuizResponse = persona.quizResponse;

  // Extract traits and build profile
  const userTraits = extractTraits(quiz);
  const userInterests = expandInterests(quiz.interests || []);
  const userFamilyValues = quiz.familyValues || [];

  const profile = buildMatchingProfile({
    quiz,
    gradeLevel: quiz.gradeLevel || 'middle',
    traits: userTraits,
    interests: userInterests,
    primaryInterests: quiz.interests || [],
    familyValues: userFamilyValues,
  });

  console.log(`\nProfile Analysis:`);
  console.log(`  Grade Band: ${profile.gradeBand}`);
  console.log(`  Extracted Traits: ${userTraits.join(', ')}`);
  console.log(`  Expanded Interests: ${userInterests.slice(0, 8).join(', ')}${userInterests.length > 8 ? '...' : ''}`);

  // Get matches
  const selection = selectMatchesWithMetadata(ragContext, profile);
  const matchScore = computeCompositeScore(selection);

  console.log(`\n🎯 DETERMINISTIC MATCHES:`);
  console.log(`Overall Match Score: ${matchScore}`);

  if (selection.student) {
    console.log(`\n👨‍🎓 SELECTED STUDENT (Score: ${selection.studentScore}):`);
    console.log(`  ${selection.student.firstName} - ${selection.student.achievement}`);
    console.log(`  Interests: ${selection.student.interests?.join(', ') || 'N/A'}`);
    console.log(`  Grade: ${selection.student.gradeLevel || (selection.student as any).gradeBands?.join('/') || 'N/A'}`);
    if ((selection.student as any).personaDescriptors) {
      console.log(`  Personality: ${(selection.student as any).personaDescriptors.join(', ')}`);
    }
  }

  if (selection.faculty) {
    console.log(`\n👨‍🏫 SELECTED FACULTY (Score: ${selection.facultyScore}):`);
    console.log(`  ${selection.faculty.firstName} ${selection.faculty.lastName} - ${selection.faculty.title}`);
    console.log(`  Department: ${selection.faculty.department || 'N/A'}`);
    console.log(`  Specializes: ${selection.faculty.specializesIn?.join(', ') || 'N/A'}`);
    console.log(`  Why Students Love: ${selection.faculty.whyStudentsLoveThem}`);
  }

  if (selection.alumni) {
    console.log(`\n🎓 SELECTED ALUMNI (Score: ${selection.alumniScore}):`);
    console.log(`  ${selection.alumni.firstName} - ${selection.alumni.achievement}`);
    console.log(`  Class: ${(selection.alumni as any).classYear || 'N/A'}`);
    console.log(`  Current Role: ${(selection.alumni as any).currentRole || 'N/A'}`);
  }

  return {
    persona: persona.name,
    id: persona.id,
    childDescription: persona.quizResponse.threeWords,
    matchScore,
    studentMatch: selection.student ? {
      name: selection.student.firstName,
      achievement: selection.student.achievement,
      score: selection.studentScore,
      interests: selection.student.interests
    } : null,
    facultyMatch: selection.faculty ? {
      name: `${selection.faculty.firstName} ${selection.faculty.lastName}`,
      title: selection.faculty.title,
      score: selection.facultyScore,
      specializes: selection.faculty.specializesIn
    } : null,
    alumniMatch: selection.alumni ? {
      name: selection.alumni.firstName,
      achievement: selection.alumni.achievement,
      score: selection.alumniScore
    } : null
  };
}

async function main() {
  console.log('🧪 Testing South Florida Family Personas with DIRECT Deterministic Matching');
  console.log('===========================================================================');

  const results = [];

  // Test all 25 personas
  for (let i = 0; i < personasData.personas.length; i++) {
    const persona = personasData.personas[i];
    const result = testPersonaDeterministic(persona, i);
    results.push(result);
  }

  console.log('\n\n📊 SUMMARY RESULTS:');
  console.log('===================');
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.persona} - "${r.childDescription}"`);
    console.log(`   Match Score: ${r.matchScore}`);
    console.log(`   Student: ${r.studentMatch?.name} (${r.studentMatch?.score})`);
    console.log(`   Faculty: ${r.facultyMatch?.name} (${r.facultyMatch?.score})`);
    console.log(`   Alumni: ${r.alumniMatch?.name || 'None'} (${r.alumniMatch?.score || 0})`);
    console.log('');
  });

  // Look for interesting patterns
  console.log('📈 ANALYSIS PATTERNS:');
  console.log('=====================');

  // Group by similar child descriptions
  const artisticPersonas = results.filter(r =>
    r.childDescription.toLowerCase().includes('artistic') ||
    r.childDescription.toLowerCase().includes('creative') ||
    r.childDescription.toLowerCase().includes('dramatic')
  );

  const academicPersonas = results.filter(r =>
    r.childDescription.toLowerCase().includes('brilliant') ||
    r.childDescription.toLowerCase().includes('analytical') ||
    r.childDescription.toLowerCase().includes('gifted')
  );

  const athleticPersonas = results.filter(r =>
    r.childDescription.toLowerCase().includes('athletic') ||
    r.childDescription.toLowerCase().includes('competitive')
  );

  const socialPersonas = results.filter(r =>
    r.childDescription.toLowerCase().includes('outgoing') ||
    r.childDescription.toLowerCase().includes('social') ||
    r.childDescription.toLowerCase().includes('confident')
  );

  if (artisticPersonas.length > 0) {
    console.log(`\n🎨 ARTISTIC/CREATIVE CHILDREN (${artisticPersonas.length}):`);
    artisticPersonas.forEach(p => console.log(`  ${p.persona}: ${p.studentMatch?.name} + ${p.facultyMatch?.name}`));
  }

  if (academicPersonas.length > 0) {
    console.log(`\n📚 ACADEMIC/ANALYTICAL CHILDREN (${academicPersonas.length}):`);
    academicPersonas.forEach(p => console.log(`  ${p.persona}: ${p.studentMatch?.name} + ${p.facultyMatch?.name}`));
  }

  if (athleticPersonas.length > 0) {
    console.log(`\n🏃 ATHLETIC/COMPETITIVE CHILDREN (${athleticPersonas.length}):`);
    athleticPersonas.forEach(p => console.log(`  ${p.persona}: ${p.studentMatch?.name} + ${p.facultyMatch?.name}`));
  }

  if (socialPersonas.length > 0) {
    console.log(`\n🤝 SOCIAL/CONFIDENT CHILDREN (${socialPersonas.length}):`);
    socialPersonas.forEach(p => console.log(`  ${p.persona}: ${p.studentMatch?.name} + ${p.facultyMatch?.name}`));
  }

  // Save detailed results
  fs.writeFileSync('./personas/deterministic-analysis.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    totalTested: results.length,
    averageMatchScore: results.reduce((sum, r) => sum + r.matchScore, 0) / results.length,
    patterns: {
      artistic: artisticPersonas.length,
      academic: academicPersonas.length,
      athletic: athleticPersonas.length,
      social: socialPersonas.length
    },
    results
  }, null, 2));

  console.log(`\n💾 Detailed results saved to: ./personas/deterministic-analysis.json`);
}

if (require.main === module) {
  main().catch(console.error);
}