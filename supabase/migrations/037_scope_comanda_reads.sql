-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — 037: fechar a leitura anónima cruzada de comandas
-- (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq — correr no SQL Editor)
--
-- PROBLEMA: as políticas SELECT de comandas/comanda_items/comanda_rounds
-- ficaram `using (true)` (016/020/028) com GRANT SELECT a anon. Com a anon
-- key que está no bundle de QUALQUER menu, um anónimo lê TODAS as comandas
-- de TODOS os venues: table_label, notes (texto livre do cliente), itens e
-- preços. Furo de isolamento multi-tenant + risco GDPR.
--
-- OBJETIVO: leitura passa a exigir capacidade real, sem partir:
--   • o menu do cliente (anon, sem login) a seguir a SUA comanda;
--   • a sala/cozinha/financeiro autenticados (owns_espaco) a ver o venue.
--
-- ABORDAGEM (porquê esta e não outra):
--   • Cada comanda ganha um `client_token` (uuid). Quem criou/juntou-se à
--     comanda guarda o token no dispositivo e envia-o no header
--     `x-comanda-token` — o PostgREST expõe os headers do pedido em
--     current_setting('request.headers'), por isso a política RLS consegue
--     compará-lo linha a linha. JWT claims não servem: o cliente do menu é
--     anon puro (sem login), os claims são fixos para toda a gente.
--   • SEM header → nenhuma condição passa → 0 linhas. A defesa não depende
--     de o cliente "portar-se bem": omitir o token nega tudo por defeito.
--   • Descoberta da comanda (o token não cai do céu):
--       – quem CRIA a comanda gera o token no dispositivo e insere-o;
--       – quem chega depois à MESMA mesa prova presença com o token de mesa
--         (TAT, 022) via RPC nexo_table_access — validado no SERVIDOR;
--       – quem tem o session_code (partilha intencional) usa a RPC
--         nexo_join_comanda. Ambas SECURITY DEFINER, âmbito mínimo.
--   • Realtime: o WALRUS avalia as políticas SELECT por subscritor mas SEM
--     headers de request — postgres_changes deixa de entregar a anon (bom:
--     era o canal de fuga). O menu passa a usar o padrão da 031: broadcast
--     público SEM dados (só um timestamp) no tópico comanda-ping-<id>, que
--     serve apenas de gatilho para reconsultar via REST com o token. O id
--     é um uuid não adivinhável e o payload não transporta nada sensível.
--     O portal autenticado mantém postgres_changes (owns_espaco passa).
--   • TAPAR O BYPASS: venue_settings.table_tokens era legível por anon
--     (o nexo-access.js validava o TAT no browser!) — qualquer pessoa podia
--     sacar os tokens de mesa de qualquer venue e "provar presença". A
--     validação passa para a RPC e a coluna sai do SELECT de anon via
--     grants por coluna. Sem isto, o escopo por TAT não valia nada.
--
-- O GRANT SELECT a anon MANTÉM-SE (o PostgREST precisa dele); é a política
-- que filtra. Idempotente: seguro re-correr. Correr DEPOIS da 034.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. TOKEN DE COMANDA
-- Gerado por defeito no servidor; o menu envia o seu próprio uuid no INSERT
-- (precisa de o conhecer ANTES do returning, que já é filtrado pela política).
-- Backfill: comandas antigas ganham token — o dono continua a vê-las por
-- owns_espaco; sessões de menu antigas (sem token guardado) recuperam o
-- acesso na próxima ronda via nexo_table_access.
-- ─────────────────────────────────────────
alter table comandas
  add column if not exists client_token uuid default gen_random_uuid();

update comandas set client_token = gen_random_uuid() where client_token is null;

-- ─────────────────────────────────────────
-- 2. HELPERS
-- Padrão da 023 (menu_slug_exists): SECURITY DEFINER para a subquery da
-- política não depender de grants/RLS da tabela referenciada.
-- ─────────────────────────────────────────

-- Token enviado pelo menu no header x-comanda-token ('' / ausente → null).
create or replace function nexo_request_comanda_token()
returns text
language sql stable
as $$
  select nullif(
    coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb
      ->> 'x-comanda-token',
    ''
  );
$$;

-- Pode este pedido ler a comanda p_comanda_id?
--   dono autenticado (owns_espaco) OU portador do client_token da comanda.
create or replace function nexo_can_read_comanda(p_comanda_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from comandas c
    where c.id = p_comanda_id
      and (
        owns_espaco(c.espaco_slug)
        or (c.client_token is not null
            and c.client_token::text = nexo_request_comanda_token())
      )
  );
