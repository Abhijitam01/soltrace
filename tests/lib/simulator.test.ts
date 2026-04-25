import { describe, it, expect } from 'vitest';
import { simulateConstantProduct, calculatePnl } from '../../lib/simulator';
import { SimulateError } from '../../lib/errors';
import type { AccountDiff } from '../../lib/types';

const baseDiffs: AccountDiff[] = [
  {
    owner: 'Alice11111111111111111111111111111111111111',
    mint: 'TokenA1111111111111111111111111111111111111',
    preBalance: 100,
    postBalance: 90,
    delta: -10,
    type: 'token',
  },
  {
    owner: 'Alice11111111111111111111111111111111111111',
    mint: 'TokenB1111111111111111111111111111111111111',
    preBalance: 0,
    postBalance: 5,
    delta: 5,
    type: 'token',
  },
];

describe('simulateConstantProduct', () => {
  it('returns pnlDelta of exactly 0 at 1.0x (not -0)', () => {
    const result = simulateConstantProduct(baseDiffs, 1.0);
    expect(Object.is(result.pnlDelta, -0)).toBe(false);
    expect(result.pnlDelta).toBe(0);
  });

  it('returns positive pnlDelta when multiplier > 1.0', () => {
    const result = simulateConstantProduct(baseDiffs, 1.5);
    // More input → more output from constant-product
    expect(result.pnlDelta).toBeGreaterThan(0);
  });

  it('returns negative pnlDelta when multiplier < 1.0', () => {
    const result = simulateConstantProduct(baseDiffs, 0.5);
    expect(result.pnlDelta).toBeLessThan(0);
  });

  it('throws INVALID_MULTIPLIER for value below 0.1', () => {
    expect(() => simulateConstantProduct(baseDiffs, 0.05)).toThrow(SimulateError);
    try {
      simulateConstantProduct(baseDiffs, 0.05);
    } catch (e) {
      expect((e as SimulateError).code).toBe('INVALID_MULTIPLIER');
    }
  });

  it('throws INVALID_MULTIPLIER for value above 3.0', () => {
    expect(() => simulateConstantProduct(baseDiffs, 3.5)).toThrow(SimulateError);
  });

  it('passes through non-token diffs unchanged', () => {
    const withSol: AccountDiff[] = [
      ...baseDiffs,
      {
        owner: 'Alice11111111111111111111111111111111111111',
        mint: 'SOL',
        preBalance: 1,
        postBalance: 0.99,
        delta: -0.01,
        type: 'SOL',
      },
    ];
    const result = simulateConstantProduct(withSol, 1.2);
    const solDiff = result.diffs.find((d) => d.mint === 'SOL');
    expect(solDiff?.delta).toBe(-0.01);
  });

  it('output within expected constant-product range for known inputs', () => {
    // input: 10, reserveIn: 100, reserveOut: 50 => output = (50 * 10) / (100 + 10) = 4.545...
    const result = simulateConstantProduct(baseDiffs, 1.0);
    const outputDiff = result.diffs.find((d) => d.delta > 0);
    expect(outputDiff).toBeDefined();
    // At 1.0x the result approaches the original x*y=k output
    expect(outputDiff!.delta).toBeGreaterThan(0);
  });
});

describe('calculatePnl', () => {
  it('returns 0 when original and simulated are identical', () => {
    const result = calculatePnl(baseDiffs, baseDiffs);
    expect(result).toBe(0);
  });

  it('returns positive delta when simulation yields more output', () => {
    const simulated: AccountDiff[] = baseDiffs.map((d) =>
      d.delta > 0 ? { ...d, delta: 7.5, postBalance: d.preBalance + 7.5 } : d
    );
    const result = calculatePnl(baseDiffs, simulated);
    expect(result).toBeCloseTo(2.5, 6);
  });

  it('returns negative delta when simulation yields less output', () => {
    const simulated: AccountDiff[] = baseDiffs.map((d) =>
      d.delta > 0 ? { ...d, delta: 3, postBalance: d.preBalance + 3 } : d
    );
    const result = calculatePnl(baseDiffs, simulated);
    expect(result).toBeCloseTo(-2, 6);
  });
});
