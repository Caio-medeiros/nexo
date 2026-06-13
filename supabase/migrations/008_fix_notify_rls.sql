-- ═══════════════════════════════════════════════════════════════════════
-- NEXO Portal — Migration 008 (HOTFIX da 007)
-- Os triggers de notificação inserem em portal_notifications. Como corriam
-- com as permissões de quem faz o insert (visitante anónimo do menu / página
-- de reservas), o RLS de portal_notifications bloqueava com:
--   42501: new row violates row-level security policy for "portal_notifications"
--
-- Correção: recriar as 4 funções como SECURITY DEFINER (correm como o dono e
-- contornam o RLS apenas para escrever a notificação). Os triggers apanham a
-- nova definição automaticamente — não é preciso recriá-los.
--
-- Idempotente: seguro re-correr.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function notify_new_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into portal_notifications(
    espaco_slug, type, title, body, reference_id, reference_table
  ) values (
    new.espaco_slug,
    'order_new',
    '🍽️ Novo pedido' ||
      case when new.table_label is not null then ' — ' || new.table_label else '' end,
    '€' || coalesce(new.total,0)::text || ' · ' ||
      jsonb_array_length(coalesce(new.items,'[]'::jsonb))::text || ' itens',
    new.id,
    'orders_log'
  );
  return new;
end;
$$;

create or replace function notify_new_reservation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into portal_notifications(
    espaco_slug, type, title, body, reference_id, reference_table
  ) values (
    new.espaco_slug,
    'reservation_new',
    '📅 Nova reserva — ' || new.guest_name,
    to_char(new.reservation_date::date, 'DD/MM/YYYY') ||
      ' às ' || to_char(new.reservation_time, 'HH24:MI') ||
      ' · ' || new.party_size::text || ' pessoas',
    new.id,
    'reservations'
  );
  return new;
end;
$$;

create or replace function notify_staff_call()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into portal_notifications(
    espaco_slug, type, title, body, reference_id, reference_table
  ) values (
    new.espaco_slug,
    'staff_call',
    '🙋 Chamada de mesa' ||
      case when new.table_label is not null then ' — ' || new.table_label else '' end,
    'Cliente a aguardar assistência',
    new.id,
    'staff_calls'
  );
  return new;
end;
$$;

create or replace function notify_new_waitlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into portal_notifications(
    espaco_slug, type, title, body, reference_id, reference_table
  ) values (
    new.espaco_slug,
    'waitlist_new',
    '⏳ Fila de espera — ' || new.name,
    new.party_size::text || ' pessoa(s)',
    new.id,
    'waitlist_entries'
  );
  return new;
end;
$$;
