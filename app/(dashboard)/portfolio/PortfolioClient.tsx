"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { safeFetch } from "@/app/lib/api-utils";
import toast from "react-hot-toast";
import {
  FaSearch, FaPlusCircle, FaTrash, FaChartLine, FaInfoCircle,
  FaEdit, FaEye, FaEyeSlash, FaTimes, FaPercentage, FaArrowUp,
  FaArrowDown, FaGift, FaCalendarAlt, FaWallet, FaLayerGroup,
  FaEllipsisV, FaSync, FaLock, FaMoneyBillWave
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import debounce from "lodash/debounce";

interface Portfolio {
  id: number;
  name: string;
  description?: string;
  initial_balance: number;
  current_balance: number;
  created_at: string;
  holdings_count?: number;
  total_value?: number;
}

interface Stock {
  symbol: string;
  name: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}

interface PortfolioStock {
  id: string;
  symbol: string;
  companyName: string;
  quantity: number;
  buyPrice: number;
  transactionType: "Buy" | "Sell";
  dateAdded: Date;
  portfolio_id?: number;
}

interface Dividend {
  id: number;
  portfolio_id: number;
  stock_symbol: string;
  type: string;
  value: number;
  date: string;
  notes?: string;
  created_at?: Date;
}

interface Metrics {
  totalInvestment: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  holdingsCount: number;
}

interface PortfolioSelectorProps {
  portfolios: Portfolio[];
  selectedPortfolio: Portfolio | null;
  isLoadingPortfolios: boolean;
  showPortfolioMenu: number | null;
  metrics: Metrics | null;
  onSelectPortfolio: (p: Portfolio) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (p: Portfolio) => void;
  onOpenDeleteConfirm: (p: Portfolio) => void;
  onToggleMenu: (id: number | null) => void;
}

const PortfolioSelector = ({
  portfolios,
  selectedPortfolio,
  isLoadingPortfolios,
  showPortfolioMenu,
  metrics,
  onSelectPortfolio,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDeleteConfirm,
  onToggleMenu,
}: PortfolioSelectorProps) => (
  <div className="mb-8">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Your Portfolios</h2>
        <p className="text-gray-600">Manage and track multiple investment portfolios</p>
        <p className="text-xs text-gray-500 mt-1">Max 5 portfolios • Unique names only</p>
      </div>
      <button
        onClick={onOpenAddModal}
        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center shadow-md"
      >
        <FaPlusCircle className="mr-2" />
        New Portfolio
      </button>
    </div>

    {isLoadingPortfolios ? (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    ) : portfolios.length === 0 ? (
      <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
          <FaChartLine className="w-10 h-10 text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-3">No portfolios yet</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Create your first portfolio to start tracking your investments
        </p>
        <button
          onClick={onOpenAddModal}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all shadow-md"
        >
          Create First Portfolio
        </button>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolios.map(portfolio => (
          <motion.div
            key={portfolio.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 cursor-pointer group ${
              selectedPortfolio?.id === portfolio.id
                ? 'border-blue-500 shadow-xl'
                : 'border-transparent hover:border-blue-200'
            }`}
            onClick={() => onSelectPortfolio(portfolio)}
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMenu(showPortfolioMenu === portfolio.id ? null : portfolio.id);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FaEllipsisV className="text-gray-500" />
                </button>
                <AnimatePresence>
                  {showPortfolioMenu === portfolio.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 z-10"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEditModal(portfolio);
                          onToggleMenu(null);
                        }}
                        className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center rounded-t-xl"
                      >
                        <FaEdit className="mr-3 text-blue-500" />
                        Edit Portfolio
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDeleteConfirm(portfolio);
                          onToggleMenu(null);
                        }}
                        className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center rounded-b-xl"
                      >
                        <FaTrash className="mr-3" />
                        Delete Portfolio
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mr-4">
                  <FaChartLine className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{portfolio.name}</h3>
                  {portfolio.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">{portfolio.description}</p>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Initial Balance:</span>
                  <span className="font-bold text-gray-900">Rs. {portfolio.initial_balance.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Holdings:</span>
                  <span className="font-bold text-gray-900">{portfolio.holdings_count || 0} stocks</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">
                    {selectedPortfolio?.id === portfolio.id && metrics ? 'Current Value:' : 'Total Invested:'}
                  </span>
                  <span className="font-bold text-emerald-600">
                    {selectedPortfolio?.id === portfolio.id && metrics
                      ? `Rs. ${metrics.currentValue.toLocaleString('en-IN')}`
                      : `Rs. ${portfolio.total_value?.toLocaleString('en-IN') || '0'}`}
                  </span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Created {new Date(portfolio.created_at).toLocaleDateString()}</span>
                  {selectedPortfolio?.id === portfolio.id && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">Selected</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </div>
);

// ─── PortfolioDetails Props ───────────────────────────────────────────────────

interface PortfolioDetailsProps {
  selectedPortfolio: Portfolio;
  metrics: Metrics | null;
  filteredStocks: PortfolioStock[];
  dividends: Dividend[];
  isLoadingPortfolio: boolean;
  filterSymbol: string;
  showTotalValue: boolean;
  activeTab: "holdings" | "dividends";
  onFilterChange: (v: string) => void;
  onToggleTotalValue: () => void;
  onOpenStockModal: () => void;
  onOpenDividendModal: () => void;
  onRefresh: () => void;
  onDeleteStock: (id: string) => void;
  onDeleteDividend: (id: number) => void;
  onSetActiveTab: (tab: "holdings" | "dividends") => void;
}
const PortfolioDetails = ({
  selectedPortfolio,
  metrics,
  filteredStocks,
  dividends,
  isLoadingPortfolio,
  filterSymbol,
  showTotalValue,
  activeTab,
  onFilterChange,
  onToggleTotalValue,
  onOpenStockModal,
  onOpenDividendModal,
  onRefresh,
  onDeleteStock,
  onDeleteDividend,
  onSetActiveTab,
}: PortfolioDetailsProps) => (
  <div className="mb-8">
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <FaChartLine className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{selectedPortfolio.name}</h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Created: {new Date(selectedPortfolio.created_at).toLocaleDateString()}
              </span>
            </div>
            {selectedPortfolio.description && (
              <p className="text-gray-600 mt-1">{selectedPortfolio.description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onOpenStockModal}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center shadow-md"
        >
          <FaPlusCircle className="mr-2" />
          Add Stock
        </button>
        <button
          onClick={onRefresh}
          disabled={isLoadingPortfolio}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaSync className={`mr-2 ${isLoadingPortfolio ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
    </div>

    {/* Metrics Cards */}
    {metrics && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm"><FaWallet className="w-6 h-6" /></div>
            <button onClick={onToggleTotalValue} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              {showTotalValue ? <FaEye className="w-4 h-4" /> : <FaEyeSlash className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-sm font-medium opacity-90 mb-1">Total Investment</p>
          <p className="text-2xl font-bold">
            {showTotalValue ? `Rs. ${metrics.totalInvestment.toLocaleString('en-NP', { minimumFractionDigits: 2 })}` : '••••••'}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-5 text-white shadow-xl">
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm mb-4 w-fit"><FaChartLine className="w-6 h-6" /></div>
          <p className="text-sm font-medium opacity-90 mb-1">Current Value</p>
          <p className="text-2xl font-bold">Rs. {metrics.currentValue.toLocaleString('en-NP', { minimumFractionDigits: 2 })}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-xl">
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm mb-4 w-fit"><FaLayerGroup className="w-6 h-6" /></div>
          <p className="text-sm font-medium opacity-90 mb-1">Total Holdings</p>
          <p className="text-2xl font-bold">{metrics.holdingsCount}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className={`bg-gradient-to-br rounded-2xl p-5 text-white shadow-xl ${metrics.profitLoss >= 0 ? 'from-emerald-500 to-green-600' : 'from-red-500 to-orange-600'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              {metrics.profitLoss >= 0 ? <FaArrowUp className="w-6 h-6" /> : <FaArrowDown className="w-6 h-6" />}
            </div>
            <FaPercentage className="w-5 h-5 opacity-90" />
          </div>
          <p className="text-sm font-medium opacity-90 mb-1">Total P&L</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold">
              {metrics.profitLoss >= 0 ? '+' : ''}Rs. {Math.abs(metrics.profitLoss).toLocaleString('en-NP', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-white/20">
              {metrics.profitLossPercent.toFixed(2)}%
            </span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm"><FaGift className="w-6 h-6" /></div>
          </div>
          <p className="text-sm font-medium opacity-90 mb-1">Total Dividends</p>
          <p className="text-2xl font-bold">
            Rs. {dividends.reduce((sum, d) => sum + (d.type.toLowerCase() === 'cash' ? Number(d.value) : 0), 0)
              .toLocaleString('en-NP', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs opacity-75 mt-1">
            {dividends.filter(d => d.type.toLowerCase() === 'cash').length} cash,{' '}
            {dividends.filter(d => d.type.toLowerCase() === 'bonus').length} bonus,{' '}
            {dividends.filter(d => d.type.toLowerCase() === 'right').length} right
          </p>
        </motion.div>
      </div>
    )}

    {/* Tabs */}
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => onSetActiveTab('holdings')}
        className={`px-6 py-3 rounded-xl font-medium transition-all ${
          activeTab === 'holdings' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
        }`}
      >
        <FaChartLine className="inline mr-2" />
        Holdings ({filteredStocks.length})
      </button>
      <button
        onClick={() => onSetActiveTab('dividends')}
        className={`px-6 py-3 rounded-xl font-medium transition-all ${
          activeTab === 'dividends' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
        }`}
      >
        <FaGift className="inline mr-2" />
        Dividends ({dividends.length})
      </button>
    </div>

    {/* Holdings Table */}
    {activeTab === 'holdings' && (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Portfolio Holdings ({filteredStocks.length})</h3>
              <p className="text-sm text-gray-500 mt-1">All stocks in this portfolio</p>
            </div>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Filter stocks..."
                value={filterSymbol}
                onChange={(e) => onFilterChange(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all w-64"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Symbol', 'Company', 'Quantity', 'Buy Price', 'Type', 'Date Added', 'Actions'].map(col => (
                  <th key={col} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoadingPortfolio ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                </td></tr>
              ) : filteredStocks.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <FaChartLine className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-gray-500 font-medium mb-2">No stocks found</h4>
                  <p className="text-gray-400 text-sm mb-4">{filterSymbol ? 'Try changing your search term' : 'Add your first stock to get started'}</p>
                  {!filterSymbol && (
                    <button onClick={onOpenStockModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Add First Stock
                    </button>
                  )}
                </td></tr>
              ) : filteredStocks.map((stock) => (
                <motion.tr key={stock.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4"><span className="font-bold text-gray-900">{stock.symbol}</span></td>
                  <td className="px-6 py-4"><div className="text-sm text-gray-900">{stock.companyName}</div></td>
                  <td className="px-6 py-4"><span className="font-medium text-gray-900">{stock.quantity}</span></td>
                  <td className="px-6 py-4"><span className="font-medium text-gray-900">Rs. {stock.buyPrice.toFixed(2)}</span></td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      stock.transactionType === 'Buy' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>{stock.transactionType}</span>
                  </td>
                  <td className="px-6 py-4"><div className="text-sm text-gray-500">{stock.dateAdded.toLocaleDateString()}</div></td>
                  <td className="px-6 py-4">
                    <button onClick={() => onDeleteStock(stock.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors" title="Delete Stock">
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {/* Dividends Table */}
    {activeTab === 'dividends' && (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Dividend History ({dividends.length})</h3>
              <p className="text-sm text-gray-500 mt-1">Record dividends, bonus shares, and right shares</p>
            </div>
            <button onClick={onOpenDividendModal}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center">
              <FaPlusCircle className="mr-2" />Add Dividend
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Date', 'Stock', 'Type', 'Value', 'Notes', 'Actions'].map(col => (
                  <th key={col} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dividends.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <FaGift className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-gray-500 font-medium mb-2">No dividends recorded</h4>
                  <p className="text-gray-400 text-sm mb-4">Record cash dividends, bonus shares, or right shares</p>
                  <button onClick={onOpenDividendModal} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Add First Dividend
                  </button>
                </td></tr>
              ) : dividends.map((dividend) => (
                <motion.tr key={dividend.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4"><span className="text-sm text-gray-900">{new Date(dividend.date).toLocaleDateString()}</span></td>
                  <td className="px-6 py-4"><span className="font-bold text-gray-900">{dividend.stock_symbol}</span></td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      dividend.type.toLowerCase() === 'cash' ? 'bg-green-100 text-green-700'
                      : dividend.type.toLowerCase() === 'bonus' ? 'bg-blue-100 text-blue-700'
                      : 'bg-orange-100 text-orange-700'
                    }`}>{dividend.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">
                      {dividend.type.toLowerCase() === 'cash' ? `Rs. ${Number(dividend.value).toFixed(2)}` : `${dividend.value} shares`}
                    </span>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-gray-500">{dividend.notes || '-'}</span></td>
                  <td className="px-6 py-4">
                    <button onClick={() => onDeleteDividend(dividend.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors" title="Delete Dividend">
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);

export default function MultiPortfolioTracker() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [portfolioStocks, setPortfolioStocks] = useState<PortfolioStock[]>([]);
  const [isLoading, setIsLoading] = useState({ portfolios: false, portfolio: false });
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [allStocks, setAllStocks] = useState<Stock[]>([]);

  // Form states
  const [form, setForm] = useState({ symbol: "", companyName: "", quantity: "", buyPrice: "", transactionType: "Buy" as "Buy" | "Sell" });
  const [portfolioForm, setPortfolioForm] = useState({ name: "", description: "", initial_balance: "" });
  const [editPortfolioForm, setEditPortfolioForm] = useState({ name: "", description: "", initial_balance: "" });
  const [dividendForm, setDividendForm] = useState({
    stock_symbol: "", type: "Cash" as "Cash" | "Bonus" | "Right",
    value: "", date: new Date().toISOString().split('T')[0], notes: ""
  });

  // UI states
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"holdings" | "dividends">("holdings");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDividendModal, setShowDividendModal] = useState(false);
  const [stockSuggestions, setStockSuggestions] = useState<Stock[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTotalValue, setShowTotalValue] = useState(true);
  const [filterSymbol, setFilterSymbol] = useState("");
  const [showPortfolioMenu, setShowPortfolioMenu] = useState<number | null>(null);
  const [dividendStockSuggestions, setDividendStockSuggestions] = useState<PortfolioStock[]>([]);
  const [showDividendSuggestions, setShowDividendSuggestions] = useState(false);

  // Refs — avoid stale closures without re-creating callbacks
  const allStocksRef = useRef<Stock[]>([]);
  const selectedPortfolioRef = useRef<Portfolio | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep ref in sync
  selectedPortfolioRef.current = selectedPortfolio;

  // Lock body scroll when stock modal open
  useEffect(() => {
    document.body.style.overflow = showStockModal ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showStockModal]);

  const fetchPortfolioData = useCallback(async (portfolioId: number) => {
    try {
      setIsLoading(prev => ({ ...prev, portfolio: true }));
      setError("");
      const data = await safeFetch<any[]>(`/api/portfolio-holdings?portfolio_id=${portfolioId}`);
      setPortfolioStocks(data.map((stock: any) => ({
        id: stock.id,
        symbol: stock.stock_symbol,
        companyName: stock.company_name || "",
        quantity: stock.quantity,
        buyPrice: Number(stock.average_price),
        transactionType: stock.transaction_type || "Buy",
        dateAdded: new Date(stock.created_at),
        portfolio_id: stock.portfolio_id
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio data');
    } finally {
      setIsLoading(prev => ({ ...prev, portfolio: false }));
    }
  }, []);

  const fetchDividends = useCallback(async (portfolioId: number) => {
    try {
      const data = await safeFetch<Dividend[]>(`/api/dividends?portfolio_id=${portfolioId}`);
      setDividends(data);
    } catch (err) {
      console.error('Failed to fetch dividends:', err);
      setDividends([]);
    }
  }, []);

  // stable — uses ref instead of closing over selectedPortfolio
  const fetchPortfolios = useCallback(async (force = false) => {
    try {
      setIsLoading(prev => ({ ...prev, portfolios: true }));
      setError("");
      const data = await safeFetch<Portfolio[]>('/api/portfolios');
      setPortfolios(data);
      if (data.length > 0) {
        const current = selectedPortfolioRef.current;
        const stillValid = current && data.some(p => p.id === current.id);
        const toSelect = stillValid ? current! : data[0];
        setSelectedPortfolio(toSelect);
        await fetchPortfolioData(toSelect.id);
        await fetchDividends(toSelect.id);
      } else {
        setSelectedPortfolio(null);
        setPortfolioStocks([]);
        setDividends([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolios');
    } finally {
      setIsLoading(prev => ({ ...prev, portfolios: false }));
    }
  }, [fetchPortfolioData, fetchDividends]); // no selectedPortfolio dep!

  const fetchAllStocks = useCallback(async () => {
    try {
      const response = await fetch('/api/stocks');
      const data = await response.json();
      let stocks: Stock[] = [];
      if (Array.isArray(data)) stocks = data;
      else if (data?.stocks) stocks = data.stocks;
      else if (data?.data) stocks = data.data;
      else if (data?.liveCompanyData) {
        stocks = data.liveCompanyData.map((c: any) => ({
          symbol: c.symbol, name: c.securityName,
          currentPrice: c.lastTradedPrice, change: c.change, changePercent: c.percentageChange
        }));
      }
      allStocksRef.current = stocks;
      setAllStocks(stocks);
    } catch (err) {
      console.error('Failed to fetch stocks:', err);
    }
  }, []);

  // Mount effect — stable deps, no risk of loop
  useEffect(() => {
    fetchAllStocks();
    fetchPortfolios(true);
  }, [fetchAllStocks, fetchPortfolios]);

  // Fetch holdings when selected portfolio changes
  useEffect(() => {
    if (selectedPortfolio?.id) {
      fetchPortfolioData(selectedPortfolio.id);
      fetchDividends(selectedPortfolio.id);
    }
  }, [selectedPortfolio?.id, fetchPortfolioData, fetchDividends]);

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  const handleCreatePortfolio = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");
    try {
      const newPortfolio = await safeFetch<Portfolio>('/api/portfolios', {
        method: 'POST',
        body: JSON.stringify({
          name: portfolioForm.name,
          description: portfolioForm.description,
          initial_balance: parseFloat(portfolioForm.initial_balance) || 0
        })
      });
      const withDefaults = { ...newPortfolio, holdings_count: 0, total_value: 0 };
      setPortfolios(prev => [...prev, withDefaults]);
      toast.success('Portfolio created successfully!');
      setShowAddModal(false);
      setPortfolioForm({ name: "", description: "", initial_balance: "" });
      setSelectedPortfolio(withDefaults);
      await fetchPortfolioData(newPortfolio.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create portfolio');
    } finally {
      setIsCreating(false);
    }
  }, [portfolioForm, fetchPortfolioData]);

  const handleUpdatePortfolio = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const current = selectedPortfolioRef.current;
    if (!current) return;
    setIsCreating(true);
    setError("");
    try {
      const updatedPortfolio = await safeFetch<Portfolio>(`/api/portfolios/${current.id}`, {
        method: 'PUT',
        body: JSON.stringify(editPortfolioForm)
      });
      const merged = {
        ...current, ...updatedPortfolio,
        holdings_count: current.holdings_count,
        total_value: current.total_value,
        initial_balance: updatedPortfolio.initial_balance ?? current.initial_balance
      };
      setPortfolios(prev => prev.map(p => p.id === current.id ? merged : p));
      setSelectedPortfolio(merged);
      toast.success('Portfolio updated successfully!');
      setShowEditModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update portfolio');
    } finally {
      setIsCreating(false);
    }
  }, [editPortfolioForm]);

  const handleDeletePortfolio = useCallback(async () => {
    const current = selectedPortfolioRef.current;
    if (!current) return;
    setIsDeleting(true);
    setError("");
    try {
      await safeFetch(`/api/portfolios/${current.id}`, { method: 'DELETE' });
      setPortfolios(prev => {
        const remaining = prev.filter(p => p.id !== current.id);
        if (remaining.length > 0) {
          setSelectedPortfolio(remaining[0]);
          fetchPortfolioData(remaining[0].id);
          fetchDividends(remaining[0].id);
        } else {
          setSelectedPortfolio(null);
          setPortfolioStocks([]);
          setDividends([]);
        }
        return remaining;
      });
      toast.success('Portfolio deleted successfully!');
      setShowDeleteConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete portfolio');
    } finally {
      setIsDeleting(false);
    }
  }, [fetchPortfolioData, fetchDividends]);

  const handleAddStock = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const current = selectedPortfolioRef.current;
    if (!current) { setError("Please select a portfolio first"); return; }
    setError("");
    const quantity = parseFloat(form.quantity);
    const buyPrice = parseFloat(form.buyPrice);
    if (!form.symbol || !form.companyName || isNaN(quantity) || isNaN(buyPrice)) {
      setError("All fields are required with valid numbers");
      return;
    }
    const loadingToast = toast.loading('Adding stock...');
    try {
      await safeFetch('/api/portfolio-holdings', {
        method: 'POST',
        body: JSON.stringify({
          portfolio_id: current.id,
          stock_symbol: form.symbol.toUpperCase(),
          quantity, average_price: buyPrice,
          transaction_type: form.transactionType
        })
      });
      toast.dismiss(loadingToast);
      toast.success(`${form.symbol.toUpperCase()} added successfully!`);
      setShowStockModal(false);
      setForm({ symbol: "", companyName: "", quantity: "", buyPrice: "", transactionType: "Buy" });
      setStockSuggestions([]);
      setShowSuggestions(false);
      setSearchQuery("");
      await fetchPortfolioData(current.id);
      await fetchPortfolios(true);
    } catch (err) {
      toast.dismiss(loadingToast);
      const msg = err instanceof Error ? err.message : 'Failed to add stock';
      setError(msg);
      toast.error(msg);
    }
  }, [form, fetchPortfolioData, fetchPortfolios]);

  const handleDeleteStock = useCallback(async (stockId: string) => {
    const current = selectedPortfolioRef.current;
    try {
      await safeFetch(`/api/portfolio-holdings/${stockId}`, { method: 'DELETE' });
      setPortfolioStocks(prev => prev.filter(s => s.id !== stockId));
      if (current) {
        setPortfolios(prev => prev.map(p =>
          p.id === current.id ? { ...p, holdings_count: Math.max(0, (p.holdings_count || 1) - 1) } : p
        ));
      }
      toast.success('Stock removed successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete stock');
    }
  }, []);

  const handleAddDividend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const current = selectedPortfolioRef.current;
    if (!current) return;
    const loadingToast = toast.loading('Adding dividend...');
    try {
      await safeFetch('/api/dividends', {
        method: 'POST',
        body: JSON.stringify({
          portfolio_id: current.id,
          stock_symbol: dividendForm.stock_symbol.toUpperCase(),
          type: dividendForm.type,
          value: parseFloat(dividendForm.value) || 0,
          date: dividendForm.date,
          notes: dividendForm.notes || null
        })
      });
      toast.dismiss(loadingToast);
      toast.success(`${dividendForm.type} dividend added successfully!`);
      setShowDividendModal(false);
      setDividendForm({ stock_symbol: "", type: "Cash", value: "", date: new Date().toISOString().split('T')[0], notes: "" });
      await fetchDividends(current.id);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err instanceof Error ? err.message : 'Failed to add dividend');
    }
  }, [dividendForm, fetchDividends]);

  const handleDeleteDividend = useCallback(async (dividendId: number) => {
    const loadingToast = toast.loading('Deleting dividend...');
    try {
      await safeFetch(`/api/dividends?id=${dividendId}`, { method: 'DELETE' });
      toast.dismiss(loadingToast);
      setDividends(prev => prev.filter(d => d.id !== dividendId));
      toast.success('Dividend deleted successfully!');
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err instanceof Error ? err.message : 'Failed to delete dividend');
    }
  }, []);

  const debouncedSearchRef = useRef(
    debounce((query: string) => {
      const stocks = allStocksRef.current;
      const lowerQuery = query.toLowerCase().trim();
      setStockSuggestions(
        stocks.filter(s =>
          !lowerQuery ||
          s.symbol.toLowerCase().includes(lowerQuery) ||
          s.name.toLowerCase().includes(lowerQuery)
        ).slice(0, 10)
      );
      setSearchQuery(query);
    }, 150)
  );

  const handleStockSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, symbol: value }));
    debouncedSearchRef.current(value);
  }, []);

  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query) return text;
    return text.replace(new RegExp(`(${query})`, 'ig'), '<mark>$1</mark>');
  }, []);

  const selectSuggestion = useCallback((stock: Stock) => {
    setForm(prev => ({ ...prev, symbol: stock.symbol, companyName: stock.name, buyPrice: (stock.currentPrice || 0).toString() }));
    setStockSuggestions([]);
    setSearchQuery("");
    setShowSuggestions(false);
  }, []);

  const handleDividendStockSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value.toUpperCase();
    setDividendForm(prev => ({ ...prev, stock_symbol: q }));
    if (q.length > 0) {
      setDividendStockSuggestions(
        portfolioStocks.filter(s => s.symbol.toUpperCase().includes(q) || s.companyName.toUpperCase().includes(q))
      );
      setShowDividendSuggestions(true);
    } else {
      setDividendStockSuggestions([]);
      setShowDividendSuggestions(false);
    }
  }, [portfolioStocks]);

  const selectDividendStock = useCallback((stock: PortfolioStock) => {
    setDividendForm(prev => ({ ...prev, stock_symbol: stock.symbol }));
    setShowDividendSuggestions(false);
    setDividendStockSuggestions([]);
  }, []);

  // ─── Derived Values (memoized) ──────────────────────────────────────────────

  const metrics = useMemo<Metrics | null>(() => {
    if (!selectedPortfolio) return null;
    const buys = portfolioStocks.filter(s => s.transactionType === "Buy");
    const sells = portfolioStocks.filter(s => s.transactionType === "Sell");
    const totalInvestment = buys.reduce((sum, s) => sum + s.quantity * s.buyPrice, 0);
    const totalSales = sells.reduce((sum, s) => sum + s.quantity * s.buyPrice, 0);
    const netInvestment = totalInvestment - totalSales;
    const currentValue = buys.reduce((sum, stock) => {
      const live = allStocks.find(s => s.symbol === stock.symbol);
      return sum + stock.quantity * (live?.currentPrice || stock.buyPrice);
    }, 0);
    const profitLoss = currentValue - netInvestment;
    return {
      totalInvestment: netInvestment, currentValue, profitLoss,
      profitLossPercent: netInvestment > 0 ? (profitLoss / netInvestment) * 100 : 0,
      holdingsCount: buys.length
    };
  }, [portfolioStocks, selectedPortfolio, allStocks]);

  const filteredStocks = useMemo(() =>
    portfolioStocks.filter(s =>
      s.symbol?.toLowerCase().includes(filterSymbol.toLowerCase()) ||
      s.companyName?.toLowerCase().includes(filterSymbol.toLowerCase())
    ), [portfolioStocks, filterSymbol]
  );

  // ─── Stable Callbacks for sub-components ────────────────────────────────────

  const handleSelectPortfolio = useCallback((p: Portfolio) => {
    setSelectedPortfolio(p);
    fetchPortfolioData(p.id);
    fetchDividends(p.id);
  }, [fetchPortfolioData, fetchDividends]);

  const handleOpenEditModal = useCallback((p: Portfolio) => {
    setEditPortfolioForm({ name: p.name, description: p.description || "", initial_balance: p.initial_balance?.toString() || "" });
    setSelectedPortfolio(p);
    setShowEditModal(true);
  }, []);

  const handleOpenDeleteConfirm = useCallback((p: Portfolio) => {
    setSelectedPortfolio(p);
    setShowDeleteConfirm(true);
  }, []);

  const handleToggleMenu = useCallback((id: number | null) => setShowPortfolioMenu(id), []);
  const handleToggleTotalValue = useCallback(() => setShowTotalValue(v => !v), []);
  const handleFilterChange = useCallback((v: string) => setFilterSymbol(v), []);
  const handleOpenStockModal = useCallback(() => setShowStockModal(true), []);
  const handleOpenDividendModal = useCallback(() => setShowDividendModal(true), []);
  const handleSetActiveTab = useCallback((tab: "holdings" | "dividends") => setActiveTab(tab), []);
  const handleRefresh = useCallback(() => {
    const current = selectedPortfolioRef.current;
    if (current) fetchPortfolioData(current.id);
  }, [fetchPortfolioData]);
  const clearMessages = useCallback(() => setError(""), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6">
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center">
                  <FaInfoCircle className="text-red-500 mr-3 flex-shrink-0" />
                  <p className="text-red-600 font-medium">{error}</p>
                </div>
                <button onClick={clearMessages} className="text-red-500 hover:text-red-700"><FaTimes /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <PortfolioSelector
          portfolios={portfolios}
          selectedPortfolio={selectedPortfolio}
          isLoadingPortfolios={isLoading.portfolios}
          showPortfolioMenu={showPortfolioMenu}
          metrics={metrics}
          onSelectPortfolio={handleSelectPortfolio}
          onOpenAddModal={() => setShowAddModal(true)}
          onOpenEditModal={handleOpenEditModal}
          onOpenDeleteConfirm={handleOpenDeleteConfirm}
          onToggleMenu={handleToggleMenu}
        />

        {selectedPortfolio && (
          <PortfolioDetails
            selectedPortfolio={selectedPortfolio}
            metrics={metrics}
            filteredStocks={filteredStocks}
            dividends={dividends}
            isLoadingPortfolio={isLoading.portfolio}
            filterSymbol={filterSymbol}
            showTotalValue={showTotalValue}
            activeTab={activeTab}
            onFilterChange={handleFilterChange}
            onToggleTotalValue={handleToggleTotalValue}
            onOpenStockModal={handleOpenStockModal}
            onOpenDividendModal={handleOpenDividendModal}
            onRefresh={handleRefresh}
            onDeleteStock={handleDeleteStock}
            onDeleteDividend={handleDeleteDividend}
            onSetActiveTab={handleSetActiveTab}
          />
        )}
      </main>

      {/* ── Add Portfolio Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Create New Portfolio</h3>
                  <p className="text-sm text-gray-500 mt-1">Maximum 5 portfolios per user</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FaTimes className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleCreatePortfolio} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio Name *</label>
                  <input type="text" value={portfolioForm.name}
                    onChange={e => setPortfolioForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="e.g., Retirement Fund" required maxLength={50} />
                  <p className="text-xs text-gray-500 mt-1">Must be unique among your portfolios</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <textarea value={portfolioForm.description}
                    onChange={e => setPortfolioForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    rows={3} maxLength={200} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Initial Balance (Rs.)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rs.</span>
                    <input type="number" step="0.01" min="0" value={portfolioForm.initial_balance}
                      onChange={e => setPortfolioForm(prev => ({ ...prev, initial_balance: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="0.00" />
                  </div>
                </div>
                {portfolios.length >= 5 && (
                  <div className="p-3 bg-amber-50 border-2 border-amber-200 rounded-xl">
                    <p className="text-amber-600 text-sm">⚠️ You have reached the maximum limit of 5 portfolios</p>
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  <button type="submit" disabled={isCreating || portfolios.length >= 5}
                    className={`flex-1 px-6 py-3 font-medium rounded-xl transition-all flex items-center justify-center ${
                      isCreating || portfolios.length >= 5
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg shadow-md'
                    }`}>
                    {isCreating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Creating...</> : <><FaPlusCircle className="mr-2" />Create Portfolio</>}
                  </button>
                  <button type="button" onClick={() => { setShowAddModal(false); setPortfolioForm({ name: "", description: "", initial_balance: "" }); }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit Portfolio Modal ── */}
      <AnimatePresence>
        {showEditModal && selectedPortfolio && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowEditModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Edit Portfolio</h3>
                  <p className="text-sm text-gray-500 mt-1">Update portfolio details</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FaTimes className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleUpdatePortfolio} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio Name *</label>
                  <input type="text" value={editPortfolioForm.name}
                    onChange={e => setEditPortfolioForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required maxLength={50} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea value={editPortfolioForm.description}
                    onChange={e => setEditPortfolioForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    rows={3} maxLength={200} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Initial Balance</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rs.</span>
                    <input type="number" value={editPortfolioForm.initial_balance}
                      onChange={e => setEditPortfolioForm(prev => ({ ...prev, initial_balance: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      min="0" step="0.01" />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button type="submit" disabled={isCreating}
                    className={`flex-1 px-6 py-3 font-medium rounded-xl transition-all flex items-center justify-center ${
                      isCreating ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg shadow-md'
                    }`}>
                    {isCreating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Updating...</> : <><FaEdit className="mr-2" />Update Portfolio</>}
                  </button>
                  <button type="button" onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {showDeleteConfirm && selectedPortfolio && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteConfirm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">Delete Portfolio</h3>
              </div>
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                  <FaTrash className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-gray-700 mb-2">Are you sure you want to delete</p>
                <p className="text-xl font-bold text-gray-900 mb-2">"{selectedPortfolio.name}"?</p>
                <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={handleDeletePortfolio} disabled={isDeleting}
                    className={`flex-1 px-6 py-3 font-medium rounded-xl transition-all flex items-center justify-center ${
                      isDeleting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-red-500 to-orange-600 text-white hover:shadow-lg shadow-md'
                    }`}>
                    {isDeleting ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Deleting...</> : <><FaTrash className="mr-2" />Delete</>}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Stock Modal ── */}
      <AnimatePresence>
        {showStockModal && selectedPortfolio && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => { setShowStockModal(false); setForm({ symbol: "", companyName: "", quantity: "", buyPrice: "", transactionType: "Buy" }); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Add Stock</h3>
                  <p className="text-sm text-gray-500 mt-1">Add a buy/sell transaction</p>
                </div>
                <button onClick={() => setShowStockModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FaTimes className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleAddStock} className="p-6 space-y-5">
                {/* Symbol */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Symbol *</label>
                  <input ref={inputRef} type="text" value={form.symbol} onChange={handleStockSearch}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Search symbol..." required />
                  <AnimatePresence>
                    {showSuggestions && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                        <div className="max-h-64 overflow-y-auto">
                          {stockSuggestions.length === 0
                            ? <div className="px-4 py-3 text-gray-500">No results found</div>
                            : stockSuggestions.map(stock => (
                              <div key={stock.symbol}
                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 border-gray-100 transition-colors"
                                onClick={() => { selectSuggestion(stock); setShowSuggestions(false); }}>
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="font-bold text-blue-600" dangerouslySetInnerHTML={{ __html: highlightMatch(stock.symbol, searchQuery) }} />
                                    <p className="text-sm text-gray-600 truncate" dangerouslySetInnerHTML={{ __html: highlightMatch(stock.name, searchQuery) }} />
                                  </div>
                                  {stock.currentPrice && <span className="font-bold text-gray-900">Rs. {stock.currentPrice.toFixed(2)}</span>}
                                </div>
                              </div>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                  <input type="text" value={form.companyName}
                    onChange={e => setForm(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter company name" required />
                </div>
                {/* Qty & Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                    <input type="number" min="1" step="1" value={form.quantity}
                      onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="0" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price per Share *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rs.</span>
                      <input type="number" step="0.01" min="0" value={form.buyPrice}
                        onChange={e => setForm(prev => ({ ...prev, buyPrice: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="0.00" required />
                    </div>
                  </div>
                </div>
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Transaction Type *</label>
                  <div className="grid grid-cols-2 gap-4">
                    {(['Buy', 'Sell'] as const).map(type => (
                      <button key={type} type="button" onClick={() => setForm(prev => ({ ...prev, transactionType: type }))}
                        className={`px-4 py-4 rounded-xl font-medium transition-all flex items-center justify-center space-x-3 ${
                          form.transactionType === type
                            ? type === 'Buy' ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg' : 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        {type === 'Buy' ? <FaPlusCircle /> : <div className="w-4 h-0.5 bg-current" />}
                        <span>{type}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all flex items-center justify-center shadow-md">
                    <FaPlusCircle className="mr-2" />Add Stock
                  </button>
                  <button type="button" onClick={() => setShowStockModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Dividend Modal ── */}
      <AnimatePresence>
        {showDividendModal && selectedPortfolio && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDividendModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Record Dividend</h3>
                  <p className="text-sm text-gray-500 mt-1">Add cash dividend, bonus shares, or right shares</p>
                </div>
                <button onClick={() => setShowDividendModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FaTimes className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleAddDividend} className="p-6 space-y-4">
                {/* Stock symbol with suggestions */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Symbol *</label>
                  <input type="text" value={dividendForm.stock_symbol} onChange={handleDividendStockSearch}
                    onFocus={() => { if (portfolioStocks.length > 0) { setDividendStockSuggestions(portfolioStocks); setShowDividendSuggestions(true); } }}
                    onBlur={() => setTimeout(() => setShowDividendSuggestions(false), 200)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="Click to see available stocks..." required />
                  <AnimatePresence>
                    {showDividendSuggestions && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          {dividendStockSuggestions.length === 0
                            ? <div className="px-4 py-3 text-gray-500 text-sm">No stocks in portfolio</div>
                            : dividendStockSuggestions.map(stock => (
                              <div key={stock.id}
                                className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b last:border-b-0 border-gray-100 transition-colors"
                                onMouseDown={e => { e.preventDefault(); selectDividendStock(stock); }}>
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="font-bold text-purple-600">{stock.symbol}</span>
                                    <p className="text-sm text-gray-600 truncate">{stock.companyName}</p>
                                  </div>
                                  <span className="text-xs text-gray-500">{stock.quantity} shares</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dividend Type *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { type: 'Cash', icon: <FaMoneyBillWave className="w-4 h-4" />, colors: 'from-green-500 to-emerald-600' },
                      { type: 'Bonus', icon: <FaGift className="w-4 h-4" />, colors: 'from-blue-500 to-indigo-600' },
                      { type: 'Right', icon: <FaChartLine className="w-4 h-4" />, colors: 'from-orange-500 to-amber-600' }
                    ] as const).map(({ type, icon, colors }) => (
                      <button key={type} type="button" onClick={() => setDividendForm(prev => ({ ...prev, type }))}
                        className={`px-3 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm ${
                          dividendForm.type === type ? `bg-gradient-to-r ${colors} text-white shadow-lg` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        {icon}<span>{type}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {dividendForm.type === 'Cash' ? 'Amount (Rs.) *' : 'Shares *'}
                  </label>
                  <input type="number" value={dividendForm.value}
                    onChange={e => setDividendForm(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder={dividendForm.type === 'Cash' ? 'Enter amount' : 'Enter shares'}
                    min="0" step={dividendForm.type === 'Cash' ? '0.01' : '1'} required />
                </div>
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input type="date" value={dividendForm.date}
                    onChange={e => setDividendForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    required />
                </div>
                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea value={dividendForm.notes}
                    onChange={e => setDividendForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="Any additional information..." rows={2} />
                </div>
                <div className="flex gap-3 mt-6">
                  <button type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all flex items-center justify-center shadow-md">
                    <FaGift className="mr-2" />Record Dividend
                  </button>
                  <button type="button" onClick={() => setShowDividendModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}