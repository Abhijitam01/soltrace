'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AccountDiffTable } from '@/components/AccountDiffTable';
import { PriceSlider } from '@/components/PriceSlider';
import { StreamingPanel } from '@/components/StreamingPanel';
import { useDecodeTransaction } from '@/lib/hooks/useDecodeTransaction';
import type { DecodedTransaction } from '@/lib/types';

export default function SimulatePage() {
  const searchParams = useSearchParams();
  const sig = searchParams.get('sig') ?? '';
  const { data, isLoading, error, decode } = useDecodeTransaction();
  const [multiplier, setMultiplier] = useState(1.0);
  const [sliderActive, setSliderActive] = useState(false);
  const [explainTx, setExplainTx] = useState<DecodedTransaction | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (sig) decode(sig);
  }, [sig, decode]);

  useEffect(() => {
    if (data) setExplainTx(data);
  }, [data]);

  const handleSliderChange = useCallback(
    (value: number) => {
      setMultiplier(value);
      setSliderActive(true);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (data) setExplainTx({ ...data });
        setSliderActive(false);
      }, 300);
    },
    [data]
  );

  const showSlider = data?.ammType === 'constant-product';

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  }

  const truncatedSig = sig ? `${sig.slice(0, 8)}...${sig.slice(-8)}` : '';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-300 mb-1 block">
            ← Analyze another
          </Link>
          <h1 className="font-mono text-sm text-slate-300" title={sig}>
            {truncatedSig}
          </h1>
          {data?.summary && (
            <p className="text-sm text-slate-400 mt-0.5">{data.summary}</p>
          )}
        </div>
        <button
          onClick={handleShare}
          className="text-sm px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-300 transition-colors"
          aria-label="Copy share link"
        >
          Share
        </button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-2/5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Account Changes</h2>
          <AccountDiffTable diffs={data?.diffs ?? null} isLoading={isLoading} />
          {data?.ammType === 'aggregator' && (
            <p className="mt-2 text-xs text-amber-500/80">
              Multi-pool aggregator — price simulation unavailable
            </p>
          )}
        </div>

        {showSlider && (
          <div className="lg:w-1/5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Price Scenario</h2>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 px-4">
              <PriceSlider
                value={multiplier}
                onChange={handleSliderChange}
                diffs={data?.diffs ?? []}
              />
            </div>
          </div>
        )}

        <div className={showSlider ? 'lg:w-2/5' : 'lg:flex-1'}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">AI Analysis</h2>
          <StreamingPanel decodedTx={explainTx} sliderActive={sliderActive} />
        </div>
      </div>
    </div>
  );
}
