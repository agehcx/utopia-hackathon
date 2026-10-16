# How to demo Bounded

Two modes in the app:

- **Simulated demo** (`/app`, `/app/rules`, `/app/agent`, `/app/approvals`, `/app/receipts`): works offline, resettable, shows every feature including the full prompt-injection story.
- **Live on Fuji** (`/app/live`): the real deployed contract. Every button is a real testnet transaction with a Snowtrace link.

Addresses and on-chain proof are in [DEPLOYMENT.md](DEPLOYMENT.md).

## Before you present

1. `.env` in the repo root must contain `AGENT_PRIVATE_KEY` (the agent's testnet key). It stays on the server; the browser never sees it.
2. Start the app: `npm run dev`, open http://localhost:3000.
3. In your browser wallet (Core or MetaMask), select the **owner** account `0xde34afF8D590fb9a9967d33Fa4a7Ed95d341A0EF` on **Avalanche Fuji C-Chain**.
4. Open `/app/live` and check **Agent status**:
   - **Rules expired** (the first rules expire 24 h after deploy): connect the wallet, click **Renew rules 24 h**, confirm.
   - **Frozen**: click **Unfreeze agent**.
5. Click **Reset demo** (top right) so the simulated tabs start clean.

Gas is tiny: one proposal costs about 0.00000002 test AVAX. The agent's 0.05 AVAX lasts for a very long time; you never need to top it up for a demo.

## 3-minute script

**1. The pitch (home page `/`, 20 s)**
"AI agents need to spend money. Today you either hand funds to a custodian or give the agent your keys with no ceiling. Bounded is the spending limit: the AI proposes, you set the rules, a contract enforces them."

**2. Simulated story (`/app/agent`, 60 s)**
- Click **Run normal day**: a sentiment API payment and a small swap go through (Auto). A bigger swap is over the limit, goes to Ask, and is approved.
- Click **Inject poisoned data**: point at the red feed item that tells the agent to send 45 tUSDC to `0x…dEaD`. The agent tries three times. Each try is **Blocked**; the third freezes the agent.
- Open **Overview**: "6 proposals: 2 auto, 1 approved, 3 blocked, agent frozen." Computed from the event log.
- Optional: **Rules** tab, raise a limit to show the confirm-diff dialog ("loosening needs your confirmation").

**3. It's real (`/app/live`, 60 s)**
- "Now the same thing on the real contract on Avalanche Fuji."
- Click **Pay 1 tUSDC to the data service**: Auto. Click the tx link to open Snowtrace.
- Click **Pay 5 tUSDC (over limit)**: Pending. It appears under **Owner**. Click **Approve** and sign in your wallet.
- Click **Send 1 tUSDC to 0x…dEaD (attack)**: Blocked, nothing moved, the reason is on-chain. "Blocks in window" goes up. Three blocks in one hour freeze the agent automatically. Show it, then **Unfreeze**.
- "The agent key can only call propose. Even if it's fully hijacked, the worst case is your limits."

**4. Close (20 s)**
"We cap losses; we don't promise profits. Next: real x402 top-ups and a platform SDK."

## What each live button does

| Button | Who signs | Contract call | Expected result |
|---|---|---|---|
| Pay 1 tUSDC | agent key (server) | `propose(tUSDC, dataService, 1)` | Auto, paid (until today's 10 tUSDC limit is used) |
| Pay 5 tUSDC | agent key (server) | `propose(tUSDC, dataService, 5)` | Pending request for the owner |
| Send to 0x…dEaD | agent key (server) | `propose(tUSDC, 0x…dEaD, 1)` | Blocked, counts toward the breaker |
| Approve / Reject | your wallet (owner) | `approve(i)` / `reject(i)` | Pending request paid / closed |
| Freeze / Unfreeze | your wallet (owner) | `freeze()` / `unfreeze()` | Agent stops / resumes; unfreeze resets the counter |
| Renew rules 24 h | your wallet (owner) | `setPolicy(expiry now+24h, same breaker, [dataService])` | Rules version +1, agent can propose again |
| Withdraw | your wallet (owner) | `withdraw(tUSDC, amount)` | Always works, even when frozen |

## Troubleshooting

- **"Pay 1" now goes to Ask**: today's 10 tUSDC daily limit is used up (fixed UTC day). Use Approve, or wait until 00:00 UTC.
- **Everything is Blocked with EXPIRED**: rules expired; click **Renew rules 24 h**.
- **Everything is Blocked with FROZEN**: click **Unfreeze agent**.
- **New receipts take a minute to appear**: events are read from the Routescan explorer API, which indexes a few blocks behind. Balances update immediately.
- **"Only the owner can run owner actions"**: switch your wallet to the owner account and reconnect.
- **"Live agent disabled"**: `AGENT_PRIVATE_KEY` is missing from `.env`; restart `npm run dev` after adding it.
- **Vault running low on tUSDC**: tUSDC is a test token with public `mint`. Mint to the owner, then deposit (or ask Claude to script it).
