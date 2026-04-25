'use client';

import { useEffect, useRef, useState } from 'react';
import { useCompletion } from 'ai/react';
import { RiskBadge } from './RiskBadge';
import type { DecodedTransaction } from '@/lib/types';

interface StreamingPanelProps {
  decodedTx: DecodedTransaction | null;
  sliderActive?: boolean;
}

const RISK_SCORE_RE = /"riskScore":\s*(\d+)/;
const SUMMARY_RE = /"summary":\s*"((?:[^"\\]|\\.)*)"/;

export function StreamingPanel({ decodedTx, sliderActive }: StreamingPanelProps) {
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [summary, setSummary] = useState('');
  const pendingTx = useRef<DecodedTransaction | null>(null);

  const { completion, isLoading, complete, stop } = useCompletion({
    api: '/api/explain',
    onFinish: () => {
      if (pendingTx.current) {
        const tx = pendingTx.current;
        pendingTx.current = null;
        complete('', { body: { decodedTx: tx } });
      }
    },
  });

  useEffect(() => {
    if (!decodedTx) return;

    if (isLoading) {
      pendingTx.current = decodedTx;
      stop();
    } else {
      setRiskScore(null);
      setSummary('');
      complete('', { body: { decodedTx } });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedTx]);

  useEffect(() => {
    if (!completion) return;

    const scoreMatch = RISK_SCORE_RE.exec(completion);
    if (scoreMatch) {
      setRiskScore(parseInt(scoreMatch[1], 10));
    }

    const summaryMatch = SUMMARY_RE.exec(completion);
    if (summaryMatch) {
      setSummary(summaryMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'));
    }
  }, [completion]);

  if (!decodedTx && !isLoading) {
    return (
      <div className="flex items-center justify-center h-48 rounded-lg border border-slate-700 bg-slate-800/50">
        <p className="text-slate-500 text-sm">Decode a transaction to see the AI analysis</p>
      </div>
    );
  }

  return (
    <div
      aria-live="polite"
      className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 overflow-y-auto max-h-[60vh]"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-slate-400">AI Analysis</h2>
        {sliderActive && isLoading && (
          <span className="text-xs text-slate-500 animate-pulse">Updating analysis...</span>
        )}
        {isLoading && !sliderActive && (
          <span className="text-xs text-slate-500 animate-pulse">Analyzing...</span>
        )}
      </div>

      {riskScore !== null && (
        <div className="mb-4">
          <RiskBadge score={riskScore} />
        </div>
      )}

      {summary ? (
        <p className="text-slate-300 text-sm leading-relaxed">{summary}</p>
      ) : isLoading ? (
        <div className="space-y-2">
          <div className="h-3 bg-slate-700/50 rounded animate-pulse w-full" />
          <div className="h-3 bg-slate-700/50 rounded animate-pulse w-5/6" />
          <div className="h-3 bg-slate-700/50 rounded animate-pulse w-4/6" />
        </div>
      ) : null}
    </div>
  );
}
