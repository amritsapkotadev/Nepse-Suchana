import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - NEPSE Suchana',
  description: 'Privacy policy for NEPSE Suchana application.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Privacy Policy</h1>
      
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Last updated: {new Date().toLocaleDateString('en-NP', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">1. Introduction</h2>
          <p className="text-slate-600 dark:text-slate-400">
            NEPSE Suchana (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by NEPSE Suchana when you use our application.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">2. Information We Collect</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            We collect the following types of information:
          </p>
          <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2">
            <li><strong>Account Information:</strong> When you register, we collect your name and email address.</li>
            <li><strong>Portfolio Data:</strong> Information about your stock portfolios and holdings.</li>
            <li><strong>Watchlist Data:</strong> Stocks you add to your personal watchlist.</li>
            <li><strong>Demo Trading Data:</strong> Virtual trading transactions you make for practice.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">3. How We Use Your Information</h2>
          <p className="text-slate-600 dark:text-slate-400">
            We use your information to provide, maintain, and improve our services, including:
          </p>
          <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2 mt-4">
            <li>Providing personalized portfolio tracking</li>
            <li>Managing your watchlist and demo trading accounts</li>
            <li>Sending you important updates about our services</li>
            <li>Responding to your inquiries and support requests</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">4. Data Security</h2>
          <p className="text-slate-600 dark:text-slate-400">
            We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Your data is stored securely using industry-standard encryption.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">5. Contact Us</h2>
          <p className="text-slate-600 dark:text-slate-400">
            If you have any questions about this Privacy Policy, please contact us through the application.
          </p>
        </section>
      </div>
    </div>
  );
}
