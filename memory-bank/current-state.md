# Current State: Bounded (Utopia Hackathon)

Last updated: 2026-10-16.

## Contracts (`contracts/`)
- [x] `BoundedVault.sol`: propose with Auto / Pending / Blocked, circuit breaker, versioned policy and allowlist, AVAX + ERC-20, owner withdraw/freeze never blockable.
- [x] `MockUSDC.sol` (tUSDC, 6 decimals).
- [x] 23 unit tests + 5 invariant tests passing (`forge test`). Unaudited.
- [x] Deployed to **Avalanche Fuji C-Chain** (`chainId: 43113`) via `script/Deploy.s.sol` (see `DEPLOYMENT.md` and `src/config/deployments.json`):
  - `BoundedVault`: `0x2a838F197f877dAE39284aB0Ac26EB156ad638cD`
  - `tUSDC`: `0x3DF940d2402c9db33e48cAd93bD68b38d36B17d5`
  - Live Auto, Pending, and Blocked transactions verified on-chain on Snowtrace.

## Web app (`src/`)
- [x] Marketing pages: home, how-it-works, compare, pricing, security, roadmap, faq.
- [x] Simulated App tabs: overview, rules (editable integer inputs beside sliders, loosening confirm diff, policy history), agent console (strict schema, poisoned feed, scenarios), approvals (15 simulated-minute expiry), receipts (filters, search, raw JSON, CSV).
- [x] Live on Fuji tab (`/app/live`, `src/views/LivePage.jsx`):
  - Server-side state reader via Viem (`src/lib/chain/server.js`, `/api/chain`) and contract event indexer via Routescan API.
  - Server-signed agent preset proposals (`/api/agent`) so `AGENT_PRIVATE_KEY` never leaves the server.
  - Browser wallet integration (`src/lib/chain/wallet.js`) for owner `approve`, `reject`, `freeze`, `unfreeze`, `setPolicy` (renew 24h), and `withdraw`.
- [x] Pure policy engine with 17 unit tests; honesty tests (banned claims, sourced numbers, single brand constant).
- [x] Light theme enforced across site and app; USDC/AVAX token marks and orange hero cards restored; mobile layout checked at 390px.
- [x] Documentation & Presenter Guides: `DEPLOYMENT.md` and `DEMO.md`.

## Verification commands
- `npm test` (engine + honesty), `npx eslint src tests`, `npm run build`, `cd contracts && forge test`.

## Known gaps
- Simulated tabs (`/app`, `/app/rules`, `/app/agent`, `/app/approvals`, `/app/receipts`) remain offline on the mock adapter by design so the prompt-injection scenario is always resettable; `/app/live` is the real on-chain tab.
- The contract lacks the demo engine's extra rules (max-%-of-vault cap, fee cap, and split over-limit reasons).
- Lighthouse, keyboard-only and reduced-motion runs not yet measured.
- `metadataBase` unset, so the OG image URL resolves to localhost.
