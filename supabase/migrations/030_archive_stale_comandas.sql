-- ═══════════════════════════════════════════════════════════════
-- NEXO — Arquivar comandas "presas" no fim do dia
-- ───────────────────────────────────────────────────────────────
-- Itens de pedidos que nunca foram marcados como prontos ficavam em
-- aberto indefinidamente na Cozinha/Sala. Esta migração:
--   A) adiciona comandas.archived_at
--   B) cria a função archive_stale_comandas() (conta + arquiva)
--   C) agenda-a às 06:00 Lisboa via pg_cron
-- Corre uma vez. Seguro re-correr (tudo idempotente).
--
-- NOTA: o modelo de dados do NEXO usa `comandas` (não uma tabela `orders`);
-- cada confirmação do menu cria uma RONDA dentro da comanda. Arquivar a
-- comanda retira do ecrã todas as suas rondas presas.
-- ═══════════════════════════════════════════════════════════════

-- ── A) Coluna archived_at ──────────────────────────────────────
alter table comandas
  add column if not exists archived_at timestamptz default null;

-- Índice parcial: a Cozinha/Sala filtra sempre archived_at is null.
create index if not exists comandas_active_idx
  on comandas(espaco_slug, status)
  where archived_at is null;

-- ── B) Função de arquivo ───────────────────────────────────────
-- Arquiva comandas ainda activas (não fechadas/canceladas) abertas há mais
-- de 18h. Devolve o nº de comandas arquivadas e regista no error_log
-- (source 'archive_stale_comandas') para observabilidade.
create or replace function archive_stale_comandas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with archived as (
    update comandas
       set archived_at = now()
     where archived_at is null
       and status not in ('closed', 'cancelled')
       and created_at < (now() - interval '18 hours')
    returning id
  )
  select count(*) into v_count from archived;

  insert into error_log (source, error_code, error_message, context, resolved, resolved_at)
  values (
    'archive_stale_comandas',
    'INFO',
    v_count || ' comandas arquivadas (presas > 18h)',
    jsonb_build_object('archived', v_count, 'ran_at', now()),
    true,
    now()
  );

  raise notice 'archive_stale_comandas: % comandas arquivadas', v_count;
  return v_count;
end;
$$;

-- ── C) Agendamento pg_cron — 06:00 Lisboa ──────────────────────
-- pg_cron corre em UTC. 05:00 UTC ≈ 06:00 Lisboa (WEST, verão); no inverno
-- (WET) cai às 05:00 locais. Como só arquiva comandas > 18h, o minuto exacto
-- é irrelevante — qualquer corrida matinal limpa as do dia anterior.
create extension if not exists pg_cron;

select cron.unschedule('nexo-archive-stale-comandas') where exists (
  select 1 from cron.job where jobname = 'nexo-archive-stale-comandas'
);

select cron.schedule(
  'nexo-archive-stale-comandas',
  '0 5 * * *',
  $$ select archive_stale_comandas(); $$
);

select 'archive stale comandas ok' as status;
