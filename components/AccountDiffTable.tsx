import { SkeletonRows } from './ui/SkeletonRows';
import type { AccountDiff } from '@/lib/types';

interface AccountDiffTableProps {
  diffs: AccountDiff[] | null;
  isLoading: boolean;
}

function truncateAddress(addr: string, chars = 4): string {
  if (addr.length <= chars * 2 + 3) return addr;
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}

function formatDelta(delta: number): string {
  const abs = Math.abs(delta);
  if (abs < 0.0001) return delta.toExponential(2);
  return (delta > 0 ? '+' : '') + delta.toFixed(6).replace(/\.?0+$/, '');
}

export function AccountDiffTable({ diffs, isLoading }: AccountDiffTableProps) {
  return (
    <div className="overflow-y-auto max-h-96 rounded-lg border border-sand bg-cream">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-light-sand border-b border-sand">
          <tr>
            <th scope="col" className="text-left py-2 px-3 text-warm-gray font-medium text-xs">
              Address
            </th>
            <th scope="col" className="text-left py-2 px-3 text-warm-gray font-medium text-xs">
              Token
            </th>
            <th scope="col" className="text-right py-2 px-3 text-warm-gray font-medium text-xs">
              Delta
            </th>
          </tr>
        </thead>
        {isLoading ? (
          <SkeletonRows />
        ) : (
          <tbody>
            {diffs && diffs.length > 0 ? (
              diffs.map((diff, i) => (
                <tr
                  key={i}
                  className="border-b border-sand/60 hover:bg-light-sand transition-colors"
                >
                  <td className="py-2 px-3">
                    <span className="font-mono text-charcoal" title={diff.owner}>
                      {truncateAddress(diff.owner, 4)}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-warm-gray">
                      {diff.mint === 'SOL' ? 'SOL' : truncateAddress(diff.mint, 4)}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    <span
                      className={
                        diff.delta > 0
                          ? 'text-green-700'
                          : diff.delta < 0
                          ? 'text-red-600'
                          : 'text-warm-gray'
                      }
                    >
                      {formatDelta(diff.delta)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-8 text-center text-warm-gray text-sm">
                  No account changes
                </td>
              </tr>
            )}
          </tbody>
        )}
      </table>
    </div>
  );
}
