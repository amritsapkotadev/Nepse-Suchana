'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { FaChartLine, FaMoneyBillWave, FaHashtag, FaBuilding } from 'react-icons/fa';
import { useAuth } from '@/components/AuthProvider';
import { Loader } from '@/components/Loader';

interface Portfolio {
  id: number;
  name: string;
  description?: string;
  initial_balance: number;
  current_balance: number;
}

interface PortfolioHolding {
  id: number;
  stock_symbol: string;
  company_name: string;
  quantity: number;
  average_price: number;
}

interface StockPrice {
  symbol: string;
  lastTradedPrice: number;
  change: number;
  percentageChange: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [stockPrices, setStockPrices] = useState<Record<string, StockPrice>>({});
  const [loading, setLoading] = useState(true);
  
  // Track if we need to refresh data
  const lastFetchTime = useRef<number>(0);
  const isFetching = useRef(false);

  const fetchData = useCallback(async () => {
    if (!user || isFetching.current) return;
    
    // Always fetch fresh data (remove caching to ensure new portfolios are shown)
    isFetching.current = true;
    
    try {
      // Fetch portfolios first
      const portfoliosRes = await fetch('/api/portfolios');
      if (portfoliosRes.ok) {
        const portfoliosResult = await portfoliosRes.json();
        const portfoliosData = portfoliosResult.data || portfoliosResult;
        setPortfolios(portfoliosData);
        
        if (portfoliosData.length > 0) {
          // Fetch holdings and stock prices in parallel
          const [holdingsRes, stocksRes] = await Promise.all([
            fetch(`/api/portfolio-holdings?portfolio_id=${portfoliosData[0].id}`),
            fetch('/api/nepse-proxy', { cache: 'no-store' })
          ]);
          
          let holdingsData: PortfolioHolding[] = [];
          if (holdingsRes.ok) {
            const holdingsResult = await holdingsRes.json();
            holdingsData = holdingsResult.data || holdingsResult;
            setHoldings(holdingsData);
          }
          
          let priceMap: Record<string, StockPrice> = {};
          if (stocksRes.ok) {
            const stocksData = await stocksRes.json();
            priceMap = {};
            (stocksData.liveCompanyData || []).forEach((stock: { symbol: string; securityName: string; lastTradedPrice: number; change: number; percentageChange: number }) => {
              priceMap[stock.symbol] = {
                symbol: stock.symbol,
                lastTradedPrice: stock.lastTradedPrice,
                change: stock.change,
                percentageChange: stock.percentageChange
              };
            });
            setStockPrices(priceMap);
          }
        } else {
          // Clear holdings if no portfolios
          setHoldings([]);
          setStockPrices({});
        }
      }
      lastFetchTime.current = Date.now();
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      isFetching.current = false;
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate totals
  const totalInvestment = holdings.reduce((sum, h) => sum + (h.quantity * h.average_price), 0);
  const currentValue = holdings.reduce((sum, h) => {
    const price = stockPrices[h.stock_symbol]?.lastTradedPrice || h.average_price;
    return sum + (h.quantity * price);
  }, 0);
  const profitLoss = currentValue - totalInvestment;
  const profitLossPercentage = totalInvestment > 0 ? parseFloat(((profitLoss / totalInvestment) * 100).toFixed(2)) : 0;
  const totalShares = holdings.reduce((sum, h) => sum + h.quantity, 0);
  const companiesHeld = holdings.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Please login to view your dashboard</h2>
          <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Dashboard</h1>
        
        {portfolios.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 text-center">
            <FaBuilding className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No Portfolio Yet</h2>
            <p className="text-slate-600 mb-4">Create your first portfolio to start tracking your investments</p>
            <Link href="/portfolio" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
              Create Portfolio
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-blue-100">
                    <FaMoneyBillWave className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Investment</p>
                <p className="text-2xl font-bold text-slate-900">Rs. {totalInvestment.toLocaleString('en-NP', { minimumFractionDigits: 2 })}</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
                <div className="p-3 rounded-xl bg-emerald-100 mb-4 w-fit">
                  <FaChartLine className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-slate-500 mb-1">Current Value</p>
                <p className="text-2xl font-bold text-slate-900">Rs. {currentValue.toLocaleString('en-NP', { minimumFractionDigits: 2 })}</p>
              </div>

              <div className={`bg-white rounded-2xl p-6 shadow-lg border ${profitLoss >= 0 ? 'border-emerald-100' : 'border-red-100'}`}>
                <div className={`p-3 rounded-xl mb-4 w-fit ${profitLoss >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  <FaChartLine className={`w-6 h-6 ${profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                </div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total P&L</p>
                <div className="flex items-center space-x-2">
                  <p className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {profitLoss >= 0 ? '+' : ''}Rs. {Math.abs(profitLoss).toLocaleString('en-NP', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${profitLoss >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {profitLossPercentage >= 0 ? '+' : ''}{profitLossPercentage}%
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
                <div className="p-3 rounded-xl bg-indigo-100 mb-4 w-fit">
                  <FaHashtag className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Shares Held</p>
                <p className="text-2xl font-bold text-slate-900">{totalShares.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-2">Across {companiesHeld} companies</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <Link href="/portfolio" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">Go to Portfolio</Link>
              <Link href="/watchlist" className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">Go to Watchlist</Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
