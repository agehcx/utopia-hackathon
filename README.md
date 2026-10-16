# Bounded

> The spending-limit layer for AI agents: a hacked or confused AI has a ceiling on what it can lose.
> Built for the **Utopia Hackathon** on Avalanche (Fuji testnet). "Bounded" is a working name.

**Testnet prototype. Not financial advice. Simulated components are labeled. Working name.**

## What it is

Your funds sit in a vault contract. Any AI agent can *propose* a spend, but only inside rules you set. The contract decides:

| Tier | When | What happens |
|---|---|---|
| Auto | Within your limits, approved destination | Executes instantly |
| Ask | Approved destination, over a limit | Waits for you to approve or reject |
| Block | Breaks a rule | Nothing moves; the reason is recorded |
| Circuit breaker | Too many blocks in a short window | The agent is frozen automatically |

AI proposes, you authorize, the contract enforces. We promise bounded loss, not profits or a smarter AI.

```
                           +-------------------------+
                           |       Vault Owner       |
                           +------------+------------+
                                        |
                 [setPolicy / setLimits / freeze / approve / reject]
                                        |
                                        v
                             +---------------------+
                             |   BoundedVault.sol  |
                             +----+-----+-----+----+
                                  |     |     |
              [Auto: In-Policy]   |     |     | [Blocked: Out-of-Policy]
                                  v     |     v
                        +-------------+ |   +--------------------+
                        | Destination | |   | Emits Decided &    |
                        | (AVAX/ERC20)| |   | Ticks Breaker      |
                        +-------------+ |   +--------------------+
                                        |             |
                             [Pending: Over-Limit]    | (Threshold reached)
                                        v             v
                               +-----------------+  +-------------------+
                               | Staged Request  |  | Agent Auto-Frozen |
                               | (Needs Owner)   |  +-------------------+
                               +-----------------+
                                        ^
                                        |
                           +------------+------------+
                           |   AI Agent (propose)    |
                           +-------------------------+
```

---

## Real vs simulated

| Part | Status |
|---|---|
| `BoundedVault.sol` (tiers, breaker, versioned policy, AVAX + ERC-20) | Built, Foundry-tested, unaudited. Deployed to Avalanche Fuji (`0x2a838F197f877dAE39284aB0Ac26EB156ad638cD`); see [DEPLOYMENT.md](DEPLOYMENT.md). |
| Live on Fuji tab (`/app/live`) | Real testnet transactions: reads vault state via Viem and contract events via Routescan, signs agent proposals via `/api/agent`, and signs owner actions (`approve`, `reject`, `freeze`, `unfreeze`, `setPolicy`, `withdraw`) in your browser wallet. |
| Simulated tabs (`/app`, `/app/rules`, `/app/agent`, `/app/approvals`, `/app/receipts`) | Runs on a deterministic simulated engine that mirrors the contract (works offline, resettable). |
| Max %-of-vault cap, fee cap, split over-limit reasons | Simulated engine only; not in the contract yet |
| x402-style payments (no real facilitator) | Simulated |
| Pricing (free contract; hosted alerts/approvals unpriced) | Hypothesis, to be tested in a pilot. No billing exists. |

## Repository

```
contracts/          Foundry: BoundedVault.sol, MockUSDC.sol, tests, Deploy.s.sol
src/app/(marketing) /, /how-it-works, /compare, /pricing, /security, /roadmap, /faq
src/app/app         /app, /app/rules, /app/agent, /app/approvals, /app/receipts, /app/live
src/app/api         /api/chain (live state + Routescan events), /api/agent (server-signed propose)
src/lib/chain/      Viem client, ABI, Fuji state reader, browser wallet sender
src/lib/engine.js   Pure policy engine (mirrors the contract's evaluation order)
src/lib/scenarios.js Demo data: normal day + prompt-injection scenario
src/lib/site.js     Brand name, disclaimer, sources, copy
src/store/          Mock adapter (localStorage, scenario runner)
tests/              Engine unit tests and honesty tests (banned claims)
DEPLOYMENT.md       Fuji contract addresses, initial rules, and live on-chain tx proofs
DEMO.md             3-minute live + simulated demo guide and troubleshooting
```

