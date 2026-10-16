import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../src/lib/engine.js';
import { initialState, SCENARIOS, runAll, SENTIMENT, POOL, ATTACKER } from '../src/lib/scenarios.js';

const U = E.UNIT;
const p = (action, amount, destination = POOL) => ({ action, token: 'tUSDC', amount: amount * U, destination });
const decide = (s, prop) => E.propose(s, prop).decision;

test('within limits is AUTO', () => {
  assert.equal(decide(initialState(), p('swap', 10)).tier, 'AUTO');
});

test('over per-payment limit is ASK', () => {
  const d = decide(initialState(), p('swap', 25));
  assert.deepEqual([d.tier, d.reason], ['PENDING', 'OVER_PER_TX']);
});

test('over remaining daily limit is ASK', () => {
  let s = initialState();
  for (let i = 0; i < 5; i++) s = E.propose(s, p('swap', 20)).state; // 100 spent
  const d = decide(s, p('swap', 1));
  assert.deepEqual([d.tier, d.reason], ['PENDING', 'OVER_DAILY']);
});

test('over max % of vault is ASK', () => {
  const s = { ...initialState(), policy: { ...initialState().policy, perTx: 200 * U, daily: 1000 * U } };
  const d = decide(s, p('swap', 60)); // 10% of 500 = 50
  assert.deepEqual([d.tier, d.reason], ['PENDING', 'OVER_VAULT_PCT']);
});

test('non-allowlisted destination is BLOCK regardless of amount', () => {
  for (const amt of [0.01, 5, 45, 400]) {
    const d = decide(initialState(), p('transfer', amt, ATTACKER));
    assert.deepEqual([d.tier, d.reason], ['BLOCKED', 'NOT_ALLOWLISTED']);
  }
});

test('expired policy is BLOCK', () => {
  const s = E.advance(initialState(), 8 * E.DAY);
  assert.equal(decide(s, p('swap', 1)).reason, 'EXPIRED');
});

test('frozen agent is BLOCK', () => {
  assert.equal(decide(E.freeze(initialState()), p('swap', 1)).reason, 'FROZEN');
});

test('3 blocks within window freeze the agent', () => {
  let s = initialState();
  for (let i = 0; i < 3; i++) s = E.propose(E.advance(s, E.MIN), p('transfer', 1, ATTACKER)).state;
  assert.equal(s.agent, 'FROZEN');
  assert.equal(s.events.at(-1).type, 'AgentFrozen');
});

test('2 blocks then window passes does not freeze', () => {
  let s = initialState();
  s = E.propose(s, p('transfer', 1, ATTACKER)).state;
  s = E.propose(s, p('transfer', 1, ATTACKER)).state;
  s = E.advance(s, 11 * E.MIN);
  s = E.propose(s, p('transfer', 1, ATTACKER)).state;
  assert.equal(s.agent, 'ACTIVE');
  assert.equal(E.blocksInWindow(s), 1);
});

test('rejected or expired Ask does not count toward the breaker', () => {
  let s = initialState();
  s = E.propose(s, p('swap', 25)).state;
  s = E.propose(s, p('swap', 30)).state;
  s = E.reject(s, s.pending[0].proposal.id);
  s = E.advance(s, 16 * E.MIN); // second Ask auto-expires
  assert.equal(s.pending.length, 0);
  assert.equal(s.blockTimes.length, 0);
  assert.equal(s.events.filter((e) => e.type === 'Rejected' && e.expired).length, 1);
});

test('fee: 2 bps on executed swap, zero on block and x402, capped by owner max', () => {
  const s0 = initialState();
  const s = { ...s0, policy: { ...s0.policy, maxFeeBps: 2 } };
  assert.equal(decide(s, p('swap', 10)).fee, 0.002 * U);
  assert.equal(decide(s, p('transfer', 10, ATTACKER)).fee, 0);
  assert.equal(decide(s, p('x402_payment', 10, SENTIMENT)).fee, 0);
  const capped = { ...s, policy: { ...s.policy, maxFeeBps: 1 } };
  assert.equal(decide(capped, p('swap', 10)).fee, 0.001 * U);
  const zero = { ...s, policy: { ...s.policy, maxFeeBps: 0 } };
  assert.equal(decide(zero, p('swap', 10)).fee, 0);
  const high = { ...s, policy: { ...s.policy, maxFeeBps: 5 } };
  assert.equal(decide(high, p('swap', 10)).fee, 0.002 * U); // never above protocol rate
});

