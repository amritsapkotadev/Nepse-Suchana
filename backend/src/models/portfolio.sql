 CREATE TABLE IF NOT EXISTS dividends (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(10) NOT NULL,
    type VARCHAR(32) NOT NULL, -- e.g., 'cash_dividend', 'right_share', 'bonus_share', 'other'
    value NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS portfolio (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(10) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    average_price NUMERIC(10, 2) NOT NULL CHECK (average_price >= 0),
    cash_dividend NUMERIC(10, 2) DEFAULT 0,
    right_share NUMERIC(10, 2) DEFAULT 0,
    bonus_share NUMERIC(10, 2) DEFAULT 0,
    other_note TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, stock_symbol)
);