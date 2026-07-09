-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — 034: PEDIDO ASSISTIDO (No Manches)
-- (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq)
--
-- Fluxo: em venues com CONFIG.VENUE_TYPE='assisted', o cliente NÃO dispara
-- a ronda directamente. Os itens entram em comanda_items com
-- status='awaiting_staff' e SEM round_id — invisíveis para a cozinha
-- (que só lê comanda_rounds). O staff confirma no portal: cria a ronda
-- (fired_by='staff'), passa os itens a 'sent' e a comanda a 'submitted'.
--
-- O prompt original referia uma tabela "orders" com status TEXT livre;
-- neste schema o equivalente é comanda_items, cujo status TEM check
-- constraint (020) — daí esta migração ser obrigatória antes de qualquer
-- INSERT com 'awaiting_staff'.
--
-- Venues sem VENUE_TYPE (Marisca etc.): nada muda — nenhum código escreve
-- 'awaiting_staff' e todas as políticas existentes mantêm a semântica.
--
-- Idempotente: seguro re-correr. Correr DEPOIS da 033.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. comanda_items.status: permitir 'awaiting_staff' ────────────────────
alter table comanda_items
  drop constraint if exists comanda_items_status_check;
alter table comanda_items
  add constraint comanda_items_status_check check (
    status in (
      'pending',        -- in cart, not fired
      'awaiting_staff', -- assisted: aguarda confirmação do staff (sem round)
      'sent',           -- fired to kitchen (has round_id)
      'preparing',      -- kitchen started
      'ready',          -- ready to serve
      'delivered',      -- legacy: served to table
      'served',         -- served to table
      'cancelled'       -- voided
    )
  );

-- ── 2. Índice parcial p/ o painel "Mesas a confirmar" do portal ────────────
create index if not exists idx_comanda_items_awaiting
  on comanda_items (espaco_slug, status, created_at)
  where status = 'awaiting_staff';

-- ── 3. Cliente (anon) pode desistir/editar o pedido em espera ─────────────
-- "Editar pedido" no menu apaga os itens awaiting (nunca vistos pela
-- cozinha) e devolve-os ao carrinho local. Mesma semântica da política
-- da 033 ("só itens não enviados"), agora incluindo awaiting_staff.
drop policy if exists "public_delete_pending_items" on comanda_items;
create policy "public_delete_pending_items"
  on comanda_items for delete
  using (
    status in ('pending', 'awaiting_staff')
    and round_id is null
    and exists (
      select 1 from comandas c
      where c.id = comanda_id
        and c.status in ('open', 'submitted', 'preparing', 'ready')
    )
  );

-- ── 4. Staff (autenticado, dono do espaço) pode remover itens ─────────────
-- O drawer de confirmação permite remover itens do pedido em espera.
-- Até aqui só existia a política pública (status pendente); esta cobre o
-- portal com owns_espaco, alinhada com portal_update_comanda_items (028).
drop policy if exists "portal_delete_comanda_items" on comanda_items;
create policy "portal_delete_comanda_items"
  on comanda_items for delete
  to authenticated
  using (
    exists (select 1 from comandas c
            where c.id = comanda_id and owns_espaco(c.espaco_slug))
  );

-- ── Verificação ───────────────────────────────────────────────────────────
select 'assisted ordering 034 ok' as status,
  (select count(*) from pg_indexes
    where indexname = 'idx_comanda_items_awaiting')                as awaiting_index,
  (select count(*) from pg_policies
    where tablename = 'comanda_items' and cmd = 'DELETE')          as items_delete_policies;
