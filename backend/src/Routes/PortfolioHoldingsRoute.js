const express = require('express');
const router = express.Router();
const portfolioHoldingsController = require('../controller/portfolioholdingscontroller');
const protectedRoute = require('../middleware/authMiddleware');


// Get holdings for a portfolio
router.get('/portfolio-holdings', protectedRoute, portfolioHoldingsController.getPortfolioHoldings);

// Add holding to a portfolio
router.post('/portfolio-holdings', protectedRoute, portfolioHoldingsController.addPortfolioHolding);

// Delete holding from a portfolio
router.delete('/portfolio-holdings/:id', protectedRoute, portfolioHoldingsController.deletePortfolioHolding);

module.exports = router;
