import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const result = await query('SELECT NOW()');
    return NextResponse.json({
      success: true,
      status: 'ok',
      message: 'Server and database are running',
      timestamp: result.rows[0].now
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        status: 'error',
        message: 'Database connection failed',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
