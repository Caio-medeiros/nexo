-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — 025 Exception handling & observability
-- Projeto dos menus+portal: kgbrtbpeekhkroibsgqq — correr no SQL Editor.
--
-- OBJECTIVO: zero falhas silenciosas. Um trigger de notificação NUNCA pode
-- bloquear o INSERT do cliente; quando falha, fica registado em error_log.
-- Mais: função de health-check + verificação diária automática (pg_cron).
--
-- ADAPTADO (renumerado 010→025; reservations foram removidas na 011 →
-- notify_new_reservation NÃO é recriado).
--
-- Idempotente: seguro re-correr.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. error_log (só service-role / NEXO OS) ─────────────────────────────
create table if not exists error_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  source text not null,
  error_code text,
  error_message text,
  context jsonb default '{}'::jsonb,
  resolved boolean default false,
  resolved_at timestamptz
);
create index if not exists error_log_unresolved_idx
  on error_log(created_at desc) where resolved = false;

alter table error_log enable row level security;
-- Sem políticas → só o service role acede directamente. O portal lê o
-- agregado via nexo_health_check() (security definer), nunca as linhas cruas.

create or replace function cleanup_error_log()
returns void as $$
begin
  delete from error_log
  where created_at < now() - interval '30 days' and resolved = true;
end;
$$ language plpgsql security definer set search_path = public;

-- ── 2. Triggers de notificação à prova de falha ──────────────────────────
-- Mesmo corpo das funções actuais (008), mas o INSERT em portal_notifications
-- passa a estar num bloco begin/exception: se falhar, regista em error_log e
-- DEIXA o INSERT original (pedido/chamada/fila) prosseguir.

create or replace function notify_new_order()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into portal_notifications(
      espaco_slug, type, title, body, reference_id, reference_table
    ) values (
      new.espaco_slug, 'order_new',
      '🍽️ Novo pedido' ||
        case when new.table_label is not null then ' — ' || new.table_label else '' end,
      '€' || coalesce(new.total,0)::text || ' · ' ||
        jsonb_array_length(coalesce(new.items,'[]'::jsonb))::text || ' itens',
      new.id, 'orders_log'
    );
  exception when others then
    insert into error_log(source, error_code, error_message, context)
    values ('trigger:notify_new_order', SQLSTATE, SQLERRM,
            jsonb_build_object('order_id', new.id, 'espaco_slug', new.espaco_slug));
  end;
  return new;
end;
$$;

create or replace function notify_staff_call()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into portal_notifications(
      espaco_slug, type, title, body, reference_id, reference_table
    ) values (
      new.espaco_slug, 'staff_call',
      '🙋 Chamada de mesa' ||
        case when new.table_label is not null then ' — ' || new.table_label else '' end,
      'Cliente a aguardar assistência',
      new.id, 'staff_calls'
    );
  exception when others then
    insert into error_log(source, error_code, error_message, context)
    values ('trigger:notify_staff_call', SQLSTATE, SQLERRM,
            jsonb_build_object('call_id', new.id, 'espaco_slug', new.espaco_slug));
  end;
  return new;
end;
$$;

create or replace function notify_new_waitlist()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into portal_notifications(
      espaco_slug, type, title, body, reference_id, reference_table
    ) values (
      new.espaco_slug, 'waitlist_new',
      '⏳ Fila de espera — ' || new.name,
      new.party_size::text || ' pessoa(s)',
      new.id, 'waitlist_entries'
    );
  exception when others then
    insert into error_log(source, error_code, error_message, context)
    values ('trigger:notify_new_waitlist', SQLSTATE, SQLERRM,
            jsonb_build_object('waitlist_id', new.id, 'espaco_slug', new.espaco_slug));
  end;
  return new;
end;
$$;
-- (Os triggers existentes — orders_log_notify / staff_calls_notify /
--  waitlist_notify — apanham automaticamente a nova definição da função.)

-- ── 3. Health check (estrutural + fluxo de dados; só leitura) ────────────
create or replace function nexo_health_check()
returns jsonb as $$
declare
  result jsonb := '{}'::jsonb;
  tbl_count integer;
  notif_trigger boolean := false;
  realtime_tables text[] := array['menu_events','orders_log','staff_calls','portal_notifications'];
  rt_table text;
  rt_ok boolean := true;
  ev24 integer := 0;
  err1h integer := 0;
begin
  select count(*) into tbl_count from information_schema.tables
   where table_schema='public'
     and table_name in ('menu_events','orders_log','staff_calls','portal_notifications','clients','menus','venue_settings');
  result := result || jsonb_build_object('core_tables', tbl_count);

  select exists(select 1 from information_schema.triggers where trigger_name='orders_log_notify')
    into notif_trigger;
  result := result || jsonb_build_object('order_notification_trigger', notif_trigger);

  foreach rt_table in array realtime_tables loop
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename=rt_table) then
      rt_ok := false;
    end if;
  end loop;
  result := result || jsonb_build_object('realtime_ok', rt_ok);

  -- fluxo de dados: o menu está a escrever? (apanha o tipo de avaria 42501)
  begin
    select count(*) into ev24 from menu_events where created_at > now() - interval '24 hours';
  exception when others then ev24 := -1; end;
  result := result || jsonb_build_object('menu_events_24h', ev24);

  begin
    select count(*) into err1h from error_log where created_at > now() - interval '1 hour' and resolved=false;
  exception when others then err1h := 0; end;
  result := result || jsonb_build_object('errors_last_hour', err1h);

  return result || jsonb_build_object('checked_at', now());
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function nexo_health_check() to anon, authenticated;

-- ── 4. Verificação diária automática → regista anomalias em error_log ────
create or replace function nexo_daily_health_log()
returns void as $$
declare h jsonb; problems text[] := '{}';
begin
  h := nexo_health_check();
  if (h->>'order_notification_trigger')::boolean is not true then problems := problems || 'trigger de notificação em falta'; end if;
  if (h->>'realtime_ok')::boolean is not true then problems := problems || 'realtime não publicado em todas as tabelas'; end if;
  if (h->>'core_tables')::int < 7 then problems := problems || 'tabelas core em falta'; end if;
  if (h->>'menu_events_24h')::int = 0 then problems := problems || 'nenhum menu_event nas últimas 24h (pipeline pode estar partido)'; end if;
  if (h->>'menu_events_24h')::int = -1 then problems := problems || 'erro ao ler menu_events'; end if;

  if array_length(problems,1) is not null then
    insert into error_log(source, error_code, error_message, context)
    values ('cron:daily_health', 'HEALTH', array_to_string(problems, ' · '), h);
  end if;
end;
$$ language plpgsql security definer set search_path = public;

-- pg_cron: corre todos os dias às 06:00. Se a extensão não estiver disponível,
-- a migração continua e basta agendar nexo_daily_health_log() manualmente.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('nexo-daily-health', '0 6 * * *', 'select nexo_daily_health_log()');
exception when others then
  raise notice 'pg_cron indisponível (%, %). Active-o no dashboard ou agende nexo_daily_health_log() por outra via.', sqlstate, sqlerrm;
end $$;

-- ── Verificação ──────────────────────────────────────────────────────────
select nexo_health_check();
