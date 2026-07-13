-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — 039: RETENÇÃO COMPLETA ("boring at scale")
-- (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq)
--
-- A auditoria de retenção encontrou dois problemas:
--   1. Funções de limpeza ÓRFÃS — existem mas nenhum cron as corre:
--        cleanup_rate_limit_log (021), cleanup_security_log (021),
--        cleanup_error_log (025), cleanup_order_flags (022).
--   2. Tabelas de crescimento infinito SEM qualquer retenção:
--        menu_events, orders_log, staff_calls, waitlist_entries,
--        portal_notifications, shared_cart_items e as comandas
--        arquivadas/fechadas (030 arquiva mas nunca purga — comanda_items/
--        rounds/voids acumulam para sempre).
--
-- Esta migração:
--   A) cria retention_rollup — preserva os agregados de sempre ANTES de
--      purgar (espaco_lifetime() em 013 conta menu_events/orders_log/
--      staff_calls desde o início do contrato; apagar sem rollup
--      encolheria silenciosamente o painel "Renovação & Valor")
--   B) cria nexo_retention_sweep() — uma única função que aplica TODAS as
--      janelas de retenção e chama as funções de limpeza órfãs
--   C) redefine espaco_lifetime() para somar rollup + linhas vivas
--   D) alarga cleanup_error_log(): também purga NÃO-resolvidos > 180 dias
--      (antes só resolvidos > 30d → unresolved acumulava para sempre)
--   E) agenda o sweep diário às 04:20 UTC via pg_cron
--   F) revoga execute público das funções de limpeza (só cron/service role)
--
-- JANELAS DE RETENÇÃO (conservadoras; o rollup preserva os totais):
--   rate_limit_log          24 horas   (021 — janela existente)
--   shared_cart_items        7 dias    (carrinhos partilhados são efémeros)
--   security_log            30 dias    (021 — janela existente)
--   error_log               30 dias resolvidos / 180 dias não-resolvidos
--   monitoring_log/alerts   30 dias    (026 — já agendado, fica como está)
--   order_flags             90 dias    (022 — janela existente)
--   portal_notifications    90 dias lidas / 365 dias todas
--   waitlist_entries       365 dias    (015 só usa os últimos 30 dias)
--   menu_events             13 meses   (≥ 1 ano completo p/ comparação YoY)
--   staff_calls             13 meses
--   comandas fechadas/arq.  24 meses   (cascade: items+rounds; voids à mão)
--   orders_log              25 meses   (registo financeiro — 2 anos + margem)
--
-- IMPACTO DOCUMENTADO: a vista "Tudo" (p_days=0) de nm_financeiro_stats
-- (036) passa a reflectir apenas os eventos crus retidos (13 meses); os
-- contadores de sempre continuam correctos via espaco_lifetime()/rollup.
--
-- Idempotente: seguro re-correr. Correr DEPOIS da 038.
-- ═══════════════════════════════════════════════════════════════════════

-- ── A) Rollup de agregados históricos ─────────────────────────────────────
-- Uma linha por espaço com os contadores de sempre já purgados das tabelas
-- cruas. Só o sweep (security definer) escreve; ninguém lê directamente —
-- o portal continua a usar espaco_lifetime().
create table if not exists retention_rollup (
  espaco_slug      text primary key,
  visits           bigint default 0,
  sessions         bigint default 0,
  items_viewed     bigint default 0,
  google_clicks    bigint default 0,
  reviews_positive bigint default 0,
  orders           bigint default 0,
  revenue          numeric(12,2) default 0,
  staff_calls      bigint default 0,
  updated_at       timestamptz default now()
);

alter table retention_rollup enable row level security;
-- Sem políticas → só service role / funções security definer.

-- ── D) cleanup_error_log alargado ─────────────────────────────────────────
-- Mantém a janela de 30 dias para resolvidos (025) e acrescenta 180 dias
-- para não-resolvidos: um erro ignorado meio ano não é observabilidade,
-- é lixo — e sem isto a tabela cresce para sempre.
create or replace function cleanup_error_log()
returns void as $$
begin
  delete from error_log
  where created_at < now() - interval '30 days' and resolved = true;
  delete from error_log
  where created_at < now() - interval '180 days';
end;
$$ language plpgsql security definer set search_path = public;

-- ── B) Sweep único de retenção ────────────────────────────────────────────
-- Agrega → purga, tabela a tabela, e devolve as contagens em jsonb.
-- Regista o resultado no error_log (source 'retention_sweep', INFO) para
-- observabilidade — o mesmo padrão de archive_stale_comandas (030).
create or replace function nexo_retention_sweep()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_events   integer := 0;
  v_orders   integer := 0;
  v_calls    integer := 0;
  v_comandas integer := 0;
  v_notifs   integer := 0;
  v_waitlist integer := 0;
  v_carts    integer := 0;
  v_result   jsonb;
