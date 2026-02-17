import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { removeFromWatchlist } from '@/lib/services/watchlist';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    const { userId, stockSymbol } = await req.json();
    
    if (!stockSymbol) {
      return NextResponse.json(
        { success: false, error: 'stockSymbol is required' },
        { status: 400 }
      );
    }
    
    const item = await removeFromWatchlist(user.id, stockSymbol);
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
