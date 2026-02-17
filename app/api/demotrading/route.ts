import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import {
  createDemoTradingAccount,
  getDemoTradingAccount,
  updateDemoTradingAccount,
  createDemoTradingTransaction,
  deleteDemoTradingTransaction
} from '@/lib/services/demotrading';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    const account = await getDemoTradingAccount(user.id);
    return NextResponse.json({ success: true, data: account });
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
    const body = await req.json();
    
    if (body.stock_symbol && body.side && body.quantity && body.price) {
      const { demotrading_id, stock_symbol, side, quantity, price } = body;
      const transaction = await createDemoTradingTransaction(
        user.id,
        demotrading_id,
        stock_symbol,
        side,
        quantity,
        price
      );
      return NextResponse.json({ success: true, data: transaction }, { status: 201 });
    }
    
    const account = await createDemoTradingAccount(user.id);
    return NextResponse.json({ success: true, data: account }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    const { current_balance } = await req.json();
    
    if (typeof current_balance !== 'number') {
      return NextResponse.json(
        { success: false, error: 'current_balance (number) is required' },
        { status: 400 }
      );
    }
    
    const account = await updateDemoTradingAccount(user.id, current_balance);
    return NextResponse.json({ success: true, data: account });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }
    
    await deleteDemoTradingTransaction(user.id, parseInt(id));
    return NextResponse.json({ success: true, message: 'Transaction deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 404 }
    );
  }
}
