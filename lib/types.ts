export type AmmType = 'constant-product' | 'clmm' | 'aggregator' | 'unknown';

export type ApiErrorCode = 'BAD_REQUEST' | 'INVALID_SIG' | 'NOT_FOUND' | 'RPC_FAIL' | 'RATE_LIMITED' | 'UNKNOWN';

export interface AccountDiff {
  owner: string;
  mint: string;
  preBalance: number;
  postBalance: number;
  delta: number;
  type: 'SOL' | 'token' | 'approval';
}

export interface DecodedTransaction {
  signature: string;
  summary: string;
  diffs: AccountDiff[];
  riskScore: number;
  rawInstructions: unknown[];
  ammType?: AmmType;
  programIds: string[];
  blockTime?: number | null;
}

export interface SimulationResult {
  multiplier: number;
  diffs: AccountDiff[];
  pnlDelta: number;
}

export interface AmmInfo {
  name: string;
  type: AmmType;
}
