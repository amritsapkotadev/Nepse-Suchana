# Nepse-Suchana

A comprehensive full-stack web application for tracking Nepal Stock Exchange (NEPSE) portfolios, managing watchlists, and practicing demo trading with virtual currency.

## Overview

Nepse-Suchana provides real-time NEPSE stock data, portfolio management with multiple portfolios per user, personal watchlists, and a demo trading platform with Rs. 1 Crore virtual balance for practice trading.

## ✨ What It Does

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | Secure JWT login/registration with httpOnly cookie storage |
| 📊 **Portfolio Management** | Create up to 5 portfolios with weighted average price tracking |
| 💹 **Demo Trading** | Practice with Rs. 1 Crore virtual balance — no real money risk |
| 👁️ **Watchlist** | Personal stock watchlist with live prices |
| 💰 **Dividend Tracking** | Record cash dividends, bonus shares, and right shares |
| 📡 **Live NEPSE Data** | Real-time stock prices via NEPSE API proxy with auto-refresh |
| 📱 **Responsive UI** | Modern design with dark mode support |

---

##🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 (App Router), React 19 | UI rendering, routing |
| **Language** | TypeScript | Type safety, developer experience |
| **Styling** | Tailwind CSS | Responsive, utility-first UI |
| **Backend** | Next.js API Routes (Node.js) | REST endpoints, server logic |
| **Database** | PostgreSQL + node-postgres | Data persistence, connection pooling |
| **Auth** | JWT + httpOnly Cookies | Stateless auth, XSS protection |
| **Market Data** | NEPSE API (Sharepulse proxy) | Real-time stock prices |

---

## Project Structure

```
nepse-suchana/
├── app/                          # Next.js App Router
│   ├── api/                      # API Route Handlers
│   │   ├── auth/                # Authentication
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── demotrading/         # Demo trading
│   │   ├── dividends/           # Dividend records
│   │   ├── health/              # Health check
│   │   ├── nepse-chart/         # Chart data
│   │   ├── nepse-proxy/         # NEPSE data proxy
│   │   ├── portfolio-holdings/  # Holdings CRUD
│   │   ├── portfolios/          # Portfolio CRUD
│   │   ├── stocks/              # Stock data
│   │   └── watchlist/           # Watchlist CRUD
│   ├── (auth)/                  # Auth pages (login/signup)
│   ├── components/              # React components
│   ├── dashboard/               # Dashboard page
│   ├── demo-trading/            # Demo trading UI
│   ├── portfolio/               # Portfolio UI
│   └── watchlist/               # Watchlist UI
├── lib/                         # Shared utilities
│   ├── db.ts                   # PostgreSQL connection pool
│   ├── auth.ts                 # JWT authentication
│   └── services/               # Business logic
│       ├── auth.ts
│       ├── demotrading.ts
│       ├── dividends.ts
│       ├── portfolio.ts
│       ├── portfolioHoldings.ts
│       ├── stocks.ts
│       └── watchlist.ts
├── components/                  # Reusable UI components
├── db/                          # Database schema
│   └── schema.sql              # PostgreSQL schema
├── public/                      # Static assets
├── .env                        # Environment variables
├── .env.example                # Environment template
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL 14.x or higher

### Installation

```bash
# Install dependencies
npm install --save-dev @types/react @types/react-dom
```

### Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your configuration:
```env
# Database connection string
DATABASE_URL=postgresql://username:password@localhost:5432/nepse_db

# JWT secret key (use a strong random string)
JWT_SECRET=your-secure-secret-key-min-32-chars

# NEPSE API endpoint
NEXT_PUBLIC_NEPSE_API_URL=https://sharepulse.qzz.io/api/nepse/live-data
```

### Database Setup

Execute the schema file to create all required tables:

```bash
# Using psql CLI
psql $DATABASE_URL -f db/schema.sql

# Or using a database client (pgAdmin, DBeaver, etc.)
# Import db/schema.sql
```

### Running the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

The application runs at `http://localhost:3000`. No separate backend server is required.

## Database Schema

All tables are defined in `db/schema.sql`:

