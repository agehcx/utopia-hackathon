# Current State: Bounded (Utopia Hackathon)

Last updated: 2026-10-16.

## Contracts (`contracts/`)
- [x] `BoundedVault.sol`: propose with Auto / Pending / Blocked, circuit breaker, versioned policy and allowlist, AVAX + ERC-20, owner withdraw/freeze never blockable.
- [x] `MockUSDC.sol` (tUSDC, 6 decimals).
- [x] 23 unit tests + 5 invariant tests passing (`forge test`). Unaudited.
- [x] `script/Deploy.s.sol` for Fuji (chain 43113) or local Anvil. Dry-run only; not yet broadcast to Fuji.

## Web app (`src/`)
- [x] Marketing pages: home, how-it-works, compare, pricing, security, roadmap, faq.
- [x] App: overview, rules (loosening confirm diff, policy history), agent console (strict schema, poisoned feed, scenarios), approvals (15 simulated-minute expiry), receipts (filters, search, raw JSON, CSV).
- [x] Pure policy engine with 17 unit tests; honesty tests (banned claims, sourced numbers, single brand constant).
- [x] Light and dark themes; mobile layout checked at 390px; browser click-through of normal day, injection, loosening dialog and reset passed.

## Verification commands
- `npm test` (engine + honesty), `npx eslint src tests`, `npm run build`, `cd contracts && forge test`.

## Known gaps
- No wallet / Fuji connection in the app (mock adapter only).
- The contract lacks the demo's max-%-of-vault cap, fee cap and split over-limit reasons.
- Lighthouse, keyboard-only and reduced-motion runs not yet measured.
- `metadataBase` unset, so the OG image URL resolves to localhost.
