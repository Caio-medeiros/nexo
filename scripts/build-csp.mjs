#!/usr/bin/env node
/**
 * NEXO — gera os sha256 dos <script> inline de todas as páginas deployadas,
 * para o script-src da CSP (netlify.toml) poder largar 'unsafe-inline'.
 *
 *   node scripts/build-csp.mjs           # imprime os hashes
 *   node scripts/build-csp.mjs --check   # falha (CI) se netlify.toml não
 *                                         # contém exatamente estes hashes
 *
 * PORQUÊ hashes e não externalizar: o portal tem a lógica de cada página num
 * <script> inline grande e editado com frequência; movê-los para ficheiros em
 * bloco arriscava regressões numa ferramenta viva. O hash deixa o código onde
 * está (zero mudança de comportamento) e a CSP só permite ESSE conteúdo exato.
 * Contrapartida: editar um inline exige re-correr isto — o --check no CI apanha.
 * Handlers on*= inline NÃO são cobertos por hash: foram convertidos p/ JS.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const EXCLUDE = /node_modules|\.git|graphify-out|tests|scratch|design|coverage|\.wrangler/;
function walk(d, out = []) {
  for (const n of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, n.name);
    if (EXCLUDE.test(p)) continue;
    if (n.isDirectory()) walk(p, out);
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
}

const hashes = new Map(); // hash -> [files]
for (const f of walk(ROOT)) {
  const s = readFileSync(f, 'utf8');
  for (const m of s.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const body = m[2];
    if (!body.trim()) continue; // <script> vazio
    const h = 'sha256-' + createHash('sha256').update(body, 'utf8').digest('base64');
    if (!hashes.has(h)) hashes.set(h, []);
    hashes.get(h).push(relative(ROOT, f));
  }
}

const list = [...hashes.keys()].sort();
const CHECK = process.argv.includes('--check');
if (CHECK) {
  const toml = readFileSync(join(ROOT, 'netlify.toml'), 'utf8');
  let fail = false;
  // 1. script-src não pode ter 'unsafe-inline'/'unsafe-eval'
  const scriptSrc = (toml.match(/script-src[^;]*/) || [''])[0];
  if (/'unsafe-inline'|'unsafe-eval'/.test(scriptSrc)) {
    console.error("✗ script-src tem 'unsafe-inline'/'unsafe-eval' — a CSP não trava XSS inline.");
    fail = true;
  }
  // 2. todos os hashes dos inline atuais têm de estar na CSP
  const missing = list.filter(h => !toml.includes(`'${h}'`));
  if (missing.length) {
    console.error(`✗ netlify.toml não tem ${missing.length} hash(es) de scripts inline:`);
    missing.forEach(h => console.error(`   '${h}'  (${hashes.get(h).join(', ')})`));
    console.error('   Corre: node scripts/build-csp.mjs  e cola no script-src.');
    fail = true;
  }
  // 3. nenhum handler on*= inline (seria bloqueado pela CSP sem unsafe-inline)
  const handlerRe = /\son(click|load|change|input|submit|error|keydown|keyup|focus|blur|scroll|mouseover|mouseenter|mouseleave|touchstart|touchend)\s*=\s*["']/gi;
  for (const f of walk(ROOT)) {
    const hits = readFileSync(f, 'utf8').match(handlerRe);
    if (hits) { console.error(`✗ handler on*= inline em ${relative(ROOT, f)}: ${hits.length} (converte p/ addEventListener)`); fail = true; }
  }
  if (fail) process.exit(1);
  console.log(`✓ CSP ok: ${list.length} hashes inline, sem unsafe-inline, sem handlers on*=.`);
  process.exit(0);
}
console.log(`# ${list.length} hashes únicos (${[...hashes.values()].reduce((a,b)=>a+b.length,0)} blocos inline)`);
for (const h of list) console.log(`'${h}'  # ${hashes.get(h).slice(0,2).join(', ')}${hashes.get(h).length>2?' …':''}`);
