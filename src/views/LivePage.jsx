'use client';

import { useCallback, useEffect, useState } from 'react';
import { publicActions } from 'viem';
import { ADDR, EXPLORER, PRESETS, VAULT_ABI } from '../lib/chain/vault';
import { connectWallet, hasWallet } from '../lib/chain/wallet';
import { shortAddr } from '../lib/receipts';
import { Card, Empty, Progress, Skeleton, TierBadge, TokenIcon } from '../components/ui';

const POLL_MS = 10_000;
const usdc = (raw) => (Number(raw) / 1e6).toLocaleString('en-US', { maximumFractionDigits: 6 });
const avax = (raw) => (Number(raw) / 1e18).toLocaleString('en-US', { maximumFractionDigits: 6 });
const time = (ts) => new Date(ts * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const Tx = ({ hash }) => <a className="font-mono underline underline-offset-2" href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noreferrer">{shortAddr(hash)}</a>;
const Addr = ({ a }) => <a className="font-mono underline underline-offset-2" href={`${EXPLORER}/address/${a}`} target="_blank" rel="noreferrer">{shortAddr(a)}</a>;
const label = (a) => (a?.toLowerCase() === ADDR.dataService.toLowerCase() ? 'Data service' : a?.toLowerCase().endsWith('dead') ? '0x…dEaD' : shortAddr(a));

function sentence(e, proposals) {
  const p = proposals[e.args.id];
  const amt = p ? `${usdc(p.amount)} tUSDC to ${label(p.to)}` : '';
  switch (e.name) {
    case 'Decided': return { tier: e.args.outcome, text: { AUTO: `Paid ${amt}`, PENDING: `Asked owner to approve ${amt}`, BLOCKED: `Blocked ${amt}. Nothing moved.` }[e.args.outcome], reason: e.args.reason };
    case 'Approved': return { tier: 'APPROVED', text: `Owner approved request #${e.args.id}` };
    case 'Rejected': return { tier: 'REJECTED', text: `Owner rejected request #${e.args.id}` };
    case 'AgentFrozen': return { tier: 'FREEZE', text: `Agent frozen after ${e.args.blockCount} blocked attempts` };
    case 'AgentUnfrozen': return { tier: 'OWNER', text: 'Owner unfroze the agent' };
    case 'PolicyUpdated': return { tier: 'OWNER', text: `Rules set to version ${e.args.version}` };
    case 'LimitsUpdated': return { tier: 'OWNER', text: `Limits: ${usdc(e.args.perTx)} per payment, ${usdc(e.args.daily)} per day` };
    case 'AgentSet': return { tier: 'OWNER', text: `Agent set to ${shortAddr(e.args.agent)}` };
    case 'AgentRevoked': return { tier: 'OWNER', text: 'Agent key revoked' };
    case 'Deposited': return { tier: 'OWNER', text: `Deposited ${usdc(e.args.amount)} tUSDC` };
    case 'Withdrawn': return { tier: 'OWNER', text: `Withdrew ${usdc(e.args.amount)} tUSDC` };
    default: return null;
  }
}

export default function LivePage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [owner, setOwner] = useState(null); // { wallet, address }
  const [wd, setWd] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/chain', { cache: 'no-store' });
      const body = await res.json();
      if (!body.ok) throw new Error(body.error);
      setData(body.data); setErr('');
    } catch (e) { setErr(e.message || 'Could not load chain data.'); }
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const t = setInterval(load, POLL_MS);
    return () => { clearTimeout(first); clearInterval(t); };
  }, [load]);

  const runAgent = async (preset) => {
    setBusy(preset); setMsg('Agent is sending a proposal to Fuji…');
    try {
      const res = await fetch('/api/agent', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ preset }) });
      const body = await res.json();
      if (!body.ok) throw new Error(body.error);
      setMsg(`Contract decided ${body.data.outcome}${body.data.reason !== 'NONE' ? ` (${body.data.reason})` : ''}. Tx ${body.data.hash.slice(0, 10)}…`);
      await load();
    } catch (e) { setMsg(e.message); } finally { setBusy(''); }
  };

  const ownerTx = async (name, functionName, args = []) => {
    setBusy(name); setMsg('Confirm the transaction in your wallet…');
    try {
      const { wallet, address } = owner;
      const hash = await wallet.writeContract({ account: address, address: ADDR.vault, abi: VAULT_ABI, functionName, args });
      setMsg('Waiting for Fuji to confirm…');
      await wallet.extend(publicActions).waitForTransactionReceipt({ hash });
      setMsg(`Done. Tx ${hash.slice(0, 10)}…`);
      await load();
    } catch (e) { setMsg(e.shortMessage || e.message); } finally { setBusy(''); }
  };

  const connect = async () => {
    try { setOwner(await connectWallet()); setMsg(''); } catch (e) { setMsg(e.shortMessage || e.message); }
  };

  if (!data) return err ? <Card><Empty title="Fuji contract unavailable" desc={err} /></Card> : <Skeleton rows={4} />;

  const { state, events } = data;
  const proposals = Object.fromEntries(events.filter((e) => e.name === 'Proposed').map((e) => [e.args.id, e.args]));
  const expired = Number(state.policy.expiry) < state.now;
  const isOwner = owner && owner.address.toLowerCase() === ADDR.owner.toLowerCase();
  const pending = state.requests.filter((r) => r.status === 'PENDING');
  const rows = events.map((e) => ({ e, s: sentence(e, proposals) })).filter((x) => x.s);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-light tracking-tight sm:text-4xl"><TokenIcon token="Avalanche" size={30} /> Live on Fuji</h1>
          <p className="mt-1 text-sm text-mute">Real contract, real transactions, testnet tokens. Vault <Addr a={ADDR.vault} /> · refreshes every 10 s.</p>
        </div>
        <button className="btn btn-ghost" onClick={load}>Refresh</button>
      </div>

      {msg && <p role="status" className="rounded-2xl bg-brand-soft p-3 text-sm text-brand-deep">{msg}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Vault balance">
          <div className="flex items-center gap-2 text-3xl font-light"><TokenIcon size={26} />{usdc(state.balances.vaultUsdc)} <span className="text-sm text-mute">tUSDC</span></div>
        </Card>
        <Card title="Agent status">
          {state.frozen ? <TierBadge tier="FREEZE" label="Frozen" /> : expired ? <TierBadge tier="BLOCK" label="Rules expired" /> : <TierBadge tier="AUTO" label="Active" />}
          <p className="mt-3 text-xs text-mute">Agent <Addr a={state.agent} /> · gas left {avax(state.balances.agentAvax)} AVAX</p>
        </Card>
        <Card title="Today's auto spend">
          <div className="mb-2 text-3xl font-light">{usdc(state.spentToday)} <span className="text-sm text-mute">/ {usdc(state.limits.daily)}</span></div>
          <Progress value={Number(state.spentToday)} max={Number(state.limits.daily)} label="Today's spend vs daily limit" />
          <p className="mt-2 text-xs text-mute">Per payment limit {usdc(state.limits.perTx)} tUSDC</p>
        </Card>
        <Card title="Blocks in window">
          <div className="mb-2 text-3xl font-light">{state.blockCount} / {state.policy.breakerThreshold}</div>
          <Progress value={Number(state.blockCount)} max={state.policy.breakerThreshold} label="Blocks vs freeze threshold" />
          <p className="mt-2 text-xs text-mute">Window {state.policy.breakerWindow / 60} min · rules v{state.policy.version} · expire {time(Number(state.policy.expiry))}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Agent (server-held key, can only propose)">
          <div className="grid gap-2">
            {Object.entries(PRESETS).map(([id, p]) => (
              <button key={id} className={`btn ${id === 'attack' ? 'btn-danger' : 'btn-ghost'} justify-start`} disabled={Boolean(busy)} onClick={() => runAgent(id)}>
                {busy === id ? 'Sending…' : p.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-mute">Each click is a real Fuji transaction signed on-chain by the agent key. Gas is paid in testnet AVAX.</p>
        </Card>

        <Card title="Owner (your wallet)">
          {!owner ? (
            <div className="grid gap-2">
              <button className="btn btn-ink" onClick={connect} disabled={!hasWallet()}>{hasWallet() ? 'Connect wallet' : 'No browser wallet found'}</button>
              <p className="text-xs text-mute">Connect the owner account <Addr a={ADDR.owner} /> on Fuji C-Chain.</p>
            </div>
          ) : !isOwner ? (
            <p className="text-sm text-block">Connected {shortAddr(owner.address)}, but only the owner {shortAddr(ADDR.owner)} can run owner actions. Switch accounts in your wallet and reconnect.</p>
          ) : (
            <div className="grid gap-3">
              <p className="text-xs text-mute">Connected as owner {shortAddr(owner.address)}</p>
              {pending.length === 0 ? <p className="text-sm text-mute">No pending requests.</p> : pending.map((r) => (
                <div key={r.index} className="flex flex-wrap items-center gap-2 rounded-2xl bg-paper p-3 text-sm">
                  <TierBadge tier="ASK" /> #{r.index}: {usdc(r.amount)} tUSDC to {label(r.to)}
                  <span className="ml-auto flex gap-2">
                    <button className="btn btn-ghost !min-h-9 !px-3" disabled={Boolean(busy)} onClick={() => ownerTx(`rej${r.index}`, 'reject', [BigInt(r.index)])}>Reject</button>
                    <button className="btn btn-ink !min-h-9 !px-3" disabled={Boolean(busy)} onClick={() => ownerTx(`app${r.index}`, 'approve', [BigInt(r.index)])}>Approve</button>
                  </span>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                {state.frozen
                  ? <button className="btn btn-ink" disabled={Boolean(busy)} onClick={() => ownerTx('unfreeze', 'unfreeze')}>Unfreeze agent</button>
                  : <button className="btn btn-danger" disabled={Boolean(busy)} onClick={() => ownerTx('freeze', 'freeze')}>Freeze agent</button>}
                <button className="btn btn-ghost" disabled={Boolean(busy)} onClick={() => ownerTx('renew', 'setPolicy', [
                  { expiry: BigInt(state.now + 86400), breakerThreshold: state.policy.breakerThreshold, breakerWindow: state.policy.breakerWindow, version: 0 },
                  [ADDR.dataService],
                ])}>Renew rules 24 h</button>
              </div>
              <form className="flex gap-2" onSubmit={(e) => {
                e.preventDefault();
                const n = Math.round(Number(wd) * 1e6);
                if (!(n > 0)) return setMsg('Enter an amount above zero.');
                ownerTx('withdraw', 'withdraw', [ADDR.usdc, BigInt(n)]); setWd('');
              }}>
                <label className="sr-only" htmlFor="lw">Withdraw tUSDC</label>
                <input id="lw" className="field" inputMode="decimal" placeholder="tUSDC amount" value={wd} onChange={(e) => setWd(e.target.value)} />
                <button className="btn btn-ink shrink-0" disabled={Boolean(busy)}>Withdraw</button>
              </form>
            </div>
          )}
        </Card>
      </div>

      <Card title="On-chain receipts (from contract events)">
        {rows.length === 0 ? <Empty title="No events yet" /> : (
          <ul className="grid gap-2">
            {rows.map(({ e, s }) => (
              <li key={`${e.tx}-${e.logIndex}`} className="flex flex-wrap items-start gap-3 rounded-2xl bg-paper p-3 text-sm">
                <TierBadge tier={s.tier} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{s.text}</div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-mute">
                    <span suppressHydrationWarning>{time(e.ts)}</span>
                    {s.reason && s.reason !== 'NONE' && <span className="font-mono">{s.reason}</span>}
                    <span>block {e.block}</span>
                    <Tx hash={e.tx} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
