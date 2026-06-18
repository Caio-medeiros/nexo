-- ═══════════════════════════════════════════════════════════════
-- 019 — HOTFIX: notify_comanda_submitted as SECURITY DEFINER
-- Same problem 008 fixed for the other notify triggers: the trigger
-- inserts into portal_notifications, but runs as the caller. When the
-- MENU (anon) submits a comanda (open→submitted), anon has no insert
-- on portal_notifications → 42501 / 401 and the submit FAILS, so the
-- order never reaches Cozinha/Caixa.
-- Fix: recreate the function as SECURITY DEFINER (runs as owner). The
-- existing trigger picks up the new definition automatically.
-- Idempotent.
-- ═══════════════════════════════════════════════════════════════

create or replace function notify_comanda_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'submitted' and old.status = 'open' then
    insert into portal_notifications(
      espaco_slug, type, title, body,
      reference_id, reference_table
    ) values (
      new.espaco_slug, 'order_new',
      '🍽️ Comanda — ' || new.table_label,
      '€' || new.total::text || ' · ' ||
        (select count(*) from comanda_items
         where comanda_id = new.id
         and status != 'cancelled')::text || ' itens',
      new.id, 'comandas'
    );
  end if;
  return new;
end;
$$;
