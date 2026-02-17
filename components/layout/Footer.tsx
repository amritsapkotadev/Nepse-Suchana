import Link from 'next/link';

const footerLinks = {
  company: [
    { href: '/features', label: 'Features' },
    { href: '/dashboard', label: 'Dashboard' },
  ],
  legal: [
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/disclaimer', label: 'Disclaimer' },
  ],
  resources: [
    { href: 'https://www.nepalstock.com/', label: 'NEPSE Official', external: true },
    { href: 'https://www.sharesansar.com/', label: 'Share Sagar', external: true },
  ],
};

export function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Company
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Legal
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Resources
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {link.label}
                    {link.external && (
                      <svg className="w-3 h-3 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Connect
            </h3>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              NEPSE Suchana provides real-time stock data and portfolio management for Nepal Stock Exchange.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} NEPSE Suchana. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
