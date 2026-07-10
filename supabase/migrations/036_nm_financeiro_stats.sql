-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — 036: RPC DE ESTATÍSTICAS P/ DASHBOARD FINANCEIRO (No Manches)
-- (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq)
--
-- A vista "Estatísticas" de /portal/no-manches/financeiro/ corre como anon
-- (gate por senha local, sem conta Supabase). O RLS de menu_events só dá
-- linhas ao dono autenticado, e orders_log/staff_calls nem GRANT SELECT
-- têm para anon (021) — por isso a página via zeros/42501.
--
-- Em vez de abrir RLS ao mundo, esta função SECURITY DEFINER devolve
-- APENAS agregados (contagens/somas, sem PII, sem linhas cruas) e APENAS
-- do venue No Manches — o slug está hardcoded, não é parâmetro.
--
-- Idempotente: seguro re-correr. Correr DEPOIS da 035.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function nm_financeiro_stats(p_days integer default 7)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with params as (
    select 'rest-no-manches-lisboa'::text as slug,
           case when coalesce(p_days, 0) > 0
                then now() - make_interval(days => least(p_days, 3650))
                else timestamptz '2020-01-01' end as since
  ),
  ev as (
    select e.event_name, e.session_id, e.item_name, e.language, e.created_at
    from menu_events e, params p
    where e.espaco_slug = p.slug and e.created_at >= p.since
  ),
  ord as (
    select o.total from orders_log o, params p
    where o.espaco_slug = p.slug and o.created_at >= p.since
  ),
  calls as (
    select 1 from staff_calls c, params p
    where c.espaco_slug = p.slug and c.created_at >= p.since
  )
  select jsonb_build_object(
    'views',         (select count(*) from ev where event_name = 'menu_opened'),
    'sessions',      (select count(distinct session_id) from ev where session_id is not null),
    'items_viewed',  (select count(*) from ev where event_name = 'item_viewed'),
    'google_clicks', (select count(*) from ev where event_name = 'review_google_clicked'),
    'staff_calls',   (select count(*) from calls),
    'orders_count',  (select count(*) from ord),
    'revenue',       (select coalesce(sum(total), 0) from ord),
    -- histograma 0h–23h em hora de Lisboa (o dashboard mostra hora local)
    'hours',         (select jsonb_agg(t.cnt order by t.h) from (
                        select gs.h,
                               count(ev.created_at) as cnt
                        from generate_series(0, 23) as gs(h)
                        left join ev on extract(hour from ev.created_at
                                                at time zone 'Europe/Lisbon') = gs.h
                        group by gs.h) t),
    'top_items',     coalesce((select jsonb_agg(jsonb_build_object('name', ti.item_name, 'n', ti.n)
                                                order by ti.n desc)
                       from (select item_name, count(*) as n from ev
                             where event_name = 'item_viewed' and item_name is not null
                             group by item_name order by n desc limit 5) ti), '[]'::jsonb),
    'langs',         coalesce((select jsonb_agg(jsonb_build_object('lang', tl.language, 'n', tl.n)
                                                order by tl.n desc)
                       from (select language, count(*) as n from ev
                             where language is not null group by language) tl), '[]'::jsonb)
  );
$$;

revoke all on function nm_financeiro_stats(integer) from public;
grant execute on function nm_financeiro_stats(integer) to anon, authenticated;

-- ── Verificação ───────────────────────────────────────────────────────────
select 'nm financeiro stats 036 ok' as status,
  (nm_financeiro_stats(7) ->> 'views') as views_7d;
