import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getPortfolioHoldings, addPortfolioHolding } from '@/lib/services/portfolioHoldings';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const portfolio_id = searchParams.get('portfolio_id');
    
    if (!portfolio_id) {
      return NextResponse.json(
        { success: false, error: 'portfolio_id is required' },
        { status: 400 }
      );
    }
    
    const holdings = await getPortfolioHoldings(user.id, parseInt(portfolio_id));
    return NextResponse.json({ success: true, data: holdings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 404 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    const {
      portfolio_id,
      stock_symbol,
      quantity,
      average_price,
      cash_dividend = 0,
      right_share = 0,
      bonus_share = 0,
      other_note = null
    } = await req.json();
    
    if (portfolio_id === undefined || stock_symbol === undefined || quantity === undefined || average_price === undefined) {
      return NextResponse.json(
        { success: false, error: 'portfolio_id, stock_symbol, quantity, and average_price are required' },
        { status: 400 }
      );
    }
    
    const holding = await addPortfolioHolding(
      user.id,
      portfolio_id,
      stock_symbol,
      quantity,
      average_price,
      cash_dividend,
      right_share,
      bonus_share,
      other_note
    );
    return NextResponse.json({ success: true, data: holding }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { success: false, error: 'Stock already exists in this portfolio' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === 'Portfolio not found' ? 404 : 500 }
    );
  }
}
