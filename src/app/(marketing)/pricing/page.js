import Link from 'next/link';
import { PageTitle, Section, Source } from '../../../components/site/blocks';
import { BRAND } from '@/lib/site';

export const metadata = {
  title: 'Pricing',
  description: `Transparent, non-custodial pricing for ${BRAND}. Open-source core contracts and volume-aligned fee tiers for autonomous agent execution.`,
};

const TIERS = [
  {
    name: 'Community',
    badge: 'Open Source',
    price: '$0',
    frequency: 'forever',
    desc: 'Self-hosted vault contracts on Avalanche. Full control, zero protocol fees.',
    highlights: [
      'Open-source vault smart contracts',
      '0 bps fee on self-hosted instances',
      'On-chain per-transaction & daily spend limits',
      'Token & contract allowlist verification',
      'Automated circuit breaker on repeated blocks',
      'Owner-sovereign withdrawal at all times',
    ],
    cta: 'View Contracts',
    href: 'https://github.com/Cheguro/agentsafe',
    featured: false,
  },
  {
    name: 'Operator Pro',
    badge: 'Popular',
    price: '2 bps',
    frequency: 'on auto-spend (0.02%)',
    desc: 'Managed web dashboard, push approvals, and real-time alerts for active agent operators.',
    highlights: [
      'Hosted management interface & telemetry',
      '2 bps fee only on executed auto-transactions',
      '$0 fee on blocked, rejected, or manual actions',
      'Telegram & Discord alerts for Pending approvals',
      'One-tap mobile authorization signatures',
      'Fee cap enforced directly on-chain by the owner',
    ],
    cta: 'Open Testnet App',
    href: '/app',
    featured: true,
  },
  {
    name: 'Platforms & Enterprise',
    badge: 'For Builders',
    price: 'Custom',
    frequency: 'volume bps + platform license',
    desc: 'SDK and infrastructure for AI agent frameworks, DAOs, and autonomous agent platforms.',
    highlights: [
      'Multi-vault fleet SDK (ElizaOS, LangChain, CDP)',
      'Programmatic sub-vault provisioning for end-users',
      'Dedicated watcher relay & high-throughput RPC',
      'Custom webhook streaming & audit event indexing',
      'Custom policy rule extensions & co-development',
      'Priority SLA and enterprise onboarding',
    ],
    cta: 'Contact Builders',
    href: 'https://github.com/Cheguro/agentsafe/issues',
    featured: false,
  },
];

const COMPARISON = [
  {
    feature: 'Custody & Control',
    custodial: 'Exchange holds custody in private master & sub-accounts. Platform failure risks your balance.',
    bounded: 'Non-custodial smart contract on Avalanche. You hold the owner key; no intermediary holds your assets.',
  },
  {
    feature: 'Rule Enforcement',
    custodial: 'Software rules running inside private company databases. Off-chain and centralized.',
    bounded: 'Immutable EVM bytecode running on-chain. Agent keys can only propose; EVM code decides.',
  },
  {
    feature: 'Owner Sovereignty',
    custodial: 'Withdrawals subject to exchange approval, KYC limits, and operational maintenance.',
    bounded: 'Direct contract withdrawal. Owner functions operate independently of agent or relayer state.',
  },
  {
    feature: 'Audit Trail',
    custodial: 'Private internal database logs. Reverted or unauthorized attempts can be hidden.',
    bounded: 'Non-reverting on-chain audit log. Every block emits an immutable event with a clear reason.',
  },
];

const FAQS = [
  {
    q: 'How does the 2 bps on auto-spend fee work?',
    a: 'You only pay when your autonomous agent successfully executes an allowable transfer or swap. For example, a $50 automated trade incurs a $0.01 fee. If the agent is idle, or if a proposal is blocked by policy rules, the fee is exactly $0.',
  },
  {
    q: `Can ${BRAND} or any relayer touch my vault funds?`,
    a: `No. ${BRAND} is strictly non-custodial. The smart contract has no administrative backdoor or upgrade proxy that can drain funds. Only your owner key can withdraw assets, alter policies, or unfreeze the agent.`,
  },
  {
    q: 'What happens if a prompt injection attacks my agent?',
    a: 'If a compromised agent proposes an unapproved destination or exceeds spending limits, the contract blocks the transaction cleanly, logs the reason on-chain, and counts toward the circuit breaker. If repeated violations occur within the window, the agent is automatically frozen.',
  },
  {
    q: 'Can the operator relayer raise the basis-point fee unexpectedly?',
    a: 'No. The vault policy contains an on-chain fee ceiling configured by the owner. Any proposal demanding a fee higher than your configured cap is rejected by the contract.',
  },
];

export default function Pricing() {
  return (
    <>
      <PageTitle
        title="Predictable, aligned pricing."
        sub={`The contract is open source and non-custodial. We align with operators by charging basis points on autonomous execution — never on idle balances or blocked attacks.`}
      />

      <Section eyebrow="Tiers" title="Choose how you run your agent vault">
        <div className="grid gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col justify-between rounded-3xl p-6 transition-all ${
                tier.featured
                  ? 'glass ring-2 ring-brand-deep/30 shadow-lg'
                  : 'card ring-1 ring-ink/5'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-mute">
                    {tier.name}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tier.featured
                        ? 'bg-brand text-white'
                        : 'bg-paper text-ink ring-1 ring-ink/10'
                    }`}
                  >
                    {tier.badge}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-light tracking-tight">{tier.price}</span>
                  <span className="text-xs text-mute">{tier.frequency}</span>
                </div>

                <p className="mt-3 text-sm text-mute">{tier.desc}</p>

                <div className="mt-6 border-t border-ink/5 pt-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-mute">
                    Included capabilities:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {tier.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-brand-deep font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  href={tier.href}
                  className={`block w-full rounded-2xl py-2.5 text-center text-sm font-medium transition-all ${
                    tier.featured
                      ? 'bg-brand text-white hover:bg-brand-deep shadow-sm'
                      : 'bg-paper hover:bg-surface ring-1 ring-ink/10'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Architecture & Custody"
        title="Decentralized on-chain vault vs. Custodial exchange"
      >
        <p className="max-w-3xl text-mute">
          Centralized exchanges pioneered automated trading sub-accounts with risk boundaries<Source id="playbook" n={1} />. {BRAND} brings that exact operational playbook to decentralized finance: non-custodial custody where smart contracts, not internal exchange databases, enforce your rules.
        </p>

        <div className="mt-8 overflow-hidden rounded-3xl bg-surface ring-1 ring-ink/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wide text-mute">
              <tr>
                <th className="p-4">Dimension</th>
                <th className="p-4">Custodial Platforms (e.g. Bitget AI)</th>
                <th className="p-4 text-brand-deep">{BRAND} (Decentralized Vault)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="hover:bg-paper/40 transition-colors">
                  <td className="p-4 font-medium">{row.feature}</td>
                  <td className="p-4 text-mute text-xs sm:text-sm">{row.custodial}</td>
                  <td className="p-4 text-ink text-xs sm:text-sm font-medium bg-brand/5">
                    {row.bounded}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section eyebrow="FAQ" title="Frequently asked questions about pricing">
        <dl className="grid gap-4 md:grid-cols-2">
          {FAQS.map((faq) => (
            <div key={faq.q} className="card p-6">
              <dt className="text-base font-medium">{faq.q}</dt>
              <dd className="mt-2 text-sm text-mute leading-relaxed">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </>
  );
}
