-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — 021 Security Hardening
-- Production hardening: RLS audit, owns_espaco input validation, rate-limit
-- + security audit tables, and TIGHT public-insert policies on menu tables.
--
-- Safe to re-run (idempotent: drop policy if exists / create or replace /
-- create table if not exists / alter table if exists).
--
-- NOTE on divergences from the original spec (adapted to the real schema):
--   • `clients` has no status='active' value (it uses 'churned'/'suspended',
--     and may be NULL for healthy clients). Filtering owns_espaco on status
--     would silently break RLS + Realtime for legitimate owners, so the
--     contract kill-switch stays at the app layer (portal.js contractActive).
--   • waitlist_entries uses columns name/phone (not guest_name/guest_phone)
--     and requires status='waiting'.
--   • The old loose insert policies (anon_insert_orders_log,
--     anon_insert_staff_calls, anon_join_waitlist, public_insert_*) are
--     DROPPED by their real names — permissive policies OR together, so a new
--     strict policy is useless while a `with check (true)` one survives.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 0. ENABLE RLS ON EVERY PUBLIC TABLE
-- (idempotent; if exists guards tables that may not be in every project)
-- ─────────────────────────────────────────
alter table if exists clients              enable row level security;
alter table if exists menus                enable row level security;
alter table if exists onboarding           enable row level security;
alter table if exists orders_log           enable row level security;
alter table if exists staff_calls          enable row level security;
alter table if exists push_subscriptions   enable row level security;
alter table if exists update_requests      enable row level security;
alter table if exists referrals            enable row level security;
alter table if exists shared_cart_items    enable row level security;
alter table if exists item_availability    enable row level security;
alter table if exists waitlist_entries     enable row level security;
alter table if exists waitlist_settings    enable row level security;
alter table if exists menu_overrides       enable row level security;
alter table if exists menu_events          enable row level security;
alter table if exists weekly_reports       enable row level security;
alter table if exists portal_notifications enable row level security;
alter table if exists menu_change_requests enable row level security;
alter table if exists comandas             enable row level security;
alter table if exists comanda_items        enable row level security;
alter table if exists comanda_rounds       enable row level security;
alter table if exists comanda_voids        enable row level security;
alter table if exists menu_banners         enable row level security;
alter table if exists gift_cards           enable row level security;
alter table if exists guest_profiles       enable row level security;
alter table if exists venue_settings       enable row level security;

-- ─────────────────────────────────────────
-- 1. HARDEN owns_espaco()
-- Adds input validation (null/empty/slug-shape/auth) on top of the existing
-- ownership join. Keeps SECURITY DEFINER + locked search_path. Does NOT add a
-- client.status filter (see header note) to avoid locking out valid owners.
-- This runs in migration 021 (last), so it wins over earlier definitions.
-- ─────────────────────────────────────────
create or replace function owns_espaco(slug text)
returns boolean as $$
begin
  -- Reject null / empty slugs
  if slug is null or trim(slug) = '' then
    return false;
  end if;

  -- Valid slugs are lowercase letters, numbers and hyphens only.
  -- Rejects any injection-shaped input before it reaches the join.
  if slug !~ '^[a-z0-9\-]+$' then
    return false;
  end if;

  -- Must be authenticated
  if auth.uid() is null then
    return false;
  end if;

  return exists (
    select 1 from menus m
    join clients c on c.id = m.client_id
    where m.slug = slug
      and c.auth_user_id = auth.uid()
  );
end;
$$ language plpgsql security definer stable
   set search_path = public;

-- ─────────────────────────────────────────
-- 2. RATE LIMIT LOG (free, Supabase-based)
-- Public can insert (the menu records events); nobody can read (no
-- enumeration). Client-side limiter is the first line; this is the audit/
-- server-side trail.
-- ─────────────────────────────────────────
create table if not exists rate_limit_log (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  session_id  text not null,
  event_type  text not null check (event_type in (
    'staff_call',
    'order_submit',
    'waitlist_join',
    'comanda_create',
    'review_click'
  )),
  espaco_slug text not null,
  ip_hint     text
);

create index if not exists rate_limit_session_idx
  on rate_limit_log(session_id, event_type, created_at desc);
