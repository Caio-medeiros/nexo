-- ═══════════════════════════════════════════════════════════════
-- NEXO — Agendamento das Edge Functions via pg_cron + pg_net
-- Corre uma vez. Seguro re-correr (unschedule antes de re-agendar).
-- ═══════════════════════════════════════════════════════════════

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Remove schedules existentes (para ser idempotente)
select cron.unschedule('nexo-check-client-health') where exists (
  select 1 from cron.job where jobname = 'nexo-check-client-health'
);
select cron.unschedule('nexo-daily-digest') where exists (
  select 1 from cron.job where jobname = 'nexo-daily-digest'
);

-- Verificação horária de saúde dos clientes (10h–24h Lisboa)
select cron.schedule(
  'nexo-check-client-health',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://kgbrtbpeekhkroibsgqq.supabase.co/functions/v1/check-client-health',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Digest diário às 09:00 UTC (10:00 Lisboa)
select cron.schedule(
  'nexo-daily-digest',
  '0 9 * * *',
  $$
  select net.http_post(
    url := 'https://kgbrtbpeekhkroibsgqq.supabase.co/functions/v1/daily-digest',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

select 'edge function schedules ok' as status;
