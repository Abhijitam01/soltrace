import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'SolTrace — Solana Transaction Decoder',
  description: 'Decode any Solana transaction and simulate what-if price scenarios.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <nav aria-label="Main navigation" className="flex items-center justify-between px-6 py-4 border-b border-slate-800 max-w-7xl mx-auto">
          <a href="/" className="text-lg font-bold tracking-tight text-white hover:text-[#9945FF] transition-colors">
            SolTrace
          </a>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
              Analyze
            </Link>
            <Link href="/copilot" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
              Copilot
            </Link>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {children}
        </main>
      </body>
    </html>
  );
}
