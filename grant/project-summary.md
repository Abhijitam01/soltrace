# SolTrace — Project Summary
**Agentic Engineering Grant | Superteam | April 2026**

---

## What it is

SolTrace makes Solana transactions human-readable. Paste a transaction signature (or intercept one pre-signing via a Chrome extension) and get:

- **Account diffs** — exactly which accounts change and by how much
- **AI risk score** (0–100) — grounded in real on-chain data, not guesswork
- **Protocol identification** — Jupiter, Raydium, Orca automatically detected
- **PnL simulation slider** — drag 0.5x → 2x to see best/worst outcomes on the same trade

## The agentic piece

The AI agent receives structured on-chain data (account diffs, program IDs, AMM type) and reasons over it to produce `{ riskScore, summary }`. The Chrome extension runs this agent inline in the wallet signing flow — before the user approves anything.

## Ship velocity

46 commits in 3 days. Not a prototype — full decoder, AI explain endpoint, simulation engine, Chrome extension (MV3), rate limiting, Turso cache, Playwright E2E tests, and Vitest unit tests all working.

## Protocols supported

| Protocol | Type | Simulation |
|----------|------|-----------|
| Raydium AMM v4 | constant-product | ✅ Full x\*y=k |
| Raydium CPSWAP | constant-product | ✅ Full x\*y=k |
| Orca v1 | constant-product | ✅ Full x\*y=k |
| Jupiter v6 | aggregator | ✅ Decoded + explained |
| Orca Whirlpool | CLMM | Decoded (sim in progress) |
| Raydium CLMM | CLMM | Decoded (sim in progress) |

## What the 200 USDG funds

Helius API costs · CLMM simulation sprint · Chrome Web Store submission · Vercel Pro
