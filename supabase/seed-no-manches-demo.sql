-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — Seed OPCIONAL de dados de demonstração para o "No Manches"
-- Projeto menus+portal: kgbrtbpeekhkroibsgqq → correr DEPOIS de provisionar.
--
-- Enche o Dashboard / Estatísticas com números realistas dos últimos 7 dias
-- (aberturas de menu, cliques de review, alguns pedidos) para a apresentação
-- não parecer vazia. NÃO cria comandas ao vivo — essas fazem-se a ordenar do
-- menu durante a demo (aparecem no Modo Cozinha em tempo real).
--
-- Afeta APENAS espaco_slug='rest-no-manches-lisboa'. Não toca na Marisca.
-- Idempotente: limpa o que semeou antes de voltar a semear.
-- Para zerar tudo antes do pitch real, corre reset-no-manches.sql.
-- ═══════════════════════════════════════════════════════════════════════

do $$
declare
  s   text := 'rest-no-manches-lisboa';
  d   integer;   -- dias atrás
  ev  integer;
begin
  -- limpa seeds anteriores (só deste espaço)
  delete from menu_events where espaco_slug = s;
  delete from orders_log  where espaco_slug = s;

  -- 7 dias de aberturas de menu (12–28/dia) + alguns cliques de review
  for d in 0..6 loop
    for ev in 1..(12 + floor(random()*16)::int) loop
      insert into menu_events (espaco_slug, event_name, session_id, language, created_at)
      values (s, 'menu_opened', 'seed_'||d||'_'||ev,
              (array['pt','pt','pt','en','es'])[1+floor(random()*5)::int],
              now() - (d || ' days')::interval - (floor(random()*10)::int || ' hours')::interval);
    end loop;
    -- 1–4 cliques de review Google por dia
    for ev in 1..(1 + floor(random()*4)::int) loop
      insert into menu_events (espaco_slug, event_name, session_id, created_at)
      values (s, 'review_google_clicked', 'seedr_'||d||'_'||ev,
              now() - (d || ' days')::interval);
    end loop;
  end loop;

  -- Alguns pedidos (orders_log) espalhados pelos últimos dias
  insert into orders_log (espaco_slug, table_label, items, total, member_count, channel, created_at) values
    (s, 'Mesa 3', '[{"name":"Taco Al Pastor ×3","qty":1,"price":9.90},{"name":"Margarita","qty":2,"price":6.50}]', 22.90, 2, 'shared', now() - interval '2 hours'),
    (s, 'Mesa 5', '[{"name":"Totopos Hiper-Completos","qty":1,"price":11.00},{"name":"Cerveja Coronita","qty":3,"price":2.50}]', 18.50, 3, 'shared', now() - interval '1 day'),
    (s, 'Mesa 1', '[{"name":"Poke Mexicano","qty":2,"price":8.00},{"name":"Limonada de Coco","qty":2,"price":3.50}]', 23.00, 2, 'staff', now() - interval '2 days'),
    (s, 'Mesa 7', '[{"name":"Taco de Birria ×3","qty":2,"price":9.90},{"name":"Churros","qty":1,"price":3.50}]', 23.30, 4, 'shared', now() - interval '3 days'),
    (s, 'Mesa 2', '[{"name":"Quesadilla de Camarão","qty":2,"price":8.50}]', 17.00, 2, 'shared', now() - interval '5 days');

  raise notice 'Seed de demo aplicado ao No Manches.';
end $$;

-- Verificação
select 'menu_events' as tbl, count(*) from menu_events where espaco_slug='rest-no-manches-lisboa'
union all select 'orders_log', count(*) from orders_log where espaco_slug='rest-no-manches-lisboa';