$$;

revoke all on function nexo_request_comanda_token() from public;
revoke all on function nexo_can_read_comanda(uuid) from public;
grant execute on function nexo_request_comanda_token() to anon, authenticated;
grant execute on function nexo_can_read_comanda(uuid) to anon, authenticated;

-- ─────────────────────────────────────────
-- 3. POLÍTICAS SELECT COM ESCOPO REAL
-- Substituem as `using (true)` de 016/020/028. Nomes novos — os antigos são
-- dropados explicitamente (políticas permissivas fazem OR entre si; deixar
-- uma `using (true)` viva anularia tudo, lição da 021).
-- ─────────────────────────────────────────

-- comandas: dono do espaço OU portador do token desta comanda
drop policy if exists "public_read_comanda" on comandas;
drop policy if exists "scoped_read_comanda" on comandas;
create policy "scoped_read_comanda"
  on comandas for select
  using (
    owns_espaco(espaco_slug)
    or (client_token is not null
        and client_token::text = nexo_request_comanda_token())
  );

-- comanda_items: herda o escopo da comanda-mãe
drop policy if exists "public_read_comanda_items" on comanda_items;
drop policy if exists "scoped_read_comanda_items" on comanda_items;
create policy "scoped_read_comanda_items"
  on comanda_items for select
  using (nexo_can_read_comanda(comanda_id));

-- comanda_rounds: idem
drop policy if exists "public_read_round" on comanda_rounds;
drop policy if exists "scoped_read_round" on comanda_rounds;
create policy "scoped_read_round"
  on comanda_rounds for select
  using (nexo_can_read_comanda(comanda_id));

-- GRANTs mantêm-se (RLS é que filtra) — re-afirmados para a migração ser
-- auto-suficiente num projeto limpo.
grant select on comandas, comanda_items, comanda_rounds to anon, authenticated;

-- ─────────────────────────────────────────
-- 4. RPC: acesso por mesa (TAT validado NO SERVIDOR)
-- Substitui a validação client-side do nexo-access.js (que precisava de ler
-- venue_settings.table_tokens — ver §6). Com token de mesa válido devolve
-- também a comanda ativa dessa mesa (se existir), com o client_token — é
-- assim que um 2.º dispositivo da MESMA mesa retoma a conta partilhada.
-- ─────────────────────────────────────────
create or replace function nexo_table_access(
  p_slug text,
  p_table_num integer,
  p_table_token text
)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_settings record;
  v_comanda record;
  v_valid boolean := false;
begin
  -- validação de forma (mesma disciplina do owns_espaco da 021)
  if p_slug is null or p_slug !~ '^[a-z0-9\-]+$' then
    return jsonb_build_object('valid', false);
  end if;

  select table_count, table_tokens into v_settings
  from venue_settings where espaco_slug = p_slug;

  if not found then
    return jsonb_build_object('valid', false);
  end if;

  v_valid := p_table_num is not null
    and p_table_num between 1 and coalesce(v_settings.table_count, 0)
    and p_table_token is not null
    and char_length(p_table_token) <= 64
    and v_settings.table_tokens ->> p_table_num::text = p_table_token;

  if not v_valid then
    return jsonb_build_object(
      'valid', false,
      'table_count', v_settings.table_count
    );
  end if;

  -- comanda ativa desta mesa (mesma semântica do openOrGetComanda do menu)
  select id, session_code, table_label, status, client_token into v_comanda
  from comandas
  where espaco_slug = p_slug
    and table_label = 'Mesa ' || p_table_num::text
    and status in ('open', 'submitted', 'preparing', 'ready')
    and archived_at is null
  order by created_at desc
  limit 1;

  if not found then
    return jsonb_build_object('valid', true,
                              'table_count', v_settings.table_count,
                              'comanda', null);
  end if;

  return jsonb_build_object(
    'valid', true,
    'table_count', v_settings.table_count,
    'comanda', jsonb_build_object(
      'id', v_comanda.id,
      'session_code', v_comanda.session_code,
      'table_label', v_comanda.table_label,
      'status', v_comanda.status,
      'client_token', v_comanda.client_token
    )
  );
end;
$$;

revoke all on function nexo_table_access(text, integer, text) from public;
grant execute on function nexo_table_access(text, integer, text) to anon, authenticated;