## Quickstart

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # engine + honesty tests
npx eslint src tests
npm run build

cd contracts && forge test   # 23 unit + 5 invariant tests
```

#### Test Suite Verification
```
Ran 23 tests for test/BoundedVault.t.sol:BoundedVaultTest
[PASS] test_avaxAutoAndPending()
[PASS] test_avaxReceiveAndOwnerWithdraw()
[PASS] test_breakerCounterResetsInNewWindow()
[PASS] test_breakerDisabledWhenThresholdZero()
[PASS] test_breakerFreezesAtNBlocksInWindow()
[PASS] test_dailyBucketResetsNextDay()
[PASS] test_expiredBlocked()
[PASS] test_freshVaultBlocksEverythingAsExpired()
[PASS] test_inLimitAutoPays()
[PASS] test_insufficientBalanceIsBlockNotRevert()
[PASS] test_nonAgentReverts()
[PASS] test_notAllowlistedBlocked()
[PASS] test_overDailyIsPending()
[PASS] test_overPerTxIsPendingThenApprovedExactlyOnce()
[PASS] test_ownerApproveWorksWhileFrozen()
[PASS] test_policyLimitsUnfreezeAreOwnerOnly()
[PASS] test_policyReplacementDropsOldAllowlist()
[PASS] test_rejectedCannotBeApproved()
[PASS] test_revokeAgentStopsProposals()
[PASS] test_unfreezeResetsCounter()
[PASS] test_utcBoundaryAllowsUpTo2xAcrossMidnight()
[PASS] test_versionIncrementsAndCallerValueIgnored()
[PASS] test_withdrawOwnerOnlyAndAlwaysWorks()
Suite result: ok. 23 passed; 0 failed; 0 skipped

Ran 5 tests for test/BoundedVault.invariant.t.sol:BoundedVaultInvariantTest
[PASS] invariant_autoSpendNeverExceedsDailyLimit() (runs: 256, calls: 128000)
[PASS] invariant_frozenAgentMovesNothing() (runs: 256, calls: 128000)
[PASS] invariant_noAutoPaymentToNonAllowlisted() (runs: 256, calls: 128000)
[PASS] invariant_oneDecidedPerProposal() (runs: 256, calls: 128000)
[PASS] invariant_ownerWithdrawAndFreezeAlwaysSucceed() (runs: 256, calls: 128000)
Suite result: ok. 5 passed; 0 failed; 0 skipped

Total: 28 tests passed, 0 failed, 0 skipped
```

### Deploy to Fuji

```bash
cp .env.example .env   # set PRIVATE_KEY (funded testnet key) and AGENT_ADDRESS
cd contracts
forge script script/Deploy.s.sol --rpc-url fuji --broadcast
```

The script deploys tUSDC and the vault, seeds a policy (per-tx 2, daily 10, breaker 3 per hour, 24h expiry) and writes `src/config/deployments.json`.

## 3-minute demo

See [DEMO.md](DEMO.md) for the full presenter script and troubleshooting guide.

1. Open `/app/agent`. Click **Run normal day**: two x402-style payments (1.5 and 10 tUSDC) execute (Auto), a 25 tUSDC payment goes to Ask and you approve it.
2. Click **Inject poisoned data**: the agent reads a poisoned feed item and tries to send 45 tUSDC to `0x…dEaD` three times. Each attempt is blocked (not allowlisted); the third freezes the agent.
3. Open `/app`: the summary reads "6 proposals: 2 auto, 1 approved, 3 blocked, agent frozen.", computed from the event log.
4. Open `/app/rules`, raise a limit: a confirm dialog shows the exact diff. Lower one: it applies in one click.
5. Open `/app/live` to run the same Auto, Pending (approve from wallet), and Blocked (breaker) flows on the real Avalanche Fuji contract with Snowtrace links.
6. **Reset demo** restores the simulated tabs to the starting state.

## Threat model and limits

See `/security` in the app. In short: we assume the agent will be compromised, so the contract, not the AI, is the authority. Losses inside your limits are possible. Known edge cases: daily limits use a fixed UTC day (up to ~2x across midnight), and an AVAX send to a reverting allowlisted contract reverts the whole proposal. The owner wallet is root and out of scope.

## License

MIT.
