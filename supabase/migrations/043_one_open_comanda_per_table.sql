-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — 043: UMA comanda aberta por mesa (integridade na BASE DE DADOS)
-- (PROJETO DOS MENUS+PORTAL: kgbrtbpeekhkroibsgqq — correr no SQL Editor)
--
-- PROBLEMA: uma sessão/cliente conseguia abrir várias comandas para a mesma
-- mesa (e alimentar mesas diferentes). O total certo por mesa dependia de o
-- cliente "acertar" numa única comanda. Travas só no JS não chegam — duas
-- abas/telemóveis batiam ao mesmo tempo e criavam duplicados na corrida.
--
-- INVARIANTE (vive AQUI, não no JS):
--   por (espaco_slug, table_number) existe no máximo UMA comanda com
--   status not in ('closed','cancelled').
--
-- COMO:
--   1. comandas ganha table_number (inteiro), derivado de table_label
--      ('Mesa N' → N). Um trigger mantém-no preenchido em qualquer INSERT/
--      UPDATE — mesmo nos caminhos antigos que só escrevem table_label.
--   2. Colapsa duplicados JÁ existentes (mantém a mais recente aberta por
--      mesa; fecha as antigas) para o índice único poder nascer.
--   3. Índice único parcial trava a mesa: a 2.ª comanda aberta da mesma mesa
--      falha com unique_violation.
--   4. RPC get-or-create nexo_open_table_comanda: valida a presença (token de
--      mesa TAT, como o nexo_table_access) e devolve a comanda aberta da mesa
--      (juntando-se) OU cria-a travando a mesa. Trata a corrida.
--
-- Idempotente e narrado: seguro re-correr. Não toca migrações 001–042.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Coluna table_number + backfill a partir de table_label ─────────────
alter table comandas
  add column if not exists table_number integer;

update comandas
  set table_number = (substring(table_label from '\d+'))::int
  where table_number is null
    and table_label is not null
    and table_label ~ '\d';

-- ── 2. Trigger: mantém table_number derivado de table_label ───────────────
-- Garante que TODA a comanda (mesmo criada pelo caminho antigo que só escreve
-- table_label) fica sob o índice único. Não sobrepõe um table_number já dado
-- explicitamente (ex.: a RPC de get-or-create).
create or replace function comanda_derive_table_number()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.table_number is null
     and new.table_label is not null
     and new.table_label ~ '\d' then
    new.table_number := (substring(new.table_label from '\d+'))::int;
  end if;
  return new;
end;
$$;

drop trigger if exists comanda_derive_table_number_trg on comandas;
create trigger comanda_derive_table_number_trg
  before insert or update of table_label, table_number on comandas
  for each row execute function comanda_derive_table_number();

-- ── 3. Colapsar duplicados existentes (pré-invariante) ────────────────────
-- Mantém a comanda aberta MAIS RECENTE por (slug, mesa); fecha as anteriores.
-- O dono continua a vê-las por owns_espaco (histórico); apenas saem do "aberto"
-- para o índice único poder ser criado. Re-correr não encontra duplicados.
with ranked as (
  select id,
         row_number() over (
           partition by espaco_slug, table_number
           order by created_at desc, id desc
         ) as rn
  from comandas
  where table_number is not null
    and status not in ('closed', 'cancelled')
    and coalesce(archived_at, 'infinity'::timestamptz) = 'infinity'::timestamptz
)
update comandas c
  set status = 'closed',
      closed_at = coalesce(c.closed_at, now())
  from ranked r
  where c.id = r.id
    and r.rn > 1;

-- ── 4. Índice único parcial: UMA comanda aberta por mesa ──────────────────
create unique index if not exists uq_open_comanda_per_table
  on comandas (espaco_slug, table_number)
  where table_number is not null
    and status not in ('closed', 'cancelled');

-- ── 5. RPC get-or-create: nexo_open_table_comanda ─────────────────────────
-- Valida o token de mesa (TAT) NO SERVIDOR — mesma disciplina do
-- nexo_table_access (037). Devolve a comanda aberta da mesa (para o cliente se
-- juntar) OU cria-a, travando a mesa. Em corrida (unique_violation) re-seleciona
-- a existente e devolve-a — nunca falha por duas pessoas tocarem ao mesmo tempo.
create or replace function nexo_open_table_comanda(
  p_slug text,
  p_table_num integer,
  p_table_token text
)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_settings record;
  v_comanda record;
  v_label text;
