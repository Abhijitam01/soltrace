# Demo Transactions

Verified mainnet transaction signatures for testing SolTrace. Both sigs confirmed via Helius Enhanced API (April 2026).

## Raydium AMM v4 — token sell for SOL

**Signature:** `3PWxBuY7GNm9j3kESVyu2udR5dqomegYHWHwHvftgkM7ST9ZnuEstWdxRJbfhNUiM7twQpCc5yyzKfNtfytvxjdj`

- **Source:** RAYDIUM (program `675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8`)
- **What happened:** Sold tokens (mint `CoRAitPvr9seu5F9Hk39vbjqA1o1XuoryHjSk1Z1q2mo`) → received ~2.84 SOL
- **Slider at 2x:** Simulated output doubles to ~5.68 SOL (positive PnL delta)
- **Slider at 0.5x:** Simulated output halves to ~1.42 SOL (negative PnL delta)

## Jupiter v6 — SOL to token aggregated route

**Signature:** `2WFhQhbycYbGnHJZxiFsPKBAJgodTw82F7ZBYoaxBbfWsqbcHpfivSAuP2kBHtgU363bj5XUDeNSAqu7NwJXD7Hj`

- **Source:** JUPITER (program `JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4`)
- **What happened:** Spent ~0.007 SOL → received tokens (mint `FqSxniFXc3AeRAkcs3vvZ6`, 6 decimals) via Jupiter aggregated routing
- **Slider at 2x:** Token output doubles (simulated at better pool price)
- **Slider at 0.5x:** Token output halves

## Orca Whirlpool CLMM

No sig yet — CLMM simulation is pending PoC gate. When a Whirlpool sig is added here, update `app/page.tsx` DEMO_TXS and the `/simulate` page with a third demo link.

## Finding new demo signatures

```bash
# Raydium v4 recent swaps with SOL amounts > 1 SOL:
curl "https://api.helius.xyz/v0/addresses/675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8/transactions?api-key=$HELIUS_API_KEY&limit=10&type=SWAP"

# Jupiter v6 recent swaps:
curl "https://api.helius.xyz/v0/addresses/JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4/transactions?api-key=$HELIUS_API_KEY&limit=10&type=SWAP"
```

Select sigs where `events.swap.nativeInput` or `events.swap.nativeOutput` > 0.1 SOL for a clear PnL flip at 2×.
