import { NextResponse } from 'next/server';
import { createClient } from 'redis';

// Redis client for Upstash
let redis: any = null;

async function getRedisClient() {
  if (!redis) {
    redis = createClient({
      url: process.env.REDIS_URL,
    });
    await redis.connect();
  }
  return redis;
}

// Fallback in-memory storage for development
const tourPassStorage = new Map<string, any>();

export async function GET(
  request: Request,
  { params }: { params: { tourId: string } }
) {
  const { tourId } = params;

  try {
    let data = null;
    
    // Try Redis first (if configured)
    if (process.env.REDIS_URL) {
      const client = await getRedisClient();
      const result = await client.get(`tour:${tourId}`);
      if (result) {
        data = JSON.parse(result);
      }
    } else {
      // Fallback to in-memory storage for development
      data = tourPassStorage.get(`tour:${tourId}`);
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Tour pass not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tour pass:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tour pass' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { tourId: string } }
) {
  const { tourId } = params;
  
  try {
    const data = await request.json();
    
    // Store in Redis (if configured) or fallback to memory
    if (process.env.REDIS_URL) {
      const client = await getRedisClient();
      // Store with 30 days expiry (2592000 seconds)
      await client.setEx(`tour:${tourId}`, 2592000, JSON.stringify(data));
    } else {
      // Fallback to in-memory storage for development
      tourPassStorage.set(`tour:${tourId}`, data);
    }
    
    return NextResponse.json({ success: true, tourId });
  } catch (error) {
    console.error('Error saving tour pass:', error);
    return NextResponse.json(
      { error: 'Failed to save tour pass' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { tourId: string } }
) {
  const { tourId } = params;
  
  try {
    const updates = await request.json();
    
    let existingData = null;
    
    // Get existing data from Redis or memory
    if (process.env.REDIS_URL) {
      const client = await getRedisClient();
      const result = await client.get(`tour:${tourId}`);
      if (result) {
        existingData = JSON.parse(result);
      }
    } else {
      existingData = tourPassStorage.get(`tour:${tourId}`);
    }
    
    if (!existingData) {
      return NextResponse.json(
        { error: 'Tour pass not found' },
        { status: 404 }
      );
    }
    
    // Merge updates
    const updatedData = {
      ...existingData,
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    // Save updated data
    if (process.env.REDIS_URL) {
      const client = await getRedisClient();
      await client.setEx(`tour:${tourId}`, 2592000, JSON.stringify(updatedData));
    } else {
      tourPassStorage.set(`tour:${tourId}`, updatedData);
    }
    
    return NextResponse.json({ success: true, data: updatedData });
  } catch (error) {
    console.error('Error updating tour pass:', error);
    return NextResponse.json(
      { error: 'Failed to update tour pass' },
      { status: 500 }
    );
  }
}