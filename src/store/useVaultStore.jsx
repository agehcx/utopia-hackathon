'use client';

import { useState, useCallback, useRef, createContext, useContext } from 'react';

const VaultContext = createContext(null);

const INITIAL_EVENTS = [
  { id: 'e1', type: 'PAYMENT', amount: 0.05, to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', timestamp: Date.now() - 3600000 * 5, hash: '0xmock_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', classification: 'AUTO' },
  { id: 'e2', type: 'UPDATE',  timestamp: Date.now() - 3600000 * 3, hash: '0xmock_b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3', classification: 'AUTO' },
  { id: 'e3', type: 'PAYMENT', amount: 0.12, to: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', timestamp: Date.now() - 3600000 * 1, hash: '0xmock_c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', classification: 'NEEDS_APPROVAL' },
  { id: 'e4', type: 'BLOCK',   timestamp: Date.now() - 1800000, hash: '0xmock_d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5', classification: 'BLOCKED' },
];

function makeMockHash() {
  const rand = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return '0xmock_' + rand;
}

function confirmationDelay() {
  return new Promise(r => setTimeout(r, 1200));
}

export function VaultProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance]         = useState(2.847);
  const [policy, setPolicy]           = useState({
    perTxLimit:    0.1,
    dailyLimit:    0.5,
    dailySpent:    0.17,
    isPaused:      false,
    agentRevoked:  false,
  });
  const [allowlist, setAllowlist] = useState([
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
    '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  ]);
  const [events, setEvents]   = useState(INITIAL_EVENTS);
  const [toasts, setToasts]   = useState([]);
  const toastIdRef            = useRef(0);
  const inFlightRef           = useRef(0);

  const policyRef    = useRef(policy);
  const balanceRef   = useRef(balance);
  const allowlistRef = useRef(allowlist);
  policyRef.current    = policy;
  balanceRef.current   = balance;
  allowlistRef.current = allowlist;

  const addToast = useCallback((toast) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const updateToast = useCallback((id, updates) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const connectWallet = useCallback(() => {
    setIsConnected(prev => !prev);
  }, []);

  const updatePolicy = useCallback(async (newPolicy) => {
    const toastId = addToast({
      type:  'pending',
      title: 'Transaction Pending',
      desc:  'Updating policy on-chain…',
    });

    await confirmationDelay();

    setPolicy(prev => ({ ...prev, ...newPolicy }));
    setEvents(prev => [{
      id:             'ev_' + Date.now(),
      type:           'UPDATE',
      timestamp:      Date.now(),
      hash:           makeMockHash(),
      classification: 'AUTO',
    }, ...prev]);

    updateToast(toastId, {
      type:  'confirmed',
      title: 'Policy Updated',
      desc:  'Changes confirmed on-chain.',
    });
  }, [addToast, updateToast]);

  const classifyAction = useCallback((action, currentPolicy) => {
    if (currentPolicy.isPaused || currentPolicy.agentRevoked) return 'BLOCKED';
    if (action.type === 'PAYMENT') {
      if (action.amount > currentPolicy.perTxLimit) return 'NEEDS_APPROVAL';
      if (currentPolicy.dailySpent + action.amount > currentPolicy.dailyLimit) return 'NEEDS_APPROVAL';
    }
    return 'AUTO';
  }, []);

  const simulateTransaction = useCallback(async (action) => {
    if (action.type !== 'PAYMENT') {
      const toastId = addToast({
        type:  'pending',
        title: 'Transaction Pending',
        desc:  'Processing rejection…',
      });
      await confirmationDelay();
      setEvents(prev => [{
        id:             'ev_' + Date.now(),
        type:           'BLOCK',
        timestamp:      Date.now(),
        hash:           makeMockHash(),
        classification: 'BLOCKED',
      }, ...prev]);
      updateToast(toastId, {
        type:  'error',
        title: 'Action Blocked',
        desc:  'Transaction was blocked by policy.',
      });
      return { success: false, reason: 'blocked' };
    }

    const amount = action.amount;
    if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0) {
      addToast({ type: 'error', title: 'Invalid Amount', desc: 'Amount must be a positive number.' });
      return { success: false, reason: 'invalid_amount' };
    }

    const snap = policyRef.current;
    const wl   = allowlistRef.current;

    if (snap.isPaused) {
      addToast({ type: 'error', title: 'Agent Paused', desc: 'Resume the agent before sending transactions.' });
      return { success: false, reason: 'agent_paused' };
    }

    if (snap.agentRevoked) {
      addToast({ type: 'error', title: 'Agent Revoked', desc: 'Restore agent access before sending transactions.' });
      return { success: false, reason: 'agent_revoked' };
    }

    if (amount > snap.perTxLimit && action.classification === 'AUTO') {
      const toastId = addToast({
        type:  'pending',
        title: 'Transaction Pending',
        desc:  `Blocking: ${amount} ETH exceeds per-tx limit.`,
      });
      await confirmationDelay();
      setEvents(prev => [{
        id:             'ev_' + Date.now(),
        type:           'BLOCK',
        timestamp:      Date.now(),
        hash:           makeMockHash(),
        classification: 'BLOCKED',
        amount,
        to:             action.to,
        reason:         'exceeds_per_tx_limit',
      }, ...prev]);
      updateToast(toastId, {
        type:  'error',
        title: 'Transaction Blocked',
        desc:  `${amount} ETH exceeds per-tx limit.`,
      });
      return { success: false, reason: 'exceeds_per_tx_limit' };
    }

    const projectedSpent = snap.dailySpent + inFlightRef.current + amount;
    if (projectedSpent > snap.dailyLimit) {
      const toastId = addToast({
        type:  'pending',
        title: 'Transaction Pending',
        desc:  'Blocking: would exceed daily limit.',
      });
      await confirmationDelay();
      setEvents(prev => [{
        id:             'ev_' + Date.now(),
        type:           'BLOCK',
        timestamp:      Date.now(),
        hash:           makeMockHash(),
        classification: 'BLOCKED',
        amount,
        to:             action.to,
        reason:         'exceeds_daily_limit',
      }, ...prev]);
      updateToast(toastId, {
        type:  'error',
        title: 'Transaction Blocked',
        desc:  `Would exceed daily limit of ${snap.dailyLimit} ETH.`,
      });
      return { success: false, reason: 'exceeds_daily_limit' };
    }

    inFlightRef.current += amount;
    const toastId = addToast({
      type:  'pending',
      title: 'Transaction Pending',
      desc:  `Sending ${amount} ETH…`,
    });

    await confirmationDelay();

    setBalance(prev => parseFloat(Math.max(0, prev - amount).toFixed(6)));
    setPolicy(prev => ({
      ...prev,
      dailySpent: parseFloat((prev.dailySpent + amount).toFixed(6)),
    }));
    setEvents(prev => [{
      id:             'ev_' + Date.now(),
      type:           'PAYMENT',
      amount,
      to:             action.to || '0x0000000000000000000000000000000000000000',
      timestamp:      Date.now(),
      hash:           makeMockHash(),
      classification: action.classification || 'AUTO',
    }, ...prev]);

    inFlightRef.current = Math.max(0, inFlightRef.current - amount);

    updateToast(toastId, {
      type:  'confirmed',
      title: 'Payment Confirmed',
      desc:  `Sent ${amount} ETH successfully.`,
    });

    return { success: true };
  }, [addToast, updateToast]);

  const addToAllowlist = useCallback((addr) => {
    setAllowlist(prev => prev.includes(addr) ? prev : [...prev, addr]);
  }, []);

  const removeFromAllowlist = useCallback((addr) => {
    setAllowlist(prev => prev.filter(a => a !== addr));
  }, []);

  const value = {
    isConnected, balance, policy, allowlist, events, toasts,
    connectWallet,
    updatePolicy,
    simulateTransaction,
    addToAllowlist,
    removeFromAllowlist,
    classifyAction,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVaultStore() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVaultStore must be used within VaultProvider');
  return ctx;
}
