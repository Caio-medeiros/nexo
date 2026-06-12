-- ═══════════════════════════════════════════════════════════════════════
-- NEXO Portal — Migration 001 (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq)
-- Correr UMA vez no Supabase SQL Editor deste projeto.
-- Pré-requisito: supabase/setup-complete.sql já foi corrido neste projeto.
--
-- Arquitetura: este projeto guarda um ESPELHO leve de clients/menus
-- (sincronizado manualmente a partir do NEXO OS) + todas as tabelas
-- realtime usadas pelos menus e pelo portal.
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- 1. Clients (espelho) — campos de negócio + referral + evento
-- ─────────────────────────────────────────
alter table clients
  add column if not exists status text default 'active',
  add column if not exists monthly_value numeric(10,2) default 69,
  add column if not exists plan_renewal_date date,
  add column if not exists referred_by uuid references clients(id) on delete set null,
  add column if not exists referral_credits integer default 0,
  add column if not exists event_date date,
  add column if not exists event_end_date date;

-- referral_code já existe (setup-complete) mas pode não ser unique
do $$ begin
  alter table clients add constraint clients_referral_code_key unique (referral_code);
exception when duplicate_table or duplicate_object then null; end $$;

alter table clients drop constraint if exists clients_plan_check;
alter table clients
  add constraint clients_plan_check
  check (plan in ('starter','growth','multi','enterprise','evento'));

alter table clients drop constraint if exists clients_status_check;
alter table clients
  add constraint clients_status_check
  check (status in ('lead','demo_scheduled','proposal_sent','active','churned'));

create index if not exists clients_auth_user_idx on clients(auth_user_id);
create index if not exists clients_referred_by_idx on clients(referred_by);

-- ─────────────────────────────────────────
-- 2. Menus (espelho) — URL pública
-- ─────────────────────────────────────────
alter table menus
  add column if not exists url text;

-- preencher url a partir do slug quando vazio
update menus set url = 'https://nexosolutions.pt/menu/' || slug || '/'
where url is null;

-- ─────────────────────────────────────────
-- 3. Onboarding (espelho do NEXO OS)
-- ─────────────────────────────────────────
create table if not exists onboarding (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  client_id uuid references clients(id) on delete cascade unique,
  received_menu_content boolean default false,
  received_logo boolean default false,
  received_colors boolean default false,
  menu_configured boolean default false,
  deployed_to_netlify boolean default false,
  nfc_programmed boolean default false,
  client_approved boolean default false,
  hardware_delivered boolean default false,
  team_briefed boolean default false,
  photo_taken boolean default false,
  testimonial_received boolean default false,
  scheduled_delivery_date date,
  notes text
);

-- ─────────────────────────────────────────
-- 4. Item availability — campos extra
-- ─────────────────────────────────────────
alter table item_availability
  add column if not exists item_name text,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists updated_by text default 'staff';

-- ─────────────────────────────────────────
-- 5. Staff calls — resolução pelo portal
-- ─────────────────────────────────────────
alter table staff_calls
  add column if not exists resolved_at timestamptz;

-- ─────────────────────────────────────────
-- 6. Orders log
-- ─────────────────────────────────────────
create table if not exists orders_log (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  espaco_slug text not null,
  table_label text,
  items jsonb not null default '[]',
  total numeric(10,2) default 0,
  member_count integer default 1,
  channel text check (channel in ('whatsapp','staff','shared')) default 'staff'
);
create index if not exists orders_log_espaco_idx on orders_log(espaco_slug, created_at desc);

-- ─────────────────────────────────────────
-- 7. Update requests — urgência
-- ─────────────────────────────────────────
alter table update_requests
  add column if not exists urgent boolean default false;

-- ─────────────────────────────────────────
-- 8. Row Level Security
-- ─────────────────────────────────────────
alter table onboarding enable row level security;
alter table orders_log enable row level security;
-- (clients, menus, item_availability, update_requests, staff_calls
--  já têm RLS ativo via setup-complete.sql)

-- Portal: cliente autenticado vê o próprio onboarding
drop policy if exists "portal_onboarding_select" on onboarding;
create policy "portal_onboarding_select" on onboarding
  for select using (
    client_id in (select id from clients where auth_user_id = auth.uid())
  );

-- Portal: cliente autenticado vê os próprios pedidos
drop policy if exists "portal_orders_select" on orders_log;
create policy "portal_orders_select" on orders_log
  for select using (
    espaco_slug in (
      select m.slug from menus m
      join clients c on c.id = m.client_id
      where c.auth_user_id = auth.uid()
    )
  );

