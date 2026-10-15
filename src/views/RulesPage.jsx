'use client';

import { useState } from 'react';
import { useVault } from '../store/useVaultStore';
import { shortAddr } from '../lib/rules';
import { Card, Empty, Pill } from '../components/ui';

const HOUR = 3_600_000;
const ADDR = /^0x[0-9a-fA-F]{40}$/;

function Slider({ label, value, onChange, min, max, step = 1, unit }) {
  return (
    <label className="block">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm text-ink/80">{label}</span>
        <span className="text-2xl font-light">{value}<span className="ml-1 text-xs text-mute">{unit}</span></span>
      </div>
      <input type="range" className="w-full" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function PolicyCard() {
  const { now, policy, savePolicy, connected } = useVault();
  const hoursLeft = Math.max(1, Math.round((policy.expiresAt - now) / HOUR));
  const [d, setD] = useState({ perTx: policy.perTx, daily: policy.daily, hours: hoursLeft, breakerN: policy.breakerN, windowMin: policy.windowMin });
  const set = (k) => (v) => setD((p) => ({ ...p, [k]: v }));

  const changes = [
    d.perTx !== policy.perTx && `Per payment ${policy.perTx} → ${d.perTx}`,
    d.daily !== policy.daily && `Daily ${policy.daily} → ${d.daily}`,
    d.hours !== hoursLeft && `Expiry ${hoursLeft}h → ${d.hours}h`,
    d.breakerN !== policy.breakerN && `Breaker ${policy.breakerN} → ${d.breakerN} blocks`,
    d.windowMin !== policy.windowMin && `Window ${policy.windowMin} → ${d.windowMin} min`,
  ].filter(Boolean);

  const invalid = d.perTx > d.daily;
  const save = () => savePolicy({ perTx: d.perTx, daily: d.daily, expiresAt: Date.now() + d.hours * HOUR, breakerN: d.breakerN, windowMin: d.windowMin });

  return (
    <Card title="Spending rules">
      <div className="space-y-6">
        <Slider label="Per payment" value={d.perTx} onChange={set('perTx')} min={0} max={20} step={0.5} unit="tUSDC" />
        <Slider label="Per day" value={d.daily} onChange={set('daily')} min={0} max={100} step={1} unit="tUSDC" />
        <Slider label="Agent permission expires in" value={d.hours} onChange={set('hours')} min={1} max={168} unit="hours" />
        <div className="grid gap-6 sm:grid-cols-2">
          <Slider label="Freeze after" value={d.breakerN} onChange={set('breakerN')} min={0} max={10} unit="blocks" />
          <Slider label="…within" value={d.windowMin} onChange={set('windowMin')} min={5} max={240} step={5} unit="min" />
        </div>
      </div>
      <div className="mt-6 rounded-2xl bg-paper p-4">
        <div className="text-xs text-mute">Review before you sign</div>
        {changes.length ? (
          <div className="mt-2 flex flex-wrap gap-2">{changes.map((c) => <span key={c} className="rounded-full bg-white px-3 py-1 text-xs ring-1 ring-black/10">{c}</span>)}</div>
        ) : (
          <p className="mt-1 text-sm text-ink/60">No changes yet.</p>
        )}
        {invalid && <p className="mt-2 text-xs text-bad">Per-payment limit can’t exceed the daily limit.</p>}
      </div>
      <button className="btn btn-brand mt-4" disabled={!connected || !changes.length || invalid} onClick={save}>Sign &amp; save (MOCK)</button>
      {!connected && <p className="mt-2 text-xs text-mute">Connect a wallet to sign.</p>}
    </Card>
  );
}

function AllowlistCard() {
  const { allowlist, addAllowed, removeAllowed, connected } = useVault();
  const [addr, setAddr] = useState('');
  const [label, setLabel] = useState('');
  const [err, setErr] = useState('');

  const add = () => {
    const a = addr.trim();
    if (!ADDR.test(a)) return setErr('Enter a valid address: 0x followed by 40 hex characters.');
    if (!label.trim()) return setErr('Give this recipient a name you will recognise.');
    if (allowlist.some((x) => x.address.toLowerCase() === a.toLowerCase())) return setErr('That address is already allowed.');
    addAllowed({ address: a, label: label.trim() });
    setAddr(''); setLabel(''); setErr('');
  };

  return (
    <Card title="Allowed recipients">
      {allowlist.length === 0 ? (
        <Empty title="Nobody is allowed" desc="The agent can’t pay anyone until you add a recipient." />
      ) : (
        <ul className="space-y-2">
          {allowlist.map((x) => (
            <li key={x.address} className="flex items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3">
              <div>
                <div className="text-sm font-medium">{x.label}</div>
                <div className="font-mono text-xs text-mute">{shortAddr(x.address)}</div>
              </div>
              <button className="text-xs text-mute underline underline-offset-2 hover:text-bad" disabled={!connected} onClick={() => removeAllowed(x.address)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1.6fr_auto]">
        <input className="field" placeholder="Name" value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Recipient name" />
        <input className="field font-mono" placeholder="0x…" value={addr} onChange={(e) => setAddr(e.target.value)} aria-label="Recipient address" />
        <button className="btn btn-ink" disabled={!connected} onClick={add}>Add</button>
      </div>
      {err && <p className="mt-2 text-xs text-bad" role="alert">{err}</p>}
    </Card>
  );
}

function FundsCard() {
  const { balance, deposit, withdraw, connected } = useVault();
  const [amt, setAmt] = useState('');
  const n = Number(amt);
  const ok = n > 0 && Number.isFinite(n);
  return (
    <Card title="Vault funds" action={<Pill tone="mock">Mock tUSDC</Pill>}>
      <div className="text-4xl font-light tracking-tight">{balance.toFixed(2)} <span className="text-sm text-mute">tUSDC</span></div>
      <div className="mt-4 flex gap-2">
        <input className="field" inputMode="decimal" placeholder="Amount" value={amt} onChange={(e) => setAmt(e.target.value)} aria-label="Amount" />
        <button className="btn btn-ink" disabled={!connected || !ok} onClick={() => { deposit(n); setAmt(''); }}>Deposit</button>
        <button className="btn btn-ghost" disabled={!connected || !ok || n > balance} onClick={() => { withdraw(n); setAmt(''); }}>Withdraw</button>
      </div>
      <p className="mt-2 text-xs text-mute">Withdrawing always works, even when the agent is frozen.</p>
    </Card>
  );
}

function KillSwitch() {
  const { policy, freeze, unfreeze, revoke, restore, connected } = useVault();
  return (
    <Card title="Emergency controls" className="ring-bad/20">
      <p className="text-sm text-ink/70">Freeze stops the agent instantly. Revoke removes its key so it can’t propose anything.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {policy.frozen ? (
          <button className="btn btn-ink" disabled={!connected} onClick={unfreeze}>Unfreeze agent</button>
        ) : (
          <button className="btn btn-danger" disabled={!connected} onClick={freeze}>Freeze agent</button>
        )}
        {policy.revoked ? (
          <button className="btn btn-ink" disabled={!connected} onClick={restore}>Restore key</button>
        ) : (
          <button className="btn btn-danger" disabled={!connected} onClick={revoke}>Pause &amp; revoke agent</button>
        )}
      </div>
    </Card>
  );
}

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-mute">You set the rules once. The contract enforces them every time.</p>
        <h1 className="mt-1 text-5xl font-normal tracking-tight sm:text-6xl">Rules</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <PolicyCard />
        <div className="space-y-4">
          <FundsCard />
          <KillSwitch />
        </div>
      </div>
      <AllowlistCard />
    </div>
  );
}
