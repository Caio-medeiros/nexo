#!/usr/bin/env node
/**
 * NEXO unit tests — plain JavaScript, zero dependencies.
 * Tests the REAL shared library js/nexo-security.js (sanitise, validators,
 * rate limiting, safe error messages). Runs in Node via a tiny vm sandbox
 * that shims the browser globals the library expects.
 *
 *   node tests/unit/run.mjs        → console + writes tests/test-report.html
 *
 * NOTE (adapted): the prompt asked for safeCount()/safeSplitBill(), but those
 * came from a prompt that was NOT implemented — they don't exist in the
 * codebase. We test the real equivalents that DO ship in nexo-security.js.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

// ── Load nexo-security.js in a browser-ish sandbox ─────────────────────────
function makeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
  };
}
const sandbox = {
  window: { location: { hostname: 'localhost' } },
  localStorage: makeStorage(),
  sessionStorage: makeStorage(),
  document: { createElement: () => ({ textContent: '' }) },
  console,
  Date, Math, JSON, Object, Array, String, Number, parseInt, parseFloat, isNaN,
};
vm.createContext(sandbox);
vm.runInContext(readFileSync(join(ROOT, 'js', 'nexo-security.js'), 'utf8'), sandbox);
const NS = sandbox.window.NexoSecurity;

// ── Tiny test harness ──────────────────────────────────────────────────────
const results = [];
let suite = '';
function describe(name, fn) { suite = name; fn(); }
function it(name, fn) {
  const started = Date.now();
  try { fn(); results.push({ suite, name, ok: true, ms: Date.now() - started }); }
  catch (e) { results.push({ suite, name, ok: false, ms: Date.now() - started, err: e.message }); }
}
function eq(actual, expected, msg) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) throw new Error(msg || `expected ${e}, got ${a}`);
}
function ok(cond, msg) { if (!cond) throw new Error(msg || 'expected truthy'); }

// ── Tests ───────────────────────────────────────────────────────────────────
describe('NexoSecurity.sanitise', () => {
  it("strips <script> (no '<' remains)", () => ok(!NS.sanitise('<script>alert(1)</script>').includes('<')));
  it('passes normal text through', () => eq(NS.sanitise('Normal text'), 'Normal text'));
  it('empty string → empty', () => eq(NS.sanitise(''), ''));
  it('null → empty', () => eq(NS.sanitise(null), ''));
  it('undefined → empty', () => eq(NS.sanitise(undefined), ''));
  it('strips javascript: scheme', () => ok(!/javascript:/i.test(NS.sanitise('javascript:evil()'))));
  it('strips on* handlers', () => ok(!/onerror=/i.test(NS.sanitise('x onerror=alert(1)'))));
  it('enforces max length', () => eq(NS.sanitise('abcdef', 3).length, 3));
});

describe('NexoSecurity.validateTableNumber', () => {
  it('5 within 10 → valid', () => eq(NS.validateTableNumber(5, 10).valid, true));
  it('15 within 10 → invalid', () => eq(NS.validateTableNumber(15, 10).valid, false));
  it('0 → invalid', () => eq(NS.validateTableNumber(0, 10).valid, false));
  it("'abc' → invalid", () => eq(NS.validateTableNumber('abc', 10).valid, false));
  it('valid returns label', () => eq(NS.validateTableNumber(5, 10).label, 'Mesa 5'));
});

describe('NexoSecurity.validateOrderItems', () => {
  it('empty → invalid', () => eq(NS.validateOrderItems([]).valid, false));
  it('good items → valid', () => eq(NS.validateOrderItems([{ name: 'X', price: 10, qty: 1 }]).valid, true));
  it('bad price → invalid', () => eq(NS.validateOrderItems([{ name: 'X', price: -1, qty: 1 }]).valid, false));
  it('bad qty → invalid', () => eq(NS.validateOrderItems([{ name: 'X', price: 10, qty: 0 }]).valid, false));
  it('>50 items → invalid', () => eq(NS.validateOrderItems(Array.from({ length: 51 }, () => ({ name: 'X', price: 1, qty: 1 }))).valid, false));
});

describe('NexoSecurity.validatePhone', () => {
  it('9 digits → valid', () => eq(NS.validatePhone('912345678').valid, true));
  it('too short → invalid', () => eq(NS.validatePhone('12345').valid, false));
});

describe('NexoSecurity.getPublicErrorMessage', () => {
  it('never leaks PGRST internals', () => ok(!NS.getPublicErrorMessage({ message: 'PGRST116 ...' }).includes('PGRST')));
  it('maps 42501 → permission msg', () => ok(/permiss/i.test(NS.getPublicErrorMessage({ code: '42501' }))));
  it('keeps safe operational msg', () => eq(NS.getPublicErrorMessage(new Error('Aguarde 30s')), 'Aguarde 30s'));
});

describe('NexoSecurity.checkRateLimit', () => {
  it('staff_call blocks the 2nd within the window', () => {
    const sid = 'unit_' + Math.random();
    eq(NS.checkRateLimit('staff_call', sid).allowed, true);
    eq(NS.checkRateLimit('staff_call', sid).allowed, false);
  });
});

describe('NexoSecurity.getSessionId', () => {
  it('returns a non-empty string', () => ok(typeof NS.getSessionId() === 'string' && NS.getSessionId().length > 0));
  it('is stable within a session', () => eq(NS.getSessionId(), NS.getSessionId()));
});

// ── Report ───────────────────────────────────────────────────────────────────
const passed = results.filter((r) => r.ok).length;
const failed = results.length - passed;
for (const r of results) {
  console.log(`${r.ok ? '✓' : '✗'} ${r.suite} › ${r.name}${r.ok ? '' : '  — ' + r.err}`);
}
console.log(`\n${passed}/${results.length} passed, ${failed} failed`);

const rows = results.map((r) => `
  <tr class="${r.ok ? 'ok' : 'fail'}">
    <td>${r.ok ? '✅' : '❌'}</td><td>${r.suite}</td><td>${r.name}</td>
    <td>${r.ms}ms</td><td>${r.err ? r.err.replace(/</g, '&lt;') : ''}</td>
  </tr>`).join('');
writeFileSync(join(ROOT, 'tests', 'test-report.html'), `<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8">
<title>NEXO — Relatório de testes</title><style>
body{font-family:system-ui,sans-serif;background:#0A0A0A;color:#F0F0F0;padding:32px;max-width:900px;margin:0 auto}
h1{font-size:22px} .summary{font-size:15px;margin:8px 0 20px} .ok td{color:#9fe0a8} .fail td{color:#ff9b9b}
table{width:100%;border-collapse:collapse;font-size:13px} th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #222}
.pill{display:inline-block;padding:2px 10px;border-radius:999px;font-weight:700}
.green{background:rgba(34,197,94,.15);color:#22C55E} .red{background:rgba(239,68,68,.15);color:#EF4444}
</style></head><body>
<h1>NEXO — Relatório de testes unitários</h1>
<p class="summary"><span class="pill ${failed ? 'red' : 'green'}">${passed}/${results.length} passaram</span> · gerado ${new Date().toLocaleString('pt-PT')}</p>
<table><thead><tr><th></th><th>Suite</th><th>Teste</th><th>Tempo</th><th>Erro</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`);
console.log('Report: tests/test-report.html');

process.exit(failed ? 1 : 0);
