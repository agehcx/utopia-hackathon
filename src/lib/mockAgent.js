// MOCK LLM. A real model plugs in at POST /api/agent and returns the same shape:
// { actions: [{ to, amount, reason }], explanation }. It only PROPOSES; it never executes.

const ADDR = /0x[0-9a-fA-F]{40}/;
const AMOUNT = /(\d+(?:\.\d+)?)/;

export function interpret(text, allowlist) {
  const parts = text.split(/\band\b|;|\bthen\b/i).map((p) => p.trim()).filter(Boolean);
  const actions = [];
  for (const part of parts) {
    const amt = part.match(AMOUNT);
    if (!amt) continue;
    const amount = Number(amt[1]);
    if (!(amount > 0)) continue;
    const addr = part.match(ADDR)?.[0];
    const byLabel = allowlist.find((x) => part.toLowerCase().includes(x.label.toLowerCase()));
    const to = addr || byLabel?.address || allowlist[0]?.address;
    if (!to) continue;
    actions.push({ to, amount, reason: part.slice(0, 80) });
  }
  const explanation = actions.length
    ? `I turned your request into ${actions.length} proposed payment${actions.length > 1 ? 's' : ''}. I can only propose: the vault decides whether each one moves.`
    : "I couldn't find an amount to pay. Try something like “Pay 1.5 to Data service”.";
  return { actions, explanation };
}
