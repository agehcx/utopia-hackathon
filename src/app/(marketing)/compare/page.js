import { CompareNote, LayerDiagram, PageTitle, Section, Source, SourceList } from '../../../components/site/blocks';

export const metadata = { title: 'Compare', description: 'Where Bounded fits next to x402, off-chain policy layers, custodial AI trading and smart accounts.' };

const COLS = ['Bounded', 'x402 (rail)', 'Off-chain policy layers (e.g. PolicyLayer)', 'Custodial AI trading (e.g. Bitget AI)', 'Smart-account modules', 'Agent holds full key'];

// [value, hover note] per column.
const ROWS = [
  ['Self-custody', [['Yes', 'Funds sit in a vault contract you own.'], ['Varies', 'Depends on the wallet paying over x402.'], ['Varies', 'Depends on the wallet behind the policy service.'], ['No', 'Funds sit on the exchange.'], ['Yes', 'Your smart account.'], ['Yes', 'But with no ceiling.']]],
  ['Rules enforced on-chain', [['Yes', 'In the contract that holds the funds.'], ['No', 'x402 is a payment protocol, not a policy layer.'], ['No', 'Enforced by an off-chain service.'], ['No', "Enforced in the exchange's systems."], ['Yes', 'Enforced by on-chain modules.'], ['No', 'No rules.']]],
  ["Hijacked agent can't skip the check", [['Yes', 'The agent key can only call propose.'], ['No', 'No policy check of its own.'], ['Partial', 'Only if every spend routes through the service.'], ['Yes', 'The exchange enforces sub-account limits.'], ['Yes', 'If the module is configured on every path.'], ['No', 'The agent can sign anything.']]],
  ['Human approval tier', [['Yes', 'Over-limit spends wait for you.'], ['No', ''], ['Varies', 'Product-dependent.'], ['Varies', 'Product-dependent.'], ['Varies', 'Possible with multisig setups.'], ['No', '']]],
  ['Blocked attempts recorded', [['Yes', 'Every block emits an event with a reason.'], ['No', ''], ['Partial', 'Off-chain logs.'], ['Varies', 'Exchange-internal.'], ['Partial', 'Reverted transactions leave little trace.'], ['No', '']]],
  ['Covers all spending, not only HTTP payments', [['Yes', 'Transfers, swaps and x402 top-ups all come from the vault.'], ['No', 'HTTP payments only.'], ['Partial', 'Focused on x402 payments.'], ['Partial', 'Trading on that exchange only.'], ['Yes', 'Anything the account signs.'], ['No', 'No coverage at all.']]],
  ['Easy for non-experts', [['Partial', 'Prototype; sliders and plain-language receipts.'], ['Varies', ''], ['Varies', ''], ['Yes', 'Fully hosted.'], ['No', 'Usually developer tooling.'], ['No', '']]],
];

const tone = { Yes: 'text-auto', No: 'text-block', Partial: 'text-ask', Varies: 'text-mute' };
const Cell = ({ v: [v, note] }) => <span title={note || undefined} className={`font-medium ${tone[v]}`}>{v}{note && <span className="sr-only">: {note}</span>}</span>;

export default function Compare() {
  return (
    <>
      <PageTitle title="Where Bounded fits" sub="x402 is how an agent pays. Bounded decides whether it's allowed to. They work together." />
      <Section><LayerDiagram /></Section>
      <Section eyebrow="Comparison" title="The combination is the point.">
        <p className="mb-6 max-w-3xl text-mute">On-chain enforcement alone is not unique: smart accounts have it. The difference is the combination: enforcement the agent can&apos;t skip, tiers with human approval, receipts for blocked attempts, an automatic breaker, and coverage of every rail.</p>
        <div className="hidden overflow-x-auto rounded-3xl bg-surface ring-1 ring-ink/5 lg:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper text-xs text-mute"><tr><th className="p-3" />{COLS.map((c) => <th key={c} scope="col" className="p-3 font-medium">{c}</th>)}</tr></thead>
            <tbody>
              {ROWS.map(([label, vals]) => (
                <tr key={label} className="border-t border-ink/5"><th scope="row" className="p-3 font-medium">{label}</th>{vals.map((v, i) => <td key={i} className="p-3"><Cell v={v} /></td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
          {COLS.map((c, ci) => (
            <li key={c} className="card">
              <div className="font-medium">{c}</div>
              <dl className="mt-3 grid gap-2 text-sm">
                {ROWS.map(([label, vals]) => <div key={label} className="flex justify-between gap-3"><dt className="text-mute">{label}</dt><dd><Cell v={vals[ci]} /></dd></div>)}
              </dl>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-mute">Hover or focus a value for the reasoning (screen readers read it inline).</p>
        <CompareNote />
      </Section>
      <Section eyebrow="Custodial AI trading" title="Same architecture, different custody.">
        <p className="max-w-3xl">
          Bitget launched GetAgent Playbook in June 2026, running AI strategies through isolated sub-accounts with risk parameters and auditable workflows<Source id="playbook" n={1} />, after its AI tools passed 1M users and $1.2B cumulative volume (company-reported)<Source id="bitgetUsers" n={2} />. Same architecture, but the funds sit on the exchange. Bounded puts it in a contract you own.
        </p>
        <CompareNote />
        <SourceList ids={['playbook', 'bitgetUsers', 'x402', 'policyLayer']} />
      </Section>
    </>
  );
}
