#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// NEXO — cache-busting das tags de assets dos menus
//
// Acrescenta (ou actualiza) ?v=<versão> a TODAS as referências locais de .js
// e .css nos menu/*/index.html. Depois de "sync", o browser vê um URL novo e
// re-busca o ficheiro em vez de servir a cópia em cache (o que deixava o menu
// meio-renderizado: hero sim, itens não).
//
// Uso:
//   node scripts/bump-assets.mjs           → versão = timestamp actual
//   node scripts/bump-assets.mjs 20260718  → versão fixa
//   node scripts/bump-assets.mjs --check   → falha (exit 1) se algo por versionar
//
// Só toca referências LOCAIS (não http/cdn) e só .js/.css — fontes/imagens e
// os scripts inline (GTM, etc.) ficam intactos. Idempotente: re-correr troca
// a versão, nunca duplica o ?v=.
// ─────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const arg = process.argv[2];
const CHECK = arg === '--check';
const version = (CHECK || !arg)
  ? new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12) // YYYYMMDDHHMM
  : String(arg).replace(/[^A-Za-z0-9._-]/g, '');

// src="…" ou href="…" apontando a um .js/.css LOCAL (não começa por http: ou //)
const ASSET_RE = /((?:src|href)=")((?!https?:|\/\/)[^"?]+?\.(?:js|css))(\?v=[^"]*)?(")/g;

const MENU_DIR = 'menu';
const menus = readdirSync(MENU_DIR).filter((d) =>
  existsSync(join(MENU_DIR, d, 'index.html')));

let touched = 0, missing = 0;
for (const m of menus) {
  const file = join(MENU_DIR, m, 'index.html');
  const src = readFileSync(file, 'utf8');
  let count = 0, unversioned = 0;
  const out = src.replace(ASSET_RE, (_, pre, url, existing, post) => {
    count++;
    if (CHECK && !existing) unversioned++;
    return `${pre}${url}?v=${version}${post}`;
  });
  if (CHECK) {
    if (unversioned) { console.log(`✗ ${m}: ${unversioned} asset(s) sem ?v=`); missing += unversioned; }
    continue;
  }
  if (out !== src) { writeFileSync(file, out); touched++; }
  console.log(`✓ ${m}: ${count} asset(s) → ?v=${version}`);
}

if (CHECK) {
  if (missing) { console.error(`\n${missing} asset(s) por versionar. Corre: node scripts/bump-assets.mjs`); process.exit(1); }
  console.log('✓ todos os assets locais dos menus têm ?v=');
} else {
  console.log(`\n${touched} menu(s) actualizado(s) para a versão ${version}.`);
}
