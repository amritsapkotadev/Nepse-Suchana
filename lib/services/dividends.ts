import { query } from '../db';

export interface Dividend {
  id: number;
  portfolio_id: number;
  stock_symbol: string;
  type: string;
  value: number | string;
  date: string;
  notes?: string;
  created_at?: Date;
}

export async function addDividend(
  portfolioId: number,
  stockSymbol: string,
  type: string,
  value: number,
  date: string,
  notes?: string
): Promise<Dividend> {
  const portfolioCheck = await query('SELECT id FROM portfolios WHERE id = $1', [portfolioId]);
  
  if (portfolioCheck.rows.length === 0) {
    throw new Error('Portfolio does not exist. Please provide a valid portfolio_id.');
  }
  
  const result = await query(
    `INSERT INTO dividends (portfolio_id, stock_symbol, type, value, date, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [portfolioId, stockSymbol, type, value, date, notes]
  );
  
  return result.rows[0];
}

export async function getDividends(portfolioId: number): Promise<Dividend[]> {
  const result = await query('SELECT * FROM dividends WHERE portfolio_id = $1', [portfolioId]);
  return result.rows;
}

export async function deleteDividend(dividendId: number): Promise<void> {
  await query('DELETE FROM dividends WHERE id = $1', [dividendId]);
}
