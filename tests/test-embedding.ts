#!/usr/bin/env tsx

import { config } from 'dotenv';
import path from 'path';

// Load .env.local file explicitly
config({ path: path.join(process.cwd(), '.env.local') });

async function testEmbeddings() {
  console.log('🚀 Testing Vercel AI Gateway Embeddings...');

  const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY;
  const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'openai/text-embedding-3-small';

  console.log('🔑 API Key found:', AI_GATEWAY_API_KEY ? AI_GATEWAY_API_KEY.substring(0, 10) + '...' : 'None');
  console.log('📋 Model:', EMBEDDING_MODEL);

  try {
    const response = await fetch('https://gateway.ai.vercel.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_GATEWAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: 'This is a test of Vercel AI Gateway embeddings integration for Saint Stephen\'s Episcopal School.'
      })
    });

    if (response.ok) {
      const data = await response.json();
      const embedding = data?.data?.[0]?.embedding;

      console.log('✅ Embeddings API working through Vercel AI Gateway!');
      console.log('📊 Vector dimensions:', embedding?.length || 0);
      console.log('📊 First 5 values:', embedding?.slice(0, 5).join(', ') || 'N/A');
      console.log('📊 Model used:', data?.model || 'Unknown');
      console.log('📊 Usage:', JSON.stringify(data?.usage || {}, null, 2));

      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Embeddings API failed:', response.status, response.statusText);
      console.log('🔍 Error details:', errorText.substring(0, 500));
      return false;
    }
  } catch (error) {
    console.log('❌ Network error:', error);
    return false;
  }
}

async function main() {
  const success = await testEmbeddings();

  if (success) {
    console.log('\n🎉 Vercel AI Gateway integration is fully working!');
    console.log('📝 Both chat (Grok) and embeddings (OpenAI) are routing through Vercel.');
  } else {
    console.log('\n⚠️ Embeddings test failed. Check your API key and model name.');
  }
}

main().catch(console.error);