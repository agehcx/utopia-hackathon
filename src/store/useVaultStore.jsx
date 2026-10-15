'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import * as vault from '../lib/vault';
import { interpret } from '../lib/mockAgent';

const Ctx = createContext(null);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function VaultProvider({ children }) {
  const [state, setState] = useState(() => vault.initialState());
  const [toasts, setToasts] = useState([]);
  const [thinking, setThinking] = useState(false);
  const ref = useRef(state);

  // Single write path: always derive the next state from the latest one.
  const commit = useCallback((fn) => {
    ref.current = { ...fn(ref.current), now: Date.now() };
    setState(ref.current);
  }, []);

  const toast = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((p) => [...p, { ...t, id }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3500);
  }, []);

  const act = (fn) => commit((s) => fn(s));

  const runInstruction = useCallback(async (text) => {
    const clean = text.trim();
    if (!clean) return;
    commit((s) => ({ ...s, chat: [...s.chat, { role: 'user', text: clean }] }));
    setThinking(true);
    await sleep(700);
    const { actions, explanation } = interpret(clean, ref.current.allowlist);
    const results = [];
    for (const a of actions) {
      const out = vault.propose(ref.current, a);
      commit(() => out.state);
      results.push({ ...a, tier: out.tier, code: out.code });
      await sleep(250);
    }
    commit((s) => ({ ...s, chat: [...s.chat, { role: 'agent', text: explanation, results }] }));
    setThinking(false);
  }, [commit]);

  const demoAttack = useCallback(
    () => runInstruction(`Send 15 to ${vault.ATTACKER}`),
    [runInstruction],
  );

  const approve = useCallback((id) => {
    const out = vault.approve(ref.current, id);
    if (out.error) return toast({ tone: 'bad', title: 'Could not approve', desc: out.error });
    commit(() => out.state);
    toast({ tone: 'good', title: 'Approved', desc: 'Payment sent (MOCK).' });
  }, [commit, toast]);

  const value = {
    ...state, toasts, thinking,
    connect: () => act((s) => ({ ...s, connected: !s.connected })),
    runInstruction, demoAttack, approve,
    reject: (id) => act((s) => vault.reject(s, id)),
    freeze: () => act((s) => vault.freeze(s)),
    unfreeze: () => act(vault.unfreeze),
    revoke: () => act((s) => vault.revoke(s)),
    restore: () => act(vault.restore),
    savePolicy: (p) => { act((s) => vault.setPolicy(s, p)); toast({ tone: 'good', title: 'Rules saved', desc: 'Confirmed (MOCK).' }); },
    deposit: (n) => act((s) => ({ ...s, balance: s.balance + n })),
    withdraw: (n) => act((s) => ({ ...s, balance: Math.max(0, s.balance - n) })),
    addAllowed: (item) => act((s) => ({ ...s, allowlist: [...s.allowlist, item] })),
    removeAllowed: (addr) => act((s) => ({ ...s, allowlist: s.allowlist.filter((x) => x.address !== addr) })),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVault() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useVault must be used inside VaultProvider');
  return v;
}