-- ─────────────────────────────────────────
-- 5. RPC: juntar-se por session_code (partilha intencional)
-- Quem tem o código da comanda (mostrado no dispositivo de quem a abriu)
-- recebe o client_token. Só comandas ABERTAS do slug indicado.
-- ─────────────────────────────────────────
create or replace function nexo_join_comanda(p_slug text, p_code text)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_comanda record;
begin
  if p_slug is null or p_slug !~ '^[a-z0-9\-]+$'
     or p_code is null or char_length(p_code) > 16 then
    return null;
  end if;

  select id, session_code, table_label, status, guest_count, client_token
  into v_comanda
  from comandas
  where espaco_slug = p_slug
    and session_code = upper(trim(p_code))
    and status = 'open'
    and archived_at is null
  limit 1;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_comanda.id,
    'session_code', v_comanda.session_code,
    'table_label', v_comanda.table_label,
    'status', v_comanda.status,
    'guest_count', v_comanda.guest_count,
    'client_token', v_comanda.client_token
  );
end;
$$;

revoke all on function nexo_join_comanda(text, text) from public;
grant execute on function nexo_join_comanda(text, text) to anon, authenticated;

-- ─────────────────────────────────────────
-- 6. venue_settings: table_tokens deixa de ser legível por anon
-- Grants POR COLUNA: o menu anónimo só lê o que precisa (table_count para o
-- placeholder "1 a N"). ATENÇÃO: com grants por coluna, um select('*') de
-- anon passa a dar 42501 — o código do menu já só pede colunas explícitas.
-- O portal autenticado mantém acesso total (gestão de QR/tokens).
-- ─────────────────────────────────────────
revoke select on venue_settings from anon;
grant select (id, created_at, updated_at, espaco_slug, table_count,
              table_capacity, venue_name, venue_type, is_open, current_shift)
  on venue_settings to anon;
grant select on venue_settings to authenticated;

-- ─────────────────────────────────────────
-- 7. REALTIME DO CLIENTE: broadcast "ping" sem dados (padrão da 031)
-- Cada escrita numa comanda/itens/rondas emite um sinal no tópico público
-- comanda-ping-<comanda_id>. O menu usa-o só como gatilho para reconsultar
-- via REST (com o x-comanda-token). Payload = timestamp; zero PII.
-- Fail-safe (025): um erro no broadcast nunca bloqueia a escrita.
-- ─────────────────────────────────────────
create or replace function comanda_broadcast_change()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_comanda_id uuid;
begin
  if tg_table_name = 'comandas' then
    v_comanda_id := coalesce(new.id, old.id);
  else
    v_comanda_id := coalesce(new.comanda_id, old.comanda_id);
  end if;
  if v_comanda_id is null then
    return null;
  end if;
  perform realtime.send(
    jsonb_build_object('t', extract(epoch from now())), -- sem dados
    'change',                                           -- event
    'comanda-ping-' || v_comanda_id::text,              -- topic
    false                                               -- público
  );
  return null;
exception when others then
  return null; -- nunca bloquear a escrita por causa do broadcast
end;
$$;

drop trigger if exists comandas_broadcast_trg on comandas;
create trigger comandas_broadcast_trg
  after update on comandas
  for each row execute function comanda_broadcast_change();

drop trigger if exists comanda_items_broadcast_trg on comanda_items;
create trigger comanda_items_broadcast_trg
  after insert or update or delete on comanda_items
  for each row execute function comanda_broadcast_change();

drop trigger if exists comanda_rounds_broadcast_trg on comanda_rounds;
create trigger comanda_rounds_broadcast_trg
  after insert or update on comanda_rounds
  for each row execute function comanda_broadcast_change();

-- ─────────────────────────────────────────
-- Verificação
-- ─────────────────────────────────────────
select 'scope comanda reads 037 ok' as status,
  (select count(*) from comandas where client_token is null)          as comandas_sem_token,   -- deve ser 0
  (select count(*) from pg_policies
    where tablename = 'comandas' and policyname = 'public_read_comanda')       as old_policy_comandas, -- deve ser 0
  (select count(*) from pg_policies
    where tablename in ('comandas','comanda_items','comanda_rounds')
      and cmd = 'SELECT')                                              as select_policies,      -- deve ser 3
  (select count(*) from pg_proc
    where proname in ('nexo_table_access','nexo_join_comanda',
                      'nexo_can_read_comanda','nexo_request_comanda_token'))   as rpcs,          -- deve ser 4
  (select count(*) from pg_trigger
    where tgname like '%broadcast_trg' and tgrelid::regclass::text
      in ('comandas','comanda_items','comanda_rounds'))                as broadcast_triggers;   -- deve ser 3
