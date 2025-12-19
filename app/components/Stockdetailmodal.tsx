'use client';

interface Stock {
  symbol: string;
  securityName: string;
  lastTradedPrice?: number;
  change?: number;
  percentageChange?: number;
  totalTradeValue?: number;
  totalTradeQuantity?: number;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  previousClose?: number;
  sector: string;
  iconUrl?: string;
}

interface StockDetailModalProps {
  stock: Stock | null;
  onClose: () => void;
}

export default function StockDetailModal({ stock, onClose }: StockDetailModalProps) {
  if (!stock) return null;

  const isPositive = (stock.change ?? 0) >= 0;

  const formatNumber = (num?: number) => (num ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const formatCrore = (num?: number) => ((num ?? 0) / 10000000).toFixed(2);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex justify-between items-center p-6 rounded-t-2xl ${isPositive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <div className="flex items-center gap-3">
            {stock.iconUrl && <img src={stock.iconUrl} alt={stock.symbol} className="w-10 h-10 rounded-full" />}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{stock.symbol}</h2>
                <h2 className="text-sm text-slate-600 dark:text-slate-400">{stock.sector}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Price Overview */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Current Price</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white">Rs {formatNumber(stock.lastTradedPrice)}</p>
          </div>
          <div className={`text-2xl font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isPositive ? '+' : ''}{(stock.change ?? 0).toFixed(2)} ({isPositive ? '+' : ''}{(stock.percentageChange ?? 0).toFixed(2)}%)
          </div>
        </div>

        {/* Trading Stats */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Trade Value */}
          <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Trade Value</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">Rs {formatCrore(stock.totalTradeValue)} Cr</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Volume: {formatNumber(stock.totalTradeQuantity)}</p>
          </div>

          {/* High / Low */}
          <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Day High / Low</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">Rs {formatNumber(stock.highPrice)} / Rs {formatNumber(stock.lowPrice)}</p>
          </div>

          {/* Previous Close / Open */}
          <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Previous Close / Open</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">Rs {formatNumber(stock.previousClose)} / Rs {formatNumber(stock.openPrice)}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 rounded-b-2xl">
          <p className="text-xs text-slate-500 dark:text-slate-400">Data refreshed: {new Date().toLocaleTimeString()}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
