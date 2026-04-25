import { Connection, PublicKey, VersionedTransaction, TransactionMessage } from '@solana/web3.js';
import pLimit from 'p-limit';
import { getCached, setCached } from './turso';
import { DecodeError } from './errors';
import type { AccountDiff, AmmInfo, AmmType, DecodedTransaction } from './types';

const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
const PUBLIC_RPC = 'https://api.mainnet-beta.solana.com';
const ALT_CONCURRENCY = 3;

// AMM program registry — full IDs mapped to metadata
const AMM_REGISTRY = new Map<string, AmmInfo>([
  ['675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', { name: 'Raydium AMM v4', type: 'constant-product' }],
  ['CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C', { name: 'Raydium CPSWAP', type: 'constant-product' }],
  ['9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP', { name: 'Orca v1', type: 'constant-product' }],
  ['JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', { name: 'Jupiter v6', type: 'aggregator' }],
  ['whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc', { name: 'Orca Whirlpool', type: 'clmm' }],
  ['CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK', { name: 'Raydium CLMM', type: 'clmm' }],
]);

function isValidSig(sig: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(sig);
}

async function fetchTransaction(sig: string): Promise<Awaited<ReturnType<Connection['getTransaction']>>> {
  const heliusConn = new Connection(HELIUS_RPC, 'confirmed');
  try {
    const tx = await heliusConn.getTransaction(sig, {
      maxSupportedTransactionVersion: 0,
      commitment: 'finalized',
    });
    return tx;
  } catch (err: unknown) {
    // Fallback to public RPC on rate limit or network error
    const isRateLimit = err instanceof Error && (err.message.includes('429') || err.message.includes('rate'));
    if (isRateLimit || !process.env.HELIUS_API_KEY) {
      const pubConn = new Connection(PUBLIC_RPC, 'confirmed');
      return pubConn.getTransaction(sig, {
        maxSupportedTransactionVersion: 0,
        commitment: 'finalized',
      });
    }
    throw err;
  }
}

async function resolveALTs(
  tx: NonNullable<Awaited<ReturnType<Connection['getTransaction']>>>,
  connection: Connection
): Promise<PublicKey[]> {
  const message = tx.transaction.message;
  const lookups = 'addressTableLookups' in message ? message.addressTableLookups : [];
  if (lookups.length === 0) return [];

  const limit = pLimit(ALT_CONCURRENCY);
  const resolved = await Promise.all(
    lookups.map((lookup) =>
      limit(async () => {
        const altAddress = new PublicKey(lookup.accountKey);
        const altAccount = await connection.getAddressLookupTable(altAddress);
        if (!altAccount.value) return [];
        const { writableIndexes, readonlyIndexes } = lookup;
        const allIndexes = [...writableIndexes, ...readonlyIndexes];
        return allIndexes.map((i) => altAccount.value!.state.addresses[i]).filter(Boolean);
      })
    )
  );
  return resolved.flat();
}

function extractAccountDiffs(
  tx: NonNullable<Awaited<ReturnType<Connection['getTransaction']>>>
): AccountDiff[] {
  const { meta } = tx;
  if (!meta) return [];

  const diffs: AccountDiff[] = [];

  // SOL balance changes
  const accounts = tx.transaction.message.staticAccountKeys ?? [];
  const preBalances = meta.preBalances ?? [];
  const postBalances = meta.postBalances ?? [];
  accounts.forEach((acc, i) => {
    const pre = (preBalances[i] ?? 0) / 1e9;
    const post = (postBalances[i] ?? 0) / 1e9;
    const delta = post - pre;
    if (Math.abs(delta) > 1e-9) {
      diffs.push({
        owner: acc.toBase58(),
        mint: 'SOL',
        preBalance: pre,
        postBalance: post,
        delta,
        type: 'SOL',
      });
    }
  });

  // SPL token balance changes
  const preTokens = meta.preTokenBalances ?? [];
  const postTokens = meta.postTokenBalances ?? [];

  // Index post balances by accountIndex + mint
  const postMap = new Map<string, typeof postTokens[0]>();
  for (const t of postTokens) {
    postMap.set(`${t.accountIndex}:${t.mint}`, t);
  }

  const preMap = new Map<string, typeof preTokens[0]>();
  for (const t of preTokens) {
    preMap.set(`${t.accountIndex}:${t.mint}`, t);
  }

  const allKeys = new Set([...preMap.keys(), ...postMap.keys()]);
  for (const key of allKeys) {
    const pre = preMap.get(key);
    const post = postMap.get(key);
    const owner = (post?.owner ?? pre?.owner) ?? '';
    const mint = (post?.mint ?? pre?.mint) ?? '';
    const preAmt = parseFloat(pre?.uiTokenAmount?.uiAmountString ?? '0');
    const postAmt = parseFloat(post?.uiTokenAmount?.uiAmountString ?? '0');
    const delta = postAmt - preAmt;
    if (Math.abs(delta) > 1e-9) {
      diffs.push({ owner, mint, preBalance: preAmt, postBalance: postAmt, delta, type: 'token' });
    }
  }

  return diffs;
}

