import { query } from '../db';

export interface PortfolioHolding {
  id: number;
  portfolio_id: number;
  stock_symbol: string;
  quantity: number;
  average_price: number;
  transaction_type: string;
  cash_dividend: number;
  right_share: number;
  bonus_share: number;
  other_note?: string;
  created_at?: Date;
}

export async function getPortfolioHoldings(userId: number, portfolioId: number): Promise<PortfolioHolding[]> {
  const portfolioResult = await query(
    'SELECT id FROM portfolios WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
    [portfolioId, userId]
  );
  
  if (portfolioResult.rows.length === 0) {
    throw new Error('Portfolio not found');
  }
  
  const result = await query(
    'SELECT * FROM portfolio_holdings WHERE portfolio_id = $1',
    [portfolioId]
  );
  
  return result.rows;
}

export async function addPortfolioHolding(
  userId: number,
  portfolioId: number,
  stockSymbol: string,
  quantity: number,
  averagePrice: number,
  transactionType: string = 'Buy',
  cashDividend: number = 0,
  rightShare: number = 0,
  bonusShare: number = 0,
  otherNote?: string
): Promise<PortfolioHolding> {
  const portfolioResult = await query(
    'SELECT id FROM portfolios WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
    [portfolioId, userId]
  );
  
  if (portfolioResult.rows.length === 0) {
    throw new Error('Portfolio not found');
  }
  
  const result = await query(
    `INSERT INTO portfolio_holdings (
      portfolio_id, stock_symbol, quantity, average_price, transaction_type, cash_dividend, right_share, bonus_share, other_note
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      portfolioId,
      stockSymbol,
      quantity,
      averagePrice,
      transactionType,
      cashDividend,
      rightShare,
      bonusShare,
      otherNote
    ]
  );
  
  return result.rows[0];
}

export async function deletePortfolioHolding(userId: number, holdingId: number): Promise<void> {
  const holdingResult = await query(
    `SELECT ph.* FROM portfolio_holdings ph
     JOIN portfolios p ON ph.portfolio_id = p.id
     WHERE ph.id = $1 AND p.user_id = $2 AND p.deleted_at IS NULL`,
    [holdingId, userId]
  );
  
  if (holdingResult.rows.length === 0) {
    throw new Error('Holding not found');
  }
  
  await query('DELETE FROM portfolio_holdings WHERE id = $1', [holdingId]);
}
