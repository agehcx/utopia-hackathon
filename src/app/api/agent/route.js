// The agent key lives only here (server env). It can only sign fixed presets, and only call propose.
import { createWalletClient, decodeEventLog, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ADDR, CHAIN, OUTCOME, PRESETS, REASON, VAULT_ABI } from '../../../lib/chain/vault';
import { publicClient } from '../../../lib/chain/server';

const MIN_GAP_MS = 4000;
let last = 0; // ponytail: per-instance rate limit; fine for a local/single-instance demo

export async function POST(request) {
  const key = process.env.AGENT_PRIVATE_KEY;
  if (!key) return Response.json({ ok: false, data: null, error: 'Live agent disabled: AGENT_PRIVATE_KEY not set on the server.' }, { status: 503 });
  let body;
  try { body = await request.json(); } catch { body = {}; }
  const preset = PRESETS[body?.preset];
  if (!preset) return Response.json({ ok: false, data: null, error: 'Unknown preset.' }, { status: 400 });
  if (Date.now() - last < MIN_GAP_MS) return Response.json({ ok: false, data: null, error: 'Slow down: one agent proposal every few seconds.' }, { status: 429 });
  last = Date.now();

  try {
    const account = privateKeyToAccount(key);
    const wallet = createWalletClient({ account, chain: CHAIN, transport: http() });
    const hash = await wallet.writeContract({ address: ADDR.vault, abi: VAULT_ABI, functionName: 'propose', args: [ADDR.usdc, preset.to, preset.amount] });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const decided = receipt.logs
      .map((l) => { try { return decodeEventLog({ abi: VAULT_ABI, data: l.data, topics: l.topics }); } catch { return null; } })
      .find((e) => e?.eventName === 'Decided');
    return Response.json({
      ok: true,
      data: { hash, status: receipt.status, outcome: decided ? OUTCOME[decided.args.outcome] : null, reason: decided ? REASON[decided.args.reason] : null },
      error: null,
    });
  } catch (e) {
    console.error('agent propose failed', e);
    return Response.json({ ok: false, data: null, error: e.shortMessage || 'Proposal transaction failed.' }, { status: 500 });
  }
}
