import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer - NEPSE Suchana',
  description: 'Important disclaimer for NEPSE Suchana application.',
};

export default function DisclaimerPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Disclaimer</h1>
      
      <div className="prose max-w-none">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-amber-800 mb-2">
            Important Notice
          </h2>
          <p className="text-amber-700">
            NEPSE Suchana is for educational and informational purposes only. 
            Nothing on this website should be construed as financial advice.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">1. No Financial Advice</h2>
          <p className="text-slate-600">
            The content provided on NEPSE Suchana is for educational purposes only. 
            We are not registered financial advisors. All investment decisions should 
            be made after consulting with qualified financial professionals.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">2. Accuracy of Data</h2>
          <p className="text-slate-600">
            While we strive to provide accurate and up-to-date information about Nepal 
            Stock Exchange (NEPSE), we cannot guarantee the accuracy, completeness, or 
            timeliness of the data. Stock prices and other information may be delayed.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">3. Demo Trading - No Real Money</h2>
          <p className="text-slate-600 mb-4">
            The demo trading feature is a simulation only:
          </p>
          <ul className="list-disc pl-6 text-slate-600 space-y-2">
            <li>No real money is used or transacted</li>
            <li>Virtual balances do not have monetary value</li>
            <li>Trading outcomes are for practice only</li>
            <li>Results do not reflect actual trading performance</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">4. Investment Risk</h2>
          <p className="text-slate-600">
            Stock trading involves significant risk. Past performance does not guarantee 
            future results. The value of investments can go down as well as up. 
            You may lose some or all of your invested capital.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">5. Third-Party Links</h2>
          <p className="text-slate-600">
            Our application may contain links to third-party websites. We are not 
            responsible for the content or accuracy of these external sites.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">6. No Warranty</h2>
          <p className="text-slate-600">
            NEPSE Suchana is provided &quot;as is&quot; without warranty of any kind. 
            We do not warrant that the service will be uninterrupted or error-free.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">7. By Using This App</h2>
          <p className="text-slate-600">
            By using NEPSE Suchana, you acknowledge that you have read, understood, 
            and agree to this disclaimer. If you do not agree, please do not use 
            this application.
          </p>
        </section>
      </div>
    </div>
  );
}
