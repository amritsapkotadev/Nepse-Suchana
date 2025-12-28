CREATE TABLE IF NOT EXISTS portfolio (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(10) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    average_price NUMERIC(10, 2) NOT NULL CHECK (average_price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, stock_symbol)
);