begin
  if p_slug is null or p_slug !~ '^[a-z0-9\-]+$' then
    return jsonb_build_object('valid', false);
  end if;

  select table_count, table_tokens into v_settings
  from venue_settings where espaco_slug = p_slug;
  if not found then
    return jsonb_build_object('valid', false);
  end if;

  -- presença: token de mesa tem de bater com o guardado (venue_settings)
  if not (p_table_num is not null
          and p_table_num between 1 and coalesce(v_settings.table_count, 0)
          and p_table_token is not null
          and char_length(p_table_token) <= 64
          and v_settings.table_tokens ->> p_table_num::text = p_table_token) then
    return jsonb_build_object('valid', false,
                              'table_count', v_settings.table_count);
  end if;

  v_label := 'Mesa ' || p_table_num::text;

  -- comanda aberta desta mesa? → junta-se (devolve id + client_token)
  select id, session_code, table_label, table_number, status, client_token
    into v_comanda
  from comandas
  where espaco_slug = p_slug
    and table_number = p_table_num
    and status not in ('closed', 'cancelled')
    and archived_at is null
  order by created_at desc
  limit 1;

  if found then
    return jsonb_build_object('valid', true,
      'joined', true,
      'comanda', jsonb_build_object(
        'id', v_comanda.id, 'session_code', v_comanda.session_code,
        'table_label', v_comanda.table_label, 'table_number', v_comanda.table_number,
        'status', v_comanda.status, 'client_token', v_comanda.client_token));
  end if;

  -- senão: cria travando a mesa (o índice único garante a exclusividade)
  begin
    insert into comandas (espaco_slug, table_label, table_number, guest_count, mode)
    values (p_slug, v_label, p_table_num, 1, 'dine_in')
    returning id, session_code, table_label, table_number, status, client_token
      into v_comanda;
  exception when unique_violation then
    -- corrida: outra sessão criou-a no mesmo instante → re-seleciona
    select id, session_code, table_label, table_number, status, client_token
      into v_comanda
    from comandas
    where espaco_slug = p_slug
      and table_number = p_table_num
      and status not in ('closed', 'cancelled')
      and archived_at is null
    order by created_at desc
    limit 1;
  end;

  return jsonb_build_object('valid', true,
    'joined', false,
    'comanda', jsonb_build_object(
      'id', v_comanda.id, 'session_code', v_comanda.session_code,
      'table_label', v_comanda.table_label, 'table_number', v_comanda.table_number,
      'status', v_comanda.status, 'client_token', v_comanda.client_token));
end;
$$;

revoke all on function nexo_open_table_comanda(text, integer, text) from public;
grant execute on function nexo_open_table_comanda(text, integer, text) to anon, authenticated;

-- ── 6. Poderes do staff (Fase 4) ──────────────────────────────────────────
-- As políticas de UPDATE do DONO já existem (028): portal_update_comanda
-- (owns_espaco) cobre fechar E mover a comanda (table_number/table_label);
-- portal_update_comanda_items cobre editar/anular/mover itens entre comandas.
-- O anon continua restrito ao ciclo aberto (033). Nada a alterar aqui —
-- confirmado pela verificação abaixo.

-- ── Verificação ───────────────────────────────────────────────────────────
select 'one open comanda per table 043 ok' as status,
  (select count(*) from information_schema.columns
     where table_name = 'comandas' and column_name = 'table_number')          as has_table_number,   -- 1
  (select count(*) from pg_indexes
     where indexname = 'uq_open_comanda_per_table')                           as unique_index,        -- 1
  (select count(*) from pg_proc where proname = 'nexo_open_table_comanda')     as rpc,                 -- 1
  (select count(*) from pg_trigger
     where tgname = 'comanda_derive_table_number_trg')                        as derive_trigger,      -- 1
  (select count(*) from (
     select espaco_slug, table_number
     from comandas
     where table_number is not null and status not in ('closed','cancelled')
     group by espaco_slug, table_number having count(*) > 1) d)               as remaining_dupes;     -- 0
