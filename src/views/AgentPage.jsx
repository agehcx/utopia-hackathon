'use client';

import { useState, useRef, useEffect } from 'react';
import { useVaultStore } from '../store/useVaultStore';
import ActionCard from '../components/agent/ActionCard';
import ClassificationBadge from '../components/agent/ClassificationBadge';

function shortAddr(addr) {
  if (!addr || addr.length < 10) return addr;
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

const SUGGESTED = [
  { label: 'Pay 0.05 ETH to allowlisted address', type: 'PAYMENT', amount: 0.05, to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
  { label: 'Pay 0.25 ETH (requires approval)', type: 'PAYMENT', amount: 0.25, to: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B' },
  { label: 'Attempt blocked transaction', type: 'PAYMENT', amount: 2.0, to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' },
  { label: 'Check vault balance', type: 'INFO' },
];

function parseUserMessage(text, policy, allowlist) {
  const lower = text.toLowerCase();
  const amountMatch = text.match(/(\d+\.?\d*)\s*eth/i);
  const addrMatch = text.match(/0x[0-9a-fA-F]{40}/);

  if (lower.includes('pay') || lower.includes('send') || lower.includes('transfer')) {
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0.05;
    const to = addrMatch ? addrMatch[0] : (allowlist[0] || '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    let classification = 'AUTO';
    if (policy.isPaused || policy.agentRevoked) classification = 'BLOCKED';
    else if (amount > policy.perTxLimit || policy.dailySpent + amount > policy.dailyLimit) classification = 'NEEDS_APPROVAL';
    return {
      type: 'PAYMENT',
      amount,
      to,
      classification,
      reason: `Agent-initiated payment of ${amount} ETH`,
    };
  }
  if (lower.includes('balance') || lower.includes('status') || lower.includes('check')) {
    return { type: 'INFO' };
  }
  if (lower.includes('pause') || lower.includes('stop') || lower.includes('halt')) {
    return { type: 'CONTROL', action: 'pause' };
  }
  return null;
}

function agentReply(action, policy, balance) {
  if (!action) return "I can help you send payments, check balances, or manage agent controls. Try asking me to send ETH or check your vault status.";
  if (action.type === 'INFO') {
    return `Your vault currently holds **${balance.toFixed(4)} ETH**. Daily spending: ${policy.dailySpent.toFixed(4)} / ${policy.dailyLimit} ETH. Agent is ${policy.isPaused ? 'paused' : policy.agentRevoked ? 'revoked' : 'active'}.`;
  }
  if (action.type === 'PAYMENT') {
    if (action.classification === 'BLOCKED') return `I can't process this payment — the agent is currently ${policy.isPaused ? 'paused' : policy.agentRevoked ? 'revoked' : 'blocked by policy'}. Please update your settings in the Policy Dashboard.`;
    if (action.classification === 'NEEDS_APPROVAL') return `This payment of ${action.amount} ETH exceeds your auto-approval threshold. I've prepared the transaction for your review below.`;
    return `Payment of ${action.amount} ETH is within your policy limits. I'll execute this automatically.`;
  }
  if (action.type === 'CONTROL') return `To pause or resume the agent, use the toggle in the Policy Dashboard under Agent Controls.`;
  return "I've prepared the action for your review.";
}

export default function AgentPage() {
  const { isConnected, balance, policy, allowlist, simulateTransaction } = useVaultStore();
  const [messages, setMessages] = useState([
    {
      id: 'm0',
      role: 'agent',
      text: "Hello! I'm your AgentSafe AI. I can send payments, check your vault balance, and preview transactions against your policy. What would you like to do?",
      timestamp: Date.now(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { id: 'u_' + Date.now(), role: 'user', text: text.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    await new Promise(r => setTimeout(r, 800));

    const action = parseUserMessage(text, policy, allowlist);
    const reply = agentReply(action, policy, balance);

    const agentMsg = {
      id: 'a_' + Date.now(),
      role: 'agent',
      text: reply,
      timestamp: Date.now(),
      action: action && action.type !== 'INFO' && action.type !== 'CONTROL' ? action : null,
    };

    setIsTyping(false);
    setMessages(prev => [...prev, agentMsg]);

    if (agentMsg.action && agentMsg.action.classification === 'AUTO') {
      await simulateTransaction(agentMsg.action);
    }
  };

  const handleSuggestion = (s) => {
    sendMessage(s.label);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleActionDone = (msgId, result) => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, actionDone: true, actionResult: result } : m
    ));
  };

  if (!isConnected) {
    return (
      <div className="empty-state" style={{ marginTop: 60 }}>
        <div className="empty-state-icon">🤖</div>
        <div className="empty-state-title">Wallet Not Connected</div>
        <div className="empty-state-desc">Connect your wallet to interact with the AI agent.</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4" style={{ height: 'calc(100vh - 56px - 48px)' }}>
      {/* Chat panel */}
      <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--zinc-800)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--violet-500), var(--blue-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--zinc-100)' }}>AgentSafe AI</div>
            <div style={{ fontSize: 11, color: 'var(--emerald-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--emerald-500)', display: 'inline-block' }} />
              Online · Policy-constrained
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {policy.isPaused && <span className="badge badge-blocked">⏸ Paused</span>}
            {policy.agentRevoked && <span className="badge badge-blocked">🚫 Revoked</span>}
            {!policy.isPaused && !policy.agentRevoked && <span className="badge badge-auto">⚡ Active</span>}
          </div>
        </div>

        <div className="chat-messages" style={{ flex: 1, overflowY: 'auto' }}>
          {messages.map(msg => (
            <div key={msg.id} className={`chat-message ${msg.role === 'user' ? 'user' : ''}`}>
              <div className={`chat-avatar ${msg.role === 'agent' ? 'agent' : 'user'}`}>
                {msg.role === 'agent' ? '🤖' : '👤'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: '75%' }}>
                <div className="chat-bubble">
                  {msg.text.split('**').map((part, i) =>
                    i % 2 === 1
                      ? <strong key={i} style={{ color: 'var(--zinc-100)' }}>{part}</strong>
                      : <span key={i}>{part}</span>
                  )}
                </div>
                {msg.action && !msg.actionDone && (
                  <ActionCard
                    action={msg.action}
                    onDone={(result) => handleActionDone(msg.id, result)}
                  />
                )}
                {msg.actionDone && (
                  <div style={{ fontSize: 12, color: msg.actionResult === 'approved' ? 'var(--emerald-500)' : 'var(--rose-500)', display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 4 }}>
                    {msg.actionResult === 'approved' ? '✅ Transaction approved & submitted' : '❌ Transaction rejected'}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--zinc-600)', paddingLeft: 4 }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="chat-message">
              <div className="chat-avatar agent">🤖</div>
              <div className="chat-bubble" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'flex', gap: 3 }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--zinc-500)',
                      animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      display: 'inline-block',
                    }} />
                  ))}
                </span>
                <span style={{ fontSize: 12, color: 'var(--zinc-500)' }}>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--zinc-800)', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
          {SUGGESTED.map((s, i) => (
            <button
              key={i}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 11 }}
              onClick={() => handleSuggestion(s)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="chat-input-area" style={{ flexShrink: 0 }}>
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask the agent to send a payment, check balance, or preview a transaction..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="btn btn-primary"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            style={{ alignSelf: 'flex-end', padding: '10px 16px' }}
          >
            {isTyping ? <span className="spinner" /> : '↑'}
          </button>
        </div>
      </div>

      {/* Right panel: policy context */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflowY: 'auto' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Active Policy</div>
            <div className="card-subtitle">Current enforcement rules</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Per-Tx Limit', value: `${policy.perTxLimit} ETH`, color: 'var(--zinc-200)' },
              { label: 'Daily Limit', value: `${policy.dailyLimit} ETH`, color: 'var(--zinc-200)' },
              { label: 'Daily Spent', value: `${policy.dailySpent.toFixed(4)} ETH`, color: policy.dailySpent / policy.dailyLimit > 0.8 ? 'var(--rose-500)' : 'var(--zinc-200)' },
              { label: 'Vault Balance', value: `${balance.toFixed(4)} ETH`, color: 'var(--emerald-500)' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--zinc-950)', borderRadius: 6, border: '1px solid var(--zinc-800)' }}>
                <span style={{ fontSize: 12, color: 'var(--zinc-500)' }}>{row.label}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: row.color, fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--zinc-500)' }}>Daily budget used</span>
              <span style={{ fontSize: 11, color: 'var(--zinc-400)', fontFamily: 'JetBrains Mono, monospace' }}>
                {((policy.dailySpent / policy.dailyLimit) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className={`progress-fill ${policy.dailySpent / policy.dailyLimit > 0.8 ? 'red' : policy.dailySpent / policy.dailyLimit > 0.5 ? 'amber' : 'green'}`}
                style={{ width: `${Math.min(100, (policy.dailySpent / policy.dailyLimit) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Classification Rules</div>
            <div className="card-subtitle">How transactions are evaluated</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ padding: '10px 12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span className="badge badge-auto" style={{ fontSize: 10 }}>⚡ AUTO</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--zinc-400)', lineHeight: 1.5 }}>
                Amount ≤ {policy.perTxLimit} ETH and daily total ≤ {policy.dailyLimit} ETH
              </div>
            </div>
            <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span className="badge badge-approval" style={{ fontSize: 10 }}>⚠️ NEEDS APPROVAL</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--zinc-400)', lineHeight: 1.5 }}>
                Exceeds per-tx or daily limit — requires manual confirmation
              </div>
            </div>
            <div style={{ padding: '10px 12px', background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span className="badge badge-blocked" style={{ fontSize: 10 }}>🚫 BLOCKED</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--zinc-400)', lineHeight: 1.5 }}>
                Agent is paused, revoked, or transaction violates hard limits
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Allowlist</div>
            <div className="card-subtitle">{allowlist.length} approved addresses</div>
          </div>
          {allowlist.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--zinc-600)', textAlign: 'center', padding: '12px 0' }}>No addresses added yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {allowlist.map(addr => (
                <div key={addr} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--zinc-950)', borderRadius: 6, border: '1px solid var(--zinc-800)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald-500)', flexShrink: 0 }} />
                  <span className="font-mono" style={{ fontSize: 11.5, color: 'var(--zinc-400)' }}>{shortAddr(addr)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
