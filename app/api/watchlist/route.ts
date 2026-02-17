import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getUserWatchlist, addToWatchlist, removeFromWatchlist } from '@/lib/services/watchlist';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    const watchlist = await getUserWatchlist(user.id);
    return NextResponse.json({ success: true, data: watchlist });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

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
    
    const item = await addToWatchlist(user.id, stock_symbol);
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    if (error.code === '23505' || error.message?.includes('already')) {
      return NextResponse.json(
        { success: false, error: 'Stock already in watchlist' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
