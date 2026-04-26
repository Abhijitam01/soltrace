import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { DecodedTransaction, SimulationResult } from '../../lib/types';

const mockDecoded: DecodedTransaction = {
  signature: 'abc123',
  summary: 'Token swap',
  diffs: [],
  riskScore: 10,
  rawInstructions: [],
  programIds: [],
  ammType: 'constant-product',
  blockTime: 1700000000,
};

const mockSimResult: SimulationResult = {
  multiplier: 1.5,
  diffs: [],
  pnlDelta: 2.5,
};

function mockFetchOk(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  } as unknown as Response);
}

function mockFetchError(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response);
}

function mockFetchNetworkError() {
  return vi.fn().mockRejectedValue(new Error('Network error'));
}

describe('useDecodeTransaction', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with null data, not loading', async () => {
    const { useDecodeTransaction } = await import('../../lib/hooks/useDecodeTransaction');
    const { result } = renderHook(() => useDecodeTransaction());
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets data and clears loading on successful decode', async () => {
    vi.stubGlobal('fetch', mockFetchOk(mockDecoded));
    const { useDecodeTransaction } = await import('../../lib/hooks/useDecodeTransaction');
    const { result } = renderHook(() => useDecodeTransaction());

    await act(async () => {
      await result.current.decode('validSig123');
    });

    expect(result.current.data).toEqual(mockDecoded);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error from response body on 4xx', async () => {
    vi.stubGlobal('fetch', mockFetchError(400, { error: 'Invalid signature format', code: 'INVALID_SIG' }));
    const { useDecodeTransaction } = await import('../../lib/hooks/useDecodeTransaction');
    const { result } = renderHook(() => useDecodeTransaction());

    await act(async () => {
      await result.current.decode('badsig');
    });

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Invalid signature format');
  });

  it('sets generic error on network failure', async () => {
    vi.stubGlobal('fetch', mockFetchNetworkError());
    const { useDecodeTransaction } = await import('../../lib/hooks/useDecodeTransaction');
    const { result } = renderHook(() => useDecodeTransaction());

    await act(async () => {
      await result.current.decode('anySig');
    });

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Network error — please try again');
  });

  it('resets data on consecutive calls', async () => {
    const firstDecoded = { ...mockDecoded, signature: 'first' };
    const secondDecoded = { ...mockDecoded, signature: 'second' };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(firstDecoded) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(secondDecoded) });
    vi.stubGlobal('fetch', fetchMock);

    const { useDecodeTransaction } = await import('../../lib/hooks/useDecodeTransaction');
    const { result } = renderHook(() => useDecodeTransaction());

    await act(async () => { await result.current.decode('sig1'); });
    expect(result.current.data?.signature).toBe('first');

    await act(async () => { await result.current.decode('sig2'); });
    expect(result.current.data?.signature).toBe('second');
  });
});

describe('useSimulation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with null data, not loading', async () => {
    const { useSimulation } = await import('../../lib/hooks/useSimulation');
    const { result } = renderHook(() => useSimulation());
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.clmmUnavailable).toBe(false);
  });

  it('sets data on successful simulation', async () => {
    vi.stubGlobal('fetch', mockFetchOk(mockSimResult));
    const { useSimulation } = await import('../../lib/hooks/useSimulation');
    const { result } = renderHook(() => useSimulation());

    await act(async () => {
      await result.current.simulate([], 1.5, 'constant-product');
    });

    expect(result.current.data).toEqual(mockSimResult);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.clmmUnavailable).toBe(false);
  });

  it('sets clmmUnavailable when server returns that flag', async () => {
    vi.stubGlobal('fetch', mockFetchOk({ clmmUnavailable: true }));
    const { useSimulation } = await import('../../lib/hooks/useSimulation');
    const { result } = renderHook(() => useSimulation());

    await act(async () => {
      await result.current.simulate([], 1.0, 'clmm');
    });

    expect(result.current.clmmUnavailable).toBe(true);
    expect(result.current.aggregatorUnavailable).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('sets aggregatorUnavailable when server returns that flag', async () => {
    vi.stubGlobal('fetch', mockFetchOk({ aggregatorUnavailable: true }));
    const { useSimulation } = await import('../../lib/hooks/useSimulation');
    const { result } = renderHook(() => useSimulation());

    await act(async () => {
      await result.current.simulate([], 1.0, 'aggregator');
    });

    expect(result.current.aggregatorUnavailable).toBe(true);
    expect(result.current.clmmUnavailable).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('does not set state after AbortError (rapid successive calls)', async () => {
    let rejectFn: (err: Error) => void;
    const abortable = new Promise<Response>((_, reject) => { rejectFn = reject; });
    const fetchMock = vi.fn()
      .mockReturnValueOnce(abortable)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockSimResult) } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    const { useSimulation } = await import('../../lib/hooks/useSimulation');
    const { result } = renderHook(() => useSimulation());

    // Start first call
    act(() => { result.current.simulate([], 1.2, 'constant-product'); });
    // Start second call immediately (aborts the first)
    await act(async () => {
      await result.current.simulate([], 1.5, 'constant-product');
    });
    // Resolve the aborted first call with an AbortError
    act(() => { rejectFn(Object.assign(new Error('aborted'), { name: 'AbortError' })); });

    // Only the second call's result should be set
    expect(result.current.data).toEqual(mockSimResult);
  });
});
