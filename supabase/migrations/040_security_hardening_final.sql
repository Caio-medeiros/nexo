-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — 040: HARDENING FINAL (rate-limit servidor + audit log + grants)
-- (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq — correr no SQL Editor)
--
-- 1) RATE-LIMIT NO SERVIDOR: o limitador da 021 (rate_limit_log) só AUDITAVA
--    (o bloqueio real vivia no cliente, nexo-security.js — contornável
--    limpando o localStorage). Aqui passa a BLOQUEAR:
--    a) nexo_rate_limit_check() — RPC atómica, autoridade do servidor
--       (conta no rate_limit_log, não no browser). O menu chama-a antes de
--       cada acção sensível; devolve {allowed:false, retry_after_s}.
--    b) TRIGGER em staff_calls — backstop à prova de bypass (não depende de o
--       cliente chamar a RPC): trava spam por (espaço, mesa) na base de dados.
-- 2) AUDIT LOG: audit_log + nexo_audit() para acções sensíveis do portal
--    (editar menu, ver faturação, mudar disponibilidade). Só o dono lê; só a
--    RPC (security definer) escreve.
-- 3) LIMPEZA DE GRANTS: revoga SELECT a anon em tabelas service-role (a RLS já
--    negava por não haver policy, mas o grant é ruído numa auditoria).
--
-- Idempotente. Correr DEPOIS da 039.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1a) Rate-limit atómico no servidor ────────────────────────────────────
-- Conta as acções recentes desta sessão no rate_limit_log (fonte de verdade
-- do servidor) e, se estiver abaixo do limite, regista mais uma. Mesmos
-- limites do cliente (nexo-security.js), agora enforçados.
create or replace function nexo_rate_limit_check(
  p_event_type text,
  p_session_id text,
  p_espaco_slug text
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_max int; v_window interval; v_count int; v_oldest timestamptz;
begin
  case p_event_type
    when 'staff_call'     then v_max := 1; v_window := interval '60 seconds';
    when 'order_submit'   then v_max := 5; v_window := interval '5 minutes';
    when 'waitlist_join'  then v_max := 2; v_window := interval '10 minutes';
    when 'comanda_create' then v_max := 3; v_window := interval '5 minutes';
    when 'review_click'   then v_max := 3; v_window := interval '60 minutes';
    else return jsonb_build_object('allowed', true); -- desconhecido não bloqueia
  end case;

  -- validação de forma (mesma disciplina das políticas da 021)
  if p_session_id is null or char_length(p_session_id) > 64
     or p_espaco_slug is null or char_length(p_espaco_slug) > 100 then
    return jsonb_build_object('allowed', false, 'reason', 'invalid');
  end if;

  select count(*), min(created_at) into v_count, v_oldest
  from rate_limit_log
  where session_id = p_session_id
    and event_type = p_event_type
    and created_at > now() - v_window;

  if v_count >= v_max then
    return jsonb_build_object(
      'allowed', false,
      'retry_after_s', greatest(1, ceil(extract(epoch from (v_oldest + v_window - now()))))::int
    );
  end if;

  insert into rate_limit_log (session_id, event_type, espaco_slug)
  values (p_session_id, p_event_type, p_espaco_slug);

  return jsonb_build_object('allowed', true, 'remaining', v_max - v_count - 1);
end $$;

revoke all on function nexo_rate_limit_check(text, text, text) from public;
grant execute on function nexo_rate_limit_check(text, text, text) to anon, authenticated;

-- ── 1b) Backstop à prova de bypass: trigger em staff_calls ────────────────
-- Não depende de o cliente chamar a RPC. Trava spam scriptado por mesa
-- (várias pessoas na mesma mesa podem chamar algumas vezes; centenas/seg não).
create or replace function enforce_staff_call_rate()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_recent int;
begin
  select count(*) into v_recent from staff_calls
  where espaco_slug = new.espaco_slug
    and table_label is not distinct from new.table_label
    and created_at > now() - interval '60 seconds';
  if v_recent >= 5 then
    raise exception 'rate limit: demasiadas chamadas para esta mesa'
      using errcode = '55000';
  end if;
  return new;
end $$;

drop trigger if exists staff_calls_rate_limit on staff_calls;
create trigger staff_calls_rate_limit
  before insert on staff_calls
  for each row execute function enforce_staff_call_rate();

-- ── 2) Audit log de acções sensíveis do portal ────────────────────────────
create table if not exists audit_log (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  actor_id    uuid,            -- auth.uid()
  actor_email text,
  espaco_slug text,
  action      text not null,   -- 'menu_edit' | 'financeiro_view' | 'availability_change' | …
  entity      text,            -- objecto afectado (tabela/id/slug)
  meta        jsonb default '{}'::jsonb
);
create index if not exists audit_log_espaco_idx on audit_log(espaco_slug, created_at desc);
create index if not exists audit_log_actor_idx  on audit_log(actor_id, created_at desc);

alter table audit_log enable row level security;

-- O dono lê o audit do SEU espaço; ninguém escreve directamente (só via RPC).
drop policy if exists "audit_read_own" on audit_log;
create policy "audit_read_own"
  on audit_log for select
  using (owns_espaco(espaco_slug));

grant select on audit_log to authenticated;

-- Escrita só pela RPC security definer: regista sempre o auth.uid() real
-- (não é forjável pelo cliente) e só para o próprio espaço.
create or replace function nexo_audit(
  p_action text,
  p_espaco_slug text,
  p_entity text default null,
  p_meta jsonb default '{}'::jsonb
)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_email text;
begin
  if auth.uid() is null then return; end if;                 -- só acções autenticadas
  if p_espaco_slug is not null and not owns_espaco(p_espaco_slug) then
    return;                                                   -- não regista noutro venue
  end if;
  select email into v_email from auth.users where id = auth.uid();
  insert into audit_log (actor_id, actor_email, espaco_slug, action, entity, meta)
  values (auth.uid(), v_email, p_espaco_slug,
          left(coalesce(p_action, 'unknown'), 100), left(p_entity, 200),
          coalesce(p_meta, '{}'::jsonb));
end $$;

revoke all on function nexo_audit(text, text, text, jsonb) from public;
grant execute on function nexo_audit(text, text, text, jsonb) to authenticated;

-- ── 3) Limpeza de grants desnecessários a anon (defense-in-depth) ──────────
-- A RLS já negava (sem policy SELECT), mas o grant é ruído numa auditoria.
revoke select on error_log        from anon;
revoke select on security_log     from anon;
revoke select on monitoring_log   from anon;
revoke select on system_alerts    from anon;
revoke select on retention_rollup from anon;
revoke select on rate_limit_log   from anon;  -- anon insere (limiter), nunca lê

-- ── Verificação ───────────────────────────────────────────────────────────
select 'hardening 040 ok' as status,
  (select count(*) from pg_proc where proname in ('nexo_rate_limit_check','nexo_audit')) as rpcs,        -- 2
  (select count(*) from pg_tables where tablename = 'audit_log')                          as audit_table, -- 1
  (select count(*) from pg_trigger where tgname = 'staff_calls_rate_limit')               as sc_trigger;  -- 1
