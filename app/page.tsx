"use client";
import { useEffect, useState, useCallback } from "react";
import StockTable from './components/StockTable';
import GlobalStockSearch from './components/GlobalStockSearch';

interface Stock {
  symbol: string;
  name: string;
  lastTradedPrice: number;
  change: number;
  changePercent: number;
  turnover: number;
  sector?: string;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  previousClose?: number;
  totalTradeQuantity?: number;
  iconUrl?: string;
}

interface MarketSummary {
  name: string;
  value: number;
}

interface StockSummary {
  advanced: number;
  declined: number;
  unchanged: number;
}

interface Index {
  name: string;
  symbol: string;
  currentValue: number;
  change: number;
  changePercent: number;
}

interface LiveCompanyData {
  symbol: string;
  securityName: string;
  lastTradedPrice: number;
  change: number;
  percentageChange: number;
  totalTradeValue: number;
  sector?: string;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  previousClose?: number;
  totalTradeQuantity?: number;
  iconUrl?: string;
}

interface ApiResponse {
  marketSummary: MarketSummary[];
  stockSummary: StockSummary;
  indices: Index[];
  topTurnover: Stock[];
  topGainers: Stock[];
  topLosers: Stock[];
  liveCompanyData: LiveCompanyData[];
}

// Custom hook for data fetching and management
function useNepseData(refreshInterval = 20000) {
  const [nepseData, setNepseData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getNepseData = useCallback(async (): Promise<ApiResponse | null> => {
    try {
      const response = await fetch('/api/nepse-proxy', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        console.error('Failed to fetch NEPSE data:', response.status);
        return null;
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching NEPSE data:', error);
      return null;
    }
  }, []);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsRefreshing(true);
    }
    
    const data = await getNepseData();
    
    if (data) {
      setNepseData(data);
      setLastUpdated(new Date());
    }
    
    if (showLoading) {
      setIsRefreshing(false);
    }
    setLoading(false);
  }, [getNepseData]);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up interval for automatic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false); // Don't show loading for automatic refreshes
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return {
    nepseData,
    loading,
    isRefreshing,
    lastUpdated,
    refreshData: () => fetchData(true)
  };
}

function formatNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

function formatCrore(num: number): string {
  return (num / 10000000).toFixed(2);
}

export default function Home() {
  const { nepseData, loading, isRefreshing, lastUpdated, refreshData } = useNepseData();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Loading NEPSE data...
          </h1>
        </div>
      </div>
    );
  }

  if (!nepseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Unable to fetch NEPSE data
          </h1>
          <button
            onClick={() => refreshData()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const nepseIndex = nepseData.indices?.find(i => i.symbol === 'NEPSE');
  const totalTurnover = nepseData.marketSummary?.find(m => m.name === 'Total Turnover Rs:')?.value || 0;
  const totalVolume = nepseData.marketSummary?.find(m => m.name === 'Total Traded Shares')?.value || 0;
  const gainers = nepseData.stockSummary?.advanced || 0;
  const losers = nepseData.stockSummary?.declined || 0;
  
  // Convert all live company data to Stock format for search
  const allStocks: Stock[] = nepseData.liveCompanyData?.map(company => ({
    symbol: company.symbol,
    name: company.securityName,
    lastTradedPrice: company.lastTradedPrice,
    change: company.change,
    changePercent: company.percentageChange,
    turnover: company.totalTradeValue,
    sector: company.sector,
    openPrice: company.openPrice,
    highPrice: company.highPrice,
    lowPrice: company.lowPrice,
    previousClose: company.previousClose,
    totalTradeQuantity: company.totalTradeQuantity,
    iconUrl: company.iconUrl
  })) || [];

  // Enrich top gainers and losers with full stock data
  const enrichStock = (stock: Stock): Stock => {
    const fullData = allStocks.find(s => s.symbol === stock.symbol);
    return fullData || stock;
  };

  const topGainers = nepseData.topGainers?.slice(0, 10).map(enrichStock) || [];
  const topLosers = nepseData.topLosers?.slice(0, 10).map(enrichStock) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Brand */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur opacity-40"></div>
                <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl">
                  <span className="text-2xl">📈</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                  NEPSE
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nepal Stock Exchange</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-2">
              <a href="#" className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all">
                Dashboard
              </a>
              <a href="/login" className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Portfolio
              </a>
              <a href="/watchlist" className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Watchlist
              </a>
              <a href="#" className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Demo Trading
              </a>
            </div>

            {/* Right Side - Status & Actions */}
            <div className="flex items-center gap-3">
              {/* Live Indicator with Refresh Button */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200 dark:border-green-800">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-bold text-green-700 dark:text-green-400">LIVE</span>
                </div>
                
                {/* Manual Refresh Button */}
                <button
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className={`p-2 rounded-xl transition-all ${isRefreshing 
                    ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed' 
                    : 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50'}`}
                >
                  <svg 
                    className={`w-5 h-5 ${isRefreshing ? 'text-slate-400 animate-spin' : 'text-blue-600 dark:text-blue-400'}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                    />
                  </svg>
                </button>
              </div>

              {/* Time Display */}
              <div className="hidden lg:flex flex-col items-end px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Updated</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Login Button */}
              <a 
                href="/login" 
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login
              </a>

              {/* Mobile Menu Button */}
              <button className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <svg className="w-6 h-6 text-slate-700 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Header with Market Info */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Nepal Stock Exchange • Real-time Market Data
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Global Search */}
        <GlobalStockSearch 
          allStocks={allStocks}
        />

        {/* Market Summary Cards with refresh indicator */}
        <div className="relative">
          {isRefreshing && (
            <div className="absolute -top-10 right-0 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Updating data...
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">NEPSE Index</h3>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {nepseIndex?.currentValue.toFixed(2) || 'N/A'}
              </p>
              <p className={`text-sm mt-1 ${(nepseIndex?.change ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {(nepseIndex?.change ?? 0) >= 0 ? '+' : ''}{nepseIndex?.change.toFixed(2)} ({nepseIndex?.changePercent.toFixed(2)}%)
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Turnover</h3>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                Rs {formatCrore(totalTurnover)} Cr
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Volume: {formatNumber(totalVolume)}
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Gainers</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">{gainers}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Stocks up today</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Losers</h3>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">{losers}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Stocks down today</p>
            </div>
          </div>
        </div>

        {/* Top Gainers and Losers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div id="gainers">
            <StockTable 
              stocks={topGainers} 
              title="Top Gainers" 
              showName={false} 
              showTurnover={false}
              loading={isRefreshing}
            />
          </div>
          <div id="losers">
            <StockTable 
              stocks={topLosers} 
              title="Top Losers" 
              showName={false} 
              showTurnover={false}
              loading={isRefreshing}
            />
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Live data from NEPSE API • Last updated: {lastUpdated.toLocaleString()}
          </p>
          <button
            onClick={refreshData}
            className="mt-2 px-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Click to refresh data
          </button>
        </div>
      </main>
    </div>
  );
}