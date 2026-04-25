'use client';

import { useState, useCallback, useRef } from 'react';
import type { AccountDiff, AmmType, SimulationResult } from '../types';

interface SimulationState {
  data: SimulationResult | null;
  isLoading: boolean;
  clmmUnavailable: boolean;
}

export function useSimulation() {
  const [state, setState] = useState<SimulationState>({
    data: null,
    isLoading: false,
    clmmUnavailable: false,
  });
  const abortRef = useRef<AbortController | null>(null);

  const simulate = useCallback(
    async (diffs: AccountDiff[], multiplier: number, ammType: AmmType) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setState((s) => ({ ...s, isLoading: true }));

      try {
        const res = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ diffs, multiplier, ammType }),
          signal: controller.signal,
        });

        const json = await res.json();

        if ('clmmUnavailable' in json) {
          setState({ data: null, isLoading: false, clmmUnavailable: true });
          return;
        }

        setState({ data: json as SimulationResult, isLoading: false, clmmUnavailable: false });
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setState((s) => ({ ...s, isLoading: false }));
      }
    },
    []
  );

  return { ...state, simulate };
}
