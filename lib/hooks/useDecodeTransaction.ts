'use client';

import { useState, useCallback } from 'react';
import type { DecodedTransaction } from '../types';

interface DecodeState {
  data: DecodedTransaction | null;
  isLoading: boolean;
  error: string | null;
}

export function useDecodeTransaction() {
  const [state, setState] = useState<DecodeState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const decode = useCallback(async (sig: string) => {
    setState({ data: null, isLoading: true, error: null });

    try {
      const res = await fetch(`/api/decode?sig=${encodeURIComponent(sig)}`);
      const json = await res.json();

      if (!res.ok) {
        setState({
          data: null,
          isLoading: false,
          error: json.error ?? 'Failed to decode transaction',
        });
        return;
      }

      setState({ data: json as DecodedTransaction, isLoading: false, error: null });
    } catch {
      setState({
        data: null,
        isLoading: false,
        error: 'Network error — please try again',
      });
    }
  }, []);

  return { ...state, decode };
}
