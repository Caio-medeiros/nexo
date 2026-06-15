-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — Migration 012 (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq)
-- APROVAÇÃO DE ALTERAÇÕES AO MENU.
--
-- Antes: o cliente editava o menu (`/portal/menu/`) e gravava direto em
-- `menu_overrides` — aparecia no menu na hora.
-- Agora: cada alteração do cliente cria um PEDIDO (`menu_change_requests`,
-- estado `pending`). O menu público continua a ler só `menu_overrides`
-- (estado aprovado/ao vivo), por isso nada muda para o cliente final até a
-- NEXO aprovar. A NEXO aprova/rejeita via RPC (chamada pelo NEXO OS com a
-- secret key do projeto). Aprovar aplica o pedido em `menu_overrides`.
--
-- 'Esgotado' (item_availability / Disponibilidade) NÃO passa por aqui — é
-- operacional e mantém-se instantâneo.
--
-- Idempotente: seguro re-correr.
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- 1. Pedidos de alteração
-- ─────────────────────────────────────────
create table if not exists menu_change_requests (
  id          uuid primary key default uuid_generate_v4(),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  espaco_slug text not null,
  item_id     text not null,             -- 'seccao:idx' ou 'custom:<uuid>'
  section_id  text,
  kind        text not null default 'override' check (kind in ('override','custom')),
  -- 'set'   = criar/substituir o override (editar, adicionar, esconder/mostrar)
  -- 'clear' = remover o override (repor original / eliminar prato custom)
  action      text not null default 'set' check (action in ('set','clear')),
  removed     boolean default false,
  name        text,
  description text,
  price       text,
  photo_url   text,
  base_label  text,                       -- nome do prato p/ a fila de aprovação NEXO
  status      text not null default 'pending'
              check (status in ('pending','approved','rejected')),
  requested_by uuid default auth.uid(),
  reviewed_at  timestamptz,
  reviewed_by  uuid,
  review_note  text
);

-- só um pedido pendente por prato (re-editar substitui)
create unique index if not exists menu_change_requests_one_pending
  on menu_change_requests(espaco_slug, item_id) where status = 'pending';
create index if not exists menu_change_requests_pending_idx
  on menu_change_requests(status, created_at);
create index if not exists menu_change_requests_slug_idx
  on menu_change_requests(espaco_slug, created_at desc);

drop trigger if exists menu_change_requests_updated_at on menu_change_requests;
create trigger menu_change_requests_updated_at
  before update on menu_change_requests
  for each row execute function update_updated_at_column();

-- ─────────────────────────────────────────
-- 2. RLS — o cliente gere os SEUS pedidos; o menu público não lê nada daqui
-- ─────────────────────────────────────────
alter table menu_change_requests enable row level security;

drop policy if exists "client_own_change_requests" on menu_change_requests;
create policy "client_own_change_requests" on menu_change_requests
  for all using (
    espaco_slug in (
      select m.slug from menus m join clients c on c.id = m.client_id
      where c.auth_user_id = auth.uid()
    )
  ) with check (
    espaco_slug in (
      select m.slug from menus m join clients c on c.id = m.client_id
      where c.auth_user_id = auth.uid()
    )
  );

grant select, insert, update, delete on menu_change_requests to authenticated;
-- service_role (secret key usada pelo NEXO OS para listar os pedidos) — o
-- Supabase nem sempre concede por defeito a tabelas novas, por isso é explícito.
grant select, insert, update, delete on menu_change_requests to service_role;
-- anon (menu público) NÃO tem acesso aos pedidos

-- ─────────────────────────────────────────
-- 3. Notificações ao cliente sobre o estado da aprovação
-- ─────────────────────────────────────────
alter table portal_notifications drop constraint if exists portal_notifications_type_check;
alter table portal_notifications add constraint portal_notifications_type_check
  check (type in (
    'order_new','staff_call','waitlist_new',
    'review_positive','review_negative','update_done','menu_viewed',
    'menu_change'
  ));

