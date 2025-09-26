#!/usr/bin/env tsx

import { config } from 'dotenv';
import path from 'path';

// Load .env.local file explicitly
config({ path: path.join(process.cwd(), '.env.local') });

async function testVercelAIGateway() {
  const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY;

  if (!AI_GATEWAY_API_KEY) {
    console.log('❌ AI_GATEWAY_API_KEY not found in environment');
    console.log('   Get your key from: https://vercel.com/[team]/~/ai');
    return;
  }

  console.log('✅ AI_GATEWAY_API_KEY found:', AI_GATEWAY_API_KEY.substring(0, 10) + '...');

  console.log('🚀 Testing Vercel AI Gateway...\n');

  // Test 1: Chat Completions
  try {
    console.log('1️⃣  Testing Chat Completions...');
    const chatResponse = await fetch('https://gateway.ai.vercel.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_GATEWAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.CHAT_MODEL || 'x-ai/grok-4-fast-non-reasoning',
        messages: [
          { role: 'user', content: 'Say "Hello from Vercel AI Gateway!" in exactly that format.' }
        ],
        max_tokens: 50,
        temperature: 0.1
      })
    });

    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      const message = chatData?.choices?.[0]?.message?.content;
      console.log('   ✅ Chat API working!');
      console.log(`   📝 Response: ${message}`);
    } else {
      const errorText = await chatResponse.text();
      console.log('   ❌ Chat API failed:', chatResponse.status, errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('   ❌ Chat API error:', error);
  }

  console.log('');

  // Test 2: Embeddings
  try {
    console.log('2️⃣  Testing Embeddings...');
    const embeddingResponse = await fetch('https://gateway.ai.vercel.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_GATEWAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.EMBEDDING_MODEL || 'openai/text-embedding-3-small',
        input: 'This is a test embedding.'
      })
    });

    if (embeddingResponse.ok) {
      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData?.data?.[0]?.embedding;
      console.log('   ✅ Embedding API working!');
      console.log(`   📊 Vector dimensions: ${embedding?.length || 0}`);
      console.log(`   📊 First 3 values: [${embedding?.slice(0, 3).join(', ')}...]`);
    } else {
      const errorText = await embeddingResponse.text();
      console.log('   ❌ Embedding API failed:', embeddingResponse.status, errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('   ❌ Embedding API error:', error);
  }

  console.log('\n🏁 Test complete! If both APIs are working, you\'re ready to use Vercel AI Gateway.');
}

testVercelAIGateway().catch(console.error);