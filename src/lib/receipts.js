// Turns the raw event log into readable receipt rows. Pure.
import { fmt, simHash } from './engine.js';

const shortAddr = (a) => (a && a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a || '');
export { shortAddr };

export const labelFor = (addr, allowlist) =>
  allowlist.find((x) => x.address.toLowerCase() === (addr || '').toLowerCase())?.label || 'Unknown address';

const VERB = { x402_payment: 'Paid', swap: 'Swapped', transfer: 'Sent' };

export function buildReceipts(events, allowlist) {
  const proposals = Object.fromEntries(events.filter((e) => e.type === 'Proposed').map((e) => [e.proposal.id, e.proposal]));
  const rows = [];
  for (const e of events) {
    const p = proposals[e.proposalId];
    const base = { seq: e.seq, ts: e.ts, raw: e, fee: e.fee || 0, txHash: e.txHash || simHash(`ev${e.seq}`) };
    const target = p ? { amount: p.amount, token: p.token, to: p.destination, toLabel: labelFor(p.destination, allowlist), version: p.policyVersion, action: p.action } : {};
    const amt = p ? `${fmt(p.amount)} ${p.token}` : '';
    if (e.type === 'Decided') {
      const sentence = {
        AUTO: `${VERB[p.action]} ${amt} to ${target.toLabel}.`,
        PENDING: `Asked you to approve ${p.action === 'swap' ? 'a swap of ' : ''}${amt} to ${target.toLabel}.`,
        BLOCKED: `Blocked ${amt} to ${target.toLabel}. Nothing moved.`,
      }[e.tier];
      rows.push({ ...base, ...target, tier: e.tier, reason: e.reason, sentence });
    } else if (e.type === 'Approved') {
      rows.push({ ...base, ...target, tier: 'APPROVED', reason: 'NONE', sentence: `You approved ${amt} to ${target.toLabel}. Executed.` });
    } else if (e.type === 'Rejected') {
      rows.push({ ...base, ...target, tier: e.expired ? 'EXPIRED' : 'REJECTED', reason: 'NONE', sentence: e.expired ? `Request for ${amt} expired and was auto-rejected.` : `You rejected ${amt} to ${target.toLabel}.` });
    } else if (e.type === 'AgentFrozen') {
      rows.push({ ...base, tier: 'FREEZE', reason: e.cause, sentence: e.cause === 'BREAKER' ? `Agent frozen automatically after ${e.blocks} blocked attempts.` : 'You froze the agent.' });
    } else if (e.type === 'AgentUnfrozen' || e.type === 'AgentRestored') {
      rows.push({ ...base, tier: 'OWNER', reason: 'NONE', sentence: e.type === 'AgentUnfrozen' ? 'You unfroze the agent.' : 'You restored the agent key.' });
    } else if (e.type === 'AgentRevoked') {
      rows.push({ ...base, tier: 'OWNER', reason: 'NONE', sentence: 'You revoked the agent key.' });
    } else if (e.type === 'PolicyUpdated') {
      rows.push({ ...base, tier: 'OWNER', reason: 'NONE', version: e.version, sentence: `Rules updated to version ${e.version} (${e.changes.length} change${e.changes.length === 1 ? '' : 's'}).` });
    } else if (e.type === 'Withdrawn') {
      rows.push({ ...base, tier: 'OWNER', reason: 'NONE', amount: e.amount, token: e.token, sentence: `You withdrew ${fmt(e.amount)} ${e.token}.` });
    }
  }
  return rows.reverse(); // newest first
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export function toCsv(rows) {
  const head = ['time_iso', 'tier', 'sentence', 'amount', 'token', 'destination', 'reason', 'policy_version', 'fee', 'sim_tx_hash'];
  const body = rows.map((r) => [new Date(r.ts).toISOString(), r.tier, r.sentence, r.amount != null ? fmt(r.amount) : '', r.token, r.to, r.reason, r.version, fmt(r.fee), r.txHash].map(csvCell).join(','));
  return [head.join(','), ...body].join('\n');
}

// Simulated clock display. Fixed UTC formatting so server and client render the same text.
export const simTime = (ts) => `${new Date(ts).toISOString().slice(5, 16).replace('T', ' ')} UTC`;
