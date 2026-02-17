import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export async function verifyAuth(req: NextRequest): Promise<AuthUser> {
  const token = req.cookies.get('token')?.value || req.headers.get('authorization')?.split(' ')[1];
  
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
}

export function generateToken(user: { id: number; email: string; name: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
