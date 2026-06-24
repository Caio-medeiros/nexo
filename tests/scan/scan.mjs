#!/usr/bin/env node
/**
 * NEXO config scan — plain Node, zero dependencies.
 * Fails (exit 1) if deployed files contain unreplaced {{placeholders}},
 * the phantom test slug, or secret leaks.
 *
 *   node tests/scan/scan.mjs
 *
 * Adapted to reality:
 *  - The live client menu is `marisca-petisca`; the demo (`menu/demo/`) and the
 *    template (`menu/_template/`) legitimately keep {{placeholders}}, so they
 *    are excluded from the placeholder check (but NOT from the secret check).
 *  - The prompt's `rest-nexo-lisboa` slug does not exist anywhere and must not
 *    leak into deployed files.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const EXCLUDE_DIRS = new Set(['.git', 'node_modules', 'tests', 'dist', 'supabase', 'card', 'img', 'docs', 'scripts']);
const PLACEHOLDER_EXEMPT = ['menu/_template/', 'menu/demo/']; // template + demo keep {{...}}
const EXTS = ['.html', '.js', '.css', '.json', '.webmanifest'];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(ROOT, full);
    if (EXCLUDE_DIRS.has(name)) continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (EXTS.some((e) => name.endsWith(e))) files.push(rel);
  }
  return files;
}

const violations = [];
const files = walk(ROOT);

for (const rel of files) {
  const text = readFileSync(join(ROOT, rel), 'utf8');
  const exemptPlaceholder = PLACEHOLDER_EXEMPT.some((p) => rel.replace(/\\/g, '/').startsWith(p));

  // 1. Unreplaced {{placeholders}} — only as a real CONFIG VALUE in a per-client
  // config.js (e.g. `supabaseUrl: '{{SUPABASE_URL}}'`). This avoids false
  // positives on defensive code like `if (x !== '{{WHATSAPP_NUMBER}}')` and on
  // template instructions left in comments.
  if (rel.replace(/\\/g, '/').endsWith('config.js') && !exemptPlaceholder) {
    const m = text.match(/[:=]\s*['"`]\{\{[A-Z0-9_]+\}\}['"`]/);
    if (m) violations.push(`${rel}: unreplaced config value ${m[0].replace(/[:=]\s*/, '')}`);
  }

  // 2. Phantom test slug — must not appear in ANY deployed file
  if (text.includes('rest-nexo-lisboa')) {
    violations.push(`${rel}: phantom slug "rest-nexo-lisboa" (use a real slug like marisca-petisca)`);
  }

  // 3. Secret leaks — forbidden everywhere, including template/demo
  for (const secret of ['service_role', 'sk-ant-', 'SUPABASE_SERVICE_ROLE', 'VAPID_PRIVATE']) {
    if (text.includes(secret)) violations.push(`${rel}: possible secret leak "${secret}"`);
  }
}

console.log(`Scanned ${files.length} deployed files.`);
if (violations.length) {
  console.error(`\n✗ ${violations.length} issue(s) found:`);
  for (const v of violations) console.error('  - ' + v);
  process.exit(1);
}
console.log('✓ No placeholders, phantom slugs, or secret leaks in deployed files.');
process.exit(0);
