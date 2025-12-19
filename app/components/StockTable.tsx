'use client';

import { useState } from 'react';
import StockDetailModal, { type Stock } from './Stockdetailmodal';

interface StockTableProps {
  stocks: Stock[];
  title: string;
  showName?: boolean;
  showTurnover?: boolean;
}

function formatCrore(num: number): string {
  return (num / 10000000).toFixed(2);
}

export default function StockTable({ stocks, title, showName = true, showTurnover = true }: StockTableProps) {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Symbol
                </th>
                {showName && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Name
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  LTP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Change
                </th>
                {showTurnover && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Turnover
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {stocks.length > 0 ? (
                stocks.map((stock) => (
                  <tr
                    key={stock.symbol}
                    onClick={() => setSelectedStock(stock)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      {stock.symbol}
                    </td>
                    {showName && (
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {stock.name}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                      Rs {stock.lastTradedPrice.toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${stock.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} font-semibold`}>
                      {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </td>
                    {showTurnover && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        Rs {formatCrore(stock.turnover)} Cr
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={showName && showTurnover ? 5 : showName || showTurnover ? 4 : 3} className="px-6 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                    No stock data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StockDetailModal stock={selectedStock} onClose={() => setSelectedStock(null)} />
    </>
  );
}
