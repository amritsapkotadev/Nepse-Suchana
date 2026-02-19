'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useAppLoading } from '@/components/AppLoadingProvider';
import { useState, useRef, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import StockDetailModal from '@/app/components/Stockdetailmodal';

interface Stock {
  symbol: string;
  name: string;
  lastTradedPrice: number;
  change: number;
  changePercent: number;
  turnover: number;
}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/demo-trading', label: 'Demo Trading' },
];

function formatCrore(num: number): string {
  return (num / 10000000).toFixed(2);
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isAppLoading } = useAppLoading();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleStockClick = (stock: Stock) => {
    setSelectedStock(stock);
    setSearchQuery('');
    setSearchOpen(false);
  };

  const isStaticPage = pathname === '/disclaimer' || pathname === '/privacy-policy' || pathname === '/terms' || pathname === '/features';

  // Fetch stocks on mount
  useEffect(() => {
    async function fetchStocks() {
      setIsLoadingStocks(true);
      try {
        const res = await fetch('/api/nepse-proxy', { 
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await res.json();
        if (data.liveCompanyData) {
          const stocks: Stock[] = data.liveCompanyData.map((c: any) => ({
            symbol: c.symbol,
            name: c.securityName,
            lastTradedPrice: c.lastTradedPrice,
            change: c.change,
            changePercent: c.percentageChange,
            turnover: c.totalTradeValue,
          }));
          setAllStocks(stocks);
        }
      } catch (err) {
        console.error('Failed to fetch stocks:', err);
      } finally {
        setIsLoadingStocks(false);
      }
    }
    fetchStocks();
  }, []);

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter stocks based on search query
  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = allStocks
        .filter(s => 
          s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
          const aSymbolMatch = a.symbol.toLowerCase() === searchQuery.toLowerCase();
          const bSymbolMatch = b.symbol.toLowerCase() === searchQuery.toLowerCase();
          if (aSymbolMatch && !bSymbolMatch) return -1;
          if (!aSymbolMatch && bSymbolMatch) return 1;
          
          const aSymbolStarts = a.symbol.toLowerCase().startsWith(searchQuery.toLowerCase());
          const bSymbolStarts = b.symbol.toLowerCase().startsWith(searchQuery.toLowerCase());
          if (aSymbolStarts && !bSymbolStarts) return -1;
          if (!aSymbolStarts && bSymbolStarts) return 1;
          
          return b.turnover - a.turnover;
        })
        .slice(0, 50);
      setSearchResults(filtered);
      setSearchOpen(true);
    } else {
      setSearchResults([]);
      setSearchOpen(false);
    }
  }, [searchQuery, allStocks]);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  NEPSE Suchana
                </span>
              </Link>
            </div>

            <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
              <div ref={searchRef} className="relative w-full">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search stocks by symbol or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length > 0 && setSearchOpen(true)}
                    className="w-full px-4 py-2.5 pl-10 text-sm bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {isLoadingStocks && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {searchQuery && !isLoadingStocks && (
                    <button
                      onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {searchOpen && searchResults.length > 0 && (
                  <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 sticky top-0">
                      <p className="text-xs text-slate-500 font-medium">
                        Found {searchResults.length} stock{searchResults.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {searchResults.map((stock) => (
                      <button
                        key={stock.symbol}
                        onClick={() => handleStockClick(stock)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between transition-colors border-b border-slate-100 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">{stock.symbol.slice(0, 2)}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 text-sm">{stock.symbol}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${stock.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {stock.change >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate max-w-[140px]">{stock.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-slate-900">Rs {stock.lastTradedPrice.toLocaleString('en-IN')}</span>
                          <p className="text-xs text-slate-400">Turnover: Rs {formatCrore(stock.turnover)} Cr</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchOpen && searchQuery && searchResults.length === 0 && !isLoadingStocks && (
                  <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-200 py-8 z-50">
                    <svg className="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-slate-500 text-center">No stocks found matching &quot;{searchQuery}&quot;</p>
                  </div>
                )}
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              {user && navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname.startsWith(link.href)
                      ? 'text-blue-600'
                      : 'text-slate-600 hover:text-blue-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-blue-600"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  
                  {mobileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                      <div className="px-4 py-2 border-b border-slate-200">
                        <p className="text-sm font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                      <button
                        onClick={() => { logout(); }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:shadow-lg transition-all"
                >
                  Login
                </Link>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden pb-4">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 text-sm bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              {user && navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 text-sm font-medium ${
                    pathname.startsWith(link.href)
                      ? 'text-blue-600'
                      : 'text-slate-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      <StockDetailModal stock={selectedStock} onClose={() => setSelectedStock(null)} />
    </>
  );
}