create index if not exists rate_limit_cleanup_idx
  on rate_limit_log(created_at);

alter table rate_limit_log enable row level security;

drop policy if exists "public_insert_rate_limit" on rate_limit_log;
create policy "public_insert_rate_limit"
  on rate_limit_log for insert with check (
    char_length(coalesce(session_id, '')) <= 64
    and char_length(coalesce(espaco_slug, '')) <= 100
  );
-- No public select policy → no enumeration.

create or replace function cleanup_rate_limit_log()
returns void as $$
begin
  delete from rate_limit_log
  where created_at < now() - interval '24 hours';
end;
$$ language plpgsql security definer set search_path = public;

-- ─────────────────────────────────────────
-- 3. SECURITY AUDIT LOG (service-role only)
-- ─────────────────────────────────────────
create table if not exists security_log (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  event_type  text not null,
  espaco_slug text,
  session_id  text,
  details     jsonb,
  severity    text check (severity in ('info', 'warning', 'critical')) default 'info'
);
create index if not exists security_log_cleanup_idx on security_log(created_at);

alter table security_log enable row level security;
-- No policies → only the service role (Edge Functions) can read/write.

create or replace function cleanup_security_log()
returns void as $$
begin
  delete from security_log
  where created_at < now() - interval '30 days';
end;
$$ language plpgsql security definer set search_path = public;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. TIGHT PUBLIC-INSERT POLICIES FOR MENU TABLES
-- Replace every `with check (true)` insert policy with a validating one.
-- Each must (a) target a real espaço and (b) cap field sizes / value ranges.
-- ═══════════════════════════════════════════════════════════════════════

-- menu_events ───────────────────────────────
drop policy if exists "public_insert_menu_events" on menu_events;
create policy "public_insert_menu_events"
  on menu_events for insert
  with check (
    exists (select 1 from menus where slug = espaco_slug)
    and char_length(coalesce(event_name, '')) <= 100
    and char_length(coalesce(item_name, '')) <= 200
    and char_length(coalesce(session_id, '')) <= 64
    and coalesce(item_price, 0) >= 0
    and coalesce(order_total, 0) >= 0
  );

-- staff_calls ───────────────────────────────
-- Drop the OLD loose policy by its real name, then add the strict one.
drop policy if exists "anon_insert_staff_calls" on staff_calls;
drop policy if exists "public_insert_staff_calls" on staff_calls;
create policy "public_insert_staff_calls"
  on staff_calls for insert
  with check (
    exists (select 1 from menus where slug = espaco_slug)
    and char_length(coalesce(table_label, '')) <= 50
  );

-- orders_log ────────────────────────────────
drop policy if exists "anon_insert_orders_log" on orders_log;
drop policy if exists "public_insert_orders" on orders_log;
create policy "public_insert_orders"
  on orders_log for insert
  with check (
    exists (select 1 from menus where slug = espaco_slug)
    and total >= 0
    and total < 10000                       -- sanity cap: €10k max order
    and member_count >= 1
    and member_count <= 50
    and jsonb_array_length(items) > 0
    and jsonb_array_length(items) <= 50      -- max 50 items
  );

-- comandas ──────────────────────────────────
drop policy if exists "public_insert_comanda" on comandas;
create policy "public_insert_comanda"
  on comandas for insert
  with check (
    exists (select 1 from menus where slug = espaco_slug)
    and char_length(table_label) <= 50
    and guest_count >= 1
    and guest_count <= 100
  );

-- comanda_items ─────────────────────────────
drop policy if exists "public_insert_comanda_items" on comanda_items;
create policy "public_insert_comanda_items"
  on comanda_items for insert
  with check (
    -- parent comanda must exist and still be accepting items
    exists (
      select 1 from comandas c
      where c.id = comanda_id
        and c.status in ('open', 'submitted', 'preparing')
    )
    and quantity >= 1
    and quantity <= 50
    and item_price >= 0
    and item_price < 1000                    -- sanity cap: €1k max item
    and char_length(item_name) <= 200
    and char_length(coalesce(notes, '')) <= 500
  );

