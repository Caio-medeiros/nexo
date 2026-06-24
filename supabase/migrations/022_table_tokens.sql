-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — 022 Table Access Tokens (TAT)
-- Verificação de presença física: cada mesa tem um token único guardado no
-- hardware (NFC + QR). Menu carrega em modo FULL (com token) ou BROWSE (sem).
--
-- Projeto dos menus+portal: kgbrtbpeekhkroibsgqq — correr no SQL Editor.
--
-- ADAPTADO ao schema real (o prompt assumia ficheiros que não existem):
--   • Renumerado de 009 → 022 (009 já existe).
--   • NÃO usa reservation_settings (RESERVAS foram removidas na 011). A
--     verificação de horário usa apenas venue_settings.is_open.
--   • venue_settings já tem table_count + is_open (migração 018).
--
-- Idempotente: seguro re-correr.
-- ═══════════════════════════════════════════════════════════════════════

-- ── Tokens por mesa em venue_settings ────────────────────────────────────
alter table venue_settings
  add column if not exists table_tokens jsonb default '{}'::jsonb,
  add column if not exists tokens_generated_at timestamptz;

-- ── Rastreio da origem do pedido ─────────────────────────────────────────
alter table orders_log
  add column if not exists order_source text
    check (order_source in ('nfc', 'qr', 'direct', 'staff', 'comanda')) default 'direct',
  add column if not exists had_valid_token boolean default false;

alter table comandas
  add column if not exists order_source text
    check (order_source in ('nfc', 'qr', 'direct', 'staff')) default 'direct',
  add column if not exists had_valid_token boolean default false;

-- ── Registo de actividade suspeita (revisão no portal; nunca visível ao
--    cliente) ──────────────────────────────────────────────────────────────
create table if not exists order_flags (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  espaco_slug text not null,
  flag_type text not null check (flag_type in (
    'no_token',          -- pedido sem token
    'invalid_token',     -- token errado
    'outside_hours',     -- fora de horário
    'rate_limit',        -- demasiados pedidos/chamadas
    'impossible_table',  -- mesa > table_count
    'token_flood'        -- mesmo token, muitos dispositivos
  )),
  session_id text,
  table_label text,
  details jsonb default '{}'::jsonb,
  reviewed boolean default false
);

create index if not exists order_flags_slug_idx
  on order_flags(espaco_slug, created_at desc);
create index if not exists order_flags_unreviewed_idx
  on order_flags(espaco_slug, reviewed) where reviewed = false;

alter table order_flags enable row level security;

-- O menu (anónimo) regista flags → insert público validado pelo slug.
drop policy if exists "public_insert_order_flags" on order_flags;
create policy "public_insert_order_flags"
  on order_flags for insert
  with check (
    exists (select 1 from menus where slug = espaco_slug)
    and char_length(coalesce(session_id, '')) <= 64
    and char_length(coalesce(table_label, '')) <= 50
  );

-- O portal (autenticado) lê / marca como revisto só o seu espaço.
drop policy if exists "owns_order_flags" on order_flags;
drop policy if exists "owns_order_flags_select" on order_flags;
drop policy if exists "owns_order_flags_update" on order_flags;
create policy "owns_order_flags_select"
  on order_flags for select using (owns_espaco(espaco_slug));
create policy "owns_order_flags_update"
  on order_flags for update using (owns_espaco(espaco_slug)) with check (owns_espaco(espaco_slug));

grant insert on order_flags to anon, authenticated;
grant select, update on order_flags to authenticated;

-- ── Função: gerar tokens para um espaço ──────────────────────────────────
create or replace function generate_table_tokens(p_slug text, p_count integer)
returns jsonb as $$
declare
  tokens jsonb := '{}'::jsonb;
  i integer;
  tok text;
begin
  if p_count is null or p_count < 1 then
    return tokens;
  end if;
  for i in 1..p_count loop
    tok := 'tok_' || lower(substr(md5(
      p_slug || i::text || extract(epoch from now())::text || random()::text
    ), 1, 12));
    tokens := tokens || jsonb_build_object(i::text, tok);
  end loop;

  update venue_settings
    set table_tokens = tokens, tokens_generated_at = now()
    where espaco_slug = p_slug;

  return tokens;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function generate_table_tokens(text, integer) to authenticated;

-- ── Backfill: gerar tokens para espaços existentes ainda sem tokens ──────
do $$
declare v record;
begin
  for v in
    select espaco_slug, table_count
    from venue_settings
    where table_tokens = '{}'::jsonb or table_tokens is null
  loop
    perform generate_table_tokens(v.espaco_slug, v.table_count);
  end loop;
end $$;

-- ── Limpeza: manter flags 90 dias ────────────────────────────────────────
create or replace function cleanup_order_flags()
returns void as $$
begin
  delete from order_flags where created_at < now() - interval '90 days';
end;
$$ language plpgsql security definer set search_path = public;

-- Verificação
select espaco_slug, table_count, jsonb_object_keys(table_tokens) as mesa_token
from venue_settings order by espaco_slug;