begin
  -- 1. menu_events > 13 meses: agregar no rollup, depois apagar.
  --    (o sweep é diário, por isso cada lote cobre ~1 dia de eventos; uma
  --    sessão nunca fica dividida entre dois lotes — count(distinct) é fiel)
  with old_events as (
    delete from menu_events
     where created_at < now() - interval '13 months'
    returning espaco_slug, event_name, session_id
  ), agg as (
    select espaco_slug,
           count(*) filter (where event_name = 'menu_opened')          as visits,
           count(distinct session_id)
                    filter (where session_id is not null)              as sessions,
           count(*) filter (where event_name = 'item_viewed')          as items_viewed,
           count(*) filter (where event_name = 'review_google_clicked') as google_clicks,
           count(*) filter (where event_name = 'review_positive')      as reviews_positive,
           count(*)                                                    as total
      from old_events group by espaco_slug
  )
  insert into retention_rollup as r
         (espaco_slug, visits, sessions, items_viewed, google_clicks, reviews_positive)
  select espaco_slug, visits, sessions, items_viewed, google_clicks, reviews_positive
    from agg
  on conflict (espaco_slug) do update set
    visits           = r.visits           + excluded.visits,
    sessions         = r.sessions         + excluded.sessions,
    items_viewed     = r.items_viewed     + excluded.items_viewed,
    google_clicks    = r.google_clicks    + excluded.google_clicks,
    reviews_positive = r.reviews_positive + excluded.reviews_positive,
    updated_at       = now();
  get diagnostics v_events = row_count; -- linhas do INSERT (espaços tocados)

  -- 2. orders_log > 25 meses: preservar contagem + facturação no rollup.
  with old_orders as (
    delete from orders_log
     where created_at < now() - interval '25 months'
    returning espaco_slug, total
  ), agg as (
    select espaco_slug, count(*) as n, coalesce(sum(total), 0) as revenue
      from old_orders group by espaco_slug
  )
  insert into retention_rollup as r (espaco_slug, orders, revenue)
  select espaco_slug, n, revenue from agg
  on conflict (espaco_slug) do update set
    orders     = r.orders  + excluded.orders,
    revenue    = r.revenue + excluded.revenue,
    updated_at = now();
  get diagnostics v_orders = row_count;

  -- 3. staff_calls > 13 meses: preservar contagem no rollup.
  with old_calls as (
    delete from staff_calls
     where created_at < now() - interval '13 months'
    returning espaco_slug
  ), agg as (
    select espaco_slug, count(*) as n from old_calls group by espaco_slug
  )
  insert into retention_rollup as r (espaco_slug, staff_calls)
  select espaco_slug, n from agg
  on conflict (espaco_slug) do update set
    staff_calls = r.staff_calls + excluded.staff_calls,
    updated_at  = now();
  get diagnostics v_calls = row_count;

  -- 4. Comandas terminadas (fechadas/canceladas ou arquivadas) > 24 meses.
  --    comanda_voids referencia comandas E comanda_items SEM cascade →
  --    apagar primeiro; comanda_items/comanda_rounds caem por cascade.
  --    A facturação de sempre já vive em orders_log/rollup (a sala insere
  --    em orders_log ao fechar), por isso não se perde receita histórica.
  delete from comanda_voids v
   where exists (
     select 1 from comandas c
      where c.id = v.comanda_id
        and (c.status in ('closed', 'cancelled') or c.archived_at is not null)
        and c.created_at < now() - interval '24 months'
   );

  with purged as (
    delete from comandas
     where (status in ('closed', 'cancelled') or archived_at is not null)
       and created_at < now() - interval '24 months'
    returning id
  )
  select count(*) into v_comandas from purged;

  -- 5. portal_notifications: lidas > 90 dias; tudo > 365 dias.
  with purged as (
    delete from portal_notifications
     where (read = true and created_at < now() - interval '90 days')
        or created_at < now() - interval '365 days'
    returning id
  )
  select count(*) into v_notifs from purged;

  -- 6. waitlist_entries > 365 dias (qualquer estado — uma entrada 'waiting'
  --    com um ano é lixo; 015 só consulta os últimos 30 dias).
  with purged as (
    delete from waitlist_entries
     where created_at < now() - interval '365 days'
    returning id
  )
  select count(*) into v_waitlist from purged;

  -- 7. shared_cart_items > 7 dias (carrinho de uma refeição é efémero).
  with purged as (
    delete from shared_cart_items
     where created_at < now() - interval '7 days'
    returning id
  )
  select count(*) into v_carts from purged;

  -- 8. Funções de limpeza que existiam sem cron (021/022/025).
  perform cleanup_rate_limit_log();
  perform cleanup_security_log();
  perform cleanup_error_log();
  perform cleanup_order_flags();

  v_result := jsonb_build_object(
    'espacos_rollup_events', v_events,
    'espacos_rollup_orders', v_orders,
    'espacos_rollup_calls',  v_calls,
    'comandas_purgadas',     v_comandas,
    'notificacoes_purgadas', v_notifs,
    'waitlist_purgadas',     v_waitlist,
    'carts_purgados',        v_carts,
    'ran_at',                now()
  );

  insert into error_log (source, error_code, error_message, context, resolved, resolved_at)
  values ('retention_sweep', 'INFO', 'sweep de retenção concluído', v_result, true, now());

  raise notice 'nexo_retention_sweep: %', v_result;
  return v_result;
