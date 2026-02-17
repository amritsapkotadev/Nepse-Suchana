import bcrypt from 'bcrypt';
import { query } from '../db';
import { generateToken } from '../auth';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash?: string;
  created_at?: Date;
}

export async function registerUser(name: string, email: string, password: string) {
  const hash = await bcrypt.hash(password, 10);
  
  const result = await query(
    `INSERT INTO users (name, password_hash, email)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, hash, email]
  );
  
  return result.rows[0];
}

export async function loginUser(email: string, password: string) {
  const result = await query(
    `SELECT id, name, email, password_hash, created_at
     FROM users
     WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  
  if (!match) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken({ id: user.id, email: user.email, name: user.name });
  
  const { password_hash, ...userWithoutPassword } = user;
  
  return { user: userWithoutPassword, token };
}
