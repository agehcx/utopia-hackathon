# Bounded Rules: General & Architecture

These rules apply across the entire Bounded repository (developed for the Utopia Hackathon). All agents operating in this workspace must adhere to these directives.

---

## 1. Project Overview & Role
- **Project**: Bounded - Trust-Minimized On-Chain AI Agent Vault (Utopia Hackathon).
- **Goal**: Enable autonomous AI agents to spend funds within strict, deterministic smart contract guardrails without risking treasury drainage.
- **Dual Architecture**:
  - `contracts/`: Foundry-managed Solidity 0.8.24 contracts (`BoundedVault.sol`, `MockUSDC.sol`).
  - `src/`: Next.js 16 + React 19 web dashboard (`PolicyPage`, `AgentPage`, `AuditPage`, `useVaultStore`).

---

## 2. Memory Bank Maintenance
- Always consult `memory-bank/` before making architectural modifications:
  - `memory-bank/project_brief.md`: Core requirements and objectives.
  - `memory-bank/techstack.md`: Technology choices, dependencies, and patterns.
  - `memory-bank/systemPatterns.md`: Invariants, component flows, and data diagrams.
  - `memory-bank/current-state.md`: Current implementation progress and pending milestones.
  - `memory-bank/activeContext.md`: Active sprint context and immediate priorities.
- Keep `memory-bank/current-state.md` and `activeContext.md` up-to-date when completing tasks, introducing new contracts, or resolving technical debt.

---

## 3. General Development Conventions
- **Clean Commits**: Write conventional commit messages (e.g. `feat: ...`, `fix: ...`, `test: ...`, `docs: ...`, `refactor: ...`).
- **Documentation Integrity**: Maintain existing comments, licenses, and docstrings. Never remove the Next.js agent block in `AGENTS.md`.
- **Minimal Invasive Changes**: Focus changes precisely on the requirements. Do not perform unrelated refactoring without approval.
- **Verification First**: Always run verification before considering a task complete:
  - Smart contracts: `cd contracts && forge test`
  - Frontend: `npm run lint` and `npm run build`
