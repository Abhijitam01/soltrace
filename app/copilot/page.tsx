'use client';

import { useState, FormEvent } from 'react';
import { AccountDiffTable } from '@/components/AccountDiffTable';
import { StreamingPanel } from '@/components/StreamingPanel';
import type { DecodedTransaction, AccountDiff } from '@/lib/types';

function parseBase64Tx(base64: string): { diffs: AccountDiff[]; programIds: string[] } | null {
  try {
    const bytes = Buffer.from(base64, 'base64');
    // Minimal parsing: extract account count from versioned tx header
    // This is a simplified placeholder — full IDL parsing requires @solana/web3.js in browser context
    void bytes;
    return null;
  } catch {
    return null;
  }
}

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
      // Send to a lightweight client-side parse endpoint
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
        <h1 className="text-2xl font-bold text-white mb-2">Copilot Mode</h1>
        <p className="text-slate-400 text-sm">
          Analyze a transaction before signing. Paste the base64-encoded raw transaction bytes.
        </p>
      </div>

      <form onSubmit={handleAnalyze} className="mb-6">
        <textarea
          value={rawTx}
          onChange={(e) => {
            setRawTx(e.target.value);
            if (error) setError('');
          }}
          placeholder="Paste base64-encoded raw transaction..."
          rows={4}
          className="w-full font-mono text-xs bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#9945FF] focus:ring-1 focus:ring-[#9945FF] resize-none"
          aria-label="Raw transaction (base64)"
        />
        {error && (
          <p className="mt-2 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-3 px-6 py-2.5 bg-[#9945FF] hover:bg-[#8035ee] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {isLoading ? 'Analyzing...' : 'Analyze before signing'}
        </button>
      </form>

      {(decodedTx || isLoading) && (
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-1/2">
            <h2 className="text-sm font-medium text-slate-400 mb-2">Account Changes</h2>
            <AccountDiffTable diffs={diffs} isLoading={isLoading} />
          </div>
          <div className="lg:w-1/2">
            <StreamingPanel decodedTx={decodedTx} />
          </div>
        </div>
      )}
    </div>
  );
}
