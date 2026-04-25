export class DecodeError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'RPC_FAIL' | 'ALT_TIMEOUT' | 'INVALID_SIG',
    message: string
  ) {
    super(message);
    this.name = 'DecodeError';
  }
}

export class SimulateError extends Error {
  constructor(
    public readonly code: 'CLMM_UNAVAILABLE' | 'INVALID_MULTIPLIER',
    message: string
  ) {
    super(message);
    this.name = 'SimulateError';
  }
}
