'use client';

export function Logo({ size = 40 }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid place-items-center rounded-full bg-brand" style={{ width: size * 1.35, height: size }}>
        <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} aria-hidden>
          <path d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z" fill="#0A0A0A" />
        </svg>
      </span>
      <span className="text-xl font-medium tracking-tight">Bounded</span>
    </span>
  );
}

export function Card({ title, action, children, className = '' }) {
  return (
    <section className={`rise rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] ring-1 ring-black/5 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm text-mute">{title}</h3>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

const TONES = {
  AUTO: 'bg-good-soft text-good',
  PAID: 'bg-good-soft text-good',
  APPROVED: 'bg-good-soft text-good',
  ASK: 'bg-brand-soft text-brand-deep',
  PENDING: 'bg-brand-soft text-brand-deep',
  BLOCKED: 'bg-bad-soft text-bad',
  FROZEN: 'bg-ink text-white',
  REVOKED: 'bg-ink text-white',
  REJECTED: 'bg-black/5 text-mute',
  POLICY: 'bg-black/5 text-ink',
  mock: 'bg-brand text-white',
  testnet: 'bg-white text-ink ring-1 ring-black/10',
};
const LABELS = { AUTO: 'Auto', ASK: 'Needs approval', PENDING: 'Pending', PAID: 'Paid', APPROVED: 'Approved' };

export function Pill({ tone, children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${TONES[tone] || TONES.POLICY}`}>
      {children ?? LABELS[tone] ?? tone}
    </span>
  );
}

export function Big({ value, unit, className = '' }) {
  return (
    <div className={`flex items-baseline gap-1 ${className}`}>
      <span className="text-5xl font-light tracking-tight">{value}</span>
      {unit && <span className="text-sm text-mute">{unit}</span>}
    </div>
  );
}

/** Segmented bar: black + orange fill, dotted unused end (reference style). */
export function SegBar({ black = 0, brand = 0 }) {
  const clamp = (n) => Math.max(0, Math.min(100, n));
  return (
    <div className="relative flex h-5 w-full overflow-hidden rounded-md bg-paper">
      <div className="bg-brand" style={{ width: `${clamp(brand)}%` }} />
      <div className="bg-ink" style={{ width: `${clamp(black)}%` }} />
      <div className="ticks ml-auto h-full w-[22%] opacity-70" />
    </div>
  );
}

export function Gauge({ pct, label, sub }) {
  const p = Math.max(0, Math.min(100, pct));
  const a = Math.PI * (1 - p / 100);
  const dot = { x: +(100 + 80 * Math.cos(a)).toFixed(2), y: +(100 - 80 * Math.sin(a)).toFixed(2) };
  const arc = 'M20 100 A80 80 0 0 1 180 100';
  return (
    <div className="relative">
      <svg viewBox="0 0 200 108" className="w-full" aria-hidden>
        <path d={arc} pathLength="100" fill="none" stroke="#E7E7E4" strokeWidth="9" strokeLinecap="round" />
        <path d={arc} pathLength="100" fill="none" stroke="#0A0A0A" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${p} 100`} />
        <circle cx={dot.x} cy={dot.y} r="7" fill="#FF6A1A" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="text-4xl font-light tracking-tight">{label}</div>
        {sub && <div className="text-xs text-mute">{sub}</div>}
      </div>
    </div>
  );
}

/** Thin vertical ticks. `values` are non-negative numbers; the peak is orange. */
export function TickChart({ values }) {
  const max = Math.max(...values, 0);
  return (
    <div className="flex h-52 items-end gap-[2px]" role="img" aria-label="Spending over the last 24 hours">
      {values.map((v, i) => (
        <span
          key={i}
          className={`flex-1 rounded-sm ${v > 0 && v === max ? 'bg-brand' : v > 0 ? 'bg-ink' : 'bg-black/10'}`}
          style={{ height: v > 0 ? `${Math.max(22, (v / max) * 100)}%` : '10%' }}
        />
      ))}
    </div>
  );
}

export function Empty({ title, desc }) {
  return (
    <div className="grid place-items-center gap-1 rounded-2xl bg-paper px-6 py-10 text-center">
      <div className="text-sm font-medium">{title}</div>
      <div className="max-w-xs text-xs text-mute">{desc}</div>
    </div>
  );
}
