#!/usr/bin/env tsx

import { config } from 'dotenv';
config({ path: './.env.local' });

import fs from 'fs';
import path from 'path';
import { HybridMatchingService } from './lib/ai/hybrid-matcher';
import { QuizResponse, RAGContext } from './lib/ai/types';

// Import knowledge data
import alumniData from './knowledge/alumni-story.json';
import facultyData from './knowledge/faculty-story.json';
import currentStudentData from './knowledge/current-student-stories.json';
import factsData from './knowledge/facts.json';

interface PersonaTest {
  id: string;
  name: string;
  family: string;
  quizResponse: QuizResponse;
  results?: {
    matchScore: number;
    personalizedMessage: string;
    matchedStudents: any[];
    matchedFaculty: any[];
    matchedAlumni: any[];
    provider: string;
    processingTime: number;
    semanticResultsCount?: {
      students: number;
      faculty: number;
      alumni: number;
    };
  };
  error?: string;
}

// Load personas
const personasData = JSON.parse(fs.readFileSync('./personas/south-florida-families.json', 'utf8'));

// Build RAG context
const ragContext: RAGContext = {
  stories: currentStudentData.stories,
  faculty: facultyData.faculty,
  facts: factsData.facts
};

async function testPersona(persona: any): Promise<PersonaTest> {
  console.log(`\n🧪 Testing ${persona.name} (${persona.id})`);
  console.log(`👨‍👩‍👧‍👦 ${persona.family}`);
  console.log(`📝 Child: "${persona.quizResponse.threeWords}"`);

  try {
    const hybridMatcher = HybridMatchingService.getInstance();
    const startTime = Date.now();

    const result = await hybridMatcher.match(persona.quizResponse, ragContext, {
      useSemanticSearch: true,
      useLLMSelection: true, // Enable full hybrid system: Grok 4 + OpenAI embeddings
      semanticOptions: {
        studentsCount: 5,
        facultyCount: 4,
        alumniCount: 4,
        threshold: 0.2
      }
    });

    const processingTime = Date.now() - startTime;

    console.log(`✅ Match Score: ${result.matchScore}`);
    console.log(`👨‍🎓 Student Matches: ${result.matchedStories.length}`);
    console.log(`👨‍🏫 Faculty Matches: ${result.matchedFaculty.length}`);
    console.log(`🎯 Provider: ${result.provider}`);
    console.log(`⏱️ Processing: ${processingTime}ms`);

    if (result.matchedStories.length > 0) {
      console.log(`📚 Selected Student: ${result.matchedStories[0].firstName} - ${result.matchedStories[0].achievement}`);
    }
    if (result.matchedFaculty.length > 0) {
      console.log(`👨‍🏫 Selected Faculty: ${result.matchedFaculty[0].firstName} ${result.matchedFaculty[0].lastName} - ${result.matchedFaculty[0].title}`);
    }

    return {
      id: persona.id,
      name: persona.name,
      family: persona.family,
      quizResponse: persona.quizResponse,
      results: {
        matchScore: result.matchScore,
        personalizedMessage: result.personalizedMessage,
        matchedStudents: result.matchedStories.map(s => ({
          id: s.id,
          name: s.firstName,
          achievement: s.achievement,
          interests: s.interests
        })),
        matchedFaculty: result.matchedFaculty.map(f => ({
          id: f.id,
          name: `${f.firstName} ${f.lastName}`,
          title: f.title,
          department: f.department,
          specializes: f.specializesIn
        })),
        matchedAlumni: result.matchedStories.filter(s => s.classYear), // Alumni have classYear
        provider: result.provider || 'unknown',
        processingTime,
        semanticResultsCount: result.semanticResults ? {
          students: result.semanticResults.students.length,
          faculty: result.semanticResults.faculty.length,
          alumni: result.semanticResults.alumni.length
        } : undefined
      }
    };

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return {
      id: persona.id,
      name: persona.name,
      family: persona.family,
      quizResponse: persona.quizResponse,
      error: error.message
    };
  }
}

async function testAllPersonas() {
  console.log('🚀 Starting persona testing...\n');

  const results: PersonaTest[] = [];

  // Test first 5 personas with full hybrid system
  for (let i = 0; i < Math.min(5, personasData.personas.length); i++) {
    const persona = personasData.personas[i];
    try {
      const result = await testPersona(persona);
      results.push(result);

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`Failed to test ${persona.name}:`, error);
      results.push({
        id: persona.id,
        name: persona.name,
        family: persona.family,
        quizResponse: persona.quizResponse,
        error: `Test failed: ${error.message}`
      });
    }
  }

  // Save results
  const outputPath = './personas/test-results.json';
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalPersonas: results.length,
    successful: results.filter(r => !r.error).length,
    failed: results.filter(r => r.error).length,
    results
  }, null, 2));

  console.log(`\n📊 Testing complete! Results saved to ${outputPath}`);

  // Summary statistics
  const successful = results.filter(r => !r.error);
  if (successful.length > 0) {
    const avgMatchScore = successful.reduce((sum, r) => sum + (r.results?.matchScore || 0), 0) / successful.length;
    const avgProcessingTime = successful.reduce((sum, r) => sum + (r.results?.processingTime || 0), 0) / successful.length;

    console.log(`\n📈 Summary Statistics:`);
    console.log(`✅ Successful tests: ${successful.length}/${results.length}`);
    console.log(`🎯 Average match score: ${avgMatchScore.toFixed(1)}`);
    console.log(`⏱️ Average processing time: ${avgProcessingTime.toFixed(0)}ms`);

    // Provider breakdown
    const providerCounts = {};
    successful.forEach(r => {
      const provider = r.results?.provider || 'unknown';
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    });

    console.log(`\n🔧 Provider Usage:`);
    Object.entries(providerCounts).forEach(([provider, count]) => {
      console.log(`  ${provider}: ${count} tests`);
    });
  }

  if (results.some(r => r.error)) {
    console.log(`\n❌ Failed tests:`);
    results.filter(r => r.error).forEach(r => {
      console.log(`  ${r.name}: ${r.error}`);
    });
  }
}

// Run if called directly
if (require.main === module) {
  testAllPersonas().catch(console.error);
}

export { testAllPersonas, testPersona };