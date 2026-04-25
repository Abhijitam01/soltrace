import { SimulateError } from './errors';
import type { AccountDiff, SimulationResult } from './types';

export function simulateConstantProduct(
  diffs: AccountDiff[],
  multiplier: number
): SimulationResult {
  if (multiplier < 0.1 || multiplier > 3.0) {
    throw new SimulateError(
      'INVALID_MULTIPLIER',
      `Multiplier must be between 0.1 and 3.0, got ${multiplier}`
    );
  }

  const tokenDiffs = diffs.filter((d) => d.type === 'token');

  if (tokenDiffs.length === 0) {
    return { multiplier, diffs, pnlDelta: 0 };
  }

  // Separate inbound (positive delta) and outbound (negative delta) legs
  const inbound = tokenDiffs.filter((d) => d.delta > 0);
  const outbound = tokenDiffs.filter((d) => d.delta < 0);

  if (inbound.length === 0 || outbound.length === 0) {
    return { multiplier, diffs, pnlDelta: 0 };
  }

  // For x*y=k: if input price changes by `multiplier`, scale the input amount
  // and compute new output via constant-product formula.
  const inputAmount = Math.abs(outbound[0].delta);
  const outputAmount = Math.abs(inbound[0].delta);

  // Derive consistent implied reserves so the formula reproduces outputAmount exactly at 1.0x.
  // If kRatio = reserveIn / inputAmount, then reserveOut = outputAmount * (kRatio + 1)
  // ensures: (reserveOut * inputAmount) / (reserveIn + inputAmount) = outputAmount
  const kRatio = 10;
  const reserveIn = inputAmount * kRatio;
  const reserveOut = outputAmount * (kRatio + 1);

  const scaledInput = inputAmount * multiplier;
  // x*y=k: newReserveIn * newReserveOut = k
  const newOutputAmount = (reserveOut * scaledInput) / (reserveIn + scaledInput);

  const simulatedDiffs: AccountDiff[] = diffs.map((d) => {
    if (d.type !== 'token') return d;
    if (d === outbound[0]) {
      const newDelta = -scaledInput;
      return { ...d, delta: newDelta, postBalance: d.preBalance + newDelta };
    }
    if (d === inbound[0]) {
      return { ...d, delta: newOutputAmount, postBalance: d.preBalance + newOutputAmount };
    }
    return d;
  });

  const pnlRaw = newOutputAmount - outputAmount;
  const pnlDelta = Math.abs(pnlRaw) < 1e-9 ? 0 : pnlRaw;

  return { multiplier, diffs: simulatedDiffs, pnlDelta };
}

export function calculatePnl(
  original: AccountDiff[],
  simulated: AccountDiff[]
): number {
  const originalOut = original
    .filter((d) => d.type === 'token' && d.delta > 0)
    .reduce((sum, d) => sum + d.delta, 0);

  const simulatedOut = simulated
    .filter((d) => d.type === 'token' && d.delta > 0)
    .reduce((sum, d) => sum + d.delta, 0);

  const raw = simulatedOut - originalOut;
  return Math.abs(raw) < 1e-9 ? 0 : raw;
}
