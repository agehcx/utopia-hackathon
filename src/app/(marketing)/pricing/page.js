import { HypothesisLabel, PageTitle, Section } from '../../../components/site/blocks';

export const metadata = { title: 'Pricing', description: 'The contract is free. Hosted alerts and approvals are a hypothesis we will test.' };

const TIERS = [
  ['Free open-source core', '$0', 'Limits, allowlists, tiers, freeze, withdraw, circuit breaker, receipt timeline. The contract is open; anyone can fork it.'],
  ['Hosted alerts and approvals', 'No price set', 'Relay, alerts, phone approvals, history. A hypothesis: we do not yet know whether teams would pay for this.'],
  ['Platforms', 'No price set', 'SDK for agent builders who want a spending boundary. To be validated with builders.'],
];

export default function Pricing() {
  return (
    <>
      <PageTitle title="The contract is free. Everything else is a hypothesis." />
      <div className="mt-6"><HypothesisLabel /></div>
      <Section eyebrow="Tiers">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map(([n, p, d]) => (
            <li key={n} className="card"><div className="text-sm text-mute">{n}</div><div className="mt-2 text-xl font-medium">{p}</div><p className="mt-2 text-sm">{d}</p><div className="mt-3"><HypothesisLabel /></div></li>
          ))}
        </ul>
      </Section>
      <Section eyebrow="How we will test it" title="Plainly">
        <ul className="grid max-w-2xl gap-2">
          <li className="card text-sm">No billing exists. Nothing on this page is a price.</li>
          <li className="card text-sm">Kill criterion: if fewer than two of ten x402 agent teams would pay or deposit a small balance, we drop the paid tier.</li>
        </ul>
      </Section>
          </>
  );
}
