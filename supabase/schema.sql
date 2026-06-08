-- ─────────────────────────────────────────────────────────────────────────
-- NEXO — Staff Call System
-- Run in Supabase SQL editor (Project Settings → SQL Editor)
-- ─────────────────────────────────────────────────────────────────────────

-- Staff push subscriptions
create table if not exists push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  espaco_slug text not null,
  subscription jsonb not null,
  device_name text,
  is_active boolean default true
);

-- Staff call log (for history in NEXO OS)
create table if not exists staff_calls (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  espaco_slug text not null,
  table_label text,
  delivered_count integer default 0
);

-- Index for fast lookup by espaco
create index if not exists push_subscriptions_espaco_idx
  on push_subscriptions(espaco_slug, is_active);
