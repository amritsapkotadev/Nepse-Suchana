const express = require('express');
const router = express.Router();
const watchlistController = require('../controller/watchlistcontroller');
const protectedRoute = require('../middleware/authMiddleware');

//see watchlist of a user
router.get('/watchlist/:userId', protectedRoute, watchlistController.getWatchlist);

// Add item to watchlist
router.post('/add', protectedRoute, watchlistController.addToWatchlist);

// Remove item from watchlist
router.post('/remove', watchlistController.removeFromWatchlist);
 
module.exports = router ;