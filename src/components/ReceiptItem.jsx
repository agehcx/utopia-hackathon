'use client';

import { fmt } from '../lib/engine';
import { shortAddr, simTime } from '../lib/receipts';
import { TierBadge, Simulated } from './ui';

export default function ReceiptItem({ r, compact = false }) {
  return (
    <li className="rounded-2xl bg-surface p-4 ring-1 ring-ink/5">
      <div className="flex flex-wrap items-start gap-3">
        <TierBadge tier={r.tier} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{r.sentence}</div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-mute">
            <span>{simTime(r.ts)}</span>
            {r.to && <span>{r.toLabel} · <span className="font-mono">{shortAddr(r.to)}</span></span>}
            {r.reason && r.reason !== 'NONE' && <span className="font-mono">{r.reason}</span>}
            {r.version && <span>policy v{r.version}</span>}
            {!compact && <span>fee {fmt(r.fee)} tUSDC</span>}
          </div>
        </div>
      </div>
      {!compact && (
        <details className="mt-2 text-xs">
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-mute">
            <span className="font-mono">tx {shortAddr(r.txHash)}</span> <Simulated>Simulated hash</Simulated> Raw event
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-paper p-3 font-mono text-[11px]">{JSON.stringify(r.raw, null, 2)}</pre>
        </details>
      )}
    </li>
  );
}
