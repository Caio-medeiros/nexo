-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — 044: chamada de empregado get-or-create (dedup ao nível da MESA)
-- (PROJETO DOS MENUS+PORTAL: kgbrtbpeekhkroibsgqq — correr no SQL Editor)
--
-- PROBLEMA: pessoas diferentes da MESMA mesa chamam o empregado sem saber que
-- outro já chamou → a Sala enche-se de chamadas duplicadas e o staff perde a
-- confiança no sinal. O cooldown do menu é POR DISPOSITIVO (localStorage), não
-- coordena telemóveis diferentes. E o anon não pode LER staff_calls (RLS 028),
-- por isso a verificação "já foi chamado?" TEM de viver no servidor.
--
-- SOLUÇÃO: RPC security definer que faz get-or-create ao nível da mesa —
--   • se já existe uma chamada RECENTE por resolver para (slug, mesa) →
--     devolve {pending:true} SEM criar nova (a Sala já a mostra);
--   • senão insere uma nova chamada e devolve {pending:false}.
-- Assim, o 2.º cliente vê "já chamámos — a caminho" em vez de duplicar.
--
-- Idempotente. Não toca migrações 001–043.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function nexo_call_staff(
  p_slug text,
  p_table_label text default null
)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_recent record;
  v_label  text;
  -- janela em que uma chamada por resolver ainda "conta" como a mesma; passado
  -- isto, uma nova chamada é legítima (o staff não apareceu).
  v_window interval := interval '8 minutes';
begin
  if p_slug is null or p_slug !~ '^[a-z0-9\-]+$' then
    return jsonb_build_object('ok', false);
  end if;

  v_label := nullif(left(coalesce(p_table_label, ''), 50), '');

  -- Já há uma chamada recente POR RESOLVER para esta mesa? → get (não duplica).
  select id, created_at into v_recent
  from staff_calls
  where espaco_slug = p_slug
    and coalesce(table_label, '') = coalesce(v_label, '')
    and resolved_at is null
    and created_at > now() - v_window
  order by created_at desc
  limit 1;

  if found then
    return jsonb_build_object('ok', true, 'pending', true, 'called_at', v_recent.created_at);
  end if;

  -- Senão: cria a chamada (o trigger staff_calls_notify dispara a notificação).
  insert into staff_calls (espaco_slug, table_label) values (p_slug, v_label);
  return jsonb_build_object('ok', true, 'pending', false);
end;
$$;

revoke all on function nexo_call_staff(text, text) from public;
grant execute on function nexo_call_staff(text, text) to anon, authenticated;

-- ── Verificação ───────────────────────────────────────────────────────────
select 'staff call get-or-create 044 ok' as status,
  (select count(*) from pg_proc where proname = 'nexo_call_staff') as rpc; -- 1
