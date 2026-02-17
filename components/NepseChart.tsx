"use client";

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, ColorType } from 'lightweight-charts';
import { FaArrowUp, FaArrowDown, FaCalendarAlt, FaChartLine, FaSync } from 'react-icons/fa';
import type { ChartData } from '@/utils/nepseDataGenerator';

interface NepseChartProps {
  symbol: string;
  companyName?: string;
  height?: number;
  showControls?: boolean;
}

const PERIODS = [
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: '1Y', value: '1Y' },
  { label: 'All', value: 'ALL' },
];

const INTERVALS = [
  { label: '1 Min', value: '1' },
  { label: '5 Min', value: '5' },
  { label: '15 Min', value: '15' },
  { label: '30 Min', value: '30' },
  { label: '1 Hour', value: '60' },
  { label: '1 Day', value: 'D' },
  { label: '1 Week', value: 'W' },
];

export default function NepseChart({ 
  symbol, 
  companyName, 
  height = 500,
  showControls = true 
}: NepseChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  
  const [period, setPeriod] = useState('1M');
  const [interval, setInterval] = useState('D');
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('candlestick');
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Fetch chart data
  const fetchChartData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/nepse-chart?symbol=${symbol}&period=${period}&interval=${interval}`
      );
      if (!response.ok) throw new Error('Failed to fetch chart data');
      const chartData = await response.json();
      setData(chartData);
      if (candlestickSeriesRef.current && chartData.length > 0) {
        candlestickSeriesRef.current.setData(formatChartData(chartData, chartType));
      }
    } catch (err) {
      setError('Unable to load chart data. Please try again.');
      console.error('Error fetching chart:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize chart
  useEffect(() => {
    fetchChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, period, interval]);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    const chartOptions = {
      layout: {
        background: { type: ColorType.Solid, color: theme === 'dark' ? '#0f172a' : '#ffffff' },
        textColor: theme === 'dark' ? '#d1d5db' : '#374151',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: theme === 'dark' ? '#1e293b' : '#e5e7eb', style: 1 },
        horzLines: { color: theme === 'dark' ? '#1e293b' : '#e5e7eb', style: 1 },
      },
      width: chartContainerRef.current.clientWidth,
      height: height - 40,
      rightPriceScale: {
        borderColor: theme === 'dark' ? '#334155' : '#cbd5e1',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      leftPriceScale: { visible: false },
      timeScale: {
        borderColor: theme === 'dark' ? '#334155' : '#cbd5e1',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 6,
        minBarSpacing: 3,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: theme === 'dark' ? '#4f46e5' : '#6366f1',
          width: 1,
          style: 3,
          labelBackgroundColor: theme === 'dark' ? '#4f46e5' : '#6366f1',
        },
        horzLine: {
          color: theme === 'dark' ? '#4f46e5' : '#6366f1',
          width: 1,
          style: 3,
          labelBackgroundColor: theme === 'dark' ? '#4f46e5' : '#6366f1',
        },
      },
      localization: {
        priceFormatter: (price: number) => `Rs. ${price.toLocaleString('en-NP')}`,
      },
    };
    const chart = createChart(chartContainerRef.current, chartOptions as any);
    chartRef.current = chart;
    chart.applyOptions({
      watermark: {
        color: theme === 'dark' ? 'rgba(100, 116, 139, 0.2)' : 'rgba(148, 163, 184, 0.2)',
        visible: true,
        text: `NEPSE: ${symbol}`,
        fontSize: 48,
        horzAlign: 'center',
        vertAlign: 'center',
      },
    } as any);
    let series;
    if (chartType === 'candlestick') {
      series = (chart as any).addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
        priceLineVisible: true,
        priceLineWidth: 1,
        priceLineColor: theme === 'dark' ? '#475569' : '#cbd5e1',
      });
      candlestickSeriesRef.current = series;
    } else if (chartType === 'line') {
      series = (chart as any).addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
        priceLineVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });
      candlestickSeriesRef.current = series as any;
    }
    if (series && data.length > 0) {
      series.setData(formatChartData(data, chartType));
    }
    // Add volume series
    const volumeSeries = (chart as any).addHistogramSeries({
      color: '#6b7280',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      priceLineVisible: false,
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;
    if (data.length > 0) {
      const volumeData = data.map(item => ({
        time: item.time,
        value: item.volume,
        color: item.close >= item.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)',
      }));
      volumeSeries.setData(volumeData);
    }
    // Add price line markers
    if (data.length > 0) {
      const latestPrice = data[data.length - 1].close;
      chart.applyOptions({
        watermark: {
          priceLine: {
            price: latestPrice,
            color: '#f59e0b',
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: 'Current',
          },
        },
      } as any);
    }
    // Handle resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, chartType, theme, height]);

  // Format data for different chart types
  const formatChartData = (chartData: ChartData[], type: string) => {
    return chartData.map(item => ({
      time: item.time,
      ...(type === 'candlestick' ? {
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      } : {
        value: item.close,
      }),
    }));
  };

  // Calculate statistics
  const calculateStats = () => {
    if (data.length === 0) return null;
    const latest = data[data.length - 1];
    const first = data[0];
    const change = latest.close - first.close;
    const changePercent = (change / first.close) * 100;
    const high = Math.max(...data.map(d => d.high));
    const low = Math.min(...data.map(d => d.low));
    const avgVolume = data.reduce((sum, d) => sum + d.volume, 0) / data.length;
    return {
      current: latest.close,
      change,
      changePercent,
      high,
      low,
      avgVolume,
    };
  };
  const stats = calculateStats();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <FaChartLine className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {symbol} Chart
                </h2>
                {companyName && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {companyName}
                  </p>
                )}
              </div>
            </div>
          </div>
          {/* Stats */}
          {stats && (
            <div className="flex flex-wrap gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  Rs. {stats.current.toLocaleString('en-NP')}
                </div>
                <div className={`flex items-center text-sm font-semibold ${stats.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stats.change >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                  {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)} ({stats.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Controls */}
      {showControls && (
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Period Selector */}
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-slate-400" />
              <div className="flex flex-wrap gap-1">
                {PERIODS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => {
                      setPeriod(p.value);
                    }}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      period === p.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Interval Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Interval:</span>
              <div className="flex flex-wrap gap-1">
                {INTERVALS.slice(0, 4).map(i => (
                  <button
                    key={i.value}
                    onClick={() => {
                      setInterval(i.value);
                    }}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      interval === i.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {i.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Chart Type */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Type:</span>
              <div className="flex gap-1">
                {['candlestick', 'line', 'area'].map(type => (
                  <button
                    key={type}
                    onClick={() => setChartType(type as any)}
                    className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors ${
                      chartType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            {/* Refresh Button */}
            <button
              onClick={fetchChartData}
              disabled={loading}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      )}
      {/* Chart Container */}
      <div className="relative" style={{ height: `${height}px` }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-3 text-slate-600 dark:text-slate-400">Loading chart data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-2">⚠️</div>
              <p className="text-slate-700 dark:text-slate-300">{error}</p>
              <button
                onClick={fetchChartData}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Retry
              </button>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-400">No chart data available</p>
            </div>
          </div>
        ) : (
          <>
            <div 
              ref={chartContainerRef} 
              className="w-full h-full"
            />
            {/* Mini Stats Overlay */}
            {stats && (
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-slate-300">High</div>
                    <div className="font-semibold">Rs. {stats.high.toLocaleString('en-NP')}</div>
                  </div>
                  <div>
                    <div className="text-slate-300">Low</div>
                    <div className="font-semibold">Rs. {stats.low.toLocaleString('en-NP')}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-slate-300">Avg Volume</div>
                    <div className="font-semibold">
                      {stats.avgVolume > 1000000 
                        ? `${(stats.avgVolume / 1000000).toFixed(2)}M` 
                        : stats.avgVolume > 1000 
                          ? `${(stats.avgVolume / 1000).toFixed(2)}K` 
                          : stats.avgVolume.toLocaleString('en-NP')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {/* Footer */}
      <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Data Source: NEPSE • Last Update: {data.length > 0 
              ? new Date().toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit' })
              : '--:--'}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span>Bullish</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Bearish</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
