'use client';

import { useState, useEffect, useRef } from 'react';
const NEPSE_API_URL = "/api/nepse-proxy";

import Link from 'next/link';

interface WatchlistStock {
  id: string;
  symbol: string;
  companyName: string;
  targetPrice?: number;
  notes?: string;
  addedAt: Date;
}

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
  const symbolInputRef = useRef<HTMLInputElement>(null);

  // Fetch all stocks on mount
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const res = await fetch(NEPSE_API_URL);
        if (!res.ok) throw new Error("Failed to fetch stocks");
        const data = await res.json();
        setAllStocks(data.liveCompanyData || []);
      } catch (err) {
        setAllStocks([]);
      }
    };
    fetchStocks();
  }, []);

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newStock: WatchlistStock = {
      id: Date.now().toString(),
      symbol: formData.symbol.toUpperCase(),
      companyName: formData.companyName,
      targetPrice: formData.targetPrice ? parseFloat(formData.targetPrice) : undefined,
      notes: formData.notes || undefined,
      addedAt: new Date()
    };

    setWatchlist([...watchlist, newStock]);
    setFormData({ symbol: '', companyName: '', targetPrice: '', notes: '' });
    setShowAddForm(false);
  };

  const handleRemoveStock = (id: string) => {
    setWatchlist(watchlist.filter(stock => stock.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Watchlist</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Track your favorite stocks</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm shadow-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Stock
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Stock Form */}
        {showAddForm && (
          <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Stock to Watchlist</h2>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Stock Symbol *
                  </label>
                  <input
                    ref={symbolInputRef}
                    type="text"
                    value={formData.symbol}
                    onChange={e => {
                      setFormData({ ...formData, symbol: e.target.value });
                      setShowSuggestions(true);
                      const query = e.target.value.toLowerCase();
                      if (!query) {
                        setSuggestions(allStocks.slice(0, 10));
                      } else {
                        setSuggestions(
                          allStocks.filter(stock =>
                            stock.symbol.toLowerCase().includes(query) ||
                            stock.securityName.toLowerCase().includes(query)
                          ).slice(0, 10)
                        );
                      }
                    }}
                    onFocus={() => {
                      if (allStocks.length > 0) {
                        setSuggestions(allStocks.slice(0, 10));
                        setShowSuggestions(true);
                      }
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="e.g., NABIL"
                    required
                    autoComplete="off"
                  />
                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                      {suggestions.map(stock => (
                        <div
                          key={stock.symbol}
                          className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer border-b last:border-b-0 border-slate-100 dark:border-slate-800"
                          onMouseDown={() => {
                            setFormData({ ...formData, symbol: stock.symbol, companyName: stock.securityName });
                            setSuggestions([]);
                            setShowSuggestions(false);
                            setTimeout(() => symbolInputRef.current?.blur(), 100);
                          }}
                        >
                          <span className="font-bold text-blue-600 dark:text-blue-400">{stock.symbol}</span>
                          <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">{stock.securityName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="e.g., Nabil Bank Limited"
                    required
                    readOnly={!!formData.symbol}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Target Price (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.targetPrice}
                    onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="e.g., 1200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="Why are you watching this?"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg"
                >
                  Add to Watchlist
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Watchlist Display */}
        {watchlist.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Stocks in Watchlist</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Start tracking stocks by adding them to your watchlist</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Stock
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlist.map((stock) => (
              <div
                key={stock.id}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{stock.symbol}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{stock.companyName}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveStock(stock.id)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {stock.targetPrice && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Target Price</p>
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">₹ {stock.targetPrice.toLocaleString()}</p>
                  </div>
                )}

                {stock.notes && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Notes</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{stock.notes}</p>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Added {new Date(stock.addedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
