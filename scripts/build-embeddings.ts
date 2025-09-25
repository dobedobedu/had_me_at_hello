#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from 'dotenv';

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

// OpenRouter embedding configuration
const EMBEDDING_MODEL = 'openai/text-embedding-ada-002';  // Use more reliable model
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

if (!OPENROUTER_API_KEY) {
  console.error('OPENROUTER_API_KEY environment variable is required');
  process.exit(1);
}

function normalizeCorpus(): NormalizedItem[] {
  const allItems: NormalizedItem[] = [];

  // Process current students
  for (const story of currentStudentData.stories) {
    if (!story.gradeLevel && !(story as any).gradeBands) continue; // Skip invalid entries

    const textForEmbedding = [
      `Student: ${story.firstName}`,
      `Story: ${story.achievement}`,
      `Interests: ${story.interests.join(', ')}`,
      story.storyTldr ? `Summary: ${story.storyTldr}` : '',
      (story as any).personaDescriptors ? `Personality: ${(story as any).personaDescriptors.join(', ')}` : '',
      (story as any).interestKeywords ? `Keywords: ${(story as any).interestKeywords.join(', ')}` : '',
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
    const textForEmbedding = [
      `Alumni: ${story.firstName} ${(story as any).lastName || ''}`,
      (story as any).classYear ? `Class of ${(story as any).classYear}` : '',
      (story as any).currentRole ? `Role: ${(story as any).currentRole}` : '',
      `Achievement: ${story.achievement}`,
      `Interests: ${story.interests.join(', ')}`,
      story.storyTldr ? `Summary: ${story.storyTldr}` : '',
      (story as any).quote ? `Quote: "${(story as any).quote}"` : '',
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
    const textForEmbedding = [
      `Faculty: ${faculty.formalTitle || ''} ${faculty.firstName} ${faculty.lastName || ''}`,
      `Title: ${faculty.title}`,
      faculty.department ? `Department: ${faculty.department}` : '',
      `Specializes: ${faculty.specializesIn.join(', ')}`,
      `Why Students Love: ${faculty.whyStudentsLoveThem}`,
      (faculty as any).gradeBands ? `Grades: ${(faculty as any).gradeBands.join('/')}` : '',
      (faculty as any).interestKeywords ? `Keywords: ${(faculty as any).interestKeywords.join(', ')}` : '',
      (faculty as any).personaDescriptors ? `Personality: ${(faculty as any).personaDescriptors.join(', ')}` : '',
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
  const response = await fetch(`${OPENROUTER_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text
    })
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error('API Response:', responseText);
    throw new Error(`Embedding API error: ${response.status} ${response.statusText}`);
  }

  try {
    const data = JSON.parse(responseText);
    return data.data[0].embedding;
  } catch (error) {
    console.error('Failed to parse JSON response:', responseText.substring(0, 500));
    throw new Error('Invalid JSON response from embedding API');
  }
}

async function generateEmbeddingsBatch(texts: string[], batchSize = 10): Promise<number[][]> {
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
        await new Promise(resolve => setTimeout(resolve, 100));
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

        if (existingCache.contentHash === contentHash && existingCache.model === EMBEDDING_MODEL) {
          console.log('✅ Embeddings cache is up to date, skipping generation');
          return;
        } else {
          console.log('📝 Content changed, regenerating embeddings...');
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
      model: EMBEDDING_MODEL,
      timestamp: Date.now(),
      contentHash
    };

    // 6. Write cache file
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));

    console.log(`💾 Saved embeddings cache to ${cacheFile}`);
    console.log(`📊 Cache stats: ${items.length} items, ${vectors[0]?.length || 0} dimensions, ${Math.round(fs.statSync(cacheFile).size / 1024)}KB`);

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