function detectAmmType(programIds: string[]): AmmType {
  let detected: AmmType = 'unknown';
  for (const pid of programIds) {
    const info = AMM_REGISTRY.get(pid);
    if (info) {
      // constant-product takes priority over aggregator for simulation
      if (info.type === 'constant-product') return 'constant-product';
      if (info.type === 'clmm') detected = 'clmm';
      else if (detected === 'unknown') detected = info.type;
    }
  }
  return detected;
}

function buildSummary(diffs: AccountDiff[], ammType: AmmType): string {
  const tokenDiffs = diffs.filter((d) => d.type === 'token');
  if (tokenDiffs.length === 0) {
    const solDiff = diffs.find((d) => d.type === 'SOL' && d.delta < 0);
    return solDiff ? `SOL transfer of ${Math.abs(solDiff.delta).toFixed(4)} SOL` : 'SOL transaction';
  }
  const positive = tokenDiffs.filter((d) => d.delta > 0);
  const negative = tokenDiffs.filter((d) => d.delta < 0);
  if (positive.length > 0 && negative.length > 0) {
    const typeLabel = ammType === 'clmm' ? ' (CLMM)' : ammType === 'constant-product' ? ' (AMM swap)' : '';
    return `Token swap${typeLabel}: received ${positive.length} token(s), sent ${negative.length} token(s)`;
  }
  return `Token transaction affecting ${tokenDiffs.length} account(s)`;
}

export async function decodeTransaction(sig: string): Promise<DecodedTransaction> {
  if (!isValidSig(sig)) {
    throw new DecodeError('INVALID_SIG', `Invalid transaction signature: ${sig}`);
  }

  const cached = await getCached(sig);
  if (cached) return cached;

  const rawTx = await fetchTransaction(sig).catch((err) => {
    throw new DecodeError('RPC_FAIL', `RPC fetch failed: ${(err as Error).message}`);
  });

  if (!rawTx) {
    throw new DecodeError('NOT_FOUND', `Transaction not found: ${sig}`);
  }

  const connection = new Connection(process.env.HELIUS_API_KEY ? HELIUS_RPC : PUBLIC_RPC);

  const altKeys = await Promise.race([
    resolveALTs(rawTx, connection),
    new Promise<PublicKey[]>((_, reject) =>
      setTimeout(() => reject(new DecodeError('ALT_TIMEOUT', 'ALT resolution timed out')), 8000)
    ),
  ]);

  // Extract all program IDs from instructions
  const staticKeys = rawTx.transaction.message.staticAccountKeys ?? [];
  const allKeys = [...staticKeys, ...altKeys];
  const programIds: string[] = [];
  const instructions = rawTx.transaction.message.compiledInstructions ?? [];
  for (const ix of instructions) {
    const pid = allKeys[ix.programIdIndex];
    if (pid) programIds.push(pid.toBase58());
  }

  const diffs = extractAccountDiffs(rawTx);
  const ammType = detectAmmType(programIds);
  const summary = buildSummary(diffs, ammType);

  const decoded: DecodedTransaction = {
    signature: sig,
    summary,
    diffs,
    riskScore: 0,
    rawInstructions: instructions,
    ammType,
    programIds,
    blockTime: rawTx.blockTime,
  };

  await setCached(sig, decoded);
  return decoded;
}
