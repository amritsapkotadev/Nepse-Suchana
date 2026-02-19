"use client";

import { 
  TrendingUp, 
  PieChart, 
  Eye, 
  Wallet, 
  Search, 
  Shield,
  BarChart3,
  Target
} from "lucide-react";

const features = [
  {
    title: "Real-Time Market Dashboard",
    desc: "Live NEPSE index tracking, market sentiment, top gainers, losers, and turnover with auto-refresh every 15 seconds.",
    icon: <BarChart3 className="w-6 h-6 text-blue-600" />,
  },
  {
    title: "Multi-Portfolio Management",
    desc: "Create and manage up to 5 portfolios with transaction tracking, P/L calculation, and detailed holdings view.",
    icon: <PieChart className="w-6 h-6 text-indigo-600" />,
  },
  {
    title: "Smart Watchlist",
    desc: "Track favorite stocks with target prices, notes, and instant alerts when your target price is reached.",
    icon: <Eye className="w-6 h-6 text-amber-500" />,
  },
  {
    title: "Demo Trading Simulator",
    desc: "Practice trading with virtual currency. Execute buy/sell orders and track your performance risk-free.",
    icon: <Wallet className="w-6 h-6 text-emerald-500" />,
  },
  {
    title: "Advanced Stock Search",
    desc: "Search stocks by symbol or name with live prices, change percentages, and turnover data in real-time.",
    icon: <Search className="w-6 h-6 text-blue-500" />,
  },
  {
    title: "Secure Authentication",
    desc: "Bank-grade JWT authentication to keep your portfolio and watchlist data private and secure.",
    icon: <Shield className="w-6 h-6 text-slate-700" />,
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
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
              className="group bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="mb-4 p-3 bg-slate-50 w-fit rounded-xl group-hover:bg-blue-50 transition-colors">
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
