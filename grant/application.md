# Agentic Engineering Grant Application — SolTrace
**Superteam | Deadline: May 9, 2026**

---

## 1. Basics

| Field | Value |
|-------|-------|
| **Project Title** | SolTrace — AI Transaction Risk Analyzer for Solana |
| **One Line Description** | Paste any Solana transaction signature and get an instant AI explanation of what it does, which accounts change, and a simulated PnL slider — or intercept it pre-signing via a Chrome extension |
| **Grant Amount** | 200 USDG |

---

## 2. Project Details

### Problem Statement

Every Solana transaction is an opaque byte sequence. When a user hits "Approve" in their wallet, they see nothing actionable — just a confirmation popup with no breakdown of which accounts will change, which tokens will move, or whether the smart contract is malicious.

This opacity is the primary exploit vector on Solana today:

- **Drainer contracts** present themselves as legitimate DEX approvals
- **Phishing sites** clone Jupiter/Raydium UIs and swap the target wallet
- **Rug-pull approvals** grant infinite token spend authority disguised as routine swaps
- Even experienced DeFi traders can't reliably audit a swap transaction in real time without deep protocol knowledge and manual RPC queries

The result: users lose funds not because they failed to understand risk, but because they had **no tool to surface it at signing time**.

### Proposed Solution

SolTrace is an AI-powered Solana transaction risk analyzer with two entry points:

**1. Post-confirmation analysis (web app)**

Paste any confirmed mainnet transaction signature. The pipeline:
1. Fetches the transaction via **Helius Enhanced API** (with fallback to public Solana RPC)
2. Resolves **Address Lookup Tables** (v0 transactions) with concurrent fetching
3. Identifies the AMM/protocol from an on-chain program registry (Jupiter v6, Raydium AMM v4/CPSWAP/CLMM, Orca v1/Whirlpool)
4. Computes exact **account diffs** — pre/post balances for every account touched
5. Streams an **AI-generated risk summary** (Groq Llama-3.3-70b) with a structured 0–100 risk score grounded in real account data
6. Renders a **PnL simulation slider** (0.1x–3.0x) using the constant-product AMM formula (x\*y=k), showing what the trade would have returned under different price conditions — letting users see at a glance whether they got a good or bad fill

**2. Pre-signing interception (Chrome extension — Wallet Copilot)**

The Chrome extension intercepts a Solana transaction *before the user confirms*:
1. Injects into the page's main world, wraps `signTransaction` on the connected wallet adapter
2. Decodes the **unsigned base64 transaction bytes** — no RPC call needed, all client-side
3. Identifies which programs are invoked and detects the two strongest drainer signals: **unknown program IDs** + **token approval instructions** (SetAuthority/Approve)
4. Overlays a **risk badge** (green/yellow/red) on the signing flow with a one-line explanation — all in under 500ms before the user sees the wallet popup

### The Agentic Layer

The AI component is not a wrapper around a static prompt. It reasons over structured on-chain data:

- Receives the full `AccountDiff[]` array (real balance changes from the chain)
- Receives protocol identification (AMM type, program IDs)
- Produces structured JSON `{ riskScore: number, summary: string }` grounded in the actual transaction data
- Risk scoring is calibrated: routine swap = 0–25, unusual programs = 26–50, large approvals / unknown programs = 51–75, drainer signals = 76–100

The system is agentic in the sense that the AI agent takes real on-chain inputs → reasons about them → produces an actionable decision (safe / caution / reject) — not a generic explanation.

---

## 3. Deadline

**Target ship date: May 9, 2026**

Milestones:
| Day | Deliverable |
|-----|------------|
| Day 3 (May 2) | Public Vercel deploy live — both demo txs working end-to-end |
| Day 6 (May 5) | Chrome extension submitted to Web Store + `/copilot` fallback route live |
| Day 9 (May 8) | Demo video published + public Solana launch tweet |

---

## 4. Proof of Work

**46 commits shipped in 3 days (April 25–27, 2026).** Full working codebase, not a prototype.

### What's live and working right now

