-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — Reset dos dados do cliente demo "Marisca Petisca" (slug:
-- marisca-petisca) no projeto kgbrtbpeekhkroibsgqq.
--
-- Apaga TODOS os dados transacionais para o portal arrancar do zero numa
-- apresentação ao dono do espaço (pedidos, analytics, chamadas, fila,
-- notificações, relatórios, disponibilidade). NÃO mexe no cliente, menu nem
-- onboarding — só zera os números.
--
-- Idempotente: seguro re-correr.
-- ═══════════════════════════════════════════════════════════════════════

do $$
declare s text := 'marisca-petisca';
begin
  delete from portal_notifications where espaco_slug = s;
  delete from orders_log          where espaco_slug = s;
  delete from staff_calls         where espaco_slug = s;
  delete from waitlist_entries    where espaco_slug = s;
  delete from menu_events         where espaco_slug = s;
  delete from weekly_reports      where espaco_slug = s;
  delete from item_availability   where espaco_slug = s;
  raise notice 'Marisca Petisca: dados transacionais a zero.';
end $$;

-- Verificação (tudo deve dar 0)
select 'orders_log' as tbl, count(*) from orders_log where espaco_slug='marisca-petisca'
union all select 'menu_events',         count(*) from menu_events         where espaco_slug='marisca-petisca'
union all select 'staff_calls',         count(*) from staff_calls         where espaco_slug='marisca-petisca'
union all select 'waitlist_entries',    count(*) from waitlist_entries    where espaco_slug='marisca-petisca'
union all select 'portal_notifications',count(*) from portal_notifications where espaco_slug='marisca-petisca'
union all select 'weekly_reports',      count(*) from weekly_reports      where espaco_slug='marisca-petisca'
union all select 'item_availability',   count(*) from item_availability   where espaco_slug='marisca-petisca';
