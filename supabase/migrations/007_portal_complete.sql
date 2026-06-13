-- ═══════════════════════════════════════════════════════════════════════
-- NEXO Portal — Migration 007 (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq)
-- "Portal completo": analytics, reservas, relatórios IA, notificações.
-- Correr UMA vez no Supabase SQL Editor deste projeto.
--
-- Idempotente: seguro re-correr. Adapta-se ao schema já existente
-- (orders_log, item_availability, staff_calls, waitlist_entries já existem).
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- ANALYTICS EVENTS
-- ─────────────────────────────────────────────
create table if not exists menu_events (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  espaco_slug text not null,
  event_name text not null,
  session_id text,
  language text default 'pt',
  item_name text,
  item_category text,
  item_price numeric(10,2),
  order_total numeric(10,2),
  item_count integer,
  rating integer,
  review_destination text,
  split_people integer,
  from_language text,
  to_language text,
  properties jsonb default '{}'
);
create index if not exists menu_events_main_idx
  on menu_events(espaco_slug, created_at desc);
create index if not exists menu_events_event_idx
  on menu_events(espaco_slug, event_name, created_at desc);

-- ─────────────────────────────────────────────
-- WEEKLY AI REPORTS
-- ─────────────────────────────────────────────
create table if not exists weekly_reports (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  espaco_slug text not null,
  week_start date not null,
  week_end date not null,
  report_text text not null,
  metrics_snapshot jsonb,
  unique(espaco_slug, week_start)
);

-- ─────────────────────────────────────────────
-- ORDERS LOG — já existe (migration 001). Acrescentar 'status'.
-- ─────────────────────────────────────────────
alter table orders_log
  add column if not exists status text default 'new';

do $$ begin
  alter table orders_log
    add constraint orders_log_status_check
    check (status in ('new','seen','done'));
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────
-- PORTAL NOTIFICATIONS
-- ─────────────────────────────────────────────
create table if not exists portal_notifications (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  espaco_slug text not null,
  type text not null check (type in (
    'order_new',
    'staff_call',
    'waitlist_new',
    'reservation_new',
    'review_positive',
    'review_negative',
    'update_done',
    'menu_viewed'
  )),
  title text not null,
  body text,
  reference_id uuid,
  reference_table text,
  read boolean default false,
  read_at timestamptz
);
create index if not exists portal_notifications_slug_idx
  on portal_notifications(espaco_slug, created_at desc);
create index if not exists portal_notifications_unread_idx
  on portal_notifications(espaco_slug, read)
  where read = false;

-- ─────────────────────────────────────────────
-- RESERVATION SETTINGS
-- ─────────────────────────────────────────────
create table if not exists reservation_settings (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  espaco_slug text not null unique,
  restaurant_name text,
  enabled boolean default true,
  max_party_size integer default 12,
  slot_duration_minutes integer default 90,
  advance_days integer default 30,
  min_notice_hours integer default 2,
  auto_confirm boolean default false,
  confirmation_message text default
    'A sua reserva foi recebida. Confirmaremos brevemente.',
  whatsapp_notify text,
  opening_hours jsonb default '{
    "monday":    {"open":"12:00","close":"23:00","closed":false},
    "tuesday":   {"open":"12:00","close":"23:00","closed":false},
    "wednesday": {"open":"12:00","close":"23:00","closed":false},
    "thursday":  {"open":"12:00","close":"23:00","closed":false},
    "friday":    {"open":"12:00","close":"24:00","closed":false},
    "saturday":  {"open":"12:00","close":"24:00","closed":false},
    "sunday":    {"open":"12:00","close":"22:00","closed":false}
  }',
  total_capacity integer default 40,
  blocked_dates jsonb default '[]'
);
alter table reservation_settings add column if not exists restaurant_name text;