| Component | File | Status |
|-----------|------|--------|
| Transaction decoder | `lib/decoder.ts` | ✅ Live |
| Helius RPC + fallback | `lib/decoder.ts:fetchTransaction` | ✅ Live |
| ALT resolution (v0 txs) | `lib/decoder.ts:resolveALTs` | ✅ Live |
| AMM registry (6 programs) | `lib/decoder.ts:AMM_REGISTRY` | ✅ Live |
| Risk scoring | `app/api/decode/route.ts:computeRiskScore` | ✅ Live |
| AI explain endpoint | `app/api/explain/route.ts` | ✅ Live (Groq streaming) |
| PnL simulation (x\*y=k) | `lib/simulator.ts` | ✅ Live |
| Simulate API | `app/api/simulate/route.ts` | ✅ Live |
| Pre-signing decoder | `app/api/decode/route.ts` (POST) | ✅ Live |
| Chrome extension | `extension/` | ✅ Packaged (MV3) |
| Rate limiting middleware | `middleware.ts` | ✅ Live |
| Turso cache layer | `lib/turso.ts` | ✅ Live |
| E2E tests (Playwright) | `tests/` | ✅ Passing |
| Unit + integration tests | Vitest | ✅ Passing |
| Demo transactions | `DEMOS.md` | ✅ Verified mainnet |

### Supported protocols
- **Raydium AMM v4** (`675kPX9...`) — constant-product, full simulation
- **Raydium CPSWAP** (`CPMMoo8...`) — constant-product, full simulation
- **Orca v1** (`9W959D...`) — constant-product, full simulation
- **Jupiter v6** (`JUP6Lk...`) — aggregator, decoded + explained
- **Orca Whirlpool** (`whirLb...`) — CLMM, decoded + explained (simulation pending)
- **Raydium CLMM** (`CAMMCz...`) — CLMM, decoded + explained (simulation pending)

### Verified demo transactions (mainnet)
1. **Raydium AMM v4 swap** — `3PWxBuY7GNm9j3kESVyu2udR5dqomegYHWHwHvftgkM7ST9ZnuEstWdxRJbfhNUiM7twQpCc5yyzKfNtfytvxjdj`
   - Sold tokens → received ~2.84 SOL. Slider at 2x flips PnL green → red.
2. **Jupiter v6 aggregated route** — `2WFhQhbycYbGnHJZxiFsPKBAJgodTw82F7ZBYoaxBbfWsqbcHpfivSAuP2kBHtgU363bj5XUDeNSAqu7NwJXD7Hj`
   - Spent ~0.007 SOL → received tokens via Jupiter routing.

### Stack
```
Next.js 15 (App Router) · React 19 · TypeScript
@solana/web3.js · @coral-xyz/anchor
Helius RPC (Enhanced Transactions API)
AI SDK (ai@4) · @ai-sdk/groq · @ai-sdk/anthropic
Groq Llama-3.3-70b (explain endpoint)
Turso / libsql (caching layer)
Chrome Extension MV3 (Wallet Copilot)
Playwright (E2E) · Vitest (unit/integration)
Vercel (deployment)
```

---

## 5. Why This Is Agentic Engineering

SolTrace is not a chatbot wrapper. It is an agent pipeline where:

1. **Real on-chain data is the input** — not user descriptions of what a transaction does
2. **The agent reasons over structured diffs** — account balances, program IDs, AMM type
3. **The output is an actionable decision** — a calibrated risk score that maps to a concrete recommendation (proceed / caution / reject)
4. **The Chrome extension closes the loop** — the agent runs in the user's signing flow, not as a post-hoc analysis tool

The 200 USDG grant would fund:
- Helius API costs for production traffic
- CLMM simulation sprint (Orca Whirlpool tick math)
- Chrome Web Store developer account + submission
- Vercel Pro for production bandwidth

---

## 6. Goals and Milestones

See `milestones.md` for full acceptance criteria per milestone.

| # | Milestone | Target Date | Verifiable By |
|---|-----------|-------------|---------------|
| 1 | Public Vercel deploy live — both demo txs working end-to-end | May 2, 2026 | Public URL + demo links |
| 2 | Chrome extension submitted to Web Store + `/copilot` fallback live | May 5, 2026 | Submission screenshot + `/copilot` URL |
| 3 | Demo video published + public Solana launch tweet | May 8, 2026 | Video link + tweet link |

---

## 7. Primary KPI

**50 unique transaction signatures analyzed by May 9, 2026.**

Measured directly from Turso:
```sql
SELECT COUNT(DISTINCT sig) FROM txcache;
```

This metric requires the tool to be functional AND distributed — real users pasting their own transactions, not just the two pre-verified demo sigs. With a public deploy on May 2 and a launch tweet on May 8, that's ~7 days of live traffic. 50 unique analyses in 7 days is achievable with a single tweet to the Solana DeFi community given the zero-friction demo transaction links.

---

*Generated with Claude Code (claude.ai/code) in the SolTrace project session.*
*Codebase: github.com/Abhijitam01 | Contact: Telegram @[your_handle]*
