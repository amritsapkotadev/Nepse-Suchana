const db = require('../config/databasesetup');

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
  addStock
};