-- waitlist_entries ──────────────────────────
-- Real columns: name / phone (not guest_name/guest_phone). Preserve the
-- original status='waiting' guard so customers can't self-seat.
drop policy if exists "anon_join_waitlist" on waitlist_entries;
drop policy if exists "public_insert_waitlist" on waitlist_entries;
create policy "public_insert_waitlist"
  on waitlist_entries for insert
  with check (
    exists (select 1 from menus where slug = espaco_slug)
    and status = 'waiting'
    and party_size >= 1
    and party_size <= 30
    and char_length(coalesce(name, '')) <= 100
    and char_length(coalesce(phone, '')) <= 20
  );

-- ═══════════════════════════════════════════════════════════════════════
-- 5. CROSS-RESTAURANT ISOLATION (portal-owned tables)
-- ═══════════════════════════════════════════════════════════════════════

-- portal_notifications: own espaço only; no public/owner insert
-- (rows are created by DB triggers running as the table owner / service role).
drop policy if exists "owns_portal_notifications" on portal_notifications;
drop policy if exists "portal_notif_select" on portal_notifications;
drop policy if exists "portal_notif_update" on portal_notifications;
drop policy if exists "portal_notif_delete" on portal_notifications;
create policy "portal_notif_select"
  on portal_notifications for select
  using (owns_espaco(espaco_slug));
create policy "portal_notif_update"
  on portal_notifications for update
  using (owns_espaco(espaco_slug))
  with check (owns_espaco(espaco_slug));
create policy "portal_notif_delete"
  on portal_notifications for delete
  using (owns_espaco(espaco_slug));

-- item_availability: own espaço for writes; public read stays (menu hides
-- sold-out items). Drop the older variants and unify on owns_espaco.
drop policy if exists "Client manages own availability" on item_availability;
drop policy if exists "owns_item_availability" on item_availability;
drop policy if exists "item_avail_all" on item_availability;
create policy "item_avail_all"
  on item_availability for all
  using (owns_espaco(espaco_slug))
  with check (owns_espaco(espaco_slug));
-- keep the existing public read policy (anon_select_item_availability)

-- menu_banners: own espaço for writes (now with a WITH CHECK);
-- public read only active banners on real espaços.
drop policy if exists "owns_menu_banners" on menu_banners;
drop policy if exists "menu_banners_all" on menu_banners;
create policy "menu_banners_all"
  on menu_banners for all
  using (owns_espaco(espaco_slug))
  with check (owns_espaco(espaco_slug));

drop policy if exists "public_read_banners" on menu_banners;
create policy "public_read_banners"
  on menu_banners for select
  using (
    is_active = true
    and exists (select 1 from menus where slug = espaco_slug)
  );

-- push_subscriptions: staff-only, registered from the authenticated portal.
-- (Never inserted from anonymous menu code.) Lock to owns_espaco.
drop policy if exists "anon_insert_push_subscriptions" on push_subscriptions;
drop policy if exists "anon_update_push_subscriptions" on push_subscriptions;
drop policy if exists "push_subs_portal" on push_subscriptions;
create policy "push_subs_portal"
  on push_subscriptions for all
  using (owns_espaco(espaco_slug))
  with check (owns_espaco(espaco_slug));

-- ═══════════════════════════════════════════════════════════════════════
-- 6. GRANTS
-- RLS still applies; these just ensure the roles can reach the tables.
-- ═══════════════════════════════════════════════════════════════════════
grant insert on menu_events       to anon, authenticated;
grant insert on staff_calls       to anon, authenticated;
grant insert on orders_log        to anon, authenticated;
grant insert on waitlist_entries  to anon, authenticated;
grant insert on comandas          to anon, authenticated;
grant insert on comanda_items     to anon, authenticated;
grant insert on rate_limit_log    to anon, authenticated;
grant select, update, delete on portal_notifications to authenticated;
grant all on item_availability    to authenticated;
grant all on menu_banners         to authenticated;
grant all on push_subscriptions   to authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- 7. VERIFICATION (read-only; review the output after running)
-- ═══════════════════════════════════════════════════════════════════════
-- Any row with rowsecurity = false is an unprotected table:
select tablename, rowsecurity
from   pg_tables
where  schemaname = 'public'
order  by rowsecurity, tablename;
