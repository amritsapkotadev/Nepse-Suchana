const express = require('express');
const router = express.Router();
const portfolioController = require('../controller/portfoliocontroller');

// Add stock to portfolio
router.post('/add', portfolioController.addStock);

// Get user's portfolio
// router.get('/:userId', portfolioController.getPortfolio);

module.exports = router;