'use client';

import { useState } from 'react';
import { useVaultStore } from '../store/useVaultStore';
import ClassificationBadge from '../components/agent/ClassificationBadge';

function shortAddr(addr) {
  if (!addr || addr.length < 10) return addr;
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function shortHash(hash) {
  if (!hash || hash.length < 10) return hash;
  return hash.slice(0, 10) + '...' + hash.slice(-6);
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

function formatTime(ts) {
  return new Date(ts).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

const TYPE_META = {
  PAYMENT: { icon: '💸', label: 'Payment', dotClass: 'payment', color: 'var(--blue-500)' },
  BLOCK:   { icon: '🚫', label: 'Blocked', dotClass: 'block',   color: 'var(--rose-500)' },
  UPDATE:  { icon: '⚙️', label: 'Policy Update', dotClass: 'update', color: 'var(--violet-500)' },
};

const FILTER_OPTIONS = [
  { value: 'ALL',     label: 'All Events' },
  { value: 'PAYMENT', label: 'Payments' },
  { value: 'BLOCK',   label: 'Blocked' },
  { value: 'UPDATE',  label: 'Policy Updates' },
];

const CLASS_FILTERS = [
  { value: 'ALL',            label: 'All' },
  { value: 'AUTO',           label: 'Auto' },
  { value: 'NEEDS_APPROVAL', label: 'Approval' },
  { value: 'BLOCKED',        label: 'Blocked' },
];

export default function AuditPage() {
  const { isConnected, events } = useVaultStore();
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [view, setView] = useState('timeline'); // timeline | table
  const [search, setSearch] = useState('');

  const filtered = events.filter(e => {
    if (typeFilter !== 'ALL' && e.type !== typeFilter) return false;
    if (classFilter !== 'ALL' && e.classification !== classFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!e.hash?.toLowerCase().includes(s) && !e.to?.toLowerCase().includes(s) && !e.type?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const totalPayments = events.filter(e => e.type === 'PAYMENT').length;
  const totalBlocked  = events.filter(e => e.type === 'BLOCK').length;
  const totalUpdates  = events.filter(e => e.type === 'UPDATE').length;
  const totalVolume   = events.filter(e => e.type === 'PAYMENT').reduce((s, e) => s + (e.amount || 0), 0);

  if (!isConnected) {
    return (
      <div className="empty-state" style={{ marginTop: 60 }}>
        <div className="empty-state-icon">📋</div>
        <div className="empty-state-title">Wallet Not Connected</div>
        <div className="empty-state-desc">Connect your wallet to view the audit history.</div>
      </div>
    );
  }

  return (
    <div className="section-gap">
      {/* Summary stats */}
      <div className="grid-4">
        <div className="card stat-card">
          <div className="stat-label">Total Events</div>
          <div className="stat-value">{events.length}</div>
          <div style={{ fontSize: 12, color: 'var(--zinc-600)' }}>All time</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Payments</div>
          <div className="stat-value" style={{ color: 'var(--blue-500)' }}>{totalPayments}</div>
          <div style={{ fontSize: 12, color: 'var(--zinc-600)' }}>{totalVolume.toFixed(4)} ETH total</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Blocked</div>
          <div className="stat-value" style={{ color: 'var(--rose-500)' }}>{totalBlocked}</div>
          <div style={{ fontSize: 12, color: 'var(--zinc-600)' }}>Policy violations</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Policy Updates</div>
          <div className="stat-value" style={{ color: 'var(--violet-500)' }}>{totalUpdates}</div>
          <div style={{ fontSize: 12, color: 'var(--zinc-600)' }}>Configuration changes</div>
        </div>
      </div>

      {/* Filters & controls */}
      <div className="card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="input"
            placeholder="Search by hash, address, or type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 260, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
          />
          <div style={{ display: 'flex', gap: 4, background: 'var(--zinc-800)', borderRadius: 8, padding: 4 }}>
            {FILTER_OPTIONS.map(f => (
              <button
                key={f.value}
                className={`tab ${typeFilter === f.value ? 'active' : ''}`}
                style={{ padding: '5px 10px', fontSize: 12 }}
                onClick={() => setTypeFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--zinc-800)', borderRadius: 8, padding: 4 }}>
            {CLASS_FILTERS.map(f => (
              <button
                key={f.value}
                className={`tab ${classFilter === f.value ? 'active' : ''}`}
                style={{ padding: '5px 10px', fontSize: 12 }}
                onClick={() => setClassFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, background: 'var(--zinc-800)', borderRadius: 8, padding: 4 }}>
            <button className={`tab ${view === 'timeline' ? 'active' : ''}`} style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setView('timeline')}>⏱ Timeline</button>
            <button className={`tab ${view === 'table' ? 'active' : ''}`} style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setView('table')}>⊞ Table</button>
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--zinc-600)' }}>
          Showing {filtered.length} of {events.length} events
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">No events found</div>
            <div className="empty-state-desc">Try adjusting your filters or execute a transaction in the Agent Console.</div>
          </div>
        </div>
      ) : view === 'timeline' ? (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Event Timeline</div>
            <div className="card-subtitle">Most recent events first</div>
          </div>
          <div className="timeline">
            {filtered.map((event, idx) => {
              const meta = TYPE_META[event.type] || TYPE_META.UPDATE;
              const isLast = idx === filtered.length - 1;
              return (
                <div key={event.id} className="timeline-item">
                  <div className="timeline-left">
                    <div className={`timeline-dot ${meta.dotClass}`}>
                      {meta.icon}
                    </div>
                    {!isLast && <div className="timeline-line" />}
                  </div>
                  <div className="timeline-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span className="timeline-title">{meta.label}</span>
                      {event.classification && <ClassificationBadge classification={event.classification} />}
                      {event.type === 'PAYMENT' && event.amount && (
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--blue-500)', fontWeight: 600 }}>
                          {event.amount} ETH
                        </span>
                      )}
                    </div>
                    {event.to && (
                      <div className="timeline-meta">
                        To: <span className="font-mono" style={{ color: 'var(--zinc-400)' }}>{shortAddr(event.to)}</span>
                      </div>
                    )}
                    <div className="timeline-meta" style={{ marginTop: 2 }}>
                      {formatTime(event.timestamp)}
                      <span style={{ margin: '0 6px', color: 'var(--zinc-700)' }}>·</span>
                      <span style={{ color: 'var(--zinc-600)' }}>{timeAgo(event.timestamp)}</span>
                    </div>
                    <div className="timeline-hash font-mono">
                      {shortHash(event.hash)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--zinc-800)' }}>
            <div className="card-title">Event Table</div>
            <div className="card-subtitle">Detailed view of all events</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Classification</th>
                  <th>Amount</th>
                  <th>Recipient</th>
                  <th>Time</th>
                  <th>Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(event => {
                  const meta = TYPE_META[event.type] || TYPE_META.UPDATE;
                  return (
                    <tr key={event.id}>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{meta.icon}</span>
                          <span style={{ color: meta.color, fontWeight: 500 }}>{meta.label}</span>
                        </span>
                      </td>
                      <td>
                        {event.classification
                          ? <ClassificationBadge classification={event.classification} />
                          : <span style={{ color: 'var(--zinc-600)' }}>—</span>
                        }
                      </td>
                      <td>
                        {event.amount
                          ? <span className="font-mono" style={{ color: 'var(--blue-500)', fontWeight: 600 }}>{event.amount} ETH</span>
                          : <span style={{ color: 'var(--zinc-600)' }}>—</span>
                        }
                      </td>
                      <td>
                        {event.to
                          ? <span className="font-mono" style={{ fontSize: 12, color: 'var(--zinc-400)' }}>{shortAddr(event.to)}</span>
                          : <span style={{ color: 'var(--zinc-600)' }}>—</span>
                        }
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>{timeAgo(event.timestamp)}</div>
                        <div style={{ fontSize: 11, color: 'var(--zinc-600)' }}>{formatTime(event.timestamp)}</div>
                      </td>
                      <td>
                        <span className="font-mono" style={{ fontSize: 11, color: 'var(--zinc-500)' }}>
                          {shortHash(event.hash)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export hint */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            const data = JSON.stringify(filtered, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'agentsafe-audit.json'; a.click();
            URL.revokeObjectURL(url);
          }}
        >
          ⬇ Export JSON
        </button>
      </div>
    </div>
  );
}
