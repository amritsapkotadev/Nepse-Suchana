'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

interface Stock {
  symbol: string;
  name: string;
}
interface PortfolioStock {
  id: string;
  symbol: string;
  companyName: string;
  quantity: number;
  buyPrice: number;
}
export default function PortfolioClient({ allStocks }: { allStocks: Stock[] }) {
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>([]);
  const [form, setForm] = useState({ symbol: '', companyName: '', quantity: '', buyPrice: '' });
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<Stock[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (form.symbol.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const q = form.symbol.toLowerCase();
    const filtered = allStocks.filter(
      s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    ).slice(0, 8);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [form.symbol, allStocks]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSuggestionClick = (stock: Stock) => {
    setForm({ ...form, symbol: stock.symbol, companyName: stock.name });
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.symbol || !form.companyName || !form.quantity || !form.buyPrice) {
      setError('All fields are required.');
      return;
    }
    if (isNaN(Number(form.quantity)) || isNaN(Number(form.buyPrice))) {
      setError('Quantity and Buy Price must be numbers.');
      return;
    }
    setPortfolio([
      ...portfolio,
      {
        id: Date.now().toString(),
        symbol: form.symbol.toUpperCase(),
        companyName: form.companyName,
        quantity: Number(form.quantity),
        buyPrice: Number(form.buyPrice)
      }
    ]);
    setForm({ symbol: '', companyName: '', quantity: '', buyPrice: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-4">My Portfolio</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
          Add your NEPSE stocks to your portfolio below.
        </p>
        <form onSubmit={handleAdd} className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-left relative">
          <div className="relative col-span-2">
            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Stock Symbol *</label>
            <input
              name="symbol"
              value={form.symbol}
              onChange={handleChange}
              ref={inputRef}
              autoComplete="off"
              className="w-full px-4 py-3 rounded-xl border-2 border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent shadow-lg"
              placeholder="Type symbol or name (e.g. NABIL)"
              required
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
            />
            {showSuggestions && (
              <ul className="absolute z-10 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 shadow-xl max-h-56 overflow-y-auto">
                {suggestions.map((stock) => (
                  <li
                    key={stock.symbol}
                    className="px-4 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-900 dark:text-white"
                    onMouseDown={() => handleSuggestionClick(stock)}
                  >
                    <span className="font-bold">{stock.symbol}</span> <span className="text-slate-500">{stock.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Company Name *</label>
            <input name="companyName" value={form.companyName} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" placeholder="e.g. Nabil Bank Limited" required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Quantity *</label>
            <input name="quantity" value={form.quantity} onChange={handleChange} type="number" min="1" className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" placeholder="e.g. 10" required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Buy Price *</label>
            <input name="buyPrice" value={form.buyPrice} onChange={handleChange} type="number" min="0" step="0.01" className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" placeholder="e.g. 1200" required />
          </div>
          <div className="md:col-span-2 flex flex-col gap-2">
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all">Add to Portfolio</button>
          </div>
        </form>
        {portfolio.length === 0 ? (
          <div className="w-full bg-gradient-to-r from-slate-100 to-blue-100 dark:from-slate-800 dark:to-blue-900 rounded-xl p-8 text-slate-500 dark:text-slate-300 mb-4 shadow-inner">
            <span className="block text-lg font-semibold mb-2">No stocks added yet</span>
            <span className="block text-sm">Your portfolio is empty. Add stocks to see them here.</span>
          </div>
        ) : (
          <div className="grid gap-4 mb-4">
            {portfolio.map((stock) => (
              <div key={stock.id} className="flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-blue-100/80 to-indigo-100/80 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 px-6 py-4 transition-all hover:shadow-2xl">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <span className="inline-block px-3 py-1 rounded-full bg-blue-600 text-white font-bold text-lg shadow-md mr-2 tracking-wide">
                    {stock.symbol}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 text-lg truncate max-w-xs">{stock.companyName}</span>
                </div>
                <div className="flex flex-wrap gap-4 items-center mt-2 md:mt-0">
                  <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1 rounded-xl font-medium text-sm">
                    Qty: <span className="font-bold">{stock.quantity}</span>
                  </span>
                  <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-xl font-medium text-sm">
                    Buy: <span className="font-bold">Rs. {stock.buyPrice}</span>
                  </span>
                  <button
                    onClick={() => setPortfolio(portfolio.filter((s) => s.id !== stock.id))}
                    className="ml-2 px-3 py-1 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm shadow transition-all"
                    title="Remove stock"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link href="/" className="mt-6 inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
