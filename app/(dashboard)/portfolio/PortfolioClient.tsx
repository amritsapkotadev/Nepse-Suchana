"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { safeFetch } from "@/app/lib/api-utils";
import toast from "react-hot-toast";
import {
  FaSearch, FaBuilding, FaHashtag, FaMoneyBillWave, FaPlusCircle,
  FaTrash, FaChartLine, FaInfoCircle, FaEdit, FaEye, FaEyeSlash,
  FaTimes, FaPercentage, FaRupeeSign, FaArrowUp, FaArrowDown,
  FaGift, FaDownload, FaUpload, FaDatabase, FaCalendarAlt, FaWallet,
  FaPiggyBank, FaChartBar, FaLayerGroup, FaCoins, FaHistory,
  FaMoneyBill, FaFilter, FaExternalLinkAlt, FaCopy, FaCheck,
  FaEllipsisV, FaStar, FaChartPie, FaCog,
  FaBullseye, FaUser, FaUsers, FaBell, FaShareAlt, FaQrcode,
  FaFileExport, FaFileImport, FaSync, FaShieldAlt, FaLock, FaUnlock
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import debounce from "lodash/debounce";

interface Portfolio {
  id: number;
  name: string;
  description?: string;
  initial_balance: number;
  current_balance: number;
  created_at: string;
  holdings_count?: number;
  total_value?: number;
}

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
  dateAdded: Date;
  portfolio_id?: number;
}

