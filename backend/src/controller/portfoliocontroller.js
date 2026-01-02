const db = require('../config/databasesetup');

// Create a new portfolio (max 5 per user, unique name)
const createPortfolio = async (req, res) => {
  const user_id = req.user.id;
  const { name, initial_balance = 0, description } = req.body;
  try {
    // Max 5 portfolios per user
    const { rows: countRows } = await db.query(
      'SELECT COUNT(*) FROM portfolios WHERE user_id = $1 AND deleted_at IS NULL',
      [user_id]
    );
    if (parseInt(countRows[0].count) >= 5) {
      return res.status(400).json({ error: 'Portfolio limit reached' });
    }
    // Unique name per user
    const { rows: nameRows } = await db.query(
      'SELECT 1 FROM portfolios WHERE user_id = $1 AND name = $2 AND deleted_at IS NULL',
      [user_id, name]
    );
    if (nameRows.length > 0) {
      return res.status(400).json({ error: 'Portfolio name already exists' });
    }
    const result = await db.query(
      `INSERT INTO portfolios (user_id, name, initial_balance, current_balance, description)
       VALUES ($1, $2, $3, $3, $4) RETURNING *`,
      [user_id, name, initial_balance, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List all portfolios for authenticated user, with metrics
const getUserPortfolios = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await db.query(
      'SELECT * FROM portfolios WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
      [user_id]
    );
    // Add metrics: holdings count, total value
    const portfolios = await Promise.all(result.rows.map(async (p) => {
      const holdingsRes = await db.query(
        'SELECT SUM(quantity * average_price) AS total_value, COUNT(*) AS holdings_count FROM portfolio_holdings WHERE portfolio_id = $1',
        [p.id]
      );
      return {
        ...p,
        holdings_count: Number(holdingsRes.rows[0].holdings_count || 0),
        total_value: Number(holdingsRes.rows[0].total_value || 0)
      };
    }));
    res.json(portfolios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single portfolio (ownership check)
const getPortfolio = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const { rows } = await db.query(
    'SELECT * FROM portfolios WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
    [id, user_id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
};

// Soft delete a portfolio (prevent if holdings exist)
const deletePortfolio = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  // Prevent deleting non-empty portfolios
  const { rows: holdingRows } = await db.query(
    'SELECT COUNT(*) FROM portfolio_holdings WHERE portfolio_id = $1',
    [id]
  );
  if (parseInt(holdingRows[0].count) > 0) {
    return res.status(400).json({ error: 'Cannot delete non-empty portfolio' });
  }
  await db.query(
    'UPDATE portfolios SET deleted_at = NOW() WHERE id = $1 AND user_id = $2',
    [id, user_id]
  );
  res.json({ success: true });
};

module.exports = {
  createPortfolio,
  getUserPortfolios,
  getPortfolio,
  deletePortfolio
};