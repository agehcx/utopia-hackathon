'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useVault } from '../store/useVaultStore';
import { blocksInWindow, fmt, spentToday, summarize, summaryLine, toUnits } from '../lib/engine';
import { buildReceipts } from '../lib/receipts';
import ReceiptItem from '../components/ReceiptItem';
import { Card, Empty, Progress, Simulated, Skeleton, TierBadge, TokenIcon } from '../components/ui';

const STATUS = { ACTIVE: ['AUTO', 'Active'], FROZEN: ['FREEZE', 'Frozen'], REVOKED: ['BLOCK', 'Revoked'] };

function Stat({ title, children, foot }) {
  return (
    <Card title={title}>
      {children}
      {foot && <div className="mt-3 text-xs text-mute">{foot}</div>}
    </Card>
  );
}

function Withdraw() {
  const { withdraw } = useVault();
  const [amt, setAmt] = useState('');
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (withdraw('tUSDC', toUnits(amt))) setAmt(''); }}>
      <label className="sr-only" htmlFor="wd">Withdraw amount (tUSDC)</label>
      <input id="wd" className="field" inputMode="decimal" placeholder="tUSDC amount" value={amt} onChange={(e) => setAmt(e.target.value)} />
      <button className="btn btn-ink shrink-0">Withdraw</button>
    </form>
  );
}

export default function OverviewPage() {
  const { state, hydrated, freeze, unfreeze, revoke, restore } = useVault();
  const { policy, agent, balances } = state;
  const sum = summarize(state.events);
  const latest = buildReceipts(state.events, policy.allowlist).slice(0, 5);
  const [badge, label] = STATUS[agent];
  const blocks = agent === 'ACTIVE' ? blocksInWindow(state) : 0;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-light tracking-tight sm:text-4xl">Vault Overview</h1>
          <p className="mt-1 text-sm text-mute">{summaryLine(sum)} <span className="text-xs">(computed from the on-chain event log)</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/app/rules" className="btn btn-ghost">Edit Rules</Link>
          <Link href="/app/agent" className="btn btn-brand">Agent Console</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat title={<span className="flex items-center gap-2">Vault balance <Simulated>Demo</Simulated></span>}>
          <div className="flex items-center gap-2 text-3xl font-light"><TokenIcon size={26} />{fmt(balances.tUSDC)} <span className="text-sm text-mute">tUSDC</span></div>
          <div className="mt-2 flex items-center gap-2 text-sm text-mute"><TokenIcon token="AVAX" size={16} />{fmt(balances.AVAX)} AVAX</div>
        </Stat>
        <Stat title="Agent status" foot={agent === 'FROZEN' ? 'Nothing moves until you unfreeze.' : agent === 'REVOKED' ? 'The key can no longer propose.' : 'Can propose within your rules.'}>
          <div className="flex items-center gap-2">
            <TierBadge tier={badge} label={label} />
          </div>
        </Stat>
        <Stat title="Today's spend" foot={`of ${fmt(policy.daily)} tUSDC daily limit (simulated UTC day)`}>
          <div className="mb-2 text-3xl font-light">{fmt(spentToday(state))}</div>
          <Progress value={spentToday(state)} max={policy.daily} label="Today's spend vs daily limit" />
        </Stat>
        <Stat title="Circuit breaker" foot={`Freezes at ${policy.breakerThreshold} blocks in ${policy.breakerWindowSec / 60} min`}>
          <div className="mb-2 text-3xl font-light">{blocks} / {policy.breakerThreshold}</div>
          <Progress value={blocks} max={policy.breakerThreshold} label="Blocks in window vs freeze threshold" />
        </Stat>
        <Stat title="Active policy" foot={`${policy.allowlist.length} allowlisted destination${policy.allowlist.length === 1 ? '' : 's'}`}>
          <div className="mb-2 text-3xl font-light">v{policy.version}</div>
          <div className="flex items-center justify-between text-xs text-mute">
            <span>Per tx: {fmt(policy.perTx)} tUSDC</span>
            <Link href="/app/rules" className="font-medium text-brand-deep underline">View rules →</Link>
          </div>
        </Stat>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card title="Latest receipts" action={<Link className="text-sm underline underline-offset-4" href="/app/receipts">All receipts</Link>}>
          {!hydrated ? <Skeleton /> : latest.length ? (
            <ul className="grid gap-2">{latest.map((r) => <ReceiptItem key={r.seq} r={r} compact />)}</ul>
          ) : (
            <Empty title="No activity yet" desc="Submit a proposal or run a scenario in the Agent Console to see receipts here." />
          )}
        </Card>
        <Card title="Owner controls (sovereign, never blocked)">
          <div className="grid gap-3">
            {agent === 'FROZEN'
              ? <button className="btn btn-ink" onClick={unfreeze}>Unfreeze agent</button>
              : <button className="btn btn-danger" onClick={freeze} disabled={agent === 'REVOKED'}>Freeze agent</button>}
            <Withdraw />
            {agent === 'REVOKED'
              ? <button className="btn btn-ghost" onClick={restore}>Restore agent key</button>
              : <button className="btn btn-ghost" onClick={revoke}>Revoke agent key</button>}
            <p className="text-xs text-mute">Non-custodial guarantee: Owner withdraw and freeze always execute directly, independent of agent status.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
