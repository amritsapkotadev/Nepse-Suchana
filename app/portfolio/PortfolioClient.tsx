"use client";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { FaSearch, FaBuilding, FaHashtag, FaMoneyBillWave, FaPlusCircle, FaTrash, FaChartLine, FaSort, FaSortUp, FaSortDown, FaInfoCircle, FaEdit, FaEye, FaEyeSlash, FaExternalLinkAlt, FaTimes, FaPercentage, FaRupeeSign, FaLayerGroup, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import debounce from "lodash/debounce";

interface Stock {
  symbol: string;
  name: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
  lastTradedPrice?: number;
  close?: number;
}

interface PortfolioStock {
  id: string;
  symbol: string;
  companyName: string;
  quantity: number;
  buyPrice: number;
  transactionType: "Buy" | "Sell";
  dateAdded: Date;
}

const NEPSE_API_URL = "/api/nepse-proxy";

export default function NepsePortfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nepse-portfolio');
      return saved ? JSON.parse(saved).map((stock: any) => ({
        ...stock,
        dateAdded: new Date(stock.dateAdded)
      })) : [];
    }
    return [];
  });
  
  const [form, setForm] = useState({
    symbol: "",
    companyName: "",
    quantity: "",
    buyPrice: "",
    transactionType: "Buy" as "Buy" | "Sell",
  });
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [suggestions, setSuggestions] = useState<Stock[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof PortfolioStock; direction: 'asc' | 'desc' }>({ 
    key: 'dateAdded', 
    direction: 'desc' 
  });
  const [showTotalValue, setShowTotalValue] = useState(true);
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all stocks on component mount
  useEffect(() => {
    fetchAllStocks();
  }, []);

  // Save portfolio to localStorage
  useEffect(() => {
    if (portfolio.length > 0) {
      localStorage.setItem('nepse-portfolio', JSON.stringify(portfolio));
    } else {
      localStorage.removeItem('nepse-portfolio');
    }
  }, [portfolio]);

  // Fetch all stocks from API - UPDATED TO USE LATEST PRICES
  const fetchAllStocks = async () => {
    if (!NEPSE_API_URL) {
      setError("NEPSE API URL is not set. Please check your environment variable NEXT_PUBLIC_NEPSE_API_URL.");
      setAllStocks([]);
      return;
    }
    try {
      setIsLoadingStocks(true);
      const res = await fetch(NEPSE_API_URL);
      if (!res.ok) {
        setError(`Failed to fetch stocks from NEPSE API. Status: ${res.status} ${res.statusText}`);
        setAllStocks([]);
        return;
      }
      const data = await res.json();
      if (!data.liveCompanyData) {
        setError("API response does not contain liveCompanyData. Check the API format.");
        setAllStocks([]);
        return;
      }
      
      // UPDATED: Prioritize lastTradedPrice, then currentprice, then close price
      const stocks = (data.liveCompanyData || []).map((c: any) => ({ 
        symbol: c.symbol, 
        name: c.securityName,
        // Use lastTradedPrice if available, otherwise currentprice, otherwise close
        lastTradedPrice: c.lastTradedPrice || null,
        currentPrice: c.currentprice || c.close || 0,
        close: c.close || 0,
        change: c.change || 0,
        changePercent: c.changePercent || 0
      }));
      setAllStocks(stocks);
      setError("");
    } catch (error) {
      setError("Failed to fetch stocks. Please check your internet connection or try again later.");
      setAllStocks([]);
      console.error('Failed to fetch stocks:', error);
    } finally {
      setIsLoadingStocks(false);
    }
  };

  // Debounced suggestions fetch
  const debouncedFetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsLoadingSuggestions(false);
        return;
      }
      
      try {
        const filtered = allStocks.filter(stock =>
          stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
          stock.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 8);
        
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300),
    [allStocks]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    if (name === "symbol") {
      setIsLoadingSuggestions(true);
      debouncedFetchSuggestions(value);
    }
  };

  const handleSuggestionClick = (stock: Stock) => {
    // UPDATED: Use lastTradedPrice or currentPrice for buyPrice
    const currentPrice = stock.lastTradedPrice || stock.currentPrice || stock.close || 0;
    setForm(prev => ({ 
      ...prev, 
      symbol: stock.symbol, 
      companyName: stock.name,
      buyPrice: currentPrice.toString()
    }));
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const resetForm = () => {
    setForm({ symbol: "", companyName: "", quantity: "", buyPrice: "", transactionType: "Buy" });
    setIsEditing(false);
    setEditId(null);
    setError("");
    setSuccess("");
  };

  // Calculate total owned shares for a symbol
  const getTotalOwnedShares = (symbol: string) => {
    return portfolio.reduce((total, stock) => {
      if (stock.symbol === symbol) {
        return stock.transactionType === "Buy" 
          ? total + stock.quantity 
          : total - stock.quantity;
      }
      return total;
    }, 0);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!form.symbol || !form.companyName || !form.quantity || !form.buyPrice) {
      setError("All fields are required.");
      return;
    }

    const quantity = Number(form.quantity);
    const buyPrice = Number(form.buyPrice);
    
    if (isNaN(quantity) || isNaN(buyPrice) || quantity <= 0 || buyPrice <= 0) {
      setError("Quantity and price must be valid positive numbers.");
      return;
    }

    const symbol = form.symbol.toUpperCase();

    if (isEditing && editId) {
      // Edit existing stock
      setPortfolio(prev => prev.map(stock => 
        stock.id === editId 
          ? { 
              ...stock, 
              symbol,
              companyName: form.companyName,
              quantity,
              buyPrice,
              transactionType: form.transactionType,
              dateAdded: new Date()
            }
          : stock
      ));
      setSuccess("Stock updated successfully!");
    } else {
      // Check if selling more than owned
      const totalOwned = getTotalOwnedShares(symbol);
      
      if (form.transactionType === "Sell" && quantity > totalOwned) {
        setError(`Cannot sell ${quantity} shares. You only own ${totalOwned} shares of ${symbol}.`);
        return;
      }

      // Add new transaction
      const newStock: PortfolioStock = {
        id: crypto.randomUUID(),
        symbol,
        companyName: form.companyName,
        quantity,
        buyPrice,
        transactionType: form.transactionType,
        dateAdded: new Date()
      };

      setPortfolio(prev => [...prev, newStock]);
      setSuccess(`${form.transactionType} transaction for ${symbol} added successfully!`);
    }

    resetForm();
  };

  const handleEdit = (stock: PortfolioStock) => {
    setForm({
      symbol: stock.symbol,
      companyName: stock.companyName,
      quantity: stock.quantity.toString(),
      buyPrice: stock.buyPrice.toString(),
      transactionType: stock.transactionType,
    });
    setIsEditing(true);
    setEditId(stock.id);
    setError("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    setPortfolio(prev => prev.filter(s => s.id !== id));
    setSuccess("Stock removed successfully!");
  };

  const handleSort = (key: keyof PortfolioStock) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedPortfolio = [...portfolio].sort((a, b) => {
    if (sortConfig.key === 'dateAdded') {
      return sortConfig.direction === 'asc' 
        ? new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
        : new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    }
    
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortConfig.direction === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    return 0;
  });

  // UPDATED: Calculate portfolio metrics using latest transaction prices
  const calculatePortfolioMetrics = () => {
    const holdings = new Map<string, {
      totalQuantity: number;
      totalInvestment: number;
      avgBuyPrice: number;
      companyName: string;
      lastTransactionPrice: number;
    }>();

    // Group by symbol and calculate holdings
    portfolio.forEach(stock => {
      if (!holdings.has(stock.symbol)) {
        holdings.set(stock.symbol, {
          totalQuantity: 0,
          totalInvestment: 0,
          avgBuyPrice: 0,
          companyName: stock.companyName,
          lastTransactionPrice: stock.buyPrice // Initialize with first buy price
        });
      }
      
      const holding = holdings.get(stock.symbol)!;
      
      if (stock.transactionType === "Buy") {
        const newTotalQuantity = holding.totalQuantity + stock.quantity;
        const newTotalInvestment = holding.totalInvestment + (stock.quantity * stock.buyPrice);
        holding.totalQuantity = newTotalQuantity;
        holding.totalInvestment = newTotalInvestment;
        holding.avgBuyPrice = newTotalInvestment / newTotalQuantity;
        holding.lastTransactionPrice = stock.buyPrice; // Update with latest buy price
      } else {
        // For sells, we need to track the cost basis properly
        const avgCost = holding.avgBuyPrice;
        holding.totalQuantity -= stock.quantity;
        const soldValue = stock.quantity * avgCost;
        holding.totalInvestment = Math.max(0, holding.totalInvestment - soldValue);
        holding.lastTransactionPrice = stock.buyPrice; // Update with sell price
      }
    });

    // Calculate totals using latest market prices
    let totalInvestment = 0;
    let totalCurrentValue = 0;
    let totalShares = 0;

    holdings.forEach((holding, symbol) => {
      if (holding.totalQuantity > 0) {
        totalInvestment += holding.totalInvestment;
        totalShares += holding.totalQuantity;
        
        // UPDATED: Get the latest price from allStocks
        const stockInfo = allStocks.find(s => s.symbol === symbol);
        
        // Priority: lastTradedPrice -> currentPrice -> close -> lastTransactionPrice
        const latestPrice = stockInfo?.lastTradedPrice || 
                           stockInfo?.currentPrice || 
                           stockInfo?.close || 
                           holding.lastTransactionPrice;
        
        totalCurrentValue += holding.totalQuantity * latestPrice;
      }
    });

    const profitLoss = totalCurrentValue - totalInvestment;
    const profitLossPercentage = totalInvestment > 0 ? (profitLoss / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      totalCurrentValue,
      totalShares,
      profitLoss,
      profitLossPercentage,
      holdings: Array.from(holdings.entries()).filter(([_, h]) => h.totalQuantity > 0),
      // Additional metrics
      totalHoldings: holdings.size,
      averageReturn: profitLossPercentage,
      isProfitable: profitLoss >= 0
    };
  };

  const metrics = calculatePortfolioMetrics();

  const getSortIcon = (key: keyof PortfolioStock) => {
    if (sortConfig.key !== key) return <FaSort className="ml-1 opacity-30" />;
    return sortConfig.direction === 'asc' 
      ? <FaSortUp className="ml-1" />
      : <FaSortDown className="ml-1" />;
  };

  // Get latest price for a symbol
  const getLatestPrice = (symbol: string) => {
    const stockInfo = allStocks.find(s => s.symbol === symbol);
    return stockInfo?.lastTradedPrice || stockInfo?.currentPrice || stockInfo?.close || 0;
  };

  // Refresh stock prices
  const handleRefreshPrices = async () => {
    await fetchAllStocks();
    setSuccess("Stock prices updated successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <FaChartLine className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                NEPSE Portfolio Pro
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefreshPrices}
                disabled={isLoadingStocks}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center"
              >
                {isLoadingStocks ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  "Refresh Prices"
                )}
              </button>
              <Link 
                href="/" 
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:shadow-lg transition-all"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Portfolio Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your investments with real-time NEPSE prices
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {new Date().toLocaleTimeString('en-NP', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${metrics.isProfitable ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {metrics.isProfitable ? 'Profit' : 'Loss'}: {Math.abs(metrics.profitLossPercentage).toFixed(2)}%
              </div>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Investment Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <FaRupeeSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <button
                onClick={() => setShowTotalValue(!showTotalValue)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={showTotalValue ? "Hide value" : "Show value"}
              >
                {showTotalValue ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Total Investment
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {showTotalValue ? `Rs. ${metrics.totalInvestment.toLocaleString('en-NP', { minimumFractionDigits: 2 })}` : '••••••'}
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Based on purchase prices
              </p>
            </div>
          </motion.div>

          {/* Current Value Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow"
          >
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 mb-4 w-fit">
              <FaChartLine className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Current Market Value
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              Rs. {metrics.totalCurrentValue.toLocaleString('en-NP', { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Using latest market prices
              </p>
            </div>
          </motion.div>

          {/* Total Holdings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow"
          >
            <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 mb-4 w-fit">
              <FaLayerGroup className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Total Holdings
            </p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.totalShares.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  shares
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {metrics.holdings.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  companies
                </p>
              </div>
            </div>
          </motion.div>

          {/* P&L Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 hover:shadow-xl transition-shadow ${
              metrics.profitLoss >= 0 
                ? 'border-emerald-200 dark:border-emerald-900/50' 
                : 'border-red-200 dark:border-red-900/50'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${
                metrics.profitLoss >= 0 
                  ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                {metrics.profitLoss >= 0 ? (
                  <FaArrowUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <FaArrowDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
              </div>
              <FaPercentage className={`w-5 h-5 ${
                metrics.profitLoss >= 0 
                  ? 'text-emerald-500 dark:text-emerald-400' 
                  : 'text-red-500 dark:text-red-400'
              }`} />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Total P&L
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-2xl font-bold ${
                  metrics.profitLoss >= 0 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {metrics.profitLoss >= 0 ? '+' : ''}Rs. {Math.abs(metrics.profitLoss).toLocaleString('en-NP', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                metrics.profitLoss >= 0 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {metrics.profitLossPercentage >= 0 ? '+' : ''}{metrics.profitLossPercentage.toFixed(2)}%
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Unrealized gains/losses
              </p>
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Add Transaction Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Add buy or sell transactions to track your portfolio
                  </p>
                </div>

                <form onSubmit={handleAdd} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Symbol Input */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <FaSearch className="inline mr-2" />
                        Stock Symbol *
                      </label>
                      <div className="relative">
                        <input
                          ref={inputRef}
                          name="symbol"
                          value={form.symbol}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Type symbol or company name..."
                          required
                          onFocus={() => setShowSuggestions(suggestions.length > 0)}
                        />
                        
                        {/* Suggestions Dropdown */}
                        <AnimatePresence>
                          {(showSuggestions || isLoadingSuggestions) && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden"
                            >
                              {isLoadingSuggestions ? (
                                <div className="p-4 text-center">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Searching stocks...</p>
                                </div>
                              ) : suggestions.length > 0 ? (
                                <>
                                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                      Select a stock
                                    </p>
                                  </div>
                                  <div className="max-h-64 overflow-y-auto">
                                    {suggestions.map((stock) => {
                                      const ownedShares = getTotalOwnedShares(stock.symbol);
                                      const latestPrice = stock.lastTradedPrice || stock.currentPrice || stock.close || 0;
                                      return (
                                        <motion.div
                                          key={stock.symbol}
                                          whileHover={{ scale: 1.005 }}
                                          className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer border-b last:border-b-0 border-gray-100 dark:border-gray-800 transition-colors"
                                          onMouseDown={() => handleSuggestionClick(stock)}
                                        >
                                          <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                              <div className="flex items-center space-x-2">
                                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                                  {stock.symbol}
                                                </span>
                                                {ownedShares > 0 && (
                                                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                                                    Owned: {ownedShares}
                                                  </span>
                                                )}
                                              </div>
                                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                {stock.name}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <div className="font-semibold text-gray-900 dark:text-white">
                                                Rs. {latestPrice.toLocaleString('en-NP', { minimumFractionDigits: 2 })}
                                              </div>
                                              {stock.change !== undefined && (
                                                <div className={`text-xs ${stock.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                  {stock.change >= 0 ? '+' : ''}{stock.change} ({stock.changePercent?.toFixed(2)}%)
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                </>
                              ) : form.symbol ? (
                                <div className="p-4 text-center">
                                  <p className="text-sm text-gray-500 dark:text-gray-400">No stocks found</p>
                                </div>
                              ) : null}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Company Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <FaBuilding className="inline mr-2" />
                        Company Name *
                      </label>
                      <input
                        name="companyName"
                        value={form.companyName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Company name"
                        required
                      />
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <FaHashtag className="inline mr-2" />
                        Quantity *
                      </label>
                      <input
                        name="quantity"
                        type="number"
                        min="1"
                        step="1"
                        value={form.quantity}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="0"
                        required
                      />
                      {form.symbol && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Currently own: {getTotalOwnedShares(form.symbol.toUpperCase())} shares
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <FaMoneyBillWave className="inline mr-2" />
                        Price per Share *
                      </label>
                      <input
                        name="buyPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.buyPrice}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    {/* Transaction Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Transaction Type *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, transactionType: "Buy" }))}
                          className={`px-4 py-3 rounded-xl font-medium transition-all ${
                            form.transactionType === "Buy"
                              ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg"
                              : "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                          }`}
                        >
                          Buy
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, transactionType: "Sell" }))}
                          className={`px-4 py-3 rounded-xl font-medium transition-all ${
                            form.transactionType === "Sell"
                              ? "bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg"
                              : "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                          }`}
                        >
                          Sell
                        </button>
                      </div>
                    </div>

                    {/* Total Value Preview */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Transaction Summary
                      </label>
                      <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">
                              {form.transactionType} Value:
                            </span>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              Rs. {form.quantity && form.buyPrice 
                                ? (Number(form.quantity) * Number(form.buyPrice)).toLocaleString('en-NP', { minimumFractionDigits: 2 })
                                : '0.00'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">
                              Shares After:
                            </span>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {form.symbol ? (
                                getTotalOwnedShares(form.symbol.toUpperCase()) + 
                                (form.transactionType === "Buy" ? Number(form.quantity) : -Number(form.quantity))
                              ) : 0} shares
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <AnimatePresence>
                    {(error || success) && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-6"
                      >
                        {error && (
                          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <div className="flex items-center">
                              <FaInfoCircle className="text-red-500 mr-3 flex-shrink-0" />
                              <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                            </div>
                          </div>
                        )}
                        {success && (
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                            <div className="flex items-center">
                              <FaInfoCircle className="text-emerald-500 mr-3 flex-shrink-0" />
                              <p className="text-emerald-600 dark:text-emerald-400 font-medium">{success}</p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form Actions */}
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className={`px-6 py-3 text-white font-medium rounded-xl hover:shadow-lg transition-all flex items-center ${
                        isEditing 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                      }`}
                    >
                      <FaPlusCircle className="mr-2" />
                      {isEditing ? 'Update Transaction' : 'Add Transaction'}
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-3 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>

            {/* Portfolio Holdings Summary */}
            {metrics.holdings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-8"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Current Holdings ({metrics.holdings.length})
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Total Value: Rs. {metrics.totalCurrentValue.toLocaleString('en-NP', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metrics.holdings.map(([symbol, holding]) => {
                      const latestPrice = getLatestPrice(symbol);
                      const currentValue = holding.totalQuantity * latestPrice;
                      const profitLoss = currentValue - holding.totalInvestment;
                      const profitLossPercent = holding.totalInvestment > 0 ? (profitLoss / holding.totalInvestment) * 100 : 0;
                      
                      return (
                        <div key={symbol} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white">{symbol}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {holding.companyName}
                              </p>
                            </div>
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                              {holding.totalQuantity} shares
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Avg. Cost:</span>
                              <span className="font-medium">Rs. {holding.avgBuyPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Current Price:</span>
                              <span className="font-medium">Rs. {latestPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Investment:</span>
                              <span className="font-bold">Rs. {holding.totalInvestment.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Current Value:</span>
                              <span className="font-bold">Rs. {currentValue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">P&L:</span>
                              <span className={`font-bold ${profitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                {profitLoss >= 0 ? '+' : ''}Rs. {Math.abs(profitLoss).toFixed(2)} ({profitLossPercent.toFixed(2)}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: Transaction History */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Transaction History
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {portfolio.length} transaction{portfolio.length !== 1 ? 's' : ''}
                </p>
              </div>

              {portfolio.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                    <FaChartLine className="w-8 h-8 text-blue-400 dark:text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No transactions yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Add your first transaction above
                  </p>
                </div>
              ) : (
                <div className="p-4">
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {sortedPortfolio.map((stock) => {
                      const latestPrice = getLatestPrice(stock.symbol);
                      const currentValue = stock.quantity * latestPrice;
                      const transactionValue = stock.quantity * stock.buyPrice;
                      
                      return (
                        <motion.div
                          key={stock.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-gray-900 dark:text-white">{stock.symbol}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  stock.transactionType === 'Buy'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {stock.transactionType}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {new Date(stock.dateAdded).toLocaleDateString('en-NP')}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(stock)}
                                className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(stock.id)}
                                className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Qty:</span>
                              <span className="font-medium">{stock.quantity} shares</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Price:</span>
                              <span className="font-medium">Rs. {stock.buyPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Transaction:</span>
                              <span className="font-bold">Rs. {transactionValue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Current Price:</span>
                              <span className="font-medium">Rs. {latestPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Current Value:</span>
                              <span className="font-bold">Rs. {currentValue.toFixed(2)}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  
                  {/* Export Button */}
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => {
                        const csv = portfolio.map(stock => 
                          `${stock.symbol},${stock.companyName},${stock.quantity},${stock.transactionType},${stock.buyPrice},${(stock.quantity * stock.buyPrice).toFixed(2)},${stock.dateAdded.toISOString()}`
                        ).join('\n');
                        const blob = new Blob([`Symbol,Company,Quantity,Type,Price,Total Value,Date\n${csv}`], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'nepse-portfolio.csv';
                        a.click();
                      }}
                      className="w-full px-4 py-3 text-sm bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center"
                    >
                      <FaExternalLinkAlt className="mr-2" />
                      Export Portfolio as CSV
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              NEPSE Portfolio Tracker • Data sourced from NEPSE API • {new Date().getFullYear()}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
              Note: Prices are updated in real-time. Always verify with official sources.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}