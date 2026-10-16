// Working name, unverified for availability. Rename here only.
export const BRAND = 'Bounded';
export const DISCLAIMER = 'Testnet prototype. Not financial advice. Simulated components are labeled. Working name.';
export const HYPOTHESIS = 'Hypothesis — to be tested in the pilot.';
export const COMPARE_NOTE = 'Our assessment from public docs, not independent testing.';

export const SOURCES = {
  playbook: { label: 'Traders Union: Bitget launches AI trading Playbook', url: 'https://tradersunion.com/news/brokers-news/show/2560326-bitget-launches-ai-trading-playbook/' },
  bitgetUsers: { label: 'TechFlow: Bitget AI tools 1M+ users, $1.2B volume (company-reported)', url: 'https://www.techflowpost.com/en-US/newsletter/125681' },
  x402: { label: 'x402 Foundation (Coinbase docs)', url: 'https://docs.cdp.coinbase.com/x402/support/x402-foundation' },
  policyLayer: { label: 'PolicyLayer: x402 policy enforcement', url: 'https://policylayer.com/blog/x402-policy-enforcement-live' },
  builderCodes: { label: 'Privy: Hyperliquid builder codes', url: 'https://docs.privy.io/recipes/hyperliquid/builder-codes.md' },
};

export const TIER_COPY = {
  AUTO: 'Within your limits and sent to an approved destination. Executes instantly.',
  ASK: 'Valid destination, but over a limit. You approve or reject on your phone.',
  BLOCK: 'Breaks a rule. Nothing moves, and the reason is recorded.',
  FREEZE: 'Too many blocked attempts in a short window. The agent is frozen automatically.',
};

export const REASON_TEXT = {
  NONE: 'Within every rule.',
  FROZEN: 'The agent is frozen or revoked, so it cannot move anything.',
  EXPIRED: "The agent's permission has expired.",
  NOT_ALLOWLISTED: "That destination isn't on your allowlist.",
  OVER_PER_TX: 'Over your per-payment limit.',
  OVER_DAILY: 'Over your remaining daily limit.',
  OVER_VAULT_PCT: 'Over your max share of the vault per action.',
  INSUFFICIENT_BALANCE: "The vault doesn't hold enough tUSDC.",
};

export const MARKETING_NAV = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/compare', label: 'Compare' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/security', label: 'Security' },
  { href: '/roadmap', label: 'Roadmap' },
  { href: '/faq', label: 'FAQ' },
];
