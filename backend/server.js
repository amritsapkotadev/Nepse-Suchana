const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./src/config/databasesetup');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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