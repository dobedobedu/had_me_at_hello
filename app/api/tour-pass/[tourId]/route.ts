import { NextResponse } from 'next/server';
import { createClient } from 'redis';

// Fallback in-memory storage for development
const tourPassStorage = new Map<string, any>();

// Helper function to get Redis client
async function getRedisClient() {
  if (!process.env.REDIS_URL) return null;
  return await createClient({ url: process.env.REDIS_URL }).connect();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tourId: string }> }
) {
  const { tourId } = await params;

  try {
    let data = null;
    
    // Try Redis first (if configured)
    const redis = await getRedisClient();
    if (redis) {
      const result = await redis.get(`tour:${tourId}`);
      if (result) {
        data = JSON.parse(result);
      }
      await redis.disconnect();
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
  { params }: { params: Promise<{ tourId: string }> }
) {
  const { tourId } = await params;
  
  try {
    const data = await request.json();
    
    // Store in Redis (if configured) or fallback to memory
    const redis = await getRedisClient();
    if (redis) {
      // Store with 30 days expiry (2592000 seconds)
      await redis.setEx(`tour:${tourId}`, 2592000, JSON.stringify(data));
      await redis.disconnect();
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
  { params }: { params: Promise<{ tourId: string }> }
) {
  const { tourId } = await params;
  
  try {
    const updates = await request.json();
    
    let existingData = null;
    
    // Get existing data from Redis or memory
    const redis = await getRedisClient();
    if (redis) {
      const result = await redis.get(`tour:${tourId}`);
      if (result) {
        existingData = JSON.parse(result);
      }
    } else {
      existingData = tourPassStorage.get(`tour:${tourId}`);
    }
    
    if (!existingData) {
      if (redis) await redis.disconnect();
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
    if (redis) {
      await redis.setEx(`tour:${tourId}`, 2592000, JSON.stringify(updatedData));
      await redis.disconnect();
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