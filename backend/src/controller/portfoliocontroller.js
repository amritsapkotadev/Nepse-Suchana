const db = require('../config/databasesetup');

// Create a new portfolio
const createPortfolio = async (req, res) => {
  const { user_id, name, description } = req.body;
  console.log('Create Portfolio Request:', req.body);
  try {
    const result = await db.query(
      'INSERT INTO portfolios (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [user_id, name, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create Portfolio Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// List all portfolios for a user
const getPortfolios = async (req, res) => {
  const { user_id } = req.query;
  try {
    const result = await db.query(
      'SELECT * FROM portfolios WHERE user_id = $1',
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update portfolio name/description
const updatePortfolio = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const result = await db.query(
      'UPDATE portfolios SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a portfolio
const deletePortfolio = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM portfolios WHERE id = $1', [id]);
    res.json({ message: 'Portfolio deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add stock to portfolio
const addStock = async (req, res) => {
  const { userId, stockSymbol, quantity, averagePrice } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO portfolio (user_id, stock_symbol, quantity, average_price) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, stockSymbol, quantity, averagePrice]
    );

    res.status(201).json({
      status: 'success',
      message: 'Stock added to portfolio successfully',
      portfolioItem: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database query failed',
      error: error.message
    });
  }
};

module.exports = {
  createPortfolio,
  getPortfolios,
  updatePortfolio,
  deletePortfolio,
  addStock
};