"use client";

import Link from "next/link";
import { 
  TrendingUp, 
  PieChart, 
  Zap, 
  Bell, 
  LineChart, 
  ShieldCheck 
} from "lucide-react";

const features = [
  {
    title: "Live NEPSE Data Integration",
    desc: "Real-time ticker updates and index tracking with millisecond accuracy.",
    icon: <Zap className="w-6 h-6 text-blue-600" />,
  },
  {
    title: "Smart Portfolio Management",
    desc: "Automatically track P/L, dividends, and weighted average costs.",
    icon: <PieChart className="w-6 h-6 text-indigo-600" />,
  },
  {
    title: "Advanced Technical Charting",
    desc: "Interactive candlestick charts with RSI, MACD, and volume indicators.",
    icon: <LineChart className="w-6 h-6 text-blue-500" />,
  },
  {
    title: "Instant Price Alerts",
    desc: "Get notified via SMS or Email the moment your target price is hit.",
    icon: <Bell className="w-6 h-6 text-amber-500" />,
  },
  {
    title: "Floor-sheet Analytics",
    desc: "Deep dive into broker-wise buying and selling patterns.",
    icon: <TrendingUp className="w-6 h-6 text-emerald-500" />,
  },
  {
    title: "Secure Authentication",
    desc: "Bank-grade encryption to keep your financial data private and safe.",
    icon: <ShieldCheck className="w-6 h-6 text-slate-700" />,
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Nepse Suchana
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/portfolio"
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600:text-blue-400 transition-colors"
              >
                Portfolio
              </Link>
              <Link
                href="/"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:shadow-lg transition-all"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Powerful Trading Features
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Everything you need to navigate the Nepal Stock Exchange with confidence and speed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="mb-4 p-3 bg-slate-50 w-fit rounded-xl group-hover:bg-blue-50:bg-blue-900/30 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}