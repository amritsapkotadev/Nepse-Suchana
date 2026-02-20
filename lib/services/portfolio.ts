import { query } from '../db';

export interface Portfolio {
  id: number;
  user_id: number;
  name: string;
  initial_balance: number;
  current_balance: number;
  description?: string;
  created_at?: Date;
  deleted_at?: Date;
}

export async function createPortfolio(
  userId: number,
  name: string,
  initialBalance: number = 0,
  description?: string
): Promise<Portfolio> {
  const countResult = await query(
    'SELECT COUNT(*) FROM portfolios WHERE user_id = $1 AND deleted_at IS NULL',
    [userId]
  );
  
  if (parseInt(countResult.rows[0].count) >= 5) {
    throw new Error('Portfolio limit reached');
  }
  
  const nameResult = await query(
    'SELECT 1 FROM portfolios WHERE user_id = $1 AND name = $2 AND deleted_at IS NULL',
    [userId, name]
  );
  
  if (nameResult.rows.length > 0) {
    throw new Error('Portfolio name already exists');
  }
  
  const result = await query(
    `INSERT INTO portfolios (user_id, name, initial_balance, current_balance, description)
     VALUES ($1, $2, $3, $3, $4) RETURNING *`,
    [userId, name, initialBalance, description || null]
  );
  
  return result.rows[0];
}

export async function getUserPortfolios(userId: number): Promise<Portfolio[]> {
  const result = await query(
    'SELECT * FROM portfolios WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
    [userId]
  );
  
  const portfolios = await Promise.all(result.rows.map(async (p) => {
    const holdingsRes = await query(
      'SELECT SUM(quantity * average_price) AS total_invested, COUNT(*) AS holdings_count FROM portfolio_holdings WHERE portfolio_id = $1',
      [p.id]
    );
    return {
      ...p,
      holdings_count: Number(holdingsRes.rows[0].holdings_count || 0),
      total_value: Number(holdingsRes.rows[0].total_invested || 0)
    };
  }));
  
  return portfolios;
}

export async function getPortfolio(userId: number, portfolioId: number): Promise<Portfolio> {
  const result = await query(
    'SELECT * FROM portfolios WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
    [portfolioId, userId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Not found');
  }
  
  return result.rows[0];
}

export async function deletePortfolio(userId: number, portfolioId: number): Promise<void> {
  const holdingResult = await query(
    'SELECT COUNT(*) FROM portfolio_holdings WHERE portfolio_id = $1',
    [portfolioId]
  );
  
  if (parseInt(holdingResult.rows[0].count) > 0) {
    throw new Error('Cannot delete non-empty portfolio');
  }
  
  await query(
    'UPDATE portfolios SET deleted_at = NOW() WHERE id = $1 AND user_id = $2',
    [portfolioId, userId]
  );
}
