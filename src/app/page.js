import Link from 'next/link';
import { Logo, Pill } from '../components/ui';

const TIERS = [
  { n: '01', tone: 'AUTO', name: 'Auto', body: 'Inside your limits and sent to someone you trust. The vault pays instantly, no tap needed.' },
  { n: '02', tone: 'ASK', name: 'Ask', body: 'Over a limit but to a valid recipient. It waits in a queue until you approve in your wallet.' },
  { n: '03', tone: 'BLOCKED', name: 'Blocked', body: 'Breaks a rule. Funds stay put, and the attempt is written on-chain so you can see it.' },
];

const TRUST = [
  ['AI agent', 'Untrusted', 'Turns your words into proposed payments. Nothing more.'],
  ['Agent key', 'Propose only', 'Cannot withdraw, change rules or unfreeze itself.'],
  ['Vault contract', 'Trusted · public', 'The only thing that can move your money. Anyone can read it.'],
  ['Your wallet', 'Root authority', 'Sets rules, approves, freezes and withdraws. Always.'],
];

const THREATS = [
  ['Prompt injection', 'A hostile page tells the agent to “send everything to me”.', 'The address isn’t allowlisted, so the vault blocks it.'],
  ['Stolen agent key', 'Someone else now holds the agent’s key.', 'It can only propose, within your limits, until you freeze it.'],
  ['Repeated bad attempts', 'The agent keeps trying things it shouldn’t.', 'The circuit breaker freezes it after N blocks.'],
];

const Section = ({ id, eyebrow, title, children }) => (
  <section id={id} className="scroll-mt-24 py-16 sm:py-24">
    <p className="text-sm text-mute">{eyebrow}</p>
    <h2 className="mt-2 max-w-2xl text-4xl font-normal tracking-tight sm:text-5xl">{title}</h2>
    <div className="mt-10">{children}</div>
  </section>
);

