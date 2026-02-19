'use client';

import { usePathname } from 'next/navigation';
import { useAppLoading } from '@/components/AppLoadingProvider';

export function Footer() {
  const pathname = usePathname();
  const { isAppLoading } = useAppLoading();
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isStaticPage = pathname === '/disclaimer' || pathname === '/privacy-policy' || pathname === '/terms' || pathname === '/features';

  if (isAuthPage || (isAppLoading && !isStaticPage)) return null;

  return (
    <footer className="border-t border-slate-200 py-4">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} NEPSE Suchana. All rights reserved.
      </div>
    </footer>
  );
}
