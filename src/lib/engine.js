// Pure, deterministic policy engine. It mirrors BoundedVault's evaluation order so the
// offline demo behaves like the contract. The contract stays the real authority.
// Amounts are integer micro-units (6 decimals) to avoid float drift.
// Every function returns a new state; nothing is mutated.

export const UNIT = 1_000_000;
export const MIN = 60_000;
export const DAY = 86_400_000;
export const PROTOCOL_FEE_BPS = 2; // hypothesis, owner can cap lower via maxFeeBps
export const ASK_TTL_MS = 15 * MIN;
export const AVAX_PRICE = 25; // simulated demo-pool rate: tUSDC per AVAX

export const TIER = { AUTO: 'AUTO', PENDING: 'PENDING', BLOCKED: 'BLOCKED' };
export const REASON = {
  NONE: 'NONE',
  FROZEN: 'FROZEN',
  EXPIRED: 'EXPIRED',
  NOT_ALLOWLISTED: 'NOT_ALLOWLISTED',
  OVER_PER_TX: 'OVER_PER_TX',
  OVER_DAILY: 'OVER_DAILY',
  OVER_VAULT_PCT: 'OVER_VAULT_PCT',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
};
export const ACTIONS = ['transfer', 'swap', 'x402_payment'];
export const TOKENS = ['tUSDC']; // ponytail: limits are tUSDC-denominated; multi-token limits live in the contract
const FEEABLE = new Set(['transfer', 'swap']);
const PROPOSAL_KEYS = ['action', 'token', 'amount', 'destination'];
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

export const toUnits = (n) => Math.round(Number(n) * UNIT);
export const fmt = (u) => (u / UNIT).toLocaleString('en-US', { maximumFractionDigits: 6 });
const same = (a, b) => a.toLowerCase() === b.toLowerCase();
export const isAllowed = (policy, addr) => policy.allowlist.some((x) => same(x.address, addr));
const dayKey = (token, ts) => `${token}:${Math.floor(ts / DAY)}`;
export const spentToday = (s, token = 'tUSDC') => s.spent[dayKey(token, s.clock)] || 0;
export const blocksInWindow = (s) =>
  s.blockTimes.filter((t) => s.clock - t < s.policy.breakerWindowSec * 1000).length;

