'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/AuthProvider';
import { useState, useEffect } from 'react';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/demo-trading', label: 'Demo Trading' },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAuthPage) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                NEPSE
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {user && navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle theme"
              >
                {resolvedTheme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex items-center space-x-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </button>
                
                {mobileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1">
                    <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                    <button
                      onClick={logout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:shadow-lg transition-all"
              >
                Login
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && user && (
          <div className="md:hidden pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 text-sm font-medium ${
                  pathname.startsWith(link.href)
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