-- Menus (visitantes anónimos) escrevem chamadas e pedidos
drop policy if exists "anon_insert_staff_calls" on staff_calls;
create policy "anon_insert_staff_calls" on staff_calls
  for insert with check (true);

drop policy if exists "anon_insert_orders_log" on orders_log;
create policy "anon_insert_orders_log" on orders_log
  for insert with check (true);

-- Menus (visitantes anónimos) LÊEM disponibilidade para esconder esgotados
drop policy if exists "anon_select_item_availability" on item_availability;
create policy "anon_select_item_availability" on item_availability
  for select using (true);

-- Portal: cliente resolve as próprias chamadas (update resolved_at)
drop policy if exists "portal_staff_calls_update" on staff_calls;
create policy "portal_staff_calls_update" on staff_calls
  for update using (
    espaco_slug in (
      select m.slug from menus m
      join clients c on c.id = m.client_id
      where c.auth_user_id = auth.uid()
    )
  );

-- Referências: o cliente pode ver QUEM indicou (nome) e os
-- espaços que ELE indicou. Funções security definer para evitar
-- recursão de RLS na própria tabela clients.
create or replace function my_client_id()
returns uuid language sql security definer stable as $$
  select id from clients where auth_user_id = auth.uid() limit 1;
$$;

create or replace function my_referrer_id()
returns uuid language sql security definer stable as $$
  select referred_by from clients where auth_user_id = auth.uid() limit 1;
$$;

drop policy if exists "portal_referred_clients_select" on clients;
create policy "portal_referred_clients_select" on clients
  for select using (referred_by = my_client_id());

drop policy if exists "portal_referrer_select" on clients;
create policy "portal_referrer_select" on clients
  for select using (id = my_referrer_id());

-- ─────────────────────────────────────────
-- 9. Realtime publications (seguro re-correr)
-- ─────────────────────────────────────────
do $$ begin
  alter publication supabase_realtime add table item_availability;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table orders_log;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table staff_calls;
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────
-- 10. Auto-gerar códigos de referência
-- ─────────────────────────────────────────
create or replace function generate_referral_code()
returns trigger as $$
declare
  code text;
  exists_check integer;
begin
  if new.status = 'active' and new.referral_code is null then
    loop
      code := 'NEXO-' || upper(substr(md5(random()::text), 1, 4));
      select count(*) into exists_check
        from clients where referral_code = code;
      exit when exists_check = 0;
    end loop;
    new.referral_code := code;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists clients_generate_referral_code on clients;
create trigger clients_generate_referral_code
  before insert or update on clients
  for each row execute function generate_referral_code();

-- ─────────────────────────────────────────
-- 11. Crédito de referência na ativação
-- ─────────────────────────────────────────
create or replace function handle_referral_credit()
returns trigger as $$
begin
  if new.status = 'active'
     and old.status is distinct from 'active'
     and new.referred_by is not null then
    update clients
      set referral_credits = coalesce(referral_credits, 0) + 1
      where id = new.referred_by;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists clients_referral_credit on clients;
create trigger clients_referral_credit
  after update on clients
  for each row execute function handle_referral_credit();

-- ─────────────────────────────────────────
-- 12. Storage — anexos dos pedidos de alteração
-- ─────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('update-attachments', 'update-attachments', true)
on conflict (id) do nothing;

drop policy if exists "portal_upload_attachments" on storage.objects;
create policy "portal_upload_attachments" on storage.objects
  for insert with check (
    bucket_id = 'update-attachments' and auth.role() = 'authenticated'
  );

drop policy if exists "public_read_attachments" on storage.objects;
create policy "public_read_attachments" on storage.objects
  for select using (bucket_id = 'update-attachments');

-- ─────────────────────────────────────────
-- 13. Backfill demo: Marisca Petisca
-- ─────────────────────────────────────────
update clients
set status = 'active',
    monthly_value = coalesce(monthly_value, 69),
    plan_renewal_date = coalesce(plan_renewal_date, (now() + interval '30 days')::date)
where name = 'Marisca Petisca';

insert into onboarding (client_id,
  received_menu_content, received_logo, received_colors,
  menu_configured, deployed_to_netlify, nfc_programmed,
  client_approved, hardware_delivered, team_briefed,
  photo_taken, testimonial_received)
select id, true, true, true, true, true, false, true, false, false, false, false
from clients where name = 'Marisca Petisca'
on conflict (client_id) do nothing;

-- ─────────────────────────────────────────
-- Verificação
-- ─────────────────────────────────────────
select c.name, c.plan, c.status, c.referral_code, c.referral_credits,
       m.slug, m.url, o.id is not null as has_onboarding
from clients c
left join menus m on m.client_id = c.id
left join onboarding o on o.client_id = c.id;
