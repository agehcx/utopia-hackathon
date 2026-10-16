'use client';

import { useEffect, useRef, useState } from 'react';
import { useVault } from '../store/useVaultStore';
import { DAY, UNIT, diffPolicy, fmt } from '../lib/engine';
import { simTime } from '../lib/receipts';
import { Card, Empty, Simulated } from '../components/ui';
import { BRAND } from '@/lib/site';

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

// Sliders in display units; `get`/`set` convert to engine units.
const FIELDS = [
  { key: 'perTx', label: 'Per payment', unit: 'tUSDC', min: 1, max: 200, get: (p) => p.perTx / UNIT, set: (v) => ({ perTx: v * UNIT }) },
  { key: 'daily', label: 'Per day', unit: 'tUSDC', min: 10, max: 1000, step: 10, get: (p) => p.daily / UNIT, set: (v) => ({ daily: v * UNIT }) },
  { key: 'maxVaultPct', label: 'Max % of vault per action', unit: '%', min: 1, max: 100, get: (p) => p.maxVaultPct, set: (v) => ({ maxVaultPct: v }) },
  { key: 'breakerThreshold', label: 'Freeze after N blocks', unit: 'blocks', min: 1, max: 10, get: (p) => p.breakerThreshold, set: (v) => ({ breakerThreshold: v }) },
  { key: 'breakerWindowSec', label: 'Block window', unit: 'sim. min', min: 1, max: 60, get: (p) => p.breakerWindowSec / 60, set: (v) => ({ breakerWindowSec: v * 60 }) },
  { key: 'maxFeeBps', label: `Max ${BRAND} fee`, unit: 'bps', min: 0, max: 5, get: (p) => p.maxFeeBps, set: (v) => ({ maxFeeBps: v }) },
];

const show = (field, v) => {
  if (v == null) return '—';
  if (field === 'allowlist') return `${v.label} ${v.address}`;
  if (field === 'perTx' || field === 'daily') return `${fmt(v)} tUSDC (raw ${v})`;
  if (field === 'expiry') return `${simTime(v)} (raw ${v})`;
  return String(v);
};

function Slider({ f, draft, setDraft }) {
  const v = f.get(draft);
  const id = `r-${f.key}`;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm">{f.label}</label>
        <span className="font-mono text-sm">{v} {f.unit}</span>
      </div>
      <input id={id} type="range" className="mt-2 h-11 w-full" min={f.min} max={f.max} step={f.step || 1} value={v}
        onChange={(e) => setDraft((d) => ({ ...d, ...f.set(Number(e.target.value)) }))} />
    </div>
  );
}

