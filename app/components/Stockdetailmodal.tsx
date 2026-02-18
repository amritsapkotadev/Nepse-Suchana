'use client';

export interface Stock {
  symbol: string;
  name: string;
  lastTradedPrice: number;
  change: number;
  changePercent: number;
  turnover: number;
  sector?: string;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  previousClose?: number;
  totalTradeQuantity?: number;
  iconUrl?: string;
}

interface StockDetailModalProps {
  stock: Stock | null;
  onClose: () => void;
}

export default function StockDetailModal({ stock, onClose }: StockDetailModalProps) {
  if (!stock) return null;

  const isPositive = stock.change >= 0;

  const formatNumber = (num?: number) =>
    (num ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  const formatCrore = (num?: number) =>
    ((num ?? 0) / 1e7).toFixed(2);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isPositive
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center gap-4">
            {stock.iconUrl && (
              <img
                src={`https://sharepulse.qzz.io/${stock.iconUrl}`}
                alt={stock.symbol}
                className="w-12 h-12 rounded-full border border-slate-300"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {stock.symbol}
              </h2>
              <p className="text-sm text-slate-600">
                {stock.name}
              </p>
              {stock.sector && (
                <p className="text-xs text-slate-500 mt-1">
                  Sector: {stock.sector}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-2xl font-bold text-slate-400 hover:text-slate-700:text-slate-200"
          >
            ×
          </button>
        </div>

        {/* PRICE SECTION */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <p className="text-sm text-slate-500 mb-1">Current Price</p>
            <p className="text-4xl font-bold text-slate-900">
              Rs {formatNumber(stock.lastTradedPrice)}
            </p>
          </div>

          <div
            className={`text-right text-xl font-semibold ${
              isPositive
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {isPositive ? '+' : ''}
            {stock.change.toFixed(2)} <br />
            <span className="text-sm">
              ({isPositive ? '+' : ''}
              {stock.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          <StatCard
            label="Total Turnover"
            value={`Rs ${formatCrore(stock.turnover)} Cr`}
            sub={`Volume: ${formatNumber(stock.totalTradeQuantity)}`}
          />

          <StatCard
            label="Day High / Low"
            value={`Rs ${formatNumber(stock.highPrice)} / ${formatNumber(stock.lowPrice)}`}
          />

          <StatCard
            label="Prev Close / Open"
            value={`Rs ${formatNumber(stock.previousClose)} / ${formatNumber(stock.openPrice)}`}
          />
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500">
            Last updated: {new Date().toLocaleTimeString()}
          </p>

          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white text-sm hover:opacity-90 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- */
/* Reusable Stat Card */
/* ---------------------------------- */

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-xs text-slate-400">
          {sub}
        </p>
      )}
    </div>
  );
}
