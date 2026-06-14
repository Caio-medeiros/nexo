-- ═══════════════════════════════════════════════════════════════════════
-- NEXO Portal — Migration 010
-- O relatório semanal estava numa edge function que usava
-- SUPABASE_SERVICE_ROLE_KEY. Este projeto migrou para o novo sistema de
-- chaves e a service-role legada já não autentica nas funções, pelo que as
-- leituras devolviam vazio (métricas a zero, "Not found").
--
-- Solução: a lógica do relatório passa para uma função SQL SECURITY DEFINER
-- (corre como o dono, lê tudo, contorna o RLS de forma controlada) e fica
-- chamável por anon/authenticated. A edge function passa a ser um wrapper.
--
-- Idempotente.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function generate_weekly_report(
  p_slug text, p_ws date, p_we date, p_name text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cached weekly_reports%rowtype;
  m jsonb;
  r text;
  sessions int; views int; items_viewed int; orders_placed int;
  total_revenue numeric; reviews_prompted int; reviews_positive int;
  google_clicks int; calls int; reservs int; reservs_conf int; peak int;
  langs jsonb; top_items jsonb; top1 text; lang_text text;
  parts text[] := '{}';
  pos text[] := '{}';
  name text := coalesce(p_name, 'o seu espaço');
  eur text;
begin
  -- cache
  select * into v_cached from weekly_reports
   where espaco_slug = p_slug and week_start = p_ws;
  if found then
    return jsonb_build_object('report', v_cached.report_text,
                              'metrics', v_cached.metrics_snapshot, 'cached', true);
  end if;

  -- agregações
  select count(distinct session_id) filter (where session_id is not null),
         count(*) filter (where event_name='menu_opened'),
         count(*) filter (where event_name='item_viewed'),
         count(*) filter (where event_name='review_prompted'),
         count(*) filter (where event_name='review_positive'),
         count(*) filter (where event_name='review_google_clicked')
    into sessions, views, items_viewed, reviews_prompted, reviews_positive, google_clicks
    from menu_events
   where espaco_slug=p_slug and created_at::date between p_ws and p_we;

  select count(*), coalesce(sum(total),0) into orders_placed, total_revenue
    from orders_log where espaco_slug=p_slug and created_at::date between p_ws and p_we;

  select count(*) into calls from staff_calls
   where espaco_slug=p_slug and created_at::date between p_ws and p_we;

  select count(*), count(*) filter (where status in ('confirmed','seated','completed'))
    into reservs, reservs_conf
    from reservations where espaco_slug=p_slug and reservation_date between p_ws and p_we;

  select coalesce(jsonb_object_agg(language, c),'{}'::jsonb) into langs from (
    select language, count(*) c from menu_events
     where espaco_slug=p_slug and created_at::date between p_ws and p_we and language is not null
     group by language) t;

  select coalesce(jsonb_agg(jsonb_build_array(item_name, c) order by c desc),'[]'::jsonb), max(item_name)
    into top_items, top1 from (
    select item_name, count(*) c from menu_events
     where espaco_slug=p_slug and created_at::date between p_ws and p_we
       and event_name='item_viewed' and item_name is not null
     group by item_name order by c desc limit 5) t;
  select (top_items->0->>0) into top1;

  select coalesce((select extract(hour from created_at)::int from menu_events
     where espaco_slug=p_slug and created_at::date between p_ws and p_we
     group by 1 order by count(*) desc limit 1), 12) into peak;

  m := jsonb_build_object(
    'sessions',sessions,'menu_opens',views,'items_viewed',items_viewed,
    'orders_placed',orders_placed,'total_revenue',total_revenue,
    'reviews_prompted',reviews_prompted,'reviews_positive',reviews_positive,
    'google_clicks',google_clicks,'staff_calls',calls,
    'reservations',reservs,'reservations_confirmed',reservs_conf,
    'languages',langs,'top_items',top_items,'peak_hour',peak);

  eur := '€' || replace(to_char(round(total_revenue,2),'FM999990.00'),'.',',');

  -- texto (português de Portugal)
  parts := array_append(parts,
    'Relatório de ' || to_char(p_ws,'DD/MM') || ' a ' || to_char(p_we,'DD/MM') ||
    ' para ' || name || '. Esta semana o menu digital teve ' || sessions ||
    case when sessions=1 then ' visita' else ' visitas' end || ' e ' || items_viewed ||
    case when items_viewed=1 then ' prato visto.' else ' pratos vistos.' end);

  if orders_placed>0 then
    pos := array_append(pos, orders_placed || case when orders_placed=1 then ' pedido' else ' pedidos' end ||
      case when total_revenue>0 then ', num total de ' || eur else '' end);
  end if;
  if google_clicks>0 then
    pos := array_append(pos, google_clicks || case when google_clicks=1 then ' cliente seguiu' else ' clientes seguiram' end ||
      ' para avaliar no Google');
  end if;
  if reservs>0 then
    pos := array_append(pos, 'recebeu ' || reservs || case when reservs=1 then ' reserva' else ' reservas' end ||
      ' online (' || reservs_conf || ' confirmadas), sem comissões');
  end if;
  if top1 is not null then
    pos := array_append(pos, 'o prato mais visto foi "' || top1 || '"');
  end if;

  if array_length(pos,1) is null then
    parts := array_append(parts, 'Foi uma semana mais calma — bom momento para divulgar o menu nas redes e na porta do espaço.');
  else
    parts := array_append(parts, 'Destaques: ' || array_to_string(pos[1:3], '; ') || '.');
  end if;

  if sessions>0 then
    parts := array_append(parts, 'O pico de movimento foi por volta das ' || peak || 'h — reforce a equipa e os destaques nesse horário.');
  end if;

  if reviews_prompted>0 and google_clicks=0 then
    parts := array_append(parts, 'Atenção: pediu ' || reviews_prompted || ' avaliações mas nenhuma chegou ao Google. Reveja o momento em que o pedido aparece.');
  elsif calls>5 then
    parts := array_append(parts, 'Atenção: ' || calls || ' chamadas de mesa esta semana — se for recorrente, pode faltar apoio em sala no pico.');
  elsif reservs>0 and reservs_conf<reservs then
    parts := array_append(parts, 'Atenção: ' || (reservs-reservs_conf) || ' reserva(s) por confirmar. Confirmar cedo reduz faltas.');
  end if;

  if google_clicks>0 then
    parts := array_append(parts, 'Sugestão: responda às avaliações recentes do Google — aumenta a confiança de quem procura o espaço.');
  elsif top1 is not null then
    parts := array_append(parts, 'Sugestão: destaque "' || top1 || '" no topo do menu ou sugira um acompanhamento para subir o valor médio por mesa.');
  else
    parts := array_append(parts, 'Sugestão: partilhe o link do menu e das reservas no Instagram e no Google para atrair mais visitas.');
  end if;

  r := array_to_string(parts, E'\n\n');

  insert into weekly_reports(espaco_slug, week_start, week_end, report_text, metrics_snapshot)
  values (p_slug, p_ws, p_we, r, m)
  on conflict (espaco_slug, week_start)
  do update set report_text=excluded.report_text, metrics_snapshot=excluded.metrics_snapshot;

  return jsonb_build_object('report', r, 'metrics', m);
end;
$$;

grant execute on function generate_weekly_report(text,date,date,text) to anon, authenticated;
