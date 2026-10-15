'use client';

import { useVault } from '../store/useVaultStore';
import { Big, Card, Empty } from '../components/ui';
import ReceiptRow from '../components/ReceiptRow';

export default function ReceiptsPage() {
  const { events, requests } = useVault();
  const paid = events.filter((e) => e.type === 'PAID' || e.type === 'APPROVED');
  const stats = [
    ['Executed', paid.length],
    ['Pending', requests.filter((r) => r.status === 'PENDING').length],
    ['Blocked', events.filter((e) => e.type === 'BLOCKED').length],
  ];
  const spent = paid.reduce((n, e) => n + e.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-mute">Built from on-chain events · MOCK hashes</p>
        <h1 className="mt-1 text-5xl font-normal tracking-tight sm:text-6xl">Receipts</h1>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, n]) => (
          <Card key={label} title={label}><Big value={n} /></Card>
        ))}
        <Card title="Total spent"><Big value={spent.toFixed(2)} unit="tUSDC" /></Card>
      </section>
      <Card title="Audit timeline · newest first">
        {events.length ? (
          <ul className="space-y-2">{events.map((e) => <ReceiptRow key={e.id} e={e} />)}</ul>
        ) : (
          <Empty title="No activity yet" desc="Every payment, approval and block will be listed here with a link to the explorer." />
        )}
      </Card>
    </div>
  );
}
