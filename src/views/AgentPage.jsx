'use client';

import { useEffect, useRef, useState } from 'react';
import { useVault } from '../store/useVaultStore';
import { labelFor, REASON_TEXT } from '../lib/rules';
import { Card, Empty, Pill, SegBar } from '../components/ui';

const EXAMPLES = ['Pay 1.5 to Data service', 'Pay 4 to Research API', 'Send 15 to 0x000000000000000000000000000000000000dEaD'];

function ActionPreview({ r, allowlist }) {
  const note = r.tier === 'AUTO' ? 'Within your rules. Paid instantly.' : REASON_TEXT[r.code];
  return (
    <div className="rounded-2xl bg-paper p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{r.amount} tUSDC → {labelFor(r.to, allowlist)}</span>
        <Pill tone={r.tier} />
      </div>
      <p className="mt-1 text-xs text-mute">{note}</p>
    </div>
  );
}

export default function AgentPage() {
  const { chat, thinking, runInstruction, demoAttack, connected, policy, spentToday, requests, allowlist, approve, reject } = useVault();
  const [text, setText] = useState('');
  const endRef = useRef(null);
  const pending = requests.filter((r) => r.status === 'PENDING');
  const left = Math.max(0, policy.daily - spentToday);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [chat.length, thinking]);

  const send = (msg) => {
    if (!msg.trim() || thinking) return;
    setText('');
    runInstruction(msg);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-mute">The AI proposes. It never signs and never holds your funds.</p>
        <h1 className="mt-1 text-5xl font-normal tracking-tight sm:text-6xl">Agent</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card title="AI assistant" action={<Pill tone="mock">Mock LLM</Pill>} className="flex min-h-[520px] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {chat.length === 0 && !thinking && (
              <Empty title="Tell the agent what to pay" desc="Try an example below. Each proposed payment gets a predicted tier before the vault decides." />
            )}
            {chat.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="ml-auto max-w-[85%] rounded-3xl rounded-br-lg bg-ink px-4 py-3 text-sm text-white">{m.text}</div>
              ) : (
                <div key={i} className="max-w-[92%] space-y-2">
                  <p className="text-sm text-ink/80">{m.text}</p>
                  {m.results.map((r, j) => <ActionPreview key={j} r={r} allowlist={allowlist} />)}
                </div>
              ),
            )}
            {thinking && <p className="text-sm text-mute">Agent is thinking…</p>}
            <div ref={endRef} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((x) => (
              <button key={x} className="rounded-full bg-paper px-3 py-1.5 text-xs text-ink/70 hover:bg-black/5" onClick={() => setText(x)}>
                {x.length > 34 ? `${x.slice(0, 32)}…` : x}
              </button>
            ))}
          </div>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(text); }}>
            <input className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter your request, e.g. Pay 1.5 to Data service" aria-label="Instruction for the agent" />
            <button className="btn btn-ink" disabled={!connected || thinking || !text.trim()} type="submit">Send</button>
          </form>
          {!connected && <p className="mt-2 text-xs text-mute">Connect a wallet to send instructions.</p>}
        </Card>

        <div className="space-y-4">
          <Card title="Budget left today">
            <div className="text-4xl font-light tracking-tight">{left.toFixed(2)} <span className="text-sm text-mute">of {policy.daily} tUSDC</span></div>
            <div className="mt-4"><SegBar black={policy.daily ? (spentToday / policy.daily) * 100 : 0} brand={0} /></div>
            <p className="mt-3 text-xs text-mute">Per payment up to {policy.perTx} tUSDC.</p>
          </Card>

          <Card title={`Needs your approval (${pending.length})`}>
            {pending.length === 0 ? (
              <Empty title="All clear" desc="Payments over your limits will wait here for your signature." />
            ) : (
              <ul className="space-y-2">
                {pending.map((r) => (
                  <li key={r.id} className="rounded-2xl bg-paper p-3.5">
                    <div className="text-sm font-medium">{r.amount} tUSDC → {labelFor(r.to, allowlist)}</div>
                    <p className="text-xs text-mute">{r.reason}</p>
                    <div className="mt-3 flex gap-2">
                      <button className="btn btn-brand !py-1.5" disabled={!connected} onClick={() => approve(r.id)}>Approve in wallet</button>
                      <button className="btn btn-ghost !py-1.5" disabled={!connected} onClick={() => reject(r.id)}>Reject</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Prove the guardrails">
            <p className="text-sm text-ink/70">Make the agent try to send 15 tUSDC to a stranger. The vault should refuse and record it.</p>
            <button className="btn btn-danger mt-4" disabled={!connected || thinking} onClick={demoAttack}>Run demo attack</button>
          </Card>
        </div>
      </div>
    </div>
  );
}
