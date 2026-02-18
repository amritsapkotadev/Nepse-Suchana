import Link from "next/link";
import { FaChartLine, FaMoneyBillWave, FaHashtag, FaEye } from "react-icons/fa";

export default function Dashboard() {
  // Demo data, replace with real portfolio data
  const totalInvestment = 250000;
  const currentValue = 275000;
  const profitLoss = currentValue - totalInvestment;
  const profitLossPercentage = parseFloat(((profitLoss / totalInvestment) * 100).toFixed(2));
  const totalShares = 1200;
  const companiesHeld = 8;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Investment */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <FaMoneyBillWave className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <FaEye className="p-2" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Investment</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">Rs. {totalInvestment.toLocaleString('en-NP', { minimumFractionDigits: 2 })}</p>
          </div>

          {/* Current Value */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700">
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 mb-4 w-fit">
              <FaChartLine className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Current Value</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">Rs. {currentValue.toLocaleString('en-NP', { minimumFractionDigits: 2 })}</p>
          </div>

          {/* Profit/Loss */}
          <div className={`bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border ${profitLoss >= 0 ? 'border-emerald-100 dark:border-emerald-900/50' : 'border-red-100 dark:border-red-900/50'}`}>
            <div className={`p-3 rounded-xl mb-4 w-fit ${profitLoss >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              <FaChartLine className={`w-6 h-6 ${profitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total P&L</p>
            <div className="flex items-center space-x-2">
              <p className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{profitLoss >= 0 ? '+' : ''}Rs. {Math.abs(profitLoss).toLocaleString('en-NP', { minimumFractionDigits: 2 })}</p>
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${profitLoss >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{profitLossPercentage >= 0 ? '+' : ''}{profitLossPercentage}%</span>
            </div>
          </div>

          {/* Total Shares */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700">
            <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 mb-4 w-fit">
              <FaHashtag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Shares Held</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalShares.toLocaleString()}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Across {companiesHeld} companies</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex space-x-4">
          <Link href="/portfolio" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">Go to Portfolio</Link>
          <Link href="/watchlist" className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">Go to Watchlist</Link>
        </div>
      </main>
    </div>
  );
}
