-- ═══════════════════════════════════════════════════════════════
-- NEXO — 032: header secreto nos crons das Edge Functions
--
-- As funções check-client-health e daily-digest são deployadas com
-- --no-verify-jwt (o pg_cron não envia Authorization). Sem gate, qualquer
-- pessoa na internet podia invocá-las: spam de alertas WhatsApp e, antes
-- do fix nas funções, leitura de métricas/facturação por cliente.
--
-- PASSOS MANUAIS (uma vez, antes de correr esta migração):
--   1. Gerar um segredo:  openssl rand -hex 32
--   2. Dashboard → Project Settings → Edge Functions → Secrets:
--        NEXO_CRON_SECRET = <segredo>
--   3. SQL Editor (guarda o mesmo segredo no Vault para o pg_cron ler):
--        select vault.create_secret('<segredo>', 'nexo_cron_secret');
--
-- Depois correr esta migração. Seguro re-correr (unschedule antes).
-- Se o Vault não tiver o segredo, o header vai vazio e as funções
-- respondem 401 — o cron não "meio-funciona" em silêncio: o estado
-- fica visível no monitoring_log/status.
-- ═══════════════════════════════════════════════════════════════

create extension if not exists pg_net;
create extension if not exists pg_cron;

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
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-nexo-cron-secret', coalesce(
        (select decrypted_secret from vault.decrypted_secrets
          where name = 'nexo_cron_secret' limit 1), '')
    ),
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
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-nexo-cron-secret', coalesce(
        (select decrypted_secret from vault.decrypted_secrets
          where name = 'nexo_cron_secret' limit 1), '')
    ),
    body := '{}'::jsonb
  );
  $$
);

select 'cron secret headers ok' as status;
