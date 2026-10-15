import { evaluate, TIER } from './rules';

// MOCK vault: a pure state machine mirroring BoundedVault so the UI is demo-able offline.
// Every transition returns a new state; nothing is mutated.

const HOUR = 3_600_000;
const SVC = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const DATA = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';
export const ATTACKER = '0x000000000000000000000000000000000000dEaD';

let seq = 100;
const nextId = () => `ev${++seq}`;
const mockHash = () =>
  '0xmock_' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
const prepend = (list, item) => [item, ...list];

export function initialState(now = Date.now()) {
  const h = (n, t) => ({ hash: `0xmock_seed${n}`.padEnd(40, '0'), ts: now - t * HOUR });
  return {
    now,
    connected: false,
    balance: 46.5,
    spentToday: 3.5,
    blockTimes: [],
    policy: { perTx: 2, daily: 10, expiresAt: now + 24 * HOUR, breakerN: 3, windowMin: 60, frozen: false, revoked: false },
    allowlist: [
      { address: SVC, label: 'Data service' },
      { address: DATA, label: 'Research API' },
    ],
    requests: [{ id: 'rq1', to: DATA, amount: 5, reason: 'Annual research feed', status: 'PENDING' }],
    chat: [],
    events: [
      { id: 'e5', type: 'BLOCKED', to: ATTACKER, amount: 15, reason: 'Urgent transfer', code: 'NOT_ALLOWLISTED', ...h(5, 0.4) },
      { id: 'e4', type: 'PENDING', to: DATA, amount: 5, reason: 'Annual research feed', code: 'OVER_LIMIT', ...h(4, 1) },
      { id: 'e3', type: 'BLOCKED', to: ATTACKER, amount: 2, reason: 'Test send', code: 'NOT_ALLOWLISTED', ...h(3, 2) },
      { id: 'e2', type: 'PAID', to: DATA, amount: 2, reason: 'Market data pull', ...h(2, 4) },
      { id: 'e1', type: 'PAID', to: SVC, amount: 1.5, reason: 'Price feed', ...h(1, 6) },
    ],
  };
}

const event = (type, a, extra = {}, now) => ({
  id: nextId(), type, to: a.to, amount: a.amount, reason: a.reason, hash: mockHash(), ts: now, ...extra,
});

/** Agent proposes an action; the (mock) vault decides. Returns { state, tier, code }. */
export function propose(s, a, now = Date.now()) {
  const { tier, code } = evaluate(a, s, now);
  if (tier === TIER.AUTO) {
    return {
      tier, code,
      state: { ...s, balance: s.balance - a.amount, spentToday: s.spentToday + a.amount, events: prepend(s.events, event('PAID', a, {}, now)) },
    };
  }
  if (tier === TIER.ASK) {
    const req = { id: nextId(), to: a.to, amount: a.amount, reason: a.reason, status: 'PENDING' };
    return { tier, code, state: { ...s, requests: prepend(s.requests, req), events: prepend(s.events, event('PENDING', a, { code }, now)) } };
  }
  let next = { ...s, events: prepend(s.events, event('BLOCKED', a, { code }, now)) };
  if (code !== 'FROZEN' && code !== 'REVOKED') next = tripBreaker(next, now);
  return { tier, code, state: next };
}

function tripBreaker(s, now) {
  const { breakerN, windowMin } = s.policy;
  const recent = [...s.blockTimes.filter((t) => now - t < windowMin * 60_000), now];
  const trip = breakerN > 0 && recent.length >= breakerN;
  if (!trip) return { ...s, blockTimes: recent };
  return {
    ...s,
    blockTimes: recent,
    policy: { ...s.policy, frozen: true },
    events: prepend(s.events, { id: nextId(), type: 'FROZEN', code: 'OWNER', reason: `${recent.length} blocked attempts in ${windowMin} min`, hash: mockHash(), ts: now }),
  };
}

const settle = (s, id, status) => s.requests.map((r) => (r.id === id ? { ...r, status } : r));

export function approve(s, id, now = Date.now()) {
  const r = s.requests.find((x) => x.id === id && x.status === 'PENDING');
  if (!r) return { state: s, error: 'Request is no longer pending.' };
  if (s.balance < r.amount) return { state: s, error: "The vault doesn't hold enough tUSDC." };
  return {
    state: { ...s, balance: s.balance - r.amount, requests: settle(s, id, 'APPROVED'), events: prepend(s.events, event('APPROVED', r, {}, now)) },
  };
}

export function reject(s, id, now = Date.now()) {
  const r = s.requests.find((x) => x.id === id && x.status === 'PENDING');
  if (!r) return s;
  return { ...s, requests: settle(s, id, 'REJECTED'), events: prepend(s.events, event('REJECTED', r, {}, now)) };
}

export const freeze = (s, now = Date.now()) => ({
  ...s,
  policy: { ...s.policy, frozen: true },
  events: prepend(s.events, { id: nextId(), type: 'FROZEN', code: 'OWNER', reason: 'Frozen by you', hash: mockHash(), ts: now }),
});

export const unfreeze = (s) => ({ ...s, blockTimes: [], policy: { ...s.policy, frozen: false } });

export const revoke = (s, now = Date.now()) => ({
  ...s,
  policy: { ...s.policy, revoked: true },
  events: prepend(s.events, { id: nextId(), type: 'REVOKED', reason: 'Agent key revoked', hash: mockHash(), ts: now }),
});

export const restore = (s) => ({ ...s, policy: { ...s.policy, revoked: false } });

export const setPolicy = (s, p, now = Date.now()) => ({
  ...s,
  policy: { ...s.policy, ...p },
  events: prepend(s.events, { id: nextId(), type: 'POLICY', reason: 'Rules updated', hash: mockHash(), ts: now }),
});
