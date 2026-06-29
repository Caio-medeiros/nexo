-- ═══════════════════════════════════════════════════════════════════════
-- NEXO Fila de Espera — Migration 031
-- (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq)
-- Correr UMA vez no Supabase SQL Editor. Seguro re-correr (idempotente).
--
-- O QUE FAZ:
--  1. Novo estado 'a_caminho' (cliente confirmou "Estou a caminho").
--  2. RPC waitlist_on_my_way(token) — o cliente marca-se a caminho, sem
--     poder ler/alterar registos de outros (security definer).
--  3. Trigger de BROADCAST realtime SEM dados pessoais: a cada alteração
--     da fila emite um sinal "change" para o canal público fila-public-<slug>.
--     A página do cliente usa esse sinal só como gatilho para reconsultar o
--     SEU estado via RPC — continua a NÃO existir SELECT anónimo na tabela,
--     por isso nomes/telefones de outros clientes nunca são expostos.
--
-- NOTA DE SEGURANÇA: NÃO criar "CREATE POLICY ... FOR SELECT TO anon USING (true)"
-- em waitlist_entries — isso exporia nome+telefone de toda a gente na fila.
-- O realtime do cliente é feito por broadcast público sem PII (abaixo).
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. Estado 'a_caminho' no CHECK de status
-- ─────────────────────────────────────────
alter table waitlist_entries drop constraint if exists waitlist_entries_status_check;
alter table waitlist_entries
  add constraint waitlist_entries_status_check
  check (status in ('waiting','notified','a_caminho','seated','cancelled','no_show'));

-- ─────────────────────────────────────────
-- 2. RPC: cliente confirma que está a caminho (security definer)
--    Só transita de 'notified' → 'a_caminho' para o próprio token.
-- ─────────────────────────────────────────
create or replace function waitlist_on_my_way(p_token uuid)
returns boolean
language plpgsql security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update waitlist_entries
    set status = 'a_caminho'
    where token = p_token
      and status = 'notified';
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

grant execute on function waitlist_on_my_way(uuid) to anon, authenticated;

-- ─────────────────────────────────────────
-- 3. Broadcast realtime SEM PII para o canal público da fila
--    (payload é apenas um timestamp — nenhum dado de cliente)
-- ─────────────────────────────────────────
create or replace function waitlist_broadcast_change()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_slug text := coalesce(new.espaco_slug, old.espaco_slug);
begin
  perform realtime.send(
    jsonb_build_object('t', extract(epoch from now())), -- sem dados pessoais
    'change',                                           -- event
    'fila-public-' || v_slug,                           -- topic
    false                                               -- public (não privado)
  );
  return null;
exception when others then
  return null; -- nunca bloquear a escrita na fila por causa do broadcast
end;
$$;

drop trigger if exists waitlist_broadcast_trg on waitlist_entries;
create trigger waitlist_broadcast_trg
  after insert or update or delete on waitlist_entries
  for each row execute function waitlist_broadcast_change();

-- Verificação
select 'waitlist 031 ok' as status,
  (select count(*) from pg_constraint where conname = 'waitlist_entries_status_check') as has_check,
  (select count(*) from pg_proc where proname = 'waitlist_on_my_way') as has_rpc,
  (select count(*) from pg_trigger where tgname = 'waitlist_broadcast_trg') as has_trigger;
