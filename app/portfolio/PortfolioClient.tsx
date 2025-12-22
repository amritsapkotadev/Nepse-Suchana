'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { FaSearch, FaBuilding, FaHashtag, FaMoneyBillWave, FaPlusCircle } from 'react-icons/fa';

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

    const symbol = form.symbol.toUpperCase();
    const quantity = Number(form.quantity);
    const buyPrice = Number(form.buyPrice);

    setPortfolio(prevPortfolio => {
      const existing = prevPortfolio.find(stock => stock.symbol === symbol);
      if (existing) {
        const totalQuantity = existing.quantity + quantity;
        const totalCost = (existing.quantity * existing.buyPrice) + (quantity * buyPrice);
        const averagePrice = totalCost / totalQuantity;
        return prevPortfolio.map(stock =>
          stock.symbol === symbol
            ? {
                ...stock,
                quantity: totalQuantity,
                buyPrice: averagePrice,
                averagePrice: averagePrice
              }
            : stock
        );
      } else {
        return [
          ...prevPortfolio,
          {
            id: Date.now().toString(),
            symbol,
            companyName: form.companyName,
            quantity,
            buyPrice,
            averagePrice: buyPrice
          }
        ];
      }
    });
    setForm({ symbol: '', companyName: '', quantity: '', buyPrice: '' });
  };

  // Calculate summary
  const totalInvestment = portfolio.reduce((sum, stock) => sum + stock.quantity * stock.buyPrice, 0);
  const totalStocks = portfolio.reduce((sum, stock) => sum + stock.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 md:p-12 text-center flex flex-col gap-8">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 mb-2 tracking-tight">Nepse Portfolio</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-2 text-lg">Track and manage your NEPSE stocks with ease.</p>

        {/* Summary Section */}
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-4">
          <div className="flex-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-2xl p-6 flex flex-col items-center shadow-md">
            <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">Total Investment</span>
            <span className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-2">Rs. {totalInvestment.toLocaleString()}</span>
          </div>
          <div className="flex-1 bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900 dark:to-blue-900 rounded-2xl p-6 flex flex-col items-center shadow-md">
            <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">Total Shares</span>
            <span className="text-3xl font-extrabold text-blue-700 dark:text-blue-300 mt-2">{totalStocks}</span>
          </div>
        </div>

        {/* Add Stock Form */}
        <form onSubmit={handleAdd} className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-6 text-left relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="relative col-span-2">
            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"><FaSearch className="inline" /> Stock Symbol *</label>
            <input
              name="symbol"
              value={form.symbol}
              onChange={handleChange}
              ref={inputRef}
              autoComplete="off"
              className="w-full px-4 py-3 rounded-xl border-2 border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent shadow"
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
            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"><FaBuilding className="inline" /> Company Name *</label>
            <input name="companyName" value={form.companyName} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" placeholder="e.g. Nabil Bank Limited" required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"><FaHashtag className="inline" /> Quantity *</label>
            <input name="quantity" value={form.quantity} onChange={handleChange} type="number" min="1" className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" placeholder="e.g. 10" required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"><FaMoneyBillWave className="inline" /> Buy Price *</label>
            <input name="buyPrice" value={form.buyPrice} onChange={handleChange} type="number" min="0" step="0.01" className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" placeholder="e.g. 1200" required />
          </div>
          <div className="md:col-span-4 flex flex-col gap-2 mt-2">
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 text-lg"><FaPlusCircle /> Add to Portfolio</button>
          </div>
        </form>

        {/* Portfolio Table Section */}
        <div className="w-full">
          {portfolio.length === 0 ? (
            <div className="w-full bg-gradient-to-r from-slate-100 to-blue-100 dark:from-slate-800 dark:to-blue-900 rounded-xl p-8 text-slate-500 dark:text-slate-300 mb-4 shadow-inner">
              <span className="block text-lg font-semibold mb-2">No stocks added yet</span>
              <span className="block text-sm">Your portfolio is empty. Add stocks to see them here.</span>
            </div>
          ) : (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xl bg-white dark:bg-slate-900">
                <thead className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-slate-700 dark:text-slate-200">Symbol</th>
                    <th className="px-6 py-4 text-left font-bold text-slate-700 dark:text-slate-200">Company</th>
                    <th className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-200">Quantity</th>
                    <th className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-200">Avg. Price</th>
                    <th className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-200">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((stock) => (
                    <tr key={stock.id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <td className="px-6 py-4 font-semibold text-blue-700 dark:text-blue-300">{stock.symbol}</td>
                      <td className="px-6 py-4">{stock.companyName}</td>
                      <td className="px-6 py-4 text-right">{stock.quantity}</td>
                      <td className="px-6 py-4 text-right">Rs. {stock.buyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-right font-bold">Rs. {(stock.quantity * stock.buyPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Link href="/" className="mt-2 inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-lg">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
