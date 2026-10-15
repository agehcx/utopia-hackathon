# AgentSafe Rules: Frontend & Next.js

These rules apply when developing, refactoring, or testing code in `src/` or frontend configuration files.

---

## 1. Next.js 16 & React 19 Standards
- **App Router**: Code resides in `src/app/` using App Router conventions.
- **Client Components**: Interactive dashboard views and context providers MUST declare `'use client';` at the top of the file.
- **Breaking Changes in Next.js 16**:
  - Always verify documentation in `node_modules/next/dist/docs/` when unsure of APIs.
  - Keep the generated agent warning block in `AGENTS.md` intact.

---

## 2. React 19 Purity & Hook Rules
- **No Ref Mutation During Render**:
  - Do NOT mutate `ref.current` during rendering (e.g. `policyRef.current = policy`).
  - Move ref synchronization inside a `useEffect` hook or handle state directly inside event callbacks.
- **No Impure Function Calls During Render**:
  - Do NOT invoke non-deterministic / impure functions like `Date.now()`, `Math.random()`, or crypto randomizers directly in the component body or inside `useState(Date.now())`.
  - Pass static initial values, compute initial state lazily via an initializer function where acceptable, or compute timestamps inside event handlers/effects.

---

## 3. Styling & Design System
- **Tailwind & Dark Palette**:
  - Base background is `bg-zinc-950` with card surfaces using `bg-zinc-900` or `bg-zinc-850`, and borders using `border-zinc-800`.
  - Text colors: High emphasis `text-zinc-100`, medium `text-zinc-300`, muted `text-zinc-500`.
  - Status accent tokens:
    - Auto / Success: `text-emerald-500`, `bg-emerald-500/10`
    - Approval Needed / Warning: `text-amber-500`, `bg-amber-500/10`
    - Blocked / Danger: `text-rose-500`, `bg-rose-500/10`
    - Primary Action / Info: `text-violet-500`, `bg-violet-500/10`
- **Responsive Layout**:
  - Ensure mobile compatibility using the responsive drawer pattern (`SidebarNav` toggle with hamburger menu in `Topbar`).

---

## 4. Contract Alignment & State Management
- Keep all shared vault state encapsulated in `src/store/useVaultStore.jsx`.
- **Model BoundedVault Contract Semantics**:
  - Multi-asset display: Support native AVAX and ERC-20 tokens (e.g. USDC).
  - Track policy versioning (`policy.version`), expiry, and breaker parameters (`breakerThreshold`, `breakerWindow`, `blockCount`).
  - Surface circuit breaker trip state (`frozen = true`) with high-visibility alert banners and disabled action execution.
- **Web3 Readiness**:
  - Wire wallet connection via Viem / Wagmi v2.
  - Replace `makeMockHash` with actual on-chain transaction receipt hashes.
  - Maintain optimistic UI updates and toast feedback for pending -> confirmed transitions.
