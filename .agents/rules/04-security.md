# Bounded Rules: Security & Trust Minimization

These rules establish the security invariants that protect user funds and ensure autonomous AI operations remain safe.

---

## 1. Zero-Trust Autonomous Operations
- **Assume Agent Compromise**: Always design assuming the AI agent may hallucinate, experience prompt injection attacks, or execute malicious loops.
- **Contract Boundary**: The contract is the only enforcement layer. Client-side checks are for user feedback and simulation only; never rely on frontend validation for security guarantees.
- **Allowlists are Mandatory**: Funds cannot be transferred to addresses outside the versioned allowlist under any circumstances unless explicitly approved by the owner via the staged request mechanism.
- **Fail-Safe by Default**: Fresh vaults initialize with `expiry = 0`. All agent actions are rejected as `Expired` until the owner explicitly sets a valid policy.

---

## 2. Key Management & Secrets
- **No Private Keys in Client or VCS**: Never expose, commit, or log private keys, seed phrases, or sensitive RPC secrets in the repository or frontend code.
- **Agent Keys**: When integrating automated agents, use isolated ephemeral keys or session keys restricted exclusively to the `agent` role in `BoundedVault`.
- **Owner Key Separation**: The vault owner address (`owner`) must be completely separate from the agent key (`agent`).

---

## 3. Human-in-the-Loop Safeguards & Circuit Breakers
- **Automated Circuit Breaker**: If an agent generates repeated violations reaching `breakerThreshold` in a `breakerWindow` time bucket, the contract automatically freezes the agent (`frozen = true`).
- **Emergency Freeze**: The owner can freeze all agent operations immediately at any time via `freeze()`, and resume via `unfreeze()`.
- **Agent Revocation**: In the event of anomalous activity, the owner can call `revokeAgent()` to immediately strip agent authorization on-chain.
- **Staging vs Execution**: High-value transactions or out-of-policy actions must be routed to `propose()`, generating `Outcome.Pending` for owner inspection and intentional authorization via `approve(id)`.
- **Owner Sovereignty**: Owner administrative calls (`withdraw`, `freeze`, `unfreeze`, `reject`) must never depend on agent state or policy parameters. The owner must always be able to recover capital.