test('withdraw and freeze succeed even when frozen', () => {
  const s = E.freeze(initialState());
  const w = E.withdraw(s, 'tUSDC', 100 * U);
  assert.equal(w.error, undefined);
  assert.equal(w.state.balances.tUSDC, 400 * U);
  assert.equal(E.freeze(w.state).agent, 'FROZEN');
});

test('every proposal yields exactly one Decided event', () => {
  let s = initialState();
  const props = [p('swap', 1), p('swap', 25), p('transfer', 1, ATTACKER), p('x402_payment', 2, SENTIMENT)];
  for (const prop of props) {
    const before = s.events.length;
    s = E.propose(s, prop).state;
    const added = s.events.slice(before);
    assert.equal(added.filter((e) => e.type === 'Decided').length, 1);
  }
});

test('full demo: summary line computed from the log', () => {
  const s = runAll(runAll(initialState(), SCENARIOS.normal), SCENARIOS.injection);
  const sum = E.summarize(s.events);
  assert.equal(E.summaryLine(sum), '6 proposals: 2 auto, 1 approved, 3 blocked, agent frozen.');
  assert.equal(sum.proposals, s.events.filter((e) => e.type === 'Proposed').length);
  assert.equal(sum.fees, 0); // fees off by default
  assert.equal(s.balances.tUSDC, 500 * U - 1.5 * U - 10 * U - 25 * U);
  assert.equal(E.propose(s, p('swap', 1)).decision.reason, 'FROZEN');
});

test('schema rejects unknown fields, bad enums, zero and negative amounts', () => {
  const ok = { action: 'swap', token: 'tUSDC', amount: 1, destination: POOL };
  assert.equal(E.validateProposal(ok).ok, true);
  assert.equal(E.validateProposal({ ...ok, memo: 'hi' }).ok, false);
  assert.equal(E.validateProposal({ ...ok, amount: 0 }).ok, false);
  assert.equal(E.validateProposal({ ...ok, amount: -3 }).ok, false);
  assert.equal(E.validateProposal({ ...ok, action: 'drain' }).ok, false);
  assert.equal(E.validateProposal({ ...ok, destination: 'bob' }).ok, false);
  const { destination, ...missing } = ok;
  assert.ok(destination);
  assert.equal(E.validateProposal(missing).ok, false);
});

test('loosening detection', () => {
  const base = initialState().policy;
  assert.equal(E.isLoosening(base, { ...base, perTx: base.perTx - 1 }), false);
  assert.equal(E.isLoosening(base, { ...base, perTx: base.perTx + 1 }), true);
  assert.equal(E.isLoosening(base, { ...base, breakerThreshold: 5 }), true);
  assert.equal(E.isLoosening(base, { ...base, breakerWindowSec: 300 }), true);
  assert.equal(E.isLoosening(base, { ...base, breakerWindowSec: 1200 }), false);
  assert.equal(E.isLoosening(base, { ...base, expiry: base.expiry + 1 }), true);
  assert.equal(E.isLoosening(base, { ...base, maxFeeBps: 3 }), true);
  assert.equal(E.isLoosening(base, { ...base, allowlist: [...base.allowlist, { label: 'x', address: ATTACKER }] }), true);
  assert.equal(E.isLoosening(base, { ...base, allowlist: base.allowlist.slice(1) }), false);
});

test('policy version increments on change and not on no-op', () => {
  const s = initialState();
  assert.equal(E.setPolicy(s, s.policy), s);
  const n = E.setPolicy(s, { ...s.policy, perTx: 5 * U });
  assert.equal(n.policy.version, 2);
  assert.equal(n.events.at(-1).type, 'PolicyUpdated');
});
