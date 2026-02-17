import { NextResponse } from 'next/server';
import { fetchStocks } from '@/lib/services/stocks';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const data = await fetchStocks();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
