'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useVault } from '../store/useVaultStore';
import { simTime } from '../lib/receipts';
import { DISCLAIMER } from '../lib/site';
import { Logo, Simulated, TokenIcon } from './ui';
import Toasts from './Toast';

const TABS = [
  { href: '/app', label: 'Overview' },
  { href: '/app/rules', label: 'Rules' },
  { href: '/app/agent', label: 'Agent' },
  { href: '/app/approvals', label: 'Approvals' },
  { href: '/app/receipts', label: 'Receipts' },
];

function Tab({ t, active, count, mobile }) {
  const base = mobile ? 'flex min-h-11 flex-1 items-center justify-center rounded-2xl text-[11px] font-medium text-center' : 'rounded-xl px-4 py-2.5 text-sm';
  return (
    <Link href={t.href} aria-current={active ? 'page' : undefined} className={`${base} relative transition ${active ? 'bg-ink text-surface' : 'text-ink/70 hover:bg-ink/5'}`}>
      {t.label}
      {count > 0 && <span className="ml-1 rounded-full bg-brand px-1.5 text-[10px] font-semibold text-[#0A0A0A]">{count}</span>}
    </Link>
  );
}

export default function AppShell({ children }) {
  const path = usePathname();
  const { state, reset } = useVault();
  const count = (href) => (href === '/app/approvals' ? state.pending.length : 0);
  return (
    <div className="w-full p-2 pb-28 sm:p-4 md:pb-4">
      <div className="min-h-[calc(100vh-2rem)] rounded-[2rem] bg-paper p-4 sm:p-8 lg:px-12">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" aria-label="Home"><Logo /></Link>
          <nav className="hidden gap-1 md:flex" aria-label="App">
            {TABS.map((t) => <Tab key={t.href} t={t} active={path === t.href} count={count(t.href)} />)}
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-medium ring-1 ring-ink/10 sm:inline-flex"><TokenIcon token="Avalanche" size={14} /> Fuji testnet</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand-deep">
              Demo mode: simulated
            </span>
            <span className="hidden font-mono text-xs text-mute sm:inline" title="Simulated clock">{simTime(state.clock)}</span>
            <button onClick={reset} className="btn btn-ghost !min-h-9 !px-3 !py-1.5 text-xs">Reset demo</button>
          </div>
        </header>
        <main className="mt-8">{children}</main>
        <footer className="mt-12 flex flex-wrap items-center justify-center gap-2 text-center text-xs text-mute">
          <Simulated /> {DISCLAIMER}
        </footer>
      </div>
      <nav className="fixed inset-x-2 bottom-3 z-40 flex gap-1 rounded-3xl bg-surface/95 p-1.5 shadow-xl ring-1 ring-ink/10 backdrop-blur md:hidden" aria-label="App mobile">
        {TABS.map((t) => <Tab key={t.href} t={t} active={path === t.href} count={count(t.href)} mobile />)}
      </nav>
      <Toasts />
    </div>
  );
}
