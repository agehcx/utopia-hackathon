'use client';

import { useVaultStore } from '../store/useVaultStore';

const ICONS = { pending: '⏳', confirmed: '✅', error: '❌' };
const COLORS = {
  pending: 'rgba(245,158,11,0.4)',
  confirmed: 'rgba(16,185,129,0.4)',
  error: 'rgba(244,63,94,0.4)',
};

export default function ToastContainer() {
  const { toasts } = useVaultStore();
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2.5 z-50 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="bg-zinc-900 border rounded-lg p-3 px-4 flex items-center gap-2.5 min-w-[280px] max-w-[360px] shadow-2xl pointer-events-auto"
          style={{ borderColor: COLORS[t.type] || COLORS.pending }}
        >
          <span className="text-base shrink-0">{ICONS[t.type] || '🔔'}</span>
          <div className="flex-1">
            <div className="text-xs font-semibold text-zinc-100">{t.title}</div>
            {t.desc && <div className="text-[11px] text-zinc-400 mt-0.5">{t.desc}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
