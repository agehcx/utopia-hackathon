export const TIER = { AUTO: 'AUTO', ASK: 'ASK', BLOCKED: 'BLOCKED' };

export const REASON_TEXT = {
  FROZEN: 'The agent is frozen, so it cannot move anything.',
  REVOKED: 'The agent key was revoked.',
  EXPIRED: "The agent's permission has expired.",
  NOT_ALLOWLISTED: "That recipient isn't on your allowlist.",
  OVER_LIMIT: 'Over your per-payment or daily limit, so it needs your approval.',
  INSUFFICIENT_BALANCE: "The vault doesn't hold enough tUSDC.",
  OWNER: 'You froze the agent.',
};

export const shortAddr = (a) => (a && a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a || '');

export const labelFor = (addr, allowlist) =>
  allowlist.find((x) => x.address.toLowerCase() === (addr || '').toLowerCase())?.label || shortAddr(addr);

// PREVIEW ONLY. The BoundedVault contract is the real gatekeeper; this mirrors its
// evaluation order so the UI can show a predicted tier before anything is submitted.
export function evaluate(action, s, now = Date.now()) {
  const { policy } = s;
  if (policy.revoked) return { tier: TIER.BLOCKED, code: 'REVOKED' };
  if (policy.frozen) return { tier: TIER.BLOCKED, code: 'FROZEN' };
  if (now > policy.expiresAt) return { tier: TIER.BLOCKED, code: 'EXPIRED' };
  const listed = s.allowlist.some((x) => x.address.toLowerCase() === action.to.toLowerCase());
  if (!listed) return { tier: TIER.BLOCKED, code: 'NOT_ALLOWLISTED' };
  if (action.amount > policy.perTx || s.spentToday + action.amount > policy.daily) {
    return { tier: TIER.ASK, code: 'OVER_LIMIT' };
  }
  if (s.balance < action.amount) return { tier: TIER.BLOCKED, code: 'INSUFFICIENT_BALANCE' };
  return { tier: TIER.AUTO, code: null };
}
