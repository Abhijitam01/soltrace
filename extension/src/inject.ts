// Runs in MAIN world — has direct access to window.solana
export {};

const MSG_REQUEST = 'WALLET_COPILOT_TX_REQUEST';
const MSG_RESPONSE = 'WALLET_COPILOT_TX_RESPONSE';

interface PendingEntry {
  resolve: (result: unknown) => void;
  reject: (err: Error) => void;
  originalTx: unknown;
  originalFn: (...args: unknown[]) => Promise<unknown>;
}

const pending = new Map<string, PendingEntry>();
let requestCounter = 0;

function serializeTx(tx: unknown): string | null {
  try {
    const t = tx as { serialize: (cfg?: { requireAllSignatures?: boolean; verifySignatures?: boolean }) => Uint8Array };
    const bytes = t.serialize({ requireAllSignatures: false, verifySignatures: false });
    const binary = Array.from(bytes).map((b) => String.fromCharCode(b)).join('');
    return btoa(binary);
  } catch {
    return null;
  }
}

function hookSolana(solana: { signTransaction?: unknown }) {
  if (typeof solana.signTransaction !== 'function') return;

  const original = (solana.signTransaction as (...args: unknown[]) => Promise<unknown>).bind(solana);

  solana.signTransaction = async (tx: unknown) => {
    const rawBase64 = serializeTx(tx);
    if (!rawBase64) {
      return original(tx);
    }

    const requestId = `wc-${Date.now()}-${++requestCounter}`;
    window.postMessage({ type: MSG_REQUEST, requestId, rawBase64 }, '*');

    return new Promise<unknown>((resolve, reject) => {
      pending.set(requestId, { resolve, reject, originalTx: tx, originalFn: original });

      // Auto-proceed after 30s to avoid blocking the user forever
      setTimeout(() => {
        if (pending.has(requestId)) {
          pending.delete(requestId);
          original(tx).then(resolve).catch(reject);
        }
      }, 30000);
    });
  };
}

window.addEventListener('message', (e: MessageEvent) => {
  if (e.source !== window || e.data?.type !== MSG_RESPONSE) return;

  const { requestId, proceed } = e.data as { requestId: string; proceed: boolean };
  const entry = pending.get(requestId);
  if (!entry) return;
  pending.delete(requestId);

  if (proceed) {
    entry.originalFn(entry.originalTx).then(entry.resolve).catch(entry.reject);
  } else {
    entry.reject(new Error('Transaction cancelled by Wallet Copilot'));
  }
});

function tryHook() {
  const w = window as unknown as { solana?: { signTransaction?: unknown } };
  if (w.solana) {
    hookSolana(w.solana);
    return true;
  }
  return false;
}

if (!tryHook()) {
  // Wallet injects window.solana after page load — poll briefly
  let attempts = 0;
  const interval = setInterval(() => {
    if (tryHook() || ++attempts > 50) clearInterval(interval);
  }, 100);
}
