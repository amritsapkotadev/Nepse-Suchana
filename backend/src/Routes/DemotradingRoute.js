const express = require('express');
const router = express.Router();
const demotradingController = require('../controller/Demotradingcontroller');
const protectedRoute = require('../middleware/authMiddleware');

// Get demo trading account details
router.get('/demotrading', protectedRoute, demotradingController.getDemoTradingAccount);

// Create a new demo trading account
router.post('/demotrading', protectedRoute, demotradingController.createDemoTradingAccount);

// Update demo trading account (e.g., balance)
router.put('/demotrading', protectedRoute, demotradingController.updateDemoTradingAccount);

// Add a new demo trading transaction (buy/sell stock)
router.post('/transactions', protectedRoute, demotradingController.createDemoTradingTransaction);

module.exports = router;