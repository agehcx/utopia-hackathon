# Bounded Rules: Smart Contracts (Solidity & Foundry)

These rules apply when developing, reviewing, or testing contracts inside `contracts/`.

---

## 1. Environment & Standards
- **Solidity Version**: `^0.8.24` (matches `foundry.toml`).
- **EVM Version**: `paris`.
- **Framework**: Foundry (`forge`, `cast`).
- **Dependencies**: OpenZeppelin Contracts `v5.x` via `@openzeppelin/` remapping.

---

## 2. Core Security & Architectural Invariants
1. **The Contract is the Sole Authority**:
   - The contract never depends on or trusts off-chain data, oracles, or agent assertions.
   - The agent has no direct transfer capability; it can only invoke `propose(token, to, amount)`.
   - All limits, allowlists, pauses/freezes, and expiration timestamps are enforced deterministically on-chain.
2. **Non-Reverting Audit Logging for Agent Violations**:
   - In `propose`, out-of-policy actions must emit `Decided(id, Outcome.Blocked, reason)` and return cleanly rather than reverting.
   - *Rationale*: A transaction revert rolls back the EVM state and all emitted log events. Emitting `Decided` in a non-reverting transaction guarantees that every unauthorized or malicious attempt is indelibly recorded in block receipts.
   - Non-agent callers or invalid administrative calls **must revert**.
3. **Automated Circuit Breaker**:
   - Every blocked proposal triggers `_recordBlock()`.
   - If `blockCount >= breakerThreshold` within a `breakerWindow` time bucket, the contract automatically sets `frozen = true` and emits `AgentFrozen`.
   - The owner can manually `freeze()` or `unfreeze()` (which resets `blockCount = 0`).
4. **Atomic Policy Versioning & Allowlist Freshness**:
   - `setPolicy(Policy calldata p, address[] calldata list)` increments `policy.version`.
   - Recipient permissions are keyed by `_allowed[version][who]`.
   - When a new policy is set, all permissions for prior versions become invalid automatically without requiring expensive loops or array deletions.
5. **Multi-Asset Architecture**:
   - `token == address(0)` designates native AVAX; transfers execute via `to.call{value: amount}("")`.
   - `token != address(0)` designates an ERC-20 token; transfers execute via `IERC20(token).safeTransfer(to, amount)`.
   - Use `ReentrancyGuard` (`nonReentrant`) on all value-transferring entry points (`propose`, `approve`, `deposit`, `withdraw`).
6. **Checks-Effects-Interactions (CEI)**:
   - Always update internal state (daily spend, request status, breaker counters) *before* external value transfers.
7. **Owner Sovereignty**:
   - `withdraw`, `freeze`, `unfreeze`, and `reject` must never depend on agent or policy state. They must succeed even if the agent is frozen, policy is expired, or breaker is tripped.
8. **Request Escalation State Machine**:
   - Over-limit payments to allowlisted recipients yield `Outcome.Pending` and stage a `Request(token, to, amount, status)`.
   - Requests have fixed lifecycle states: `0 = Pending`, `1 = Approved`, `2 = Rejected`.
   - Only pending requests (`status == 0`) can be approved or rejected. Status must flip *before* token transfer to prevent replay.

---

## 3. Testing & Verification Requirements
- Every change to contracts in `contracts/src/` must be accompanied or validated by tests in `contracts/test/`.
- All tests must pass: `cd contracts && forge test`.
- Event emissions must be strictly tested using `vm.expectEmit` or topic checking.
- Maintain and expand both:
  - Unit tests (`contracts/test/BoundedVault.t.sol`)
  - Stateful invariant fuzz tests (`contracts/test/BoundedVault.invariant.t.sol`) with handler-based random action generation.
