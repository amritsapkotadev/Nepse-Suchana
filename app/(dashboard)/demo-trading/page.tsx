"use client";
import { useState, useEffect } from "react";
import { FaChartLine, FaMoneyBillWave, FaHashtag, FaPlusCircle, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthProvider";
import { Loader } from "@/components/Loader";

interface Trade {
  id: number;
  demotrading_id: number;
  stock_symbol: string;
  side: string;
  quantity: number;
  price: number;
  created_at: string;
}

interface DemoAccount {
  id: number;
  user_id: number;
  current_balance: number;
  transactions: Trade[];
}

const NEPSE_API_URL = "/api/nepse-proxy";

export default function DemoTrading() {
  const { user } = useAuth();
  const [account, setAccount] = useState<DemoAccount | null>(null);
  const [form, setForm] = useState({ symbol: "", companyName: "", quantity: "", buyPrice: "" });
  const [profitLoss, setProfitLoss] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasAccount, setHasAccount] = useState(false);
  type StockData = { symbol: string; securityName: string; lastTradedPrice?: number; closingPrice?: number; ltp?: number };
  const [suggestions, setSuggestions] = useState<StockData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allStocks, setAllStocks] = useState<StockData[]>([]);

  const fetchAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/demotrading', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setAccount(data.data);
          setHasAccount(true);
        } else {
          setHasAccount(false);
        }
      } else if (res.status === 401) {
        setHasAccount(false);
      }
    } catch (error) {
      console.error("Failed to fetch demo account:", error);
      setHasAccount(false);
    }
  };

  const createAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/demotrading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAccount(data.data);
        setHasAccount(true);
        toast.success("Demo trading account created!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create account");
      }
    } catch {
      toast.error("Failed to create account");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(NEPSE_API_URL);
        if (!res.ok) throw new Error("Failed to fetch stocks");
        const data = await res.json();
        setAllStocks(data.liveCompanyData || []);
      } catch {
        setAllStocks([]);
      }
    };
    fetchData();
    if (user) {
      fetchAccount().finally(() => setLoading(false));
    }
  }, [user]);

  const calculatePL = () => {
    if (!account?.transactions) return;
    let totalPL = 0;
    account.transactions.forEach((trade: Trade) => {
      const stock = allStocks.find(s => s.symbol === trade.stock_symbol);
      const currentPrice = stock?.lastTradedPrice || stock?.closingPrice || stock?.ltp || 0;
      const pl = (currentPrice - trade.price) * trade.quantity;
      totalPL += pl;
    });
    setProfitLoss(totalPL);
  };

  useEffect(() => {
    if (account?.transactions) {
      calculatePL();
    }
  }, [account?.transactions, allStocks]);

  const handleAdd = async (e: React.FormEvent) => {
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

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/demotrading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          stock_symbol: symbol,
          side: 'BUY',
          quantity: Number(quantity),
          price: Number(buyPrice),
          demotrading_id: account?.id
        })
      });

      if (res.ok) {
        await fetchAccount();
        toast.success("Trade added");
        setForm({ symbol: "", companyName: "", quantity: "", buyPrice: "" });
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add trade");
      }
    } catch {
      toast.error("Failed to add trade");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/demotrading?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        await fetchAccount();
        toast.success("Trade removed");
      } else {
        toast.error("Failed to remove trade");
      }
    } catch {
      toast.error("Failed to remove trade");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        <h1 className="text-3xl font-bold mb-6 text-slate-900">Demo Trading</h1>
        <div className="max-w-md mx-auto mt-20">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
              <FaChartLine className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Login Required</h2>
            <p className="text-slate-600 mb-6">
              Please login to access demo trading and practice your trading skills.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const trades = account?.transactions || [];

  if (!hasAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        <h1 className="text-3xl font-bold mb-6 text-slate-900">Demo Trading</h1>
        <div className="max-w-md mx-auto mt-20">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
              <FaChartLine className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Create Demo Trading Account</h2>
            <p className="text-slate-600 mb-6">
              Start practicing your trading skills with Rs. 10,00,000 virtual balance. No real money involved.
            </p>
            <button
              onClick={createAccount}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center mx-auto"
            >
              <FaPlusCircle className="mr-2" />
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <h1 className="text-3xl font-bold mb-6 text-slate-900">Demo Trading</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600">Balance</span>
            <FaMoneyBillWave className="text-green-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">Rs. {Number(account?.current_balance || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600">Total Trades</span>
            <FaHashtag className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{trades.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600">Profit/Loss</span>
            <FaChartLine className={profitLoss >= 0 ? "text-green-500" : "text-red-500"} />
          </div>
          <p className={`text-2xl font-bold ${profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
            Rs. {profitLoss.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">Buy Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium mb-2">Symbol *</label>
              <input
                name="symbol"
                type="text"
                value={form.symbol}
                onChange={e => {
                  setForm(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }));
                  const q = allStocks.filter(s => s.symbol.toLowerCase().startsWith(e.target.value.toLowerCase()));
                  setSuggestions(q.slice(0, 5));
                  setShowSuggestions(e.target.value.length > 0);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="e.g. NABIL"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-lg">
                  {suggestions.map(s => (
                    <div
                      key={s.symbol}
                      className="px-4 py-2 hover:bg-slate-100:bg-slate-700 cursor-pointer"
                      onClick={() => {
                        setForm(prev => ({ ...prev, symbol: s.symbol, companyName: s.securityName }));
                        setShowSuggestions(false);
                      }}
                    >
                      <span className="font-medium">{s.symbol}</span>
                      <span className="text-slate-500 text-sm ml-2">{s.securityName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Company</label>
              <input name="companyName" type="text" value={form.companyName} onChange={e => setForm(prev => ({ ...prev, companyName: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Quantity *</label>
              <input name="quantity" type="number" min="1" value={form.quantity} onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Buy Price *</label>
              <input name="buyPrice" type="number" min="1" value={form.buyPrice} onChange={e => setForm(prev => ({ ...prev, buyPrice: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
          </div>
          <button type="submit" className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all flex items-center justify-center">
            <FaPlusCircle className="mr-2" /> Buy
          </button>
        </form>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">Trade History</h2>
          {trades.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No trades yet. Buy a stock to start demo trading.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Symbol</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Side</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Current</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">P/L</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade: Trade) => {
                    const stock = allStocks.find(s => s.symbol === trade.stock_symbol);
                    const currentPrice = stock?.lastTradedPrice || stock?.closingPrice || stock?.ltp || 0;
                    const pl = (currentPrice - trade.price) * trade.quantity;
                    return (
                      <tr key={trade.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 text-sm text-slate-600">{new Date(trade.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{trade.stock_symbol}</td>
                        <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">{trade.side}</span></td>
                        <td className="px-4 py-3 text-sm text-slate-600">{trade.quantity}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">Rs. {trade.price}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">Rs. {currentPrice}</td>
                        <td className={`px-4 py-3 text-sm font-medium ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{pl >= 0 ? '+' : ''}Rs. {pl.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDelete(trade.id)} className="p-2 text-red-500 hover:bg-red-50:bg-red-900/20 rounded-lg">
                            <FaTrash className="w-4 h-4" />
                          </button>
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
    </div>
  );
}
