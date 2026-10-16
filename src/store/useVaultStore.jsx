'use client';

// MockAdapter: in-memory engine state, persisted to localStorage, resettable.
// ponytail: no ChainAdapter yet; the demo never touches the network.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as E from '../lib/engine';
import { initialState, runStep, SCENARIOS } from '../lib/scenarios';

const KEY = 'bounded-demo-v1';
const Ctx = createContext(null);
const SPEEDS = { slow: 2400, normal: 1400, fast: 600 };

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function VaultProvider({ children }) {
  const [state, setState] = useState(initialState); // seed renders on the server; storage loads after mount
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [run, setRun] = useState(null); // { name, index, auto }
  const [flight, setFlight] = useState(null); // { decision, stage: 0..2 }
  const [speed, setSpeed] = useState('normal');
  const [live, setLive] = useState('');
  const ref = useRef(state);

  useEffect(() => {
    const saved = load();
    if (saved) { ref.current = saved; setState(saved); } // eslint-disable-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  const commit = useCallback((next) => {
    ref.current = next;
    setState(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage full or blocked: demo still works in memory */ }
  }, []);

  const toast = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((p) => [...p, { ...t, id }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3500);
  }, []);

  const animate = useCallback((decision) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const step = SPEEDS[speed] / 3;
    setFlight({ decision, stage: reduced ? 2 : 0 });
    if (!reduced) {
      setTimeout(() => setFlight((f) => (f?.decision === decision ? { ...f, stage: 1 } : f)), step);
      setTimeout(() => setFlight((f) => (f?.decision === decision ? { ...f, stage: 2 } : f)), step * 2);
    }
    const p = decision.proposal;
    setLive(`Proposal ${p.id}: ${decision.tier}${decision.reason !== 'NONE' ? `, ${decision.reason}` : ''}.`);
  }, [speed]);

  const apply = useCallback((out) => {
    if (out.error) { toast({ tone: 'bad', title: 'Not done', desc: out.error }); return false; }
    commit(out.state);
    if (out.decision) animate(out.decision);
    return true;
  }, [commit, toast, animate]);

  const runRef = useRef(null);
  const setRunBoth = useCallback((r) => { runRef.current = r; setRun(r); }, []);

  const stepScenario = useCallback(() => {
    const r = runRef.current;
    if (!r) return;
    const steps = SCENARIOS[r.name];
    const step = steps[r.index];
    const out = runStep(ref.current, step);
    apply(out);
    if (step.approveLast && !out.error) setLive('You approved the pending payment. Executed.');
    setRunBoth(r.index + 1 >= steps.length ? null : { ...r, index: r.index + 1 });
  }, [apply, setRunBoth]);

  useEffect(() => {
    if (!run?.auto) return undefined;
    const t = setTimeout(stepScenario, SPEEDS[speed]);
    return () => clearTimeout(t);
  }, [run, speed, stepScenario]);

  // Engine calls return either a new state or { state, error?, decision? }.
  const act = useCallback((fn, okToast) => {
    const out = fn(ref.current);
    const ok = out.events ? (commit(out), true) : apply(out);
    if (ok && okToast) toast(okToast);
    return ok;
  }, [commit, apply, toast]);

  const value = {
    state, hydrated, toasts, run, flight, speed, live,
    setSpeed,
    startScenario: (name, auto) => { setFlight(null); setRunBoth({ name, index: 0, auto }); },
    stepScenario,
    stopScenario: () => setRunBoth(null),
    propose: (v) => act((s) => E.propose(s, v)),
    approve: (id) => act((s) => E.approve(s, id), { title: 'Approved', desc: 'Executed (simulated).' }),
    reject: (id) => act((s) => E.reject(s, id)),
    advance: (ms) => act((s) => E.advance(s, ms)),
    freeze: () => act(E.freeze, { title: 'Agent frozen' }),
    unfreeze: () => act(E.unfreeze, { title: 'Agent unfrozen' }),
    revoke: () => act(E.revoke, { title: 'Agent key revoked' }),
    restore: () => act(E.restore, { title: 'Agent key restored' }),
    withdraw: (token, amount) => act((s) => E.withdraw(s, token, amount), { title: 'Withdrawn', desc: 'Simulated withdrawal.' }),
    setPolicy: (p) => act((s) => E.setPolicy(s, p), { title: 'Rules saved' }),
    reset: () => { setRunBoth(null); setFlight(null); setLive('Demo reset.'); commit(initialState()); },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVault() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useVault must be used inside VaultProvider');
  return v;
}
