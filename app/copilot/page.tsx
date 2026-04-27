'use client';

import { useState, FormEvent } from 'react';
import { AccountDiffTable } from '@/components/AccountDiffTable';
import { StreamingPanel } from '@/components/StreamingPanel';
import { RiskBadge } from '@/components/ui/RiskBadge';
import type { DecodedTransaction } from '@/lib/types';

export default function CopilotPage() {
  const [rawTx, setRawTx] = useState('');
  const [decodedTx, setDecodedTx] = useState<DecodedTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAnalyze(e: FormEvent) {
    e.preventDefault();
    const trimmed = rawTx.trim();
    if (!trimmed) {
      setError('Paste a base64-encoded transaction');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawBase64: trimmed }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? 'Failed to analyze transaction');
        return;
      }

      const data = await res.json();
      setDecodedTx(data as DecodedTransaction);
    } catch {
      setError('Network error — please try again');
    } finally {
      setIsLoading(false);
    }
  }

  const diffs = decodedTx?.diffs ?? null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-warm-black mb-2 tracking-tight">Copilot</h1>
        <p className="text-warm-gray text-base">
          Analyze a transaction before signing. Paste the base64-encoded raw transaction bytes.
        </p>
        <p className="mt-2 text-sm text-warm-gray">
          Using the{' '}
          <a
            href="https://github.com/Abhijitam01/soltrace/tree/master/extension"
            className="text-accent hover:text-accent-hover underline underline-offset-2 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Wallet Copilot extension
          </a>
          ? It captures the raw transaction automatically — no copy-paste needed.
        </p>
      </div>

      <form onSubmit={handleAnalyze} className="mb-8">
        <textarea
          value={rawTx}
          onChange={(e) => {
            setRawTx(e.target.value);
            if (error) setError('');
          }}
          placeholder="Paste base64-encoded raw transaction..."
          rows={4}
          className="w-full font-mono text-xs bg-cream border border-sand rounded-lg px-4 py-3 text-warm-black placeholder-warm-gray focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none transition-colors"
          aria-label="Raw transaction (base64)"
        />
        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-3 px-5 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isLoading ? 'Analyzing…' : 'Analyze before signing'}
        </button>
      </form>

      {(decodedTx || isLoading) && (
        <div className="space-y-5">
          {decodedTx && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-sand bg-light-sand">
              <RiskBadge score={decodedTx.riskScore} />
              <span className="text-sm text-charcoal">{decodedTx.summary}</span>
            </div>
          )}
          <div className="flex flex-col lg:flex-row gap-5">
            <div className="lg:w-1/2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-warm-gray mb-2">
                Account Changes
              </h2>
              <AccountDiffTable diffs={diffs} isLoading={isLoading} />
            </div>
            <div className="lg:w-1/2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-warm-gray mb-2">
                AI Analysis
              </h2>
              <StreamingPanel decodedTx={decodedTx} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
