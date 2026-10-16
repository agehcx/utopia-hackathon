import { PageTitle, Section, ThreatTable } from '../../../components/site/blocks';

export const metadata = { title: 'Security', description: 'Threat model, assumptions and limitations of the Bounded prototype.' };

const DONT_CLAIM = [
  'We don\'t claim funds are safe. We claim loss is bounded by the limits you set.',
  'We don\'t prevent bad trades inside your limits.',
  'The contract is unaudited and runs on Fuji testnet only.',
  'The demo app runs on a simulated engine that mirrors the contract. The engine also models a max-%-of-vault cap, a fee cap and split over-limit reasons that the current contract does not have yet.',
  'Real x402 payments and real DEX swaps are not integrated. Both are simulated and labeled.',
  'Known contract edge cases: daily limits use a fixed UTC day (up to ~2x across midnight); an AVAX send to a reverting allowlisted contract reverts the whole proposal.',
];

export default function Security() {
  return (
    <>
      <PageTitle title="Security" sub="We assume the agent will be compromised. That's why the contract, not the AI, is the authority." />
      <Section eyebrow="Threat model" title="Threat, mitigation, residual risk"><ThreatTable /></Section>
      <Section eyebrow="Trust boundary" title="Who can do what">
        <ul className="grid gap-3 md:grid-cols-3">
          <li className="card"><div className="font-medium">Agent key</div><p className="mt-2 text-sm text-mute">Untrusted. Can only call propose. Cannot change rules, approve, or withdraw.</p></li>
          <li className="card"><div className="font-medium">Vault contract</div><p className="mt-2 text-sm text-mute">Trusted. Non-upgradeable. Decides every proposal and records it.</p></li>
          <li className="card"><div className="font-medium">Owner</div><p className="mt-2 text-sm text-mute">Root. Withdraw and freeze are never blockable by the agent or the policy.</p></li>
        </ul>
      </Section>
      <Section eyebrow="What we don't claim" title="Limitations">
        <ul className="grid max-w-3xl gap-2">{DONT_CLAIM.map((d) => <li key={d} className="card text-sm">{d}</li>)}</ul>
      </Section>
    </>
  );
}
