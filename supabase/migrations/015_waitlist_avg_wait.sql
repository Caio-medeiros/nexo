-- ═══════════════════════════════════════════════════════════════════════
-- NEXO Fila — Migration 015 (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq)
-- TEMPO DE ESPERA = MÉDIA REAL DA SECÇÃO, sempre a atualizar.
--
-- Antes: estimativa = grupos_à_frente × minutes_per_group (valor fixo, 10 min).
-- Agora: o minutos-por-grupo é a MÉDIA real de espera dos grupos já sentados
-- neste espaço (últimos 30 dias / 30 grupos). Como cada consulta recalcula,
-- o número ajusta-se sozinho ao ritmo real do restaurante. Fallback para o
-- valor configurado (ou 10) enquanto não houver histórico suficiente.
--
-- Idempotente. Correr no SQL Editor do projeto dos menus.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- Média de espera (minutos) por grupo, ao vivo, por espaço
-- ─────────────────────────────────────────
create or replace function waitlist_avg_minutes(p_slug text)
returns integer
language sql security definer set search_path = public stable as $$
  select greatest(1, round(coalesce(
    -- média real dos últimos grupos sentados (espera = seated_at − created_at)
    (select avg(extract(epoch from (seated_at - created_at)) / 60.0)
       from (
         select seated_at, created_at
           from waitlist_entries
          where espaco_slug = p_slug
            and status = 'seated'
            and seated_at is not null
            and seated_at > created_at
            and seated_at >= now() - interval '30 days'
          order by seated_at desc
          limit 30
       ) r),
    -- fallback: valor configurado pelo restaurante
    (select minutes_per_group from waitlist_settings where espaco_slug = p_slug),
    -- fallback final
    10
  )))::int;
$$;
grant execute on function waitlist_avg_minutes(text) to anon, authenticated;

-- ─────────────────────────────────────────
-- RPC estado do cliente — usa a média da secção
-- ─────────────────────────────────────────
create or replace function waitlist_status(p_token uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
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

  mins := waitlist_avg_minutes(e.espaco_slug);
  select coalesce(s.open, true) into is_open
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
    'avg_wait_minutes', mins,
    'total_waiting', total_waiting,
    'queue_open', is_open,
    'created_at', e.created_at
  );
end;
$$;

-- ─────────────────────────────────────────
-- RPC info da fila (antes do join) — usa a média da secção
-- ─────────────────────────────────────────
create or replace function waitlist_queue_info(p_slug text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  mins integer;
  is_open boolean;
  total_waiting integer;
begin
  mins := waitlist_avg_minutes(p_slug);
  select coalesce(s.open, true) into is_open
  from (select 1) x
  left join waitlist_settings s on s.espaco_slug = p_slug;

  select count(*) into total_waiting
  from waitlist_entries w
  where w.espaco_slug = p_slug and w.status = 'waiting';

  return jsonb_build_object(
    'queue_open', is_open,
    'total_waiting', total_waiting,
    'est_minutes', total_waiting * mins,
    'avg_wait_minutes', mins
  );
end;
$$;

grant execute on function waitlist_status(uuid) to anon, authenticated;
grant execute on function waitlist_queue_info(text) to anon, authenticated;

-- Verificação
select waitlist_avg_minutes('marisca-petisca') as media_marisca;
