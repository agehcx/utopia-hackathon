'use client';

import { useVaultStore } from '../../store/useVaultStore';

const MOCK_ADDRESS = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
const PAGE_TITLES = {
  policy: 'Policy Dashboard',
  agent:  'Agent Console',
  audit:  'Audit Log',
};
const PAGE_DESCS = {
  policy: 'Configure transaction rules and spending limits',
  agent:  'Interact with the AI agent and preview actions',
  audit:  'Full history of all on-chain events',
};

function shortAddr(addr) {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export default function Topbar({ page, onMenuClick }) {
  const { isConnected, connectWallet } = useVaultStore();

  return (
    <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          className="sm:hidden text-zinc-400 hover:text-zinc-200 text-lg p-1"
          onClick={onMenuClick}
        >
          ☰
        </button>
        <div>
          <div className="text-sm font-semibold text-zinc-100">{PAGE_TITLES[page] || 'AgentSafe'}</div>
          <div className="text-[11px] text-zinc-500">{PAGE_DESCS[page]}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-[11px] text-zinc-500 hidden sm:flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          Mock Network
        </div>
        <button
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            isConnected
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-violet-500'
          }`}
          onClick={connectWallet}
        >
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
              <span className="font-mono">{shortAddr(MOCK_ADDRESS)}</span>
            </>
          ) : (
            <>
              <span>🔗</span>
              <span>Connect Wallet</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
