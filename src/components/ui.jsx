import { BRAND } from '../lib/site';

export function Logo({ size = 36 }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid place-items-center rounded-full bg-brand" style={{ width: size * 1.35, height: size }}>
        <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} aria-hidden>
          <path d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z" fill="#0A0A0A" />
        </svg>
      </span>
      <span className="text-xl font-medium tracking-tight">{BRAND}</span>
    </span>
  );
}

export function Card({ title, action, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm text-mute">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

const ICONS = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  hand: <path d="M8 11V5.5a1.5 1.5 0 013 0V11m0-1V4.5a1.5 1.5 0 013 0V11m0-.5V6a1.5 1.5 0 013 0v7a7 7 0 01-7 7h-.5A6.5 6.5 0 015 17.5L3.5 14a1.5 1.5 0 012.6-1.5L8 15" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  pause: <path d="M9 5v14M15 5v14" />,
  dot: <circle cx="12" cy="12" r="3" />,
};

export function Icon({ name, className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  );
}

// Every tier shows icon + text + color, never color alone.
const TIERS = {
  AUTO: { label: 'Auto', icon: 'check', cls: 'bg-auto-soft text-auto' },
  APPROVED: { label: 'Approved', icon: 'check', cls: 'bg-auto-soft text-auto' },
  ASK: { label: 'Ask', icon: 'hand', cls: 'bg-ask-soft text-ask' },
  BLOCK: { label: 'Block', icon: 'x', cls: 'bg-block-soft text-block' },
  FREEZE: { label: 'Frozen', icon: 'pause', cls: 'bg-freeze-soft text-freeze' },
  REJECTED: { label: 'Rejected', icon: 'x', cls: 'bg-ink/5 text-mute' },
  EXPIRED: { label: 'Expired', icon: 'x', cls: 'bg-ink/5 text-mute' },
  OWNER: { label: 'Owner', icon: 'dot', cls: 'bg-ink/5 text-ink' },
};
export const tierKey = (t) => ({ PENDING: 'ASK', BLOCKED: 'BLOCK' }[t] || t);

export function TierBadge({ tier, label }) {
  const t = TIERS[tierKey(tier)] || TIERS.OWNER;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${t.cls}`}>
      <Icon name={t.icon} />
      {label || t.label}
    </span>
  );
}

export function Simulated({ children = 'Simulated' }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-dashed border-ink/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mute">
      {children}
    </span>
  );
}

export function Progress({ value, max, label }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="h-3 w-full overflow-hidden rounded-full bg-ink/10">
      <div className={`h-full rounded-full ${pct >= 100 ? 'bg-block' : 'bg-ink'}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Empty({ title, desc }) {
  return (
    <div className="grid place-items-center gap-1 rounded-2xl bg-paper px-6 py-10 text-center">
      <div className="text-sm font-medium">{title}</div>
      {desc && <div className="max-w-xs text-xs text-mute">{desc}</div>}
    </div>
  );
}

export function Skeleton({ rows = 3 }) {
  return (
    <div className="grid gap-2" aria-hidden>
      {Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton h-16" />)}
    </div>
  );
}

// Token / network marks drawn inline (no external images). tUSDC is a test token styled after USDC.
export function TokenIcon({ token, size = 20 }) {
  const s = { width: size, height: size };
  if (token === 'AVAX' || token === 'Avalanche') {
    return (
      <svg viewBox="0 0 32 32" style={s} aria-label={token === 'AVAX' ? 'AVAX' : 'Avalanche'} role="img">
        <circle cx="16" cy="16" r="16" fill="#E84142" />
        <path d="M20.6 16.9c.5-.9 1.4-.9 1.9 0l3.2 5.6c.5.9.1 1.6-.9 1.6h-6.5c-1 0-1.4-.7-.9-1.6l3.2-5.6zM14.4 6.8c.5-.9 1.3-.9 1.8 0l.7 1.3 1.7 3c.4.8.4 1.7 0 2.5l-5.6 9.7c-.5.8-1.3 1.3-2.2 1.4H6.3c-1 0-1.4-.7-.9-1.6l9-16.3z" fill="#fff" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" style={s} aria-label="tUSDC" role="img">
      <circle cx="16" cy="16" r="16" fill="#2775CA" />
      <path d="M20.4 18.3c0-2.3-1.4-3.1-4.2-3.4-2-.3-2.4-.8-2.4-1.7s.7-1.5 2-1.5c1.2 0 1.8.4 2.2 1.4.1.2.2.3.4.3h1c.3 0 .5-.2.5-.5-.3-1.4-1.4-2.5-2.9-2.7V8.7c0-.3-.2-.5-.5-.5h-.9c-.3 0-.5.2-.5.5v1.5c-1.9.3-3.1 1.5-3.1 3.1 0 2.2 1.3 3 4.1 3.4 1.9.3 2.4.7 2.4 1.8s-1 1.8-2.3 1.8c-1.8 0-2.4-.8-2.6-1.8-.1-.3-.3-.4-.5-.4h-1c-.3 0-.5.2-.5.5.3 1.6 1.3 2.7 3.4 3v1.5c0 .3.2.5.5.5h.9c.3 0 .5-.2.5-.5v-1.5c1.9-.3 3.2-1.6 3.2-3.3z" fill="#fff" />
      <path d="M12.9 25.1c-4.9-1.8-7.5-7.2-5.7-12.1 1-2.7 3.1-4.7 5.7-5.7.3-.1.4-.3.4-.6v-.9c0-.2-.1-.4-.4-.5h-.2C6.8 7.3 3.6 13.5 5.4 19.5c1.1 3.5 3.8 6.2 7.3 7.3.3.1.5 0 .6-.3v-1c0-.2-.2-.4-.4-.4zm6.3-19.7c-.3-.1-.5 0-.6.3v1c0 .3.2.5.4.6 4.9 1.8 7.5 7.2 5.7 12.1-1 2.7-3.1 4.7-5.7 5.7-.3.1-.4.3-.4.6v.9c0 .2.1.4.4.5h.2c6-1.9 9.2-8.1 7.3-14.1-1.1-3.5-3.8-6.2-7.3-7.6z" fill="#fff" />
    </svg>
  );
}

export function Amount({ value, token = 'tUSDC', size = 16, className = '' }) {
  return <span className={`inline-flex items-center gap-1.5 ${className}`}><TokenIcon token={token} size={size} />{value} {token}</span>;
}
