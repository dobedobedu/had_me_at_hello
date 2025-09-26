#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from 'dotenv';
import { embed, embedMany } from 'ai';
import RedisService from '../lib/redis';

// Load environment variables
config({ path: path.join(__dirname, '../.env.local') });

// Import knowledge data
import alumniData from '../knowledge/alumni-story.json';
import facultyData from '../knowledge/faculty-story.json';
import currentStudentData from '../knowledge/current-student-stories.json';
import factsData from '../knowledge/facts.json';

interface NormalizedItem {
  id: string;
  category: 'student' | 'faculty' | 'alumni' | 'fact';
  textForEmbedding: string;
  metadata: any;
  hasVideo: boolean;
  gradeRelevance: string[];
}

interface EmbeddingCache {
  items: NormalizedItem[];
  vectors: number[][];
  model: string;
  timestamp: number;
  contentHash: string;
}

// Embedding API configuration
const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'openai/text-embedding-3-small';
const MOCK_MODEL = 'mock-deterministic-v2';

// Determine which embedding method to use (priority: Vercel > OpenAI > Mock)
const useVercelEmbeddings = AI_GATEWAY_API_KEY && AI_GATEWAY_API_KEY !== 'your_ai_gateway_api_key_here';
const useOpenAIEmbeddings = !useVercelEmbeddings && !!OPENAI_API_KEY;
const useRealEmbeddings = useVercelEmbeddings || useOpenAIEmbeddings;

if (useVercelEmbeddings) {
  console.log(`🚀 Using Vercel AI Gateway for embeddings (model: ${EMBEDDING_MODEL})`);
} else if (useOpenAIEmbeddings) {
  console.log(`🔑 Using OpenAI API for embeddings (model: ${EMBEDDING_MODEL})`);
} else {
  console.log(`🔧 Using mock embeddings for development (model: ${MOCK_MODEL})`);
}

function normalizeCorpus(): NormalizedItem[] {
  const allItems: NormalizedItem[] = [];

  // Process current students
  for (const story of currentStudentData.stories) {
    if (!story.gradeLevel && !(story as any).gradeBands) continue; // Skip invalid entries

    const videoContext = (story as any).videoUrl ?
      'authentic video testimonial available compelling visual story student voice' : '';

    const textForEmbedding = [
      `Student: ${story.firstName}`,
      `Story: ${story.achievement}`,
      `Interests: ${story.interests.join(', ')}`,
      story.storyTldr ? `Summary: ${story.storyTldr}` : '',
      (story as any).personaDescriptors ? `Personality: ${(story as any).personaDescriptors.join(', ')}` : '',
      (story as any).interestKeywords ? `Keywords: ${(story as any).interestKeywords.join(', ')}` : '',
      videoContext,
      story.gradeLevel ? `Grade: ${story.gradeLevel}` : '',
      (story as any).gradeBands ? `Grades: ${(story as any).gradeBands.join('/')}` : '',
      story.parentQuote ? `Parent: "${story.parentQuote}"` : '',
      story.studentQuote ? `Student: "${story.studentQuote}"` : ''
    ].filter(Boolean).join('. ');

    allItems.push({
      id: story.id,
      category: 'student',
      textForEmbedding,
      metadata: story,
      hasVideo: !!(story as any).videoUrl,
      gradeRelevance: (story as any).gradeBands || (story.gradeLevel ? [story.gradeLevel] : [])
    });
  }

  // Process alumni
  for (const story of alumniData.stories) {
    const videoContext = (story as any).videoUrl ?
      'authentic video testimonial available compelling alumni story graduate perspective' : '';

    const textForEmbedding = [
      `Alumni: ${story.firstName} ${(story as any).lastName || ''}`,
      (story as any).classYear ? `Class of ${(story as any).classYear}` : '',
      (story as any).currentRole ? `Role: ${(story as any).currentRole}` : '',
      `Achievement: ${story.achievement}`,
      `Interests: ${story.interests.join(', ')}`,
      story.storyTldr ? `Summary: ${story.storyTldr}` : '',
      (story as any).quote ? `Quote: "${(story as any).quote}"` : '',
      videoContext,
      story.gradeLevel ? `Grade: ${story.gradeLevel}` : ''
    ].filter(Boolean).join('. ');

    allItems.push({
      id: story.id,
      category: 'alumni',
      textForEmbedding,
      metadata: story,
      hasVideo: !!(story as any).videoUrl,
      gradeRelevance: [story.gradeLevel || 'all']
    });
  }

  // Process faculty
  for (const faculty of facultyData.faculty) {
    const videoContext = faculty.videoUrl ?
      'authentic video testimonial available compelling teacher story faculty perspective teaching philosophy' : '';

    const textForEmbedding = [
      `Faculty: ${faculty.formalTitle || ''} ${faculty.firstName} ${faculty.lastName || ''}`,
      `Title: ${faculty.title}`,
      faculty.department ? `Department: ${faculty.department}` : '',
      `Specializes: ${faculty.specializesIn.join(', ')}`,
      `Why Students Love: ${faculty.whyStudentsLoveThem}`,
      (faculty as any).gradeBands ? `Grades: ${(faculty as any).gradeBands.join('/')}` : '',
      (faculty as any).interestKeywords ? `Keywords: ${(faculty as any).interestKeywords.join(', ')}` : '',
      (faculty as any).personaDescriptors ? `Personality: ${(faculty as any).personaDescriptors.join(', ')}` : '',
      videoContext,
      faculty.yearsAtSSES ? `Experience: ${faculty.yearsAtSSES} years` : '',
      faculty.awards ? `Awards: ${faculty.awards.join(', ')}` : ''
    ].filter(Boolean).join('. ');

    allItems.push({
      id: faculty.id,
      category: 'faculty',
      textForEmbedding,
      metadata: faculty,
      hasVideo: !!faculty.videoUrl,
      gradeRelevance: (faculty as any).gradeBands || ['all']
    });
  }

  console.log(`Normalized ${allItems.length} items:`);
  console.log(`- Students: ${allItems.filter(i => i.category === 'student').length}`);
  console.log(`- Faculty: ${allItems.filter(i => i.category === 'faculty').length}`);
  console.log(`- Alumni: ${allItems.filter(i => i.category === 'alumni').length}`);
  console.log(`- With Videos: ${allItems.filter(i => i.hasVideo).length}`);

  return allItems;
}

