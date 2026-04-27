import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'SolTrace — Solana Transaction Decoder',
  description: 'Decode any Solana transaction and simulate what-if price scenarios.',
  openGraph: {
    title: 'SolTrace — Solana Transaction Decoder',
    description: 'Decode any Solana transaction, inspect account diffs, and simulate price scenarios with AI analysis.',
    siteName: 'SolTrace',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'SolTrace',
    description: 'Decode any Solana transaction and simulate what-if price scenarios.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-cream text-warm-black antialiased">
        <header className="sticky top-0 z-10 bg-cream border-b border-sand">
          <nav
            aria-label="Main navigation"
            className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto"
          >
            <a
              href="/"
              className="text-base font-semibold tracking-tight text-warm-black hover:text-accent transition-colors"
            >
              SolTrace
            </a>
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-sm text-warm-gray hover:text-warm-black transition-colors"
              >
                Analyze
              </Link>
              <Link
                href="/copilot"
                className="text-sm text-warm-gray hover:text-warm-black transition-colors"
              >
                Copilot
              </Link>
            </div>
          </nav>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10">
          {children}
        </main>

        <footer className="border-t border-sand mt-16 py-6">
          <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs text-warm-gray">
            <span>SolTrace — open source Solana transaction decoder</span>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-warm-black transition-colors">
                Privacy
              </Link>
              <a
                href="https://github.com/Abhijitam01/soltrace"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-warm-black transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
