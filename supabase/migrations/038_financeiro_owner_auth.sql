-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — 038: FINANCEIRO NO MANCHES → AUTORIZAÇÃO REAL (dono autenticado)
-- (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq — correr no SQL Editor)
--
-- PROBLEMA: /portal/no-manches/financeiro/ protegia a faturação com um gate
-- CLIENT-SIDE: SHA-256 sem salt de uma senha curta, com o hash hardcoded no
-- JS público. Quebra-se em segundos com o dev tools aberto — e pior, dava
-- falsa confiança. Os dados de linha (comanda_items + mesas) eram lidos como
-- anon ao abrigo das políticas `using (true)` que a 037 acabou de fechar.
--
-- CORREÇÃO (opção A do plano): a página passa a autenticar-se com Supabase
-- Auth (a conta do DONO, a mesma do portal) e os dados de linha passam pelo
-- RLS real da 037 — `owns_espaco()` no servidor, não senha na UI. O realtime
-- (postgres_changes) continua a funcionar porque o WALRUS avalia a política
-- owns_espaco para o subscritor autenticado.
--
-- Esta migração fecha o que resta no servidor:
--   • nm_financeiro_stats (036) devolvia agregados a QUALQUER anon — passa
--     a exigir o dono autenticado do No Manches (e serve de sonda de
--     autorização para a página: 42501 → sessão sem acesso).
--
-- Nota de produto: o portal do staff NM partilha a sessão do dono no tablet.
-- A página do financeiro usa um storageKey de auth PRÓPRIO — não herda essa
-- sessão; exige login explícito do dono. (Se um dia o staff tiver contas
-- próprias, owns_espaco já os exclui por si.)
--
-- Idempotente: seguro re-correr. Correr DEPOIS da 037.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function nm_financeiro_stats(p_days integer default 7)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  -- Autorização real: só o dono autenticado do No Manches.
  if not owns_espaco('rest-no-manches-lisboa') then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  return (
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
    )
  );
end;
$$;

-- anon deixa de poder executar — o gate deixa de ser "quem sabe a senha"
-- e passa a ser "quem É o dono".
revoke all on function nm_financeiro_stats(integer) from public;
revoke execute on function nm_financeiro_stats(integer) from anon;
grant execute on function nm_financeiro_stats(integer) to authenticated;

-- ── Verificação ───────────────────────────────────────────────────────────
-- (correr autenticado como o dono devolve os números; como anon dá 42501)
select 'financeiro owner auth 038 ok' as status,
  (select count(*) from pg_proc where proname = 'nm_financeiro_stats') as has_rpc,
  (select not has_function_privilege('anon', 'nm_financeiro_stats(integer)', 'execute')) as anon_blocked;
