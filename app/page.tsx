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
      <h2 className="text-sm font-semibold text-charcoal mb-3">Recent analyses</h2>
      <ul className="space-y-1.5">
        {analyses.map((a) => (
          <li key={a.sig}>
            <Link
              href={`/simulate?sig=${a.sig}`}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-sand hover:border-mid-warm hover:bg-light-sand transition-colors"
            >
              <span className="font-mono text-xs text-warm-gray truncate w-32 shrink-0">
                {a.sig.slice(0, 8)}…{a.sig.slice(-8)}
              </span>
              <span className="text-sm text-charcoal truncate flex-1">{a.summary}</span>
              <span className="text-xs text-warm-gray shrink-0">
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
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-warm-black mb-3 tracking-tight">
          Decode any Solana transaction
        </h1>
        <p className="text-warm-gray text-base leading-relaxed">
          Paste a signature to see account changes, AI analysis, and what-if price scenarios.
        </p>
      </div>

      <SignatureInputForm action={handleDecode} />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-warm-gray">Try:</span>
        {DEMO_TXS.map((demo) => (
          <Link
            key={demo.sig}
            href={`/simulate?sig=${demo.sig}`}
            className="text-sm text-accent hover:text-accent-hover underline underline-offset-2 transition-colors"
          >
            {demo.label}
          </Link>
        ))}
      </div>

      <RecentFeed />
    </div>
  );
}
