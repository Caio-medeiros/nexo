-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — 033: fechar as políticas públicas de UPDATE/DELETE das comandas
-- (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq)
--
-- PROBLEMA: as políticas de 016/020 ficaram `for update using (true)` —
-- qualquer pessoa com o anon key (público por definição) podia alterar
-- QUALQUER comanda/item/ronda de QUALQUER restaurante: mudar preços e
-- quantidades de itens já enviados, cancelar itens, fechar/reabrir
-- comandas, marcar rondas como feitas.
--
-- O menu anónimo só precisa de:
--   • editar itens AINDA PENDENTES (qty/nota) e removê-los;
--   • disparar uma ronda (pending → sent + round_id);
--   • marcar a comanda open→submitted.
-- Cozinha/Sala correm AUTENTICADAS e usam as políticas portal_* da 028
-- (owns_espaco) — nada muda para elas.
--
-- BÓNUS: comanda_items nunca teve política de DELETE — o "remover item
-- pendente" do menu apagava 0 linhas em silêncio. Fica aqui a política.
--
-- Idempotente: seguro re-correr. Correr DEPOIS da 028.
-- ═══════════════════════════════════════════════════════════════════════

-- ── comandas: anon só gere o ciclo aberto (nunca fecha/cancela/reabre) ────
drop policy if exists "public_update_comanda" on comandas;
create policy "public_update_comanda"
  on comandas for update
  using (status in ('open', 'submitted', 'preparing', 'ready'))
  with check (
    status in ('open', 'submitted')
    and char_length(table_label) <= 50
    and coalesce(guest_count, 1) between 1 and 100
    and coalesce(total, 0) >= 0
    and coalesce(total, 0) < 10000
  );

-- ── comanda_items: anon só toca em itens pendentes de comandas abertas ────
-- Transições permitidas: editar pendente (fica pending) e disparar ronda
-- (pending → sent + round_id). Itens sent/ready/served/cancelled ficam
-- intocáveis para anon (preço/estado não pode ser falsificado à posteriori).
drop policy if exists "public_update_comanda_items" on comanda_items;
create policy "public_update_comanda_items"
  on comanda_items for update
  using (
    status = 'pending'
    and round_id is null
    and exists (
      select 1 from comandas c
      where c.id = comanda_id
        and c.status in ('open', 'submitted', 'preparing', 'ready')
    )
  )
  with check (
    status in ('pending', 'sent')
    and quantity between 1 and 50
    and item_price >= 0
    and item_price < 1000
    and char_length(coalesce(notes, '')) <= 500
    and char_length(item_name) <= 200
  );

-- DELETE: só itens pendentes (não enviados) de comandas ainda abertas.
drop policy if exists "public_delete_pending_items" on comanda_items;
create policy "public_delete_pending_items"
  on comanda_items for delete
  using (
    status = 'pending'
    and round_id is null
    and exists (
      select 1 from comandas c
      where c.id = comanda_id
        and c.status in ('open', 'submitted', 'preparing', 'ready')
    )
  );
grant delete on comanda_items to anon, authenticated;

-- ── comanda_rounds: o menu só INSERE e LÊ rondas; ack/done é da cozinha
--    (autenticada, política portal_update_round da 028). Remover o update
--    público resolve "qualquer pessoa marca rondas como done".
drop policy if exists "public_update_round" on comanda_rounds;

-- ── shared_cart_items (só o menu demo antigo usa): manter a semântica
--    aberta que a feature exige, mas com tectos de tamanho/valores para
--    impedir lixo arbitrário.
drop policy if exists "Anon can insert shared cart" on shared_cart_items;
create policy "Anon can insert shared cart"
  on shared_cart_items for insert
  with check (
    coalesce(quantity, 1) between 1 and 50
    and coalesce(item_price, 0) >= 0
    and coalesce(item_price, 0) < 1000
    and char_length(coalesce(item_name, ''))   <= 200
    and char_length(coalesce(member_name, '')) <= 60
    and char_length(coalesce(note, ''))        <= 500
    and char_length(coalesce(cart_code, ''))   <= 32
    and char_length(coalesce(espaco_slug, '')) <= 100
  );

drop policy if exists "Anon can update shared cart" on shared_cart_items;
create policy "Anon can update shared cart"
  on shared_cart_items for update
  using (true)
  with check (
    coalesce(quantity, 1) between 1 and 50
    and coalesce(item_price, 0) >= 0
    and coalesce(item_price, 0) < 1000
    and char_length(coalesce(item_name, ''))   <= 200
    and char_length(coalesce(member_name, '')) <= 60
    and char_length(coalesce(note, ''))        <= 500
  );

-- ── Verificação ───────────────────────────────────────────────────────────
select 'scope public updates 033 ok' as status,
  (select count(*) from pg_policies
    where tablename = 'comanda_items' and cmd = 'DELETE')          as items_delete_policies,
  (select count(*) from pg_policies
    where tablename = 'comanda_rounds' and cmd = 'UPDATE')         as rounds_update_policies,
  (select count(*) from pg_policies
    where tablename = 'comandas' and policyname = 'public_update_comanda') as comanda_update_policy;
