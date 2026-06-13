-- ═══════════════════════════════════════════════════════════════════════
-- NEXO Portal — Migration 009
-- O botão "Visto" da Sala em Directo faz UPDATE em orders_log, mas o role
-- `authenticated` só tinha SELECT (a tabela foi criada na 001, antes dos
-- privilégios por defeito do Supabase). Sem o GRANT, o RLS nem é avaliado e
-- o update falha por falta de privilégio — o pedido fica sempre "new".
--
-- A política RLS owns_orders_log_update já existe (migração 007); falta só
-- o grant de tabela.
--
-- Idempotente: seguro re-correr.
-- ═══════════════════════════════════════════════════════════════════════

grant update on orders_log to authenticated;
