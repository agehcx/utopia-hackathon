# Project Brief: AgentSafe

## Executive Summary
**AgentSafe** is a trust-minimized, non-custodial smart contract vault and control dashboard created for the **Utopia Hackathon**. It is designed to grant autonomous AI agents financial agency while strictly enforcing deterministic, owner-defined safety guardrails. 

As autonomous AI agents are entrusted with capital for decentralized operations—such as paying for APIs, purchasing computing power, executing DeFi strategies, or conducting micro-transactions—granting them unconstrained access to private keys or infinite allowances introduces catastrophic failure modes (prompt injection attacks, infinite loops, rogue transactions, and wallet draining). 

AgentSafe solves this by establishing **the smart contract as the sole, unalterable on-chain authority**. The agent cannot move funds directly; it can only `propose`. All transactions are evaluated deterministically on-chain against multi-asset limits, recipient allowlists, and an automated circuit breaker.

---

## Core Problem Statement
1. **Unbounded Agent Risk**: Traditional crypto wallets provide binary access (all-or-nothing). If an agent is compromised or encounters an adversarial prompt, the entire wallet balance is at risk.
2. **Loss of Auditability upon Failure**: Standard smart contract reverts roll back all state and emitted events, erasing proof of attempted breaches or policy violations from on-chain history.
3. **Runaway Agent Looping & Breaker Inaction**: When an agent gets caught in a malfunction or prompt-injection loop, standard contracts either revert passively or allow repeated drains until human intervention occurs.
4. **Stale Permission Accumulation**: Traditional allowlists accumulate stale addresses over time, increasing attack surface unless actively managed.
5. **Agent Friction**: Requiring human sign-off for every single micro-payment destroys agent autonomy and speed.

---

## Solution & Value Proposition
AgentSafe provides a dual-layer solution:

### 1. Deterministic Multi-Asset Smart Contract Vault (`BoundedVault.sol`)
- **Multi-Asset Support**: Seamlessly manages native AVAX (`address(0)`) and any ERC-20 token (e.g. USDC).
- **Unified Agent Entrypoint (`propose`)**: The agent calls `propose(token, to, amount)`. The vault deterministically evaluates:
  - **`Outcome.Auto`**: Within per-tx and daily limits to an allowlisted address; immediately disbursed.
  - **`Outcome.Pending`**: Exceeds per-tx or daily limits to an allowlisted address; automatically staged for owner review.
  - **`Outcome.Blocked`**: Policy violation; emits audit log and ticks the circuit breaker.
- **Automated Circuit Breaker**: If the agent triggers `breakerThreshold` blocked attempts within a `breakerWindow` time bucket, the contract automatically freezes the agent (`frozen = true`) and emits `AgentFrozen`.
- **Atomic Policy Versioning**: Each `setPolicy` increments a version number. Allowlist entries are bound to that version, atomically dropping all previous permissions to prevent stale authorization creep.
- **Fail-Safe by Default**: Fresh vaults initialize with `expiry = 0`, blocking all agent actions until the owner explicitly sets policy.
- **Non-Reverting Audit Logging**: When an agent breaches policy, the contract returns cleanly and emits `Decided(id, Blocked, reason)` instead of reverting, permanently writing the breach to blockchain receipts.
- **Human-in-the-Loop Escalation**: Over-limit requests are safely staged (`Request(token, to, amount, status)`). The owner approves (`approve`) or dismisses (`reject`). Status flips before fund transfer, eliminating replay attacks.
- **Owner Invariants**: `withdraw`, `freeze`, `unfreeze`, and `reject` can never be bricked by agent state or policy configuration.

### 2. Interactive Management & Console UI
- **Policy Dashboard**: Intuitive interface for the vault owner to adjust per-tx limits, daily caps, expiry dates, allowlists, and emergency freeze controls.
- **Agent Console**: Conversational workspace for the agent to simulate, classify, and trigger actions with real-time status indicators (`AUTO`, `NEEDS_APPROVAL`, `BLOCKED`).
- **Audit Log**: Timeline and tabular visualizer indexing all on-chain events (`Proposed`, `Decided`, `Approved`, `Rejected`, `AgentFrozen`, `PolicyUpdated`).

---

## Target Audience & Personas
- **Autonomous AI Developers & Agents**: AI applications needing autonomous spending power for compute, APIs, and micro-services.
- **DAO Treasuries & Web3 Organizations**: Protocols delegating operational budgets to automated bot agents with strict governance bounds.
- **DeFi Investors & Traders**: Users operating automated trading bots while protecting principal funds from black-swan drain vulnerabilities.
- **Hackathon Evaluators & Web3 Security Auditors**: Demonstrating verifiable trust minimization and real-world safety primitives for the agentic economy.

---

## Key Performance & Success Metrics
- **Zero Unauthorized Outflows**: 100% of out-of-policy transactions blocked deterministically by the smart contract (verified by 5 stateful invariant suites with 128,000 calls each).
- **Audit Completeness**: 100% of attempted violations logged on-chain via non-reverting `Decided` events.
- **Automatic Attack Mitigation**: Circuit breaker freezes rogue or looping agents within configured threshold windows.
- **Autonomous Throughput**: Legitimate in-policy payments executed autonomously in a single transaction without human intervention.
- **Seamless Human Escalation**: High-value requests staged safely with single-click owner execution and zero replay vulnerability.
