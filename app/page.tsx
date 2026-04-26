import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getRecentAnalyses } from '@/lib/turso';
import { SignatureInputForm } from '@/components/SignatureInputForm';

const DEMO_TXS = [
  {
    sig: '3PWxBuY7GNm9j3kESVyu2udR5dqomegYHWHwHvftgkM7ST9ZnuEstWdxRJbfhNUiM7twQpCc5yyzKfNtfytvxjdj',
    label: 'Raydium swap',
  },
  {
    sig: '2WFhQhbycYbGnHJZxiFsPKBAJgodTw82F7ZBYoaxBbfWsqbcHpfivSAuP2kBHtgU363bj5XUDeNSAqu7NwJXD7Hj',
    label: 'Jupiter route',
  },
];

async function RecentFeed() {
  let analyses: Array<{ sig: string; decoded_at: number; summary: string }> = [];
  try {
    analyses = await getRecentAnalyses(10);
  } catch {
    // Turso not configured — skip feed
  }

  if (analyses.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-slate-300 mb-4">Recent community analyses</h2>
      <ul className="space-y-2">
        {analyses.map((a) => (
          <li key={a.sig}>
            <Link
              href={`/simulate?sig=${a.sig}`}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors"
            >
              <span className="font-mono text-xs text-slate-400 truncate flex-1">
                {a.sig.slice(0, 8)}...{a.sig.slice(-8)}
              </span>
              <span className="text-sm text-slate-300 truncate max-w-xs">{a.summary}</span>
              <span className="text-xs text-slate-500 shrink-0">
                {new Date(a.decoded_at * 1000).toLocaleDateString()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function HomePage() {
  async function handleDecode(formData: FormData) {
    'use server';
    const sig = formData.get('sig')?.toString().trim();
    if (sig) redirect(`/simulate?sig=${encodeURIComponent(sig)}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-semibold text-white mb-3">
          Decode any Solana transaction
        </h1>
        <p className="text-slate-400 text-sm">
          Paste a signature to see account changes, then drag the price slider to replay at a different rate.
        </p>
      </div>

      <SignatureInputForm action={handleDecode} />

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="text-sm text-slate-500">Try an example:</span>
        {DEMO_TXS.map((demo) => (
          <Link
            key={demo.sig}
            href={`/simulate?sig=${demo.sig}`}
            className="text-sm text-[#9945FF] hover:text-[#b066ff] underline underline-offset-2"
          >
            {demo.label}
          </Link>
        ))}
      </div>

      <RecentFeed />
    </div>
  );
}
