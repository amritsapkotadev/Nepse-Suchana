import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - NEPSE Suchana',
  description: 'Terms of service for NEPSE Suchana application.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Terms of Service</h1>
      
      <div className="prose max-w-none">
        <p className="text-slate-600 mb-6">
          Last updated: {new Date().toLocaleDateString('en-NP', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Acceptance of Terms</h2>
          <p className="text-slate-600">
            By accessing and using NEPSE Suchana, you accept and agree to be bound by the terms and provisions of this agreement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">2. Use License</h2>
          <p className="text-slate-600 mb-4">
            Permission is granted to temporarily use NEPSE Suchana for personal, non-commercial use only. This is the grant of a license, not a transfer of title.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">3. Disclaimer</h2>
          <p className="text-slate-600 mb-4">
            The information provided by NEPSE Suchana is for educational and informational purposes only. We do not provide financial advice. Stock trading involves risk, and past performance does not guarantee future results.
          </p>
          <p className="text-slate-600">
            The demo trading feature is purely for practice and simulation. No real money is involved.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">4. Limitation of Liability</h2>
          <p className="text-slate-600">
            In no event shall NEPSE Suchana be liable for any damages arising out of the use or inability to use the materials on our application.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">5. Accuracy of Information</h2>
          <p className="text-slate-600">
            While we strive to provide accurate stock market data, we cannot guarantee the accuracy, completeness, or timeliness of the information. Always verify information from official sources before making investment decisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">6. Contact Information</h2>
          <p className="text-slate-600">
            For questions about these Terms of Service, please contact us through the application.
          </p>
        </section>
      </div>
    </div>
  );
}
