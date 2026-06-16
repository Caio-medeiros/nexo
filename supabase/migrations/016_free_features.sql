-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — Migration 016 (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq)
-- FEATURES ZERO-CUSTO: perfis de clientes (guest_profiles) + templates de
-- comunicação WhatsApp (whatsapp_templates).
--
-- Nota: a 004 já existe (waitlist_reorder) — por isso isto é a 016.
-- Idempotente. Correr no SQL Editor do projeto dos menus.
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ─────────────────────────────
-- PERFIS DE CLIENTES
-- ─────────────────────────────
create table if not exists guest_profiles (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  espaco_slug text not null,
  phone text not null,
  name text,
  language text default 'pt',
  visit_count integer default 1,
  last_visit date default current_date,
  first_visit date default current_date,
  total_spend numeric(10,2) default 0,
  notes text,
  tags text[] default '{}',
  is_vip boolean default false,
  unique(espaco_slug, phone)
);

create index if not exists guest_profiles_slug_idx on guest_profiles(espaco_slug);
create index if not exists guest_profiles_phone_idx on guest_profiles(espaco_slug, phone);

drop trigger if exists guest_profiles_updated_at on guest_profiles;
create trigger guest_profiles_updated_at
  before update on guest_profiles
  for each row execute function update_updated_at_column();

-- ─────────────────────────────
-- TEMPLATES DE COMUNICAÇÃO WHATSAPP
-- ─────────────────────────────
create table if not exists whatsapp_templates (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  espaco_slug text not null,
  type text not null check (type in (
    'pre_visit','post_visit','reengagement','birthday','promotion','custom'
  )),
  name text,
  template_text text not null,
  is_active boolean default true,
  sent_count integer default 0
);
create index if not exists whatsapp_templates_slug_idx on whatsapp_templates(espaco_slug);

-- ─────────────────────────────
-- RLS
-- ─────────────────────────────
alter table guest_profiles enable row level security;
alter table whatsapp_templates enable row level security;

drop policy if exists "owns_guest_profiles" on guest_profiles;
create policy "owns_guest_profiles" on guest_profiles
  for all using (owns_espaco(espaco_slug)) with check (owns_espaco(espaco_slug));

drop policy if exists "owns_whatsapp_templates" on whatsapp_templates;
create policy "owns_whatsapp_templates" on whatsapp_templates
  for all using (owns_espaco(espaco_slug)) with check (owns_espaco(espaco_slug));

-- Público (menu anónimo) pode criar/atualizar o perfil do próprio cliente na visita.
-- (dados de baixa sensibilidade; o portal autenticado é que lê/gere via owns_espaco)
drop policy if exists "public_upsert_guest_profile" on guest_profiles;
create policy "public_upsert_guest_profile" on guest_profiles
  for insert with check (true);
drop policy if exists "public_update_guest_profile" on guest_profiles;
create policy "public_update_guest_profile" on guest_profiles
  for update using (true) with check (true);

-- ─────────────────────────────
-- GRANTS (este projeto não tem default privileges p/ anon/authenticated)
-- ─────────────────────────────
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on guest_profiles to authenticated;
grant insert, update, select on guest_profiles to anon;
grant select, insert, update, delete on whatsapp_templates to authenticated;
-- service_role coberto pela 014 (default privileges).

-- ─────────────────────────────
-- Realtime (portal vê novos perfis ao vivo)
-- ─────────────────────────────
do $$ begin alter publication supabase_realtime add table guest_profiles;
exception when duplicate_object then null; end $$;

-- Verificação
select 'guest_profiles' as tbl, count(*) from guest_profiles
union all select 'whatsapp_templates', count(*) from whatsapp_templates;
