-- ═══════════════════════════════════════════════════════════════════════
-- NEXO Fila de Espera — Migration 002
-- (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq)
-- Correr UMA vez no Supabase SQL Editor. Seguro re-correr (idempotente).
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- 1. Entradas na fila
-- ─────────────────────────────────────────
create table if not exists waitlist_entries (
  id           uuid primary key default uuid_generate_v4(),
  created_at   timestamptz default now(),
  espaco_slug  text not null,
  token        uuid not null,            -- gerado no browser do cliente; é a "chave" dele
  name         text not null,
  phone        text,
  party_size   integer not null default 2 check (party_size between 1 and 30),
  status       text not null default 'waiting'
               check (status in ('waiting','notified','seated','cancelled','no_show')),
  notified_at  timestamptz,
  seated_at    timestamptz,
  closed_at    timestamptz,              -- cancelled / no_show
  source       text default 'qr' check (source in ('qr','staff')),
  note         text
);

create index if not exists waitlist_entries_queue_idx
  on waitlist_entries (espaco_slug, status, created_at);
create unique index if not exists waitlist_entries_token_idx
  on waitlist_entries (token);

-- ─────────────────────────────────────────
-- 2. Definições da fila (por espaço)
-- ─────────────────────────────────────────
create table if not exists waitlist_settings (
  espaco_slug       text primary key,
  open              boolean not null default true,
  minutes_per_group integer not null default 10 check (minutes_per_group between 1 and 120),
  updated_at        timestamptz default now()
);

-- ─────────────────────────────────────────
-- 3. Row Level Security
-- ─────────────────────────────────────────
alter table waitlist_entries enable row level security;
alter table waitlist_settings enable row level security;

-- Qualquer pessoa pode entrar na fila (sempre como 'waiting', via QR)
drop policy if exists "anon_join_waitlist" on waitlist_entries;
create policy "anon_join_waitlist" on waitlist_entries
  for insert with check (status = 'waiting');

-- O estado da fila (aberta/fechada + minutos) é público
drop policy if exists "anon_read_waitlist_settings" on waitlist_settings;
create policy "anon_read_waitlist_settings" on waitlist_settings
  for select using (true);

-- Portal: o restaurante gere a própria fila
drop policy if exists "portal_waitlist_select" on waitlist_entries;
create policy "portal_waitlist_select" on waitlist_entries
  for select using (
    espaco_slug in (
      select m.slug from menus m
      join clients c on c.id = m.client_id
      where c.auth_user_id = auth.uid()
    )
  );

drop policy if exists "portal_waitlist_update" on waitlist_entries;
create policy "portal_waitlist_update" on waitlist_entries
  for update using (
    espaco_slug in (
      select m.slug from menus m
      join clients c on c.id = m.client_id
      where c.auth_user_id = auth.uid()
    )
  );

drop policy if exists "portal_waitlist_settings_all" on waitlist_settings;
create policy "portal_waitlist_settings_all" on waitlist_settings
  for all using (
    espaco_slug in (
      select m.slug from menus m
      join clients c on c.id = m.client_id
      where c.auth_user_id = auth.uid()
    )
  ) with check (
    espaco_slug in (
      select m.slug from menus m
      join clients c on c.id = m.client_id
      where c.auth_user_id = auth.uid()
    )
  );

-- NOTA: não há select anónimo em waitlist_entries — o cliente
-- consulta o próprio estado apenas via RPC (não vê nomes/telefones
-- de outros). O portal (autenticado) tem realtime normal.

-- ─────────────────────────────────────────
-- 4. RPC: estado da fila para o cliente (security definer)
-- ─────────────────────────────────────────
create or replace function waitlist_status(p_token uuid)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  e waitlist_entries%rowtype;
  ahead integer;
  total_waiting integer;
  mins integer;
  is_open boolean;
begin
  select * into e from waitlist_entries where token = p_token;
  if not found then
    return jsonb_build_object('found', false);
  end if;

  select coalesce(s.minutes_per_group, 10), coalesce(s.open, true)
    into mins, is_open
  from (select 1) x
  left join waitlist_settings s on s.espaco_slug = e.espaco_slug;

  select count(*) into ahead
  from waitlist_entries w
  where w.espaco_slug = e.espaco_slug
    and w.status = 'waiting'
    and w.created_at < e.created_at;

  select count(*) into total_waiting
  from waitlist_entries w
  where w.espaco_slug = e.espaco_slug
    and w.status in ('waiting','notified');

  return jsonb_build_object(
    'found', true,
    'status', e.status,
    'name', e.name,
    'party_size', e.party_size,
    'people_ahead', case when e.status = 'waiting' then ahead else 0 end,
    'est_minutes', case when e.status = 'waiting' then ahead * mins else 0 end,
    'total_waiting', total_waiting,
    'queue_open', is_open,
    'created_at', e.created_at
  );
end;
$$;

-- ─────────────────────────────────────────
-- 5. RPC: cliente desiste da fila (security definer)
-- ─────────────────────────────────────────
create or replace function waitlist_cancel(p_token uuid)
returns boolean
language plpgsql security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update waitlist_entries
    set status = 'cancelled', closed_at = now()
    where token = p_token
      and status in ('waiting','notified');
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

-- ─────────────────────────────────────────
-- 6. RPC: fila aberta? (para a página de entrada, antes do join)
-- ─────────────────────────────────────────
create or replace function waitlist_queue_info(p_slug text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  mins integer;
  is_open boolean;
  total_waiting integer;
begin
  select coalesce(s.minutes_per_group, 10), coalesce(s.open, true)
    into mins, is_open
  from (select 1) x
  left join waitlist_settings s on s.espaco_slug = p_slug;

  select count(*) into total_waiting
  from waitlist_entries w
  where w.espaco_slug = p_slug and w.status = 'waiting';

  return jsonb_build_object(
    'queue_open', is_open,
    'total_waiting', total_waiting,
    'est_minutes', total_waiting * mins
  );
end;
$$;

-- Permissões das RPCs
grant execute on function waitlist_status(uuid) to anon, authenticated;
grant execute on function waitlist_cancel(uuid) to anon, authenticated;
grant execute on function waitlist_queue_info(text) to anon, authenticated;

-- Permissões de tabela (este projeto não tem default privileges
-- para anon/authenticated — ver migration 003)
grant usage on schema public to anon, authenticated;
grant insert on waitlist_entries to anon;
grant select, insert, update on waitlist_entries to authenticated;
grant select on waitlist_settings to anon;
grant select, insert, update, delete on waitlist_settings to authenticated;

-- ─────────────────────────────────────────
-- 7. Realtime (para o portal do restaurante)
-- ─────────────────────────────────────────
do $$ begin
  alter publication supabase_realtime add table waitlist_entries;
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────
-- 8. Seed: definições para a Marisca Petisca
-- ─────────────────────────────────────────
insert into waitlist_settings (espaco_slug, open, minutes_per_group)
values ('marisca-petisca', true, 10)
on conflict (espaco_slug) do nothing;

-- Verificação
select 'waitlist ok' as status,
  (select count(*) from waitlist_entries) as entries,
  (select count(*) from waitlist_settings) as settings;
