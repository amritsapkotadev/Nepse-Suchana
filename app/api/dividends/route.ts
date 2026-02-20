import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { addDividend, getDividends, deleteDividend } from '@/lib/services/dividends';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const portfolio_id = searchParams.get('portfolio_id');
    
    if (!portfolio_id) {
      return NextResponse.json(
        { success: false, error: 'portfolio_id is required' },
        { status: 400 }
      );
    }
    
    const dividends = await getDividends(parseInt(portfolio_id));
    return NextResponse.json({ success: true, data: dividends });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await verifyAuth(req);
    const { portfolio_id, stock_symbol, type, value, date, notes } = await req.json();
    
    if (!portfolio_id || !stock_symbol || !type || value === undefined || !date) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    const dividend = await addDividend(portfolio_id, stock_symbol, type, value, date, notes);
    return NextResponse.json({ success: true, data: dividend }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message.includes('does not exist') ? 400 : 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }
    
    await deleteDividend(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
