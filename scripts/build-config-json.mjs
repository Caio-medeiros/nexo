#!/usr/bin/env node
/**
 * NEXO — gera menu/<slug>/config.json a partir de config.js.
 *
 * config.js é DADO com uma casca de código (`const CONFIG = {…}` + o helper
 * `P(id)` que constrói URLs de fotos Pexels). Este script corre uma vez, em
 * build/commit (NÃO em runtime, nunca no browser), resolve o `P()` e serializa
 * o objecto CONFIG para JSON puro — a fonte de dados única do menu e do portal.
 *
 * Porque isto existe: o portal lia config.js via `new Function()` (eval), o que
 * obrigava a `'unsafe-eval'` na CSP. Com config.json + JSON.parse, o eval
 * desaparece. Ver docs/adr/0001-config-as-data.md.
 *
 *   node scripts/build-config-json.mjs            # gera todos
 *   node scripts/build-config-json.mjs --check    # falha se algum estiver desactualizado (CI)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MENUS = join(ROOT, 'menu');
const CHECK = process.argv.includes('--check');

// Extrai o objecto CONFIG de um texto config.js resolvendo o helper P().
// Build-time only — o input é código NOSSO, versionado, não input de utilizador.
function extractConfig(jsText) {
  // eslint-disable-next-line no-new-func
  const fn = new Function(jsText + '\n;return (typeof CONFIG !== "undefined") ? CONFIG : null;');
  return fn();
}

const dirs = readdirSync(MENUS, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

let built = 0, stale = 0;
for (const slug of dirs) {
  const jsPath = join(MENUS, slug, 'config.js');
  if (!existsSync(jsPath)) continue;
  let config;
  try {
    config = extractConfig(readFileSync(jsPath, 'utf8'));
  } catch (e) {
    console.error(`✗ ${slug}: falha a avaliar config.js — ${e.message}`);
    process.exitCode = 1;
    continue;
  }
  if (!config || typeof config !== 'object') {
    console.error(`✗ ${slug}: config.js não define um objecto CONFIG`);
    process.exitCode = 1;
    continue;
  }
  const json = JSON.stringify(config, null, 2) + '\n';
  const jsonPath = join(MENUS, slug, 'config.json');
  const current = existsSync(jsonPath) ? readFileSync(jsonPath, 'utf8') : null;

  if (CHECK) {
    if (current !== json) {
      console.error(`✗ ${slug}: config.json desactualizado (correr: node scripts/build-config-json.mjs)`);
      stale++;
    } else {
      console.log(`✓ ${slug}: config.json actual`);
    }
  } else {
    if (current !== json) { writeFileSync(jsonPath, json); console.log(`✓ ${slug}: config.json gerado (${json.length} bytes)`); built++; }
    else console.log(`= ${slug}: config.json já actual`);
  }
}

if (CHECK && stale > 0) { console.error(`\n${stale} config.json desactualizado(s).`); process.exit(1); }
if (!CHECK) console.log(`\n${built} ficheiro(s) gerado(s).`);
