-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — Migration 013 (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq)
-- RETENÇÃO & RENOVAÇÃO.
--
-- 1) espaco_active(slug)   — kill-switch: o menu público e o portal só
--    funcionam se o contrato estiver ativo. FAIL-OPEN: se não houver cliente
--    associado ao slug, devolve true (não parte menus não-provisionados).
-- 2) espaco_lifetime(slug) — valor acumulado desde que é cliente, para o
--    painel "Renovação & Valor" do portal (incentiva a renovação pela
--    qualidade/valor entregue).
--
-- Idempotente.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. Estado do contrato (anon — usado pelo menu e pelo portal)
--    Ativo = existe cliente, status != churned/suspended e a renovação não
--    está vencida. Sem cliente associado → true (fail-open).
-- ─────────────────────────────────────────
create or replace function espaco_active(p_slug text)
returns boolean
language sql security definer set search_path = public stable as $$
  select coalesce(bool_and(
    c.status is distinct from 'churned'
    and c.status is distinct from 'suspended'
    and (c.plan_renewal_date is null or c.plan_renewal_date >= current_date)
  ), true)
  from menus m join clients c on c.id = m.client_id
  where m.slug = p_slug;
$$;
grant execute on function espaco_active(text) to anon, authenticated;

-- ─────────────────────────────────────────
-- 2. Valor acumulado (só o dono do espaço — para o painel de renovação)
-- ─────────────────────────────────────────
create or replace function espaco_lifetime(p_slug text)
returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare
  v_since timestamptz; v_visits int; v_sessions int; v_items int;
  v_google int; v_reviews_pos int; v_orders int; v_revenue numeric; v_calls int;
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

  return jsonb_build_object(
    'client_since',     v_since,
    'visits',           coalesce(v_visits, 0),
    'sessions',         coalesce(v_sessions, 0),
    'items_viewed',     coalesce(v_items, 0),
    'google_clicks',    coalesce(v_google, 0),
    'reviews_positive', coalesce(v_reviews_pos, 0),
    'orders',           coalesce(v_orders, 0),
    'revenue',          coalesce(v_revenue, 0),
    'staff_calls',      coalesce(v_calls, 0),
    -- mesma fórmula do ROI das Estatísticas (cliques Google × 12 + faturação)
    'value_estimate',   coalesce(v_google, 0) * 12 + coalesce(v_revenue, 0)
  );
end $$;
grant execute on function espaco_lifetime(text) to authenticated;

-- Verificação
select espaco_active('marisca-petisca') as marisca_ativo,
       espaco_active('slug-inexistente') as inexistente_failopen;
