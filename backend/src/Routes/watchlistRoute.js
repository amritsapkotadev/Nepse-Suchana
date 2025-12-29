const express = require('express');
const router = express.Router();
const watchlistController = require('../controller/watchlistcontroller');

// Add item to watchlist
router.post('/add', watchlistController.addToWatchlist);

// Remove item from watchlist
router.post('/remove', watchlistController.removeFromWatchlist);

// Get user's watchlist
router.get('/:userId', watchlistController.getWatchlist);

module.exports = router ;