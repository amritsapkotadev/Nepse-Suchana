import { NextResponse } from 'next/server';
import { fetchStocks } from '@/lib/services/stocks';
import { apiCache } from '@/lib/cache';

export const runtime = 'nodejs';

const CACHE_KEY = 'stocks-data';
const CACHE_TTL = 30; // 30 seconds

export async function GET() {
  try {
    // Check cache first
    const cached = apiCache.get(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }
    
    const data = await fetchStocks();
    
    // Cache the response
    apiCache.set(CACHE_KEY, data, CACHE_TTL);
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
