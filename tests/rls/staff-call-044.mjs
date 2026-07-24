#!/usr/bin/env node
/**
 * Prova da 044 (chamada de empregado get-or-create) num Postgres REAL efémero.
 * Aplica o FICHEIRO REAL 044 e assere o dedup ao nível da mesa:
 *   • 1.ª chamada → pending:false + 1 linha
 *   • 2.ª chamada imediata (mesma mesa) → pending:true + SEM nova linha
 *   • mesa diferente → pending:false + nova linha
 *   • depois de resolvida → nova chamada volta a passar (pending:false)
 *
 *   node tests/rls/staff-call-044.mjs
 *
 * Requer psql/pg_ctl/initdb no PATH. Sem eles, sai 2 (skip explícito).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATION = join(HERE, '..', '..', 'supabase', 'migrations', '044_staff_call_get_or_create.sql');

function has(bin) {
  try { execFileSync('which', [bin], { stdio: 'ignore' }); return true; } catch { return false; }
}
if (!has('initdb') || !has('pg_ctl') || !has('psql')) {
  console.error('SKIP: Postgres (initdb/pg_ctl/psql) não disponível no PATH.');
  process.exit(2);
}

const root = mkdtempSync(join(tmpdir(), 'nexopg-'));
const data = join(root, 'd');
let started = false;

function psql(sql) {
  return spawnSync('psql', ['-h', root, '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-X', '-q', '-f', '-'],
    { input: sql, encoding: 'utf8' });
}

try {
  execFileSync('initdb', ['-D', data, '-A', 'trust', '-U', 'postgres'], { stdio: 'ignore' });
  execFileSync('pg_ctl', ['-D', data, '-o', `-k ${root} -h ''`, '-w', '-t', '30', 'start'], { stdio: 'ignore' });
  started = true;

  const FIXTURE = `
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;

-- staff_calls mínimo mas fiel (colunas que a 044 referencia)
create table staff_calls (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  espaco_slug text not null,
  table_label text,
  resolved_at timestamptz
);
`;

  const ASSERT = `
do $$
declare r jsonb; n int;
begin
  -- (a) 1.ª chamada da Mesa 1 → cria (pending:false)
  r := nexo_call_staff('demo','Mesa 1');
  if (r->>'pending')::bool is not false then raise exception '1.ª chamada não devia ser pending'; end if;
  select count(*) into n from staff_calls; if n <> 1 then raise exception 'esperava 1 linha, tem %', n; end if;

  -- (b) 2.ª chamada imediata da Mesa 1 → pending:true, SEM nova linha
  r := nexo_call_staff('demo','Mesa 1');
  if (r->>'pending')::bool is not true then raise exception '2.ª chamada devia ser pending'; end if;
  select count(*) into n from staff_calls; if n <> 1 then raise exception 'dedup falhou: % linhas', n; end if;

  -- (c) mesa diferente → nova chamada (pending:false)
  r := nexo_call_staff('demo','Mesa 2');
  if (r->>'pending')::bool is not false then raise exception 'Mesa 2 não devia ser pending'; end if;
  select count(*) into n from staff_calls; if n <> 2 then raise exception 'esperava 2 linhas, tem %', n; end if;

  -- (d) resolver a Mesa 1 → nova chamada volta a passar (pending:false)
  update staff_calls set resolved_at = now() where table_label = 'Mesa 1';
  r := nexo_call_staff('demo','Mesa 1');
  if (r->>'pending')::bool is not false then raise exception 'após resolver, devia criar nova'; end if;
  select count(*) into n from staff_calls; if n <> 3 then raise exception 'esperava 3 linhas, tem %', n; end if;

  raise notice '044 OK';
end $$;
`;

  const migSql = readFileSync(MIGRATION, 'utf8');
  // aplica a migração DUAS vezes → prova idempotência além do comportamento.
  const full = FIXTURE + '\n' + migSql + '\n' + migSql + '\n' + ASSERT;
  const r = psql(full);
  if (r.status !== 0) {
    console.error('✗ 044 FALHOU:\n' + (r.stderr || r.stdout || '').trim());
    process.exit(1);
  }
  if (!/044 OK/.test((r.stdout || '') + (r.stderr || ''))) {
    console.error('✗ Asserção final não confirmada.\n' + (r.stderr || r.stdout));
    process.exit(1);
  }
  console.log('✓ 044 provado: chamada de empregado get-or-create (dedup ao nível da mesa).');
  process.exit(0);
} catch (e) {
  console.error('✗ Erro no harness Postgres:', e.message);
  process.exit(1);
} finally {
  if (started) { try { execFileSync('pg_ctl', ['-D', data, '-m', 'immediate', 'stop'], { stdio: 'ignore' }); } catch {} }
  try { rmSync(root, { recursive: true, force: true }); } catch {}
}
