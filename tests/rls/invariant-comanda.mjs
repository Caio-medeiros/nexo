#!/usr/bin/env node
/**
 * Prova do INVARIANTE da 043 num Postgres REAL (efémero): por
 * (espaco_slug, table_number) existe no máximo UMA comanda aberta.
 *
 * Sobe um cluster descartável, cria um esquema mínimo mas fiel (as colunas
 * que a 043 referencia), aplica o FICHEIRO REAL supabase/migrations/043…sql
 * e corre asserções em SQL (DO blocks que RAISE em falha, com ON_ERROR_STOP).
 *
 *   node tests/rls/invariant-comanda.mjs
 *
 * Requer psql/pg_ctl/initdb no PATH (Postgres local). Se não existirem,
 * sai com código 2 (skip explícito) para não falsificar um "pass".
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATION = join(HERE, '..', '..', 'supabase', 'migrations', '043_one_open_comanda_per_table.sql');

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
  const r = spawnSync('psql', ['-h', root, '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-X', '-q', '-f', '-'],
    { input: sql, encoding: 'utf8' });
  return r;
}

try {
  execFileSync('initdb', ['-D', data, '-A', 'trust', '-U', 'postgres'], { stdio: 'ignore' });
  // socket-only (sem TCP) — evita colisões de porta; socket no dir curto `root`
  execFileSync('pg_ctl', ['-D', data, '-o', `-k ${root} -h ''`, '-w', '-t', '30', 'start'], { stdio: 'ignore' });
  started = true;

  const FIXTURE = `
-- roles stub do Supabase (a 043 faz grant a anon/authenticated)
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;

-- esquema mínimo mas fiel (colunas que a 043 referencia)
create table venue_settings (
  espaco_slug text primary key,
  table_count integer,
  table_tokens jsonb default '{}'
);
create table comandas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  espaco_slug text not null,
  table_label text,
  status text default 'open',
  mode text default 'dine_in',
  guest_count integer default 1,
  total numeric(10,2) default 0,
  session_code text not null default substr(md5(random()::text || clock_timestamp()::text), 1, 8),
  client_token uuid default gen_random_uuid(),
  submitted_at timestamptz,
  closed_at timestamptz,
  archived_at timestamptz
);
`;

  const ASSERT = `
insert into venue_settings(espaco_slug, table_count, table_tokens)
  values ('demo', 10, '{"5":"tok5"}');

do $$
declare r jsonb; c1 uuid; c2 uuid; n int;
begin
  -- (a) o trigger deriva table_number de 'Mesa 5'
  insert into comandas(espaco_slug, table_label) values ('demo','Mesa 5')
    returning table_number into n;
  if n is distinct from 5 then raise exception 'derive falhou: %', n; end if;

  -- (b) 2.ª comanda aberta DIRETA na mesma mesa → bloqueada pelo índice único
  begin
    insert into comandas(espaco_slug, table_label, table_number) values ('demo','Mesa 5',5);
    raise exception 'INVARIANTE QUEBRADO: 2.ª comanda aberta inserida';
  exception when unique_violation then null; -- esperado
  end;

  -- (c) RPC get-or-create junta-se à comanda aberta existente (mesmo id)
  r := nexo_open_table_comanda('demo',5,'tok5');
  if (r->>'valid')::bool is not true then raise exception 'RPC recusou token válido'; end if;
  c1 := (r->'comanda'->>'id')::uuid;
  r := nexo_open_table_comanda('demo',5,'tok5');
  c2 := (r->'comanda'->>'id')::uuid;
  if c1 is distinct from c2 then raise exception 'RPC criou 2.ª comanda: % vs %', c1, c2; end if;
  if (r->>'joined')::bool is not true then raise exception 'RPC não se juntou à existente'; end if;

  -- (d) token errado → valid=false
  r := nexo_open_table_comanda('demo',5,'ERRADO');
  if (r->>'valid')::bool is not false then raise exception 'RPC aceitou token errado'; end if;

  -- (e) fechar a mesa → a RPC pode abrir uma nova (joined=false)
  update comandas set status='closed' where espaco_slug='demo' and table_number=5 and status <> 'closed';
  r := nexo_open_table_comanda('demo',5,'tok5');
  if (r->>'joined')::bool is not false then raise exception 'RPC juntou-se a comanda fechada'; end if;

  raise notice 'INVARIANTE OK';
end $$;
`;

  const migSql = readFileSync(MIGRATION, 'utf8');
  // aplica a migração DUAS vezes → prova idempotência além do invariante.
  const full = FIXTURE + '\n' + migSql + '\n' + migSql + '\n' + ASSERT;
  const r = psql(full);
  if (r.status !== 0) {
    console.error('✗ Invariante FALHOU:\n' + (r.stderr || r.stdout || '').trim());
    process.exit(1);
  }
  if (!/INVARIANTE OK/.test((r.stdout || '') + (r.stderr || ''))) {
    console.error('✗ Asserção final não confirmada.\n' + (r.stderr || r.stdout));
    process.exit(1);
  }
  console.log('✓ Invariante 043 provado: 1 comanda aberta por mesa (índice único + RPC get-or-create).');
  process.exit(0);
} catch (e) {
  console.error('✗ Erro no harness Postgres:', e.message);
  process.exit(1);
} finally {
  if (started) { try { execFileSync('pg_ctl', ['-D', data, '-m', 'immediate', 'stop'], { stdio: 'ignore' }); } catch {} }
  try { rmSync(root, { recursive: true, force: true }); } catch {}
}
