-- ═══════════════════════════════════════════════════════════════════════
-- NEXO Portal — Migration 011 (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq)
-- Remoção da funcionalidade de RESERVAS. Deixou de fazer parte da oferta NEXO.
--
-- Remove tudo o que a 007/008 tinham criado para reservas: tabelas
-- (reservations, reservation_settings), triggers, funções e a entrada na
-- publicação de realtime. Limpa também as notificações de reserva já criadas.
--
-- Idempotente: seguro re-correr.
-- ═══════════════════════════════════════════════════════════════════════

-- Triggers (caem com a tabela, mas removemos explicitamente por clareza)
drop trigger if exists reservation_ref_trigger on reservations;
drop trigger if exists reservations_updated_at on reservations;
drop trigger if exists reservations_notify on reservations;
drop trigger if exists reservation_settings_updated_at on reservation_settings;

-- Funções específicas de reservas
drop function if exists generate_reservation_reference() cascade;
drop function if exists notify_new_reservation() cascade;

-- Tirar da publicação de realtime (ignora se já não estiver)
do $$ begin
  alter publication supabase_realtime drop table reservations;
exception when others then null; end $$;

-- Notificações de reserva já criadas
delete from portal_notifications where type = 'reservation_new';

-- Tabelas
drop table if exists reservations cascade;
drop table if exists reservation_settings cascade;

-- Apertar o CHECK do tipo de notificação (remover 'reservation_new')
alter table portal_notifications drop constraint if exists portal_notifications_type_check;
alter table portal_notifications add constraint portal_notifications_type_check
  check (type in (
    'order_new','staff_call','waitlist_new',
    'review_positive','review_negative','update_done','menu_viewed'
  ));

-- Verificação
select 'reservations existe?' as q,
       to_regclass('public.reservations') is not null as resultado
union all
select 'reservation_settings existe?',
       to_regclass('public.reservation_settings') is not null;
