import Link from 'next/link';
import { HypothesisLabel, LayerDiagram, Section, TierStrip } from '../../components/site/blocks';
import { Simulated, TierBadge, TokenIcon } from '../../components/ui';
import MiniReplay from '../../components/site/MiniReplay';
import { BRAND } from '@/lib/site';

export const metadata = {
  title: { absolute: `${BRAND}: a spending firewall for AI agents` },
  description: `x402 gives agents a way to pay. ${BRAND} gives owners a way to say no. Live on Avalanche Fuji.`,
};

const STEPS = [
  ['AI proposes', 'The agent sends a strict, structured proposal. It never holds your keys.'],
  ['You authorize', 'You set limits, allowlists and expiry in advance, and approve anything over a limit.'],
  ['Contract enforces', 'A public contract checks every proposal. Out-of-bounds spends never move.'],
];

export default function Home() {
  return (
    <>
      <section className="mt-4 grid items-center gap-12 rounded-[2rem] bg-paper px-6 py-12 sm:px-10 lg:grid-cols-[1.1fr_1fr] lg:py-16">
        <div>
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 ring-1 ring-ink/10"><TokenIcon token="Avalanche" size={14} /> Avalanche Fuji · Testnet</span>
            <span className="rounded-full bg-brand px-3 py-1 text-[#0A0A0A]">Prototype</span>
          </div>
          <h1 className="mt-6 text-5xl font-light leading-[1.05] tracking-tight sm:text-7xl">A spending firewall <span className="text-brand">for AI agents.</span></h1>
          <p className="mt-6 max-w-xl text-lg text-mute">
            x402 gives agents a way to pay. {BRAND} gives owners a way to say no: a ceiling you set, enforced by a contract, even when the AI is tricked.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/app" className="btn btn-brand">Try the demo</Link>
            <Link href="/how-it-works" className="btn btn-ghost">How it works</Link>
          </div>
        </div>
        <div className="relative mx-auto h-[26rem] w-full max-w-md" aria-hidden>
          <div className="glass absolute inset-x-0 top-0 h-52 rotate-[3deg] rounded-[2rem] opacity-60" />
          <div className="glass absolute inset-x-4 top-8 h-52 -rotate-[2deg] rounded-[2rem] opacity-80" />
          <div className="glass absolute inset-x-8 top-16 h-60 rounded-[2rem] p-6">
            <div className="flex items-center justify-between text-sm font-medium">Agent proposal <Simulated /></div>
            <p className="mt-1 text-xs text-mute">x402-style demo payment (no real x402 facilitator)</p>
            <p className="mt-4 flex flex-wrap items-center gap-2 text-3xl font-light leading-tight"><TokenIcon size={28} /> Pay 1.5 tUSDC to <b className="font-medium">Sentiment API</b></p>
            <div className="mt-6"><TierBadge tier="AUTO" label="Auto · executed" /></div>
          </div>
          <div className="absolute -bottom-2 left-0 right-6 rounded-3xl bg-surface p-4 shadow-xl ring-1 ring-ink/5">
            <div className="flex items-center gap-3">
              <TierBadge tier="BLOCK" />
              <div>
                <div className="text-sm font-medium">Blocked 45 tUSDC to 0x0000…dEaD</div>
                <div className="text-xs text-mute">That destination isn&apos;t on your allowlist.</div>
              </div>
            </div>
          </div>
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

      <Section eyebrow="Where it fits" title={`x402 is how an agent pays. ${BRAND} decides whether it's allowed to.`}><LayerDiagram /></Section>

      <Section eyebrow="Who it's for" title="Built for people already running agents with real funds.">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="card"><div className="text-xs text-mute">Primary</div><p className="mt-2">Developers and teams whose agents pay for APIs and data one request at a time (x402-style payments), and anyone giving an agent a capped allowance.</p></div>
          <div className="card"><div className="text-xs text-mute">Secondary</div><p className="mt-2">Platforms and agent builders who embed {BRAND} as a trust layer.</p></div>
          <div className="card"><div className="text-xs text-mute">Not for</div><p className="mt-2">People content to leave funds on an exchange.</p></div>
        </div>
      </Section>

      <Section eyebrow="Pricing" title="The contract is free. Everything else is a hypothesis.">
        <HypothesisLabel />
        <p className="mt-4"><Link href="/pricing" className="underline underline-offset-4">See pricing hypotheses</Link></p>
      </Section>

      <Section className="dark-band rounded-[2rem] bg-[#0A0A0A] px-6 text-white sm:px-10" eyebrow="Honest limits" title="We cap losses; we don't promise profits or a smarter AI.">
        <p className="max-w-2xl opacity-80">{BRAND} caps losses. It doesn&apos;t promise profits, and it doesn&apos;t make the AI smarter.</p>
        <Link href="/app" className="btn btn-brand mt-6">Try the demo</Link>
      </Section>
    </>
  );
}