-- ─────────────────────────────────────────
-- 4. Aprovar / rejeitar (SECURITY DEFINER — só a NEXO, via service_role)
-- ─────────────────────────────────────────
create or replace function approve_menu_change(p_request_id uuid, p_reviewer uuid default null)
returns menu_change_requests
language plpgsql security definer set search_path = public as $$
declare r menu_change_requests;
begin
  select * into r from menu_change_requests where id = p_request_id for update;
  if not found then raise exception 'pedido % não existe', p_request_id; end if;
  if r.status <> 'pending' then
    raise exception 'pedido % já foi %', p_request_id, r.status;
  end if;

  if r.action = 'set' then
    insert into menu_overrides (espaco_slug, item_id, section_id, kind, removed,
      name, description, price, photo_url, updated_at)
    values (r.espaco_slug, r.item_id, r.section_id, r.kind, coalesce(r.removed,false),
      r.name, r.description, r.price, r.photo_url, now())
    on conflict (espaco_slug, item_id) do update set
      section_id  = excluded.section_id,
      kind        = excluded.kind,
      removed     = excluded.removed,
      name        = excluded.name,
      description = excluded.description,
      price       = excluded.price,
      photo_url   = excluded.photo_url,
      updated_at  = now();
  else  -- 'clear'
    delete from menu_overrides where espaco_slug = r.espaco_slug and item_id = r.item_id;
  end if;

  update menu_change_requests
     set status = 'approved', reviewed_at = now(), reviewed_by = coalesce(p_reviewer, auth.uid())
   where id = p_request_id
   returning * into r;

  insert into portal_notifications (espaco_slug, type, title, body, reference_id, reference_table)
  values (r.espaco_slug, 'menu_change',
    '✅ Alteração aprovada',
    coalesce(r.base_label, r.name, 'Prato') || ' — já está no menu.',
    r.id, 'menu_change_requests');

  return r;
end $$;

create or replace function reject_menu_change(p_request_id uuid, p_note text default null, p_reviewer uuid default null)
returns menu_change_requests
language plpgsql security definer set search_path = public as $$
declare r menu_change_requests;
begin
  select * into r from menu_change_requests where id = p_request_id for update;
  if not found then raise exception 'pedido % não existe', p_request_id; end if;
  if r.status <> 'pending' then
    raise exception 'pedido % já foi %', p_request_id, r.status;
  end if;

  update menu_change_requests
     set status = 'rejected', reviewed_at = now(),
         reviewed_by = coalesce(p_reviewer, auth.uid()), review_note = p_note
   where id = p_request_id
   returning * into r;

  insert into portal_notifications (espaco_slug, type, title, body, reference_id, reference_table)
  values (r.espaco_slug, 'menu_change',
    '❌ Alteração não aprovada',
    coalesce(r.base_label, r.name, 'Prato') || coalesce(' — ' || p_note, ''),
    r.id, 'menu_change_requests');

  return r;
end $$;

-- Só a NEXO aprova. O Supabase concede EXECUTE a anon/authenticated por
-- default privileges, por isso é preciso revogar explicitamente desses roles
-- (revogar de PUBLIC não chega). Fica só o service_role (secret key do NEXO OS).
revoke all on function approve_menu_change(uuid, uuid) from public, anon, authenticated;
revoke all on function reject_menu_change(uuid, text, uuid) from public, anon, authenticated;
grant execute on function approve_menu_change(uuid, uuid) to service_role;
grant execute on function reject_menu_change(uuid, text, uuid) to service_role;

-- ─────────────────────────────────────────
-- 5. Travar a escrita direta do cliente em menu_overrides
--    A 005 dava ao cliente acesso total a menu_overrides (escrevia ao vivo).
--    Agora SÓ a aprovação (approve_menu_change, SECURITY DEFINER) escreve lá —
--    senão um cliente técnico contornava a aprovação via API direta.
--    Leitura mantém-se aberta (política anon_read_menu_overrides, para o menu).
-- ─────────────────────────────────────────
drop policy if exists "portal_menu_overrides_all" on menu_overrides;
revoke insert, update, delete on menu_overrides from authenticated, anon;
-- garantir leitura para todos (menu público + portal do cliente)
drop policy if exists "anon_read_menu_overrides" on menu_overrides;
create policy "anon_read_menu_overrides" on menu_overrides
  for select using (true);

-- ─────────────────────────────────────────
-- 6. Realtime (NEXO OS / portal podem ouvir novos pedidos e estados)
-- ─────────────────────────────────────────
do $$ begin alter publication supabase_realtime add table menu_change_requests;
exception when duplicate_object then null; end $$;

-- Verificação
select 'menu_change_requests' as tbl, count(*) as n from menu_change_requests;
