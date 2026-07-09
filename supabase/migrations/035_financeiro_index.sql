-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — 035: ÍNDICE P/ DASHBOARD FINANCEIRO (No Manches)
-- (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq)
--
-- /portal/no-manches/financeiro/ consulta comanda_items por
-- (espaco_slug, status faturável, created_at). O prompt original sugeria
-- um índice na tabela "orders"; neste schema o equivalente é
-- comanda_items ('delivered' incluído — legado, semântica de 'served').
--
-- RLS: nenhum policy novo é necessário — a página faz apenas SELECTs e
-- as políticas existentes já cobrem: "public_read_comanda_items" (028) e
-- "public_read_comanda" (028) permitem SELECT a anon; a página não faz
-- nenhum INSERT/UPDATE/DELETE.
--
-- Idempotente: seguro re-correr. Correr DEPOIS da 034.
-- ═══════════════════════════════════════════════════════════════════════

create index if not exists idx_comanda_items_financeiro
  on comanda_items (espaco_slug, status, created_at)
  where status in ('sent', 'preparing', 'ready', 'served', 'delivered');

-- ── Verificação ───────────────────────────────────────────────────────────
select 'financeiro 035 ok' as status,
  (select count(*) from pg_indexes
    where indexname = 'idx_comanda_items_financeiro') as financeiro_index,
  (select count(*) from pg_policies
    where tablename = 'comanda_items' and cmd = 'SELECT') as items_select_policies;
