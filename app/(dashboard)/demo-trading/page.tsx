"use client";
import { useState, useEffect } from "react";
import { FaChartLine, FaMoneyBillWave, FaHashtag, FaPlusCircle, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";

interface Trade {
  id: string;
  symbol: string;
  companyName: string;
  quantity: number;
  buyPrice: number;
  lastTradedPrice?: number;
  currentPrice?: number;
  date: Date;
}

const NEPSE_API_URL = "/api/nepse-proxy";

export default function DemoTrading() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [form, setForm] = useState({ symbol: "", companyName: "", quantity: "", buyPrice: "" });
  const [profitLoss, setProfitLoss] = useState(0);
  type StockData = { symbol: string; securityName: string; lastTradedPrice?: number; closingPrice?: number; ltp?: number };
  const [suggestions, setSuggestions] = useState<StockData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allStocks, setAllStocks] = useState<StockData[]>([]);

  // Fetch all stocks on mount for instant suggestions
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const res = await fetch(NEPSE_API_URL);
        if (!res.ok) throw new Error("Failed to fetch stocks");
        const data = await res.json();
        setAllStocks(data.liveCompanyData || []);
      } catch {
        setAllStocks([]);
      }
    };
    fetchStocks();
  }, []);

  // Calculate profit/loss
  const calculatePL = () => {
    let totalPL = 0;
    trades.forEach(trade => {
      const displayPrice = typeof trade.lastTradedPrice === 'number'
        ? trade.lastTradedPrice
        : (typeof trade.currentPrice === 'number' ? trade.currentPrice : 0);
      const pl = (displayPrice - trade.buyPrice) * trade.quantity;
      totalPL += pl;
    });
    setProfitLoss(totalPL);
  };

  // Recalculate profit/loss whenever trades change
  useEffect(() => {
    calculatePL();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades]);

  // Add trade
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const { symbol, companyName, quantity, buyPrice } = form;
    if (!symbol || !companyName || !quantity || !buyPrice) {
      toast.error("All fields are required.");
      return;
    }
    const stock = allStocks.find(s => s.symbol === symbol);
    if (!stock) {
      toast.error("Invalid stock symbol.");
      return;
    }
    const newTrade: Trade = {
      id: crypto.randomUUID(),
      symbol,
      companyName,
      quantity: Number(quantity),
      buyPrice: Number(buyPrice),
      currentPrice: typeof stock.lastTradedPrice === 'number' ? stock.lastTradedPrice : (stock.closingPrice || stock.ltp || 0),
      lastTradedPrice: typeof stock.lastTradedPrice === 'number' ? stock.lastTradedPrice : undefined,
      date: new Date(),
    };
    setTrades(prev => [...prev, newTrade]);
    toast.success("Trade added");
    setForm({ symbol: "", companyName: "", quantity: "", buyPrice: "" });
    setTimeout(calculatePL, 100);
  };

  // Delete trade
  const handleDelete = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
    toast.success("Trade removed");
    setTimeout(calculatePL, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8">
      <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">Demo Trading</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700">
          <div className="flex items-center mb-4">
            <FaChartLine className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
            <span className="font-bold text-lg">Profit/Loss</span>
          </div>
          <p className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{profitLoss >= 0 ? '+' : ''}Rs. {profitLoss.toLocaleString('en-NP', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700">
          <div className="flex items-center mb-4">
            <FaHashtag className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-2" />
            <span className="font-bold text-lg">Total Trades</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{trades.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700">
          <div className="flex items-center mb-4">
            <FaMoneyBillWave className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
            <span className="font-bold text-lg">Total Investment</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">Rs. {trades.reduce((sum, t) => sum + t.buyPrice * t.quantity, 0).toLocaleString('en-NP', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Buy Stock (Demo)</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="relative">
            <label className="block text-sm font-medium mb-2">Symbol *</label>
            <input
              name="symbol"
              value={form.symbol}
              onChange={e => {
                setForm(prev => ({ ...prev, symbol: e.target.value }));
                setShowSuggestions(true);
                const query = e.target.value.toLowerCase();
                if (!query) {
                  setSuggestions(allStocks.slice(0, 20));
                } else {
                  setSuggestions(
                    allStocks.filter(stock =>
                      stock.symbol.toLowerCase().includes(query) ||
                      stock.securityName.toLowerCase().includes(query)
                    ).slice(0, 20)
                  );
                }
              }}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              placeholder="Type symbol or company name..."
              autoComplete="off"
              required
              onFocus={() => {
                if (allStocks.length > 0) {
                  setSuggestions(allStocks.slice(0, 20));
                  setShowSuggestions(true);
                }
              }}
            />
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                {suggestions.map(stock => (
                  <div
                    key={stock.symbol}
                    className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer border-b last:border-b-0 border-slate-100 dark:border-slate-800"
                    onMouseDown={() => {
                      setForm(prev => ({ ...prev, symbol: stock.symbol, companyName: stock.securityName }));
                      setSuggestions([]);
                      setShowSuggestions(false);
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
            <label className="block text-sm font-medium mb-2">Company Name *</label>
            <input name="companyName" value={form.companyName} readOnly className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Quantity *</label>
            <input name="quantity" type="number" min="1" value={form.quantity} onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Buy Price *</label>
            <input name="buyPrice" type="number" min="1" value={form.buyPrice} onChange={e => setForm(prev => ({ ...prev, buyPrice: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>
        </div>
        <button type="submit" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all flex items-center">
          <FaPlusCircle className="mr-2" /> Buy
        </button>
      </form>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Trade History</h2>
        {trades.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">No trades yet. Buy a stock to start demo trading.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Symbol</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Company</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Buy Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Current Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">P/L</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {trades.map(trade => {
                  const displayPrice = typeof trade.lastTradedPrice === 'number'
                    ? trade.lastTradedPrice
                    : (typeof trade.currentPrice === 'number' ? trade.currentPrice : 0);
                  return (
                    <tr key={trade.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{trade.date.toLocaleDateString()} {trade.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">{trade.symbol}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{trade.companyName}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{trade.quantity}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">Rs. {trade.buyPrice.toLocaleString('en-NP', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">Rs. {displayPrice.toLocaleString('en-NP', { minimumFractionDigits: 2 })}</td>
                      <td className={`px-6 py-4 text-sm font-bold ${(displayPrice - trade.buyPrice) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{(displayPrice - trade.buyPrice) >= 0 ? '+' : ''}Rs. {((displayPrice - trade.buyPrice) * trade.quantity).toLocaleString('en-NP', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleDelete(trade.id)} className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors" title="Delete"><FaTrash /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
