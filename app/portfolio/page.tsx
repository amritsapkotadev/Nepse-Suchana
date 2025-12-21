'use client';

import Link from 'next/link';

export default function Portfolio() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">My Portfolio</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          This is your portfolio page. You can add, view, and manage your NEPSE stocks here in the future.
        </p>
        <div className="flex flex-col gap-4 items-center">
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl p-6 text-slate-500 dark:text-slate-300">
            <span className="block text-lg font-semibold mb-2">No stocks added yet</span>
            <span className="block text-sm">Your portfolio is empty. Add stocks to see them here.</span>
          </div>
          <Link href="/" className="mt-6 inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
