# AgentSafe 🛡️

> **Trust-Minimized, On-Chain Financial Guardian Vault for Autonomous AI Agents**  
> *Built for the **Utopia Hackathon**.*

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Foundry-28%20Passing%20(5%20Invariants)-black?logo=ethereum)](https://getfoundry.sh/)
[![Network](https://img.shields.io/badge/Asset-AVAX%20%7C%20ERC--20-E84142?logo=avalanche)](https://avax.network/)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.19-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

---

## 📖 Overview

As autonomous AI agents are entrusted with capital for decentralized operations—such as paying for APIs, purchasing computing power, executing DeFi strategies, or conducting micro-transactions—granting them direct access to private keys or infinite allowances introduces catastrophic failure modes (prompt injection attacks, infinite loops, rogue transactions, and wallet draining).

**AgentSafe** solves this by establishing **the smart contract as the sole, unalterable on-chain authority**. The agent is granted execution rights that are strictly constrained by owner-configured on-chain rules and automated circuit breakers. The agent cannot move funds directly; it can only `propose`.

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

## ✨ Key Features

- **Multi-Asset Vault (Native AVAX + ERC-20)**:
  - Supports native AVAX (`address(0)`) via `receive()` and direct transfer, as well as any ERC-20 token (e.g. USDC) with `SafeERC20`.
- **Unified Agent Interface (`propose`)**:
  - The agent interacts exclusively through `propose(token, to, amount)`.
  - The contract deterministically decides the outcome on-chain:
    - **`Outcome.Auto`**: Within per-tx and daily limits to an allowlisted address. Immediately executed.
    - **`Outcome.Pending`**: To an allowlisted address but exceeds per-tx or daily limits. Staged on-chain as a `Request` for owner review.
    - **`Outcome.Blocked`**: Frozen, expired, not allowlisted, or insufficient balance. Returns cleanly and records to the circuit breaker.
- **Automated Circuit Breaker**:
  - Automatically rate-limits policy violations. If `blockCount >= breakerThreshold` within a `breakerWindow` time bucket, the contract automatically freezes the agent (`frozen = true`) and emits `AgentFrozen`.
- **Atomic Policy Versioning & Allowlisting**:
  - Policies are versioned (`version++`). Allowlisted addresses are bound to the specific version (`_allowed[version][who]`).
  - Updating a policy atomically invalidates previous allowlists, preventing stale permissions.
- **Fail-Safe by Default**:
  - A fresh vault deploys with `expiry = 0`. All agent proposals are blocked as `Expired` until the owner explicitly sets the initial policy.
- **Non-Reverting Audit Logging**:
  - Violations return cleanly and emit `Decided(id, Blocked, reason)` instead of reverting. A revert would roll back state and logs, erasing the audit trail. Non-reverting execution permanently logs attempted breaches in block receipts.
- **Human-in-the-Loop Escalation**:
  - Pending requests can be reviewed by the owner and executed via `approve(id)` or dismissed via `reject(id)`.
  - State transitions (`0: Pending -> 1: Approved / 2: Rejected`) happen *before* fund transfers, eliminating replay vulnerabilities.
- **Owner Sovereignty**:
  - `withdraw`, `freeze`, `unfreeze`, and `reject` never depend on agent or policy state. The owner maintains non-custodial capital control at all times.

---

## 📂 Repository Structure

```
.
├── contracts/                        # Smart contract suite (Foundry)
│   ├── src/
│   │   ├── BoundedVault.sol          # Multi-token guardian vault with circuit breaker
│   │   └── MockUSDC.sol              # Test ERC20 token (6 decimals)
│   ├── test/
│   │   ├── BoundedVault.t.sol        # 23 unit & boundary test suites
│   │   └── BoundedVault.invariant.t.sol # 5 stateful invariant fuzz tests (128k calls)
│   └── foundry.toml                  # Foundry config (Solidity 0.8.24, Paris EVM)
├── src/                              # Next.js 16 frontend application
│   ├── app/                          # App Router layout & entry page
│   ├── components/                   # Reusable UI components & layouts
│   ├── views/                        # Dashboard views (Policy, Agent Console, Audit Log)
│   └── store/useVaultStore.jsx       # Centralized client state & simulation engine
├── memory-bank/                      # Architectural memory bank
│   ├── project_brief.md              # Mission, problem statement, goals
│   ├── techstack.md                  # Technology stack, versions, design patterns
│   ├── systemPatterns.md             # Invariants, component flows, data diagrams
│   ├── current-state.md              # Real-time project status & test results
│   └── activeContext.md              # Active sprint context & immediate priorities
├── .agents/rules/                    # Autonomous agent development rules
│   ├── 01-general.md                 # Repository conventions & memory bank sync
│   ├── 02-contracts.md               # Solidity, CEI, non-reverting logging rules
│   ├── 03-frontend.md                # Next.js 16 & React 19 hook purity rules
│   └── 04-security.md                # Zero-trust, key safety, human-in-the-loop
└── AGENTS.md                         # Agent guidelines & Next.js instruction block
```

---

## 🚀 Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.18+ or v20+)
- [Foundry](https://getfoundry.sh/) (`forge`, `cast`, `anvil`)

### 1. Smart Contracts

```bash
# Navigate to contracts directory
cd contracts

# Run all 28 unit and invariant tests
forge test

# Run tests with detailed traces
forge test -vvv

# Format Solidity code
forge fmt
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

### 2. Frontend Dashboard

```bash
# Install dependencies from root
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Policy Dashboard**: Inspect and configure per-tx caps, daily budgets, allowlist entries, and emergency freeze controls.
- **Agent Console**: Chat interface simulating agent intent parsing, classification (`AUTO`, `NEEDS_APPROVAL`, `BLOCKED`), and action card execution.
- **Audit Log**: Timeline and table view indexing historical proposals, executions, blocks, and policy adjustments with multi-factor filtering.

---

## 🔒 Security Invariants

1. **The Contract is Sole Authority**: The contract never reads oracles or off-chain data. The agent can only `propose`.
2. **Audit Logging (Non-Reverting Blocks)**: Agent policy breaches in `propose` emit `Decided(id, Blocked, reason)` and increment the circuit breaker rather than reverting, ensuring an indelible on-chain log.
3. **Automated Circuit Breaker**: Repeated blocked actions automatically freeze the agent to halt adversarial or looping agents.
4. **CEI & Safe Transfers**: Always adhere to Checks-Effects-Interactions with `ReentrancyGuard` and `SafeERC20`.
5. **Owner Invariant**: `withdraw`, `freeze`, `unfreeze`, and `reject` can never be bricked by agent state or policy configuration.

---

## 📄 License

This project is licensed under the MIT License.
Built with ❤️ for the **Utopia Hackathon**.
