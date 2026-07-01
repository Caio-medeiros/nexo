-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — Reset dos dados transacionais do "No Manches"
-- (slug: rest-no-manches-lisboa) no projeto kgbrtbpeekhkroibsgqq.
--
-- Zera pedidos, analytics, chamadas, fila, comandas e notificações para o
-- portal arrancar limpo numa apresentação ao dono. NÃO mexe no cliente,
-- menu, onboarding nem venue_settings — só apaga os números.
--
-- Afeta APENAS este espaço. Idempotente: seguro re-correr.
-- ═══════════════════════════════════════════════════════════════════════

do $$
declare s text := 'rest-no-manches-lisboa';
begin
  delete from portal_notifications where espaco_slug = s;
  delete from orders_log          where espaco_slug = s;
  delete from staff_calls         where espaco_slug = s;
  delete from waitlist_entries    where espaco_slug = s;
  delete from menu_events         where espaco_slug = s;
  delete from weekly_reports      where espaco_slug = s;
  delete from item_availability   where espaco_slug = s;
  -- Comandas (round system) — apaga filhos antes dos pais
  delete from comanda_voids  where espaco_slug = s;
  delete from comanda_items  where espaco_slug = s;
  delete from comanda_rounds where espaco_slug = s;
  delete from comandas       where espaco_slug = s;
  raise notice 'No Manches: dados transacionais a zero.';
end $$;

-- Verificação (tudo deve dar 0)
select 'orders_log' as tbl, count(*) from orders_log where espaco_slug='rest-no-manches-lisboa'
union all select 'menu_events',          count(*) from menu_events          where espaco_slug='rest-no-manches-lisboa'
union all select 'staff_calls',          count(*) from staff_calls          where espaco_slug='rest-no-manches-lisboa'
union all select 'waitlist_entries',     count(*) from waitlist_entries     where espaco_slug='rest-no-manches-lisboa'
union all select 'portal_notifications', count(*) from portal_notifications where espaco_slug='rest-no-manches-lisboa'
union all select 'comandas',             count(*) from comandas             where espaco_slug='rest-no-manches-lisboa';
