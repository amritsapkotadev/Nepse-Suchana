'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  FaTrash, 
  FaPlus, 
  FaRegStickyNote, 
  FaBullseye, 
  FaArrowUp, 
  FaArrowDown,
  FaSearch,
  FaChartLine,
  FaFilter,
  FaTimes,
  FaEdit,
  FaSortAmountDown,
  FaSortAmountUp
} from 'react-icons/fa';
import StockChartModal from '@/components/StockChartModal';

const NEPSE_API_URL = "/api/nepse-proxy";

interface WatchlistStock {
  id: string;
  symbol: string;
  companyName: string;
  targetPrice?: number;
  notes?: string;
  addedAt: Date;
}

type SortField = 'symbol' | 'price' | 'change' | 'target' | 'added';
type SortDirection = 'asc' | 'desc';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    companyName: '',
    targetPrice: '',
    notes: ''
  });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allStocks, setAllStocks] = useState<any[]>([]);
  const [liveMap, setLiveMap] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const symbolInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch watchlist from database
  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await fetch('/api/watchlist');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const items = data.data.map((item: any) => ({
            id: item.id.toString(),
            symbol: item.stock_symbol,
            companyName: '',
            addedAt: new Date(item.created_at)
          }));
          setWatchlist(items);
        }
      }
    } catch (err) {
      console.error('Error fetching watchlist:', err);
    }
  }, []);

  // Fetch all stocks on mount
  const fetchStocks = useCallback(async () => {
    try {
      const res = await fetch(NEPSE_API_URL);
      if (!res.ok) throw new Error("Failed to fetch stocks");
      const data = await res.json();
      setAllStocks(data.liveCompanyData || []);
      const map: Record<string, any> = {};
      (data.liveCompanyData || []).forEach((s: any) => { 
        map[s.symbol] = s; 
      });
      setLiveMap(map);
    } catch (err) {
      console.error('Error fetching stocks:', err);
      setAllStocks([]);
      setLiveMap({});
    }
  }, []);

  useEffect(() => {
    fetchStocks();
    fetchWatchlist();
  }, [fetchStocks, fetchWatchlist]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_symbol: formData.symbol.toUpperCase() })
      });
      
      if (res.ok) {
        const data = await res.json();
        const newStock: WatchlistStock = {
          id: data.data?.id?.toString() || Date.now().toString(),
          symbol: formData.symbol.toUpperCase(),
          companyName: formData.companyName,
          targetPrice: formData.targetPrice ? parseFloat(formData.targetPrice) : undefined,
          notes: formData.notes || undefined,
          addedAt: new Date()
        };

        setWatchlist([newStock, ...watchlist]);
        setFormData({ symbol: '', companyName: '', targetPrice: '', notes: '' });
        setShowAddForm(false);
        setShowSuggestions(false);
        toast.success('Added to watchlist');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to add to watchlist');
      }
    } catch (err) {
      toast.error('Failed to add to watchlist');
    }
  };

  const handleRemoveStock = async (id: string) => {
    const stock = watchlist.find(s => s.id === id);
    if (!stock) return;
    
    try {
      const res = await fetch('/api/watchlist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_symbol: stock.symbol })
      });
      
      if (res.ok) {
        setWatchlist(watchlist.filter(s => s.id !== id));
        toast.success('Removed from watchlist');
      } else {
        toast.error('Failed to remove from watchlist');
      }
    } catch (err) {
      toast.error('Failed to remove from watchlist');
    }
  };

  const handleEditStock = (id: string) => {
    const stock = watchlist.find(s => s.id === id);
    if (stock) {
      setFormData({
        symbol: stock.symbol,
        companyName: stock.companyName,
        targetPrice: stock.targetPrice?.toString() || '',
        notes: stock.notes || ''
      });
      setEditingStock(id);
      setShowAddForm(true);
    }
  };

  const handleUpdateStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStock) return;

    setWatchlist(watchlist.map(stock => 
      stock.id === editingStock ? {
        ...stock,
        symbol: formData.symbol.toUpperCase(),
        companyName: formData.companyName,
        targetPrice: formData.targetPrice ? parseFloat(formData.targetPrice) : undefined,
        notes: formData.notes || undefined
      } : stock
    ));

    setFormData({ symbol: '', companyName: '', targetPrice: '', notes: '' });
    setEditingStock(null);
    setShowAddForm(false);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedStocks = useMemo(() => {
    let filtered = watchlist.filter(stock => 
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const aLive = liveMap[a.symbol];
      const bLive = liveMap[b.symbol];
      const aPrice = aLive?.lastTradedPrice ?? aLive?.currentPrice ?? 0;
      const bPrice = bLive?.lastTradedPrice ?? bLive?.currentPrice ?? 0;
      const aChange = aLive?.change ?? 0;
      const bChange = bLive?.change ?? 0;

      let comparison = 0;
      switch (sortField) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'price':
          comparison = aPrice - bPrice;
          break;
        case 'change':
          comparison = aChange - bChange;
          break;
        case 'target':
          comparison = (a.targetPrice || 0) - (b.targetPrice || 0);
          break;
        case 'added':
          comparison = new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [watchlist, searchQuery, sortField, sortDirection, liveMap]);

  const totalStocks = watchlist.length;
  const targetsReached = watchlist.filter(stock => {
    const live = liveMap[stock.symbol];
    const ltp = live?.lastTradedPrice ?? live?.currentPrice;
    return ltp && stock.targetPrice && ltp >= stock.targetPrice;
  }).length;

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-emerald-600';
    if (change < 0) return 'text-red-600';
    return 'text-slate-500';
  };

  const getPriceChangeBg = (change: number) => {
    if (change > 0) return 'bg-emerald-50';
    if (change < 0) return 'bg-red-50';
    return 'bg-slate-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Stock Watchlist
          </h1>
          <p className="text-sm text-slate-600">
            Track and manage your favorite stocks
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Stocks</p>
                <p className="text-2xl font-bold text-slate-900">{totalStocks}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <FaChartLine className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Targets Reached</p>
                <p className="text-2xl font-bold text-slate-900">{targetsReached}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-100">
                <FaBullseye className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg. Target Progress</p>
                <p className="text-2xl font-bold text-slate-900">
                  {watchlist.length > 0 
                    ? `${Math.round(watchlist.filter(stock => {
                        const live = liveMap[stock.symbol];
                        const ltp = live?.lastTradedPrice ?? live?.currentPrice;
                        return ltp && stock.targetPrice;
                      }).length / watchlist.length * 100)}%`
                    : '0%'}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-100">
                <FaArrowUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search stocks by symbol, name, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600:text-slate-300"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Sort Controls */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {(['symbol', 'price', 'change', 'target', 'added'] as SortField[]).map((field) => (
            <button
              key={field}
              onClick={() => handleSort(field)}
              className={`px-4 py-2 rounded-lg transition-colors ${sortField === field ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50:bg-slate-700'}`}
            >
              <div className="flex items-center gap-2 capitalize">
                {field}
                {sortField === field && (
                  sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                )}
              </div>
            </button>
          ))}
          <div className="flex-1"></div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
          >
            <FaPlus className="w-4 h-4" />
            <span>Add Stock</span>
          </button>
        </div>

        {/* Add/Edit Stock Form */}
        {(showAddForm || editingStock) && (
          <div className="mb-8 bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingStock ? 'Edit Stock' : 'Add New Stock'}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingStock(null);
                  setFormData({ symbol: '', companyName: '', targetPrice: '', notes: '' });
                }}
                className="p-2 hover:bg-slate-100:bg-slate-700 rounded-lg transition-colors"
              >
                <FaTimes className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={editingStock ? handleUpdateStock : handleAddStock} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative" ref={suggestionsRef}>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Stock Symbol *
                  </label>
                  <input
                    ref={symbolInputRef}
                    type="text"
                    value={formData.symbol}
                    onChange={e => {
                      setFormData({ ...formData, symbol: e.target.value });
                      const query = e.target.value.toLowerCase();
                      if (!query) {
                        setSuggestions([]);
                      } else {
                        setSuggestions(
                          allStocks.filter(stock =>
                            stock.symbol.toLowerCase().includes(query) ||
                            stock.securityName.toLowerCase().includes(query)
                          ).slice(0, 8)
                        );
                      }
                    }}
                    onFocus={() => {
                      if (allStocks.length > 0 && formData.symbol) {
                        const query = formData.symbol.toLowerCase();
                        setSuggestions(
                          allStocks.filter(stock =>
                            stock.symbol.toLowerCase().includes(query) ||
                            stock.securityName.toLowerCase().includes(query)
                          ).slice(0, 8)
                        );
                      }
                    }}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="Type symbol or company name..."
                    required
                    autoComplete="off"
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-300 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                      {suggestions.map(stock => (
                        <button
                          key={stock.symbol}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-blue-50:bg-slate-800 cursor-pointer border-b last:border-b-0 border-slate-100"
                          onClick={() => {
                            setFormData({ 
                              ...formData, 
                              symbol: stock.symbol, 
                              companyName: stock.securityName 
                            });
                            setSuggestions([]);
                          }}
                        >
                          <div className="font-bold text-blue-600">{stock.symbol}</div>
                          <div className="text-sm text-slate-600 truncate">
                            {stock.securityName}
                          </div>
                          {liveMap[stock.symbol] && (
                            <div className="text-xs mt-1">
                              <span className="font-medium">Rs. {liveMap[stock.symbol].lastTradedPrice}</span>
                              <span className={`ml-2 ${getPriceChangeColor(liveMap[stock.symbol].change)}`}>
                                {liveMap[stock.symbol].change >= 0 ? '+' : ''}{liveMap[stock.symbol].change}%
                              </span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="Company name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Target Price (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.targetPrice}
                    onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="Enter target price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="Add notes or reasoning..."
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  {editingStock ? (
                    <>
                      <FaEdit /> Update Stock
                    </>
                  ) : (
                    <>
                      <FaPlus /> Add to Watchlist
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingStock(null);
                    setFormData({ symbol: '', companyName: '', targetPrice: '', notes: '' });
                  }}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300:bg-slate-600 text-slate-700 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Watchlist Grid */}
        {filteredAndSortedStocks.length === 0 && !showAddForm ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-6">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              {searchQuery ? 'No matching stocks found' : 'Your watchlist is empty'}
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              {searchQuery ? 'Try adjusting your search or filters' : 'Start building your portfolio by adding stocks to track'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all"
              >
                <FaPlus /> Add Your First Stock
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAndSortedStocks.map((stock) => {
              const live = liveMap[stock.symbol] || {};
              const ltp = live.lastTradedPrice ?? live.currentPrice;
              const change = live.change || 0;
              const changePercent = live.changePercent || 0;
              const isTargetReached = ltp && stock.targetPrice && ltp >= stock.targetPrice;
              const targetDiff = ltp && stock.targetPrice ? ((ltp / stock.targetPrice - 1) * 100) : null;

              return (
                <div
                  key={stock.id}
                  className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-200 transition-all hover:shadow-xl group"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {stock.symbol.charAt(0)}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600:text-blue-400 transition-colors">
                              {stock.symbol}
                            </h3>
                            {isTargetReached && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                                Target Reached
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 truncate max-w-xs">
                            {stock.companyName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StockChartModal symbol={stock.symbol} companyName={stock.companyName} />
                        <button
                          onClick={() => handleEditStock(stock.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-blue-600:text-blue-400 hover:bg-slate-100:bg-slate-700 transition-colors"
                          title="Edit"
                        >
                          <FaEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRemoveStock(stock.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600:text-red-400 hover:bg-slate-100:bg-slate-700 transition-colors"
                          title="Remove"
                        >
                          <FaTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Price Info */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className={`p-4 rounded-xl ${getPriceChangeBg(change)}`}>
                        <div className="text-sm text-slate-600 mb-1">Current Price</div>
                        <div className="text-2xl font-bold text-slate-900">
                          {ltp ? `Rs. ${ltp.toLocaleString('en-IN')}` : '--'}
                        </div>
                        {change !== 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-sm font-semibold ${getPriceChangeColor(change)}`}>
                              {change > 0 ? <FaArrowUp className="inline mr-1" /> : <FaArrowDown className="inline mr-1" />}
                              {Math.abs(change)} ({changePercent.toFixed(2)}%)
                            </span>
                          </div>
                        )}
                      </div>
                      {stock.targetPrice && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                          <div className="text-sm text-slate-600 mb-1">Target Price</div>
                          <div className="text-2xl font-bold text-blue-600">
                            Rs. {stock.targetPrice.toLocaleString('en-IN')}
                          </div>
                          {targetDiff !== null && ltp && (
                            <div className="text-sm font-semibold mt-2">
                              <span className={targetDiff >= 0 ? 'text-emerald-600' : 'text-slate-600'}>
                                {targetDiff >= 0 ? '+' : ''}{targetDiff.toFixed(2)}% from target
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {stock.notes && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                          <FaRegStickyNote /> Notes
                        </div>
                        <p className="text-slate-700 bg-slate-50 rounded-lg p-3">
                          {stock.notes}
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        Added {new Date(stock.addedAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-xs text-slate-500">
                        {live.updatedAt ? `Updated: ${new Date(live.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '--'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}