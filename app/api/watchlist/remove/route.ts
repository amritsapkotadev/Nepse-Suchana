import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { removeFromWatchlist } from '@/lib/services/watchlist';
import { apiCache } from '@/lib/cache';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    const { stock_symbol } = await req.json();
    
    if (!stock_symbol) {
      return NextResponse.json(
        { success: false, error: 'stock_symbol is required' },
        { status: 400 }
      );
    }
    
    const item = await removeFromWatchlist(user.id, stock_symbol);
    
    // Invalidate cache
    apiCache.set(`watchlist:${user.id}`, null, 0);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Stock removed from watchlist',
      data: item 
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to remove stock from watchlist' },
      { status: error.message === 'Stock not found in watchlist' ? 404 : 500 }
    );
  }
}