export default function Landing() {
  return (
    <div className="mx-auto max-w-[1280px] p-3 sm:p-6">
      <div className="rounded-[2rem] bg-paper px-5 pb-8 pt-5 shadow-[0_30px_60px_-40px_rgba(0,0,0,.35)] sm:px-10">
        <header className="flex items-center justify-between">
          <Logo />
          <nav className="hidden gap-1 md:flex" aria-label="Site">
            {[['How it works', '#how'], ['Trust', '#trust'], ['Safety', '#safety']].map(([l, h]) => (
              <a key={h} href={h} className="rounded-xl px-4 py-2 text-sm text-ink/70 hover:bg-black/5">{l}</a>
            ))}
          </nav>
          <Link href="/app" className="btn btn-ink">Launch app</Link>
        </header>

        <section className="grid items-center gap-12 pb-10 pt-16 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
          <div>
            <div className="flex gap-2"><Pill tone="testnet">Avalanche Fuji · Testnet</Pill><Pill tone="mock">Prototype</Pill></div>
            <h1 className="mt-6 text-5xl font-normal leading-[1.02] tracking-tight sm:text-7xl">
              Let AI spend.<br />
              <span className="text-brand">Never lose control.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink/70">
              Bounded is an on-chain vault with rules you set. Your AI agent can only <i>propose</i> payments. The smart contract decides what actually moves, and even a hijacked agent can’t spend past your limits.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/app" className="btn btn-brand !px-7 !py-3.5 text-base">Launch app</Link>
              <a href="#how" className="btn btn-ghost !px-7 !py-3.5 text-base">See how it works</a>
            </div>
            <p className="mt-6 text-sm text-mute">AI prepares and explains. You authorize. The contract enforces.</p>
          </div>

          <div className="relative mx-auto h-[26rem] w-full max-w-md" aria-hidden>
            <div className="glass absolute inset-x-0 top-0 h-52 rotate-[3deg] rounded-[2rem] p-6 opacity-60" />
            <div className="glass absolute inset-x-4 top-8 h-52 -rotate-[2deg] rounded-[2rem] p-6 opacity-80" />
            <div className="glass absolute inset-x-8 top-16 h-60 rounded-[2rem] p-6">
              <div className="text-sm font-medium">Agent proposal</div>
              <p className="mt-5 text-3xl font-light leading-tight">Pay 1.5 tUSDC to <b className="font-medium">Data service</b></p>
              <div className="mt-6"><Pill tone="AUTO">Auto · paid</Pill></div>
            </div>
            <div className="absolute -bottom-2 left-0 right-6 rounded-3xl bg-white p-4 shadow-xl ring-1 ring-black/5">
              <div className="flex items-center gap-3">
                <Pill tone="BLOCKED" />
                <div>
                  <div className="text-sm font-medium">Blocked 15 tUSDC to 0x0000…dEaD</div>
                  <div className="text-xs text-mute">That recipient isn’t on your allowlist.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Section id="how" eyebrow="How it works" title="Every payment lands in one of three tiers.">
          <div className="grid gap-4 md:grid-cols-3">
            {TIERS.map((t) => (
              <article key={t.n} className="glass rounded-[1.75rem] p-6">
                <div className="flex items-center justify-between"><span className="text-sm">{t.n}</span><Pill tone={t.tone}>{t.name}</Pill></div>
                <p className="mt-10 text-xl font-light leading-snug">{t.body}</p>
              </article>
            ))}
          </div>
          <ol className="mt-8 grid gap-4 text-sm md:grid-cols-4">
            {['You set limits, an allowlist and an expiry', 'You tell the agent what you want in plain language', 'The agent proposes. The vault decides', 'Every outcome becomes a receipt you can verify'].map((s, i) => (
              <li key={s} className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
                <span className="text-3xl font-light text-brand">{i + 1}</span>
                <p className="mt-3 text-ink/80">{s}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="trust" eyebrow="Trust boundary" title="Safety comes from code, not from the AI behaving.">
          <div className="grid gap-3 md:grid-cols-2">
            {TRUST.map(([who, level, what]) => (
              <div key={who} className="flex items-start justify-between gap-4 rounded-2xl bg-white p-5 ring-1 ring-black/5">
                <div><div className="font-medium">{who}</div><p className="mt-1 text-sm text-ink/70">{what}</p></div>
                <span className="shrink-0 rounded-full bg-paper px-3 py-1 text-xs text-ink/70">{level}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="safety" eyebrow="When things go wrong" title="The worst case is whatever your limits allow.">
          <div className="grid gap-4 md:grid-cols-3">
            {THREATS.map(([t, scene, answer]) => (
              <article key={t} className="rounded-3xl bg-white p-6 ring-1 ring-black/5">
                <h3 className="text-lg font-medium">{t}</h3>
                <p className="mt-2 text-sm text-mute">{scene}</p>
                <p className="mt-4 rounded-2xl bg-paper p-4 text-sm">{answer}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-sm text-mute">
            Honest limits: guardrails cap the damage, they don’t make the AI’s decisions good. A bad-but-allowed trade is still possible. Testnet only, unaudited.
          </p>
        </Section>

        <section className="rounded-[2rem] bg-ink p-8 text-white sm:p-14">
          <h2 className="max-w-xl text-4xl font-normal tracking-tight sm:text-5xl">See it block an attack in 30 seconds.</h2>
          <p className="mt-4 max-w-lg text-white/60">Open the app, set your rules, then run the demo attack and watch the vault refuse it.</p>
          <Link href="/app" className="btn btn-brand mt-8 !px-7 !py-3.5 text-base">Launch app</Link>
        </section>

        <footer className="mt-10 text-center text-xs text-mute">
          Bounded · Avalanche Fuji testnet · unaudited prototype · demo data in the app is MOCK.
        </footer>
      </div>
    </div>
  );
}
