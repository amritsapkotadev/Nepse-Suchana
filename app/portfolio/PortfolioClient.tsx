"use client";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
// ...existing code...

interface Portfolio {
  id: number;
  name: string;
  description?: string;
}
import { FaSearch, FaBuilding, FaHashtag, FaMoneyBillWave, FaPlusCircle, FaTrash, FaChartLine, FaSort, FaSortUp, FaSortDown, FaInfoCircle, FaEdit, FaEye, FaEyeSlash, FaExternalLinkAlt, FaTimes, FaPercentage, FaRupeeSign, FaLayerGroup, FaArrowUp, FaArrowDown, FaGift, FaShareAlt, FaMoneyBill, FaStickyNote, FaFilter, FaDownload, FaUpload, FaCog, FaBell, FaHistory, FaCalculator, FaCalendarAlt, FaWallet, FaPiggyBank, FaCoins, FaChartBar, FaBullseye, FaDatabase } from "react-icons/fa";
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

interface CorporateAction {
  id: string;
  symbol: string;
  type: "cash_dividend" | "right_share" | "bonus_share" | "other";
  value: number | string;
  date: Date;
  notes?: string;
}

interface PortfolioStock {
  id: string;
  symbol: string;
  companyName: string;
  quantity: number;
  buyPrice: number;
  transactionType: "Buy" | "Sell";
  dateAdded: Date;
  corporateActions?: CorporateAction[];
}

const NEPSE_API_URL = "/api/nepse-proxy";

