import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  
  // Clear the token cookie
  response.cookies.set('token', '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    expires: new Date(0)
  });
  
  return response;
}
