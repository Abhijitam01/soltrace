import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SolTrace — Solana Transaction Decoder',
  description: 'Decode any Solana transaction and simulate what-if price scenarios.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <nav className="flex items-center px-6 py-4 border-b border-slate-800">
          <a href="/" className="text-lg font-bold tracking-tight text-white hover:text-purple-400 transition-colors">
            SolTrace
          </a>
        </nav>
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {children}
        </main>
      </body>
    </html>
  );
}
