import { query } from '../db';

export interface WatchlistItem {
  id: number;
  user_id: number;
  stock_symbol: string;
  created_at?: Date;
}

export async function getUserWatchlist(userId: number): Promise<WatchlistItem[]> {
  const result = await query(
    'SELECT * FROM watchlist WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  
  return result.rows;
}

export async function addToWatchlist(userId: number, stockSymbol: string): Promise<WatchlistItem> {
  const result = await query(
    'INSERT INTO watchlist (user_id, stock_symbol) VALUES ($1, $2) RETURNING *',
    [userId, stockSymbol]
  );
  
  return result.rows[0];
}

export async function removeFromWatchlist(userId: number, stockSymbol: string): Promise<WatchlistItem> {
  const result = await query(
    'DELETE FROM watchlist WHERE user_id=$1 AND stock_symbol=$2 RETURNING *',
    [userId, stockSymbol]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Stock not found in watchlist');
  }
  
  return result.rows[0];
}

export async function getWatchlistByUserId(targetUserId: number): Promise<WatchlistItem[]> {
  const result = await query(
    'SELECT * FROM watchlist WHERE user_id=$1',
    [targetUserId]
  );
  
  return result.rows;
}
