-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — Migration 014 (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq)
-- CORRIGE A CAUSA-RAIZ DO ERRO 42501 "permission denied for table ...".
--
-- O NEXO OS fala com este projeto através da SECRET KEY (role `service_role`)
-- na função Netlify `menu-approvals.js`. Como este projeto teve as DEFAULT
-- PRIVILEGES alteradas (ver migração 003, que só corrigiu anon/authenticated),
-- TODAS as tabelas/funções NOVAS deixam de conceder acesso ao service_role —
-- por isso `menu_change_requests` (e qualquer feature futura) rebenta com:
--   42501  permission denied for table menu_change_requests
--
-- Esta migração resolve de vez:
--   1) concede service_role em TUDO o que já existe em `public`;
--   2) altera as DEFAULT PRIVILEGES para que o service_role passe a ser
--      concedido AUTOMATICAMENTE em tudo o que for criado a partir de agora.
--   Assim nunca mais é preciso lembrar de conceder à mão em cada feature.
--
-- Idempotente: seguro re-correr. Correr no SQL Editor do projeto dos menus.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. Conceder service_role em tudo o que já existe
-- ─────────────────────────────────────────
grant usage on schema public to service_role;
grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;

-- ─────────────────────────────────────────
-- 2. DEFAULT PRIVILEGES — futuro: tudo o que for criado concede ao service_role
--    No SQL Editor corres como `postgres`; só podes alterar default privileges
--    de roles de que és membro. Tentamos os criadores prováveis (postgres,
--    supabase_admin) mas IGNORAMOS em silêncio aqueles a que não tens acesso
--    (caso contrário rebenta com 42501 "permission denied to change default
--    privileges"). O importante — o role atual — é coberto na 2ª parte.
-- ─────────────────────────────────────────
do $$
declare r text;
begin
  foreach r in array array['postgres','supabase_admin'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      begin
        execute format('alter default privileges for role %I in schema public grant all on tables    to service_role', r);
        execute format('alter default privileges for role %I in schema public grant all on sequences to service_role', r);
        execute format('alter default privileges for role %I in schema public grant all on functions to service_role', r);
      exception when insufficient_privilege then
        raise notice 'sem permissão para alterar default privileges do role % — ignorado', r;
      end;
    end if;
  end loop;
end $$;

-- também para o role atual (quem corre este SQL) — este passo funciona sempre.
alter default privileges in schema public grant all on tables    to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;

-- ─────────────────────────────────────────
-- 3. Re-confirmar explicitamente o que o NEXO OS usa (aprovações ao menu)
--    — redundante com o passo 1, mas deixa o intent claro e à prova de re-run.
-- ─────────────────────────────────────────
grant select, insert, update, delete on menu_change_requests to service_role;
grant execute on function approve_menu_change(uuid, uuid)        to service_role;
grant execute on function reject_menu_change(uuid, text, uuid)   to service_role;

-- ─────────────────────────────────────────
-- 4. Espelho do contrato — completar com plan_start_date (início do contrato)
--    O kill-switch (espaco_active) usa plan_renewal_date (já existe na 001).
--    plan_start_date é o "começo" do contrato definido no NEXO OS; replicado
--    aqui para o portal poder mostrá-lo. Sincronizado à mão a partir do OS.
-- ─────────────────────────────────────────
alter table clients
  add column if not exists plan_start_date date;

-- ─────────────────────────────────────────
-- Verificação — deve devolver 't' nas duas colunas
-- ─────────────────────────────────────────
select
  has_table_privilege('service_role', 'menu_change_requests', 'SELECT') as can_select_requests,
  has_function_privilege('service_role', 'approve_menu_change(uuid, uuid)', 'EXECUTE') as can_approve;
