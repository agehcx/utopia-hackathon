'use client';

import { useState } from 'react';

export default function FeeCalc() {
  const [volume, setVolume] = useState(10000);
  const [bps, setBps] = useState(2);
  const [plan, setPlan] = useState('usage');
  const fee = plan === 'free' ? 0 : (volume * bps) / 10000;
  return (
    <div className="card">
      <div className="flex gap-1 rounded-full bg-paper p-1" role="group" aria-label="Plan (mock toggle)">
        {[['free', 'Free core'], ['usage', 'Usage fee']].map(([id, l]) => (
          <button key={id} aria-pressed={plan === id} onClick={() => setPlan(id)} className={`min-h-11 flex-1 rounded-full text-sm ${plan === id ? 'bg-ink text-surface' : ''}`}>{l}</button>
        ))}
      </div>
      <label className="mt-5 grid gap-1 text-sm" htmlFor="fc-v">Monthly executed volume ($)
        <input id="fc-v" className="field" inputMode="numeric" value={volume} onChange={(e) => setVolume(Math.max(0, Number(e.target.value.replace(/\D/g, '')) || 0))} />
      </label>
      <label className="mt-4 grid gap-1 text-sm" htmlFor="fc-b">Fee: <span className="font-mono">{bps} bps</span>
        <input id="fc-b" type="range" min={1} max={5} value={bps} className="h-11" onChange={(e) => setBps(Number(e.target.value))} disabled={plan === 'free'} />
      </label>
      <div className="mt-4 rounded-2xl bg-paper p-4">
        <div className="text-xs text-mute">Monthly fee</div>
        <div className="text-3xl font-light">${fee.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
        <div className="mt-1 font-mono text-xs text-mute">
          {plan === 'free' ? 'Free core: $0' : `${volume.toLocaleString('en-US')} × ${bps} / 10,000 = ${fee.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
        </div>
      </div>
      <p className="mt-3 text-xs text-mute">Illustration only. No billing exists. Venue fees and gas are separate and not included.</p>
    </div>
  );
}
