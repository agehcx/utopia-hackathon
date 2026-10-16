# Active Context: Bounded (Utopia Hackathon)

## Current focus
The site and app were rebuilt to the "Bounded master revision" spec: spending-limit layer for AI agents, honesty rules enforced by tests, fully offline demo.

## Decisions (defaults chosen where the spec was open)
- Daily limit uses a fixed UTC day (up to ~2x across midnight is a documented edge case).
- Ask requests auto-reject after 15 simulated minutes; rejections and expiries do not count toward the breaker.
- x402-style payments carry no fee in the demo; fee = amount × min(2 bps, owner max) on executed swaps and transfers.
- Max %-of-vault cap is a soft limit (goes to Ask).
- Approved spends count toward the daily limit; proposals are tUSDC-only; `INSUFFICIENT_BALANCE` kept as an extra block reason to match the contract.
- Plain-language rule box not built (spec default OFF). Dark mode follows the system setting.

## Next
1. Deploy to Fuji with a funded testnet key, then add a wallet-connected chain adapter behind a flag.
2. Bring the contract in line with the engine (vault-% cap, split reasons) or keep documenting the gap.
3. Set `metadataBase`, run Lighthouse, keyboard and reduced-motion checks.
