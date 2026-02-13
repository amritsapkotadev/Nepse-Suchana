const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

// Create a simple pool just for migration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log("DATABASE_URL:", process.env.DATABASE_URL);

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Read and execute the user model SQL
    const userModelSQL = fs.readFileSync(
      path.join(__dirname, '../models/usermodel.sql'),
      'utf8'
    );
    await pool.query(userModelSQL);
    console.log('✓ Users table created successfully');

    // Read and execute the portfolio model SQL
    const portfolioModelSQL = fs.readFileSync(
      path.join(__dirname, '../models/portfolio.sql'),
      'utf8'
    );

    const watchlistModelSQL = fs.readFileSync(
      path.join(__dirname, '../models/watchlist.sql'),
      'utf8'
    );
    await pool.query(watchlistModelSQL);
    console.log('✓ Watchlist table created successfully');
    // Read and execute the demotrading model SQL

    const demotradingModelSQL = fs.readFileSync(
      path.join(__dirname, '../models/demotrading.sql'),
      'utf8'
    );


    await pool.query(portfolioModelSQL);
    console.log('✓ Portfolio table created successfully');

    await pool.query(demotradingModelSQL);
    console.log('✓ Demotrading table created successfully');

    console.log('✓ All migrations completed successfully');

    await pool.query(watchlistModelSQL);
    console.log('✓ Watchlist table created successfully');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();


