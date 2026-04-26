import { NextRequest, NextResponse } from 'next/server';
import { VersionedTransaction, Transaction, PublicKey } from '@solana/web3.js';
import { decodeTransaction } from '@/lib/decoder';
import { getRecentAnalyses } from '@/lib/turso';
import { DecodeError } from '@/lib/errors';
import type { AccountDiff, AmmType, DecodedTransaction } from '@/lib/types';

const SIG_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{87,88}$/;

const AMM_REGISTRY = new Map<string, { name: string; type: AmmType }>([
  ['675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', { name: 'Raydium AMM v4', type: 'constant-product' }],
  ['CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C', { name: 'Raydium CPSWAP', type: 'constant-product' }],
  ['9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP', { name: 'Orca v1', type: 'constant-product' }],
  ['JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', { name: 'Jupiter v6', type: 'aggregator' }],
  ['whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc', { name: 'Orca Whirlpool', type: 'clmm' }],
  ['CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK', { name: 'Raydium CLMM', type: 'clmm' }],
]);

// Token program IDs that indicate token approval instructions
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_2022 = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

function detectAmmTypeFromIds(programIds: string[]): AmmType {
  let detected: AmmType = 'unknown';
  for (const pid of programIds) {
    const info = AMM_REGISTRY.get(pid);
    if (info) {
      if (info.type === 'constant-product') return 'constant-product';
      if (info.type === 'clmm') detected = 'clmm';
      else if (detected === 'unknown') detected = info.type;
    }
  }
  return detected;
}

function computeRiskScore(programIds: string[], ammType: AmmType): number {
  const hasUnknown = programIds.some((pid) => !AMM_REGISTRY.has(pid) && pid !== TOKEN_PROGRAM && pid !== TOKEN_2022 && pid !== '11111111111111111111111111111111');
  const hasApproval = programIds.includes(TOKEN_PROGRAM) || programIds.includes(TOKEN_2022);
  if (hasUnknown && hasApproval) return 65;
  if (hasUnknown) return 45;
  if (ammType === 'unknown') return 30;
  return 10;
}

interface RawDecodeBody {
  rawBase64?: string;
}

export async function POST(request: NextRequest) {
  let body: RawDecodeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const { rawBase64 } = body;
  if (!rawBase64 || typeof rawBase64 !== 'string') {
    return NextResponse.json({ error: 'rawBase64 is required', code: 'BAD_REQUEST' }, { status: 400 });
  }

  let bytes: Buffer;
  try {
    bytes = Buffer.from(rawBase64, 'base64');
    if (bytes.length < 64) throw new Error('too short');
  } catch {
    return NextResponse.json({ error: 'Invalid base64 transaction', code: 'INVALID_SIG' }, { status: 400 });
  }

  try {
    let staticKeys: PublicKey[] = [];
    let compiledInstructions: Array<{ programIdIndex: number; accountKeyIndexes: number[] }> = [];

    // Try versioned transaction first, fallback to legacy
    try {
      const vtx = VersionedTransaction.deserialize(bytes);
      staticKeys = vtx.message.staticAccountKeys;
      compiledInstructions = vtx.message.compiledInstructions.map((ix) => ({
        programIdIndex: ix.programIdIndex,
        accountKeyIndexes: Array.from(ix.accountKeyIndexes),
      }));
    } catch {
      const ltx = Transaction.from(bytes);
      staticKeys = ltx.compileMessage().accountKeys;
      compiledInstructions = ltx.instructions.map((ix) => ({
        programIdIndex: ltx.compileMessage().accountKeys.findIndex((k) => k.equals(ix.programId)),
        accountKeyIndexes: ix.keys.map((km) =>
          ltx.compileMessage().accountKeys.findIndex((k) => k.equals(km.pubkey))
        ),
      }));
    }

    const programIds = compiledInstructions
      .map((ix) => staticKeys[ix.programIdIndex]?.toBase58())
      .filter((pid): pid is string => !!pid);

    const ammType = detectAmmTypeFromIds(programIds);
    const riskScore = computeRiskScore(programIds, ammType);

    // Without a confirmed tx we can't compute real balance diffs —
    // return approval-type entries for each unique program involved
    const diffs: AccountDiff[] = programIds
      .filter((pid, i, arr) => arr.indexOf(pid) === i && AMM_REGISTRY.has(pid))
      .map((pid) => ({
        owner: pid,
        mint: 'SOL',
        preBalance: 0,
        postBalance: 0,
        delta: 0,
        type: 'approval' as const,
      }));

    const knownNames = programIds
      .map((pid) => AMM_REGISTRY.get(pid)?.name)
      .filter(Boolean);
    const summary = knownNames.length > 0
      ? `Pre-signing analysis: calls ${knownNames.join(', ')}`
      : `Pre-signing analysis: ${programIds.length} program(s) involved`;

    const result: DecodedTransaction = {
      signature: 'unsigned',
      summary,
      diffs,
      riskScore,
      rawInstructions: compiledInstructions,
      ammType,
      programIds,
      blockTime: null,
    };

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to deserialize transaction: ${(err as Error).message}`, code: 'RPC_FAIL' },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sig = searchParams.get('sig');

  if (sig === 'recent') {
    const analyses = await getRecentAnalyses(10);
    return NextResponse.json(analyses);
  }

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing sig parameter', code: 'INVALID_SIG' },
      { status: 400 }
    );
  }

  if (!SIG_PATTERN.test(sig)) {
    return NextResponse.json(
      { error: 'Invalid transaction signature format', code: 'INVALID_SIG' },
      { status: 400 }
    );
  }

  try {
    const decoded = await decodeTransaction(sig);
    return NextResponse.json(decoded);
  } catch (err) {
    if (err instanceof DecodeError) {
      const status =
        err.code === 'INVALID_SIG'
          ? 400
          : err.code === 'NOT_FOUND'
          ? 404
          : 502;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return NextResponse.json(
      { error: 'Internal server error', code: 'UNKNOWN' },
      { status: 500 }
    );
  }
}
