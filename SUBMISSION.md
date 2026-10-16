# Submission kit (Hub form + deck outline)

Positioning: **x402 gives agents a way to pay. Bounded gives owners a way to say no.** Spending firewall for AI agents on Avalanche. Contract moves ERC-20/AVAX transfers only, so no "rail-agnostic" claim. No prices. DeFi/trading is roadmap.

## Hub form

**Short description (<=280):** Bounded is a spending firewall for AI agents on Avalanche. Your funds stay in your vault and the agent can only propose payments. A contract approves, asks you, or blocks each one, freezes a misbehaving agent, and logs every attempt on-chain. Live on Fuji testnet.

**Full description:** see "Full description" block below. **Vault (Fuji):** `0x2a838F197f877dAE39284aB0Ac26EB156ad638cD` (see DEPLOYMENT.md). **Repo:** https://github.com/agehcx/utopia-hackathon (make public).

### Full description
## The problem
AI agents are starting to hold and spend real money. Payment rails like x402 let agents pay, but nothing decides whether a payment should happen. A rule written in a prompt is a suggestion. A rule in a contract is not. (Add the Grok/Bankr May 2026 incident only with a verified source, marked "reported".)

## What Bounded does
The owner's funds stay in a vault contract on Avalanche. The agent holds a key that can only propose payments. For every proposal the contract decides:
- **Auto**: within per-payment and daily limits, to an allowlisted recipient. Paid instantly.
- **Ask**: valid recipient, over a limit. Waits for the owner's approval.
- **Block**: anything else. Nothing moves; the reason is recorded on-chain.
- **Freeze**: repeated blocks inside a time window freeze the agent automatically.
The owner can freeze, change rules, or withdraw at any time. Every decision is an on-chain event shown as a receipt timeline.

## What is live
A vault on Avalanche Fuji. The Live page sends real testnet transactions signed by the agent key: pay within limits (Auto), pay over the limit (Ask, approved from the owner's wallet), send to a non-allowlisted address (Block).

## What is simulated
The "data service" is an x402-style recipient, not a real x402 facilitator. The /app tabs other than Live run a local simulation.

## Known limits
Bounded caps losses; it does not promise profit. It cannot protect against an allowlisted recipient that turns malicious, an owner approving a bad request, or a stolen owner key. Not built yet: request expiry, revalidation on approve, idempotency, rate limits, selector/calldata rules (needed for DEX calls).

## Next
Rate limits and idempotency, selector/calldata rules, USD limits, multisig owner, real x402 facilitator integration. Hypothesis to test: would teams running x402 agents pay for hosted approvals and alerts.

### How it's made
Solidity vault (Foundry, 28 tests) on Avalanche Fuji. Agent runs server-side with a key that can only call `propose`. Owner connects a wallet on Fuji to set rules, approve, freeze, withdraw. Next.js app (viem) reads contract events every 10s into the receipt timeline; every Auto/Ask/Block links to a Fuji tx. Blocked proposals do not revert, so the reason and breaker counter persist on-chain.

**Tech:** Solidity, Foundry, JavaScript, Next.js, React, viem, Avalanche Fuji.
**Screenshots:** Live page; Rules; BLOCK receipt with tx; Ask approval; layer diagram.
**Built during the hackathon?** Tick honestly and say which parts pre-date 15 Oct.

## Deck (12 slides)
1 Title + line + "Live on Fuji" · 2 Problem (verified incident, "reported") · 3 x402 pays, nobody says no (Agent -> Bounded -> Wallet -> x402/transfer) · 4 Auto/Ask/Block/Freeze · 5 Live on Fuji (screenshot, vault, tx links) · 6 Why the AI can't skip rules (propose-only key, no chat, limits in contract) · 7 Use cases: #1 per-request data purchases, #2 team agent ops, #3 AI allowance; roadmap: agent-to-agent, platform SDK · 8 Impact: loss ceiling (proven), more delegation (hypothesis), audit receipts · 9 Honest comparison (hot wallet, x402 SDK limits, PolicyLayer/Privy/Fireblocks, Safe/Zodiac; say what they also do) · 10 Business: contract free; alerts/approvals hypothesis; kill if <2 of 10 teams pay/deposit · 11 Roadmap + limits · 12 Close line + link.

## Judge Q&A
- vs x402? x402 is paying; Bounded decides whether to pay.
- Why not small hot wallet? Good baseline, but it can still send that balance anywhere and the owner never sees attempts.
- PolicyLayer/Privy/Fireblocks? Yes they have policies. Ours lives in a public contract not tied to a vendor, with block receipts, breaker, approval inbox.
- Who pays? Unknown; hypothesis. Kill criterion above.
- Can't protect against? Malicious allowlisted recipient, bad owner approval, stolen owner key.
- Real x402? No: x402-style demo, no facilitator.

## Before stage
Renew rules (Live -> "Renew rules 24 h") — they expire ~10:02 local on Oct 17. Daily limit 10 tUSDC (~4 used). Unfreeze after the freeze demo. Record a backup video.
