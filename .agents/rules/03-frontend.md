# Bounded Rules: Frontend & Next.js

These rules apply when developing, refactoring, or testing code in `src/` or frontend configuration files.

---

## 1. Next.js 16 & React 19 Standards
- **App Router**: Code resides in `src/app/` using App Router conventions.
- **Route Separation**:
  - Marketing pages reside in `src/app/(marketing)/` (`/`, `/how-it-works`, `/compare`, `/pricing`, `/security`, `/roadmap`, `/faq`).
  - Interactive console tabs reside in `src/app/app/` (`/app`, `/app/rules`, `/app/agent`, `/app/approvals`, `/app/receipts`, `/app/live`).
  - Server API routes reside in `src/app/api/` (`/api/chain`, `/api/agent`).
- **Client Components**: Interactive dashboard views and context providers MUST declare `'use client';` at the top of the file.
- **Breaking Changes in Next.js 16**:
  - Always verify documentation in `node_modules/next/dist/docs/` when unsure of APIs.
  - Keep the generated agent warning block in `AGENTS.md` intact.

---

## 2. React 19 Purity & Hook Rules
- **No Ref Mutation During Render**:
  - Do NOT mutate `ref.current` during rendering.
  - Move ref synchronization inside a `useEffect` hook or handle state directly inside event callbacks.
- **No Impure Function Calls During Render**:
  - Do NOT invoke non-deterministic / impure functions like `Date.now()`, `Math.random()`, or crypto randomizers directly in the component body or inside `useState(Date.now())`.
  - Pass static initial values, compute initial state lazily via an initializer function where acceptable, or compute timestamps inside event handlers/effects.

---

## 3. Styling, Brand & Honesty Rules
- **Single Brand Constant**:
  - The project working name (`BRAND`) MUST only appear as a literal in `src/lib/site.js`. All other files in `src/` must import `BRAND` from `src/lib/site.js` (enforced by `tests/honesty.test.mjs`).
- **Honesty & Banned Claims**:
  - Never use banned marketing claims (e.g., "100% safe", "fully protected", "principal is safe") in `src/` or `README.md`. Always run `npm test` after copy edits.
- **Light Theme & Semantic Tokens**:
  - Always-light theme tokens are defined in `src/app/globals.css` (`--canvas`, `--paper`, `--ink`, `--mute`, `--brand`).
  - Semantic tier tokens (`auto`, `ask`, `block`, `freeze`) must always render with icon + text + color.

---

## 4. Dual-Mode State Management (Simulated vs Live Fuji)
- **Simulated Mode (`/app`, `/app/rules`, `/app/agent`, `/app/approvals`, `/app/receipts`)**:
  - Powered by the pure deterministic engine in `src/lib/engine.js` and `src/store/useVaultStore.jsx` (persisted to `localStorage`).
  - Keep `src/lib/engine.js` pure and side-effect-free; summary statistics must always be computed from the event log.
- **Live on Fuji Mode (`/app/live`, `src/views/LivePage.jsx`)**:
  - Reads live `BoundedVault` and `tUSDC` state on Avalanche Fuji (`43113`) via `/api/chain` (`src/lib/chain/server.js`) and indexes events via Routescan.
  - Signs agent proposals server-side via `/api/agent` using `AGENT_PRIVATE_KEY` (never expose private keys to the client).
  - Sends owner actions (`approve`, `reject`, `freeze`, `unfreeze`, `setPolicy`, `withdraw`) via the browser wallet (`src/lib/chain/wallet.js`).
