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

const EXCLUDE_DIRS = new Set(['.git', 'node_modules', 'tests', 'dist', 'supabase', 'card', 'img', 'docs', 'scripts', 'design', 'graphify-out']);
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

  // 4. Client-side auth gates — hashes de senha NUNCA podem viver em ficheiros
  // servidos ao browser (SHA-256 sem salt de senha curta quebra em segundos e
  // dá falsa confiança). A autorização é server-side: Supabase Auth + RLS/RPC.
  // 4a. Constante nomeada tipo SENHA_HASH / PASSWORD_HASH com valor hex.
  const namedHash = text.match(/(?:SENHA|PASSWORD|PASSWD|PWD)[A-Z_]*HASH\s*[:=]\s*['"`][0-9a-fA-F]{16,}['"`]/);
  if (namedHash) {
    violations.push(`${rel}: client-side auth hash "${namedHash[0].split(/\s*[:=]/)[0]}" (usar Supabase Auth + autorização server-side)`);
  }
  // 4b. Heurística: literal hex com forma de hash (MD5=32, SHA-1=40,
  // SHA-256=64) num ficheiro que também fala de senha/password — apanha o
  // padrão da Missão 7b com qualquer nome/algoritmo.
  if (/['"`][0-9a-f]{32}['"`]|['"`][0-9a-f]{40}['"`]|['"`][0-9a-f]{64}['"`]/.test(text)
      && /senha|password|passwd/i.test(text)) {
    violations.push(`${rel}: constante hex com forma de hash junto a lógica de senha — possível hash de autenticação no bundle`);
  }
  // 4c. Hashes bcrypt/argon2 embutidos — nunca pertencem a código cliente.
  const bcrypt = text.match(/['"`]\$2[aby]\$\d{2}\$[./A-Za-z0-9]{20,}['"`]|['"`]\$argon2[a-z]*\$[^'"`]{20,}['"`]/);
  if (bcrypt) {
    violations.push(`${rel}: hash bcrypt/argon2 embutido no bundle (${bcrypt[0].slice(0, 24)}…)`);
  }
  // 4d. Comparação de senha em PLAINTEXT (pior que o hash): senha === 'literal'.
  // O keyword tem de estar do lado esquerdo para não apanhar `type === 'password'`
  // (verificações de input.type); literais triviais tipo 'password' são ignorados.
  const plain = text.match(/(?:senha|password|passwd)\w*\s*[!=]==?\s*['"`]([^'"`]{4,})['"`]/i);
  if (plain && !['password', 'senha', 'text', 'hidden'].includes(plain[1].toLowerCase())) {
    violations.push(`${rel}: comparação de senha em plaintext no cliente ("${plain[1].slice(0, 12)}…") — usar Supabase Auth`);
  }

  // 5. eval / new Function — a CSP não tem 'unsafe-eval' (ADR 0003). Reintroduzi-lo
  // parte o site em produção. Libs de 3ª parte minificadas ficam de fora
  // (não são código nosso e são CSP-safe conhecidas).
  if (!rel.replace(/\\/g, '/').match(/\.min\.js$/)) {
    if (/\bnew Function\s*\(/.test(text) || /[^.\w]eval\s*\(/.test(text)) {
      violations.push(`${rel}: uso de eval/new Function — a CSP não permite 'unsafe-eval' (ler config via JSON.parse; ver ADR 0003)`);
    }

    // 6. XSS via innerHTML — dados de CLIENTE (notas do pedido, nome de
    // mesa/membro, texto livre) interpolados num template literal SEM
    // escape. A CSP não trava isto. Todo o dado de cliente tem de passar por
    // escHtml/escapeHtml/safeText/sanitise. Heurística: procura interpolações
    // ${…campo-de-utilizador…} que NÃO contenham uma chamada de escape.
    // Só analisa interpolações DENTRO de atribuições a innerHTML (o único
    // sink de markup). Plaintext (WhatsApp, toast), textContent e config em
    // atributos não entram aqui — evita os falsos-positivos do heurístico
    // amplo. Interpolação de um campo de texto livre do CLIENTE sem uma
    // chamada de escape ⇒ XSS (a CSP não trava innerHTML).
    const USER_FIELDS = /\b(member_?name|table_label|guest_?name|notes?)\b/i;
    const ESCAPED = /\besc\w*\(|\bsafe\w*\(|saniti[sz]e|\bclean\(/i;
    // config do venue (sec.note, CONFIG.*, section.*) não é input de cliente
    const VENUE_CONFIG = /\b(CONFIG|sec|section|s)\.(note|name)/i;
    for (const blk of text.matchAll(/innerHTML\s*\+?=\s*`([^`]{0,4000})`/g)) {
      for (const m of blk[1].matchAll(/\$\{([^}]{0,200})\}/g)) {
        const expr = m[1].trim();
        if (USER_FIELDS.test(expr) && !ESCAPED.test(expr) && !VENUE_CONFIG.test(expr)) {
          const snippet = m[0].slice(0, 60).replace(/\s+/g, ' ');
          violations.push(`${rel}: dado de cliente sem escape em innerHTML ("${snippet}…") — usar escHtml/safeText (XSS; a CSP não trava)`);
        }
      }
    }
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
