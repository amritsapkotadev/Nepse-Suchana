import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { createPortfolio, getUserPortfolios } from '@/lib/services/portfolio';
import { apiCache } from '@/lib/cache';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    const cacheKey = `portfolios:${user.id}`;
    
    // Check cache first
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }
    
    const portfolios = await getUserPortfolios(user.id);
    
    // Cache for 10 seconds
    apiCache.set(cacheKey, portfolios, 10);
    
    return NextResponse.json({ success: true, data: portfolios });
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
    const { name, initial_balance, description } = await req.json();
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Portfolio name is required' },
        { status: 400 }
      );
    }
    
    const portfolio = await createPortfolio(user.id, name, initial_balance || 0, description);
    return NextResponse.json({ success: true, data: portfolio }, { status: 201 });
  } catch (error: any) {
    const status = error.message === 'Portfolio limit reached' ? 400 :
                   error.message === 'Portfolio name already exists' ? 400 : 500;
    return NextResponse.json(
      { success: false, error: error.message },
      { status }
    );
  }
}
