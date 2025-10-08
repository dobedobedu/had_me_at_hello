#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { HybridMatchingService } from './lib/ai/hybrid-matcher';
import { QuizResponse, RAGContext } from './lib/ai/types';

// Import knowledge data
import alumniData from './knowledge/alumni-story.json';
import facultyData from './knowledge/faculty-story.json';
import currentStudentData from './knowledge/current-student-stories.json';
import factsData from './knowledge/facts.json';

// Build RAG context
const ragContext: RAGContext = {
  stories: currentStudentData.stories,
  faculty: facultyData.faculty,
  facts: factsData.facts
};

// Load personas
const personasData = JSON.parse(fs.readFileSync('./personas/south-florida-families.json', 'utf8'));

async function testPersonaSemantic(persona: any, index: number) {
  console.log(`\n=== ${index + 1}. ${persona.name} ===`);
  console.log(`Family: ${persona.family}`);
  console.log(`Child: "${persona.quizResponse.threeWords}"`);
  console.log(`Interests: ${persona.quizResponse.interests.join(', ')}`);
  console.log(`Values: ${persona.quizResponse.familyValues.join(', ')}`);

  try {
    const hybridMatcher = HybridMatchingService.getInstance();

    // Test with pure deterministic matching (no LLM, no semantic search)
    const result = await hybridMatcher.match(persona.quizResponse, ragContext, {
      useSemanticSearch: false,
      useLLMSelection: false
    });

    console.log(`\n🎯 RESULTS:`);
    console.log(`Match Score: ${result.matchScore}`);
    console.log(`Provider: ${result.provider}`);

    if (result.matchedStories.length > 0) {
      console.log(`\n👨‍🎓 MATCHED STUDENT:`);
      const student = result.matchedStories[0];
      console.log(`  ${student.firstName} - ${student.achievement}`);
      console.log(`  Interests: ${student.interests?.join(', ') || 'N/A'}`);
      console.log(`  Grade: ${student.gradeLevel || (student as any).gradeBands?.join('/') || 'N/A'}`);
    }

    if (result.matchedFaculty.length > 0) {
      console.log(`\n👨‍🏫 MATCHED FACULTY:`);
      const faculty = result.matchedFaculty[0];
      console.log(`  ${faculty.firstName} ${faculty.lastName} - ${faculty.title}`);
      console.log(`  Department: ${faculty.department || 'N/A'}`);
      console.log(`  Specializes: ${faculty.specializesIn?.join(', ') || 'N/A'}`);
    }

    console.log(`\n💬 PERSONALIZED MESSAGE:`);
    console.log(`"${result.personalizedMessage}"`);

    return {
      success: true,
      persona: persona.name,
      matchScore: result.matchScore,
      studentMatch: result.matchedStories[0]?.firstName || 'None',
      facultyMatch: result.matchedFaculty[0] ? `${result.matchedFaculty[0].firstName} ${result.matchedFaculty[0].lastName}` : 'None',
      provider: result.provider
    };

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return {
      success: false,
      persona: persona.name,
      error: error.message
    };
  }
}

async function main() {
  console.log('🧪 Testing South Florida Family Personas with Deterministic Matching');
  console.log('=================================================================');

  const results = [];

  // Test just the first 5 personas to see the pattern
  for (let i = 0; i < Math.min(5, personasData.personas.length); i++) {
    const persona = personasData.personas[i];
    const result = await testPersonaSemantic(persona, i);
    results.push(result);

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n\n📊 SUMMARY RESULTS:');
  console.log('==================');
  results.forEach((r, i) => {
    if (r.success) {
      console.log(`${i + 1}. ${r.persona}`);
      console.log(`   Score: ${r.matchScore}, Student: ${r.studentMatch}, Faculty: ${r.facultyMatch}`);
      console.log(`   Provider: ${r.provider}`);
    } else {
      console.log(`${i + 1}. ${r.persona} - ERROR: ${r.error}`);
    }
  });

  // Save results
  fs.writeFileSync('./personas/deterministic-test-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    results
  }, null, 2));
}

if (require.main === module) {
  main().catch(console.error);
}