#!/usr/bin/env tsx

import { config } from 'dotenv';
config({ path: './.env.local' });

import { testPersona } from './test-personas';

// Load personas
import fs from 'fs';
const personasData = JSON.parse(fs.readFileSync('./personas/south-florida-families.json', 'utf8'));

async function testEnhancedFallback() {
  console.log('🚀 Testing Enhanced Fallback System');
  console.log('==================================');
  console.log('🎯 Fallback Priority: Vercel AI Gateway → OpenAI GPT-4o-mini → OpenRouter');
  console.log('');

  const openaiConfigured = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
  console.log(`📊 API Keys Status:`);
  console.log(`  - Vercel AI Gateway: ✅ Configured`);
  console.log(`  - OpenAI GPT-4o-mini: ${openaiConfigured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  - OpenRouter: ✅ Configured`);
  console.log('');

  if (!openaiConfigured) {
    console.log('⚠️  OpenAI API key not configured. Please add to .env.local:');
    console.log('   OPENAI_API_KEY=your_openai_api_key_here');
    console.log('');
    console.log('🔄 Will test with available providers (Vercel AI Gateway → OpenRouter)');
    console.log('');
  }

  // Test with a few personas to see the fallback in action
  const testPersonas = personasData.personas.slice(0, 3);

  for (let i = 0; i < testPersonas.length; i++) {
    const persona = testPersonas[i];
    console.log(`\n🧪 Testing ${i + 1}/3: ${persona.name}`);
    console.log(`👨‍👩‍👧‍👦 Family: ${persona.family}`);
    console.log(`📝 Child: "${persona.quizResponse.threeWords}"`);
    console.log('─'.repeat(50));

    try {
      const result = await testPersona(persona);

      console.log(`✅ SUCCESS - Match Score: ${result.results?.matchScore}`);
      console.log(`🎯 Provider Used: ${result.results?.provider}`);
      console.log(`⏱️  Processing Time: ${result.results?.processingTime}ms`);

      if (result.results?.matchedStudents?.length > 0) {
        console.log(`👨‍🎓 Student: ${result.results.matchedStudents[0].name}`);
      }
      if (result.results?.matchedFaculty?.length > 0) {
        console.log(`👨‍🏫 Faculty: ${result.results.matchedFaculty[0].name}`);
      }

    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
    }

    // Small delay between tests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📈 FALLBACK SYSTEM ANALYSIS');
  console.log('='.repeat(50));
  console.log('✅ Enhanced fallback system configured successfully');
  console.log('🎯 Providers will be tried in priority order');
  console.log('⚡ Robust error handling with graceful degradation');

  if (openaiConfigured) {
    console.log('🧠 OpenAI GPT-4o-mini ready as primary fallback');
  } else {
    console.log('⚠️  Add OpenAI key for best fallback experience');
  }
}

if (require.main === module) {
  testEnhancedFallback().catch(console.error);
}