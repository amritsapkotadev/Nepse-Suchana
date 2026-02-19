import { query } from '../db';

export interface DemoTradingAccount {
  id: number;
  user_id: number;
  current_balance: number;
}

export interface DemoTradingTransaction {
  id: number;
  demotrading_id: number;
  stock_symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  created_at?: Date;
}

export async function createDemoTradingAccount(userId: number): Promise<DemoTradingAccount> {
  const existing = await query(
    'SELECT * FROM demotrading WHERE user_id = $1',
    [userId]
  );
  
  if (existing.rows.length > 0) {
    throw new Error('Demo trading account already exists');
  }
  
  const result = await query(
    `INSERT INTO demotrading (user_id, current_balance)
     VALUES ($1, $2) RETURNING *`,
    [userId, 10000000.00]
  );
  
  return result.rows[0];
}

export async function getDemoTradingAccount(userId: number): Promise<DemoTradingAccount> {
  const result = await query(
    'SELECT * FROM demotrading WHERE user_id = $1',
    [userId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Demo trading account not found');
  }
  
  return result.rows[0];
}

export async function updateDemoTradingAccount(userId: number, currentBalance: number): Promise<DemoTradingAccount> {
  const result = await query(
    'UPDATE demotrading SET current_balance = $1 WHERE user_id = $2 RETURNING *',
    [currentBalance, userId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Demo trading account not found');
  }
  
  return result.rows[0];
}

export async function createDemoTradingTransaction(
  userId: number,
  demotradingId: number,
  stockSymbol: string,
  side: 'BUY' | 'SELL',
  quantity: number,
  price: number
): Promise<DemoTradingTransaction> {
  const accounts = await query(
    'SELECT * FROM demotrading WHERE id = $1 AND user_id = $2',
    [demotradingId, userId]
  );
  
  if (accounts.rows.length === 0) {
    throw new Error('Unauthorized or invalid demo trading account');
  }
  
  const result = await query(
    `INSERT INTO demotrading_transactions
      (demotrading_id, stock_symbol, side, quantity, price)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [demotradingId, stockSymbol, side, quantity, price]
  );
  
  return result.rows[0];
}

export async function deleteDemoTradingTransaction(userId: number, transactionId: number): Promise<void> {
  const tx = await query(
    `SELECT t.* FROM demotrading_transactions t
     JOIN demotrading d ON t.demotrading_id = d.id
     WHERE t.id = $1 AND d.user_id = $2`,
    [transactionId, userId]
  );
  
  if (tx.rows.length === 0) {
    throw new Error('Transaction not found or not authorized');
  }
  
  await query(
    'DELETE FROM demotrading_transactions WHERE id = $1',
    [transactionId]
  );
}

export async function getDemoTradingTransactions(demotradingId: number, userId: number): Promise<DemoTradingTransaction[]> {
  const result = await query(
    `SELECT t.* FROM demotrading_transactions t
     JOIN demotrading d ON t.demotrading_id = d.id
     WHERE t.demotrading_id = $1 AND d.user_id = $2
     ORDER BY t.created_at DESC`,
    [demotradingId, userId]
  );
  
  return result.rows;
}
