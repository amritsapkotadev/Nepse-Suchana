"use client";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { FaSearch, FaBuilding, FaHashtag, FaMoneyBillWave, FaPlusCircle, FaTrash, FaChartLine, FaSort, FaSortUp, FaSortDown, FaInfoCircle, FaEdit, FaEye, FaEyeSlash, FaExternalLinkAlt, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import debounce from "lodash/debounce";

interface Stock {
  symbol: string;
  name: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}

interface PortfolioStock {
  id: string;
  symbol: string;
  companyName: string;
  quantity: number;
  buyPrice: number;
  transactionType: "Buy" | "Sell";
  currentPrice?: number;
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

  // Fetch all stocks from API
  const fetchAllStocks = async () => {
    if (!NEPSE_API_URL) {
      setError("NEPSE API URL is not set. Please check your environment variable NEXT_PUBLIC_NEPSE_API_URL.");
      setAllStocks([]);
      return;
    }
    try {
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
      const stocks = (data.liveCompanyData || []).map((c: any) => ({ 
        symbol: c.symbol, 
        name: c.securityName,
        currentPrice: c.closingPrice || c.ltp || 0,
        change: c.change || 0,
        changePercent: c.changePercent || 0
      }));
      setAllStocks(stocks);
    } catch (error) {
      setError("Failed to fetch stocks. Please check your internet connection or try again later. See console for details.");
      setAllStocks([]);
      console.error('Failed to fetch stocks:', error);
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
    setForm(prev => ({ 
      ...prev, 
      symbol: stock.symbol, 
      companyName: stock.name,
      buyPrice: stock.currentPrice?.toString() || ""
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

  // Calculate portfolio metrics
  const calculatePortfolioMetrics = () => {
    const holdings = new Map<string, {
      totalQuantity: number;
      totalInvestment: number;
      avgBuyPrice: number;
      companyName: string;
    }>();

    // Group by symbol
    portfolio.forEach(stock => {
      if (!holdings.has(stock.symbol)) {
        holdings.set(stock.symbol, {
          totalQuantity: 0,
          totalInvestment: 0,
          avgBuyPrice: 0,
          companyName: stock.companyName
        });
      }
      
      const holding = holdings.get(stock.symbol)!;
      if (stock.transactionType === "Buy") {
        const newTotalQuantity = holding.totalQuantity + stock.quantity;
        const newTotalInvestment = holding.totalInvestment + (stock.quantity * stock.buyPrice);
        holding.totalQuantity = newTotalQuantity;
        holding.totalInvestment = newTotalInvestment;
        holding.avgBuyPrice = newTotalInvestment / newTotalQuantity;
      } else {
        holding.totalQuantity -= stock.quantity;
        // When selling, we reduce the investment proportionally
        const soldValue = stock.quantity * holding.avgBuyPrice;
        holding.totalInvestment = Math.max(0, holding.totalInvestment - soldValue);
      }
    });

    // Calculate totals
    let totalInvestment = 0;
    let totalCurrentValue = 0;
    let totalShares = 0;

    holdings.forEach(holding => {
      if (holding.totalQuantity > 0) {
        totalInvestment += holding.totalInvestment;
        totalShares += holding.totalQuantity;
        
        // Get current price from allStocks or use avg price as fallback
        const stockInfo = allStocks.find(s => s.symbol === Array.from(holdings.keys()).find(k => k));
        const currentPrice = stockInfo?.currentPrice || holding.avgBuyPrice;
        totalCurrentValue += holding.totalQuantity * currentPrice;
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
      holdings: Array.from(holdings.entries()).filter(([_, h]) => h.totalQuantity > 0)
    };
  };

  const metrics = calculatePortfolioMetrics();

  const getSortIcon = (key: keyof PortfolioStock) => {
    if (sortConfig.key !== key) return <FaSort className="ml-1 opacity-30" />;
    return sortConfig.direction === 'asc' 
      ? <FaSortUp className="ml-1" />
      : <FaSortDown className="ml-1" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                NEPSE Portfolio
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/demo-trading" 
                className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
              >
                Demo Trading
              </Link>
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
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            NEPSE Portfolio Tracker
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track your Nepalese stock investments with real-time calculations
          </p>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Investment Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <FaMoneyBillWave className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <button
                onClick={() => setShowTotalValue(!showTotalValue)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title={showTotalValue ? "Hide value" : "Show value"}
              >
                {showTotalValue ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Total Investment
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {showTotalValue ? `Rs. ${metrics.totalInvestment.toLocaleString('en-NP', { minimumFractionDigits: 2 })}` : '••••••'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Based on purchase prices
            </p>
          </motion.div>

          {/* Total Shares Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700"
          >
            <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 mb-4 w-fit">
              <FaHashtag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Total Shares Held
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.totalShares.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Across {metrics.holdings.length} companies
            </p>
          </motion.div>

          {/* Current Value Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700"
          >
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 mb-4 w-fit">
              <FaChartLine className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Current Value
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              Rs. {metrics.totalCurrentValue.toLocaleString('en-NP', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Estimated market value
            </p>
          </motion.div>

          {/* P&L Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border ${
              metrics.profitLoss >= 0 
                ? 'border-emerald-100 dark:border-emerald-900/50' 
                : 'border-red-100 dark:border-red-900/50'
            }`}
          >
            <div className={`p-3 rounded-xl mb-4 w-fit ${
              metrics.profitLoss >= 0 
                ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <FaChartLine className={`w-6 h-6 ${
                metrics.profitLoss >= 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-red-600 dark:text-red-400'
              }`} />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Total P&L
            </p>
            <div className="flex items-center space-x-2">
              <p className={`text-2xl font-bold ${
                metrics.profitLoss >= 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {metrics.profitLoss >= 0 ? '+' : ''}Rs. {Math.abs(metrics.profitLoss).toLocaleString('en-NP', { minimumFractionDigits: 2 })}
              </p>
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                metrics.profitLoss >= 0 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {metrics.profitLossPercentage >= 0 ? '+' : ''}{metrics.profitLossPercentage.toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Unrealized gains/losses
            </p>
          </motion.div>
        </div>

        {/* Add/Edit Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Transaction' : 'Add Transaction'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Add buy or sell transactions to track your portfolio
              </p>
            </div>

            <form onSubmit={handleAdd} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
                {/* Symbol Input with Enhanced Suggestions */}
                <div className="relative col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <FaSearch className="inline mr-2" />
                    Stock Symbol *
                  </label>
                  <div className="relative">
                    <div className="flex items-center">
                      <input
                        ref={inputRef}
                        name="symbol"
                        value={form.symbol}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-l-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Type symbol or company name..."
                        required
                        onFocus={() => setShowSuggestions(suggestions.length > 0)}
                      />
                      {form.symbol && (
                        <button
                          type="button"
                          onClick={() => {
                            setForm(prev => ({ ...prev, symbol: "" }));
                            setSuggestions([]);
                          }}
                          className="px-3 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-l-0 rounded-r-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title="Clear"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                    
                    {/* Enhanced Suggestions Dropdown */}
                    <AnimatePresence>
                      {(showSuggestions || isLoadingSuggestions) && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden"
                        >
                          {isLoadingSuggestions ? (
                            <div className="p-4 text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Searching stocks...</p>
                            </div>
                          ) : suggestions.length > 0 ? (
                            <>
                              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                  Select a stock ({suggestions.length} found)
                                </p>
                              </div>
                              <div className="max-h-64 overflow-y-auto">
                                {suggestions.map((stock) => {
                                  const ownedShares = getTotalOwnedShares(stock.symbol);
                                  return (
                                    <motion.div
                                      key={stock.symbol}
                                      whileHover={{ scale: 1.005 }}
                                      className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer border-b last:border-b-0 border-slate-100 dark:border-slate-800 transition-colors"
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
                                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                                            {stock.name}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          {stock.currentPrice && (
                                            <>
                                              <div className="font-semibold text-slate-900 dark:text-white">
                                                Rs. {stock.currentPrice.toLocaleString('en-NP', { minimumFractionDigits: 2 })}
                                              </div>
                                              {stock.change !== undefined && (
                                                <div className={`text-xs ${stock.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                  {stock.change >= 0 ? '+' : ''}{stock.change} ({stock.changePercent?.toFixed(2)}%)
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 text-center">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Click to select • Press Enter to confirm
                                </p>
                              </div>
                            </>
                          ) : form.symbol ? (
                            <div className="p-4 text-center">
                              <p className="text-sm text-slate-500 dark:text-slate-400">No stocks found</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try a different symbol or name</p>
                            </div>
                          ) : null}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Company Name */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <FaBuilding className="inline mr-2" />
                    Company Name *
                  </label>
                  <input
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Company name"
                    required
                  />
                </div>

                {/* Transaction Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Type *
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, transactionType: "Buy" }))}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                        form.transactionType === "Buy"
                          ? "bg-emerald-500 text-white shadow-lg"
                          : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      Buy
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, transactionType: "Sell" }))}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                        form.transactionType === "Sell"
                          ? "bg-red-500 text-white shadow-lg"
                          : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      Sell
                    </button>
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0"
                    required
                  />
                  {form.symbol && form.transactionType === "Sell" && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Owned: {getTotalOwnedShares(form.symbol.toUpperCase())} shares
                    </p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0.00"
                    required
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Current price from market
                  </p>
                </div>

                {/* Total Value Preview */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Transaction Value
                  </label>
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">
                        Total {form.transactionType} Value:
                      </span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">
                        Rs. {form.quantity && form.buyPrice 
                          ? (Number(form.quantity) * Number(form.buyPrice)).toLocaleString('en-NP', { minimumFractionDigits: 2 })
                          : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error and Success Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                  >
                    <div className="flex items-center">
                      <FaInfoCircle className="text-red-500 mr-3 flex-shrink-0" />
                      <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                    </div>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl"
                  >
                    <div className="flex items-center">
                      <FaInfoCircle className="text-emerald-500 mr-3 flex-shrink-0" />
                      <p className="text-emerald-600 dark:text-emerald-400 font-medium">{success}</p>
                    </div>
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
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
                <div className="flex-1 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      if (form.symbol) {
                        const owned = getTotalOwnedShares(form.symbol.toUpperCase());
                        alert(`You own ${owned} shares of ${form.symbol.toUpperCase()}\nBuy Transactions: ${owned > 0 ? owned : 0} shares`);
                      }
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    Check Holdings
                  </button>
                </div>
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
            className="mb-8"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Current Holdings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.holdings.map(([symbol, holding]) => (
                  <div key={symbol} className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{symbol}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                          {holding.companyName}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                        {holding.totalQuantity} shares
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Avg. Price:</span>
                        <span className="font-medium">Rs. {holding.avgBuyPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Investment:</span>
                        <span className="font-bold">Rs. {holding.totalInvestment.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Portfolio Transactions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Transaction History
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {portfolio.length} transaction{portfolio.length !== 1 ? 's' : ''} recorded
                </p>
              </div>
              {portfolio.length > 0 && (
                <div className="flex items-center space-x-3">
                  <select 
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                    value={sortConfig.key}
                    onChange={(e) => handleSort(e.target.value as keyof PortfolioStock)}
                  >
                    <option value="dateAdded">Date</option>
                    <option value="symbol">Symbol</option>
                    <option value="transactionType">Type</option>
                    <option value="quantity">Quantity</option>
                    <option value="buyPrice">Price</option>
                  </select>
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
                    className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Export CSV
                  </button>
                </div>
              )}
            </div>
          </div>

          {portfolio.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
                <FaChartLine className="w-12 h-12 text-blue-400 dark:text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No transactions yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Add your first transaction to start tracking your portfolio
              </p>
              <button
                onClick={() => inputRef.current?.focus()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
              >
                Add Your First Transaction
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    {[
                      { key: 'dateAdded', label: 'Date' },
                      { key: 'symbol', label: 'Symbol' },
                      { key: 'companyName', label: 'Company' },
                      { key: 'transactionType', label: 'Type' },
                      { key: 'quantity', label: 'Quantity' },
                      { key: 'buyPrice', label: 'Price' },
                      { key: 'buyPrice', label: 'Total Value' },
                      { key: 'actions', label: 'Actions' }
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                        onClick={() => key !== 'actions' && handleSort(key as keyof PortfolioStock)}
                      >
                        <div className="flex items-center">
                          {label}
                          {key !== 'actions' && getSortIcon(key as keyof PortfolioStock)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sortedPortfolio.map((stock) => {
                    const totalValue = stock.quantity * stock.buyPrice;
                    const currentOwned = getTotalOwnedShares(stock.symbol);
                    
                    return (
                      <motion.tr
                        key={stock.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {new Date(stock.dateAdded).toLocaleDateString('en-NP', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">
                            {new Date(stock.dateAdded).toLocaleTimeString('en-NP', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mr-3">
                              <span className="text-white font-bold text-sm">
                                {stock.symbol.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {stock.symbol}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                Owned: {currentOwned}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {stock.companyName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            stock.transactionType === 'Buy'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {stock.transactionType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {stock.quantity.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            Rs. {stock.buyPrice.toLocaleString('en-NP', { minimumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            Rs. {totalValue.toLocaleString('en-NP', { minimumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(stock)}
                              className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(stock.id)}
                              className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Footer Actions */}
        {portfolio.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Portfolio Tips</h3>
              <ul className="text-sm opacity-90 space-y-1">
                <li>• Buy low, sell high - track market trends</li>
                <li>• Diversify across different sectors</li>
                <li>• Monitor regularly, but avoid panic selling</li>
                <li>• Consider long-term growth potential</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-90">Total Companies:</span>
                  <span className="font-bold">{metrics.holdings.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-90">Avg. Investment:</span>
                  <span className="font-bold">Rs. {(metrics.totalInvestment / Math.max(metrics.holdings.length, 1)).toLocaleString('en-NP', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-90">Portfolio Health:</span>
                  <span className={`font-bold ${metrics.profitLossPercentage >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {metrics.profitLossPercentage >= 0 ? 'Good' : 'Needs Review'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const summary = `Portfolio Summary:\nTotal Investment: Rs. ${metrics.totalInvestment.toFixed(2)}\nCurrent Value: Rs. ${metrics.totalCurrentValue.toFixed(2)}\nP&L: Rs. ${metrics.profitLoss.toFixed(2)} (${metrics.profitLossPercentage.toFixed(2)}%)\n\nHoldings:\n${metrics.holdings.map(([symbol, h]) => `${symbol}: ${h.totalQuantity} shares`).join('\n')}`;
                    navigator.clipboard.writeText(summary);
                    setSuccess('Portfolio summary copied to clipboard!');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center"
                >
                  <FaExternalLinkAlt className="mr-2" />
                  Copy Summary
                </button>
                <button
                  onClick={() => {
                    if (confirm('This will remove all transactions from your portfolio. This action cannot be undone.')) {
                      setPortfolio([]);
                      setSuccess('Portfolio cleared successfully!');
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center"
                >
                  <FaTrash className="mr-2" />
                  Clear All Transactions
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-slate-500 dark:text-slate-400 text-sm">
            <p>NEPSE Portfolio Tracker • Data sourced from NEPSE API • {new Date().getFullYear()}</p>
            <p className="mt-1">This is for demonstration purposes only. Always verify with official sources.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}