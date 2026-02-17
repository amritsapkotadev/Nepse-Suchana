import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/services/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const user = await registerUser(name, email, password);

    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        user
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === '23505' || error.message?.includes('already exists')) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
