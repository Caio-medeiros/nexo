-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — Complete Database Setup (truly safe to run from scratch)
-- Supabase → SQL Editor → New query → paste all → Run
-- ═══════════════════════════════════════════════════════════════════════

-- ── Drop existing policies (safe even if tables don't exist yet) ──────
do $$ begin drop policy if exists "Client sees own record"          on clients;          exception when undefined_table then null; end $$;
do $$ begin drop policy if exists "Client sees own menus"           on menus;             exception when undefined_table then null; end $$;
do $$ begin drop policy if exists "Client manages own availability" on item_availability; exception when undefined_table then null; end $$;
do $$ begin drop policy if exists "Client sees own requests"        on update_requests;   exception when undefined_table then null; end $$;
do $$ begin drop policy if exists "Client creates own requests"     on update_requests;   exception when undefined_table then null; end $$;
do $$ begin drop policy if exists "Client sees own calls"           on staff_calls;       exception when undefined_table then null; end $$;
do $$ begin drop policy if exists "Client sees own referrals"       on referrals;         exception when undefined_table then null; end $$;
do $$ begin drop policy if exists "Anon can read shared cart"       on shared_cart_items; exception when undefined_table then null; end $$;
do $$ begin drop policy if exists "Anon can insert shared cart"     on shared_cart_items; exception when undefined_table then null; end $$;
do $$ begin drop policy if exists "Anon can update shared cart"     on shared_cart_items; exception when undefined_table then null; end $$;
do $$ begin drop policy if exists "Anon can delete shared cart"     on shared_cart_items; exception when undefined_table then null; end $$;

-- ── 1. Push subscriptions ─────────────────────────────────────────────
create table if not exists push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  espaco_slug  text not null,
  subscription jsonb not null,
  device_name  text,
  is_active    boolean default true
);
create index if not exists push_subscriptions_espaco_idx
  on push_subscriptions(espaco_slug, is_active);

-- ── 2. Staff calls ────────────────────────────────────────────────────
create table if not exists staff_calls (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  espaco_slug     text not null,
  table_label     text,
  delivered_count integer default 0
);
alter table staff_calls add column if not exists espaco_slug text;
create index if not exists staff_calls_espaco_idx on staff_calls(espaco_slug);

-- ── 3. Clients ────────────────────────────────────────────────────────
create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  name          text not null,
  owner_name    text,
  plan          text default 'starter',
  auth_user_id  uuid references auth.users(id),
  referral_code text
);
alter table clients add column if not exists owner_name    text;
alter table clients add column if not exists plan          text default 'starter';
alter table clients add column if not exists auth_user_id  uuid references auth.users(id);
alter table clients add column if not exists referral_code text;
create index if not exists clients_auth_user_idx on clients(auth_user_id);

-- ── 4. Menus ──────────────────────────────────────────────────────────
create table if not exists menus (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  client_id   uuid references clients(id) on delete cascade,
  slug        text unique not null,
  status      text default 'setup'
);

-- ── 5. Item availability ──────────────────────────────────────────────
create table if not exists item_availability (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  espaco_slug  text not null,
  item_id      text not null,
  available    boolean default true
);
alter table item_availability add column if not exists espaco_slug text;
alter table item_availability add column if not exists item_id     text;
alter table item_availability add column if not exists available   boolean default true;
do $$ begin
  alter table item_availability add constraint item_availability_espaco_item_key unique (espaco_slug, item_id);
exception when duplicate_table or duplicate_object or others then null; end $$;

-- ── 6. Update requests ────────────────────────────────────────────────
create table if not exists update_requests (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  completed_at timestamptz,
  client_id    uuid references clients(id) on delete cascade,
  menu_id      uuid references menus(id),
  type         text,
  description  text,
  photo_url    text,
  status       text default 'pending'
);

-- ── 7. Referrals ──────────────────────────────────────────────────────
create table if not exists referrals (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz default now(),
  referrer_client_id uuid references clients(id),
  referred_name      text,
  referred_email     text,
  status             text default 'pending'
);

