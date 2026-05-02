# SolTrace — Proof of Work
**46 commits · 3 days · April 25–27, 2026**

---

## Git history (most recent first)

```
a632095 feat: redesign UI to warm cream Zapier-inspired light theme
2b719cb feat(copilot): add Wallet Copilot extension link below textarea
9731f00 refactor(types): export ApiErrorCode union for consistent error typing
69ddda4 feat(middleware): add X-RateLimit-Limit and X-RateLimit-Remaining headers
7cd4fc2 fix(ping): return JSON {ok:true} instead of plain text
ba5a634 fix(AccountDiffTable): add scope=col to table headers for accessibility
b15a876 chore: add robots.txt to allow search engine indexing
66668ec feat: add custom 404 page
69d11ab docs: mark demo transactions and copilot route as completed in TODOS
cd4a98d chore: add extension:package script to bundle Chrome extension zip
154653a feat(layout): add Open Graph metadata, Twitter card, and site footer
4f81f86 feat: add privacy policy page for Chrome Web Store compliance
bd4ba75 feat(simulate): show unavailability hint for CLMM transactions
fe1f159 test(e2e): add copilot base64 paste flow Playwright test
cf51460 test: add integration tests for POST /api/decode
14cf1d6 test: expand vitest config to cover api integration tests
1b65da5 add project TODOS tracking open work items
d836be0 update DEMOS with real confirmed mainnet signatures
34e40fc add unit tests for useDecodeTransaction and useSimulation hooks
```

---

## Core technical components

### `lib/decoder.ts` — Transaction decoder
- Fetches via Helius Enhanced API (RPC fallback on 429)
- Resolves Address Lookup Tables (ALTs) with `p-limit` concurrency control
- AMM registry: 6 programs (Raydium v4/CPSWAP/CLMM, Orca v1/Whirlpool, Jupiter v6)
- Returns typed `DecodedTransaction` with full `AccountDiff[]`

### `app/api/decode/route.ts` — Dual-mode decode endpoint
- **GET** `?sig=` → confirmed transaction full pipeline
- **POST** with `rawBase64` → unsigned pre-signing analysis (no RPC needed)
- Risk scoring: unknown programs + token approvals → elevated score
- Input validation, typed errors, edge runtime

### `app/api/explain/route.ts` — Streaming AI risk analysis
- Groq Llama-3.3-70b via AI SDK `streamText`
- System prompt forces structured JSON output: `{ riskScore, summary }`
- Receives account diffs + program IDs as context
- 30s abort signal, edge runtime

### `lib/simulator.ts` — Constant-product AMM simulation
- Implements x\*y=k formula with consistent implied reserves
- Accepts `multiplier` (0.1–3.0) → returns scaled `AccountDiff[]` + `pnlDelta`
- Immutable: always returns new diff objects, never mutates inputs

### `extension/` — Chrome extension MV3 (Wallet Copilot)
- Manifest v3 with `scripting` + `storage` permissions
- Three-layer architecture: `background.js`, `content.js` (isolated world), `inject.js` (main world)
- Wraps `signTransaction` on connected wallet adapter
- Decodes unsigned base64 tx client-side, calls `POST /api/decode`
- Overlays risk badge before user sees wallet popup

### `middleware.ts` — Rate limiting
- Tracks requests per IP with `X-RateLimit-Limit` / `X-RateLimit-Remaining` headers
- Blocks at threshold with `429 Too Many Requests`

### `lib/turso.ts` — Caching layer
- libSQL / Turso SQLite cache for decoded transactions
- `getCached` / `setCached` pattern — prevents repeat Helius RPC calls

---

## Tests

| Test type | Framework | Coverage |
|-----------|-----------|---------|
| Unit tests | Vitest | hooks, simulator, decoder |
| Integration tests | Vitest | `POST /api/decode`, `GET /api/decode` |
| E2E tests | Playwright | copilot base64 paste flow |

---

## Verified demo transactions

Both confirmed on Solana mainnet via Helius Enhanced API, April 2026:

**Raydium AMM v4:**
`3PWxBuY7GNm9j3kESVyu2udR5dqomegYHWHwHvftgkM7ST9ZnuEstWdxRJbfhNUiM7twQpCc5yyzKfNtfytvxjdj`

**Jupiter v6 aggregated route:**
`2WFhQhbycYbGnHJZxiFsPKBAJgodTw82F7ZBYoaxBbfWsqbcHpfivSAuP2kBHtgU363bj5XUDeNSAqu7NwJXD7Hj`