### Users
```sql
users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### Portfolios
```sql
portfolios (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  initial_balance DECIMAL(15,2),
  current_balance DECIMAL(15,2),
  description TEXT,
  created_at TIMESTAMP,
  deleted_at TIMESTAMP
)
```

### Portfolio Holdings
```sql
portfolio_holdings (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER REFERENCES portfolios(id),
  stock_symbol VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  average_price DECIMAL(15,2) NOT NULL,
  cash_dividend DECIMAL(15,2),
  right_share INTEGER,
  bonus_share INTEGER,
  other_note TEXT,
  UNIQUE(portfolio_id, stock_symbol)
)
```

### Watchlist
```sql
watchlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  stock_symbol VARCHAR(50) NOT NULL,
  UNIQUE(user_id, stock_symbol)
)
```

### Demo Trading
```sql
-- Account (one per user, starts with Rs. 1 Crore)
demotrading (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id),
  current_balance DECIMAL(15,2)
)

-- Transactions
demotrading_transactions (
  id SERIAL PRIMARY KEY,
  demotrading_id INTEGER REFERENCES demotrading(id),
  stock_symbol VARCHAR(50),
  side VARCHAR(10) CHECK (side IN ('BUY', 'SELL')),
  quantity INTEGER,
  price DECIMAL(15,2)
)
```

### Dividends
```sql
dividends (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER REFERENCES portfolios(id),
  stock_symbol VARCHAR(50),
  type VARCHAR(50),
  value DECIMAL(15,2),
  date DATE,
  notes TEXT
)
```

## API Reference

All endpoints return JSON responses in the following format:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Error message" }
```

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |

### Portfolios

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/portfolios` | List user portfolios | Yes |
| POST | `/api/portfolios` | Create portfolio | Yes |
| GET | `/api/portfolios/[id]` | Get portfolio details | Yes |
| DELETE | `/api/portfolios/[id]` | Delete portfolio | Yes |

### Portfolio Holdings

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/portfolio-holdings?portfolio_id=X` | Get holdings | Yes |
| POST | `/api/portfolio-holdings` | Add holding | Yes |
| DELETE | `/api/portfolio-holdings/[id]` | Remove holding | Yes |

### Demo Trading

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/demotrading` | Get account | Yes |
| POST | `/api/demotrading` | Create account or add transaction | Yes |
| PUT | `/api/demotrading` | Update balance | Yes |
| DELETE | `/api/demotrading?id=X` | Delete transaction | Yes |

### Watchlist

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/watchlist` | Get watchlist | Yes |
| POST | `/api/watchlist` | Add stock | Yes |
| POST | `/api/watchlist/remove` | Remove stock | Yes |

### Stocks & Data

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/stocks` | Fetch NEPSE stocks | No |
| GET | `/api/nepse-proxy` | Proxy to NEPSE | No |
| GET | `/api/dividends?portfolio_id=X` | Get dividends | Yes |
| POST | `/api/dividends` | Add dividend | Yes |
| GET | `/api/health` | Health check | No |

## Authentication Flow

1. **Register**: `POST /api/auth/register` with `{name, email, password}`
2. **Login**: `POST /api/auth/login` with `{email, password}`
   - Server returns JWT token and sets httpOnly cookie
3. **Authenticated Requests**: Include token in header:
   ```
   Authorization: Bearer <token>
   ```
4. **Verification**: `lib/auth.ts` exports `verifyAuth()` function used in all protected routes

## Demo Trading Usage

1. Create a demo trading account (automatically starts with Rs. 1 Crore):
```bash
curl -X POST http://localhost:3000/api/demotrading \
  -H "Authorization: Bearer <token>"
```

2. Add a buy transaction:
```bash
curl -X POST http://localhost:3000/api/demotrading \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "demotrading_id": 1,
    "stock_symbol": "NABIL",
    "side": "BUY",
    "quantity": 100,
    "price": 500.25
  }'
```

## Frontend Integration

The frontend uses a custom `safeFetch` utility (`app/lib/api-utils.ts`) that:
- Automatically includes authentication headers
- Unwraps `{success, data}` response format
- Throws descriptive errors for failed requests

```typescript
import { safeFetch } from '@/app/lib/api-utils';

const portfolios = await safeFetch<Portfolio[]>('/api/portfolios');
```

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Security Considerations

- JWT secrets should be long random strings (minimum 32 characters)
- Cookies are httpOnly, sameSite: strict, and secure in production
- All database queries use parameterized statements (no SQL injection)
- API routes use Node.js runtime (not edge) due to pg and jwt dependencies

## License

MIT License
