'use client';

import Link from 'next/link';
import { useVault } from '../store/useVaultStore';
import { shortAddr } from '../lib/rules';
import { Logo, Pill } from './ui';

export const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'rules', label: 'Rules' },
  { id: 'agent', label: 'Agent' },
  { id: 'receipts', label: 'Receipts' },
];
const WALLET = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';

export default function Header({ tab, setTab }) {
  const { connected, connect } = useVault();
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" aria-label="Bounded home"><Logo /></Link>
        <nav className="hidden gap-1 md:flex" aria-label="Primary">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`rounded-xl px-4 py-2 text-sm transition ${tab === t.id ? 'bg-ink text-white' : 'text-ink/70 hover:bg-black/5'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex gap-1.5">
            <Pill tone="testnet">Fuji · Testnet</Pill>
            <Pill tone="mock">Mock</Pill>
          </span>
          <button onClick={connect} className={`btn ${connected ? 'btn-ghost' : 'btn-ink'}`}>
            {connected ? (
              <>
                <span className="h-2 w-2 rounded-full bg-brand" />
                <span className="font-mono text-xs">{shortAddr(WALLET)}</span>
              </>
            ) : (
              'Connect wallet'
            )}
          </button>
        </div>
      </header>
      <nav
        className="fixed inset-x-4 bottom-4 z-40 flex justify-between rounded-3xl bg-white/90 p-1.5 shadow-xl ring-1 ring-black/5 backdrop-blur md:hidden"
        aria-label="Primary mobile"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-2xl py-2.5 text-xs font-medium ${tab === t.id ? 'bg-ink text-white' : 'text-ink/60'}`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </>
  );
}
