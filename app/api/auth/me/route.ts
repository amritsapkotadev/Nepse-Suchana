import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    
    const result = await query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 401 }
    );
  }
}
