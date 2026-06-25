-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — 028: Sala em Directo — políticas SELECT para o portal autenticado
-- Projeto dos menus+portal: kgbrtbpeekhkroibsgqq — correr no SQL Editor.
--
-- SINTOMA: a Sala em Directo mostra 0 mesas / não recebe pedidos do menu.
--   • loadActiveComandas() pode retornar [] mesmo com comandas abertas.
--   • loadTodayStats() retorna 0 pedidos e 0 chamadas.
--   • Realtime de `comandas` pode não entregar eventos ao portal autenticado
--     se a política SELECT não cobre o utilizador ou a tabela não está na
--     publicação correcta.
--
-- CAUSA RAIZ: as migrações anteriores criaram políticas de INSERT mas não
-- confirmaram SELECT explícito para o utilizador autenticado do portal em
-- todas as tabelas necessárias. As políticas "using (true)" em comandas/
-- comanda_items/comanda_rounds são públicas mas podem não ter been applied.
--
-- CORREÇÃO: recriar/confirmar as políticas SELECT usando owns_espaco()
-- (SECURITY DEFINER) para as tabelas que a Sala lê e recebe realtime.
-- Idempotente: seguro re-correr.
-- ═══════════════════════════════════════════════════════════════════════

-- ── comandas: SELECT público (menu e sala precisam) ──────────────────────
drop policy if exists "public_read_comanda" on comandas;
create policy "public_read_comanda"
  on comandas for select using (true);

-- UPDATE por utilizador autenticado dono do espaço (Sala cobra, fecha, etc.)
drop policy if exists "portal_update_comanda" on comandas;
create policy "portal_update_comanda"
  on comandas for update
  using (owns_espaco(espaco_slug))
  with check (owns_espaco(espaco_slug));

-- ── comanda_items: SELECT público (menu rastreia estado, sala lê) ─────────
drop policy if exists "public_read_comanda_items" on comanda_items;
create policy "public_read_comanda_items"
  on comanda_items for select using (true);

-- UPDATE por dono (Sala pode marcar itens como prontos/cancelados)
drop policy if exists "portal_update_comanda_items" on comanda_items;
create policy "portal_update_comanda_items"
  on comanda_items for update
  using (
    exists (select 1 from comandas c where c.id = comanda_id and owns_espaco(c.espaco_slug))
  );

-- ── comanda_rounds: SELECT público (menu e sala) ──────────────────────────
drop policy if exists "public_read_round" on comanda_rounds;
create policy "public_read_round"
  on comanda_rounds for select using (true);

-- UPDATE por dono (Sala pode marcar rondas como done)
drop policy if exists "portal_update_round" on comanda_rounds;
create policy "portal_update_round"
  on comanda_rounds for update
  using (
    exists (select 1 from comandas c where c.id = comanda_id and owns_espaco(c.espaco_slug))
  );

-- ── orders_log: SELECT apenas para o dono (autenticado) ──────────────────
-- A política existente (001) usa subquery inline que pode falhar se
-- authenticated não tiver GRANT em clients. Recriar usando owns_espaco.
drop policy if exists "portal_orders_select" on orders_log;
create policy "portal_orders_select"
  on orders_log for select
  using (owns_espaco(espaco_slug));

-- ── staff_calls: SELECT apenas para o dono ───────────────────────────────
drop policy if exists "portal_staff_calls_select" on staff_calls;
create policy "portal_staff_calls_select"
  on staff_calls for select
  using (owns_espaco(espaco_slug));

-- ── GRANTS explícitos ─────────────────────────────────────────────────────
grant select, insert, update on comandas to anon, authenticated;
grant select, insert, update on comanda_items to anon, authenticated;
grant select, insert, update on comanda_rounds to anon, authenticated;
grant select on orders_log to authenticated;
grant select on staff_calls to authenticated;
grant select on venue_settings to anon, authenticated;

-- ── Realtime: confirmar que todas as tabelas necessárias estão na publicação
do $$ begin alter publication supabase_realtime add table comandas;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table comanda_items;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table comanda_rounds;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table orders_log;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table staff_calls;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table venue_settings;
exception when duplicate_object then null; end $$;

-- ── Verificação ───────────────────────────────────────────────────────────
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('comandas','comanda_items','comanda_rounds','orders_log','staff_calls','venue_settings')
order by tablename;
