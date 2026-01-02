const express = require('express');
const router = express.Router();
const portfolioController = require('../controller/portfoliocontroller');
const protectedRoute = require('../middleware/authMiddleware');

// Create a new portfolio
router.post('/portfolios', protectedRoute, portfolioController.createPortfolio);

// Get all portfolios for a user
router.get('/portfolios', protectedRoute, portfolioController.getUserPortfolios);

// Get a single portfolio
router.get('/portfolios/:id', protectedRoute, portfolioController.getPortfolio);

// Update a portfolio (if supported)
// router.put('/portfolios/:id', protectedRoute, portfolioController.updatePortfolio);

// Delete a portfolio
router.delete('/portfolios/:id', protectedRoute, portfolioController.deletePortfolio);

module.exports = router;