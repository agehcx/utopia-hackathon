import { HypothesisLabel, PageTitle, Section, Source, SourceList } from '../../../components/site/blocks';
import FeeCalc from '../../../components/site/FeeCalc';

export const metadata = { title: 'Pricing', description: 'Pricing hypotheses: free safety core, capped usage fee on executed volume.' };

const TIERS = [
  ['Free open-source core', '$0', 'Limits, allowlists, tiers, freeze, withdraw, circuit breaker, receipt timeline. Never charged on blocked or frozen actions.'],
  ['Usage fee (individuals)', '1–2 bps on executed volume', 'Auto and approved Ask only, hard-capped by your "Max Bounded fee" rule. Includes hosted relay, alerts, phone approvals, history.'],
  ['Teams', '~$99 / month', 'Multi-approver, audit export, approval routing, shared templates.'],
  ['Platforms', 'Per protected agent', 'White-label SDK. Price to be validated.'],
];

const RULES = [
  'Charged on executed volume only.',
  'Never on Block, Freeze, withdraw or rule changes.',
  'You approve a max fee in your own rules.',
  'Collected via the hosted relay and app, not forced by the open contract.',
];

export default function Pricing() {
  return (
    <>
      <PageTitle title="Safety is always free. You only pay when money moves." />
      <div className="mt-6"><HypothesisLabel /></div>
      <Section eyebrow="Tiers">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map(([n, p, d]) => (
            <li key={n} className="card"><div className="text-sm text-mute">{n}</div><div className="mt-2 text-xl font-medium">{p}</div><p className="mt-2 text-sm">{d}</p><div className="mt-3"><HypothesisLabel /></div></li>
          ))}
        </ul>
        <p className="mt-4 max-w-3xl text-sm text-mute">The usage-fee model is inspired by builder-code style fees<Source id="builderCodes" n={1} />. Our fee would sit on top of venue fees and gas, not replace them.</p>
      </Section>
      <Section eyebrow="Fee rules" title="Plainly">
        <ul className="grid max-w-2xl gap-2">{RULES.map((r) => <li key={r} className="card text-sm">{r}</li>)}</ul>
      </Section>
      <Section eyebrow="Calculator" title="What would a usage fee be?">
        <div className="grid gap-4 lg:grid-cols-2">
          <FeeCalc />
          <div className="text-sm text-mute"><p>Formula: monthly fee = executed volume × bps ÷ 10,000.</p><p className="mt-2">This shows what a user would pay. We don&apos;t project revenue for Bounded.</p><div className="mt-4"><HypothesisLabel /></div></div>
        </div>
      </Section>
      <SourceList ids={['builderCodes']} />
    </>
  );
}
