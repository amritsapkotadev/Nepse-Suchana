const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./src/config/databasesetup');
// Removed: const portfolioRoutes = require('./Routes/PortfolioRoute');
const authRoutes = require('./src/Routes/AuthRoute');
const watchlistRoutes = require('./src/Routes/watchlistRoute');
const portfolioRoutes = require('./src/Routes/PortfolioRoutes');
const app = express();
const port = process.env.PORT || 3001;

 app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
// Routes
app.use('/api/auth', authRoutes);
app.use('/api', portfolioRoutes);
app.use('/api/watchlist', watchlistRoutes);

 // Health check route
app.get('/api/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      status: 'ok',
      message: 'Server and database are running',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Sample route
app.get('/', (req, res) => {
  res.json({
    message: 'NEPSE Backend API',
    endpoints: {
      health: '/api/health',
      // Add more endpoints as you create them
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
});