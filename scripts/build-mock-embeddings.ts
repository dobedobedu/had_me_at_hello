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

function normalizeCorpus(): NormalizedItem[] {
  const allItems: NormalizedItem[] = [];

  // Process current students
  for (const story of currentStudentData.stories) {
    if (!story.gradeLevel && !(story as any).gradeBands) continue;

    const textForEmbedding = [
      `Student: ${story.firstName}`,
      `Story: ${story.achievement}`,
      `Interests: ${story.interests.join(', ')}`,
      story.storyTldr ? `Summary: ${story.storyTldr}` : '',
      (story as any).personaDescriptors ? `Personality: ${(story as any).personaDescriptors.join(', ')}` : '',
      (story as any).interestKeywords ? `Keywords: ${(story as any).interestKeywords.join(', ')}` : '',
      story.gradeLevel ? `Grade: ${story.gradeLevel}` : '',
      (story as any).gradeBands ? `Grades: ${(story as any).gradeBands.join('/')}` : ''
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
      story.storyTldr ? `Summary: ${story.storyTldr}` : ''
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
      (faculty as any).gradeBands ? `Grades: ${(faculty as any).gradeBands.join('/')}` : ''
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

function generateMockEmbedding(text: string): number[] {
  // Create a deterministic "embedding" based on text content
  const hash = crypto.createHash('md5').update(text).digest('hex');
  const dimensions = 1536; // Standard embedding dimension
  const vector: number[] = [];

  for (let i = 0; i < dimensions; i++) {
    const charCode = hash.charCodeAt(i % hash.length);
    // Normalize to [-1, 1] range like real embeddings
    vector.push((charCode - 128) / 128);
  }

  return vector;
}

function calculateContentHash(items: NormalizedItem[]): string {
  const content = items.map(item => item.textForEmbedding).join('|');
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

async function main() {
  console.log('🚀 Building mock embeddings cache...');

  try {
    // 1. Normalize the corpus
    const items = normalizeCorpus();

    // 2. Calculate content hash
    const contentHash = calculateContentHash(items);

    // 3. Generate mock embeddings
    console.log(`🔄 Generating mock embeddings for ${items.length} items...`);
    const startTime = Date.now();

    const vectors = items.map(item => generateMockEmbedding(item.textForEmbedding));

    const endTime = Date.now();
    console.log(`✅ Generated ${vectors.length} mock embeddings in ${endTime - startTime}ms`);

    // 4. Build cache object
    const cache: EmbeddingCache = {
      items,
      vectors,
      model: 'mock-deterministic-v1',
      timestamp: Date.now(),
      contentHash
    };

    // 5. Write cache file
    const cacheFile = path.join(__dirname, '../knowledge/.cache/embeddings.json');
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));

    console.log(`💾 Saved mock embeddings cache to ${cacheFile}`);
    console.log(`📊 Cache stats: ${items.length} items, ${vectors[0]?.length || 0} dimensions, ${Math.round(fs.statSync(cacheFile).size / 1024)}KB`);

  } catch (error) {
    console.error('❌ Failed to build mock embeddings:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}