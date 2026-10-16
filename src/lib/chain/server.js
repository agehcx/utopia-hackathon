// Server-only chain reads. Events come from Routescan because the public Fuji RPC caps getLogs at 100 blocks.
import 'server-only';
import { createPublicClient, decodeEventLog, http } from 'viem';
import { ADDR, CHAIN, DEPLOY_BLOCK, ERC20_ABI, OUTCOME, REASON, REQUEST_STATUS, VAULT_ABI } from './vault';

export const publicClient = createPublicClient({ chain: CHAIN, transport: http() });
const LOGS_API = 'https://api.routescan.io/v2/network/testnet/evm/43113/etherscan/api';

const read = (functionName, args = []) => publicClient.readContract({ address: ADDR.vault, abi: VAULT_ABI, functionName, args });
const s = (v) => (typeof v === 'bigint' ? v.toString() : v);

export async function readState() {
  const now = Math.floor(Date.now() / 1000);
  const [frozen, agent, policy, limits, blockCount, requestCount, vaultUsdc, vaultAvax, agentAvax, spentToday] = await Promise.all([
    read('frozen'), read('agent'), read('policy'), read('limits', [ADDR.usdc]), read('blockCount'), read('requestCount'),
    publicClient.readContract({ address: ADDR.usdc, abi: ERC20_ABI, functionName: 'balanceOf', args: [ADDR.vault] }),
    publicClient.getBalance({ address: ADDR.vault }),
    publicClient.getBalance({ address: ADDR.agent }),
    read('spent', [ADDR.usdc, BigInt(Math.floor(now / 86400))]),
  ]);
  const ids = Array.from({ length: Number(requestCount) }, (_, i) => i);
  const reqs = await Promise.all(ids.map((i) => read('requests', [BigInt(i)])));
  return {
    now, frozen, agent,
    policy: { expiry: s(policy[0]), breakerThreshold: policy[1], breakerWindow: policy[2], version: policy[3] },
    limits: { perTx: s(limits[0]), daily: s(limits[1]) },
    blockCount: s(blockCount), spentToday: s(spentToday),
    balances: { vaultUsdc: s(vaultUsdc), vaultAvax: s(vaultAvax), agentAvax: s(agentAvax) },
    requests: reqs.map((r, i) => ({ index: i, token: r[0], to: r[1], amount: s(r[2]), status: REQUEST_STATUS[r[3]] })),
  };
}

export async function readEvents() {
  const url = `${LOGS_API}?module=logs&action=getLogs&address=${ADDR.vault}&fromBlock=${DEPLOY_BLOCK}&toBlock=latest`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Explorer API ${res.status}`);
  const body = await res.json();
  if (!Array.isArray(body.result)) return [];
  return body.result.map((l) => {
    let ev;
    try { ev = decodeEventLog({ abi: VAULT_ABI, data: l.data, topics: l.topics }); } catch { return null; }
    const args = Object.fromEntries(Object.entries(ev.args).map(([k, v]) => [k, s(v)]));
    if (ev.eventName === 'Decided') { args.outcome = OUTCOME[Number(args.outcome)]; args.reason = REASON[Number(args.reason)]; }
    return { name: ev.eventName, args, tx: l.transactionHash, block: Number(l.blockNumber), ts: Number(l.timeStamp), logIndex: Number(l.logIndex) };
  }).filter(Boolean).reverse();
}
