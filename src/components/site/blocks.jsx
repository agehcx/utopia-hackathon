// Reusable marketing blocks: section, tier strip, layer diagram, threat table, sources, labels.
import { TierBadge, Simulated } from '../ui';
import { SOURCES, TIER_COPY, HYPOTHESIS, COMPARE_NOTE } from '../../lib/site';
import { BRAND } from '@/lib/site';

export function Section({ id, eyebrow, title, children, className = '' }) {
  return (
    <section id={id} className={`py-10 sm:py-14 ${className}`}>
      {eyebrow && <p className={`text-xs font-semibold uppercase tracking-widest ${className.includes('dark-band') ? 'text-brand' : 'text-brand-deep'}`}>{eyebrow}</p>}
      {title && <h2 className="mt-2 max-w-3xl text-3xl font-light tracking-tight sm:text-4xl">{title}</h2>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function PageTitle({ title, sub }) {
  return (
    <div className="pt-10 sm:pt-16">
      <h1 className="max-w-3xl text-4xl font-light tracking-tight sm:text-6xl">{title}</h1>
      {sub && <p className="mt-4 max-w-2xl text-lg text-mute">{sub}</p>}
    </div>
  );
}

const TIERS = [
  ['AUTO', 'Auto'], ['ASK', 'Ask'], ['BLOCK', 'Block'], ['FREEZE', 'Circuit breaker'],
];

export function TierStrip() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {TIERS.map(([k, label]) => (
        <li key={k} className="card">
          <TierBadge tier={k} label={label} />
          <p className="mt-3 text-sm leading-relaxed">{TIER_COPY[k]}</p>
        </li>
      ))}
    </ul>
  );
}

const LAYERS = [
  { name: 'Agent', desc: 'Any AI. Untrusted. Can only propose.' },
  { name: `${BRAND}`, desc: 'Who may spend, and how much. Enforced by the contract.', hl: true },
  { name: 'Wallet', desc: 'The vault holds the funds you own.' },
  { name: 'Rails', desc: 'x402, transfers, DeFi. How money actually moves.' },
];

export function LayerDiagram() {
  return (
    <ol className="grid gap-2 sm:grid-cols-4" aria-label={`Layer model: Agent, ${BRAND}, Wallet, Rails`}>
      {LAYERS.map((l, i) => (
        <li key={l.name} className={`relative rounded-3xl p-5 ${l.hl ? 'glass' : 'card'}`}>
          <div className="text-xs opacity-70">Layer {i + 1}</div>
          <div className="text-xl font-medium">{l.name}</div>
          <p className="mt-1 text-sm opacity-80">{l.desc}</p>
          {i < LAYERS.length - 1 && <span aria-hidden className="absolute -bottom-3 left-1/2 text-mute sm:-right-3 sm:bottom-auto sm:left-auto sm:top-1/2">→</span>}
        </li>
      ))}
    </ol>
  );
}

export const THREATS = [
  ['Prompt injection', 'Contract enforcement, allowlists, schema-only agent input', 'Loss up to your limits'],
  ['Agent key stolen', 'The key can only propose; limits, breaker and owner freeze', 'Loss up to limits before freeze'],
  ['Spam of blocked proposals', 'Breaker freezes the agent; the agent pays gas', 'Owner must unfreeze after false trips'],
  ['Rule-setup manipulation', 'Structured diff signed by the owner; tightening easy, loosening gated', 'A user could still sign a bad policy'],
  ['Bad trades within limits', 'Not preventable', 'Loss stays bounded; no promise of a perfect AI'],
  ['Frontend tampering', "Safety doesn't depend on the UI; the contract enforces", 'User could be shown a misleading screen'],
  ['Compromised owner wallet', 'Out of scope', 'Owner key is root'],
];

export function ThreatTable() {
  return (
    <>
      <table className="hidden w-full overflow-hidden rounded-3xl bg-surface text-left text-sm ring-1 ring-ink/5 md:table">
        <thead className="bg-paper text-xs uppercase tracking-wide text-mute">
          <tr><th className="p-4">Threat</th><th className="p-4">Mitigation</th><th className="p-4">Residual risk</th></tr>
        </thead>
        <tbody>
          {THREATS.map(([t, m, r]) => (
            <tr key={t} className="border-t border-ink/5"><th scope="row" className="p-4 font-medium">{t}</th><td className="p-4">{m}</td><td className="p-4 text-mute">{r}</td></tr>
          ))}
        </tbody>
      </table>
      <ul className="grid gap-3 md:hidden">
        {THREATS.map(([t, m, r]) => (
          <li key={t} className="card text-sm"><div className="font-medium">{t}</div><p className="mt-2">{m}</p><p className="mt-1 text-mute">Residual: {r}</p></li>
        ))}
      </ul>
    </>
  );
}

export function Source({ id, n }) {
  const s = SOURCES[id];
  return <sup><a href={s.url} target="_blank" rel="noreferrer" className="text-brand-deep underline" aria-label={`Source: ${s.label}`}>[{n}]</a></sup>;
}

export function SourceList({ ids }) {
  return (
    <ol className="mt-6 grid gap-1 text-xs text-mute">
      {ids.map((id, i) => <li key={id}>[{i + 1}] <a className="underline" href={SOURCES[id].url} target="_blank" rel="noreferrer">{SOURCES[id].label}</a></li>)}
    </ol>
  );
}

export const HypothesisLabel = () => <p className="inline-flex rounded-full bg-ask-soft px-3 py-1 text-xs font-medium text-ask">{HYPOTHESIS}</p>;
export const CompareNote = () => <p className="mt-3 text-xs text-mute">{COMPARE_NOTE}</p>;
export { Simulated };
