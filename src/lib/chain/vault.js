// Shared (client + server) contract description for the deployed Fuji vault.
import { parseAbi } from 'viem';
import { avalancheFuji } from 'viem/chains';
import deployments from '../../config/deployments.json';

export const CHAIN = avalancheFuji;
export const ADDR = deployments;
export const DEPLOY_BLOCK = 59535403;
export const EXPLORER = 'https://testnet.snowtrace.io';
export const OUTCOME = ['AUTO', 'PENDING', 'BLOCKED'];
export const REASON = ['NONE', 'FROZEN', 'EXPIRED', 'NOT_ALLOWLISTED', 'OVER_LIMIT', 'INSUFFICIENT_BALANCE'];
export const REQUEST_STATUS = ['PENDING', 'APPROVED', 'REJECTED'];

export const VAULT_ABI = parseAbi([
  'function propose(address token, address to, uint256 amount) returns (uint8)',
  'function approve(uint256 id)',
  'function reject(uint256 id)',
  'function freeze()',
  'function unfreeze()',
  'function withdraw(address token, uint256 amount)',
  'function setPolicy((uint64 expiry, uint8 breakerThreshold, uint32 breakerWindow, uint32 version) p, address[] list)',
  'function setLimits(address token, uint256 perTx, uint256 daily)',
  'function agent() view returns (address)',
  'function owner() view returns (address)',
  'function frozen() view returns (bool)',
  'function policy() view returns (uint64 expiry, uint8 breakerThreshold, uint32 breakerWindow, uint32 version)',
  'function limits(address) view returns (uint256 perTx, uint256 daily)',
  'function spent(address, uint256) view returns (uint256)',
  'function blockCount() view returns (uint256)',
  'function nextId() view returns (uint256)',
  'function requestCount() view returns (uint256)',
  'function requests(uint256) view returns (address token, address to, uint256 amount, uint8 status)',
  'function isAllowed(address) view returns (bool)',
  'event Proposed(uint256 indexed id, address token, address to, uint256 amount, uint32 policyVersion)',
  'event Decided(uint256 indexed id, uint8 outcome, uint8 reason)',
  'event Approved(uint256 indexed id)',
  'event Rejected(uint256 indexed id)',
  'event AgentFrozen(uint32 blockCount, uint32 window)',
  'event AgentUnfrozen()',
  'event PolicyUpdated(uint32 version, bytes32 policyHash)',
  'event LimitsUpdated(address indexed token, uint256 perTx, uint256 daily)',
  'event AgentSet(address indexed agent)',
  'event AgentRevoked(address indexed agent)',
  'event Deposited(address indexed token, uint256 amount)',
  'event Withdrawn(address indexed token, uint256 amount)',
]);

export const ERC20_ABI = parseAbi(['function balanceOf(address) view returns (uint256)']);

// Fixed agent actions for the live demo. The server only signs these, never free input.
export const PRESETS = {
  pay: { label: 'Pay 1 tUSDC to the data service', to: ADDR.dataService, amount: 1_000_000n },
  over: { label: 'Pay 5 tUSDC to the data service (over limit)', to: ADDR.dataService, amount: 5_000_000n },
  attack: { label: 'Send 1 tUSDC to 0x…dEaD (attack)', to: '0x000000000000000000000000000000000000dEaD', amount: 1_000_000n },
};
