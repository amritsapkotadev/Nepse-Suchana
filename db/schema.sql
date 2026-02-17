-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  stock_symbol VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, stock_symbol)
);

-- Demo trading accounts table
CREATE TABLE IF NOT EXISTS demotrading (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_balance DECIMAL(15,2) DEFAULT 10000000.00
);

-- Demo trading transactions table
CREATE TABLE IF NOT EXISTS demotrading_transactions (
  id SERIAL PRIMARY KEY,
  demotrading_id INTEGER REFERENCES demotrading(id) ON DELETE CASCADE,
  stock_symbol VARCHAR(50) NOT NULL,
  side VARCHAR(10) CHECK (side IN ('BUY', 'SELL')),
  quantity INTEGER NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  initial_balance DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Portfolio holdings table
CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
  stock_symbol VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  average_price DECIMAL(15,2) NOT NULL,
  cash_dividend DECIMAL(15,2) DEFAULT 0,
  right_share INTEGER DEFAULT 0,
  bonus_share INTEGER DEFAULT 0,
  other_note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(portfolio_id, stock_symbol)
);

-- Dividends table
CREATE TABLE IF NOT EXISTS dividends (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
  stock_symbol VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
