-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — 044: chamada de empregado com rate-limit AO NÍVEL DA MESA
-- (PROJETO DOS MENUS+PORTAL: kgbrtbpeekhkroibsgqq — correr no SQL Editor)
--
-- PROBLEMA: o anti-spam de "Chamar Empregado" vivia só no cliente
-- (nexo-security: 1 chamada / 60s POR SESSÃO). Duas pessoas na MESMA mesa
-- (ou a mesma pessoa noutro telemóvel/aba) criavam várias chamadas para a
-- mesma mesa — a Sala mostrava a mesa a "piscar" repetido e o staff era
-- chamado N vezes para a mesma mesa.
--
-- INVARIANTE (agora no servidor): enquanto houver uma chamada PENDENTE
-- (não atendida) para uma mesa, uma nova chamada dessa mesa NÃO cria outra
-- linha — devolve {pending:true} e o menu mostra "já chamámos, a caminho".
--
-- COMO: RPC get-or-create nexo_call_staff (security definer). O anon não lê
-- staff_calls (RLS), por isso a verificação de "já pendente" tem de correr
-- no servidor. Chamadas SEM mesa indicada não deduplicam (não há mesa).
--
-- Idempotente e narrado: seguro re-correr. Não toca migrações 001–043.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Garantir a coluna de "atendida" (base schema; guard idempotente) ───
-- A Sala marca a chamada como atendida com delivered_count=1. A coluna vive
-- no schema base (setup-complete) — este guard mantém a 044 auto-suficiente
-- num Postgres fresco (teste de idempotência 001..044).
alter table staff_calls
  add column if not exists delivered_count integer default 0;

-- ── 2. RPC get-or-create: nexo_call_staff ─────────────────────────────────
-- Devolve:
--   {ok:false}                  slug inválido / venue inexistente
--   {ok:true, pending:true}     já havia chamada pendente para a mesa (não cria)
--   {ok:true, pending:false}    chamada criada
create or replace function nexo_call_staff(
  p_slug text,
  p_table_label text
)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_pending integer;
begin
  if p_slug is null or p_slug !~ '^[a-z0-9\-]+$' then
    return jsonb_build_object('ok', false);
  end if;
  -- o slug do menu tem de existir (mesmo helper das políticas anon, 023)
  if not menu_slug_exists(p_slug) then
    return jsonb_build_object('ok', false);
  end if;

  -- normaliza a etiqueta da mesa (apresentação; máx 50 chars)
  p_table_label := nullif(left(coalesce(p_table_label, ''), 50), '');

  -- Rate-limit AO NÍVEL DA MESA: já há chamada por atender para esta mesa nos
  -- últimos 15 min? → não cria outra. Só se aplica quando a mesa é conhecida
  -- (chamadas sem mesa indicada não têm por onde deduplicar).
  if p_table_label is not null then
    select count(*) into v_pending
    from staff_calls
    where espaco_slug = p_slug
      and table_label = p_table_label
      and coalesce(delivered_count, 0) = 0
      and resolved_at is null
      and created_at > now() - interval '15 minutes';
    if v_pending > 0 then
      return jsonb_build_object('ok', true, 'pending', true);
    end if;
  end if;

  insert into staff_calls (espaco_slug, table_label)
  values (p_slug, p_table_label);
  return jsonb_build_object('ok', true, 'pending', false);
end;
$$;

revoke all on function nexo_call_staff(text, text) from public;
grant execute on function nexo_call_staff(text, text) to anon, authenticated;

-- ── Verificação ───────────────────────────────────────────────────────────
select 'table-level staff call 044 ok' as status,
  (select count(*) from pg_proc where proname = 'nexo_call_staff')            as rpc,                 -- 1
  (select count(*) from information_schema.columns
     where table_name = 'staff_calls' and column_name = 'delivered_count')    as has_delivered_count; -- 1