function ConfirmDialog({ changes, onConfirm, onCancel }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return (
    <dialog ref={ref} onCancel={onCancel} className="w-[min(92vw,40rem)] rounded-3xl bg-surface p-6 text-ink backdrop:bg-black/50">
      <h2 className="text-xl font-medium">Confirm loosening</h2>
      <p className="mt-1 text-sm text-mute">These changes give the agent more room. Review every value before confirming.</p>
      <ul className="mt-4 grid gap-2 text-sm">
        {changes.map((c, i) => (
          <li key={i} className={`rounded-2xl p-3 ${c.loosens ? 'bg-ask-soft' : 'bg-paper'}`}>
            <div className="font-medium">{c.field} {c.loosens ? '(loosens)' : '(tightens)'}</div>
            <div className="break-all font-mono text-xs">{show(c.field, c.from)} → {show(c.field, c.to)}</div>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-ink" onClick={onConfirm}>Confirm and save</button>
      </div>
    </dialog>
  );
}

function Allowlist({ draft, setDraft }) {
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [kind, setKind] = useState('recipient');
  const [err, setErr] = useState('');
  const add = (e) => {
    e.preventDefault();
    if (!label.trim()) return setErr('Add a label.');
    if (!ADDRESS.test(address)) return setErr('Address must be 0x followed by 40 hex characters.');
    if (draft.allowlist.some((x) => x.address.toLowerCase() === address.toLowerCase())) return setErr('Already on the list.');
    setDraft((d) => ({ ...d, allowlist: [...d.allowlist, { label: label.trim(), address, kind }] }));
    setLabel(''); setAddress(''); setErr('');
  };
  return (
    <div className="grid gap-3">
      <ul className="grid gap-2">
        {draft.allowlist.map((a) => (
          <li key={a.address} className="flex items-center gap-3 rounded-2xl bg-paper p-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium">{a.label} <Simulated /></div>
              <div className="break-all font-mono text-[11px] text-mute">{a.kind === 'contract' ? 'Destination contract' : 'Recipient'} · {a.address}</div>
            </div>
            <button className="btn btn-ghost !px-3" onClick={() => setDraft((d) => ({ ...d, allowlist: d.allowlist.filter((x) => x.address !== a.address) }))}>Remove</button>
          </li>
        ))}
        {!draft.allowlist.length && <Empty title="Allowlist empty" desc="Every proposal will be blocked." />}
      </ul>
      <form onSubmit={add} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto_auto]">
        <label className="sr-only" htmlFor="al-l">Label</label>
        <input id="al-l" className="field" placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <label className="sr-only" htmlFor="al-a">Address</label>
        <input id="al-a" className="field font-mono" placeholder="0x…" value={address} onChange={(e) => setAddress(e.target.value.trim())} />
        <label className="sr-only" htmlFor="al-k">Type</label>
        <select id="al-k" className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="recipient">Recipient</option>
          <option value="contract">Destination contract</option>
        </select>
        <button className="btn btn-ghost">Add</button>
      </form>
      {err && <p role="alert" className="text-xs text-block">{err}</p>}
    </div>
  );
}

export default function RulesPage() {
  const { state, setPolicy } = useVault();
  const { policy, clock } = state;
  const [draft, setDraft] = useState(policy);
  const [confirming, setConfirming] = useState(null);
  const [base, setBase] = useState(policy);
  if (base !== policy) { setBase(policy); setDraft(policy); } // re-sync after save, reset or storage load

  const changes = diffPolicy(policy, draft);
  const loosens = changes.some((c) => c.loosens);
  const days = Math.max(0, Math.round((draft.expiry - clock) / DAY));
  const history = state.events.filter((e) => e.type === 'PolicyUpdated').reverse();

  const save = () => (loosens ? setConfirming(changes) : setPolicy(draft));

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-3xl font-light tracking-tight sm:text-4xl">Rules <span className="text-lg text-mute">v{policy.version}</span></h1>
        <p className="mt-1 text-sm text-mute">Tightening a rule applies instantly. Loosening one needs your explicit confirmation.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Limits">
          <div className="grid gap-5">
            {FIELDS.map((f) => <Slider key={f.key} f={f} draft={draft} setDraft={setDraft} />)}
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor="r-exp" className="text-sm">Expiry</label>
                <span className="font-mono text-sm">{days} days</span>
              </div>
              <input id="r-exp" type="range" className="mt-2 h-11 w-full" min={1} max={30} value={days}
                onChange={(e) => setDraft((d) => ({ ...d, expiry: clock + Number(e.target.value) * DAY }))} />
            </div>
          </div>
        </Card>
        <div className="grid content-start gap-4">
          <Card title="Allowlist: recipients and destination contracts"><Allowlist draft={draft} setDraft={setDraft} /></Card>
          <Card title="Pending changes">
            {changes.length ? (
              <ul className="mb-4 grid gap-1 text-sm">
                {changes.map((c, i) => <li key={i}>{c.loosens ? 'Loosens' : 'Tightens'}: <span className="font-mono text-xs">{c.field}</span></li>)}
              </ul>
            ) : <p className="mb-4 text-sm text-mute">No changes.</p>}
            <div className="flex gap-2">
              <button className="btn btn-ink" disabled={!changes.length} onClick={save}>{loosens ? 'Review and confirm' : 'Apply'}</button>
              <button className="btn btn-ghost" disabled={!changes.length} onClick={() => setDraft(policy)}>Discard</button>
            </div>
          </Card>
          <Card title="Policy history">
            {history.length ? (
              <ul className="grid gap-1 text-sm">
                {history.map((e) => <li key={e.seq}>v{e.version} · {simTime(e.ts)} · {e.changes.map((c) => c.field).join(', ')}</li>)}
              </ul>
            ) : <p className="text-sm text-mute">v1 · demo defaults</p>}
          </Card>
        </div>
      </div>
      {confirming && (
        <ConfirmDialog changes={confirming} onCancel={() => setConfirming(null)} onConfirm={() => { setPolicy(draft); setConfirming(null); }} />
      )}
    </div>
  );
}
