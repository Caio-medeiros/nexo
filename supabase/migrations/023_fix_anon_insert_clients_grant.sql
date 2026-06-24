-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — 023 HOTFIX: anonymous menu writes broken by 021/022
-- Projeto dos menus+portal: kgbrtbpeekhkroibsgqq — correr no SQL Editor.
--
-- SINTOMA: o menu não escreve no Supabase (eventos/pedidos/chamadas a 0 no
-- portal). Os INSERT anónimos devolvem 401:
--   42501 · "permission denied for table clients"
--   hint: GRANT SELECT ON public.clients TO anon
--
-- CAUSA: as políticas de INSERT da 021/022 usavam
--   with check (exists (select 1 from menus where slug = espaco_slug))
-- Quando o papel `anon` avalia esse subquery, o RLS de `menus` encadeia para
-- `clients` (a política "Client sees own menus" lê clients). O `anon` não tem
-- GRANT em clients → erro 42501 ANTES de o RLS sequer decidir.
--
-- CORREÇÃO (mínima, mantém o endurecimento): validar o slug através de uma
-- função SECURITY DEFINER (corre como dono → lê menus sem precisar de grants
-- no anon). NÃO expõe a tabela clients ao anon.
--
-- Idempotente: seguro re-correr.
-- ═══════════════════════════════════════════════════════════════════════

-- ── Helper: existe um menu com este slug? (corre como dono) ──────────────
create or replace function menu_slug_exists(p_slug text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from menus where slug = p_slug);
$$;

grant execute on function menu_slug_exists(text) to anon, authenticated;

-- ── Recriar as políticas de INSERT público usando o helper ───────────────
-- (mesmas validações da 021/022, só troca o subquery inline pelo helper)

-- menu_events
drop policy if exists "public_insert_menu_events" on menu_events;
create policy "public_insert_menu_events"
  on menu_events for insert
  with check (
    menu_slug_exists(espaco_slug)
    and char_length(coalesce(event_name, '')) <= 100
    and char_length(coalesce(item_name, '')) <= 200
    and char_length(coalesce(session_id, '')) <= 64
    and coalesce(item_price, 0) >= 0
    and coalesce(order_total, 0) >= 0
  );

-- staff_calls
drop policy if exists "public_insert_staff_calls" on staff_calls;
create policy "public_insert_staff_calls"
  on staff_calls for insert
  with check (
    menu_slug_exists(espaco_slug)
    and char_length(coalesce(table_label, '')) <= 50
  );

-- orders_log
drop policy if exists "public_insert_orders" on orders_log;
create policy "public_insert_orders"
  on orders_log for insert
  with check (
    menu_slug_exists(espaco_slug)
    and total >= 0
    and total < 10000
    and member_count >= 1
    and member_count <= 50
    and jsonb_array_length(items) > 0
    and jsonb_array_length(items) <= 50
  );

-- comandas
drop policy if exists "public_insert_comanda" on comandas;
create policy "public_insert_comanda"
  on comandas for insert
  with check (
    menu_slug_exists(espaco_slug)
    and char_length(table_label) <= 50
    and guest_count >= 1
    and guest_count <= 100
  );

-- waitlist_entries
drop policy if exists "public_insert_waitlist" on waitlist_entries;
create policy "public_insert_waitlist"
  on waitlist_entries for insert
  with check (
    menu_slug_exists(espaco_slug)
    and status = 'waiting'
    and party_size >= 1
    and party_size <= 30
    and char_length(coalesce(name, '')) <= 100
    and char_length(coalesce(phone, '')) <= 20
  );

-- order_flags (022)
drop policy if exists "public_insert_order_flags" on order_flags;
create policy "public_insert_order_flags"
  on order_flags for insert
  with check (
    menu_slug_exists(espaco_slug)
    and char_length(coalesce(session_id, '')) <= 64
    and char_length(coalesce(table_label, '')) <= 50
  );

-- menu_banners: leitura pública (anon) também encadeava para clients via o
-- mesmo exists(menus). Recriar com o helper.
drop policy if exists "public_read_banners" on menu_banners;
create policy "public_read_banners"
  on menu_banners for select
  using (is_active = true and menu_slug_exists(espaco_slug));

-- (comanda_items não precisa de correção: valida via `comandas`, que tem
--  leitura pública — não encadeia para clients.)

-- ── Verificação: este INSERT deve passar agora (anon) ────────────────────
-- Testar no API (anon key) ou aqui como verificação de sintaxe:
-- insert into menu_events (espaco_slug, event_name, session_id, language)
--   values ('marisca-petisca', '__diag__', 'diag', 'pt');
-- delete from menu_events where session_id = 'diag';
