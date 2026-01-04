const db = require('../config/databasesetup');

const createDemoTradingAccount = async (req, res) => {
  const user_id = req.user.id;
  try {
    const { rows: existingAccount } = await db.query(
      'SELECT * FROM demotrading WHERE user_id = $1',
      [user_id]
    );
    if (existingAccount.length > 0) {
      return res.status(400).json({ error: 'Demo trading account already exists' });
    }
    const result = await db.query(
      `INSERT INTO demotrading (user_id, current_balance)
       VALUES ($1, $2) RETURNING *`,
      [user_id, 10000000.00]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getDemoTradingAccount = async (req, res) => {
  const user_id = req.user.id;
  try {
    const { rows } = await db.query(
      'SELECT * FROM demotrading WHERE user_id = $1',
      [user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Demo trading account not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateDemoTradingAccount = async (req, res) => {
  const user_id = req.user.id;
  const { current_balance } = req.body;
  if (typeof current_balance !== 'number') {
    return res.status(400).json({ error: 'current_balance (number) is required' });
  }
  try {
    const { rows } = await db.query(
      'UPDATE demotrading SET current_balance = $1 WHERE user_id = $2 RETURNING *',
      [current_balance, user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Demo trading account not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createDemoTradingTransaction = async (req, res) => {
  const user_id = req.user.id;
  const { demotrading_id, stock_symbol, side, quantity, price } = req.body;

  // Validate input
  if (!demotrading_id || !stock_symbol || !side || !quantity || !price) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (!['BUY', 'SELL'].includes(side)) {
    return res.status(400).json({ error: 'side must be BUY or SELL.' });
  }

  try {
     const { rows: accounts } = await db.query(
      'SELECT * FROM demotrading WHERE id = $1 AND user_id = $2',
      [demotrading_id, user_id]
    );
    if (accounts.length === 0) {
      return res.status(403).json({ error: 'Unauthorized or invalid demo trading account.' });
    }

    // Insert transaction
    const result = await db.query(
      `INSERT INTO demotrading_transactions
        (demotrading_id, stock_symbol, side, quantity, price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [demotrading_id, stock_symbol, side, quantity, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createDemoTradingAccount,
  getDemoTradingAccount,
  updateDemoTradingAccount,
  createDemoTradingTransaction
};