export default function NepsePortfolio() {

  // Multi-portfolio state
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number|null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>([]);
  
  const [form, setForm] = useState({
    symbol: "",
    companyName: "",
    quantity: "",
    buyPrice: "",
    transactionType: "Buy" as "Buy" | "Sell"
  });
  
  const [corporateActionForm, setCorporateActionForm] = useState({
    symbol: "",
    type: "cash_dividend" as "cash_dividend" | "right_share" | "bonus_share" | "other",
    value: "",
    date: new Date().toISOString().split('T')[0],
    notes: ""
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
  const [activeTab, setActiveTab] = useState<"transactions" | "dividends" | "analysis">("transactions");
  const [showCorporateActionModal, setShowCorporateActionModal] = useState(false);
  const [selectedStockForAction, setSelectedStockForAction] = useState<PortfolioStock | null>(null);
  const [filterSymbol, setFilterSymbol] = useState("");
  const [showCorporateActionSuggestions, setShowCorporateActionSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const corporateActionSymbolRef = useRef<HTMLInputElement>(null);


  // Fetch all stocks and portfolios on mount
  useEffect(() => {
    fetchAllStocks();
    fetchPortfolios();
  }, []);

  // Fetch portfolio data when selected portfolio changes
  useEffect(() => {
    if (selectedPortfolioId) {
      fetchPortfolioData(selectedPortfolioId);
    } else {
      setPortfolio([]);
    }
  }, [selectedPortfolioId]);

  // Fetch portfolios from backend
  const fetchPortfolios = async () => {
    try {
      // TODO: Replace with actual user_id logic
      const user_id = 1;
      const res = await fetch(`/api/portfolios?user_id=${user_id}`);
      const data = await res.json();
      setPortfolios(data);
      if (data.length > 0) setSelectedPortfolioId(data[0].id);
    } catch (err) {
      setError('Failed to fetch portfolios');
    }
  };

  // Fetch portfolio stocks for selected portfolio
  const fetchPortfolioData = async (portfolioId: number) => {
    try {
      const res = await fetch(`/api/portfolio?portfolio_id=${portfolioId}`);
      const data = await res.json();
      setPortfolio(data.map((stock: any) => ({
        ...stock,
        dateAdded: new Date(stock.dateAdded),
        corporateActions: stock.corporateActions?.map((action: any) => ({
          ...action,
          date: new Date(action.date)
        })) || []
      })));
    } catch (err) {
      setError('Failed to fetch portfolio data');
    }
  };

  // Save portfolio to localStorage
  useEffect(() => {
    if (portfolio.length > 0) {
      localStorage.setItem('nepse-portfolio-v2', JSON.stringify(portfolio));
    } else {
      localStorage.removeItem('nepse-portfolio-v2');
    }
  }, [portfolio]);

  const fetchAllStocks = async () => {
    if (!NEPSE_API_URL) {
      setError("NEPSE API URL is not set.");
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
        setError("API response does not contain liveCompanyData.");
        setAllStocks([]);
        return;
      }
      
      const stocks = (data.liveCompanyData || []).map((c: any) => ({ 
        symbol: c.symbol, 
        name: c.securityName,
        lastTradedPrice: c.lastTradedPrice || null,
        currentPrice: c.currentprice || c.close || 0,
        close: c.close || 0,
        change: c.change || 0,
        changePercent: c.changePercent || 0
      }));
      setAllStocks(stocks);
      setError("");
    } catch (error) {
      setError("Failed to fetch stocks. Please check your internet connection.");
      setAllStocks([]);
      console.error('Failed to fetch stocks:', error);
    } finally {
      setIsLoadingStocks(false);
    }
  };

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === "symbol") {
      setIsLoadingSuggestions(true);
      debouncedFetchSuggestions(value);
    }
  };

  const handleCorporateActionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCorporateActionForm(prev => ({ ...prev, [name]: value }));
    
    if (name === "symbol") {
      setShowCorporateActionSuggestions(true);
    }
  };

  const handleSuggestionClick = (stock: Stock) => {
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

  const handleCorporateActionSuggestionClick = (stock: Stock) => {
    setCorporateActionForm(prev => ({ 
      ...prev, 
      symbol: stock.symbol
    }));
    setShowCorporateActionSuggestions(false);
    corporateActionSymbolRef.current?.blur();
  };

  const resetForm = () => {
    setForm({
      symbol: "",
      companyName: "",
      quantity: "",
      buyPrice: "",
      transactionType: "Buy"
    });
    setIsEditing(false);
    setEditId(null);
    setError("");
    setSuccess("");
  };

  const resetCorporateActionForm = () => {
    setCorporateActionForm({
      symbol: selectedStockForAction?.symbol || "",
      type: "cash_dividend",
      value: "",
      date: new Date().toISOString().split('T')[0],
      notes: ""
    });
  };

  // Calculate total owned shares for a symbol - FIXED
  const getTotalOwnedShares = (symbol: string, asOfDate?: Date): number => {
    return portfolio.reduce((total, stock) => {
      if (stock.symbol === symbol) {
        // If asOfDate is provided, only count transactions before that date
        if (asOfDate && new Date(stock.dateAdded) > asOfDate) {
          return total;
        }
        
        return stock.transactionType === "Buy" 
          ? total + stock.quantity 
          : total - stock.quantity;
      }
      return total;
    }, 0);
  };

  // Calculate effective quantity after bonus shares
  const calculateEffectiveQuantity = (symbol: string, bonusPercentage?: number): number => {
    let totalQuantity = getTotalOwnedShares(symbol);
    
    if (bonusPercentage) {
      // Bonus shares: For every 100 shares, you get (bonusPercentage) additional shares
      const bonusShares = Math.floor((totalQuantity * bonusPercentage) / 100);
      totalQuantity += bonusShares;
    }
    
    return totalQuantity;
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

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
      const totalOwned = getTotalOwnedShares(symbol);
      
      if (form.transactionType === "Sell" && quantity > totalOwned) {
        setError(`Cannot sell ${quantity} shares. You only own ${totalOwned} shares of ${symbol}.`);
        return;
      }

      const newStock: PortfolioStock = {
        id: crypto.randomUUID(),
        symbol,
        companyName: form.companyName,
        quantity,
        buyPrice,
        transactionType: form.transactionType,
        dateAdded: new Date(),
        corporateActions: []
      };

      setPortfolio(prev => [...prev, newStock]);
      setSuccess(`${form.transactionType} transaction for ${symbol} added successfully!`);
    }

    resetForm();
  };

  const handleAddCorporateAction = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { symbol, type, value, date, notes } = corporateActionForm;
    const symbolUpper = symbol.toUpperCase();

    if (!symbol || !value) {
      setError("Symbol and value are required.");
      return;
    }

    // Check if the user owns the stock at the action date
    const actionDate = new Date(date);
    const ownedSharesAtDate = getTotalOwnedShares(symbolUpper, actionDate);
    
    if (ownedSharesAtDate <= 0) {
      setError(`You didn't own any shares of ${symbolUpper} on ${actionDate.toLocaleDateString('en-NP')}.`);
      return;
    }

    let actionValue: number | string;
    
    if (type === "cash_dividend") {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue <= 0) {
        setError("Dividend amount must be a positive number.");
        return;
      }
      actionValue = numValue;
      
      // Calculate total dividend amount based on shares owned at that date
      const totalDividendAmount = numValue * ownedSharesAtDate;
      
    } else if (type === "right_share" || type === "bonus_share") {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue <= 0) {
        setError("Percentage must be a positive number.");
        return;
      }
      actionValue = numValue;
    } else {
      actionValue = value;
    }

    const newAction: CorporateAction = {
      id: crypto.randomUUID(),
      symbol: symbolUpper,
      type,
      value: actionValue,
      date: actionDate,
      notes: notes || undefined
    };

    // Update portfolio stock with corporate action
    setPortfolio(prev => prev.map(stock => {
      if (stock.symbol === symbolUpper) {
        const updatedActions = [...(stock.corporateActions || []), newAction];
        return {
          ...stock,
          corporateActions: updatedActions
        };
      }
      return stock;
    }));

    setSuccess(`Corporate action added for ${symbol}!`);
    setShowCorporateActionModal(false);
    resetCorporateActionForm();
    setSelectedStockForAction(null);
  };

  const handleEdit = (stock: PortfolioStock) => {
    setForm({
      symbol: stock.symbol,
      companyName: stock.companyName,
      quantity: stock.quantity.toString(),
      buyPrice: stock.buyPrice.toString(),
      transactionType: stock.transactionType
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

  const handleDeleteCorporateAction = (stockId: string, actionId: string) => {
    setPortfolio(prev => prev.map(stock => {
      if (stock.id === stockId) {
        const updatedActions = stock.corporateActions?.filter(action => action.id !== actionId) || [];
        return {
          ...stock,
          corporateActions: updatedActions
        };
      }
      return stock;
    }));
    setSuccess("Corporate action removed!");
  };

  const openCorporateActionModal = (stock?: PortfolioStock) => {
    if (stock) {
      setSelectedStockForAction(stock);
      setCorporateActionForm(prev => ({
        ...prev,
        symbol: stock.symbol
      }));
    }
    setShowCorporateActionModal(true);
  };

  // Calculate total dividends received for a symbol
  const calculateTotalDividends = (symbol: string): number => {
    const stockTransactions = portfolio.filter(s => s.symbol === symbol);
    let totalDividends = 0;
    
    stockTransactions.forEach(stock => {
      if (stock.corporateActions) {
        stock.corporateActions.forEach(action => {
          if (action.type === "cash_dividend" && typeof action.value === 'number') {
            // Calculate shares owned at the dividend date
            const sharesAtDividendDate = getTotalOwnedShares(symbol, new Date(action.date));
            totalDividends += action.value * sharesAtDividendDate;
          }
        });
      }
    });
    
    return totalDividends;
  };

  // Calculate effective quantity after all corporate actions
  const calculateEffectiveHolding = (symbol: string): { quantity: number; totalDividends: number } => {
    let quantity = getTotalOwnedShares(symbol);
    let totalDividends = 0;
    
    const stockTransactions = portfolio.filter(s => s.symbol === symbol);
    
    // Apply bonus shares first (they affect quantity)
    stockTransactions.forEach(stock => {
      if (stock.corporateActions) {
        stock.corporateActions.forEach(action => {
          if (action.type === "bonus_share" && typeof action.value === 'number') {
            const bonusPercentage = action.value;
            // Apply bonus to current quantity
            const bonusShares = Math.floor((quantity * bonusPercentage) / 100);
            quantity += bonusShares;
          }
        });
      }
    });
    
    // Then calculate dividends based on original holdings at each dividend date
    stockTransactions.forEach(stock => {
      if (stock.corporateActions) {
        stock.corporateActions.forEach(action => {
          if (action.type === "cash_dividend" && typeof action.value === 'number') {
            const sharesAtDividendDate = getTotalOwnedShares(symbol, new Date(action.date));
            totalDividends += action.value * sharesAtDividendDate;
          }
        });
      }
    });
    
    return { quantity, totalDividends };
  };

  const calculatePortfolioMetrics = () => {
    const holdings = new Map<string, {
      totalQuantity: number;
      effectiveQuantity: number;
      totalInvestment: number;
      avgBuyPrice: number;
      companyName: string;
      lastTransactionPrice: number;
      totalDividends: number;
      corporateActions: CorporateAction[];
      currentQuantity: number;
    }>();

    portfolio.forEach(stock => {
      if (!holdings.has(stock.symbol)) {
        holdings.set(stock.symbol, {
          totalQuantity: 0,
          effectiveQuantity: 0,
          totalInvestment: 0,
          avgBuyPrice: 0,
          companyName: stock.companyName,
          lastTransactionPrice: stock.buyPrice,
          totalDividends: 0,
          corporateActions: [],
          currentQuantity: 0
        });
      }
      
      const holding = holdings.get(stock.symbol)!;
      
      if (stock.transactionType === "Buy") {
        const newTotalQuantity = holding.totalQuantity + stock.quantity;
        const newTotalInvestment = holding.totalInvestment + (stock.quantity * stock.buyPrice);
        holding.totalQuantity = newTotalQuantity;
        holding.totalInvestment = newTotalInvestment;
        holding.avgBuyPrice = newTotalInvestment / newTotalQuantity;
        holding.lastTransactionPrice = stock.buyPrice;
      } else {
        const avgCost = holding.avgBuyPrice;
        holding.totalQuantity -= stock.quantity;
        const soldValue = stock.quantity * avgCost;
        holding.totalInvestment = Math.max(0, holding.totalInvestment - soldValue);
        holding.lastTransactionPrice = stock.buyPrice;
      }

      // Add corporate actions
      if (stock.corporateActions?.length) {
        holding.corporateActions = [...holding.corporateActions, ...stock.corporateActions];
      }
    });

    let totalInvestment = 0;
    let totalCurrentValue = 0;
    let totalEffectiveValue = 0;
    let totalShares = 0;
    let totalDividends = 0;
    let bestPerformer = { symbol: "", gain: -Infinity };
    let worstPerformer = { symbol: "", gain: Infinity };

    holdings.forEach((holding, symbol) => {
      if (holding.totalQuantity > 0) {
        totalInvestment += holding.totalInvestment;
        totalShares += holding.totalQuantity;
        
        // Calculate effective holding after corporate actions
        const effectiveHolding = calculateEffectiveHolding(symbol);
        holding.effectiveQuantity = effectiveHolding.quantity;
        holding.totalDividends = effectiveHolding.totalDividends;
        holding.currentQuantity = holding.totalQuantity; // Current owned quantity
        
        totalDividends += holding.totalDividends;
        
        const stockInfo = allStocks.find(s => s.symbol === symbol);
        const latestPrice = stockInfo?.lastTradedPrice || 
                           stockInfo?.currentPrice || 
                           stockInfo?.close || 
                           holding.lastTransactionPrice;
        
        // Current value based on current quantity
        const currentValue = holding.currentQuantity * latestPrice;
        totalCurrentValue += currentValue;
        
        // Gain based on current holdings
        const gain = ((currentValue - holding.totalInvestment) / holding.totalInvestment) * 100;
        if (gain > bestPerformer.gain) {
          bestPerformer = { symbol, gain };
        }
        if (gain < worstPerformer.gain) {
          worstPerformer = { symbol, gain };
        }
      }
    });

    const profitLoss = totalCurrentValue - totalInvestment + totalDividends;
    const profitLossPercentage = totalInvestment > 0 ? (profitLoss / totalInvestment) * 100 : 0;
    const overallReturn = totalInvestment > 0 ? ((totalCurrentValue + totalDividends - totalInvestment) / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      totalCurrentValue,
      totalEffectiveValue,
      totalShares,
      totalDividends,
      profitLoss,
      profitLossPercentage,
      overallReturn,
      bestPerformer,
      worstPerformer,
      holdings: Array.from(holdings.entries()).filter(([_, h]) => h.totalQuantity > 0),
      totalHoldings: holdings.size,
      averageReturn: profitLossPercentage,
      isProfitable: profitLoss >= 0
    };
  };

  const metrics = calculatePortfolioMetrics();

  const getLatestPrice = (symbol: string) => {
    const stockInfo = allStocks.find(s => s.symbol === symbol);
    return stockInfo?.lastTradedPrice || stockInfo?.currentPrice || stockInfo?.close || 0;
  };

  const handleRefreshPrices = async () => {
    await fetchAllStocks();
    setSuccess("Stock prices updated successfully!");
  };

  const exportPortfolio = () => {
    const data = {
      portfolio,
      summary: metrics,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nepse-portfolio-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importPortfolio = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.portfolio) {
          setPortfolio(data.portfolio.map((stock: any) => ({
            ...stock,
            dateAdded: new Date(stock.dateAdded),
            corporateActions: stock.corporateActions?.map((action: any) => ({
              ...action,
              date: new Date(action.date)
            })) || []
          })));
          setSuccess("Portfolio imported successfully!");
        }
      } catch (error) {
        setError("Failed to import portfolio. Invalid file format.");
      }
    };
    reader.readAsText(file);
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "cash_dividend": return <FaMoneyBill className="text-emerald-500" />;
      case "right_share": return <FaShareAlt className="text-blue-500" />;
      case "bonus_share": return <FaGift className="text-purple-500" />;
      default: return <FaStickyNote className="text-gray-500" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case "cash_dividend": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "right_share": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "bonus_share": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const filteredPortfolio = filterSymbol 
    ? portfolio.filter(stock => 
        stock.symbol.toLowerCase().includes(filterSymbol.toLowerCase()) ||
        stock.companyName.toLowerCase().includes(filterSymbol.toLowerCase())
      )
    : portfolio;

  // Get unique owned symbols for corporate action suggestions
  const ownedSymbols = Array.from(new Set(portfolio.filter(stock => getTotalOwnedShares(stock.symbol) > 0).map(stock => stock.symbol)));

  // Get all corporate actions sorted by date
  const getAllCorporateActions = () => {
    const allActions: Array<CorporateAction & { stockSymbol: string; quantity: number }> = [];
    
    portfolio.forEach(stock => {
      if (stock.corporateActions?.length) {
        stock.corporateActions.forEach(action => {
          allActions.push({
            ...action,
            stockSymbol: stock.symbol,
            quantity: getTotalOwnedShares(stock.symbol, new Date(action.date))
          });
        });
      }
    });
    
    return allActions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Calculate total corporate action value for display
  const calculateCorporateActionValue = (action: CorporateAction, quantity: number) => {
    if (action.type === "cash_dividend" && typeof action.value === 'number') {
      return action.value * quantity;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Portfolio Selector */}
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="portfolio-select" className="font-medium">Select Portfolio:</label>
        <select
          id="portfolio-select"
          value={selectedPortfolioId ?? ''}
          onChange={e => setSelectedPortfolioId(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          <option value="">-- Choose --</option>
          {portfolios.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          className="ml-2 px-2 py-1 bg-blue-500 text-white rounded"
          onClick={async () => {
            const name = prompt('Enter new portfolio name (e.g., Me, Father, Mother):');
            if (name) {
              // TODO: Replace with actual user_id logic
              const user_id = 1;
              const res = await fetch('/api/portfolios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id, name })
              });
              if (res.ok) {
                fetchPortfolios();
              } else {
                setError('Failed to create portfolio');
              }
            }
          }}
        >+ Add Portfolio</button>
      </div>
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <FaChartLine className="text-white w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  NEPSE Portfolio Pro
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                  Smart Investment Tracker
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefreshPrices}
                disabled={isLoadingStocks}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center shadow-md hover:shadow-xl"
              >
                {isLoadingStocks ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <FaDatabase className="mr-2" />
                    Refresh Prices
                  </>
                )}
              </button>
              <Link 
                href="/" 
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium hover:shadow-lg transition-all shadow-md hover:shadow-xl flex items-center"
              >
                <FaArrowUp className="mr-2 rotate-45" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Investment Portfolio
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track, analyze, and optimize your NEPSE investments
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <FaCalendarAlt className="inline mr-2" />
                {new Date().toLocaleDateString('en-NP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${metrics.isProfitable ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                <FaArrowUp className={`mr-2 ${metrics.isProfitable ? 'text-emerald-500' : 'text-red-500'}`} />
                {metrics.isProfitable ? 'Profit' : 'Loss'}: {Math.abs(metrics.overallReturn).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Investment Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
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
            <div className="mt-4 pt-3 border-t border-white/20">
              <p className="text-xs opacity-75">Based on purchase prices</p>
            </div>
          </motion.div>

          {/* Current Value Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm mb-4 w-fit">
              <FaChartLine className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium opacity-90 mb-1">Current Market Value</p>
            <p className="text-2xl font-bold">
              Rs. {metrics.totalCurrentValue.toLocaleString('en-NP', { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-4 pt-3 border-t border-white/20">
              <p className="text-xs opacity-75">Real-time NEPSE prices</p>
            </div>
          </motion.div>

          {/* Total Dividends Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm mb-4 w-fit">
              <FaPiggyBank className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium opacity-90 mb-1">Dividends Earned</p>
            <p className="text-2xl font-bold">
              Rs. {metrics.totalDividends.toLocaleString('en-NP', { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-4 pt-3 border-t border-white/20">
              <p className="text-xs opacity-75">Passive income</p>
            </div>
          </motion.div>

          {/* Total P&L Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`bg-gradient-to-br rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
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
                {metrics.profitLossPercentage.toFixed(2)}%
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-white/20">
              <p className="text-xs opacity-75">Unrealized gains/losses</p>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Add Transaction & Holdings */}
          <div className="lg:col-span-2">
            {/* Add Transaction Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                      <FaPlusCircle className="mr-3 text-blue-500" />
                      {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Record your buy/sell transactions
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {portfolio.length} total transactions
                  </div>
                </div>
              </div>

              <form onSubmit={handleAdd} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Symbol Input */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <FaSearch className="mr-2 text-blue-500" />
                      Stock Symbol *
                    </label>
                    <div className="relative">
                      <input
                        ref={inputRef}
                        name="symbol"
                        value={form.symbol}
                        onChange={handleChange}
                        onFocus={() => setShowSuggestions(true)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Search symbol or company..."
                        required
                      />
                      
                      <AnimatePresence>
                        {(showSuggestions || isLoadingSuggestions) && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden"
                          >
                            {isLoadingSuggestions ? (
                              <div className="p-4 text-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Searching stocks...</p>
                              </div>
                            ) : suggestions.length > 0 ? (
                              <>
                                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700">
                                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Select a stock
                                  </p>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                  {suggestions.map((stock) => {
                                    const ownedShares = getTotalOwnedShares(stock.symbol);
                                    const latestPrice = stock.lastTradedPrice || stock.currentPrice || stock.close || 0;
                                    const changeColor = stock.change >= 0 ? 'text-emerald-600' : 'text-red-600';
                                    return (
                                      <motion.div
                                        key={stock.symbol}
                                        whileHover={{ scale: 1.005 }}
                                        className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer border-b last:border-b-0 border-gray-100 dark:border-gray-800 transition-colors"
                                        onMouseDown={() => handleSuggestionClick(stock)}
                                      >
                                        <div className="flex justify-between items-center">
                                          <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                              <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
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
                                            <div className="font-bold text-gray-900 dark:text-white">
                                              Rs. {latestPrice.toLocaleString('en-NP', { minimumFractionDigits: 2 })}
                                            </div>
                                            {stock.change !== undefined && (
                                              <div className={`text-xs font-medium ${changeColor}`}>
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <FaBuilding className="mr-2 text-blue-500" />
                      Company Name *
                    </label>
                    <input
                      name="companyName"
                      value={form.companyName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Enter company name"
                      required
                    />
                  </div>

                  {/* Quantity & Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <FaHashtag className="mr-2 text-blue-500" />
                        Quantity *
                      </label>
                      <input
                        name="quantity"
                        type="number"
                        min="1"
                        step="1"
                        value={form.quantity}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <FaMoneyBillWave className="mr-2 text-blue-500" />
                        Price per Share *
                      </label>
                      <input
                        name="buyPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.buyPrice}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  {/* Transaction Type */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Transaction Type *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, transactionType: "Buy" }))}
                        className={`px-4 py-4 rounded-xl font-medium transition-all flex items-center justify-center space-x-3 ${
                          form.transactionType === "Buy"
                            ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg"
                            : "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
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
                            : "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                        }`}
                      >
                        <FaMinusCircle />
                        <span>Sell</span>
                      </button>
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
                      className="mt-6"
                    >
                      {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
                          <div className="flex items-center">
                            <FaInfoCircle className="text-red-500 mr-3 flex-shrink-0" />
                            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                          </div>
                        </div>
                      )}
                      {success && (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl">
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
                <div className="flex space-x-4 mt-8">
                  <button
                    type="submit"
                    className={`px-8 py-3 text-white font-medium rounded-xl hover:shadow-lg transition-all flex items-center ${
                      isEditing 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                    }`}
                  >
                    <FaPlusCircle className="mr-3" />
                    {isEditing ? 'Update Transaction' : 'Add Transaction'}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Holdings Summary */}
            {metrics.holdings.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                        <FaLayerGroup className="mr-3 text-emerald-500" />
                        Current Holdings ({metrics.holdings.length})
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Total Value: Rs. {metrics.totalCurrentValue.toLocaleString('en-NP', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Filter stocks..."
                          value={filterSymbol}
                          onChange={(e) => setFilterSymbol(e.target.value)}
                          className="pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <button
                        onClick={exportPortfolio}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center text-sm"
                      >
                        <FaDownload className="mr-2" />
                        Export
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {metrics.holdings.map(([symbol, holding]) => {
                      const latestPrice = getLatestPrice(symbol);
                      const currentValue = holding.currentQuantity * latestPrice;
                      const profitLoss = currentValue - holding.totalInvestment;
                      const profitLossPercent = holding.totalInvestment > 0 ? (profitLoss / holding.totalInvestment) * 100 : 0;
                      const stock = portfolio.find(s => s.symbol === symbol);
                      const hasCorporateActions = holding.corporateActions?.length > 0;
                      
                      return (
                        <motion.div
                          key={symbol}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{symbol}</span>
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                                    {holding.currentQuantity} shares
                                  </span>
                                  {holding.effectiveQuantity > holding.currentQuantity && (
                                    <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                                      +{holding.effectiveQuantity - holding.currentQuantity} bonus
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {holding.companyName}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  if (stock) openCorporateActionModal(stock);
                                }}
                                className="p-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
                                title="Add dividend/bonus"
                              >
                                <FaGift className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => stock && handleEdit(stock)}
                                className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                title="Edit"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500 dark:text-gray-400">Avg. Cost:</span>
                              <span className="font-semibold">Rs. {holding.avgBuyPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500 dark:text-gray-400">Current Price:</span>
                              <span className="font-semibold">Rs. {latestPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500 dark:text-gray-400">Investment:</span>
                              <span className="font-bold">Rs. {holding.totalInvestment.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500 dark:text-gray-400">Current Value:</span>
                              <span className="font-bold">Rs. {currentValue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                              <span className="text-gray-500 dark:text-gray-400">P&L:</span>
                              <span className={`font-bold text-lg ${profitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                {profitLoss >= 0 ? '+' : ''}Rs. {Math.abs(profitLoss).toFixed(2)} ({profitLossPercent.toFixed(2)}%)
                              </span>
                            </div>
                            {holding.totalDividends > 0 && (
                              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                                <span className="text-gray-500 dark:text-gray-400">Dividends Received:</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  Rs. {holding.totalDividends.toFixed(2)}
                                </span>
                              </div>
                            )}
                            {hasCorporateActions && (
                              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Corporate Actions:</p>
                                <div className="flex flex-wrap gap-1">
                                  {holding.corporateActions?.slice(0, 3).map(action => (
                                    <span key={action.id} className={`text-xs px-2 py-1 rounded ${getActionColor(action.type)}`}>
                                      {action.type === 'cash_dividend' ? `Dividend: Rs. ${action.value}` :
                                       action.type === 'bonus_share' ? `Bonus: ${action.value}%` :
                                       action.type === 'right_share' ? `Right: ${action.value}%` : 'Other'}
                                    </span>
                                  ))}
                                  {holding.corporateActions && holding.corporateActions.length > 3 && (
                                    <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                      +{holding.corporateActions.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                  <FaChartLine className="w-10 h-10 text-blue-400 dark:text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Your portfolio is empty
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  Start building your investment portfolio by adding your first transaction above. Track your stocks, monitor performance, and receive dividends.
                </p>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Add Your First Stock
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Dashboard */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                  <FaCoins className="mr-3 text-purple-500" />
                  Quick Actions
                </h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => openCorporateActionModal()}
                    disabled={ownedSymbols.length === 0}
                    className={`p-5 rounded-xl transition-all flex flex-col items-center justify-center ${
                      ownedSymbols.length === 0
                        ? 'bg-gray-100 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-lg transform hover:-translate-y-1'
                    }`}
                  >
                    <FaGift className="w-7 h-7 mb-2" />
                    <span className="text-sm font-medium">Add Dividend</span>
                  </button>
                  <button
                    onClick={() => document.getElementById('importInput')?.click()}
                    className="p-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all flex flex-col items-center justify-center transform hover:-translate-y-1"
                  >
                    <FaUpload className="w-7 h-7 mb-2" />
                    <span className="text-sm font-medium">Import</span>
                  </button>
                  <button
                    onClick={handleRefreshPrices}
                    disabled={isLoadingStocks}
                    className={`p-5 rounded-xl transition-all flex flex-col items-center justify-center ${
                      isLoadingStocks
                        ? 'bg-gray-100 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg transform hover:-translate-y-1'
                    }`}
                  >
                    {isLoadingStocks ? (
                      <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white mb-2"></div>
                    ) : (
                      <FaDatabase className="w-7 h-7 mb-2" />
                    )}
                    <span className="text-sm font-medium">
                      {isLoadingStocks ? 'Updating...' : 'Refresh Prices'}
                    </span>
                  </button>
                  <button
                    onClick={exportPortfolio}
                    className="p-5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all flex flex-col items-center justify-center transform hover:-translate-y-1"
                  >
                    <FaDownload className="w-7 h-7 mb-2" />
                    <span className="text-sm font-medium">Export</span>
                  </button>
                </div>
                <input
                  id="importInput"
                  type="file"
                  accept=".json"
                  onChange={importPortfolio}
                  className="hidden"
                />
                {ownedSymbols.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                    Add stocks first to enable dividend tracking
                  </p>
                )}
              </div>
            </div>

            {/* Recent Transactions & Dividends Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="border-b border-gray-100 dark:border-gray-700">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("transactions")}
                    className={`flex-1 px-5 py-4 text-sm font-medium transition-colors flex items-center justify-center ${
                      activeTab === "transactions"
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <FaHistory className="mr-2" />
                    Transactions
                  </button>
                  <button
                    onClick={() => setActiveTab("dividends")}
                    className={`flex-1 px-5 py-4 text-sm font-medium transition-colors flex items-center justify-center ${
                      activeTab === "dividends"
                        ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <FaMoneyBill className="mr-2" />
                    Dividends
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                {activeTab === "transactions" ? (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {filteredPortfolio.slice(0, 10).map((stock) => {
                      const latestPrice = getLatestPrice(stock.symbol);
                      const currentValue = stock.quantity * latestPrice;
                      const investment = stock.quantity * stock.buyPrice;
                      const gain = ((currentValue - investment) / investment) * 100;
                      
                      return (
                        <div key={stock.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-bold text-gray-900 dark:text-white">{stock.symbol}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  stock.transactionType === 'Buy'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {stock.transactionType}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(stock.dateAdded).toLocaleDateString('en-NP')}
                              </p>
                            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleEdit(stock)}
                                className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                title="Edit"
                              >
                                <FaEdit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(stock.id)}
                                className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                title="Delete"
                              >
                                <FaTrash className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Qty:</span>
                                <span className="font-medium">{stock.quantity}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Buy Price:</span>
                                <span className="font-medium">Rs. {stock.buyPrice.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Investment:</span>
                                <span className="font-bold">Rs. {investment.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Current:</span>
                                <span className={`font-bold ${gain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                  Rs. {currentValue.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {filteredPortfolio.length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                          <FaHistory className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">No transactions yet</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {getAllCorporateActions()
                      .slice(0, 10)
                      .map((action) => {
                        const totalValue = calculateCorporateActionValue(action, action.quantity);
                        
                        return (
                          <div key={action.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${getActionColor(action.type)}`}>
                                  {getActionIcon(action.type)}
                                </div>
                                <div>
                                  <span className="font-bold text-gray-900 dark:text-white">{action.stockSymbol}</span>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                    {action.type.replace('_', ' ')}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteCorporateAction(
                                  portfolio.find(s => s.symbol === action.stockSymbol)?.id || '',
                                  action.id
                                )}
                                className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              >
                                <FaTrash className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Per Share/Unit:</span>
                                <span className="font-bold">
                                  {action.type === 'cash_dividend' ? 'Rs. ' : ''}
                                  {typeof action.value === 'number' ? action.value.toFixed(2) : action.value}
                                  {action.type === 'right_share' || action.type === 'bonus_share' ? '%' : ''}
                                </span>
                              </div>
                              {totalValue && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400">Total Amount:</span>
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    Rs. {totalValue.toFixed(2)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Shares at Date:</span>
                                <span className="font-medium">{action.quantity} shares</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Date:</span>
                                <span>{new Date(action.date).toLocaleDateString('en-NP')}</span>
                              </div>
                              {action.notes && (
                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                  <p className="text-xs text-gray-600 dark:text-gray-400">{action.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    {getAllCorporateActions().length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                          <FaGift className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mb-2">No corporate actions yet</p>
                        <button
                          onClick={() => openCorporateActionModal()}
                          disabled={ownedSymbols.length === 0}
                          className={`text-sm px-4 py-2 rounded-lg ${
                            ownedSymbols.length === 0
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-emerald-600 dark:text-emerald-400 hover:underline'
                          }`}
                        >
                          Add your first dividend
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Portfolio Stats */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-xl">
              <h3 className="font-semibold mb-4 flex items-center">
                <FaChartBar className="mr-2" />
                Portfolio Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="opacity-90">Total Stocks</span>
                  <span className="font-bold">{metrics.holdings.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-90">Total Shares</span>
                  <span className="font-bold">{metrics.totalShares.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-90">Dividend Yield</span>
                  <span className="font-bold">
                    {metrics.totalInvestment > 0 
                      ? ((metrics.totalDividends / metrics.totalInvestment) * 100).toFixed(2)
                      : '0.00'}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-90">Overall Return</span>
                  <span className={`font-bold ${metrics.overallReturn >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {metrics.overallReturn.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Corporate Action Modal */}
      <AnimatePresence>
        {showCorporateActionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowCorporateActionModal(false);
              setSelectedStockForAction(null);
              resetCorporateActionForm();
              setShowCorporateActionSuggestions(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Add Corporate Action
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Record dividends, bonus shares, rights, or other actions
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCorporateActionModal(false);
                      setSelectedStockForAction(null);
                      resetCorporateActionForm();
                      setShowCorporateActionSuggestions(false);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddCorporateAction} className="p-6">
                <div className="space-y-5">
                  {/* Symbol Input with Validation */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Stock Symbol *
                      {corporateActionForm.symbol && (
                        <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                          getTotalOwnedShares(corporateActionForm.symbol.toUpperCase()) > 0
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {getTotalOwnedShares(corporateActionForm.symbol.toUpperCase()) > 0
                            ? `${getTotalOwnedShares(corporateActionForm.symbol.toUpperCase())} shares currently owned`
                            : 'Not owned'}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        ref={corporateActionSymbolRef}
                        name="symbol"
                        value={corporateActionForm.symbol}
                        onChange={handleCorporateActionChange}
                        onFocus={() => setShowCorporateActionSuggestions(true)}
                        className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 ${
                          getTotalOwnedShares(corporateActionForm.symbol.toUpperCase()) > 0
                            ? 'border-emerald-200 dark:border-emerald-700'
                            : corporateActionForm.symbol
                            ? 'border-red-200 dark:border-red-700'
                            : 'border-gray-200 dark:border-gray-700'
                        } rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all`}
                        placeholder="Enter stock symbol..."
                        required
                      />
                      
                      {/* Suggestions for owned stocks only */}
                      <AnimatePresence>
                        {showCorporateActionSuggestions && corporateActionForm.symbol && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden"
                          >
                            <div className="max-h-48 overflow-y-auto">
                              {ownedSymbols
                                .filter(symbol => 
                                  symbol.toLowerCase().includes(corporateActionForm.symbol.toLowerCase())
                                )
                                .slice(0, 8)
                                .map(symbol => {
                                  const stock = allStocks.find(s => s.symbol === symbol);
                                  const ownedShares = getTotalOwnedShares(symbol);
                                  return (
                                    <div
                                      key={symbol}
                                      className="px-4 py-3 hover:bg-emerald-50 dark:hover:bg-gray-800 cursor-pointer border-b last:border-b-0 border-gray-100 dark:border-gray-800"
                                      onClick={() => {
                                        handleCorporateActionSuggestionClick({ symbol, name: stock?.name || '' });
                                        setShowCorporateActionSuggestions(false);
                                      }}
                                    >
                                      <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-3">
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                              {symbol}
                                            </span>
                                            <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
                                              {ownedShares} shares
                                            </span>
                                          </div>
                                          {stock && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                              {stock.name}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              {ownedSymbols.filter(symbol => 
                                symbol.toLowerCase().includes(corporateActionForm.symbol.toLowerCase())
                              ).length === 0 && (
                                <div className="p-4 text-center">
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {corporateActionForm.symbol 
                                      ? `You don't own any shares of ${corporateActionForm.symbol}`
                                      : 'Start typing to see your owned stocks'
                                    }
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {corporateActionForm.symbol && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Shares owned on selected date will be calculated automatically
                      </p>
                    )}
                  </div>

                  {/* Action Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Action Type *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["cash_dividend", "right_share", "bonus_share", "other"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setCorporateActionForm(prev => ({ ...prev, type }))}
                          className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                            corporateActionForm.type === type
                              ? "bg-emerald-500 text-white shadow-lg"
                              : "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                          }`}
                        >
                          {getActionIcon(type)}
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Value */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Value *
                      {corporateActionForm.type === 'cash_dividend' && corporateActionForm.value && (
                        <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                          Amount per share
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      {corporateActionForm.type === 'cash_dividend' && (
                        <FaRupeeSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      )}
                      <input
                        name="value"
                        type={corporateActionForm.type === 'other' ? 'text' : 'number'}
                        step="0.01"
                        min="0"
                        value={corporateActionForm.value}
                        onChange={handleCorporateActionChange}
                        className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                          corporateActionForm.type === 'cash_dividend' ? 'pl-10' : ''
                        }`}
                        placeholder={
                          corporateActionForm.type === 'cash_dividend' ? "Amount per share (Rs.)" :
                          corporateActionForm.type === 'right_share' || corporateActionForm.type === 'bonus_share' ? "Percentage (%)" :
                          "Description"
                        }
                        required
                      />
                      {(corporateActionForm.type === 'right_share' || corporateActionForm.type === 'bonus_share') && (
                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Action Date *
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        (When the action occurred)
                      </span>
                    </label>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        name="date"
                        type="date"
                        value={corporateActionForm.date}
                        onChange={handleCorporateActionChange}
                        className="w-full pl-10 px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      />
                    </div>
                    {corporateActionForm.symbol && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        You owned {getTotalOwnedShares(corporateActionForm.symbol.toUpperCase(), new Date(corporateActionForm.date))} shares on this date
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={corporateActionForm.notes}
                      onChange={handleCorporateActionChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      placeholder="Additional information, source, remarks..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Validation Error */}
                {error && corporateActionForm.symbol && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex space-x-3 mt-8">
                  <button
                    type="submit"
                    disabled={getTotalOwnedShares(corporateActionForm.symbol.toUpperCase(), new Date(corporateActionForm.date)) <= 0}
                    className={`flex-1 px-6 py-3 font-medium rounded-xl transition-all flex items-center justify-center ${
                      getTotalOwnedShares(corporateActionForm.symbol.toUpperCase(), new Date(corporateActionForm.date)) <= 0
                        ? 'bg-gray-100 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-lg'
                    }`}
                  >
                    <FaPlusCircle className="mr-2" />
                    Add Corporate Action
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCorporateActionModal(false);
                      setSelectedStockForAction(null);
                      resetCorporateActionForm();
                      setShowCorporateActionSuggestions(false);
                    }}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-12 py-8 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              NEPSE Portfolio Tracker • Real-time Investment Management • {new Date().getFullYear()}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
              Note: Prices update in real-time. Portfolio data is stored locally in your browser.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Missing icon component
const FaMinusCircle = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
);