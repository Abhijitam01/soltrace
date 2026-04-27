'use client';

import { useMemo } from 'react';
import type { AccountDiff } from '@/lib/types';

interface PriceSliderProps {
  value: number;
  onChange: (value: number) => void;
  diffs: AccountDiff[];
}

function clientSidePnl(diffs: AccountDiff[], multiplier: number): number {
  const tokenDiffs = diffs.filter((d) => d.type === 'token');
  const inbound = tokenDiffs.filter((d) => d.delta > 0);
  const outbound = tokenDiffs.filter((d) => d.delta < 0);

  if (inbound.length === 0 || outbound.length === 0) return 0;

  const inputAmount = Math.abs(outbound[0].delta);
  const outputAmount = Math.abs(inbound[0].delta);
  const reserveIn = inputAmount * 10;
  const reserveOut = outputAmount * (10 + 1);
  const scaledInput = inputAmount * multiplier;
  const newOutput = (reserveOut * scaledInput) / (reserveIn + scaledInput);
  const raw = newOutput - outputAmount;
  return Math.abs(raw) < 1e-9 ? 0 : raw;
}

export function PriceSlider({ value, onChange, diffs }: PriceSliderProps) {
  const pnl = useMemo(() => clientSidePnl(diffs, value), [diffs, value]);

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="text-center">
        <span className="text-2xl font-semibold text-warm-black">{value.toFixed(2)}x</span>
        <p className="text-xs text-warm-gray mt-1">price multiplier</p>
      </div>

      <input
        type="range"
        min="0.1"
        max="3.0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            onChange(Math.max(0.1, parseFloat((value - 0.01).toFixed(2))));
          }
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            onChange(Math.min(3.0, parseFloat((value + 0.01).toFixed(2))));
          }
          if (e.key === 'Home') {
            e.preventDefault();
            onChange(1.0);
          }
        }}
        aria-label={`Price multiplier: ${value.toFixed(2)}x`}
        className="w-full"
      />

      <div className="flex justify-between text-xs text-warm-gray">
        <span>0.1x</span>
        <span>1x</span>
        <span>3x</span>
      </div>

      <div className="text-center border-t border-sand pt-4">
        <p className="text-xs text-warm-gray mb-1">Simulated PnL</p>
        <span
          className={`text-lg font-semibold ${
            pnl > 0 ? 'text-green-700' : pnl < 0 ? 'text-red-600' : 'text-warm-gray'
          }`}
        >
          {pnl === 0 ? '±0' : (pnl > 0 ? '+' : '') + pnl.toFixed(6)}
        </span>
      </div>
    </div>
  );
}
