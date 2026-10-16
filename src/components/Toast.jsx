'use client';

import { useVault } from '../store/useVaultStore';

export default function Toasts() {
  const { toasts } = useVault();
  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-50 flex flex-col gap-2 md:bottom-6" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="rise flex min-w-64 items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-xl ring-1 ring-ink/10">
          <span className={`h-2.5 w-2.5 rounded-full ${t.tone === 'bad' ? 'bg-block' : 'bg-brand'}`} />
          <div>
            <div className="text-sm font-medium">{t.title}</div>
            {t.desc && <div className="text-xs text-mute">{t.desc}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
