--created demo trading account table

CREATE TABLE demotrading (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    current_balance NUMERIC(16,2) NOT NULL DEFAULT 10000000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--create demo trading transactions table

create table demotrading_transactions (
    id SERIAL PRIMARY KEY,
    demotrading_id INTEGER REFERENCES demotrading(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(20) NOT NULL,
    side VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    quantity INTEGER NOT NULL,
    price NUMERIC(16,2) NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);