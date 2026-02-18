'use client';

import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAuthPage) return null;

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 py-4">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500 dark:text-slate-400">
        &copy; {new Date().getFullYear()} NEPSE Suchana. All rights reserved.
      </div>
    </footer>
  );
}
