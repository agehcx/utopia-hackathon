// Paced live demo: press Enter to fire each real agent proposal on Fuji. Needs `npm run dev` running.
// Screen-record /app/live in the browser; do the owner steps (approve, unfreeze) there yourself.
import readline from 'node:readline/promises';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const STEPS = [
  ['pay', 'AUTO expected: pay 1 tUSDC to the data service.'],
  ['over', 'ASK expected: 5 tUSDC is over the limit. Now approve it in the Owner panel with your wallet.'],
  ['attack', 'BLOCK expected: send to 0x…dEaD. Nothing moves.'],
  ['attack', 'BLOCK again.'],
  ['attack', 'BLOCK again: breaker freezes the agent. Unfreeze it in the Owner panel afterwards.'],
];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
for (const [preset, note] of STEPS) {
  await rl.question(`\n[Enter] to fire "${preset}" — ${note}\n`);
  const r = await fetch(`${BASE}/api/agent`, { method: 'POST', body: JSON.stringify({ preset }) });
  const j = await r.json();
  console.log(j.ok ? `-> ${j.data.outcome} ${j.data.reason} https://testnet.snowtrace.io/tx/${j.data.hash}` : `-> failed: ${j.error}`);
}
rl.close();
