import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — SolTrace',
  description: 'Privacy policy for the SolTrace web app and Wallet Copilot Chrome extension.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-warm-black mb-2 tracking-tight">Privacy Policy</h1>
      <p className="text-warm-gray text-sm mb-10">Last updated: April 2026</p>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-warm-black mb-3">SolTrace Web App</h2>
        <p className="text-charcoal text-sm leading-relaxed mb-3">
          SolTrace analyzes Solana transactions. When you paste a transaction signature or raw
          transaction bytes, we decode it server-side using the Helius API and return the results.
          Transaction data is cached for 7 days in our database to power the global feed on the
          home page. We do not store wallet addresses, private keys, or any personally identifiable
          information.
        </p>
        <p className="text-charcoal text-sm leading-relaxed">
          AI analysis is provided by Groq and is not stored beyond the streaming session.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-warm-black mb-3">
          SolTrace Wallet Copilot (Chrome Extension)
        </h2>
        <p className="text-charcoal text-sm leading-relaxed mb-3">
          The browser extension intercepts unsigned transaction bytes <em>before</em> they are
          sent to your wallet for signing. It encodes those bytes as base64 and sends them to
          the SolTrace API (<code className="font-mono text-warm-gray">soltrace.vercel.app/api/decode</code>)
          to retrieve a risk assessment.
        </p>
        <ul className="list-disc list-inside text-charcoal text-sm leading-relaxed space-y-1.5 mb-3">
          <li>
            The extension does <strong className="text-warm-black">not</strong> read, store, or
            transmit your private keys or seed phrase.
          </li>
          <li>
            The extension does <strong className="text-warm-black">not</strong> replace or reassign{' '}
            <code className="font-mono text-warm-gray">window.solana</code>.
          </li>
          <li>
            Transaction bytes are only sent to the SolTrace API for risk analysis — never to third parties.
          </li>
          <li>No browsing history, page content, or personal data is collected.</li>
          <li>
            The <code className="font-mono text-warm-gray">storage</code> permission is used only to
            remember user preferences (e.g., whether to show the overlay).
          </li>
        </ul>
        <p className="text-charcoal text-sm leading-relaxed">
          You can disable or remove the extension at any time from{' '}
          <code className="font-mono text-warm-gray">chrome://extensions</code>.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-warm-black mb-3">Contact</h2>
        <p className="text-charcoal text-sm leading-relaxed">
          Questions? Open an issue at{' '}
          <a
            href="https://github.com/Abhijitam01/soltrace"
            className="text-accent hover:text-accent-hover underline underline-offset-2 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/Abhijitam01/soltrace
          </a>
          .
        </p>
      </section>
    </div>
  );
}
