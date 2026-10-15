'use client';

import { useVaultStore } from '../../store/useVaultStore';

const NAV_ITEMS = [
  { id: 'policy', label: 'Policy Dashboard', icon: '🛡️', desc: 'Rules & limits' },
  { id: 'agent',  label: 'Agent Console',    icon: '🤖', desc: 'Chat & preview' },
  { id: 'audit',  label: 'Audit Log',         icon: '📋', desc: 'History' },
];

export default function SidebarNav({ page, setPage, isOpen, onClose }) {
  const { balance, isConnected, policy } = useVaultStore();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 sm:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed sm:static top-0 bottom-0 left-0 w-[220px] min-w-[220px] bg-zinc-900 border-r border-zinc-800 flex flex-col z-50 transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'
        }`}
      >
        <div className="p-5 pb-4 border-b border-zinc-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-base">
            🔐
          </div>
          <div className="font-bold text-sm text-zinc-100 tracking-tight">
            Agent<span className="text-violet-500">Safe</span>
          </div>
        </div>

        <nav className="p-2.5 flex-1 flex flex-col gap-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                page === item.id
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
              onClick={() => { setPage(item.id); onClose(); }}
            >
              <span className="text-sm">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-800">
          {isConnected && (
            <div className="p-3 bg-zinc-800 rounded-lg mb-2.5 border border-zinc-700/60">
              <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-semibold">Vault Balance</div>
              <div className="text-lg font-bold text-zinc-100 font-mono tracking-tight">
                {balance.toFixed(4)}
                <span className="text-xs text-zinc-500 ml-1 font-normal font-sans">ETH</span>
              </div>
              {policy.isPaused && (
                <div className="mt-1.5 text-xs text-rose-500 flex items-center gap-1 font-medium">
                  <span>⏸</span> Agent Paused
                </div>
              )}
            </div>
          )}
          <div className="text-[11px] text-zinc-500 px-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0" />
            v0.1.0 · Mock Network
          </div>
        </div>
      </aside>
    </>
  );
}
