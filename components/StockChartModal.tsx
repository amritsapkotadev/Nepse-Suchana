"use client";

import { useState, useEffect } from 'react';
// import TradingViewChart from './TradingViewChart';
import NepseChart from './NepseChart';
import { FaTimes, FaChartLine } from 'react-icons/fa';


interface StockChartModalProps {
  symbol: string;
  companyName: string;
}

export default function StockChartModal({ symbol, companyName }: StockChartModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  // For now, only NEPSE chart is supported
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        title="View Chart"
      >
        <FaChartLine className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-6xl h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {symbol} - {companyName}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">Live Trading Chart</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>

            {/* Chart */}
            <div className="h-[calc(80vh-120px)] flex items-center justify-center">
              <NepseChart symbol={symbol} companyName={companyName} height={600} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
