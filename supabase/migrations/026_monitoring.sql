-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — 026 Monitoring tables
-- Projecto dos menus+portal: kgbrtbpeekhkroibsgqq — correr no SQL Editor.
--
-- Cria as tabelas de suporte ao sistema de monitorização automática:
--   • monitoring_log  — registo de cada execução do check-client-health
--   • system_alerts   — alertas guardados quando CallMeBot falha
-- RLS ligado em ambas: só o service role (Edge Functions) as escreve.
-- A função cleanup_monitoring() purga dados com mais de 30 dias.
-- Idempotente: seguro re-correr.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. monitoring_log ────────────────────────────────────────────────────
create table if not exists monitoring_log (
  id           uuid primary key default gen_random_uuid(),
  checked_at   timestamptz default now(),
  total_menus  integer default 0,
  issues_found integer default 0,
  results      jsonb default '[]'
);

create index if not exists monitoring_log_checked_at_idx
  on monitoring_log(checked_at desc);

alter table monitoring_log enable row level security;
-- Sem políticas públicas: só service role (Edge Functions) lê/escreve.

-- ── 2. system_alerts ─────────────────────────────────────────────────────
create table if not exists system_alerts (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  message          text not null,
  severity         text default 'warning',
  sent_at          timestamptz,
  acknowledged     boolean default false,
  acknowledged_at  timestamptz
);

create index if not exists system_alerts_unacked_idx
  on system_alerts(created_at desc) where acknowledged = false;

alter table system_alerts enable row level security;
-- Sem políticas públicas: só service role.
-- O portal lê alertas via Edge Function ou RPC futura, nunca directo.

-- ── 3. Limpeza automática (30 dias) ──────────────────────────────────────
create or replace function cleanup_monitoring()
returns void as $$
begin
  delete from monitoring_log
    where checked_at < now() - interval '30 days';
  delete from system_alerts
    where created_at < now() - interval '30 days'
      and acknowledged = true;
end;
$$ language plpgsql security definer set search_path = public;

-- Agendar limpeza semanal (segunda-feira às 04:00 UTC) via pg_cron.
-- Se pg_cron não estiver disponível, a migração continua sem erro.
do $$
begin
  perform cron.schedule(
    'nexo-monitoring-cleanup',
    '0 4 * * 1',
    'select cleanup_monitoring()'
  );
exception when others then
  raise notice 'pg_cron indisponível (%, %). Agende cleanup_monitoring() manualmente.', sqlstate, sqlerrm;
end $$;

-- ── Verificação ───────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.tables
   where table_schema = 'public'
     and table_name in ('monitoring_log','system_alerts')) as tables_created;
