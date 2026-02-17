import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL?.replace('sslmode=require', 'sslmode=verify-full&uselibpqcompat=true'),
  ssl: { rejectUnauthorized: false }
});

pool.on('connect', () => {
  console.log('✓ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
  process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export const getClient = () => pool;
export default pool;
