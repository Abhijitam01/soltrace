# TODOS

## Engineering

### Helius Enhanced Transactions API — pre-evaluation spike

**What:** Before building the full IDL-based decoder in Week 1 Step 2, spend 1 hour evaluating whether Helius's Enhanced Transactions API returns pre-decoded human-readable data that replaces significant decoder work.

**Why:** Helius Enhanced Transactions parses common program instructions (Jupiter swaps, token transfers, NFT sales) into structured JSON without requiring manual IDL lookup. If it covers SolTrace's target programs (Jupiter, Raydium, Orca), the decoder becomes a thin adapter rather than a full IDL parser — saves 2-3 days of implementation.

**Context:** The current plan builds a full decoder with Anchor IDL registry lookup and raw instruction parsing. Helius's Enhanced API (`/v0/transactions?commitment=finalized`) may already do this for the top 5 programs. Run a 1-hour spike against a known Raydium v4 swap tx and a known Orca Whirlpool tx. If the API returns structured account diffs for both, adapt the decoder to use it as primary source and IDL as fallback. If not, proceed with the IDL plan as-is.

**Effort:** S
**Priority:** P1
**Depends on:** Nothing — run before writing any decoder code

---

### CLMM simulation support (if Week 1 PoC gate fails)

**What:** If the CLMM PoC gate in Week 1 Step 0 fails (SDK can't work with historical reserve state), implement CLMM simulation via an alternative approach: fetch historical tick array accounts separately and reconstruct pool state without the SDK.

**Why:** Orca Whirlpools and Raydium CLMM represent the majority of Solana DEX volume in 2026. Showing "CLMM simulation unavailable" for 50%+ of swap transactions is a significant UX gap. Worth a dedicated sprint to resolve.

**Context:** The Week 1 PoC gate will determine if `@orca-so/whirlpools-sdk` / `@raydium-io/raydium-sdk-v2` work with historical `sqrtPriceX64` + `liquidity` values from `getTransaction` meta. If the SDK requires current on-chain state, the alternative is to call `getAccountInfo` for the tick array accounts referenced in the tx, reconstruct the pool state manually, and run tick math without the SDK abstraction. This is higher effort but eliminates the SDK dependency on current state. If PoC gate succeeds, this TODO is auto-resolved.

**Effort:** L
**Priority:** P2
**Depends on:** Week 1 Step 0 PoC gate result

---

## Distribution

### Chrome extension — Web Store submission

**What:** Package and submit the SolTrace Chrome extension (Wallet Copilot feature) to the Chrome Web Store. Includes writing a reviewer-friendly description that explains the legitimate use case.

**Why:** Chrome review takes 3-7 days. Extensions hooking into wallet signing flows are commonly flagged. Starting the submission early reduces time-to-ship and gives time to appeal or adjust if rejected.

**Context:** The extension uses `@solana/wallet-adapter-base` `signTransaction` override (not `window.solana` reassignment — chosen partly for reviewability). The description should make clear: (1) the extension is read-only — it analyzes transactions but never submits them, (2) no wallet keys are accessed, (3) the override only adds a risk overlay before the user confirms signing. If rejected, fallback is the manual paste-before-signing flow (same UX, no extension). Do not delay demo on extension approval.

**Effort:** M
**Priority:** P2
**Depends on:** MVP web app shipped and stable (Vercel deploy live)

---

---

## Design

### Demo transactions — document before recording demo video

**What:** Find and document 2-3 specific mainnet tx signatures that work well as demo transactions: clear SOL→token or token→USDC swap, constant-product AMM (Raydium v4 or Orca v1), older than 7 days. Create `DEMOS.md` in the project root with the signatures and labels.

**Why:** The demo video requires a reproducible "whoa moment" — paste sig → diffs load → slider flips PnL red to green. Without pre-verified signatures, demo prep becomes a scramble at the last minute.

**Context:** Signatures must be: (1) constant-product AMM (not CLMM) for confirmed slider support, (2) show a non-trivial SOL/token delta, (3) ideally include a swap where dragging the slider to +50% changes the PnL sign from negative to positive. Raydium v4 (`675kPX9...`) swaps are safest — x*y=k is fully implemented with no PoC dependency.

**Effort:** XS
**Priority:** P1
**Depends on:** Nothing — find these sigs before writing any UI code

---

### `/copilot` route — design the base64 tx input page

**What:** Design and build the `/copilot` route as the Chrome extension fallback. Accepts a base64-encoded raw Solana transaction (not a confirmed signature — the tx hasn't been broadcast yet), decodes it, and shows a risk overlay.

**Why:** Chrome Web Store review can reject extensions that hook into wallet signing flows. The fallback must be equally functional (same risk analysis, same Claude explanation) and usable without the extension.

**Context:** `/copilot` differs from the home page input: it accepts raw tx bytes (base64), not a confirmed tx sig. The decode pipeline needs a new entry point that calls `Transaction.from(Buffer.from(base64, 'base64'))` and processes `tx.instructions` directly without a `getTransaction` RPC call. Turso cache doesn't apply (unconfirmed tx). Claude prompt is the same. UI: textarea + "Analyze before signing" button + same diffs panel + risk badge.

**Effort:** M
**Priority:** P2
**Depends on:** Core decode engine (`lib/decoder.ts`) completed

---

## Completed

### Demo transactions — document before recording demo video

Completed — `DEMOS.md` created with three real confirmed mainnet signatures: a Raydium AMM v4 swap, a Jupiter v6 route, and an Orca Whirlpool swap.

---

### `/copilot` route — design the base64 tx input page

Completed — `app/copilot/page.tsx` built and live at `/copilot`. Accepts base64-encoded unsigned transaction bytes, calls `POST /api/decode`, and renders RiskBadge + AccountDiffTable + StreamingPanel. The Chrome extension uses the same `POST /api/decode` endpoint.