-- ── 8. Shared cart items ──────────────────────────────────────────────
create table if not exists shared_cart_items (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  espaco_slug text,
  cart_code   text,
  member_name text,
  member_key  text,
  item_id     text not null,
  item_name   text,
  item_price  numeric,
  quantity    integer default 1,
  note        text
);
alter table shared_cart_items add column if not exists espaco_slug text;
alter table shared_cart_items add column if not exists cart_code   text;
create index if not exists shared_cart_espaco_idx on shared_cart_items(espaco_slug);
create index if not exists shared_cart_code_idx   on shared_cart_items(cart_code);

-- ═══════════════════════════════════════════════════════════════════════
-- ENABLE RLS
-- ═══════════════════════════════════════════════════════════════════════
alter table clients           enable row level security;
alter table menus             enable row level security;
alter table item_availability enable row level security;
alter table update_requests   enable row level security;
alter table staff_calls       enable row level security;
alter table referrals         enable row level security;
alter table shared_cart_items enable row level security;

-- ═══════════════════════════════════════════════════════════════════════
-- CREATE POLICIES
-- ═══════════════════════════════════════════════════════════════════════
create policy "Client sees own record" on clients
  for select using (auth.uid() = auth_user_id);

create policy "Client sees own menus" on menus
  for select using (
    client_id in (select id from clients where auth_user_id = auth.uid())
  );

create policy "Client manages own availability" on item_availability
  for all using (
    espaco_slug in (
      select m.slug from menus m
      join clients c on c.id = m.client_id
      where c.auth_user_id = auth.uid()
    )
  );

create policy "Client sees own requests" on update_requests
  for select using (
    client_id in (select id from clients where auth_user_id = auth.uid())
  );

create policy "Client creates own requests" on update_requests
  for insert with check (
    client_id in (select id from clients where auth_user_id = auth.uid())
  );

create policy "Client sees own calls" on staff_calls
  for select using (
    espaco_slug in (
      select m.slug from menus m
      join clients c on c.id = m.client_id
      where c.auth_user_id = auth.uid()
    )
  );

create policy "Client sees own referrals" on referrals
  for select using (
    referrer_client_id in (select id from clients where auth_user_id = auth.uid())
  );

create policy "Anon can read shared cart"   on shared_cart_items for select using (true);
create policy "Anon can insert shared cart" on shared_cart_items for insert with check (true);
create policy "Anon can update shared cart" on shared_cart_items for update using (true);
create policy "Anon can delete shared cart" on shared_cart_items for delete using (true);

-- ═══════════════════════════════════════════════════════════════════════
-- SEED: Marisca Petisca
-- ═══════════════════════════════════════════════════════════════════════

-- Remove duplicate client rows (keep the one with the most recent id)
delete from clients
where name = 'Marisca Petisca'
  and id not in (
    select id from clients where name = 'Marisca Petisca'
    order by created_at desc
    limit 1
  );

-- Insert client only if it doesn't exist yet
insert into clients (name, owner_name, plan, referral_code, auth_user_id)
select 'Marisca Petisca', 'Caio', 'growth', 'NEXO-MARISCA', null
where not exists (select 1 from clients where name = 'Marisca Petisca');

insert into menus (client_id, slug, status)
select id, 'marisca-petisca', 'live'
from   clients
where  name = 'Marisca Petisca'
limit  1
on conflict (slug) do update
  set client_id = excluded.client_id,
      status    = 'live';

-- ── Link auth_user_id by email (safe to re-run, fixes wrong UUID) ─────
update clients
set    auth_user_id = (
  select id from auth.users
  where  email = 'caio42007@gmail.com'
  limit  1
)
where  name = 'Marisca Petisca'
  and  auth_user_id is distinct from (
    select id from auth.users where email = 'caio42007@gmail.com' limit 1
  );

-- ── Verify ────────────────────────────────────────────────────────────
select c.name, c.plan, c.auth_user_id, m.slug, m.status,
       u.email,
       (c.auth_user_id = u.id) as linked_ok
from   clients c
left   join menus m on m.client_id = c.id
left   join auth.users u on u.id = c.auth_user_id;
