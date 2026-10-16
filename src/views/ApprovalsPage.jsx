'use client';

import { useVault } from '../store/useVaultStore';
import { MIN, fmt } from '../lib/engine';
import { labelFor, shortAddr } from '../lib/receipts';
import { REASON_TEXT } from '../lib/site';
import { Card, Empty, Simulated, Skeleton, TierBadge, TokenIcon } from '../components/ui';

export default function ApprovalsPage() {
  const { state, hydrated, approve, reject, advance } = useVault();
  const list = [...state.pending].reverse();
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-light tracking-tight sm:text-4xl">Approvals</h1>
          <p className="mt-1 text-sm text-mute">Ask-tier requests wait here. Unanswered requests auto-reject after 15 simulated minutes.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => advance(5 * MIN)}>Advance clock 5 min <Simulated /></button>
      </div>
      <Card>
        {!hydrated ? <Skeleton rows={2} /> : list.length === 0 ? (
          <Empty title="Nothing waiting" desc="When the agent proposes a valid spend that is over a limit, it shows up here." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.map(({ proposal: p, reason, expiresAt }) => {
              const left = Math.max(0, Math.ceil((expiresAt - state.clock) / MIN));
              return (
                <li key={p.id} className="rounded-[1.75rem] bg-paper p-5 ring-1 ring-ink/10 max-sm:shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <TierBadge tier="ASK" />
                    <span className="text-xs text-mute">{left} min left</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-2xl font-light"><TokenIcon size={24} />{fmt(p.amount)} {p.token}</div>
                  <div className="text-sm">{p.action === 'swap' ? 'Swap via ' : 'To '}{labelFor(p.destination, state.policy.allowlist)} <span className="font-mono text-xs text-mute">{shortAddr(p.destination)}</span></div>
                  <p className="mt-2 text-xs text-mute">Why: {REASON_TEXT[reason]} <span className="font-mono">({reason})</span></p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button className="btn btn-ghost" onClick={() => reject(p.id)}>Reject</button>
                    <button className="btn btn-ink" onClick={() => approve(p.id)}>Approve</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
