"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import StockTable from './components/StockTable';
import GlobalStockSearch from './components/GlobalStockSearch';
import IndexChart from './components/IndexChart';

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
function useNepseData(refreshInterval = 15000) {
  const [nepseData, setNepseData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

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
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
      return null;
    }
  }, []);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsRefreshing(true);
    }
    
    setError(null);
    const data = await getNepseData();
    
    if (data) {
      setNepseData(data);
      setLastUpdated(new Date());
      setRefreshCount(prev => prev + 1);
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

  // Set up interval for automatic refresh only during market open (11am-3pm)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      // Market open: 11:00 (11) to 14:59 (14)
      if (hour >= 11 && hour < 15) {
        fetchData(false);
      }
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return {
    nepseData,
    loading,
    error,
    isRefreshing,
    lastUpdated,
    refreshCount,
    refreshData: () => fetchData(true)
  };
}

function formatNumber(num: number): string {
  if (!num && num !== 0) return '0';
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

function formatCrore(num: number): string {
  if (!num && num !== 0) return '0.00';
  return (num / 10000000).toFixed(2);
}

export default function Home() {
  const { nepseData, loading, error, isRefreshing, lastUpdated, refreshCount, refreshData } = useNepseData();

  const nepseIndex = useMemo(() => nepseData?.indices?.find(i => i.symbol === 'NEPSE'), [nepseData]);
  const totalTurnover = useMemo(() => nepseData?.marketSummary?.find(m => m.name === 'Total Turnover Rs:')?.value || 0, [nepseData]);
  const totalVolume = useMemo(() => nepseData?.marketSummary?.find(m => m.name === 'Total Traded Shares')?.value || 0, [nepseData]);
  const gainers = useMemo(() => nepseData?.stockSummary?.advanced || 0, [nepseData]);
  const losers = useMemo(() => nepseData?.stockSummary?.declined || 0, [nepseData]);
  const unchanged = useMemo(() => nepseData?.stockSummary?.unchanged || 0, [nepseData]);
  const otherIndices = useMemo(() => nepseData?.indices?.filter(i => i.symbol !== 'NEPSE') || [], [nepseData]);

  const allStocks: Stock[] = useMemo(() => nepseData?.liveCompanyData?.map(company => ({
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
  })) || [], [nepseData]);

  const enrichStock = useCallback((stock: Stock): Stock => {
    const fullData = allStocks.find(s => s.symbol === stock.symbol);
    return fullData || stock;
  }, [allStocks]);

  const topGainers = useMemo(() => nepseData?.topGainers?.slice(0, 5).map(enrichStock) || [], [nepseData, enrichStock]);
  const topLosers = useMemo(() => nepseData?.topLosers?.slice(0, 5).map(enrichStock) || [], [nepseData, enrichStock]);
  const topTurnover = useMemo(() => nepseData?.topTurnover?.slice(0, 5).map(enrichStock) || [], [nepseData, enrichStock]);

  const marketSentiment = useMemo(() => {
    const total = gainers + losers + unchanged;
    if (total === 0) return 50;
    return Math.round((gainers / total) * 100);
  }, [gainers, losers, unchanged]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-100 rounded-full animate-spin border-t-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-slate-800 mb-2 animate-pulse">
            Loading Market Dashboard
          </h1>
          <p className="text-slate-600">Fetching real-time NEPSE data...</p>
        </div>
      </div>
    );
  }

  if (error || !nepseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.698-.833-2.464 0L4.404 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3">
            {error ? "Connection Error" : "No Data Available"}
          </h1>
          <p className="text-slate-600 mb-6">
            {error || "Unable to fetch NEPSE data at this time."}
          </p>
          <div className="space-y-4">
            <button
              onClick={() => refreshData()}
              className="w-full px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry Connection
              </span>
            </button>
            <p className="text-sm text-slate-500">
              Last attempt: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-20 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-20 w-96 h-96 bg-slate-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Modern Navbar */}
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent tracking-tight">
                    Nepse Suchana
                  </span>
                  <p className="text-xs text-gray-500 -mt-1 font-medium">
                    Smart Portfolio & Trading
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <a href="/portfolio" className="text-base font-semibold text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50">
                  Portfolio
                </a>
                <a href="/demo-trading" className="text-base font-semibold text-gray-700 hover:text-indigo-600 transition-colors px-3 py-2 rounded-lg hover:bg-indigo-50">
                  Demo Trading
                </a>
              </div>
              
              <div className="flex-1"></div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isRefreshing ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  {isRefreshing ? 'Updating...' : 'Refresh'}
                </button>
                
                <div className="hidden md:flex items-center gap-4">
                  <a href="/auth/login" className="px-5 py-2 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all">
                    Login
                  </a>
                  <a href="/auth/signup" className="px-5 py-2 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md hover:from-emerald-600 hover:to-green-700 transition-all">
                    Signup
                  </a>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Header with Market Status */}
        <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isRefreshing ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                  <span className="font-medium">Live Market Data</span>
                </div>
                <div className="hidden md:block text-sm text-slate-300">
                  Auto-refresh every 15s • Market Hours: 11:00 AM - 3:00 PM
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-300">Last Updated:</span>
                  <span className="font-medium bg-slate-800/50 px-3 py-1 rounded-lg">
                    {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div className="text-sm bg-slate-800/50 px-3 py-1 rounded-lg">
                  Sync #{refreshCount}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Section */}
          <div className="mb-10">
            <GlobalStockSearch allStocks={allStocks} />
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* NEPSE Index Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-1">NEPSE Index</h2>
                      <p className="text-slate-600">Nepal Stock Exchange Composite Index</p>
                    </div>
                    <div className={`px-5 py-2.5 rounded-xl text-lg font-bold ${nepseIndex?.changePercent && nepseIndex.changePercent >= 0 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {nepseIndex?.changePercent && nepseIndex.changePercent >= 0 ? '↗' : '↘'} 
                      {Math.abs(nepseIndex?.changePercent || 0).toFixed(2)}%
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between mb-8">
                    <div>
                      <div className="text-5xl font-bold text-slate-800 mb-3">
                        {nepseIndex?.currentValue?.toFixed(2) || 'N/A'}
                      </div>
                      <div className={`text-xl font-medium ${nepseIndex?.change && nepseIndex.change >= 0 
                        ? 'text-emerald-600' 
                        : 'text-red-600'}`}>
                        {nepseIndex?.change && nepseIndex.change >= 0 ? '+' : ''}{nepseIndex?.change?.toFixed(2) || '0.00'}
                        <span className="text-slate-500 text-base ml-3">Today's Change</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-600 mb-2">Previous Close</div>
                      <div className="text-2xl font-semibold text-slate-800">
                        {((nepseIndex?.currentValue || 0) - (nepseIndex?.change || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Chart Area */}
                  <div className="h-40">
                    <IndexChart 
                      currentValue={nepseIndex?.currentValue || 0}
                      changePercent={nepseIndex?.changePercent || 0}
                      isPositive={nepseIndex?.changePercent && nepseIndex.changePercent >= 0}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Market Overview */}
            <div>
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 h-full hover:shadow-2xl transition-shadow duration-300">
                <div className="p-8">
                  <h2 className="text-xl font-bold text-slate-800 mb-8">Market Overview</h2>
                  
                  {/* Sentiment */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-700 font-medium">Market Sentiment</span>
                      <span className={`text-sm font-bold ${marketSentiment >= 60 ? 'text-emerald-600' : marketSentiment <= 40 ? 'text-red-600' : 'text-amber-600'}`}>
                        {marketSentiment >= 60 ? 'Bullish' : marketSentiment <= 40 ? 'Bearish' : 'Neutral'}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full rounded-full ${marketSentiment >= 60 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : marketSentiment <= 40 ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-amber-400 to-amber-500'}`}
                        style={{ width: `${marketSentiment}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Bearish</span>
                      <span>Neutral</span>
                      <span>Bullish</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-emerald-700">{gainers}</div>
                          <div className="text-sm text-slate-600">Advancing</div>
                        </div>
                      </div>
                      <div className="text-emerald-600 font-medium">
                        {((gainers / (gainers + losers + unchanged)) * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-700">{losers}</div>
                          <div className="text-sm text-slate-600">Declining</div>
                        </div>
                      </div>
                      <div className="text-red-600 font-medium">
                        {((losers / (gainers + losers + unchanged)) * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 hover:bg-blue-100 p-4 rounded-xl transition-colors">
                        <div className="text-2xl font-bold text-blue-700 mb-1">{formatCrore(totalTurnover)}</div>
                        <div className="text-sm text-slate-600">Turnover (Cr)</div>
                      </div>
                      <div className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-xl transition-colors">
                        <div className="text-2xl font-bold text-indigo-700 mb-1">{formatNumber(totalVolume)}</div>
                        <div className="text-sm text-slate-600">Volume</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Market Summary Section */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Market Summary</h2>
                <p className="text-slate-600">Key market statistics and indicators</p>
              </div>
              <div className="flex items-center gap-4">
                {isRefreshing && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-sm">Updating...</span>
                  </div>
                )}
                <button
                  onClick={refreshData}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Full Details →
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 hover:shadow-2xl transition-shadow duration-300">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {nepseData.marketSummary?.slice(0, 8).map((summary, index) => (
                  <div 
                    key={index} 
                    className="group bg-slate-50 hover:bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  >
                    <div className="text-sm text-slate-500 mb-2 truncate">{summary.name}</div>
                    <div className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {summary.name.includes('Turnover') ? `₹${formatCrore(summary.value)} Cr` : formatNumber(summary.value)}
                    </div>
                    <div className="h-1 w-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mt-3 transform group-hover:w-full transition-all duration-300"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sector Indices Section */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Sector Indices</h2>
                <p className="text-slate-600">Performance across different market sectors</p>
              </div>
              <span className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-slate-700 text-sm font-medium rounded-lg border border-blue-100">
                {otherIndices.length} sectors
              </span>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-8">
                {otherIndices.slice(0, 12).map((index) => (
                  <div 
                    key={index.symbol} 
                    className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                          {index.name.split(' ')[0]}
                        </span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${index.changePercent >= 0 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="text-lg font-bold text-slate-800 mb-1">
                        {index.currentValue.toFixed(2)}
                      </div>
                      <div className={`text-sm font-medium ${index.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {index.change >= 0 ? '↗' : '↘'} {Math.abs(index.change).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Performers Section */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Top Performers</h2>
              <div className="text-sm text-slate-500">
                Auto-refresh in 15s • Sync #{refreshCount}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Top Gainers */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Top Gainers</h3>
                        <p className="text-slate-600">Highest daily gain percentage</p>
                      </div>
                    </div>
                    <span className="px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg border border-emerald-200">
                      Top 5
                    </span>
                  </div>
                  <StockTable 
                    stocks={topGainers} 
                    title="" 
                    showName={false} 
                    showTurnover={false}
                    loading={isRefreshing}
                    variant="gainers"
                  />
                </div>
              </div>

              {/* Top Losers */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-50 rounded-xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Top Losers</h3>
                        <p className="text-slate-600">Highest daily loss percentage</p>
                      </div>
                    </div>
                    <span className="px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-200">
                      Top 5
                    </span>
                  </div>
                  <StockTable 
                    stocks={topLosers} 
                    title="" 
                    showName={false} 
                    showTurnover={false}
                    loading={isRefreshing}
                    variant="losers"
                  />
                </div>
              </div>

              {/* Top Turnover */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Top Turnover</h3>
                        <p className="text-slate-600">Highest trading volume</p>
                      </div>
                    </div>
                    <span className="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200">
                      Top 5
                    </span>
                  </div>
                  <StockTable 
                    stocks={topTurnover} 
                    title="" 
                    showName={false} 
                    showTurnover={true}
                    loading={isRefreshing}
                    variant="turnover"
                  />
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-10">
              <div className="max-w-md">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xl">NEPSE Dashboard</h3>
                    <p className="text-slate-600">Real-time market analytics platform</p>
                  </div>
                </div>
                <p className="text-slate-500 text-sm mb-6">
                  Comprehensive market data and analytics for Nepal Stock Exchange. 
                  Stay updated with real-time prices, indices, and market trends.
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={refreshData}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Data
                  </button>
                  <div className="text-sm text-slate-500">
                    Last update: {lastUpdated.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div>
                  <h4 className="font-bold text-slate-800 mb-4">Platform</h4>
                  <ul className="space-y-3">
                    <li><a href="/features" className="text-slate-600 hover:text-blue-600 transition-colors">Features</a></li>
                    <li><a href="/pricing" className="text-slate-600 hover:text-blue-600 transition-colors">Pricing</a></li>
                    <li><a href="/api" className="text-slate-600 hover:text-blue-600 transition-colors">API</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-4">Resources</h4>
                  <ul className="space-y-3">
                    <li><a href="/documentation" className="text-slate-600 hover:text-blue-600 transition-colors">Documentation</a></li>
                    <li><a href="/blog" className="text-slate-600 hover:text-blue-600 transition-colors">Blog</a></li>
                    <li><a href="/support" className="text-slate-600 hover:text-blue-600 transition-colors">Support</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-4">Legal</h4>
                  <ul className="space-y-3">
                    <li><a href="/privacy" className="text-slate-600 hover:text-blue-600 transition-colors">Privacy Policy</a></li>
                    <li><a href="/terms" className="text-slate-600 hover:text-blue-600 transition-colors">Terms of Service</a></li>
                    <li><a href="/disclaimer" className="text-slate-600 hover:text-blue-600 transition-colors">Disclaimer</a></li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="border-t border-slate-200 mt-10 pt-8 text-center text-slate-500 text-sm">
              <p>© {new Date().getFullYear()} Nepse Suchana. All rights reserved. Data provided by NEPSE API. Market data delayed by 15 minutes.</p>
              <p className="mt-2">This platform is for informational purposes only. Always verify with official sources before making investment decisions.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Add animation styles */}
      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}