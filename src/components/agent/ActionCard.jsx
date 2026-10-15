'use client';

import { useState } from 'react';
import ClassificationBadge from './ClassificationBadge';
import { useVaultStore } from '../../store/useVaultStore';

function shortAddr(addr) {
  if (!addr || addr.length < 10) return addr;
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export default function ActionCard({ action, onDone }) {
  const [status, setStatus] = useState('idle'); // idle | loading | done
  const { simulateTransaction } = useVaultStore();

  const handleApprove = async () => {
    setStatus('loading');
    await simulateTransaction(action);
    setStatus('done');
    if (onDone) onDone('approved');
  };

  const handleReject = async () => {
    setStatus('loading');
    await simulateTransaction({ type: 'BLOCK' });
    setStatus('done');
    if (onDone) onDone('rejected');
  };

  const isLoading = status === 'loading';
  const isDone = status === 'done';

  return (
    <div className="action-card">
      <div className="action-card-header">
        <span className="action-card-title">
          {action.type === 'PAYMENT' ? '💸 Payment Request' : '⚙️ Agent Action'}
        </span>
        <ClassificationBadge classification={action.classification} />
      </div>

      <div className="action-card-body">
        {action.type === 'PAYMENT' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--zinc-500)', fontSize: 12 }}>Amount</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--zinc-100)', fontWeight: 700, fontSize: 15 }}>
                {action.amount} ETH
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--zinc-500)', fontSize: 12 }}>Recipient</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--zinc-300)', fontSize: 12 }}>
                {shortAddr(action.to)}
              </span>
            </div>
            {action.reason && (
              <div style={{ marginTop: 4, padding: '8px 10px', background: 'var(--zinc-950)', borderRadius: 6, fontSize: 12, color: 'var(--zinc-400)', lineHeight: 1.5 }}>
                {action.reason}
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--zinc-400)', lineHeight: 1.5 }}>
            {action.description || 'Agent requested an action.'}
          </div>
        )}
      </div>

      {isDone ? (
        <div style={{ fontSize: 12, color: 'var(--emerald-500)', display: 'flex', alignItems: 'center', gap: 5 }}>
          ✅ Action processed
        </div>
      ) : action.classification === 'AUTO' ? (
        <div style={{ fontSize: 11, color: 'var(--zinc-600)', display: 'flex', alignItems: 'center', gap: 4 }}>
          ⚡ Auto-executed within policy limits
        </div>
      ) : (
        <div className="action-card-footer">
          <button className="btn btn-primary btn-sm" onClick={handleApprove} disabled={isLoading}>
            {isLoading ? <span className="spinner" /> : '✓'} Approve
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleReject} disabled={isLoading}>
            {isLoading ? <span className="spinner" /> : '✕'} Reject
          </button>
        </div>
      )}
    </div>
  );
}