end;
$$;

-- ── C) espaco_lifetime = rollup + linhas vivas ────────────────────────────
-- Mesmo contrato da 013 (owns_espaco + mesmos campos); só muda a soma com
-- o rollup para que a purga não encolha o painel "Renovação & Valor".
create or replace function espaco_lifetime(p_slug text)
returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare
  v_since timestamptz; v_visits int; v_sessions int; v_items int;
  v_google int; v_reviews_pos int; v_orders int; v_revenue numeric; v_calls int;
  r retention_rollup%rowtype;
begin
  if not owns_espaco(p_slug) then
    raise exception 'não autorizado';
  end if;

  select min(c.created_at) into v_since
    from clients c join menus m on m.client_id = c.id where m.slug = p_slug;

  select
    count(*) filter (where event_name = 'menu_opened'),
    count(distinct session_id) filter (where session_id is not null),
    count(*) filter (where event_name = 'item_viewed'),
    count(*) filter (where event_name = 'review_google_clicked'),
    count(*) filter (where event_name = 'review_positive')
   into v_visits, v_sessions, v_items, v_google, v_reviews_pos
   from menu_events where espaco_slug = p_slug;

  select count(*), coalesce(sum(total), 0) into v_orders, v_revenue
    from orders_log where espaco_slug = p_slug;
  select count(*) into v_calls from staff_calls where espaco_slug = p_slug;

  select * into r from retention_rollup where espaco_slug = p_slug;

  return jsonb_build_object(
    'client_since',     v_since,
    'visits',           coalesce(v_visits, 0)      + coalesce(r.visits, 0),
    'sessions',         coalesce(v_sessions, 0)    + coalesce(r.sessions, 0),
    'items_viewed',     coalesce(v_items, 0)       + coalesce(r.items_viewed, 0),
    'google_clicks',    coalesce(v_google, 0)      + coalesce(r.google_clicks, 0),
    'reviews_positive', coalesce(v_reviews_pos, 0) + coalesce(r.reviews_positive, 0),
    'orders',           coalesce(v_orders, 0)      + coalesce(r.orders, 0),
    'revenue',          coalesce(v_revenue, 0)     + coalesce(r.revenue, 0),
    'staff_calls',      coalesce(v_calls, 0)       + coalesce(r.staff_calls, 0),
    -- mesma fórmula do ROI das Estatísticas (cliques Google × 12 + faturação)
    'value_estimate',   (coalesce(v_google, 0) + coalesce(r.google_clicks, 0)) * 12
                        + coalesce(v_revenue, 0) + coalesce(r.revenue, 0)
  );
end $$;
grant execute on function espaco_lifetime(text) to authenticated;

-- ── F) Só o cron/service role executa limpezas ────────────────────────────
-- security definer + execute público por omissão = qualquer anónimo podia
-- disparar deletes em massa. Inofensivo em conteúdo, mas desnecessário.
revoke all on function nexo_retention_sweep()     from public, anon, authenticated;
revoke all on function cleanup_rate_limit_log()   from public, anon, authenticated;
revoke all on function cleanup_security_log()     from public, anon, authenticated;
revoke all on function cleanup_error_log()        from public, anon, authenticated;
revoke all on function cleanup_order_flags()      from public, anon, authenticated;
revoke all on function cleanup_monitoring()       from public, anon, authenticated;
revoke all on function archive_stale_comandas()   from public, anon, authenticated;

-- ── E) Agendamento pg_cron — diário às 04:20 UTC ──────────────────────────
-- Antes do arquivo das comandas (05:00) e da limpeza semanal (04:00 seg.);
-- o minuto exacto é irrelevante, qualquer corrida diária mantém as janelas.
-- Se pg_cron não estiver disponível, a migração continua sem erro.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule('nexo-retention-sweep')
   where exists (select 1 from cron.job where jobname = 'nexo-retention-sweep');
  perform cron.schedule(
    'nexo-retention-sweep',
    '20 4 * * *',
    $job$ select nexo_retention_sweep(); $job$
  );
exception when others then
  raise notice 'pg_cron indisponível (%, %). Agende nexo_retention_sweep() manualmente.', sqlstate, sqlerrm;
end $$;

-- ── Verificação ───────────────────────────────────────────────────────────
select 'retention 039 ok' as status,
  (select count(*) from pg_proc where proname = 'nexo_retention_sweep')  as sweep_fn,
  (select count(*) from pg_tables where tablename = 'retention_rollup')  as rollup_table;

-- Jobs de retenção agendados (tolerante a ambientes sem pg_cron):
do $$
declare v_jobs integer := -1;
begin
  if to_regclass('cron.job') is not null then
    execute $q$ select count(*) from cron.job
      where jobname in ('nexo-retention-sweep', 'nexo-monitoring-cleanup',
                        'nexo-archive-stale-comandas', 'nexo-daily-health') $q$
    into v_jobs;
  end if;
  raise notice 'retention 039 — cron jobs de manutenção activos: % (esperado 4; -1 = sem pg_cron)', v_jobs;
end $$;
