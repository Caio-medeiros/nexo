-- ═══════════════════════════════════════════════════════════════
-- 020 — COMANDA ROUNDS
-- Each "fire to kitchen" creates one round. Kitchen only sees the
-- new items per round, never the running total.
-- (Spec referenced this as "007"; renumbered to 020 — 007..019 taken.)
-- Depends on 016 (comandas, comanda_items), owns_espaco(),
--            update_updated_at_column(). Uses gen_random_uuid()
--            to match 016 (not uuid_generate_v4).
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- COMANDA ROUNDS
-- ─────────────────────────────────────────
create table if not exists comanda_rounds (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  comanda_id uuid not null
    references comandas(id) on delete cascade,
  espaco_slug text not null,
  round_number integer not null,
  fired_at timestamptz default now(),
  fired_by text check (fired_by in (
    'customer', 'staff'
  )) default 'customer',
  item_count integer default 0,
  status text check (status in (
    'fired',        -- sent to kitchen
    'acknowledged', -- kitchen saw it
    'done'          -- all items in round ready
  )) default 'fired',

  unique(comanda_id, round_number)
);

create index if not exists comanda_rounds_comanda_idx
  on comanda_rounds(comanda_id);
create index if not exists comanda_rounds_slug_idx
  on comanda_rounds(espaco_slug, fired_at desc);

-- ─────────────────────────────────────────
-- UPDATE comanda_items
-- Add round tracking + void info + course + served_at.
-- Also extend the status enum: the rounds engine writes
-- 'sent' (on fire) and 'served' (on serve), which the
-- original 016 CHECK did not allow.
-- ─────────────────────────────────────────
alter table comanda_items
  add column if not exists round_id uuid
    references comanda_rounds(id),
  add column if not exists course text check (
    course in (
      'entrada',    -- Starters
      'principal',  -- Mains
      'sobremesa',  -- Desserts
      'bebida',     -- Drinks
      'outro'       -- Other
    )
  ) default 'principal',
  add column if not exists void_reason text check (
    void_reason in (
      'erro_pedido',      -- Wrong order
      'cliente_desistiu', -- Customer changed mind
      'produto_esgotado', -- Out of stock
      'duplicado',        -- Duplicate item
      'outro'             -- Other
    )
  ),
  add column if not exists void_at timestamptz,
  add column if not exists void_by text check (
    void_by in ('customer', 'staff')
  ),
  add column if not exists served_at timestamptz;

create index if not exists comanda_items_round_idx
  on comanda_items(round_id);

-- Extend status enum to include 'sent' and 'served'
-- (keep 'delivered' for backward compatibility).
alter table comanda_items
  drop constraint if exists comanda_items_status_check;
alter table comanda_items
  add constraint comanda_items_status_check check (
    status in (
      'pending',    -- in cart, not fired
      'sent',       -- fired to kitchen (has round_id)
      'preparing',  -- kitchen started
      'ready',      -- ready to serve
      'delivered',  -- legacy: served to table
      'served',     -- served to table
      'cancelled'   -- voided
    )
  );

-- ─────────────────────────────────────────
-- VOID NOTIFICATIONS
-- Separate from regular notifications. Kitchen must see
-- voids immediately.
-- ─────────────────────────────────────────
create table if not exists comanda_voids (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  comanda_id uuid not null
    references comandas(id),
  espaco_slug text not null,
  item_id uuid not null
    references comanda_items(id),
  item_name text not null,
  quantity integer not null,
  table_label text not null,
  void_reason text not null,
  acknowledged boolean default false,
  acknowledged_at timestamptz
);

create index if not exists comanda_voids_slug_idx
  on comanda_voids(espaco_slug, created_at desc);
create index if not exists comanda_voids_unread_idx
  on comanda_voids(espaco_slug, acknowledged)
  where acknowledged = false;

-- ─────────────────────────────────────────
-- AUTO-UPDATE round item count + auto-mark round done
-- ─────────────────────────────────────────
create or replace function update_round_item_count()
returns trigger as $$
begin
  if coalesce(new.round_id, old.round_id) is not null
  then
    update comanda_rounds set
      item_count = (
        select count(*) from comanda_items
        where round_id = coalesce(new.round_id,
                                   old.round_id)
        and status != 'cancelled'
      ),
      status = case
        when (
          select count(*) from comanda_items
          where round_id = coalesce(new.round_id,
                                     old.round_id)
          and status not in ('ready', 'served',
                              'delivered', 'cancelled')
        ) = 0 then 'done'
        else status
      end
    where id = coalesce(new.round_id, old.round_id);
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists comanda_items_update_round on comanda_items;
create trigger comanda_items_update_round
  after insert or update or delete on comanda_items
  for each row execute function
  update_round_item_count();

-- ─────────────────────────────────────────
-- VOID creates a void notification
-- SECURITY DEFINER so the trigger insert into comanda_voids
-- succeeds regardless of the voiding role's RLS.
-- ─────────────────────────────────────────
create or replace function create_void_notification()
returns trigger as $$
declare
  comanda_rec record;
begin
  -- Only when item is cancelled AND was already sent
  if new.status = 'cancelled'
     and old.status != 'cancelled'
     and old.round_id is not null
  then
    select table_label, espaco_slug
    into comanda_rec
    from comandas
    where id = new.comanda_id;

    insert into comanda_voids(
      comanda_id, espaco_slug, item_id,
      item_name, quantity, table_label,
      void_reason
    ) values (
      new.comanda_id,
      new.espaco_slug,
      new.id,
      new.item_name,
      new.quantity,
      coalesce(comanda_rec.table_label, '—'),
      coalesce(new.void_reason, 'outro')
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists comanda_items_void_notify on comanda_items;
create trigger comanda_items_void_notify
  after update on comanda_items
  for each row execute function
  create_void_notification();

-- ─────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────
alter table comanda_rounds enable row level security;
alter table comanda_voids enable row level security;

-- Public: menu (anon) can create + read + advance rounds
drop policy if exists "public_insert_round" on comanda_rounds;
create policy "public_insert_round"
  on comanda_rounds for insert with check (true);
drop policy if exists "public_read_round" on comanda_rounds;
create policy "public_read_round"
  on comanda_rounds for select using (true);
drop policy if exists "public_update_round" on comanda_rounds;
create policy "public_update_round"
  on comanda_rounds for update using (true);

-- Portal: own data only (voids are portal-only)
drop policy if exists "owns_comanda_voids" on comanda_voids;
create policy "owns_comanda_voids"
  on comanda_voids
  for all using (owns_espaco(espaco_slug));

-- ─────────────────────────────────────────
-- GRANTS (anon menu needs delete on items for pending removal;
-- 016 only granted select/insert/update)
-- ─────────────────────────────────────────
grant select, insert, update on comanda_rounds to anon, authenticated;
grant delete on comanda_items to anon, authenticated;
grant select, insert, update on comanda_voids to authenticated;

-- ─────────────────────────────────────────
-- Realtime
-- ─────────────────────────────────────────
do $$ begin alter publication supabase_realtime add table comanda_rounds;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table comanda_voids;
exception when duplicate_object then null; end $$;
