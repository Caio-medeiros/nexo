-- ═══════════════════════════════════════════════════════════════
-- 016 — PREMIUM FEATURES
-- Comandas, take-away, promotional banners, gift cards.
-- (Spec referenced this as "005"; renumbered to 016 — 005..015 taken.)
-- Depends on: uuid_generate_v4, update_updated_at_column(),
--             owns_espaco(), portal_notifications, orders_log.
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- COMANDA SYSTEM
-- Full table ordering with item tracking
-- ─────────────────────────────────────────

create table if not exists comandas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  espaco_slug text not null,
  table_label text not null,
  session_code text unique not null,
  status text check (status in (
    'open',       -- accepting items
    'submitted',  -- sent to kitchen
    'preparing',  -- kitchen acknowledged
    'ready',      -- all items done
    'closed',     -- paid/finished
    'cancelled'
  )) default 'open',
  mode text check (mode in (
    'dine_in', 'take_away'
  )) default 'dine_in',
  pickup_time timestamptz,
  guest_count integer default 1,
  total numeric(10,2) default 0,
  notes text,
  submitted_at timestamptz,
  closed_at timestamptz
);

create index if not exists comandas_slug_idx
  on comandas(espaco_slug, created_at desc);
create index if not exists comandas_status_idx
  on comandas(espaco_slug, status);
create index if not exists comandas_code_idx
  on comandas(session_code);

-- Items within a comanda
create table if not exists comanda_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  comanda_id uuid references comandas(id)
    on delete cascade,
  espaco_slug text not null,
  item_id text,
  item_name text not null,
  item_category text,
  item_price numeric(10,2) default 0,
  quantity integer default 1 check (quantity > 0),
  notes text,
  added_by text check (added_by in (
    'customer', 'staff'
  )) default 'customer',
  status text check (status in (
    'pending',    -- waiting to be prepared
    'preparing',  -- kitchen started
    'ready',      -- ready to serve
    'delivered',  -- served to table
    'cancelled'
  )) default 'pending',
  round_number integer default 1
);

create index if not exists comanda_items_comanda_idx
  on comanda_items(comanda_id, status);

-- Auto-generate session code (e.g. AB12-CD34)
create or replace function generate_session_code()
returns trigger as $$
begin
  new.session_code := upper(
    substr(md5(random()::text), 1, 4) || '-' ||
    substr(md5(clock_timestamp()::text), 1, 4)
  );
  return new;
end;
$$ language plpgsql;

drop trigger if exists comandas_session_code on comandas;
create trigger comandas_session_code
  before insert on comandas
  for each row execute function
  generate_session_code();

-- Update comanda total when items change
create or replace function update_comanda_total()
returns trigger as $$
begin
  update comandas set
    total = (
      select coalesce(sum(item_price * quantity), 0)
      from comanda_items
      where comanda_id = coalesce(new.comanda_id,
                                  old.comanda_id)
      and status != 'cancelled'
    ),
    updated_at = now()
  where id = coalesce(new.comanda_id, old.comanda_id);
  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists comanda_items_update_total on comanda_items;
create trigger comanda_items_update_total
  after insert or update or delete on comanda_items
  for each row execute function update_comanda_total();

-- Update timestamps
drop trigger if exists comandas_updated_at on comandas;
create trigger comandas_updated_at
  before update on comandas
  for each row execute function update_updated_at_column();

drop trigger if exists comanda_items_updated_at on comanda_items;
create trigger comanda_items_updated_at
  before update on comanda_items
  for each row execute function update_updated_at_column();

-- Portal notification on new comanda submission
create or replace function notify_comanda_submitted()
returns trigger as $$
begin
  if new.status = 'submitted' and
     old.status = 'open' then
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
$$ language plpgsql;

drop trigger if exists comandas_notify_submitted on comandas;
create trigger comandas_notify_submitted
  after update on comandas
  for each row execute function notify_comanda_submitted();

