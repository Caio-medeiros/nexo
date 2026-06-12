-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — Migration 003: GRANTS em falta + lista pública da fila
-- (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq)
-- CAUSA: este projeto não tem default privileges para anon/authenticated,
-- por isso as tabelas criadas nas migrations 001/002 davam
-- "42501 permission denied". RLS continua a proteger as linhas.
-- Correr UMA vez. Seguro re-correr.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. Grants precisos por tabela
-- ─────────────────────────────────────────
grant usage on schema public to anon, authenticated;

-- Fila de espera
grant insert on waitlist_entries to anon;                       -- cliente entra na fila
grant select, insert, update on waitlist_entries to authenticated; -- portal gere
grant select on waitlist_settings to anon;                      -- fila aberta/fechada
grant select, insert, update, delete on waitlist_settings to authenticated;

-- Portal (cliente autenticado)
grant select on clients to authenticated;
grant update (auth_user_id) on clients to authenticated;        -- não usado pelo portal, inofensivo
grant select on menus to authenticated;
grant select on onboarding to authenticated;
grant select, insert on update_requests to authenticated;
grant select, insert, update on item_availability to authenticated;
grant select, update on staff_calls to authenticated;
grant select on orders_log to authenticated;

-- Menus públicos (visitantes anónimos)
grant select on item_availability to anon;                      -- esconder esgotados
grant insert on staff_calls to anon;                            -- chamar atendente
grant insert on orders_log to anon;                             -- registar pedidos
grant select, insert, update, delete on shared_cart_items to anon, authenticated;
grant insert on push_subscriptions to anon;

-- Segurança extra: push_subscriptions sem leitura anónima
alter table push_subscriptions enable row level security;
drop policy if exists "anon_insert_push_subscriptions" on push_subscriptions;
create policy "anon_insert_push_subscriptions" on push_subscriptions
  for insert with check (true);
drop policy if exists "anon_update_push_subscriptions" on push_subscriptions;
create policy "anon_update_push_subscriptions" on push_subscriptions
  for update using (true);
grant update on push_subscriptions to anon;

-- ─────────────────────────────────────────
-- 2. Default privileges — tabelas futuras nunca mais partem
--    (RLS continua a mandar; sem policy = sem acesso às linhas)
-- ─────────────────────────────────────────
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;
alter default privileges in schema public
  grant execute on functions to anon, authenticated;

-- ─────────────────────────────────────────
-- 3. RPC: lista pública e ordenada da fila
--    (só primeiro nome + nº pessoas — sem telefones)
-- ─────────────────────────────────────────
create or replace function waitlist_public_queue(p_slug text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', sub.id,
    'first_name', sub.first_name,
    'party_size', sub.party_size,
    'status', sub.status
  ) order by sub.created_at), '[]'::jsonb)
  into result
  from (
    select w.id, split_part(w.name, ' ', 1) as first_name,
           w.party_size, w.status, w.created_at
    from waitlist_entries w
    where w.espaco_slug = p_slug
      and w.status in ('waiting','notified')
    order by w.created_at
    limit 30
  ) sub;
  return result;
end;
$$;

grant execute on function waitlist_public_queue(text) to anon, authenticated;

-- ─────────────────────────────────────────
-- 3b. waitlist_status agora devolve também o id da entrada
--     (para marcar "Você" na lista pública)
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
    'id', e.id,
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
grant execute on function waitlist_status(uuid) to anon, authenticated;
grant execute on function waitlist_cancel(uuid) to anon, authenticated;
grant execute on function waitlist_queue_info(text) to anon, authenticated;

-- Verificação: deve devolver as permissões do anon/authenticated
select table_name, grantee, privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and grantee in ('anon','authenticated')
  and table_name in ('waitlist_entries','waitlist_settings','onboarding','orders_log')
order by table_name, grantee, privilege_type;
