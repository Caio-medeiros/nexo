-- ═══════════════════════════════════════════════════════════════════════
-- NEXO Editor de Menu — Migration 005
-- (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq)
-- O cliente edita o próprio menu no portal: alterar nome/descrição/
-- preço/foto, esconder pratos e adicionar pratos novos.
-- Os menus aplicam estes "overrides" por cima do config.js no arranque.
-- Correr UMA vez. Seguro re-correr.
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- 1. Tabela de overrides
-- ─────────────────────────────────────────
create table if not exists menu_overrides (
  id          uuid primary key default uuid_generate_v4(),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  espaco_slug text not null,
  -- 'seccao:idx' para itens existentes no config.js
  -- 'custom:<uuid>' para pratos novos criados no portal
  item_id     text not null,
  section_id  text,                       -- obrigatório para customs
  kind        text not null default 'override'
              check (kind in ('override','custom')),
  removed     boolean default false,      -- escondido do menu
  name        text,
  description text,
  price       text,                       -- ex: "12,50€" (formato igual ao config)
  photo_url   text,
  sort_order  double precision default extract(epoch from now()),
  unique (espaco_slug, item_id)
);

create index if not exists menu_overrides_slug_idx
  on menu_overrides (espaco_slug);

-- ─────────────────────────────────────────
-- 2. RLS
-- ─────────────────────────────────────────
alter table menu_overrides enable row level security;

-- Menus públicos leem os overrides do espaço
drop policy if exists "anon_read_menu_overrides" on menu_overrides;
create policy "anon_read_menu_overrides" on menu_overrides
  for select using (true);

-- Portal: o cliente gere apenas os overrides do próprio espaço
drop policy if exists "portal_menu_overrides_all" on menu_overrides;
create policy "portal_menu_overrides_all" on menu_overrides
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

-- ─────────────────────────────────────────
-- 3. Grants (este projeto não tem default privileges antigos;
--    003 já configurou defaults, mas garantimos explicitamente)
-- ─────────────────────────────────────────
grant select on menu_overrides to anon;
grant select, insert, update, delete on menu_overrides to authenticated;

-- ─────────────────────────────────────────
-- 4. Storage: fotos dos pratos
-- ─────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

drop policy if exists "portal_upload_menu_images" on storage.objects;
create policy "portal_upload_menu_images" on storage.objects
  for insert with check (
    bucket_id = 'menu-images' and auth.role() = 'authenticated'
  );

drop policy if exists "portal_update_menu_images" on storage.objects;
create policy "portal_update_menu_images" on storage.objects
  for update using (
    bucket_id = 'menu-images' and auth.role() = 'authenticated'
  );

drop policy if exists "public_read_menu_images" on storage.objects;
create policy "public_read_menu_images" on storage.objects
  for select using (bucket_id = 'menu-images');

-- Verificação
select 'menu editor ok' as status,
  (select count(*) from menu_overrides) as overrides;
