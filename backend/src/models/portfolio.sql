-- PORTFOLIOS
CREATE TABLE IF NOT EXISTS portfolios (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PORTFOLIO HOLDINGS

CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL,
    stock_symbol VARCHAR(10) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    average_price NUMERIC(10, 2) NOT NULL CHECK (average_price >= 0),
    cash_dividend NUMERIC(10, 2) DEFAULT 0,
    right_share NUMERIC(10, 2) DEFAULT 0,
    bonus_share NUMERIC(10, 2) DEFAULT 0,
    other_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (portfolio_id, stock_symbol),
    CONSTRAINT fk_portfolio
        FOREIGN KEY (portfolio_id)
        REFERENCES portfolios(id)
        ON DELETE CASCADE
);

-- =========================
-- DIVIDENDS
-- =========================
CREATE TABLE IF NOT EXISTS dividends (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL,
    stock_symbol VARCHAR(10) NOT NULL,
    type VARCHAR(32) NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dividend_portfolio
        FOREIGN KEY (portfolio_id)
        REFERENCES portfolios(id)
        ON DELETE CASCADE
);

-- =========================
-- INDEXES (LAST)
-- =========================
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id
    ON portfolios(user_id);

CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id
    ON portfolio_holdings(portfolio_id);

CREATE INDEX IF NOT EXISTS idx_dividends_portfolio_id
    ON dividends(portfolio_id);