-- ─────────────────────────────────────────────
-- RESERVATIONS
-- ─────────────────────────────────────────────
create table if not exists reservations (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  espaco_slug text not null,
  reference text unique not null,
  guest_name text not null,
  guest_phone text not null,
  guest_email text,
  party_size integer not null check (party_size >= 1),
  reservation_date date not null,
  reservation_time time not null,
  status text check (status in (
    'pending','confirmed','cancelled',
    'no_show','seated','completed'
  )) default 'pending',
  special_requests text,
  internal_notes text,
  source text check (source in (
    'direct_link','menu','portal','phone','walk_in'
  )) default 'direct_link',
  cancelled_reason text,
  reminded_at timestamptz,
  seated_at timestamptz
);
create index if not exists reservations_slug_date_idx
  on reservations(espaco_slug, reservation_date, status);

-- ─────────────────────────────────────────────
-- ITEM AVAILABILITY — já existe (migrations 001/005). Garantir presença.
-- ─────────────────────────────────────────────
create table if not exists item_availability (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  espaco_slug text not null,
  item_id text not null,
  item_name text,
  available boolean default true,
  unique(espaco_slug, item_id)
);

-- ─────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────
create or replace function generate_reservation_reference()
returns trigger as $$
begin
  new.reference := 'RES-' ||
    upper(substr(md5(random()::text||now()::text),1,6));
  return new;
end;
$$ language plpgsql;

drop trigger if exists reservation_ref_trigger on reservations;
create trigger reservation_ref_trigger
  before insert on reservations
  for each row execute function generate_reservation_reference();

create or replace function update_updated_at_column()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists reservations_updated_at on reservations;
create trigger reservations_updated_at
  before update on reservations
  for each row execute function update_updated_at_column();

drop trigger if exists reservation_settings_updated_at on reservation_settings;
create trigger reservation_settings_updated_at
  before update on reservation_settings
  for each row execute function update_updated_at_column();

-- Auto-criar notificação do portal em novo pedido
create or replace function notify_new_order()
returns trigger as $$
begin
  insert into portal_notifications(
    espaco_slug, type, title, body,
    reference_id, reference_table
  ) values (
    new.espaco_slug,
    'order_new',
    '🍽️ Novo pedido' ||
      case when new.table_label is not null
        then ' — ' || new.table_label else '' end,
    '€' || coalesce(new.total,0)::text || ' · ' ||
      jsonb_array_length(coalesce(new.items,'[]'::jsonb))::text || ' itens',
    new.id,
    'orders_log'
  );
  return new;
end;
$$ language plpgsql;

drop trigger if exists orders_log_notify on orders_log;
create trigger orders_log_notify
  after insert on orders_log
  for each row execute function notify_new_order();

