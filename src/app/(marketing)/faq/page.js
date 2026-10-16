import { PageTitle, Section } from '../../../components/site/blocks';
import { BRAND } from '@/lib/site';

export const metadata = { title: 'FAQ', description: `Questions from judges and users about ${BRAND}.` };

const FAQ = [
  ['How is this different from x402?', `x402 is how an agent pays. ${BRAND} decides whether it's allowed to. They work together: the vault can top up an agent's x402 wallet in capped increments.`],
  ["Don't x402 wallets already have spending limits?", "Often, yes, usually enforced in the agent's SDK or a service the agent calls. We enforce limits in the contract that holds the funds, and we record every blocked attempt."],
  ['How do you make money?', 'We don\'t yet. The contract is free and open. Hosted alerts and approvals might be worth paying for; that is a hypothesis we will test, and we have set no prices.'],
    ['Can someone fork it and skip the fee?', 'Yes, the contract is open. Any paid value would be hosted alerts, approvals and an SDK, not the contract.'],
  ['Why no chat with the agent?', 'Free-text chat is the biggest injection surface. The agent sends a strict schema, and you set rules with sliders.'],
  ['What if the agent loses money inside the limits?', 'It can. We promise a ceiling on loss, not profit.'],
  ['How big is the market?', "We haven't measured it. Bitget's AI tools report 1M+ users (company-reported), which shows demand for delegated execution, but that's custodial. Sizing on-chain agent runners is our first pilot goal."],
  ['Will a big wallet add this?', "It's a real risk. Our bet is a vendor-neutral contract with public receipts, which a single wallet vendor's policy engine does not give you."],
  ['Is it production-ready?', "No. It's a testnet prototype. Trading and DeFi need selector and calldata rules, and portfolio rules need oracles; both are roadmap."],
  ['Regulatory?', 'Testnet only, no investment advice, no performance fees. Legal review comes before mainnet.'],
];

export default function Faq() {
  return (
    <>
      <PageTitle title="FAQ" />
      <Section>
        <div className="grid max-w-3xl gap-2">
          {FAQ.map(([q, a]) => (
            <details key={q} className="card group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-medium">
                {q}<span aria-hidden className="text-mute transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-mute">{a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-xs text-mute">Bitget figure: company-reported, via <a className="underline" href="https://www.techflowpost.com/en-US/newsletter/125681" target="_blank" rel="noreferrer">TechFlow</a>.</p>
      </Section>
    </>
  );
}
