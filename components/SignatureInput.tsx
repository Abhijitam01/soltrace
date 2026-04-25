'use client';

import { useState, FormEvent } from 'react';

interface SignatureInputProps {
  onSubmit: (sig: string) => void;
  isLoading?: boolean;
}

const SIG_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{87,88}$/;

export function SignatureInput({ onSubmit, isLoading }: SignatureInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();

    if (!trimmed) {
      setError('Paste a Solana transaction signature');
      return;
    }

    if (!SIG_PATTERN.test(trimmed)) {
      setError('Invalid signature format — must be 87-88 base58 characters');
      return;
    }

    setError('');
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError('');
          }}
          placeholder="Paste a Solana transaction signature..."
          className="flex-1 font-mono text-sm bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#9945FF] focus:ring-1 focus:ring-[#9945FF]"
          disabled={isLoading}
          aria-label="Transaction signature"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-[#9945FF] hover:bg-[#8035ee] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {isLoading ? 'Decoding...' : 'Decode'}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
