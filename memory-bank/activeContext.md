# Active Context: Bounded (Utopia Hackathon)

## Current focus
- **Fuji Deployment & Live Chain Tab Complete**: `BoundedVault` (`0x2a838F197f877dAE39284aB0Ac26EB156ad638cD`) and `tUSDC` (`0x3DF940d2402c9db33e48cAd93bD68b38d36B17d5`) are live on Avalanche Fuji C-Chain (`43113`), with on-chain Auto, Pending, and Blocked transactions verified on Snowtrace (`DEPLOYMENT.md`).
- **Two-Mode App Architecture (`DEMO.md`)**:
  - **Simulated tabs** (`/app`, `/app/rules`, `/app/agent`, `/app/approvals`, `/app/receipts`): offline, resettable, demonstrates the full normal-day and prompt-injection stories.
  - **Live on Fuji tab** (`/app/live`): wired directly to the deployed Fuji contract via Viem, Routescan API, server-signed agent presets (`/api/agent`), and browser wallet owner actions.
- **x402 Spending Firewall Repositioning**: Repositioned home, pricing, FAQ, and compare copy around the x402 spending firewall (contract is free and self-hosted; hosted alerts/approvals unpriced; DeFi moved to roadmap; fee UI removed and default simulated fee set to 0).
- **UI Polish**: Always-light theme enforced, orange hero cards and USDC/AVAX token marks restored, and editable integer inputs aligned beside rule sliders.

## Decisions (defaults chosen where the spec was open)
- Daily limit uses a fixed UTC day (up to ~2x across midnight is a documented edge case).
- Ask requests auto-reject after 15 simulated minutes in the mock engine; rejections and expiries do not count toward the breaker.
- Contract is free & open-source ($0 for community self-hosting); hosted operator tier uses aligned 2 bps on executed auto-spend ($0 on blocks or idle balances); platform/enterprise tier provides fleet SDK and custom SLAs.
- Decentralization positioning clarified: unlike custodial CEX trading platforms (e.g., Bitget AI sub-accounts), Bounded is 100% non-custodial with sovereign on-chain EVM enforcement on Avalanche.
- Max %-of-vault cap is a soft limit (goes to Ask).
- Approved spends count toward the daily limit; proposals are tUSDC-only in the UI; `INSUFFICIENT_BALANCE` kept as an extra block reason to match the contract.
- Plain-language rule box not built (spec default OFF). Light theme is always active.

## Next
1. Bring the contract in line with the simulated engine's extra rules (vault-% cap, fee cap, split over-limit reasons) or keep documenting the gap.
2. Set `metadataBase`, run Lighthouse, keyboard and reduced-motion checks.
3. Optional: real x402 top-ups and platform SDK.
