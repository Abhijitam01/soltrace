import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getRecentAnalyses } from '@/lib/turso';
import { SignatureInputForm } from '@/components/SignatureInputForm';

const DEMO_TXS = [
  {
    sig: '5KtPn1GNKMgkKg3Yrm4WJDExZ1GhHtW5MLbN5yUuXfK8DTmLtbqoL1WX8n1oeQ3FbCHhQE5q5Cgh3xVXAp8xMo',
    label: 'Raydium swap',
  },
  {
    sig: '3Jm2Tir2MBMR5vEd1kBXbzFaFmFBYzFoK4Nqv8XZUrNfpNEPaE4N7oJKP4xFHSUJXb5JmViU7bG35bFcJB37BPc',
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
        <h1 className="text-4xl font-bold text-white mb-3">SolTrace</h1>
        <p className="text-slate-400">
          Decode any Solana transaction — then replay it at a different price to see what would have happened.
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
