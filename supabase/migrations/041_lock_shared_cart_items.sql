-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — 041: fechar shared_cart_items a anon (tabela órfã)
-- (PROJETO DOS MENUS: kgbrtbpeekhkroibsgqq — correr no SQL Editor)
--
-- PROBLEMA (auditoria): a política "Anon can update shared cart" (033:100)
-- ficou `using (true)` e a tabela mantém grants CRUD a anon desde a 003. Com
-- isso, um anónimo lê/escreve o carrinho partilhado de QUALQUER venue
-- (member_name, item_name, note, cart_code) — furo multi-tenant. Hoje a tabela
-- está vazia (0 linhas), por isso não há fuga de dados AGORA, mas o vetor está
-- aberto.
--
-- PORQUÊ REVOGAR EM VEZ DE ESCOPAR: o carrinho partilhado dos menus VIVOS
-- (marisca directo, no-manches assistido) passou a ser 100% via broadcast
-- realtime — canal `nexo-<slug>-<code>`, evento 'state', payload efémero, ZERO
-- persistência. As tabelas shared_cart_items / shared_carts só eram usadas pelo
-- menu/demo/ (removido na Fase 1 do hardening). Nenhum código deployado lê ou
-- escreve estas tabelas. Logo a superfície mínima é NÃO dar acesso anon nenhum,
-- em vez de inventar um escopo por header que nada usa. Se algum dia voltar um
-- carrinho persistido em BD, cria-se então uma política com escopo real (padrão
-- x-cart-code, à imagem do x-comanda-token da 037).
--
-- shared_carts já estava sem grant a anon (401) — reafirmado aqui por
-- idempotência. A tabela e os dados ficam (retenção/DR); só o acesso anon sai.
-- authenticated mantém-se (portal é owns_espaco; não toca nestas tabelas na
-- prática, mas não se corta o que não se auditou ao detalhe). Idempotente.
-- Correr DEPOIS da 040.
-- ═══════════════════════════════════════════════════════════════════════

-- ── shared_cart_items: cortar anon por completo ───────────────────────────
revoke all privileges on table shared_cart_items from anon;

-- limpar as políticas permissivas conhecidas (033). Sem grant já não há acesso
-- anon, mas tirar as políticas remove o ruído numa auditoria a pg_policies.
drop policy if exists "Anon can insert shared cart" on shared_cart_items;
drop policy if exists "Anon can update shared cart" on shared_cart_items;
drop policy if exists "Anon can read shared cart"   on shared_cart_items;
drop policy if exists "Anon can select shared cart" on shared_cart_items;
drop policy if exists "Anon can delete shared cart" on shared_cart_items;
drop policy if exists "public_read_shared_cart"     on shared_cart_items;

-- ── shared_carts: reafirmar (já sem grant a anon) ─────────────────────────
revoke all privileges on table shared_carts from anon;

-- ── Verificação ───────────────────────────────────────────────────────────
-- has_table_privilege deve dar false para anon nas duas tabelas.
select '041 lock shared_cart ok' as status,
  has_table_privilege('anon', 'shared_cart_items', 'SELECT') as anon_items_select, -- false
  has_table_privilege('anon', 'shared_cart_items', 'UPDATE') as anon_items_update, -- false
  has_table_privilege('anon', 'shared_carts', 'SELECT')      as anon_carts_select, -- false
  (select count(*) from pg_policies
     where tablename = 'shared_cart_items'
       and (qual = 'true' or with_check = 'true')) as open_policies_left;          -- 0
