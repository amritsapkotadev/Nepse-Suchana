'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppLoading } from '@/components/AppLoadingProvider';
import { BarChart3 } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();
  const { isAppLoading } = useAppLoading();
  const isStaticPage = pathname === '/disclaimer' || pathname === '/privacy-policy' || pathname === '/terms' || pathname === '/features';
  const isQuickLinksPage = pathname === '/features' || pathname === '/disclaimer' || pathname === '/privacy-policy' || pathname === '/terms';

  if (isAppLoading && !isStaticPage) return null;

  if (isQuickLinksPage) {
    return (
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
            <div className="max-w-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">NEPSE Suchana</h3>
                  <p className="text-slate-600 text-sm">Real-time market analytics platform</p>
                </div>
              </div>
              <p className="text-slate-500 text-sm">
                Comprehensive market data and analytics for Nepal Stock Exchange. 
                Stay updated with real-time prices, indices, and market trends.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-800 mb-3">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-slate-600 hover:text-blue-600 transition-colors text-sm">Features</Link></li>
                <li><Link href="/privacy-policy" className="text-slate-600 hover:text-blue-600 transition-colors text-sm">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-slate-600 hover:text-blue-600 transition-colors text-sm">Terms of Service</Link></li>
                <li><Link href="/disclaimer" className="text-slate-600 hover:text-blue-600 transition-colors text-sm">Disclaimer</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} NEPSE Suchana. All rights reserved.
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-slate-200 py-4">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} NEPSE Suchana. All rights reserved.
      </div>
    </footer>
  );
}
