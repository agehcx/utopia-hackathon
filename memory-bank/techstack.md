# Technology Stack: Bounded

This document outlines the complete architectural stack, programming languages, libraries, tooling, and infrastructural choices utilized across Bounded (developed for the Utopia Hackathon).

---

## 1. Smart Contract Architecture

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Solidity** | `^0.8.24` | Primary smart contract language. Target EVM: `paris`. Optimizer runs: 200. |
| **Foundry** | `forge 0.2.0+` | Development framework for compiling, fuzzing, testing, and deploying contracts. |
| **OpenZeppelin Contracts** | `v5.x` | Industry-standard security libraries: `Ownable`, `ReentrancyGuard`, `IERC20`, `SafeERC20`. |
| **forge-std** | Latest | Standard Foundry testing utilities (`Test`, `Vm`, `console`). |

### Key Contracts
- `contracts/src/BoundedVault.sol`: The core multi-asset guardian vault contract. Manages deposits, withdrawals, versioned policies, allowlists, limits per token, agent proposal evaluation, automated circuit breakers, request staging, and audit event emissions.
- `contracts/src/MockUSDC.sol`: ERC-20 test token with standard 6 decimals (`1e6`) used for integration and fuzz testing.
- `contracts/test/BoundedVault.t.sol`: 23 comprehensive unit tests verifying AVAX & ERC20 transfers, breaker triggers, UTC daily bucket rollovers, fresh vault defaults, and owner sovereignty.
- `contracts/script/Deploy.s.sol`: Automated deployment script for Avalanche Fuji testnet (`43113`) and local Anvil (`31337`), auto-generating `src/config/deployments.json`.
- `contracts/test/BoundedVault.invariant.t.sol`: 5 stateful invariant fuzzing suites executing 128,000 calls each across randomized owner/agent/time scenarios.

### Core Contract Design Patterns
- **Multi-Asset Abstraction**: `address(0)` designates native AVAX; any non-zero address designates an ERC-20 token handled via `SafeERC20`.
- **Unified Propose Interface**: The agent does not call arbitrary payment functions; it can only invoke `propose(token, to, amount)`. The contract evaluates rules on-chain and determines whether the outcome is `Auto`, `Pending`, or `Blocked`.
- **Automated Circuit Breaker**: If `blockCount >= breakerThreshold` in a `breakerWindow` time bucket, the contract automatically freezes the agent (`frozen = true`) to halt runaway or looping agent processes.
- **Atomic Policy Versioning**: Each `setPolicy` call increments `version`. Recipient permissions are stored in `_allowed[version][who]`, instantly invalidating previous allowlist entries upon policy update.
- **Fail-Safe Default**: Initial deployment sets `expiry = 0`, blocking all proposals until explicit owner initialization.
- **Checks-Effects-Interactions (CEI)**: State mutations (spending tracking, request status flips, breaker counters) precede value transfers.
- **ReentrancyGuard**: Applied to all fund-transferring entry points (`propose`, `approve`, `deposit`, `withdraw`).
- **Non-Reverting Audit Logging**: Out-of-policy agent proposals return cleanly and emit `Decided(id, Blocked, reason)` instead of reverting, guaranteeing block receipt retention.
- **State-Protected Request Escalation**: Over-limit payments transition through status codes (`0: Pending`, `1: Approved`, `2: Rejected`) preventing replay attacks.
- **Owner Sovereignty Invariant**: `withdraw`, `freeze`, `unfreeze`, and `reject` can never be bricked by agent state or policy configuration.

---

## 2. Frontend & Application Architecture

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Next.js** | `16.4.1` | React framework using App Router (`src/app/page.js`, `src/app/app/page.js`). |
| **React** | `19.3.0` | UI rendering engine supporting client-side interactivity (`'use client'`). |
| **Tailwind CSS** | `^3.4.19` | Utility-first styling framework combined with dark theme CSS variables. |
| **PostCSS & Autoprefixer** | `^8.5.30` / `^10.6.1` | CSS transformations and vendor prefixing. |
| **ESLint** | `^9.x` | Code quality and linting with Flat Config (`eslint.config.mjs`) and `eslint-config-next`. |

### UI & Component Layout
- **Marketing pages (`src/app/(marketing)/`)**: `/`, `/how-it-works`, `/compare`, `/pricing`, `/security`, `/roadmap`, `/faq`, sharing one layout with nav and the footer disclaimer. Reusable blocks (tier strip, layer diagram, threat table, sources) live in `src/components/site/`.
- **App (`src/app/app/`)**: `/app` (Overview), `/app/rules`, `/app/agent`, `/app/approvals`, `/app/receipts`. `layout.js` wraps every page in `VaultProvider` + `AppShell`.
- **Policy engine (`src/lib/engine.js`)**: pure, deterministic, integer micro-units. Mirrors the contract's evaluation order and adds demo-only rules (max % of vault, fee cap, split over-limit reasons). Unit-tested in `tests/engine.test.mjs`.
- **Demo data (`src/lib/scenarios.js`)**: starting state, normal-day and injection scenarios, poisoned market feed, simulated clock.
- **Receipts (`src/lib/receipts.js`)**: event log to readable rows, CSV export.
- **Site constants (`src/lib/site.js`)**: working name `BRAND` (the only place the name may appear), disclaimer, sources, tier copy, reason text.
- **Store (`src/store/useVaultStore.jsx`)**: mock adapter. Engine state persisted to localStorage, scenario runner (auto or step-through, speed control), decision animation, aria-live messages. No network, no keys.
- **Design system**: CSS-variable tokens in `src/app/globals.css` (light + dark via `prefers-color-scheme`), semantic tier colors `auto`, `ask`, `block`, `freeze`. Tier badges always show icon + text + color.

---

## 3. Web3 & AI Integration (Roadmap Stack)

| Component | Target Technology | Description |
| :--- | :--- | :--- |
| **Target Network** | Avalanche C-Chain / Fuji Testnet | Fast finality (<1s) and low gas costs ideal for agent micro-transactions and circuit breaker responsiveness. |
| **Wallet Connector** | `Wagmi v2` + `Viem` | On-chain wallet connection, reading multi-asset balances, and sending contract transactions. |
| **AI Agent Runtime** | LangChain / ElizaOS / Gemini SDK | Agent reasoning engine capable of proposing payments and interacting via automated RPC calls. |
| **Account Abstraction** | ERC-4337 / Session Keys | Future evolution allowing session keys and modular smart accounts for agent authorization. |

---

## 4. Development Workflow & Commands

### Smart Contracts (Foundry)
```bash
# Navigate to contracts directory
cd contracts

# Run all 28 unit and invariant tests
forge test

# Run tests with detailed traces
forge test -vvv

# Format solidity code
forge fmt
```

### Frontend (Next.js)
```bash
# Install dependencies
npm install

# Start local development server (http://localhost:3000)
npm run dev

# Run lint checks
npm run lint

# Create production build
npm run build
```
