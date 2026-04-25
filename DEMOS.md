# Demo Transactions

These are verified mainnet transaction signatures for testing SolTrace.

Replace these with real confirmed signatures once you have a HELIUS_API_KEY configured.
Run Gate A (Helius spike) first — see the plan file for instructions.

## Placeholders (replace with real sigs)

| Label | Signature |
|-------|-----------|
| Raydium AMM v4 swap | `<insert Raydium v4 swap sig here>` |
| Jupiter aggregated route | `<insert Jupiter v6 route sig here>` |
| Orca Whirlpool CLMM | `<insert Orca Whirlpool sig here>` |

## Finding real signatures

```bash
# Raydium v4: look for program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8
# via Helius or Solscan recent transactions

curl "https://api.helius.xyz/v0/addresses/675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8/transactions?api-key=$HELIUS_API_KEY&limit=5"
```
