# Hub form: ready to paste

Fields in form order. `[ ]` = you fill in.

## Description (Markdown)

```
## The problem
AI agents are starting to hold and spend real money. Payment rails like x402 let an agent pay, but nothing decides whether a payment *should* happen. A rule written in a prompt is a suggestion. A rule in a contract is not.

## What Bounded does
**x402 gives agents a way to pay. Bounded gives owners a way to say no.**

Your funds stay in a vault contract on Avalanche. The agent holds a key that can only *propose* payments. For every proposal the contract decides:

- **Auto**: within the per-payment and daily limits, to an allowlisted recipient. Paid instantly.
- **Ask**: valid recipient, but over a limit. Waits for the owner to approve.
- **Block**: anything else. Nothing moves, and the reason is recorded on-chain.
- **Freeze**: repeated blocks inside a time window freeze the agent automatically.

The owner can freeze, change rules, or withdraw at any time. Every decision is an on-chain event, shown as a receipt timeline.

## What is live
A vault on Avalanche Fuji testnet. The Live page sends real transactions signed by the agent key: pay within limits (Auto), pay over the limit (Ask, approved from the owner's wallet), and send to a non-allowlisted address (Block). Every result links to a real Fuji transaction.

## What is simulated
The "data service" is an x402-style recipient, not a real x402 facilitator. The other app tabs run a local simulation and are labeled as such.

## Limits
Bounded caps losses; it does not promise profit. It cannot protect against an allowlisted recipient that turns malicious, an owner approving a bad request, or a stolen owner key. Not built yet: request expiry, idempotency, rate limits, and function-selector rules (needed for DEX or DeFi calls).

## Next
Rate limits and idempotency, selector/calldata rules, USD limits, multisig owner, a real x402 facilitator integration. Open question we want to test: would teams running x402 agents pay for hosted approvals and alerts?
```

## Status
**Testnet / beta**

## Launch date
Leave empty (no mainnet or public launch).

## Country
Thailand

## Categories
- **Developer Tooling** (main)
- **DeFi** (agent payments)

## Technologies to tick
Solidity, React, Next.js, Node.js, Foundry, viem, Avalanche L1

Do **not** tick: x402 (demo is x402-style only, no facilitator), Account Abstraction, TypeScript (the app is JavaScript), Rust, Go, Python, PostgreSQL, Docker, Hardhat, wagmi.
If Avalanche L1 feels wrong for a C-Chain deployment, add "Avalanche C-Chain (Fuji)" as a custom tag.

## How it's made (Markdown)

```
## Stack
- **Solidity + Foundry**: `BoundedVault` holds AVAX and ERC-20 funds and enforces policy. 28 tests, including invariant fuzzing (128,000 calls per invariant).
- **Avalanche Fuji (C-Chain)**: deployed and verified. Proposals cost about 2e-8 AVAX in gas.
- **Next.js + React + viem**: owner dashboard and a Live page that reads contract state and events every 10 seconds.
- **Server-held agent key**: the agent runs behind a Next.js API route. The key can only call `propose`, and only with fixed presets.
- **Owner wallet**: the owner connects a wallet on Fuji to approve or reject requests, freeze, unfreeze, renew rules and withdraw.

## Worth highlighting
- **Blocked proposals do not revert.** A revert would roll back the log. The contract returns cleanly and emits `Decided(id, Blocked, reason)`, so every attempt and its reason is permanent on-chain.
- **Rate-based circuit breaker.** N blocks inside a time window freeze the agent without the owner online.
- **Versioned allowlist.** Each `setPolicy` bumps a version, so old allowlist entries are invalidated without looping over storage.
- **Owner sovereignty.** Withdraw, freeze and reject never depend on agent or policy state; an invariant test fuzzes this.
- **Honesty enforced by a test.** A test fails the build if the site makes banned claims or leaves simulated parts unlabeled.
```

## Repository
https://github.com/agehcx/utopia-hackathon  (**must be public**; check in a private window)

## Contract address
Vault: `0x2a838F197f877dAE39284aB0Ac26EB156ad638cD` (Avalanche Fuji, chain 43113)
Snowtrace: https://testnet.snowtrace.io/address/0x2a838F197f877dAE39284aB0Ac26EB156ad638cD
Also in DEPLOYMENT.md: tUSDC `0x3DF940d2402c9db33e48cAd93bD68b38d36B17d5`.

## Demo link
`[your deployed site URL]/app/live`  (or your Google Drive deck, set to "Anyone with the link can view")

## Video
`[YouTube / Loom link]`: at least 720p, clear audio, no background music. Record with `npm run demo` (see DEMO.md).

## Cover image (16:9)
The home hero, or the logo on the paper background. Crop to 16:9.

## Screenshots (up to 5, 16:9)
1. Live page: stats, agent buttons and receipts
2. Rules page
3. A BLOCK receipt with its tx link
4. Ask request waiting in the Owner panel
5. The layer diagram: Agent → Bounded → Wallet → payment

## Before you submit
- "Built during the hackathon?": tick honestly; say which parts pre-date 15 Oct.
- Open every link in a private window.
- Only call it "x402" where it says x402-style.
