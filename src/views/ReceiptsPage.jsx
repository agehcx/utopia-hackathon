'use client';

import { useMemo, useState } from 'react';
import { useVault } from '../store/useVaultStore';
import { summarize, summaryLine } from '../lib/engine';
import { buildReceipts, toCsv } from '../lib/receipts';
import ReceiptItem from '../components/ReceiptItem';
import { Card, Empty, Skeleton, TierBadge } from '../components/ui';

const FILTERS = [
  { id: 'ALL', label: 'All Receipts', match: () => true },
  { id: 'AUTO', match: (r) => r.tier === 'AUTO' || r.tier === 'APPROVED' },
  { id: 'ASK', match: (r) => ['PENDING', 'REJECTED', 'EXPIRED', 'APPROVED'].includes(r.tier) },
  { id: 'BLOCK', match: (r) => r.tier === 'BLOCKED' },
  { id: 'FREEZE', match: (r) => r.tier === 'FREEZE' },
];

function download(text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'bounded-receipts.csv' });
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReceiptsPage() {
  const { state, hydrated } = useVault();
  const [filter, setFilter] = useState('ALL');
  const [q, setQ] = useState('');
  const all = useMemo(() => buildReceipts(state.events, state.policy.allowlist), [state.events, state.policy.allowlist]);
  const match = FILTERS.find((f) => f.id === filter).match;
  const rows = all.filter((r) => match(r) && JSON.stringify([r.sentence, r.reason, r.to, r.toLabel]).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-light tracking-tight sm:text-4xl">Audit Receipts</h1>
          <p className="mt-1 text-sm text-mute">
            Non-reverting immutable audit log. {summaryLine(summarize(state.events))}
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => download(toCsv(rows))} disabled={!rows.length}>
          Export CSV
        </button>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`min-h-10 rounded-full px-3 text-xs font-medium transition-all ${
                filter === f.id
                  ? 'bg-ink text-surface ring-2 ring-ink shadow-sm'
                  : 'bg-paper text-ink/80 hover:bg-surface ring-1 ring-ink/10'
              }`}
            >
              {f.label ? <span>{f.label}</span> : <TierBadge tier={f.id} label={f.id === 'FREEZE' ? 'Freeze' : undefined} />}
            </button>
          ))}
          <label className="sr-only" htmlFor="rq">
            Search receipts
          </label>
          <input
            id="rq"
            className="field sm:ml-auto sm:max-w-xs"
            placeholder="Search address, reason…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {!hydrated ? (
          <Skeleton />
        ) : rows.length ? (
          <ul className="grid gap-2">
            {rows.map((r) => (
              <ReceiptItem key={r.seq} r={r} />
            ))}
          </ul>
        ) : (
          <Empty
            title={all.length ? 'No matching receipts' : 'No receipts yet'}
            desc={all.length ? 'Try another filter or search term.' : 'Run a proposal or scenario in the Agent Console.'}
          />
        )}
      </Card>
    </div>
  );
}