-- Auto-criar notificação do portal em nova reserva
create or replace function notify_new_reservation()
returns trigger as $$
begin
  insert into portal_notifications(
    espaco_slug, type, title, body,
    reference_id, reference_table
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
$$ language plpgsql;

drop trigger if exists reservations_notify on reservations;
create trigger reservations_notify
  after insert on reservations
  for each row execute function notify_new_reservation();

-- Auto-criar notificação em chamada de staff
create or replace function notify_staff_call()
returns trigger as $$
begin
  insert into portal_notifications(
    espaco_slug, type, title, body,
    reference_id, reference_table
  ) values (
    new.espaco_slug,
    'staff_call',
    '🙋 Chamada de mesa' ||
      case when new.table_label is not null
        then ' — ' || new.table_label else '' end,
    'Cliente a aguardar assistência',
    new.id,
    'staff_calls'
  );
  return new;
end;
$$ language plpgsql;

drop trigger if exists staff_calls_notify on staff_calls;
create trigger staff_calls_notify
  after insert on staff_calls
  for each row execute function notify_staff_call();

-- Auto-criar notificação em nova entrada na fila de espera
create or replace function notify_new_waitlist()
returns trigger as $$
begin
  insert into portal_notifications(
    espaco_slug, type, title, body,
    reference_id, reference_table
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
$$ language plpgsql;

drop trigger if exists waitlist_notify on waitlist_entries;
create trigger waitlist_notify
  after insert on waitlist_entries
  for each row execute function notify_new_waitlist();

-- ─────────────────────────────────────────────
-- REALTIME PUBLICATIONS (guardado — seguro re-correr)
-- ─────────────────────────────────────────────
do $$ begin alter publication supabase_realtime add table menu_events;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table orders_log;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table reservations;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table portal_notifications;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table item_availability;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table staff_calls;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table waitlist_entries;
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table menu_events enable row level security;
alter table weekly_reports enable row level security;
alter table orders_log enable row level security;
alter table portal_notifications enable row level security;
alter table reservation_settings enable row level security;
alter table reservations enable row level security;
alter table item_availability enable row level security;

-- Helper: o utilizador autenticado é dono deste espaco_slug?
create or replace function owns_espaco(slug text)
returns boolean as $$
  select exists (
    select 1 from menus m
    join clients c on c.id = m.client_id
    where m.slug = slug
      and c.auth_user_id = auth.uid()
  )
$$ language sql security definer;

-- Políticas do portal (cliente autenticado vê os próprios dados)
drop policy if exists "owns_menu_events" on menu_events;
create policy "owns_menu_events" on menu_events
  for select using (owns_espaco(espaco_slug));

drop policy if exists "owns_weekly_reports" on weekly_reports;
create policy "owns_weekly_reports" on weekly_reports
  for select using (owns_espaco(espaco_slug));

drop policy if exists "owns_orders_log" on orders_log;
create policy "owns_orders_log" on orders_log
  for select using (owns_espaco(espaco_slug));

-- o portal precisa de marcar pedidos como vistos
drop policy if exists "owns_orders_log_update" on orders_log;
create policy "owns_orders_log_update" on orders_log
  for update using (owns_espaco(espaco_slug));

drop policy if exists "owns_portal_notifications" on portal_notifications;
create policy "owns_portal_notifications" on portal_notifications
  for all using (owns_espaco(espaco_slug));

drop policy if exists "owns_reservation_settings" on reservation_settings;
create policy "owns_reservation_settings" on reservation_settings
  for all using (owns_espaco(espaco_slug));

drop policy if exists "owns_reservations" on reservations;
create policy "owns_reservations" on reservations
  for all using (owns_espaco(espaco_slug));

drop policy if exists "owns_item_availability" on item_availability;
create policy "owns_item_availability" on item_availability
  for all using (owns_espaco(espaco_slug));

-- Políticas públicas (formulário de reservas + analytics — sem auth)
drop policy if exists "public_read_reservation_settings" on reservation_settings;
create policy "public_read_reservation_settings"
  on reservation_settings for select using (true);

drop policy if exists "public_insert_reservation" on reservations;
create policy "public_insert_reservation"
  on reservations for insert with check (true);

drop policy if exists "public_read_own_reservation" on reservations;
create policy "public_read_own_reservation"
  on reservations for select using (true);

drop policy if exists "public_insert_menu_events" on menu_events;
create policy "public_insert_menu_events"
  on menu_events for insert with check (true);

-- ─────────────────────────────────────────────
-- SEED demo — página pública de reservas
-- ─────────────────────────────────────────────
insert into reservation_settings (espaco_slug, restaurant_name, enabled, whatsapp_notify)
values ('rest-nexo-lisboa', 'NEXO Lisboa', true, '+351912345678')
on conflict (espaco_slug) do nothing;

-- Marisca Petisca (cliente demo) — ativar reservas se tiver menu
insert into reservation_settings (espaco_slug, restaurant_name, enabled)
select m.slug, c.name, true
from menus m join clients c on c.id = m.client_id
where c.name = 'Marisca Petisca'
on conflict (espaco_slug) do nothing;

-- ─────────────────────────────────────────────
-- Verificação
-- ─────────────────────────────────────────────
select 'menu_events' as tbl, count(*) from menu_events
union all select 'reservations', count(*) from reservations
union all select 'reservation_settings', count(*) from reservation_settings
union all select 'portal_notifications', count(*) from portal_notifications
union all select 'weekly_reports', count(*) from weekly_reports;
