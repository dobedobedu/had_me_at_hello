import { streamText } from 'ai';
import { config } from 'dotenv';
import path from 'path';

// Load .env.local file explicitly
config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  console.log('🚀 Testing Vercel AI Gateway with AI SDK...');

  const correctModel = process.env.CHAT_MODEL || 'xai/grok-4-fast-non-reasoning';
  console.log('📋 Using correct Vercel model:', correctModel);

  const result = streamText({
    model: correctModel,
    prompt: 'You are testing the Vercel AI Gateway integration with the correct Grok model name. Please respond with "✅ Vercel AI Gateway + Grok is working correctly!" and briefly explain that you are Grok running through Vercel AI Gateway.',
  });

  console.log('📝 Response:');
  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }

  console.log();
  console.log();
  console.log('📊 Token usage:', await result.usage);
  console.log('🏁 Finish reason:', await result.finishReason);
}

main().catch(console.error);