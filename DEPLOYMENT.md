# Bounded on Avalanche Fuji (testnet)

Deployed 2026-10-16 to the Avalanche **Fuji C-Chain** (chain ID 43113). Testnet only, unaudited.

## Addresses

| What | Address | Explorer |
|---|---|---|
| BoundedVault | `0x2a838F197f877dAE39284aB0Ac26EB156ad638cD` | [Snowtrace](https://testnet.snowtrace.io/address/0x2a838F197f877dAE39284aB0Ac26EB156ad638cD) |
| tUSDC (MockUSDC, 6 decimals) | `0x3DF940d2402c9db33e48cAd93bD68b38d36B17d5` | [Snowtrace](https://testnet.snowtrace.io/address/0x3DF940d2402c9db33e48cAd93bD68b38d36B17d5) |
| Owner (deployer) | `0xde34afF8D590fb9a9967d33Fa4a7Ed95d341A0EF` | [Snowtrace](https://testnet.snowtrace.io/address/0xde34afF8D590fb9a9967d33Fa4a7Ed95d341A0EF) |
| Agent | `0x15070d38812b119285dD232c91EC28E1df55243C` | [Snowtrace](https://testnet.snowtrace.io/address/0x15070d38812b119285dD232c91EC28E1df55243C) |
| Allowlisted demo recipient ("data service") | `0x00000000000000000000000000000000000005e1` | [Snowtrace](https://testnet.snowtrace.io/address/0x00000000000000000000000000000000000005e1) |

The same addresses are in `src/config/deployments.json` for the app.

## Initial on-chain rules

| Rule | Value |
|---|---|
| Per payment (tUSDC) | 2 |
| Per day (tUSDC, fixed UTC day) | 10 |
| Circuit breaker | 3 blocked proposals within 1 hour freezes the agent |
| Policy expiry | 24 hours after deploy, then every proposal is blocked as `Expired` until the owner calls `setPolicy` again |
| Allowlist | the demo recipient only |
| Vault funding | 50 tUSDC deposited by the owner |

## Live proof (run 2026-10-16)

The agent key proposed three spends directly on Fuji. Each transaction succeeded and the vault decided on-chain:

| Proposal | Outcome | Reason | Transaction |
|---|---|---|---|
| 1 tUSDC to the allowlisted recipient | **Auto**: paid | None | [0x4c43c2b9…](https://testnet.snowtrace.io/tx/0x4c43c2b9cf6d398146b194a462c640359e2ba751cb1c1cdd2434a6d057b55010) |
| 5 tUSDC to the allowlisted recipient | **Pending**: waits for the owner (request index 0) | OverLimit (per payment is 2) | [0x2b103158…](https://testnet.snowtrace.io/tx/0x2b1031589193921a1fb74c5bdc4bf5d6891c546d85840454c00018216fc0e95a) |
| 1 tUSDC to `0x…dEaD` | **Blocked**: nothing moved | NotAllowlisted | [0x1ed20f2d…](https://testnet.snowtrace.io/tx/0x1ed20f2dd49472faea4b0537563a50cc289250a5a6e785c4322cf09d40632788) |

Balances after: vault 49 tUSDC, recipient 1 tUSDC, `0x…dEaD` 0 tUSDC. Blocked attempts do not revert; they emit `Decided(id, Blocked, reason)` so the attempt stays on the record. The breaker count is now 1 of 3.

Gas is tiny on Fuji: each proposal used about 123,000 gas at a 160 wei price, roughly 0.00000002 AVAX. The owner also sent the agent 0.05 test AVAX for gas, which is enough for a very large number of proposals ([0x69a77bfc…](https://testnet.snowtrace.io/tx/0x69a77bfc86963433658129c66764a4ead748754f7501f286cba65abab8c28f47)).

## How it works

1. The **owner** deposits funds into the vault and sets rules: per-payment and daily limits per token, an allowlist, an expiry and the circuit breaker.
2. The **agent** key can call exactly one function: `propose(token, to, amount)`. It never holds the funds.
3. The **vault** checks, in order: agent frozen, policy expired, recipient not allowlisted, over a limit, balance. It returns one outcome and emits `Proposed` then `Decided`:
   - **Auto**: within every rule, paid immediately.
   - **Pending**: allowlisted but over a limit, stored as a request for the owner.
   - **Blocked**: breaks a rule, nothing moves, counted by the breaker.
4. Three blocks inside one hour freeze the agent automatically (`AgentFrozen`). Only the owner can `unfreeze`.
5. The **owner** can always `approve(id)`, `reject(id)`, `freeze()`, `withdraw(token, amount)`, `setAgent` or `revokeAgent`, whatever the agent does.

Event codes: `Outcome` 0 Auto, 1 Pending, 2 Blocked. `Reason` 0 None, 1 Frozen, 2 Expired, 3 NotAllowlisted, 4 OverLimit, 5 InsufficientBalance.

## Try it yourself (cast)

```bash
set -a; . ./.env; set +a
R=https://api.avax-test.network/ext/bc/C/rpc
V=0x2a838F197f877dAE39284aB0Ac26EB156ad638cD
U=0x3DF940d2402c9db33e48cAd93bD68b38d36B17d5

# agent proposes 1 tUSDC to the allowlisted recipient (Auto)
cast send $V "propose(address,address,uint256)" $U 0x00000000000000000000000000000000000005e1 1000000 --private-key $AGENT_PRIVATE_KEY --rpc-url $R

# owner approves pending request index 0 (the 5 tUSDC one).
# Note: approve/reject take the request index (0, 1, 2...), not the proposal id.
cast send $V "approve(uint256)" 0 --private-key $PRIVATE_KEY --rpc-url $R

# owner freezes the agent / withdraws 10 tUSDC
cast send $V "freeze()" --private-key $PRIVATE_KEY --rpc-url $R
cast send $V "withdraw(address,uint256)" $U 10000000 --private-key $PRIVATE_KEY --rpc-url $R

# read state
cast call $U "balanceOf(address)(uint256)" $V --rpc-url $R
cast call $V "frozen()(bool)" --rpc-url $R
```

## What is not connected yet

- `/app/live` reads this contract and sends real transactions (see DEMO.md). The other `/app` tabs still run the simulated engine.
- The app's extra demo rules (max % of vault, fee cap, split over-limit reasons) are not in this contract.
- x402 payments and swaps are simulated; this contract does plain token and AVAX transfers.
- Keys live only in the git-ignored `.env`. They are testnet-only and must never hold real funds.
