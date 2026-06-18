-- ═══════════════════════════════════════════════════════════════
-- 017 — CRM (guest_profiles)
-- Rebuilds the customer/CRM data model removed in revert 2b2a94b.
-- Profiles are seeded from the waitlist and edited by the client.
-- ═══════════════════════════════════════════════════════════════

create table if not exists guest_profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  espaco_slug text not null,
  name text not null,
  phone text,
  email text,
  language text default 'pt',
  visit_count integer default 1,
  first_visit timestamptz default now(),
  last_visit timestamptz default now(),
  total_spent numeric(10,2) default 0,
  is_vip boolean default false,
  tags text[] default '{}',
  notes text
);

create index if not exists guest_profiles_slug_idx
  on guest_profiles(espaco_slug, last_visit desc);
create unique index if not exists guest_profiles_phone_idx
  on guest_profiles(espaco_slug, phone) where phone is not null;

drop trigger if exists guest_profiles_updated_at on guest_profiles;
create trigger guest_profiles_updated_at
  before update on guest_profiles
  for each row execute function update_updated_at_column();

alter table guest_profiles enable row level security;
drop policy if exists "owns_guest_profiles" on guest_profiles;
create policy "owns_guest_profiles" on guest_profiles
  for all using (owns_espaco(espaco_slug));

grant all on guest_profiles to authenticated;