-- ─────────────────────────────────────────
-- TAKEAWAY ORDERS (extends orders_log)
-- ─────────────────────────────────────────
alter table orders_log
  add column if not exists is_takeaway boolean
    default false,
  add column if not exists pickup_time timestamptz,
  add column if not exists comanda_id uuid
    references comandas(id);

-- ─────────────────────────────────────────
-- PROMOTIONAL BANNERS
-- ─────────────────────────────────────────
create table if not exists menu_banners (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  espaco_slug text not null,
  title text not null,
  subtitle text,
  bg_color text default '#F59E0B',
  text_color text default '#0A0A0A',
  link_item_id text,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  is_active boolean default true,
  display_order integer default 0
);

create index if not exists menu_banners_slug_idx
  on menu_banners(espaco_slug, is_active);

-- ─────────────────────────────────────────
-- GIFT CARDS
-- ─────────────────────────────────────────
create table if not exists gift_cards (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  espaco_slug text not null,
  code text unique not null,
  value numeric(10,2) not null,
  remaining_value numeric(10,2) not null,
  buyer_name text,
  buyer_email text,
  recipient_name text,
  recipient_email text,
  message text,
  stripe_session_id text,
  status text check (status in (
    'active', 'partially_used',
    'fully_used', 'expired', 'cancelled'
  )) default 'active',
  expires_at timestamptz default
    (now() + interval '1 year'),
  used_at timestamptz
);

create index if not exists gift_cards_slug_idx
  on gift_cards(espaco_slug, status);
create index if not exists gift_cards_code_idx
  on gift_cards(code);

-- Auto generate gift card code
create or replace function generate_gift_card_code()
returns trigger as $$
begin
  new.code := 'NEXO-' || upper(
    substr(md5(random()::text ||
              now()::text), 1, 8)
  );
  return new;
end;
$$ language plpgsql;

drop trigger if exists gift_cards_code_trigger on gift_cards;
create trigger gift_cards_code_trigger
  before insert on gift_cards
  for each row execute function
  generate_gift_card_code();

-- ─────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────
alter table comandas enable row level security;
alter table comanda_items enable row level security;
alter table menu_banners enable row level security;
alter table gift_cards enable row level security;

-- Public: menu can create/join comandas
drop policy if exists "public_insert_comanda" on comandas;
create policy "public_insert_comanda" on comandas
  for insert with check (true);
drop policy if exists "public_read_comanda" on comandas;
create policy "public_read_comanda" on comandas
  for select using (true);
drop policy if exists "public_update_comanda" on comandas;
create policy "public_update_comanda" on comandas
  for update using (true);

drop policy if exists "public_insert_comanda_items" on comanda_items;
create policy "public_insert_comanda_items"
  on comanda_items for insert with check (true);
drop policy if exists "public_read_comanda_items" on comanda_items;
create policy "public_read_comanda_items"
  on comanda_items for select using (true);
drop policy if exists "public_update_comanda_items" on comanda_items;
create policy "public_update_comanda_items"
  on comanda_items for update using (true);

-- Portal: client sees own data
drop policy if exists "owns_menu_banners" on menu_banners;
create policy "owns_menu_banners" on menu_banners
  for all using (owns_espaco(espaco_slug));
drop policy if exists "owns_gift_cards" on gift_cards;
create policy "owns_gift_cards" on gift_cards
  for all using (owns_espaco(espaco_slug));

-- Banners: public read for menu
drop policy if exists "public_read_banners" on menu_banners;
create policy "public_read_banners" on menu_banners
  for select using (true);

-- ─────────────────────────────────────────
-- GRANTS (anon/authenticated need table access; RLS still applies)
-- ─────────────────────────────────────────
grant select, insert, update on comandas to anon, authenticated;
grant select, insert, update on comanda_items to anon, authenticated;
grant select on menu_banners to anon, authenticated;
grant all on menu_banners to authenticated;
grant all on gift_cards to authenticated;

-- ─────────────────────────────────────────
-- Realtime
-- ─────────────────────────────────────────
do $$ begin alter publication supabase_realtime add table comandas;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table comanda_items;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table menu_banners;
exception when duplicate_object then null; end $$;
