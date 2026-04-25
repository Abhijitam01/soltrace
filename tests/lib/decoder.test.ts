import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DecodeError } from '../../lib/errors';

vi.mock('../../lib/turso', () => ({
  getCached: vi.fn().mockResolvedValue(null),
  setCached: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@solana/web3.js', async () => {
  const actual = await vi.importActual<typeof import('@solana/web3.js')>('@solana/web3.js');

  const mockGetTransaction = vi.fn();
  const mockGetAddressLookupTable = vi.fn();

  const Connection = vi.fn(() => ({
    getTransaction: mockGetTransaction,
    getAddressLookupTable: mockGetAddressLookupTable,
  }));

  return {
    ...actual,
    Connection,
    _mockGetTransaction: mockGetTransaction,
    _mockGetAddressLookupTable: mockGetAddressLookupTable,
  };
});

// 87 '1' chars — valid base58 length and charset, clearly fake
const VALID_SIG = '1'.repeat(87);
const INVALID_SIG = 'not-a-valid-sig';

describe('decodeTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws INVALID_SIG for malformed signature', async () => {
    const { decodeTransaction } = await import('../../lib/decoder');
    await expect(decodeTransaction(INVALID_SIG)).rejects.toMatchObject({
      code: 'INVALID_SIG',
    });
  });

  it('throws INVALID_SIG for empty string', async () => {
    const { decodeTransaction } = await import('../../lib/decoder');
    await expect(decodeTransaction('')).rejects.toMatchObject({
      code: 'INVALID_SIG',
    });
  });

  it('returns cached result without fetching RPC', async () => {
    const { getCached } = await import('../../lib/turso');
    const cached = {
      signature: VALID_SIG,
      summary: 'cached',
      diffs: [],
      riskScore: 0,
      rawInstructions: [],
      programIds: [],
    };
    vi.mocked(getCached).mockResolvedValueOnce(cached);

    const { decodeTransaction } = await import('../../lib/decoder');
    const result = await decodeTransaction(VALID_SIG);
    expect(result).toBe(cached);
    expect(getCached).toHaveBeenCalledWith(VALID_SIG);
  });

  it('throws NOT_FOUND when transaction does not exist on RPC', async () => {
    const solana = await import('@solana/web3.js');
    const mock = solana as unknown as { _mockGetTransaction: ReturnType<typeof vi.fn> };
    mock._mockGetTransaction.mockResolvedValue(null);

    const { decodeTransaction } = await import('../../lib/decoder');
    await expect(decodeTransaction(VALID_SIG)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('extracts SOL and token diffs from transaction meta', async () => {
    const solana = await import('@solana/web3.js');
    const mock = solana as unknown as {
      _mockGetTransaction: ReturnType<typeof vi.fn>;
      _mockGetAddressLookupTable: ReturnType<typeof vi.fn>;
    };

    const mockTx = buildMockTx();
    mock._mockGetTransaction.mockResolvedValue(mockTx);
    mock._mockGetAddressLookupTable.mockResolvedValue({ value: null });

    const { getCached } = await import('../../lib/turso');
    vi.mocked(getCached).mockResolvedValue(null);

    const { decodeTransaction } = await import('../../lib/decoder');
    const result = await decodeTransaction(VALID_SIG);

    expect(result.diffs.length).toBeGreaterThan(0);
    expect(result.signature).toBe(VALID_SIG);
  });
});

function buildMockTx() {
  const { PublicKey } = require('@solana/web3.js');
  const addr1 = new PublicKey('11111111111111111111111111111111');
  const addr2 = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

  return {
    blockTime: 1700000000,
    transaction: {
      message: {
        staticAccountKeys: [addr1, addr2],
        addressTableLookups: [],
        compiledInstructions: [{ programIdIndex: 1, accountKeyIndexes: [0], data: new Uint8Array() }],
      },
    },
    meta: {
      preBalances: [1_000_000_000, 0],
      postBalances: [999_000_000, 0],
      preTokenBalances: [],
      postTokenBalances: [
        {
          accountIndex: 0,
          mint: 'So11111111111111111111111111111111111111112',
          owner: addr1.toBase58(),
          uiTokenAmount: { uiAmountString: '10.5' },
        },
      ],
    },
  };
}
