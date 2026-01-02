const db = require('../config/databasesetup');

// Get holdings for a portfolio
const getPortfolioHoldings = async (req, res) => {
  const user_id = req.user.id;
  const portfolio_id = req.query.portfolio_id;
  if (!portfolio_id) {
    return res.status(400).json({ error: 'portfolio_id is required' });
  }
  try {
    // Check ownership
    const { rows: portfolioRows } = await db.query(
      'SELECT id FROM portfolios WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [portfolio_id, user_id]
    );
    if (portfolioRows.length === 0) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    // Get holdings
    const { rows } = await db.query(
      'SELECT * FROM portfolio_holdings WHERE portfolio_id = $1',
      [portfolio_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add holding to a portfolio
const addPortfolioHolding = async (req, res) => {
  const user_id = req.user.id;
  const { portfolio_id, symbol, company_name, quantity, buy_price, transaction_type } = req.body;
  if (!portfolio_id || !symbol || !company_name || !quantity || !buy_price || !transaction_type) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    // Check ownership
    const { rows: portfolioRows } = await db.query(
      'SELECT id FROM portfolios WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [portfolio_id, user_id]
    );
    if (portfolioRows.length === 0) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    // Insert holding
    const result = await db.query(
      `INSERT INTO portfolio_holdings (portfolio_id, symbol, company_name, quantity, buy_price, transaction_type, date_added)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [portfolio_id, symbol, company_name, quantity, buy_price, transaction_type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete holding from a portfolio
const deletePortfolioHolding = async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;
  try {
    // Check holding and ownership
    const { rows: holdingRows } = await db.query(
      `SELECT ph.* FROM portfolio_holdings ph
       JOIN portfolios p ON ph.portfolio_id = p.id
       WHERE ph.id = $1 AND p.user_id = $2 AND p.deleted_at IS NULL`,
      [id, user_id]
    );
    if (holdingRows.length === 0) {
      return res.status(404).json({ error: 'Holding not found' });
    }
    await db.query('DELETE FROM portfolio_holdings WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getPortfolioHoldings,
  addPortfolioHolding,
  deletePortfolioHolding
};
