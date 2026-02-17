'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4 text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Something went wrong!
      </h2>
      
      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
        We apologize for the inconvenience. Please try again or return to the dashboard.
      </p>
      
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
