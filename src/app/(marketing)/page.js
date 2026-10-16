import Link from 'next/link';
import { HypothesisLabel, LayerDiagram, Section, TierStrip } from '../../components/site/blocks';
import MiniReplay from '../../components/site/MiniReplay';

export const metadata = {
  title: { absolute: 'Bounded: the spending limit for AI agents' },
  description: 'Give any AI agent access to your funds, with a ceiling you set and a contract that enforces it.',
};

const STEPS = [
  ['AI proposes', 'The agent sends a strict, structured proposal. It never holds your keys.'],
  ['You authorize', 'You set limits, allowlists and expiry in advance, and approve anything over a limit.'],
  ['Contract enforces', 'A public contract checks every proposal. Out-of-bounds spends never move.'],
];

export default function Home() {
  return (
    <>
      <section className="pt-12 sm:pt-20">
        <h1 className="max-w-4xl text-5xl font-light leading-[1.05] tracking-tight sm:text-7xl">The spending limit for AI agents.</h1>
        <p className="mt-6 max-w-2xl text-lg text-mute sm:text-xl">
          Give any AI agent access to your funds, with a ceiling you set and a contract that enforces it, even when the AI is hacked or wrong.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/app" className="btn btn-brand">Try the demo</Link>
          <Link href="/how-it-works" className="btn btn-ghost">How it works</Link>
        </div>
      </section>

      <Section eyebrow="The problem" title="Today you choose: hand funds to a custodian, or give the agent your full keys.">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="card"><h3 className="text-lg font-medium">Hand your funds to a custodian</h3><p className="mt-2 text-mute">You get convenience. Your money sits in someone else&apos;s system.</p></div>
          <div className="card"><h3 className="text-lg font-medium">Give the agent your full keys</h3><p className="mt-2 text-mute">You keep custody. There&apos;s no ceiling on what a hacked or confused AI can lose.</p></div>
        </div>
      </Section>

      <Section eyebrow="The idea" title="AI proposes. You authorize. The contract enforces.">
        <ol className="grid gap-3 md:grid-cols-3">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="card"><div className="text-xs text-mute">Step {i + 1}</div><div className="mt-1 text-lg font-medium">{t}</div><p className="mt-2 text-sm text-mute">{d}</p></li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="Four tiers" title="Every proposal gets exactly one decision."><TierStrip /></Section>

      <Section eyebrow="See it" title="We can't stop an AI from being tricked. So we make being tricked harmless.">
        <p className="mb-4 max-w-2xl text-mute">The agent can only propose. The contract decides.</p>
        <MiniReplay />
      </Section>

      <Section eyebrow="Where it fits" title="x402 is how an agent pays. Bounded decides whether it's allowed to."><LayerDiagram /></Section>

      <Section eyebrow="Who it's for" title="Built for people already running agents with real funds.">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="card"><div className="text-xs text-mute">Primary</div><p className="mt-2">People and teams running AI agents with real funds: trading and DeFi automation, DAOs delegating routine spend.</p></div>
          <div className="card"><div className="text-xs text-mute">Secondary</div><p className="mt-2">Platforms and agent builders who embed Bounded as a trust layer.</p></div>
          <div className="card"><div className="text-xs text-mute">Not for</div><p className="mt-2">People content to leave funds on an exchange.</p></div>
        </div>
      </Section>

      <Section eyebrow="Pricing" title="Safety is always free. You only pay when money moves.">
        <HypothesisLabel />
        <p className="mt-4"><Link href="/pricing" className="underline underline-offset-4">See pricing hypotheses</Link></p>
      </Section>

      <Section className="rounded-[2rem] bg-ink px-6 text-surface sm:px-10" eyebrow="Honest limits" title="We cap losses; we don't promise profits or a smarter AI.">
        <p className="max-w-2xl opacity-80">Bounded caps losses. It doesn&apos;t promise profits, and it doesn&apos;t make the AI smarter.</p>
        <Link href="/app" className="btn btn-brand mt-6">Try the demo</Link>
      </Section>
    </>
  );
}
