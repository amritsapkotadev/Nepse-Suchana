const express = require('express');
const router = express.Router();
const db = require('../config/databasesetup');

// Add a dividend to a portfolio
router.post('/dividends', async (req, res) => {
  const { portfolio_id, stock_symbol, type, value, date, notes } = req.body;
  if (!portfolio_id || !stock_symbol || !type || value === undefined || !date) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const result = await db.query(
      `INSERT INTO dividends (portfolio_id, stock_symbol, type, value, date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [portfolio_id, stock_symbol, type, value, date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all dividends for a portfolio
router.get('/dividends/:portfolio_id', async (req, res) => {
  const { portfolio_id } = req.params;
  try {
    const result = await db.query('SELECT * FROM dividends WHERE portfolio_id = $1', [portfolio_id]);
    res.json({ dividends: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
