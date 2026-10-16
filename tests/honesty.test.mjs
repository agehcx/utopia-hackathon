// Honesty rules as a failing test: banned claims must not appear in site source or README.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BANNED = [
  /100% safe/i, /fully protected/i, /principal is safe/i, /\d+x cheaper/i, /fraction of a penny/i, /sub-penny/i,
  /market validation/i, /hyperliquid-grade/i, /nobody has/i, /no one does/i, /1M traders/i, /traderjoe/i,
  /x402 integration/i, /169M/i, /because of playbook/i,
];

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : /\.(js|jsx|md|css)$/.test(f) ? [p] : [];
});

test('no banned phrase in src or README', () => {
  const hits = [];
  for (const file of [...walk('src'), 'README.md']) {
    const text = readFileSync(file, 'utf8');
    for (const re of BANNED) if (re.test(text)) hits.push(`${file}: ${re}`);
  }
  assert.deepEqual(hits, []);
});

test('Bitget user number always carries company-reported', () => {
  for (const file of walk('src')) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (/1M\+? users/.test(line)) assert.match(line, /company-reported/, `${file}: ${line.trim().slice(0, 80)}`);
    }
  }
});
