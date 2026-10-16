import { LayerDiagram, PageTitle, Section, TierStrip } from '../../../components/site/blocks';
import { TierBadge } from '../../../components/ui';

export const metadata = { title: 'How it works', description: 'Tiers, circuit breaker, receipts, and why the AI has no authority.' };

const ORDER = [
  ['BLOCK', 'Agent frozen or revoked', 'FROZEN'],
  ['BLOCK', 'Policy expired', 'EXPIRED'],
  ['BLOCK', 'Destination not on your allowlist', 'NOT_ALLOWLISTED'],
  ['ASK', 'Over per-payment limit, remaining daily limit, or max % of vault', 'OVER_PER_TX · OVER_DAILY · OVER_VAULT_PCT'],
  ['AUTO', 'Within every limit, approved destination', 'NONE'],
];

export default function HowItWorks() {
  return (
    <>
      <PageTitle title="How it works" sub="The agent can only propose. The contract decides, in a fixed order, and records every decision." />
      <Section eyebrow="Tiers" title="Four outcomes"><TierStrip /></Section>
      <Section eyebrow="Evaluation order" title="Checked top to bottom. The first match wins.">
        <ol className="grid gap-2">
          {ORDER.map(([t, d, code], i) => (
            <li key={code} className="card flex flex-wrap items-center gap-3"><span className="text-xs text-mute">{i + 1}</span><TierBadge tier={t} /><span className="flex-1 text-sm">{d}</span><code className="font-mono text-xs text-mute">{code}</code></li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-mute">Daily limits use a fixed UTC day. Known edge case: an agent can spend up to about 2x the daily limit across midnight.</p>
      </Section>
      <Section eyebrow="Circuit breaker" title="Too many blocks, and the agent freezes itself.">
        <div className="prose-b grid max-w-3xl gap-3">
          <p>Every blocked proposal is counted in a rolling window. When the count reaches your threshold (default 3 in 10 minutes), the agent is frozen and an AgentFrozen event is recorded. Every later proposal is blocked with reason FROZEN until you unfreeze.</p>
          <p>Blocked proposals don&apos;t revert. They return a decision and emit an event, so the reason and the counter persist on-chain. Rejected or expired approval requests don&apos;t count toward the breaker.</p>
        </div>
      </Section>
      <Section eyebrow="Receipts" title="Every attempt is recorded, including blocked ones.">
        <p className="max-w-3xl text-mute">Each proposal produces a Proposed event and exactly one Decided event with the tier and reason. Approvals, rejections, freezes and rule changes are events too. The receipt timeline is built only from this log.</p>
      </Section>
      <Section eyebrow="Why the AI has no authority" title="Strict schema at execution. No chat.">
        <div className="prose-b grid max-w-3xl gap-3">
          <p>The agent sends a fixed proposal: action, token, amount, destination. Unknown fields are rejected. There is no free-text channel that can talk the vault into anything.</p>
          <p>Rules are set by you with sliders. Tightening applies instantly. Loosening shows a structured diff and needs your explicit confirmation. An AI may suggest tightening; it can never loosen a rule on its own.</p>
        </div>
      </Section>
      <Section eyebrow="Layer model" title="Agent, Bounded, Wallet, Rails"><LayerDiagram /></Section>
    </>
  );
}