function calculateContentHash(items: NormalizedItem[]): string {
  const content = items.map(item => item.textForEmbedding).join('|');
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

async function generateEmbedding(text: string): Promise<number[]> {
  if (useVercelEmbeddings) {
    return generateVercelEmbedding(text);
  } else if (useOpenAIEmbeddings) {
    return generateOpenAIEmbedding(text);
  } else {
    return generateMockEmbedding(text);
  }
}

async function generateVercelEmbedding(text: string): Promise<number[]> {
  const result = await embed({
    model: EMBEDDING_MODEL,
    value: text,
  });

  return result.embedding;
}

async function generateOpenAIEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL.replace('openai/', ''), // Remove provider prefix for direct OpenAI
      input: text
    })
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error('OpenAI API Response:', responseText);
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  try {
    const data = JSON.parse(responseText);
    return data.data[0].embedding;
  } catch (error) {
    console.error('Failed to parse JSON response:', responseText.substring(0, 500));
    throw new Error('Invalid JSON response from OpenAI API');
  }
}

function generateMockEmbedding(text: string): Promise<number[]> {
  // Use the same deterministic method as the semantic-search service
  const hash = crypto.createHash('md5').update(text).digest('hex');
  const dimensions = 1536;
  const vector: number[] = [];

  for (let i = 0; i < dimensions; i++) {
    const charCode = hash.charCodeAt(i % hash.length);
    vector.push((charCode - 128) / 128);
  }

  return Promise.resolve(vector);
}

async function generateEmbeddingsBatch(texts: string[], batchSize = 10): Promise<number[][]> {
  if (useVercelEmbeddings) {
    // Use AI SDK's embedMany for efficient batch processing
    console.log('📦 Using AI SDK batch embedding...');
    try {
      const result = await embedMany({
        model: EMBEDDING_MODEL,
        values: texts,
      });

      return result.embeddings;
    } catch (error) {
      console.error('AI SDK batch embedding failed, falling back to individual calls:', error);
      // Fall through to individual processing
    }
  }

  // Fallback to individual calls for OpenAI direct or mock embeddings
  const vectors: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(texts.length/batchSize)} (${batch.length} items)`);

    // Process batch items sequentially to avoid rate limits
    for (const text of batch) {
      try {
        const vector = await generateEmbedding(text);
        vectors.push(vector);

        // Small delay to be respectful to API
        if (!useVercelEmbeddings) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Failed to embed text: ${text.substring(0, 50)}...`);
        throw error;
      }
    }
  }

  return vectors;
}

async function main() {
  console.log('🚀 Building embeddings cache...');

  try {
    // 1. Normalize the corpus
    const items = normalizeCorpus();

    // 2. Calculate content hash
    const contentHash = calculateContentHash(items);

    // 3. Check if cache is up to date
    const cacheFile = path.join(__dirname, '../knowledge/.cache/embeddings.json');
    let existingCache: EmbeddingCache | null = null;

    if (fs.existsSync(cacheFile)) {
      try {
        existingCache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));

        const expectedModel = useRealEmbeddings ? EMBEDDING_MODEL : MOCK_MODEL;
        if (existingCache.contentHash === contentHash && existingCache.model === expectedModel) {
          console.log('✅ Embeddings cache is up to date, skipping generation');
          return;
        } else {
          console.log('📝 Content or model changed, regenerating embeddings...');
          console.log(`   Previous: ${existingCache.model}, Current: ${expectedModel}`);
        }
      } catch (error) {
        console.log('⚠️ Existing cache is invalid, regenerating...');
      }
    }

    // 4. Generate embeddings
    console.log(`🔄 Generating embeddings for ${items.length} items...`);
    const startTime = Date.now();

    const texts = items.map(item => item.textForEmbedding);
    const vectors = await generateEmbeddingsBatch(texts);

    const endTime = Date.now();
    console.log(`✅ Generated ${vectors.length} embeddings in ${endTime - startTime}ms`);

    // 5. Build cache object
    const cache: EmbeddingCache = {
      items,
      vectors,
      model: useRealEmbeddings ? EMBEDDING_MODEL : MOCK_MODEL,
      timestamp: Date.now(),
      contentHash
    };

    // 6. Write cache file
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));

    console.log(`💾 Saved embeddings cache to ${cacheFile}`);
    console.log(`📊 Cache stats: ${items.length} items, ${vectors[0]?.length || 0} dimensions, ${Math.round(fs.statSync(cacheFile).size / 1024)}KB`);

    // 7. Also cache to Redis for faster runtime access
    try {
      const redis = RedisService.getInstance();
      const cacheKey = RedisService.getEmbeddingsCacheKey();
      await redis.setJson(cacheKey, cache, 86400); // 24 hours
      console.log(`🔗 Also cached embeddings to Redis for faster access`);
    } catch (redisError) {
      console.warn('⚠️ Failed to cache to Redis (continuing anyway):', redisError);
    }

  } catch (error) {
    console.error('❌ Failed to build embeddings:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as buildEmbeddings, normalizeCorpus, calculateContentHash };