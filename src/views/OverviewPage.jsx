'use client';

import { useMemo } from 'react';
import { useVault } from '../store/useVaultStore';
import { Big, Card, Empty, Gauge, Pill, SegBar, TickChart } from '../components/ui';
import ReceiptRow from '../components/ReceiptRow';

const BUCKET = 20 * 60_000; // 72 ticks = 24h
const BUCKETS = 72;
// back card first so each title peeks out above the one in front
const TIERS = [
  { name: 'Blocked', body: 'Breaks a rule. Recorded on-chain, funds stay put.', pos: 'top-0 rotate-[2deg] z-10 opacity-60' },
  { name: 'Ask', body: 'Over a limit. It waits for your wallet signature.', pos: 'top-12 -rotate-[1deg] z-20 opacity-80' },
  { name: 'Auto', body: 'Inside your rules. The vault pays instantly.', pos: 'top-24 z-30' },
];

export default function OverviewPage({ go }) {
  const { now, balance, spentToday, policy, events, requests, freeze, unfreeze, restore, connected } = useVault();
  const left = Math.max(0, policy.daily - spentToday);
  const pct = policy.daily ? (spentToday / policy.daily) * 100 : 0;
  const count = (t) => events.filter((e) => e.type === t).length;
  const paid = count('PAID') + count('APPROVED');
  const ask = requests.filter((r) => r.status === 'PENDING').length;
  const blocked = count('BLOCKED');
  const total = Math.max(1, paid + ask + blocked);

  const series = useMemo(() => {
    const buckets = Array(BUCKETS).fill(0);
    for (const e of events) {
      if (e.type !== 'PAID' && e.type !== 'APPROVED') continue;
      const i = BUCKETS - 1 - Math.floor((now - e.ts) / BUCKET);
      if (i >= 0 && i < BUCKETS) buckets[i] += e.amount;
    }
    return buckets;
  }, [events, now]);

  const status = policy.revoked ? 'Revoked' : policy.frozen ? 'Frozen' : 'Active';

  return (
    <div className="space-y-6">
      <section className="grid items-end gap-8 lg:grid-cols-[1fr_minmax(0,460px)]">
        <div>
          <p className="text-sm text-mute">Vault on Avalanche Fuji · testnet</p>
          <h1 className="mt-1 text-5xl font-normal tracking-tight sm:text-7xl">Overview</h1>
          <p className="mt-4 max-w-md text-base text-ink/70">
            Your agent proposes. Your rules decide. The contract enforces. Even a hijacked agent can only spend what you allowed.
          </p>
        </div>
        <div className="relative hidden h-72 lg:block" aria-label="How it works: three tiers">
          {TIERS.map((t) => (
            <div key={t.name} className={`glass absolute inset-x-0 h-44 rounded-[1.75rem] p-5 transition ${t.pos}`}>
              <div className="text-sm font-medium">{t.name}</div>
              <p className="mt-4 max-w-[18rem] text-2xl font-light leading-snug">{t.body}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:hidden">
          {[...TIERS].reverse().map((t) => (
            <div key={t.name} className="glass rounded-3xl p-4">
              <div className="text-sm font-medium">{t.name}</div>
              <p className="mt-2 text-sm">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Vault balance">
          <Big value={balance.toFixed(2)} unit="tUSDC" />
          <div className="mt-5"><SegBar black={(spentToday / Math.max(1, balance + spentToday)) * 100} brand={8} /></div>
          <p className="mt-3 text-xs text-mute">Mock tUSDC · you can withdraw any time</p>
        </Card>
        <Card title="Spent today">
          <Gauge pct={pct} label={`${pct.toFixed(0)}%`} sub={`${left.toFixed(2)} of ${policy.daily} left`} />
        </Card>
        <Card title="Decisions">
          <Big value={paid + ask + blocked} unit="total" />
          <div className="mt-4 flex justify-between text-xs text-mute">
            <span>{paid} paid</span><span>{ask} asking</span><span>{blocked} blocked</span>
          </div>
          <div className="mt-2"><SegBar brand={(ask / total) * 100} black={(blocked / total) * 100} /></div>
        </Card>
        <Card title="Agent" action={<Pill tone={status === 'Active' ? 'AUTO' : status.toUpperCase()}>{status}</Pill>}>
          <p className="text-sm text-ink/70">
            Breaker trips after <b>{policy.breakerN}</b> blocked attempts in <b>{policy.windowMin} min</b>.
          </p>
          <div className="mt-5 flex gap-2">
            {policy.revoked ? (
              <button className="btn btn-ink" disabled={!connected} onClick={restore}>Restore key</button>
            ) : policy.frozen ? (
              <button className="btn btn-ink" disabled={!connected} onClick={unfreeze}>Unfreeze</button>
            ) : (
              <button className="btn btn-danger" disabled={!connected} onClick={freeze}>Freeze agent</button>
            )}
          </div>
          {!connected && <p className="mt-2 text-xs text-mute">Connect a wallet to act.</p>}
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card title="Spending · last 24h" action={<Pill tone="mock" />}>
          <TickChart values={series} />
          <div className="mt-2 flex justify-between text-xs text-mute"><span>24h ago</span><span>Now</span></div>
        </Card>
        <Card title="Latest receipts" action={<button className="text-xs underline underline-offset-2" onClick={() => go('receipts')}>See all</button>}>
          {events.length ? (
            <ul className="space-y-2">{events.slice(0, 3).map((e) => <ReceiptRow key={e.id} e={e} />)}</ul>
          ) : (
            <Empty title="Nothing yet" desc="Ask the agent to make a payment to see receipts here." />
          )}
        </Card>
      </section>
    </div>
  );
}
