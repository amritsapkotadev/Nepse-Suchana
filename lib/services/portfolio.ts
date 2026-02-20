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

export async function updatePortfolio(
  userId: number,
  portfolioId: number,
  updates: { name?: string; description?: string }
): Promise<Portfolio> {
  // Check if portfolio exists and belongs to user
  const existingResult = await query(
    'SELECT * FROM portfolios WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
    [portfolioId, userId]
  );
  
  if (existingResult.rows.length === 0) {
    throw new Error('Portfolio not found');
  }
  
  // If name is being updated, check for duplicates
  if (updates.name) {
    const nameCheck = await query(
      'SELECT 1 FROM portfolios WHERE user_id = $1 AND name = $2 AND id != $3 AND deleted_at IS NULL',
      [userId, updates.name, portfolioId]
    );
    
    if (nameCheck.rows.length > 0) {
      throw new Error('Portfolio name already exists');
    }
  }
  
  const result = await query(
    `UPDATE portfolios 
     SET name = COALESCE($3, name), 
         description = COALESCE($4, description)
     WHERE id = $1 AND user_id = $2 
     RETURNING *`,
    [portfolioId, userId, updates.name || null, updates.description || null]
  );
  
  return result.rows[0];
}

export async function deletePortfolio(userId: number, portfolioId: number): Promise<void> {
  // First verify the portfolio exists and belongs to the user
  const portfolioResult = await query(
    'SELECT id FROM portfolios WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
    [portfolioId, userId]
  );
  
  if (portfolioResult.rows.length === 0) {
    throw new Error('Portfolio not found');
  }
  
  // Delete all holdings first (cascade delete)
  await query(
    'DELETE FROM portfolio_holdings WHERE portfolio_id = $1',
    [portfolioId]
  );
  
  // Then soft-delete the portfolio
  await query(
    'UPDATE portfolios SET deleted_at = NOW() WHERE id = $1 AND user_id = $2',
    [portfolioId, userId]
  );
}