export default function MultiPortfolioTracker() {
  // Multi-portfolio state
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [portfolioStocks, setPortfolioStocks] = useState<PortfolioStock[]>([]);
  const [isLoading, setIsLoading] = useState({
    portfolios: false,
    stocks: false,
    portfolio: false
  });
  
  // Form states
  const [form, setForm] = useState({
    symbol: "",
    companyName: "",
    quantity: "",
    buyPrice: "",
    transactionType: "Buy" as "Buy" | "Sell"
  });
  
  const [portfolioForm, setPortfolioForm] = useState({
    name: "",
    description: "",
    initial_balance: ""
  });
  
  const [editPortfolioForm, setEditPortfolioForm] = useState({
    name: "",
    description: ""
  });
  
  // UI states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "holdings" | "transactions" | "analytics">("overview");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockSuggestions, setStockSuggestions] = useState<Stock[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTotalValue, setShowTotalValue] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: "dateAdded", direction: "desc" });
  const [filterSymbol, setFilterSymbol] = useState("");
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPortfolioMenu, setShowPortfolioMenu] = useState<number | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const portfolioMenuRef = useRef<HTMLDivElement>(null);
  const allStocksRef = useRef<Stock[]>([]);

  // Cache for fetched data
  const portfoliosCache = useRef<Portfolio[] | null>(null);
  const isFetching = useRef(false);

  // Fetch portfolios from backend
  const fetchPortfolios = useCallback(async (force = false) => {
    if (isFetching.current && !force) return;
    if (!force && portfoliosCache.current) {
      const data = portfoliosCache.current;
      setPortfolios(data);
      if (data.length > 0 && !selectedPortfolio) {
        setSelectedPortfolio(data[0]);
        await fetchPortfolioData(data[0].id);
      } else if (data.length === 0) {
        setSelectedPortfolio(null);
        setPortfolioStocks([]);
      }
      setIsLoading(prev => ({ ...prev, portfolios: false }));
      return;
    }
    
    isFetching.current = true;
    
    try {
      setIsLoading(prev => ({ ...prev, portfolios: true }));
      setError("");
      
      const data = await safeFetch<Portfolio[]>('/api/portfolios');
      portfoliosCache.current = data;
      setPortfolios(data);
      
      if (data.length > 0 && !selectedPortfolio) {
        setSelectedPortfolio(data[0]);
        await fetchPortfolioData(data[0].id);
      } else if (data.length === 0) {
        setSelectedPortfolio(null);
        setPortfolioStocks([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch portfolios';
      setError(errorMessage);
    } finally {
      isFetching.current = false;
      setIsLoading(prev => ({ ...prev, portfolios: false }));
    }
  }, [selectedPortfolio]);

  // Fetch portfolio stocks
  const fetchPortfolioData = useCallback(async (portfolioId: number) => {
    try {
      setIsLoading(prev => ({ ...prev, portfolio: true }));
      setError("");
      
      const data = await safeFetch<any[]>(`/api/portfolio-holdings?portfolio_id=${portfolioId}`);
      setPortfolioStocks(data.map((stock: any) => ({
        id: stock.id,
        symbol: stock.stock_symbol,
        companyName: stock.company_name || "",
        quantity: stock.quantity,
        buyPrice: Number(stock.average_price),
        transactionType: "Buy",
        dateAdded: new Date(stock.created_at),
        portfolio_id: stock.portfolio_id
      })));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch portfolio data';
      setError(errorMessage);
    } finally {
      setIsLoading(prev => ({ ...prev, portfolio: false }));
    }
  }, []);

  // Fetch all stocks for suggestions
  const fetchAllStocks = useCallback(async () => {
    try {
      console.log('Fetching stocks...');
      const response = await fetch('/api/stocks');
      const data = await response.json();
      console.log('API response:', data);
      
      let stocks: Stock[] = [];
      if (Array.isArray(data)) {
        stocks = data;
      } else if (data && Array.isArray(data.stocks)) {
        stocks = data.stocks;
      } else if (data && Array.isArray(data.data)) {
        stocks = data.data;
      } else if (data && Array.isArray(data.liveCompanyData)) {
        stocks = data.liveCompanyData.map((c: any) => ({
          symbol: c.symbol,
          name: c.securityName,
          currentPrice: c.lastTradedPrice,
          change: c.change,
          changePercent: c.percentageChange
        }));
      }
      
      console.log('Processed stocks:', stocks.length);
      allStocksRef.current = stocks;
      setAllStocks(stocks);
    } catch (err) {
      console.error('Failed to fetch stocks:', err);
      setAllStocks([]);
    }
  }, []);

  // Fetch portfolios on mount
  useEffect(() => {
    if (portfoliosCache.current) {
      setPortfolios(portfoliosCache.current);
      if (portfoliosCache.current.length > 0) {
        setSelectedPortfolio(portfoliosCache.current[0]);
        fetchPortfolioData(portfoliosCache.current[0].id);
      }
      setIsLoading(prev => ({ ...prev, portfolios: false }));
    } else {
      fetchPortfolios(true);
    }
    if (allStocks.length === 0) {
      fetchAllStocks();
    }
  }, []);

  // Close portfolio menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (portfolioMenuRef.current && !portfolioMenuRef.current.contains(event.target as Node)) {
        setShowPortfolioMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Create new portfolio
  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");
    
    try {
      const newPortfolio = await safeFetch<Portfolio>('/api/portfolios', {
        method: 'POST',
        body: JSON.stringify({
          name: portfolioForm.name,
          description: portfolioForm.description,
          initial_balance: parseFloat(portfolioForm.initial_balance) || 0
        })
      });
      
      setPortfolios(prev => [...prev, newPortfolio]);
      setSuccess("");
      toast.success('Portfolio created successfully!');
      setShowAddModal(false);
      setPortfolioForm({ name: "", description: "", initial_balance: "" });
      
      // Auto-select new portfolio
      setSelectedPortfolio(newPortfolio);
      await fetchPortfolioData(newPortfolio.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create portfolio';
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  // Update portfolio
  const handleUpdatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortfolio) return;
    
    setIsCreating(true);
    setError("");
    
    try {
      const updatedPortfolio = await safeFetch<Portfolio>(`/api/portfolios/${selectedPortfolio.id}`, {
        method: 'PUT',
        body: JSON.stringify(editPortfolioForm)
      });
      
      setPortfolios(prev => prev.map(p => 
        p.id === selectedPortfolio.id ? { ...p, ...updatedPortfolio } : p
      ));
      setSelectedPortfolio(updatedPortfolio);
      setSuccess("");
      toast.success('Portfolio updated successfully!');
      setShowEditModal(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update portfolio';
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  // Delete portfolio
  const handleDeletePortfolio = async () => {
    if (!selectedPortfolio) return;
    
    setIsDeleting(true);
    setError("");
    
    try {
      await safeFetch(`/api/portfolios/${selectedPortfolio.id}`, {
        method: 'DELETE'
      });
      
      setPortfolios(prev => prev.filter(p => p.id !== selectedPortfolio.id));
      
      // Select another portfolio if available
      if (portfolios.length > 1) {
        const remaining = portfolios.filter(p => p.id !== selectedPortfolio.id);
        setSelectedPortfolio(remaining[0]);
        await fetchPortfolioData(remaining[0].id);
      } else {
        setSelectedPortfolio(null);
        setPortfolioStocks([]);
      }
      
      setSuccess("");
      toast.success('Portfolio deleted successfully!');
      setShowDeleteConfirm(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete portfolio';
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Add stock to portfolio
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortfolio) {
      setError("Please select a portfolio first");
      return;
    }
    setError("");
    setSuccess("");
    const quantity = parseFloat(form.quantity);
    const buyPrice = parseFloat(form.buyPrice);
    if (!form.symbol || !form.companyName || isNaN(quantity) || isNaN(buyPrice)) {
      setError("All fields are required with valid numbers");
      return;
    }
    try {
      const newStock = await safeFetch<any>('/api/portfolio-holdings', {
        method: 'POST',
        body: JSON.stringify({
          portfolio_id: selectedPortfolio.id,
          stock_symbol: form.symbol.toUpperCase(),
          quantity,
          average_price: buyPrice
        })
      });
      setPortfolioStocks(prev => [...prev, {
        ...newStock,
        buyPrice: Number(newStock.average_price),
        dateAdded: new Date(newStock.created_at)
      }]);
      // Update portfolio holdings count
      setPortfolios(prev => prev.map(p => 
        p.id === selectedPortfolio.id 
          ? { ...p, holdings_count: (p.holdings_count || 0) + 1 }
          : p
      ));
      setSuccess("");
      toast.success(`${form.transactionType} transaction added successfully!`);
      setShowStockModal(false);
      resetStockForm();
      setShowSuggestions(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add stock';
      setError(errorMessage);
    }
  };

  // Delete stock from portfolio
  const handleDeleteStock = async (stockId: string) => {
    try {
      await safeFetch(`/api/portfolio-holdings/${stockId}`, {
        method: 'DELETE'
      });
      
      setPortfolioStocks(prev => prev.filter(s => s.id !== stockId));
      
      // Update portfolio holdings count
      if (selectedPortfolio) {
        setPortfolios(prev => prev.map(p => 
          p.id === selectedPortfolio.id 
            ? { ...p, holdings_count: Math.max(0, (p.holdings_count || 1) - 1) }
            : p
        ));
      }
      
      setSuccess("");
    toast.success('Stock removed successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete stock';
      setError(errorMessage);
    }
  };

  // Stable debounced search using useRef
  const debouncedSearchRef = useRef(
    debounce((query: string) => {
      const stocks = allStocksRef.current;
      const lowerQuery = query.toLowerCase().trim();
      const filtered = (stocks || []).filter(stock =>
        !lowerQuery || stock.symbol.toLowerCase().includes(lowerQuery) ||
        stock.name.toLowerCase().includes(lowerQuery)
      ).slice(0, 10);
      setStockSuggestions(filtered);
      setSearchQuery(query);
    }, 150)
  );

  // Search stock suggestions
  const debouncedSearch = useCallback((query: string) => {
    debouncedSearchRef.current(query);
  }, []);

  const handleStockSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, symbol: value }));
    debouncedSearch(value);
  };

  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'ig');
    return text.replace(regex, '<mark>$1</mark>');
  }, []);

  const selectSuggestion = (stock: Stock) => {
    setForm(prev => ({
      ...prev,
      symbol: stock.symbol,
      companyName: stock.name,
      buyPrice: (stock.currentPrice || 0).toString()
    }));
    setStockSuggestions([]);
    setSearchQuery("");
  };

  const resetStockForm = () => {
    setForm({
      symbol: "",
      companyName: "",
      quantity: "",
      buyPrice: "",
      transactionType: "Buy"
    });
    setStockSuggestions([]);
    setShowSuggestions(false);
    setSearchQuery("");
  };

  const resetPortfolioForm = () => {
    setPortfolioForm({
      name: "",
      description: "",
      initial_balance: ""
    });
  };

  // Calculate portfolio metrics
  const calculateMetrics = () => {
    if (!selectedPortfolio) return null;
    
    const totalInvestment = portfolioStocks
      .filter(s => s.transactionType === "Buy")
      .reduce((sum, stock) => sum + (stock.quantity * stock.buyPrice), 0);
    
    const totalSales = portfolioStocks
      .filter(s => s.transactionType === "Sell")
      .reduce((sum, stock) => sum + (stock.quantity * stock.buyPrice), 0);
    
    const netInvestment = totalInvestment - totalSales;
    const currentValue = selectedPortfolio.total_value || netInvestment;
    
    const profitLoss = currentValue - netInvestment;
    const profitLossPercent = netInvestment > 0 ? (profitLoss / netInvestment) * 100 : 0;
    
    return {
      totalInvestment: netInvestment,
      currentValue,
      profitLoss,
      profitLossPercent,
      holdingsCount: portfolioStocks.filter(s => s.transactionType === "Buy").length
    };
  };

  const metrics = useMemo(() => calculateMetrics(), [portfolioStocks, selectedPortfolio]);

  // Filter portfolio stocks
  const filteredStocks = portfolioStocks.filter(stock =>
    (stock.symbol && stock.symbol.toLowerCase().includes(filterSymbol.toLowerCase())) ||
    (stock.companyName && stock.companyName.toLowerCase().includes(filterSymbol.toLowerCase()))
  );

  // Copy portfolio ID
  const copyPortfolioId = (id: number) => {
    navigator.clipboard.writeText(id.toString());
    setCopiedId(id.toString());
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Clear messages
  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // Portfolio selector component
  const PortfolioSelector = () => (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Portfolios</h2>
          <p className="text-gray-600">Manage and track multiple investment portfolios</p>
          <p className="text-xs text-gray-500 mt-1">Max 5 portfolios • Unique names only</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center shadow-md hover:shadow-xl"
        >
          <FaPlusCircle className="mr-2" />
          New Portfolio
        </button>
      </div>
      
      {isLoading.portfolios ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : portfolios.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
            <FaChartLine className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-3">
            No portfolios yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create your first portfolio to start tracking your investments
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all shadow-md"
          >
            Create First Portfolio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map(portfolio => (
            <motion.div
              key={portfolio.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 cursor-pointer group ${
                selectedPortfolio?.id === portfolio.id
                  ? 'border-blue-500 shadow-xl'
                  : 'border-transparent hover:border-blue-200:border-gray-700'
              }`}
              onClick={() => {
                setSelectedPortfolio(portfolio);
                fetchPortfolioData(portfolio.id);
              }}
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="relative" ref={portfolioMenuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPortfolioMenu(showPortfolioMenu === portfolio.id ? null : portfolio.id);
                    }}
                    className="p-2 hover:bg-gray-100:bg-gray-700 rounded-lg"
                  >
                    <FaEllipsisV className="text-gray-500" />
                  </button>
                  
                  <AnimatePresence>
                    {showPortfolioMenu === portfolio.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 z-10"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditPortfolioForm({
                              name: portfolio.name,
                              description: portfolio.description || ""
                            });
                            setShowEditModal(true);
                            setShowPortfolioMenu(null);
                          }}
                          className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50:bg-gray-700 flex items-center rounded-t-xl"
                        >
                          <FaEdit className="mr-3 text-blue-500" />
                          Edit Portfolio
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPortfolio(portfolio);
                            setShowDeleteConfirm(true);
                            setShowPortfolioMenu(null);
                          }}
                          className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50:bg-red-900/20 flex items-center"
                        >
                          <FaTrash className="mr-3" />
                          Delete Portfolio
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyPortfolioId(portfolio.id);
                            setShowPortfolioMenu(null);
                          }}
                          className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50:bg-gray-700 flex items-center rounded-b-xl"
                        >
                          {copiedId === portfolio.id.toString() ? (
                            <>
                              <FaCheck className="mr-3 text-green-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <FaCopy className="mr-3 text-gray-500" />
                              Copy ID
                            </>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mr-4">
                    <FaChartLine className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {portfolio.name}
                    </h3>
                    {portfolio.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {portfolio.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Initial Balance:</span>
                    <span className="font-bold text-gray-900">Rs. {portfolio.initial_balance.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Holdings:</span>
                    <span className="font-bold text-gray-900">{portfolio.holdings_count || 0} stocks</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Total Value:</span>
                    <span className="font-bold text-emerald-600">
                      Rs. {portfolio.total_value?.toLocaleString('en-IN') || '0'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Created {new Date(portfolio.created_at).toLocaleDateString()}</span>
                    {selectedPortfolio?.id === portfolio.id && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">
                        Selected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  // Portfolio details component
  const PortfolioDetails = () => {
    if (!selectedPortfolio) return null;
    
    return (
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <FaChartLine className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {selectedPortfolio.name}
                </h1>
                {selectedPortfolio.description && (
                  <p className="text-gray-600 mt-1">
                    {selectedPortfolio.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-2">
              <span className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                <FaLock className="mr-1 text-xs" />
                Portfolio ID: {selectedPortfolio.id}
              </span>
              <span className="bg-gray-100 px-3 py-1 rounded-full">
                Created: {new Date(selectedPortfolio.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowStockModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center shadow-md hover:shadow-xl"
            >
              <FaPlusCircle className="mr-2" />
              Add Stock
            </button>
            <button
              onClick={() => fetchPortfolioData(selectedPortfolio.id)}
              disabled={isLoading.portfolio}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center shadow-md hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaSync className={`mr-2 ${isLoading.portfolio ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        
        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <FaWallet className="w-6 h-6" />
                </div>
                <button
                  onClick={() => setShowTotalValue(!showTotalValue)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  {showTotalValue ? <FaEye className="w-4 h-4" /> : <FaEyeSlash className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-sm font-medium opacity-90 mb-1">Total Investment</p>
              <p className="text-2xl font-bold">
                {showTotalValue ? `Rs. ${metrics.totalInvestment.toLocaleString('en-NP', { minimumFractionDigits: 2 })}` : '••••••'}
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-5 text-white shadow-xl"
            >
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm mb-4 w-fit">
                <FaChartLine className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium opacity-90 mb-1">Current Value</p>
              <p className="text-2xl font-bold">
                Rs. {metrics.currentValue.toLocaleString('en-NP', { minimumFractionDigits: 2 })}
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-xl"
            >
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm mb-4 w-fit">
                <FaLayerGroup className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium opacity-90 mb-1">Total Holdings</p>
              <p className="text-2xl font-bold">{metrics.holdingsCount}</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`bg-gradient-to-br rounded-2xl p-5 text-white shadow-xl ${
                metrics.profitLoss >= 0 
                  ? 'from-emerald-500 to-green-600' 
                  : 'from-red-500 to-orange-600'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  {metrics.profitLoss >= 0 ? (
                    <FaArrowUp className="w-6 h-6" />
                  ) : (
                    <FaArrowDown className="w-6 h-6" />
                  )}
                </div>
                <FaPercentage className="w-5 h-5 opacity-90" />
              </div>
              <p className="text-sm font-medium opacity-90 mb-1">Total P&L</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {metrics.profitLoss >= 0 ? '+' : ''}Rs. {Math.abs(metrics.profitLoss).toLocaleString('en-NP', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <span className="text-sm font-medium px-3 py-1 rounded-full bg-white/20">
                  {metrics.profitLossPercent.toFixed(2)}%
                </span>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* Holdings Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Portfolio Holdings ({filteredStocks.length})
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  All stocks in this portfolio
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Filter stocks..."
                    value={filterSymbol}
                    onChange={(e) => setFilterSymbol(e.target.value)}
                    className="pl-10 pr-4 py-2 text-sm bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all w-64"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buy Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Added
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading.portfolio ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                          <FaChartLine className="w-8 h-8 text-gray-400" />
                        </div>
                        <h4 className="text-gray-500 font-medium mb-2">No stocks found</h4>
                        <p className="text-gray-400 text-sm mb-4">
                          {filterSymbol ? 'Try changing your search term' : 'Add your first stock to get started'}
                        </p>
                        {!filterSymbol && (
                          <button
                            onClick={() => setShowStockModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Add First Stock
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stock) => (
                    <motion.tr 
                      key={stock.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50:bg-gray-900/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">
                          {stock.symbol}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {stock.companyName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{stock.quantity}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">Rs. {stock.buyPrice.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          stock.transactionType === 'Buy'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {stock.transactionType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {stock.dateAdded.toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteStock(stock.id)}
                          className="p-2 text-red-600 hover:text-red-700:text-red-300 hover:bg-red-50:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete Stock"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        <AnimatePresence>
          {(error || success) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaInfoCircle className="text-red-500 mr-3 flex-shrink-0" />
                      <p className="text-red-600 font-medium">{error}</p>
                    </div>
                    <button
                      onClick={clearMessages}
                      className="text-red-500 hover:text-red-700:text-red-300"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              )}
              {success && (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaInfoCircle className="text-emerald-500 mr-3 flex-shrink-0" />
                      <p className="text-emerald-600 font-medium">{success}</p>
                    </div>
                    <button
                      onClick={clearMessages}
                      className="text-emerald-500 hover:text-emerald-700:text-emerald-300"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Portfolio Selector */}
        <PortfolioSelector />
        
        {/* Portfolio Details */}
        {selectedPortfolio && <PortfolioDetails />}
      </main>

      {/* Add Portfolio Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Create New Portfolio
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Maximum 5 portfolios per user
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 hover:bg-gray-100:bg-gray-700 rounded-lg transition-colors"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreatePortfolio} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Portfolio Name *
                    </label>
                    <input
                      type="text"
                      value={portfolioForm.name}
                      onChange={(e) => setPortfolioForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="e.g., Retirement Fund, Trading Account"
                      required
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Must be unique among your portfolios
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={portfolioForm.description}
                      onChange={(e) => setPortfolioForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Describe the purpose of this portfolio..."
                      rows={3}
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Balance (Rs.)
                    </label>
                    <div className="relative">
                      <FaRupeeSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={portfolioForm.initial_balance}
                        onChange={(e) => setPortfolioForm(prev => ({ ...prev, initial_balance: e.target.value }))}
                        className="w-full pl-10 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {portfolios.length >= 5 && (
                    <div className="p-3 bg-amber-50 border-2 border-amber-200 rounded-xl">
                      <p className="text-amber-600 text-sm">
                        ⚠️ You have reached the maximum limit of 5 portfolios
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    type="submit"
                    disabled={isCreating || portfolios.length >= 5}
                    className={`flex-1 px-6 py-3 font-medium rounded-xl transition-all flex items-center justify-center ${
                      isCreating || portfolios.length >= 5
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg shadow-md'
                    }`}
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <FaPlusCircle className="mr-2" />
                        Create Portfolio
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetPortfolioForm();
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Portfolio Modal */}
      <AnimatePresence>
        {showEditModal && selectedPortfolio && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Edit Portfolio
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Update portfolio details
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 hover:bg-gray-100:bg-gray-700 rounded-lg transition-colors"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleUpdatePortfolio} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Portfolio Name *
                    </label>
                    <input
                      type="text"
                      value={editPortfolioForm.name}
                      onChange={(e) => setEditPortfolioForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                      maxLength={50}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={editPortfolioForm.description}
                      onChange={(e) => setEditPortfolioForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      rows={3}
                      maxLength={200}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className={`flex-1 px-6 py-3 font-medium rounded-xl transition-all flex items-center justify-center ${
                      isCreating
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg shadow-md'
                    }`}
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaEdit className="mr-2" />
                        Update Portfolio
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && selectedPortfolio && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">
                  Delete Portfolio
                </h3>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <FaTrash className="w-8 h-8 text-red-500" />
                  </div>
                </div>

                <div className="text-center mb-6">
                  <p className="text-gray-700 mb-2">
                    Are you sure you want to delete
                  </p>
                  <p className="text-xl font-bold text-gray-900 mb-2">
                    "{selectedPortfolio.name}"?
                  </p>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone. All portfolio data will be permanently deleted.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDeletePortfolio}
                    disabled={isDeleting}
                    className={`flex-1 px-6 py-3 font-medium rounded-xl transition-all flex items-center justify-center ${
                      isDeleting
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-500 to-orange-600 text-white hover:shadow-lg shadow-md'
                    }`}
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <FaTrash className="mr-2" />
                        Delete Portfolio
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Stock Modal */}
      <AnimatePresence>
        {showStockModal && selectedPortfolio && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowStockModal(false);
              resetStockForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Add Stock to {selectedPortfolio.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Add a buy/sell transaction
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowStockModal(false);
                      resetStockForm();
                    }}
                    className="p-2 hover:bg-gray-100:bg-gray-700 rounded-lg transition-colors"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddStock} className="p-6">
                <div className="space-y-5">
                  {/* Symbol Input */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Symbol *
                    </label>
                    <div className="relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={form.symbol}
                        onChange={handleStockSearch}
                        onFocus={() => setShowSuggestions(true)}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Search symbol..."
                        required
                      />
                      
                      <AnimatePresence>
                        {showSuggestions && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-hidden"
                          >
                            <div className="max-h-64 overflow-y-auto">
                              {stockSuggestions.length === 0 ? (
                                <div className="px-4 py-3 text-gray-500">No results found</div>
                              ) : (
                                stockSuggestions.map((stock) => (
                                  <div
                                    key={stock.symbol}
                                    className="px-4 py-3 hover:bg-blue-50:bg-gray-800 cursor-pointer border-b last:border-b-0 border-gray-100 transition-colors"
                                    onClick={() => {
                                      selectSuggestion(stock);
                                      setShowSuggestions(false);
                                    }}
                                  >
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <span className="font-bold text-blue-600" dangerouslySetInnerHTML={{ __html: highlightMatch(stock.symbol, searchQuery) }} />
                                        <p className="text-sm text-gray-600 truncate" dangerouslySetInnerHTML={{ __html: highlightMatch(stock.name, searchQuery) }} />
                                      </div>
                                      {stock.currentPrice && (
                                        <span className="font-bold text-gray-900">
                                          Rs. {stock.currentPrice.toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(e) => setForm(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Enter company name"
                      required
                    />
                  </div>

                  {/* Quantity & Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={form.quantity}
                        onChange={(e) => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price per Share *
                      </label>
                      <div className="relative">
                        <FaRupeeSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.buyPrice}
                          onChange={(e) => setForm(prev => ({ ...prev, buyPrice: e.target.value }))}
                          className="w-full pl-10 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Transaction Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Transaction Type *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, transactionType: "Buy" }))}
                        className={`px-4 py-4 rounded-xl font-medium transition-all flex items-center justify-center space-x-3 ${
                          form.transactionType === "Buy"
                            ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200:bg-gray-800"
                        }`}
                      >
                        <FaPlusCircle />
                        <span>Buy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, transactionType: "Sell" }))}
                        className={`px-4 py-4 rounded-xl font-medium transition-all flex items-center justify-center space-x-3 ${
                          form.transactionType === "Sell"
                            ? "bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200:bg-gray-800"
                        }`}
                      >
                        <div className="w-5 h-5 flex items-center justify-center">
                          <div className="w-4 h-0.5 bg-current"></div>
                        </div>
                        <span>Sell</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all flex items-center justify-center shadow-md"
                  >
                    <FaPlusCircle className="mr-2" />
                    Add Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStockModal(false);
                      resetStockForm();
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}