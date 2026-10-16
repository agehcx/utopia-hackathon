'use client';

import { useState } from 'react';
import { useVault } from '../store/useVaultStore';
import { ACTIONS, TOKENS, blocksInWindow, fmt, validateProposal } from '../lib/engine';
import { ATTACKER, FEED, SCENARIOS } from '../lib/scenarios';
import { labelFor } from '../lib/receipts';
import { REASON_TEXT } from '../lib/site';
import { Card, Simulated, TierBadge } from '../components/ui';

const CUSTOM = 'custom';
const STAGES = ['Proposed', 'Evaluated', 'Decision'];

function ProposalForm() {
  const { state, propose } = useVault();
  const book = state.policy.allowlist;
  const [form, setForm] = useState({ action: 'swap', token: 'tUSDC', amount: '5', destination: book[0]?.address || CUSTOM });
  const [custom, setCustom] = useState(ATTACKER);
  const proposal = { action: form.action, token: form.token, amount: Number(form.amount), destination: form.destination === CUSTOM ? custom : form.destination };
  const [raw, setRaw] = useState(null); // null = JSON mirrors the form
  const text = raw ?? JSON.stringify(proposal, null, 2);
  const [errors, setErrors] = useState([]);
  const set = (k) => (e) => { setRaw(null); setForm((f) => ({ ...f, [k]: e.target.value })); };

  const submit = (e) => {
    e.preventDefault();
    let parsed;
    try { parsed = JSON.parse(text); } catch { return setErrors(['Not valid JSON.']); }
    const v = validateProposal(parsed);
    if (!v.ok) return setErrors(v.errors);
    setErrors([]);
    propose(v.value);
  };

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs text-mute">action
          <select className="field text-ink" value={form.action} onChange={set('action')}>{ACTIONS.map((a) => <option key={a}>{a}</option>)}</select>
        </label>
        <label className="grid gap-1 text-xs text-mute">token
          <select className="field text-ink" value={form.token} onChange={set('token')}>{TOKENS.map((t) => <option key={t}>{t}</option>)}</select>
        </label>
        <label className="grid gap-1 text-xs text-mute">amount
          <input className="field text-ink" inputMode="decimal" value={form.amount} onChange={set('amount')} />
        </label>
        <label className="grid gap-1 text-xs text-mute">destination
          <select className="field text-ink" value={form.destination} onChange={set('destination')}>
            {book.map((a) => <option key={a.address} value={a.address}>{a.label}</option>)}
            <option value={CUSTOM}>Custom address (attack simulator)</option>
          </select>
        </label>
      </div>
      {form.destination === CUSTOM && (
        <label className="grid gap-1 text-xs text-mute">custom address
          <input className="field font-mono text-ink" value={custom} onChange={(e) => { setRaw(null); setCustom(e.target.value.trim()); }} />
        </label>
      )}
      <label className="grid gap-1 text-xs text-mute">Proposal JSON (strict schema; you can edit it to test validation)
        <textarea className="field min-h-36 font-mono text-xs text-ink" spellCheck={false} value={text} onChange={(e) => setRaw(e.target.value)} />
      </label>
      {errors.length > 0 && (
        <ul role="alert" className="grid gap-1 rounded-2xl bg-block-soft p-3 text-xs text-block">{errors.map((x) => <li key={x}>{x}</li>)}</ul>
      )}
      <button className="btn btn-ink">Submit proposal</button>
    </form>
  );
}

function Flight() {
  const { flight, state, live } = useVault();
  return (
    <Card title="Latest decision">
      <p className="sr-only" aria-live="polite">{live}</p>
      {!flight ? <p className="text-sm text-mute">No proposal yet.</p> : (
        <div>
          <ol className="flex flex-wrap gap-2 text-xs">
            {STAGES.map((s, i) => (
              <li key={s} className={`rounded-full px-3 py-1.5 ${i <= flight.stage ? 'bg-ink text-surface' : 'bg-ink/5 text-mute'}`}>{i + 1}. {s}</li>
            ))}
          </ol>
          <div className="mt-4 text-sm">
            <span className="font-mono">{flight.decision.proposal.action}</span> {fmt(flight.decision.proposal.amount)} tUSDC to {labelFor(flight.decision.proposal.destination, state.policy.allowlist)}
          </div>
          {flight.stage === 2 && (
            <div className="rise mt-3 flex flex-wrap items-center gap-2">
              <TierBadge tier={flight.decision.tier} />
              <span className="text-sm text-mute">{REASON_TEXT[flight.decision.reason]}</span>
            </div>
          )}
        </div>
      )}
      <div className="mt-4 text-xs text-mute">
        Agent: <strong className="text-ink">{state.agent}</strong> · blocks in window {state.agent === 'ACTIVE' ? blocksInWindow(state) : '—'} / {state.policy.breakerThreshold}
      </div>
    </Card>
  );
}

function Scenarios() {
  const { run, startScenario, stepScenario, stopScenario, speed, setSpeed, reset } = useVault();
  const [stepMode, setStepMode] = useState(false);
  const busy = Boolean(run);
  return (
    <Card title={<span className="flex items-center gap-2">Scenarios <Simulated>Demo data</Simulated></span>}>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-ink" disabled={busy} onClick={() => startScenario('normal', !stepMode)}>Run normal day</button>
        <button className="btn btn-danger" disabled={busy} onClick={() => startScenario('injection', !stepMode)}>Inject poisoned data</button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" className="h-5 w-5" checked={stepMode} onChange={(e) => setStepMode(e.target.checked)} /> Step-through</label>
        <label className="flex items-center gap-2">Speed
          <select className="field !w-auto !py-2" value={speed} onChange={(e) => setSpeed(e.target.value)}>
            <option value="slow">Slow</option><option value="normal">Normal</option><option value="fast">Fast</option>
          </select>
        </label>
      </div>
      {run && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-paper p-3 text-sm">
          <span>Step {run.index + 1} of {SCENARIOS[run.name].length}: {SCENARIOS[run.name][run.index].note}</span>
          {!run.auto && <button className="btn btn-ink" onClick={stepScenario}>Next step</button>}
          <button className="btn btn-ghost" onClick={stopScenario}>Stop</button>
        </div>
      )}
    </Card>
  );
}

export default function AgentPage() {
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-3xl font-light tracking-tight sm:text-4xl">Agent Console</h1>
        <p className="mt-1 max-w-2xl text-sm text-mute">
          No chat. The agent sends a strict proposal; the engine decides. We can&apos;t stop an AI from being tricked. So we make being tricked harmless.
        </p>
      </div>
      <Scenarios />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Agent proposal (strict schema)"><ProposalForm /></Card>
        <div className="grid content-start gap-4">
          <Flight />
          <Card title={<span className="flex items-center gap-2">Market feed: untrusted data the agent reads <Simulated /></span>}>
            <ul className="grid gap-2">
              {FEED.map((f) => (
                <li key={f.id} className={`rounded-2xl p-3 text-sm ${f.poisoned ? 'bg-block-soft ring-1 ring-block/30' : 'bg-paper'}`}>
                  <div className="mb-1 flex items-center gap-2 text-xs text-mute">{f.source}{f.poisoned && <TierBadge tier="BLOCK" label="Poisoned" />}</div>
                  <code className="break-words font-mono text-xs">{f.text}</code>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
