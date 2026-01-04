A full-stack NEPSE (Nepal Stock Exchange) portfolio tracker and demo trading platform.

## Features

- User authentication (JWT-based)
- Portfolio management (create, update, view portfolios)
- Live NEPSE stock data integration
- Demo trading accounts with virtual balance
- Buy/sell stocks in demo trading mode
- Transaction history for demo trades
- Modern UI with Next.js and Tailwind CSS

## Project Structure

```
Nepse-Suchana/
├── app/                  # Next.js frontend
│   ├── (auth)/           # Login & signup pages
│   ├── api/              # Next.js API routes (proxy to backend)
│   ├── components/       # React UI components
│   ├── dashboard/        # User dashboard
│   ├── demo-trading/     # Demo trading UI
│   ├── portfolio/        # Portfolio UI
│   ├── watchlist/        # Watchlist UI
│   └── ...
├── backend/              # Node.js + Express backend
│   ├── src/
│   │   ├── config/       # DB setup & migration scripts
│   │   ├── controller/   # Route controllers
│   │   ├── models/       # SQL schema files
│   │   └── Routes/       # Express route files
│   ├── package.json
│   └── server.js
├── public/               # Static assets
├── utils/                # Utility scripts
└── ...
```

## Backend API Endpoints

### Demo Trading
- `POST   /api/demotrading` — Create demo trading account
- `GET    /api/demotrading` — Get demo trading account details
- `PUT    /api/demotrading` — Update demo trading account (balance)
- `POST   /api/demotrading/transactions` — Add a buy/sell transaction

### Portfolio
- `POST   /api/portfolios` — Create portfolio
- `GET    /api/portfolios` — List portfolios
- `POST   /api/portfolio-holdings` — Add stock to portfolio
- ...

## Database Schema

- `demotrading` — Demo trading accounts (per user)
- `demotrading_transactions` — Buy/sell transactions for demo trading
- `users`, `portfolios`, `portfolio_holdings`, ...

## Setup & Run

### Backend
```bash
cd backend
npm install
node ./src/config/migrate.js   # Run DB migrations
node server.js                 # Start backend server
```

### Frontend
```bash
npm install
npm run dev
```

## Demo Trading Transaction Example (POST /api/demotrading/transactions)
```json
{
  "demotrading_id": 1,
  "stock_symbol": "NABIL",
  "side": "BUY",
  "quantity": 100,
  "price": 500.25
}
```

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)

A comprehensive web application for tracking stocks, managing portfolios, and maintaining a watchlist for the Nepal Stock Exchange (NEPSE). Built with Next.js (React), Node.js, Express, and PostgreSQL.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Backend API](#backend-api)
- [Frontend](#frontend)
- [Development Scripts](#development-scripts)
- [Troubleshooting](#troubleshooting)
- [License](#license)
- [Author](#author)

---

## Features
- **Live NEPSE Data:** Real-time stock data with auto-refresh (every 20 seconds).
- **Portfolio Management:** Add, merge, and track stocks with weighted average price calculation.
- **Watchlist:** Add/remove stocks to a personal watchlist.
- **Global Stock Search:** Search and view details for all NEPSE stocks.
- **Charts:** Visualize stock performance with custom charting.
- **Authentication:** User login and signup (basic auth).
- **Responsive UI:** Modern, mobile-friendly design with dark mode support.

---

## Tech Stack
- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **API Integration:** NEPSE API (via backend proxy)

---

## Project Structure
```
/ (root)
├── app/                # Next.js frontend (pages, components)
│   ├── (auth)/         # Auth pages (login, signup)
│   ├── components/     # Reusable React components
│   ├── portfolio/      # Portfolio UI
│   ├── watchlist/      # Watchlist UI
│   └── ...
├── backend/            # Node.js/Express backend
│   ├── src/
│   │   ├── config/     # DB setup, migration scripts
│   │   ├── controller/ # Route controllers (auth, portfolio, watchlist)
│   │   ├── models/     # SQL schema files
│   │   └── Routes/     # Express route definitions
│   ├── .env            # Backend environment variables
│   └── server.js       # Express server entry point
├── public/             # Static assets
├── package.json        # Frontend dependencies
└── README.md           # Project documentation
```

---

## Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL (local or remote instance)

### 1. Clone the Repository
```bash
git clone https://github.com/amritsapkotadev/Nepse-Suchana.git
cd Nepse-Suchana
```

### 2. Install Dependencies
#### Frontend
```bash
npm install
```
#### Backend
```bash
cd backend
npm install
```

### 3. Configure Environment Variables
- Copy `.env.example` to `.env` in both root and `backend/` folders (if provided).
- Set the following variables in `backend/.env`:
  - `DATABASE_URL` (PostgreSQL connection string)
  - `NEPSE_API_KEY` (if required by NEPSE API)
  - `PORT` (optional, default: 3001)

### 4. Run Database Migrations
```bash
cd backend
node src/config/migrate.js
```

### 5. Start the Backend Server
```bash
node server.js
```

### 6. Start the Frontend (Next.js)
```bash
cd ..
npm run dev
```

---

## Environment Variables
**Backend (`backend/.env`):**
```
DATABASE_URL=postgres://user:password@localhost:5432/nepse_db
NEPSE_API_KEY=your_nepse_api_key
PORT=3001
```

---

## Database
- **Schema:** Defined in `backend/src/models/`
  - `usermodel.sql`: User table
  - `portfolio.sql`: Portfolio table
  - `watchlist` table: Used in controllers (see migration scripts)
- **Migrations:** Run with `node src/config/migrate.js`

---

## Backend API
- **Base URL:** `http://localhost:3001/api/`
- **Routes:**
  - `/auth` - Authentication (login, signup)
  - `/portfolio` - Portfolio CRUD
  - `/watchlist` - Watchlist CRUD
  - `/health` - Health check
- **Controllers:** Located in `backend/src/controller/`
- **Database Access:** All controllers use a shared PostgreSQL pool (`src/db.js`)

---

## Frontend
- **Location:** `/app`
- **Key Files:**
  - `page.tsx`: Home page, live NEPSE data, auto-refresh logic
  - `components/`: StockTable, GlobalStockSearch, Stockdetailmodal, etc.
  - `portfolio/`, `watchlist/`: Portfolio and watchlist UIs
- **Data Fetching:**
  - Uses `/api/nepse-proxy` for client-safe NEPSE data fetching
  - Auto-refreshes every 20 seconds without full page reload

---

## Development Scripts
- `npm run dev` - Start Next.js frontend in development mode
- `node server.js` (in backend) - Start Express backend
- `node src/config/migrate.js` (in backend) - Run DB migrations

---

## Troubleshooting
- **Module Not Found:** Ensure all import paths match file names (case-sensitive on Linux/macOS).
- **Database Errors:** Check `DATABASE_URL` and that PostgreSQL is running.
- **API Key Issues:** Make sure `NEPSE_API_KEY` is set in backend `.env` and not exposed to frontend.
- **Port Conflicts:** Change `PORT` in `.env` if 3001 is in use.
- **Live Data Not Updating:** Ensure backend is running and `/api/nepse-proxy` is reachable from frontend.

---

## License
MIT License. See [LICENSE](LICENSE) for details.

---

## Author
[Amrit Sapkota](https://github.com/amritsapkotadev)
