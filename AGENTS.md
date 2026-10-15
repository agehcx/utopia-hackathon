<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AgentSafe Project Rules

Welcome to AgentSafe! Built for the **Utopia Hackathon**, this repository contains a trust-minimized, on-chain guardian vault for autonomous AI agents (`contracts/`) and an interactive management dashboard (`src/`).

## Quick Navigation & Memory Bank
- **Project Brief**: [`memory-bank/project_brief.md`](file:///Users/Chega/Desktop/Croissant/Blockchain/Hackathon/Utopia/memory-bank/project_brief.md)
- **Tech Stack & Architecture**: [`memory-bank/techstack.md`](file:///Users/Chega/Desktop/Croissant/Blockchain/Hackathon/Utopia/memory-bank/techstack.md)
- **System Patterns**: [`memory-bank/systemPatterns.md`](file:///Users/Chega/Desktop/Croissant/Blockchain/Hackathon/Utopia/memory-bank/systemPatterns.md)
- **Current State & Progress**: [`memory-bank/current-state.md`](file:///Users/Chega/Desktop/Croissant/Blockchain/Hackathon/Utopia/memory-bank/current-state.md)
- **Active Context**: [`memory-bank/activeContext.md`](file:///Users/Chega/Desktop/Croissant/Blockchain/Hackathon/Utopia/memory-bank/activeContext.md)

## Specialized Agent Rules
- **General & Memory Bank**: [`.agents/rules/01-general.md`](file:///Users/Chega/Desktop/Croissant/Blockchain/Hackathon/Utopia/.agents/rules/01-general.md)
- **Solidity & Foundry Contracts**: [`.agents/rules/02-contracts.md`](file:///Users/Chega/Desktop/Croissant/Blockchain/Hackathon/Utopia/.agents/rules/02-contracts.md)
- **Next.js & Frontend**: [`.agents/rules/03-frontend.md`](file:///Users/Chega/Desktop/Croissant/Blockchain/Hackathon/Utopia/.agents/rules/03-frontend.md)
- **Security & Trust Minimization**: [`.agents/rules/04-security.md`](file:///Users/Chega/Desktop/Croissant/Blockchain/Hackathon/Utopia/.agents/rules/04-security.md)

## Critical Invariants
1. **The Contract is Sole Authority**: The contract never relies on off-chain agent assertions. All limits and allowlists are enforced on-chain; the agent can only `propose`.
2. **Audit Logging (Non-Reverting Blocks)**: Agent policy breaches in `propose` emit `Decided(id, Blocked, reason)` and return cleanly to keep the transaction log immutable on-chain.
3. **Automated Circuit Breaker**: Exceeding the block threshold within a window automatically freezes the agent to stop malicious loops.
4. **CEI & ReentrancyGuard**: Always adhere to Checks-Effects-Interactions and use `ReentrancyGuard` on all value transfers (AVAX and ERC-20).
5. **Owner Sovereignty**: Owner administrative calls (`withdraw`, `freeze`, `unfreeze`, `reject`) never depend on agent or policy state.
6. **React 19 & Next.js 16 Cleanliness**: Do not mutate refs during render. Do not invoke impure functions (like `Date.now()`) during render.

