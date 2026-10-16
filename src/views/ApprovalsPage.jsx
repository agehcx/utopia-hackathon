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
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-light tracking-tight sm:text-4xl">Approvals</h1>
            {list.length > 0 && (
              <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-white">
                {list.length} pending
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-mute">
            Human-in-the-loop authorizations. When a proposal exceeds standard limits but is sent to an allowlisted destination, it pauses here for your signature.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => advance(5 * MIN)}>
          Advance clock 5 min <Simulated />
        </button>
      </div>

      <Card title={list.length ? `Pending Approvals (${list.length})` : 'Pending Approvals'}>
        {!hydrated ? (
          <Skeleton rows={2} />
        ) : list.length === 0 ? (
          <Empty
            title="No proposals waiting"
            desc="When the agent proposes a valid spend that exceeds your daily limit or per-transaction ceiling, it shows up here for your review."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map(({ proposal: p, reason, expiresAt }) => {
              const left = Math.max(0, Math.ceil((expiresAt - state.clock) / MIN));
              return (
                <li key={p.id} className="flex flex-col justify-between rounded-[1.75rem] bg-paper p-5 ring-1 ring-ink/10 shadow-sm">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <TierBadge tier="ASK" />
                      <span className="text-xs font-medium text-mute">{left} min remaining</span>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-2xl font-light">
                      <TokenIcon size={24} />
                      {fmt(p.amount)} {p.token}
                    </div>

                    <div className="mt-1 text-sm font-medium">
                      {p.action === 'swap' ? 'Swap via ' : 'To '}
                      {labelFor(p.destination, state.policy.allowlist)}{' '}
                      <span className="font-mono text-xs text-mute font-normal">({shortAddr(p.destination)})</span>
                    </div>

                    <div className="mt-3 rounded-xl bg-surface/80 p-2.5 text-xs text-mute">
                      <strong className="text-ink">Trigger:</strong> {REASON_TEXT[reason]}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-2 border-t border-ink/5 pt-4">
                    <button className="btn btn-ghost" onClick={() => reject(p.id)}>
                      Reject
                    </button>
                    <button className="btn btn-ink" onClick={() => approve(p.id)}>
                      Approve & Execute
                    </button>
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
