import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import {
  createDemoTradingAccount,
  getDemoTradingAccount,
  updateDemoTradingAccount,
  createDemoTradingTransaction,
  deleteDemoTradingTransaction,
  getDemoTradingTransactions
} from '@/lib/services/demotrading';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    try {
      const account = await getDemoTradingAccount(user.id);
      const transactions = await getDemoTradingTransactions(account.id, user.id);
      return NextResponse.json({ 
        success: true, 
        data: { ...account, transactions } 
      });
    } catch (err: any) {
      if (err.message === 'Demo trading account not found') {
        return NextResponse.json({ 
          success: true, 
          data: null 
        });
      }
      throw err;
    }
  } catch (error: any) {
    const status = error.message.includes('No token') || error.message.includes('Invalid') || error.message.includes('not found') ? 401 : 500;
    return NextResponse.json(
      { success: false, error: error.message },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    const contentType = req.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const account = await createDemoTradingAccount(user.id);
      return NextResponse.json({ success: true, data: account }, { status: 201 });
    }
    
    const bodyText = await req.text();
    
    if (!bodyText || bodyText.trim() === '') {
      const account = await createDemoTradingAccount(user.id);
      return NextResponse.json({ success: true, data: account }, { status: 201 });
    }
    
    const body = JSON.parse(bodyText);
    
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
