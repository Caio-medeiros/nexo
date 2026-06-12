-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — Migration 006: Bridge para o NEXO OS + email
-- (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq)
--
-- 1) Quando um cliente cria um pedido de alteração no portal:
--      → envia EMAIL para o Caio (via formsubmit.co — ver nota no fim)
--      → cria uma notificação no NEXO OS (tabela portal_inbox do
--        projeto vniduodmiatkjiyxidba, via REST com a anon key)
-- 2) RPC sync_onboarding: o NEXO OS empurra o estado do onboarding
--    para aqui (para o card do portal atualizar sozinho).
--
-- Correr UMA vez. Seguro re-correr.
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists pg_net;

-- ─────────────────────────────────────────
-- 1. Trigger: novo pedido de alteração → email + NEXO OS
-- ─────────────────────────────────────────
create or replace function notify_update_request()
returns trigger
language plpgsql security definer
set search_path = public, net
as $$
declare
  v_client_name text;
  v_slug text;
begin
  select c.name into v_client_name from clients c where c.id = new.client_id;
  select m.slug into v_slug from menus m where m.id = new.menu_id;

  -- a) Email (formsubmit.co — requer ativação no 1º envio, ver nota)
  perform net.http_post(
    url := 'https://formsubmit.co/ajax/caio42007@gmail.com',
    headers := '{"Content-Type":"application/json","Accept":"application/json"}'::jsonb,
    body := jsonb_build_object(
      '_subject', '[NEXO Portal] ' ||
        case when new.urgent then 'URGENTE — ' else '' end ||
        'Pedido de alteração: ' || coalesce(v_client_name, 'cliente'),
      'Cliente', coalesce(v_client_name, '—'),
      'Menu', coalesce(v_slug, '—'),
      'Tipo', coalesce(new.type, '—'),
      'Descricao', coalesce(new.description, '—'),
      'Anexo', coalesce(new.photo_url, 'sem anexo'),
      '_template', 'table'
    )
  );

  -- b) Notificação no NEXO OS (insert na portal_inbox do projeto vnid)
  perform net.http_post(
    url := 'https://vniduodmiatkjiyxidba.supabase.co/rest/v1/portal_inbox',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuaWR1b2RtaWF0a2ppeXhpZGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTExNDEsImV4cCI6MjA5NDc2NzE0MX0.uRhOCgql9ZwnjQlCoheheIJkNIXsJ4gnsLKqKn55cPA',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuaWR1b2RtaWF0a2ppeXhpZGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTExNDEsImV4cCI6MjA5NDc2NzE0MX0.uRhOCgql9ZwnjQlCoheheIJkNIXsJ4gnsLKqKn55cPA',
      'Prefer', 'return=minimal'
    ),
    body := jsonb_build_object(
      'kind', 'update_request',
      'client_name', coalesce(v_client_name, '—'),
      'espaco_slug', v_slug,
      'urgent', coalesce(new.urgent, false),
      'payload', jsonb_build_object(
        'type', new.type,
        'description', new.description,
        'photo_url', new.photo_url,
        'request_id', new.id
      )
    )
  );

  return new;
end;
$$;

drop trigger if exists update_requests_notify on update_requests;
create trigger update_requests_notify
  after insert on update_requests
  for each row execute function notify_update_request();

-- ─────────────────────────────────────────
-- 2. RPC: o NEXO OS empurra o onboarding para o portal
--    (só o service_role do NEXO OS pode chamar — anon/authenticated não)
-- ─────────────────────────────────────────
create or replace function sync_onboarding(p_client_name text, p jsonb)
returns boolean
language plpgsql security definer
set search_path = public
as $$
declare
  v_client_id uuid;
begin
  select id into v_client_id from clients where name = p_client_name limit 1;
  if v_client_id is null then return false; end if;

  insert into onboarding (
    client_id,
    received_menu_content, received_logo, received_colors,
    menu_configured, deployed_to_netlify, nfc_programmed,
    client_approved, hardware_delivered, team_briefed,
    photo_taken, testimonial_received
  ) values (
    v_client_id,
    coalesce((p->>'received_menu_content')::boolean, false),
    coalesce((p->>'received_logo')::boolean, false),
    coalesce((p->>'received_colors')::boolean, false),
    coalesce((p->>'menu_configured')::boolean, false),
    coalesce((p->>'deployed_to_netlify')::boolean, false),
    coalesce((p->>'nfc_programmed')::boolean, false),
    coalesce((p->>'client_approved')::boolean, false),
    coalesce((p->>'hardware_delivered')::boolean, false),
    coalesce((p->>'team_briefed')::boolean, false),
    coalesce((p->>'photo_taken')::boolean, false),
    coalesce((p->>'testimonial_received')::boolean, false)
  )
  on conflict (client_id) do update set
    received_menu_content = excluded.received_menu_content,
    received_logo = excluded.received_logo,
    received_colors = excluded.received_colors,
    menu_configured = excluded.menu_configured,
    deployed_to_netlify = excluded.deployed_to_netlify,
    nfc_programmed = excluded.nfc_programmed,
    client_approved = excluded.client_approved,
    hardware_delivered = excluded.hardware_delivered,
    team_briefed = excluded.team_briefed,
    photo_taken = excluded.photo_taken,
    testimonial_received = excluded.testimonial_received;

  return true;
end;
$$;

-- só chamável com a service key (vem do trigger do projeto NEXO OS)
revoke execute on function sync_onboarding(text, jsonb) from public, anon, authenticated;
grant execute on function sync_onboarding(text, jsonb) to service_role;

select 'bridge kgbrt ok' as status;

-- ═══════════════════════════════════════════════════════════════════════
-- NOTA — ativação do email (1 minuto, uma única vez):
-- O primeiro pedido de alteração dispara um email do formsubmit.co
-- para caio42007@gmail.com a pedir confirmação ("Activate"). Clica no
-- link e a partir daí todos os pedidos chegam por email automaticamente.
-- Para mudar o destinatário: substituir o email no url do http_post acima.
-- ═══════════════════════════════════════════════════════════════════════
