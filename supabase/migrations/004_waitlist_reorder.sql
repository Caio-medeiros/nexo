-- ═══════════════════════════════════════════════════════════════════════
-- NEXO Fila de Espera — Migration 004: ordenação manual (drag & drop)
-- (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq)
-- Correr UMA vez. Seguro re-correr.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. Coluna de ordenação (epoch da criação por defeito)
-- ─────────────────────────────────────────
alter table waitlist_entries
  add column if not exists sort_order double precision
  default extract(epoch from now());

update waitlist_entries
  set sort_order = extract(epoch from created_at)
  where sort_order is null;

create index if not exists waitlist_entries_sort_idx
  on waitlist_entries (espaco_slug, status, sort_order);

-- ─────────────────────────────────────────
-- 2. waitlist_status — posição passa a contar por sort_order
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
    and coalesce(w.sort_order, extract(epoch from w.created_at))
      < coalesce(e.sort_order, extract(epoch from e.created_at));

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

-- Verificação
select id, name, status, sort_order from waitlist_entries
order by espaco_slug, sort_order limit 10;
