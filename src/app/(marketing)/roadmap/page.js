import { PageTitle, Section } from '../../../components/site/blocks';

export const metadata = { title: 'Roadmap', description: 'What the hackathon prototype includes, and what comes next.' };

const STATUS = { Built: 'bg-auto-soft text-auto', Simulated: 'border border-dashed border-ink/30 text-mute', Planned: 'bg-ink/5 text-ink' };

const COLUMNS = [
  ['Hackathon', [
    ['Vault contract with Auto / Ask / Block tiers and circuit breaker (Foundry-tested, Fuji deploy script; not yet deployed)', 'Built'],
    ['Per-token per-payment and daily limits', 'Built'],
    ['Allowlist for recipients and destination contracts', 'Built'],
    ['Receipts for every attempt, including blocked ones (contract events)', 'Built'],
    ['Max %-of-vault cap per action (demo engine only)', 'Simulated'],
    ['Schema-only agent input', 'Simulated'],
    ['Injection-to-freeze demo', 'Simulated'],
    ['Demo pool and x402-style payments', 'Simulated'],
  ]],
  ['Next', [
    ['Request expiry, revalidation on approve, idempotency keys, rate limits per recipient', 'Planned'],
    ['Vault-funded x402 wallet top-ups in capped increments', 'Planned'],
    ['Plain-language rule setup (tighten easy, loosen gated)', 'Planned'],
    ['Rule templates', 'Planned'],
    ['Alerts and phone approvals', 'Planned'],
    ['Wallet-connected app reading the Fuji contract', 'Planned'],
  ]],
  ['Later', [
    ['Function-selector and calldata rules (needed before any DEX or DeFi use)', 'Planned'],
    ['Drawdown and portfolio-value rules (needs oracles)', 'Planned'],
    ['Native x402 signing from the vault (feasibility to verify)', 'Planned'],
    ['Multi-approver', 'Planned'],
    ['Platform SDK', 'Planned'],
    ['Mainnet, after legal review and an audit', 'Planned'],
  ]],
];

export default function Roadmap() {
  return (
    <>
      <PageTitle title="Roadmap" sub="Hackathon scope versus what comes next. Every item is labeled Built, Simulated or Planned." />
      <Section>
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map(([name, items]) => (
            <div key={name} className="card">
              <h2 className="text-lg font-medium">{name}</h2>
              <ul className="mt-4 grid gap-2">
                {items.map(([t, s]) => (
                  <li key={t} className="flex items-start justify-between gap-3 rounded-2xl bg-paper p-3 text-sm">
                    <span>{t}</span><span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS[s]}`}>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
