'use client';

import { useState } from 'react';
import { useVaultStore } from '../store/useVaultStore';

function shortAddr(addr) {
  if (!addr || addr.length < 10) return addr;
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={accent ? { color: accent } : {}}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--zinc-600)' }}>{sub}</div>}
    </div>
  );
}

export default function PolicyPage() {
  const { isConnected, balance, policy, allowlist, updatePolicy, addToAllowlist, removeFromAllowlist } = useVaultStore();

  const [perTx, setPerTx] = useState(policy.perTxLimit);
  const [daily, setDaily] = useState(policy.dailyLimit);
  const [saving, setSaving] = useState(false);
  const [newAddr, setNewAddr] = useState('');
  const [addrError, setAddrError] = useState('');

  const dailyPct = Math.min(100, (policy.dailySpent / policy.dailyLimit) * 100);
  const progressColor = dailyPct > 80 ? 'red' : dailyPct > 50 ? 'amber' : 'green';

  const handleSavePolicy = async () => {
    setSaving(true);
    await updatePolicy({ perTxLimit: perTx, dailyLimit: daily });
    setSaving(false);
  };

  const handleTogglePause = async () => {
    await updatePolicy({ isPaused: !policy.isPaused });
  };

  const handleToggleRevoke = async () => {
    await updatePolicy({ agentRevoked: !policy.agentRevoked });
  };

  const handleAddAddr = () => {
    const trimmed = newAddr.trim();
    if (!trimmed.match(/^0x[0-9a-fA-F]{40}$/)) {
      setAddrError('Invalid Ethereum address (must be 0x + 40 hex chars)');
      return;
    }
    if (allowlist.includes(trimmed)) {
      setAddrError('Address already in allowlist');
      return;
    }
    addToAllowlist(trimmed);
    setNewAddr('');
    setAddrError('');
  };

  if (!isConnected) {
    return (
      <div className="empty-state" style={{ marginTop: 60 }}>
        <div className="empty-state-icon">🔗</div>
        <div className="empty-state-title">Wallet Not Connected</div>
        <div className="empty-state-desc">Connect your wallet using the button in the top-right to manage your vault policy.</div>
      </div>
    );
  }

  return (
    <div className="section-gap">
      {policy.isPaused && (
        <div className="paused-banner">
          <span>⏸</span>
          <span>Agent is currently <strong>paused</strong>. All transactions are blocked until resumed.</span>
        </div>
      )}
      {policy.agentRevoked && (
        <div className="paused-banner" style={{ borderColor: 'rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.06)' }}>
          <span>🚫</span>
          <span>Agent access has been <strong>revoked</strong>. Re-enable to restore agent permissions.</span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid-4">
        <StatCard label="Vault Balance" value={`${balance.toFixed(4)} ETH`} sub="Available funds" />
        <StatCard label="Daily Spent" value={`${policy.dailySpent.toFixed(4)} ETH`} sub={`of ${policy.dailyLimit} ETH limit`} accent={dailyPct > 80 ? 'var(--rose-500)' : undefined} />
        <StatCard label="Per-Tx Limit" value={`${policy.perTxLimit} ETH`} sub="Max single transaction" />
        <StatCard label="Agent Status"
          value={policy.agentRevoked ? 'Revoked' : policy.isPaused ? 'Paused' : 'Active'}
          accent={policy.agentRevoked || policy.isPaused ? 'var(--rose-500)' : 'var(--emerald-500)'}
          sub={policy.agentRevoked ? 'No permissions' : policy.isPaused ? 'Temporarily halted' : 'Operating normally'}
        />
      </div>

      {/* Daily spend progress */}
      <div className="card">
        <div className="card-header">
          <div className="row-between">
            <div>
              <div className="card-title">Daily Spending</div>
              <div className="card-subtitle">Resets every 24 hours</div>
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--zinc-300)' }}>
              {policy.dailySpent.toFixed(4)} / {policy.dailyLimit.toFixed(4)} ETH
            </span>
          </div>
        </div>
        <div className="progress-bar">
          <div className={`progress-fill ${progressColor}`} style={{ width: `${dailyPct}%` }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--zinc-500)' }}>{dailyPct.toFixed(1)}% of daily limit used</div>
      </div>

      <div className="grid-2">
        {/* Policy editor */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Transaction Limits</div>
            <div className="card-subtitle">Set spending thresholds for auto-approval</div>
          </div>
          <div className="col" style={{ gap: 20 }}>
            <div className="input-group">
              <label className="input-label">Per-Transaction Limit (ETH)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range" min="0.01" max="1" step="0.01"
                  value={perTx}
                  onChange={e => setPerTx(parseFloat(e.target.value))}
                  className="range-input"
                  style={{ flex: 1 }}
                />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--zinc-200)', minWidth: 60, textAlign: 'right' }}>
                  {perTx.toFixed(3)} ETH
                </span>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Daily Spending Limit (ETH)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range" min="0.1" max="5" step="0.1"
                  value={daily}
                  onChange={e => setDaily(parseFloat(e.target.value))}
                  className="range-input"
                  style={{ flex: 1 }}
                />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--zinc-200)', minWidth: 60, textAlign: 'right' }}>
                  {daily.toFixed(2)} ETH
                </span>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleSavePolicy}
              disabled={saving || (perTx === policy.perTxLimit && daily === policy.dailyLimit)}
            >
              {saving ? <><span className="spinner" /> Saving...</> : '💾 Save Policy'}
            </button>
          </div>
        </div>

        {/* Agent controls */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Agent Controls</div>
            <div className="card-subtitle">Emergency controls and permissions</div>
          </div>
          <div className="col" style={{ gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--zinc-950)', borderRadius: 8, border: '1px solid var(--zinc-800)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--zinc-200)' }}>Pause Agent</div>
                <div style={{ fontSize: 12, color: 'var(--zinc-500)', marginTop: 2 }}>Temporarily halt all transactions</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={policy.isPaused} onChange={handleTogglePause} />
                <span className="toggle-slider" />
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--zinc-950)', borderRadius: 8, border: '1px solid var(--zinc-800)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--zinc-200)' }}>Revoke Agent Access</div>
                <div style={{ fontSize: 12, color: 'var(--zinc-500)', marginTop: 2 }}>Permanently remove permissions</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={policy.agentRevoked} onChange={handleToggleRevoke} />
                <span className="toggle-slider" />
              </label>
            </div>
            <div style={{ padding: '12px 14px', background: 'rgba(244,63,94,0.05)', borderRadius: 8, border: '1px solid rgba(244,63,94,0.15)' }}>
              <div style={{ fontSize: 12, color: 'var(--zinc-500)', lineHeight: 1.6 }}>
                ⚠️ Revoking agent access requires a new on-chain authorization to restore. Use with caution.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Allowlist */}
      <div className="card">
        <div className="card-header">
          <div className="row-between">
            <div>
              <div className="card-title">Address Allowlist</div>
              <div className="card-subtitle">Only these addresses can receive agent-initiated payments</div>
            </div>
            <span className="badge badge-auto">{allowlist.length} addresses</span>
          </div>
        </div>
        <div className="col" style={{ gap: 8, marginBottom: 16 }}>
          {allowlist.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No addresses in allowlist</div>
            </div>
          ) : (
            allowlist.map(addr => (
              <div key={addr} className="allowlist-item">
                <span className="allowlist-addr font-mono">{shortAddr(addr)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--zinc-600)' }}>{addr}</span>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => removeFromAllowlist(addr)}
                    style={{ padding: '3px 8px', fontSize: 11 }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="input"
            placeholder="0x... Ethereum address"
            value={newAddr}
            onChange={e => { setNewAddr(e.target.value); setAddrError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleAddAddr()}
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
          />
          <button className="btn btn-secondary" onClick={handleAddAddr} style={{ whiteSpace: 'nowrap' }}>
            + Add
          </button>
        </div>
        {addrError && <div style={{ fontSize: 12, color: 'var(--rose-500)', marginTop: 6 }}>{addrError}</div>}
      </div>
    </div>
  );
}
