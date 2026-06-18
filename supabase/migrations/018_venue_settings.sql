-- ═══════════════════════════════════════════════════════════════
-- 018 — VENUE SETTINGS
-- Per-restaurant floor-plan configuration (table count, capacity,
-- venue type). Drives the interactive Sala floor plan + menu table
-- validation. (Spec referenced "006"; renumbered — 006..017 taken.)
-- Uses gen_random_uuid() (CLI runner lacks the uuid-ossp search_path).
-- ═══════════════════════════════════════════════════════════════

create table if not exists venue_settings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  espaco_slug text not null unique,

  -- Floor plan
  table_count integer not null default 10
    check (table_count >= 1 and table_count <= 60),
  table_capacity integer default 4,

  -- Venue info
  venue_name text,
  venue_type text check (venue_type in (
    'restaurant', 'cafe', 'bar',
    'beach_club', 'hotel', 'other'
  )) default 'restaurant',

  -- Operating
  is_open boolean default false,
  current_shift text check (current_shift in (
    'breakfast', 'lunch', 'dinner', 'all_day'
  )) default 'dinner'
);

drop trigger if exists venue_settings_updated_at on venue_settings;
create trigger venue_settings_updated_at
  before update on venue_settings
  for each row execute function
  update_updated_at_column();

-- RLS
alter table venue_settings enable row level security;

drop policy if exists "owns_venue_settings" on venue_settings;
create policy "owns_venue_settings" on venue_settings
  for all using (owns_espaco(espaco_slug));

-- Public read (menu needs table_count for validation)
drop policy if exists "public_read_venue_settings" on venue_settings;
create policy "public_read_venue_settings" on venue_settings
  for select using (true);

grant select on venue_settings to anon, authenticated;
grant all on venue_settings to authenticated;

-- Seed defaults for existing menus (idempotent)
insert into venue_settings (espaco_slug, table_count)
select slug, 10
from menus
where slug is not null
  and slug not in (select espaco_slug from venue_settings)
on conflict (espaco_slug) do nothing;

-- Realtime
do $$ begin alter publication supabase_realtime add table venue_settings;
exception when duplicate_object then null; end $$;
