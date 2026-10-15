'use client';

import { labelFor, REASON_TEXT } from '../lib/rules';
import { useVault } from '../store/useVaultStore';
import { Pill } from './ui';

const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtAmt = (n) => (Number.isInteger(n) ? n : n.toFixed(2));

function headline(e, who) {
  const amt = `${fmtAmt(e.amount ?? 0)} tUSDC`;
  switch (e.type) {
    case 'PAID': return `Paid ${amt} to ${who}`;
    case 'APPROVED': return `You approved ${amt} to ${who}`;
    case 'PENDING': return `Asked you to approve ${amt} to ${who}`;
    case 'BLOCKED': return `Blocked ${amt} to ${who}`;
    case 'REJECTED': return `You rejected ${amt} to ${who}`;
    case 'FROZEN': return 'Agent frozen';
    case 'REVOKED': return 'Agent key revoked';
    default: return 'Rules updated';
  }
}

export default function ReceiptRow({ e }) {
  const { allowlist } = useVault();
  const who = e.to ? labelFor(e.to, allowlist) : '';
  const isMock = e.hash.startsWith('0xmock');
  const why = REASON_TEXT[e.code] && e.type !== 'FROZEN' ? REASON_TEXT[e.code] : e.reason;
  return (
    <li className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5">
      <Pill tone={e.type} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{headline(e, who)}</div>
        {why && <div className="mt-0.5 text-xs text-mute">{why}</div>}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-mute">
          <span suppressHydrationWarning>{fmtTime(e.ts)}</span>
          <a
            className="underline decoration-black/20 underline-offset-2 hover:text-ink"
            href={`https://testnet.snowtrace.io/tx/${e.hash}`}
            target="_blank"
            rel="noreferrer"
          >
            {isMock ? 'Explorer link (MOCK hash)' : 'View on Snowtrace'}
          </a>
        </div>
      </div>
    </li>
  );
}
