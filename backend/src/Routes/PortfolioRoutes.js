const express = require('express');
const router = express.Router();
const portfolioController = require('../controller/portfolioController');

// Create a new portfolio
router.post('/api/portfolios', portfolioController.createPortfolio);

// Get all portfolios
router.get('/api/portfolios', portfolioController.getPortfolios);

// Update an existing portfolio
router.put('/api/portfolios/:id', portfolioController.updatePortfolio);

// Delete a portfolio
router.delete('/api/portfolios/:id', portfolioController.deletePortfolio);

module.exports = router;