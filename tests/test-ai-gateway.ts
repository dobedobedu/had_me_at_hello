#!/usr/bin/env tsx

import { config } from 'dotenv';
import path from 'path';
import { generateText } from 'ai';

// Load environment variables
config({ path: path.join(__dirname, '.env.local') });

async function testAIGateway() {
  console.log('Testing AI Gateway connection...');
  console.log('AI_GATEWAY_API_KEY exists:', !!process.env.AI_GATEWAY_API_KEY);

  try {
    // Test with proper AI Gateway configuration
    const result = await generateText({
      model: 'xai/grok-4-fast-non-reasoning',
      prompt: 'Hello, just testing the connection. Respond with just OK.',
      maxTokens: 10
    });
    console.log('✅ AI Gateway working:', result.text);
    return true;
  } catch (error) {
    console.log('❌ AI Gateway error:', error.message);

    // Try with OpenRouter fallback
    console.log('\nTrying OpenRouter fallback...');
    try {
      const fallbackResult = await generateText({
        model: 'x-ai/grok-4-fast:free',
        prompt: 'Hello, just testing the connection. Respond with just OK.',
        maxTokens: 10
      });
      console.log('✅ OpenRouter fallback working:', fallbackResult.text);
      return true;
    } catch (fallbackError) {
      console.log('❌ OpenRouter fallback error:', fallbackError.message);
      return false;
    }
  }
}

if (require.main === module) {
  testAIGateway();
}