// Deterministic fake tx hash so receipts are stable across reloads. Simulated, not on-chain.
export function simHash(seed) {
  let h = 2166136261;
  let out = '';
  for (let round = 0; round < 8; round++) {
    for (const c of `${seed}:${round}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
    out += h.toString(16).padStart(8, '0');
  }
  return `0x${out}`;
}

const emit = (s, type, data = {}) => ({
  ...s,
  events: [...s.events, { seq: s.events.length + 1, type, ts: s.clock, ...data }],
});

export function feeFor(policy, action, amount) {
  if (!FEEABLE.has(action)) return 0;
  return Math.floor((amount * Math.min(PROTOCOL_FEE_BPS, policy.maxFeeBps)) / 10_000);
}

/** Strict schema for agent output. Unknown keys, bad enums and non-positive amounts are rejected. */
export function validateProposal(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: ['Proposal must be an object.'] };
  const errors = [];
  for (const k of Object.keys(input)) if (!PROPOSAL_KEYS.includes(k)) errors.push(`Unknown field "${k}".`);
  for (const k of PROPOSAL_KEYS) if (!(k in input)) errors.push(`Missing field "${k}".`);
  if ('action' in input && !ACTIONS.includes(input.action)) errors.push(`action must be one of ${ACTIONS.join(', ')}.`);
  if ('token' in input && !TOKENS.includes(input.token)) errors.push(`token must be one of ${TOKENS.join(', ')}.`);
  const amt = typeof input.amount === 'string' ? Number(input.amount) : input.amount;
  if ('amount' in input && !(typeof amt === 'number' && Number.isFinite(amt) && amt > 0)) errors.push('amount must be a positive number.');
  if ('destination' in input && !(typeof input.destination === 'string' && ADDRESS.test(input.destination))) {
    errors.push('destination must be a 0x address (40 hex characters).');
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { ...input, amount: toUnits(amt) } };
}

/** Evaluation order matches the contract: frozen, expired, allowlist, soft limits, balance. */
export function evaluate(s, p) {
  const { policy } = s;
  const block = (reason) => ({ tier: TIER.BLOCKED, reason, fee: 0 });
  const ask = (reason) => ({ tier: TIER.PENDING, reason, fee: 0 });
  if (s.agent !== 'ACTIVE') return block(REASON.FROZEN);
  if (s.clock > policy.expiry) return block(REASON.EXPIRED);
  if (!isAllowed(policy, p.destination)) return block(REASON.NOT_ALLOWLISTED);
  const bal = s.balances[p.token] || 0;
  if (p.amount > policy.perTx) return ask(REASON.OVER_PER_TX);
  if (spentToday(s, p.token) + p.amount > policy.daily) return ask(REASON.OVER_DAILY);
  if (p.amount * 100 > bal * policy.maxVaultPct) return ask(REASON.OVER_VAULT_PCT);
  const fee = feeFor(policy, p.action, p.amount);
  if (bal < p.amount + fee) return block(REASON.INSUFFICIENT_BALANCE);
  return { tier: TIER.AUTO, reason: REASON.NONE, fee };
}

function execute(s, p, fee) {
  const key = dayKey(p.token, s.clock);
  const balances = { ...s.balances, [p.token]: s.balances[p.token] - p.amount - fee };
  if (p.action === 'swap') balances.AVAX = (balances.AVAX || 0) + Math.floor(p.amount / AVAX_PRICE);
  return { ...s, balances, spent: { ...s.spent, [key]: (s.spent[key] || 0) + p.amount } };
}

function tripBreaker(s) {
  const recent = [...s.blockTimes.filter((t) => s.clock - t < s.policy.breakerWindowSec * 1000), s.clock];
  const next = { ...s, blockTimes: recent };
  if (recent.length < s.policy.breakerThreshold) return next;
  return emit({ ...next, agent: 'FROZEN' }, 'AgentFrozen', { cause: 'BREAKER', blocks: recent.length });
}

/** Agent proposes; the engine decides. Always yields exactly one Decided event. */
export function propose(s, value, agentId = 'agent-1') {
  const id = s.nextId;
  const proposal = { id, ts: s.clock, agentId, ...value, policyVersion: s.policy.version };
  let next = emit({ ...s, nextId: id + 1 }, 'Proposed', { proposal });
  const d = evaluate(s, proposal);
  const decided = { proposalId: id, tier: d.tier, reason: d.reason, fee: d.fee };
  if (d.tier === TIER.AUTO) {
    next = emit(execute(next, proposal, d.fee), 'Decided', { ...decided, txHash: simHash(`tx${id}`) });
  } else if (d.tier === TIER.PENDING) {
    const req = { proposal, reason: d.reason, expiresAt: s.clock + ASK_TTL_MS };
    next = emit({ ...next, pending: [...next.pending, req] }, 'Decided', decided);
  } else {
    next = emit(next, 'Decided', decided);
    if (s.agent === 'ACTIVE') next = tripBreaker(next); // already-frozen blocks need no extra freeze
  }
  return { state: next, decision: { proposal, ...d } };
}

const dropPending = (s, id) => ({ ...s, pending: s.pending.filter((r) => r.proposal.id !== id) });

/** Owner approves an Ask item. Works even when the agent is frozen (owner sovereignty). */
export function approve(s, id) {
  const req = s.pending.find((r) => r.proposal.id === id);
  if (!req) return { state: s, error: 'That request is no longer pending.' };
  if (s.clock >= req.expiresAt) return { state: s, error: 'That request has expired.' };
  const p = req.proposal;
  const fee = feeFor(s.policy, p.action, p.amount);
  if ((s.balances[p.token] || 0) < p.amount + fee) return { state: s, error: "The vault doesn't hold enough tUSDC." };
  const next = execute(dropPending(s, id), p, fee);
  return { state: emit(next, 'Approved', { proposalId: id, fee, txHash: simHash(`tx${id}`) }) };
}

/** Rejections and expiries never count toward the breaker (open decision, default NO). */
export function reject(s, id, expired = false) {
  if (!s.pending.some((r) => r.proposal.id === id)) return s;
  return emit(dropPending(s, id), 'Rejected', { proposalId: id, expired });
}

export function expireAsks(s) {
  return s.pending.filter((r) => s.clock >= r.expiresAt).reduce((acc, r) => reject(acc, r.proposal.id, true), s);
}

export const advance = (s, ms) => expireAsks({ ...s, clock: s.clock + ms });

export const freeze = (s) => emit({ ...s, agent: s.agent === 'REVOKED' ? 'REVOKED' : 'FROZEN' }, 'AgentFrozen', { cause: 'OWNER' });
export const unfreeze = (s) =>
  s.agent === 'FROZEN' ? emit({ ...s, agent: 'ACTIVE', blockTimes: [] }, 'AgentUnfrozen') : s;
export const revoke = (s) => emit({ ...s, agent: 'REVOKED' }, 'AgentRevoked');
export const restore = (s) => (s.agent === 'REVOKED' ? emit({ ...s, agent: 'ACTIVE', blockTimes: [] }, 'AgentRestored') : s);

export function withdraw(s, token, amount) {
  const bal = s.balances[token] || 0;
  if (!(amount > 0) || amount > bal) return { state: s, error: 'Amount must be above zero and at most the vault balance.' };
  return { state: emit({ ...s, balances: { ...s.balances, [token]: bal - amount } }, 'Withdrawn', { token, amount }) };
}

// Which direction of change gives the agent more room. A shorter breaker window loosens:
// blocks expire sooner, so it takes faster bursts to trip.
const LOOSER_WHEN = {
  perTx: 'up', daily: 'up', maxVaultPct: 'up', breakerThreshold: 'up',
  breakerWindowSec: 'down', expiry: 'up', maxFeeBps: 'up',
};

export function diffPolicy(prev, next) {
  const changes = Object.entries(LOOSER_WHEN)
    .filter(([k]) => prev[k] !== next[k])
    .map(([k, dir]) => ({ field: k, from: prev[k], to: next[k], loosens: dir === 'up' ? next[k] > prev[k] : next[k] < prev[k] }));
  const had = (list, a) => list.some((x) => same(x.address, a.address));
  for (const a of next.allowlist) if (!had(prev.allowlist, a)) changes.push({ field: 'allowlist', from: null, to: a, loosens: true });
  for (const a of prev.allowlist) if (!had(next.allowlist, a)) changes.push({ field: 'allowlist', from: a, to: null, loosens: false });
  return changes;
}

export const isLoosening = (prev, next) => diffPolicy(prev, next).some((c) => c.loosens);

/** Owner rule change. The UI must show the diff and require confirmation when it loosens. */
export function setPolicy(s, next) {
  const changes = diffPolicy(s.policy, next);
  if (!changes.length) return s;
  const version = s.policy.version + 1;
  return emit({ ...s, policy: { ...next, version } }, 'PolicyUpdated', { version, changes });
}

/** Counts derived from the event log only. */
export function summarize(events) {
  const decided = events.filter((e) => e.type === 'Decided');
  const status = [...events].reverse().find((e) => ['AgentFrozen', 'AgentUnfrozen', 'AgentRevoked', 'AgentRestored'].includes(e.type));
  return {
    proposals: events.filter((e) => e.type === 'Proposed').length,
    auto: decided.filter((e) => e.tier === TIER.AUTO).length,
    asked: decided.filter((e) => e.tier === TIER.PENDING).length,
    approved: events.filter((e) => e.type === 'Approved').length,
    rejected: events.filter((e) => e.type === 'Rejected').length,
    blocked: decided.filter((e) => e.tier === TIER.BLOCKED).length,
    fees: events.reduce((n, e) => n + (e.type === 'Approved' || (e.type === 'Decided' && e.tier === TIER.AUTO) ? e.fee : 0), 0),
    frozen: status?.type === 'AgentFrozen',
    revoked: status?.type === 'AgentRevoked',
  };
}

export function summaryLine(sum) {
  const parts = [`${sum.auto} auto`, `${sum.approved} approved`, `${sum.blocked} blocked`];
  const pending = sum.asked - sum.approved - sum.rejected;
  if (pending > 0) parts.push(`${pending} pending`);
  if (sum.rejected) parts.push(`${sum.rejected} rejected`);
  const tail = sum.frozen ? ', agent frozen' : sum.revoked ? ', agent revoked' : '';
  return `${sum.proposals} proposal${sum.proposals === 1 ? '' : 's'}: ${parts.join(', ')}${tail}.`;
}
