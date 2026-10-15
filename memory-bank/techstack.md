# Technology Stack: AgentSafe

This document outlines the complete architectural stack, programming languages, libraries, tooling, and infrastructural choices utilized across AgentSafe (developed for the Utopia Hackathon).

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
- **Public Landing Page (`src/app/page.js`)**: Conversion-oriented landing page at `/` with hero, interactive preview teaser, and direct launch link.
- **Console App Shell (`src/app/app/page.js`)**: Full management dashboard at `/app` with tabbed navigation (`Overview`, `Rules`, `Agent`, `Receipts`).
- **State Store (`src/store/useVaultStore.jsx`)**: Centralized React Context provider implementing single-write commit path, toast pipeline, and instruction runner.
- **Pure State Machine & Utilities (`src/lib/`)**:
  - `src/lib/vault.js`: Pure functional state machine mirroring `BoundedVault.sol` state transitions (`propose`, `tripBreaker`, `approve`, `reject`, `freeze`, `unfreeze`) for offline demonstration.
  - `src/lib/rules.js`: Policy evaluation engine (`evaluate`), reason codes, address formatters, and tier constants (`AUTO`, `ASK`, `BLOCKED`).
  - `src/lib/mockAgent.js`: Natural language intent interpreter translating prompt instructions into structured vault proposals.
- **Views**:
  - `src/views/OverviewPage.jsx`: Vault summary, live balance, daily spending progress gauge, pending approval cards, and recent receipts.
  - `src/views/RulesPage.jsx`: Policy configuration (per-tx and daily limits, breaker threshold & window, expiry), labeled allowlist manager, and emergency controls (freeze, unfreeze, revoke).
  - `src/views/AgentPage.jsx`: Interactive chat interface, proposal simulation with tier badges, suggested queries, and one-click adversarial attack demonstration.
  - `src/views/ReceiptsPage.jsx`: Immutable receipt ledger with multi-factor filtering (`ALL`, `PAID`, `PENDING`, `BLOCKED`), search, tx hashes, and reason explanations.
- **Design System (`tailwind.config.js` & `src/app/globals.css`)**:
  - Warm paper-modern aesthetic: `canvas` (`#E9E9E7`), `paper` (`#F6F6F4`), `ink` (`#0A0A0A`), `mute` (`#8A8A86`), `brand` (`#FF6A1A`), `good` (`#1F9D55`), `bad` (`#E5484D`).
  - Typography: Outfit sans-serif + Geist mono font stacks.

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
