#!/usr/bin/env node
/**
 * Prova do #5 (identificação da mesa) — extrai as funções REAIS
 * extractTableNumber() e tableNumberOf() de portal/sala/sala.js e assere que:
 *   • a coluna canónica table_number (043) manda sempre sobre o table_label;
 *   • o regex de recurso lê "Mesa N" mesmo com parênteses / zeros à esquerda /
 *     texto extra, sem apanhar o número errado.
 *
 *   node tests/portal/sala-tablenum.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(HERE, '..', '..', 'portal', 'sala', 'sala.js'), 'utf8');

function extractFn(name) {
  const start = SRC.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`função ${name} não encontrada em sala.js`);
  // apanha até à chaveta de fecho equilibrada
  let i = SRC.indexOf('{', start), depth = 0, end = -1;
  for (; i < SRC.length; i++) {
    if (SRC[i] === '{') depth++;
    else if (SRC[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  return SRC.slice(start, end);
}

const sandbox = { String, Number, parseInt, isNaN };
vm.createContext(sandbox);
vm.runInContext(extractFn('extractTableNumber') + '\n' + extractFn('tableNumberOf') +
  '\nthis.extractTableNumber = extractTableNumber; this.tableNumberOf = tableNumberOf;', sandbox);
const { extractTableNumber, tableNumberOf } = sandbox;

let pass = 0, fail = 0;
function eq(actual, expected, msg) {
  if (actual === expected) { pass++; }
  else { fail++; console.error(`✗ ${msg}: esperava ${expected}, veio ${actual}`); }
}

// ── coluna table_number manda (fonte de verdade 043) ──
eq(tableNumberOf({ table_number: 7, table_label: 'Mesa 99' }), 7, 'coluna table_number tem prioridade');
eq(tableNumberOf({ table_number: 0, table_label: 'Mesa 5' }), 0, 'table_number 0 é válido (não cai para o label)');
eq(tableNumberOf({ table_label: 'Mesa 5' }), 5, 'sem coluna → cai para o label');
eq(tableNumberOf({ table_number: null, table_label: 'Mesa 12' }), 12, 'table_number null → usa o label');

// ── regex de recurso robusto (#5) ──
eq(extractTableNumber('Mesa 5'), 5, 'Mesa 5');
eq(extractTableNumber('Mesa (5)'), 5, 'parênteses');
eq(extractTableNumber('Mesa 007'), 7, 'zeros à esquerda');
eq(extractTableNumber('Mesa 12 (esplanada)'), 12, 'texto extra depois');
eq(extractTableNumber('Sala 2 · Mesa 5'), 5, 'prefere "Mesa N" e ignora o "2" antes');
eq(extractTableNumber('MESA 8'), 8, 'maiúsculas');
eq(extractTableNumber(''), null, 'vazio → null');
eq(extractTableNumber(null), null, 'null → null');
eq(extractTableNumber('Balcão 3'), 3, 'sem "mesa" → cai para o 1.º número');

if (fail) { console.error(`\n${pass} passaram, ${fail} falharam`); process.exit(1); }
console.log(`✓ #5 identificação da mesa: ${pass}/${pass} (coluna table_number + regex robusto).`);
process.exit(0);
