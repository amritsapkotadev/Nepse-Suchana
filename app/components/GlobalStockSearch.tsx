'use client';

import { useState } from 'react';
import StockDetailModal, { type Stock } from './Stockdetailmodal';

interface GlobalStockSearchProps {
  allStocks: Stock[];
}

function formatCrore(num: number): string {
  return (num / 10000000).toFixed(2);
}

export default function GlobalStockSearch({ allStocks }: GlobalStockSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  // Filter stocks based on search query
  const filteredStocks = allStocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort filtered stocks - prioritize exact matches and show top results
  const sortedFilteredStocks = filteredStocks
    .sort((a, b) => {
      // Exact symbol match first
      const aSymbolMatch = a.symbol.toLowerCase() === searchQuery.toLowerCase();
      const bSymbolMatch = b.symbol.toLowerCase() === searchQuery.toLowerCase();
      if (aSymbolMatch && !bSymbolMatch) return -1;
      if (!aSymbolMatch && bSymbolMatch) return 1;
      
      // Symbol starts with search query
      const aSymbolStarts = a.symbol.toLowerCase().startsWith(searchQuery.toLowerCase());
      const bSymbolStarts = b.symbol.toLowerCase().startsWith(searchQuery.toLowerCase());
      if (aSymbolStarts && !bSymbolStarts) return -1;
      if (!aSymbolStarts && bSymbolStarts) return 1;
      
      // Then by turnover (highest first)
      return b.turnover - a.turnover;
    })
    .slice(0, 50); // Limit to top 50 results for performance

  const handleStockClick = (stock: Stock) => {
    setSelectedStock(stock);
    setSearchQuery('');
  };

  return (
    <>
      {/* Global Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Search stocks by symbol or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 pl-14 text-base border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent shadow-lg"
          />
          <svg
            className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchQuery && (
          <div className="absolute left-0 right-0 mx-auto max-w-2xl mt-2 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
              {filteredStocks.length > 0 ? (
                <>
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Found {filteredStocks.length} stock{filteredStocks.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredStocks.map((stock) => (
                      <div
                        key={stock.symbol}
                        onClick={() => handleStockClick(stock)}
                        className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {stock.symbol}
                              </p>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${stock.change >= 0 ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}`}>
                                {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">
                              {stock.name}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              Rs {stock.lastTradedPrice.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Turnover: Rs {formatCrore(stock.turnover)} Cr
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="px-4 py-8 text-center">
                  <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No stocks found matching "{searchQuery}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <StockDetailModal stock={selectedStock} onClose={() => setSelectedStock(null)} />
    </>
  );
}
