import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  VersionedTransaction,
  TransactionMessage,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { NextRequest } from 'next/server';

// Mock turso so tests don't need a real DB connection
vi.mock('@/lib/turso', () => ({
  getCached: vi.fn().mockResolvedValue(null),
  setCached: vi.fn().mockResolvedValue(undefined),
  getRecentAnalyses: vi.fn().mockResolvedValue([]),
}));

function buildVersionedTxBase64(programId?: string): string {
  const payer = new PublicKey('11111111111111111111111111111111');
  const instructions = programId
    ? [
        SystemProgram.transfer({
          fromPubkey: payer,
          toPubkey: payer,
          lamports: LAMPORTS_PER_SOL,
        }),
        // Add a no-op instruction to the custom program to exercise AMM detection
        {
          programId: new PublicKey(programId),
          keys: [],
          data: Buffer.alloc(0),
        },
      ]
    : [
        SystemProgram.transfer({
          fromPubkey: payer,
          toPubkey: payer,
          lamports: LAMPORTS_PER_SOL,
        }),
      ];

  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: '11111111111111111111111111111111',
    instructions,
  }).compileToV0Message();

  return Buffer.from(new VersionedTransaction(message).serialize()).toString('base64');
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/decode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/decode', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 when rawBase64 is missing', async () => {
    const { POST } = await import('@/app/api/decode/route');
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('BAD_REQUEST');
  });

  it('returns 400 for invalid base64 payload', async () => {
    const { POST } = await import('@/app/api/decode/route');
    const res = await POST(makeRequest({ rawBase64: '!!!not-base64!!!' }));
    expect(res.status).toBe(400);
  });

  it('returns 200 with DecodedTransaction shape for a valid versioned tx', async () => {
    const { POST } = await import('@/app/api/decode/route');
    const rawBase64 = buildVersionedTxBase64();
    const res = await POST(makeRequest({ rawBase64 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      signature: 'unsigned',
      ammType: expect.any(String),
      diffs: expect.any(Array),
      riskScore: expect.any(Number),
      summary: expect.any(String),
    });
  });

  it('detects Raydium AMM v4 as constant-product', async () => {
    const { POST } = await import('@/app/api/decode/route');
    const raydiumV4 = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
    const rawBase64 = buildVersionedTxBase64(raydiumV4);
    const res = await POST(makeRequest({ rawBase64 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ammType).toBe('constant-product');
  });
});
