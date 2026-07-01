-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — Provisionar "No Manches" (slug: rest-no-manches-lisboa)
-- Projeto menus+portal: kgbrtbpeekhkroibsgqq  →  correr no SQL Editor.
--
-- O QUE FAZ (idempotente — seguro re-correr):
--   1. clients        — o espaço (espelho do NEXO OS)
--   2. menus           — a linha do slug (DESBLOQUEIA os writes do menu:
--                        sem ela, menu_events/comandas dão 401 por causa do
--                        guard menu_slug_exists() do RLS)
--   3. onboarding      — checklist
--   4. venue_settings  — nº de mesas + info do salão. O trigger de 024 gera
--                        automaticamente 1 token por mesa (table_tokens).
--
-- ISOLAMENTO: tudo no portal é filtrado por espaco_slug = 'rest-no-manches-
-- lisboa'. Como o slug é diferente do 'marisca-petisca', os dados NUNCA se
-- misturam. O RLS (owns_espaco) garante que cada login só vê o seu espaço.
--
-- DEPOIS deste script: criar o utilizador em Authentication → Add user e
-- correr o UPDATE do fim (liga clients.auth_user_id ao login do portal).
-- ═══════════════════════════════════════════════════════════════════════

do $$
declare
  -- ── EDITAR se quiseres ────────────────────────────────────
  v_slug     text    := 'rest-no-manches-lisboa';
  v_name     text    := 'No Manches';
  v_owner    text    := 'Equipa No Manches';   -- nome do contacto
  v_plan     text    := 'starter';             -- starter|growth|multi|enterprise|evento
  v_monthly  numeric := 69;                    -- valor mensal (€)
  v_mesas    integer := 8;                     -- nº de mesas do salão (1..60)
  v_capacity integer := 4;                     -- lugares por mesa
  -- ──────────────────────────────────────────────────────────
  v_client_id uuid;
begin
  -- 1. cliente (não duplica se o menu já estiver ligado a um)
  select c.id into v_client_id
    from clients c join menus m on m.client_id = c.id
   where m.slug = v_slug limit 1;

  if v_client_id is null then
    insert into clients (name, owner_name, plan, status, monthly_value, plan_renewal_date)
      values (v_name, v_owner, v_plan, 'active', v_monthly, (now() + interval '30 days')::date)
      returning id into v_client_id;
  end if;

  -- 2. menu (o desbloqueio dos writes do menu)
  insert into menus (client_id, slug, status, url)
    values (v_client_id, v_slug, 'active', 'https://nexosolutions.pt/menu/' || v_slug || '/')
    on conflict (slug) do update set status = 'active';

  -- 3. onboarding
  insert into onboarding (client_id) values (v_client_id)
    on conflict (client_id) do nothing;

  -- 4. venue_settings (mesas + info). O trigger de 024 gera os tokens.
  insert into venue_settings
      (espaco_slug, table_count, table_capacity, venue_name, venue_type, is_open, current_shift)
    values
      (v_slug, v_mesas, v_capacity, v_name, 'restaurant', true, 'all_day')
    on conflict (espaco_slug) do update
      set table_count = excluded.table_count,
          table_capacity = excluded.table_capacity,
          venue_name = excluded.venue_name,
          is_open = true;

  raise notice 'No Manches provisionado (client_id=%, mesas=%)', v_client_id, v_mesas;
end $$;

-- ─────────────────────────────────────────────────────────────
-- VERIFICAÇÃO — deve mostrar o espaço, o menu 'active' e as mesas
-- ─────────────────────────────────────────────────────────────
select c.name, c.plan, c.status, m.slug, m.status as menu_status, m.url,
       (c.auth_user_id is not null) as tem_login
from clients c
join menus m on m.client_id = c.id
where m.slug = 'rest-no-manches-lisboa';

-- Mesas + tokens gerados (1 por mesa)
-- (subquery: jsonb_object_keys é set-returning; sem a subquery, "order by
--  mesa::int" faz o Postgres procurar uma coluna real "mesa" → 42703.)
select espaco_slug, table_count, is_open, mesa
from (
  select espaco_slug, table_count, is_open,
         jsonb_object_keys(table_tokens) as mesa
  from venue_settings
  where espaco_slug = 'rest-no-manches-lisboa'
) t
order by mesa::int;

-- ═══════════════════════════════════════════════════════════════════════
-- DEPOIS de criar o utilizador em  Authentication → Add user  (define email
-- e password — ESTE será o login do portal do No Manches), copia o UUID dele
-- e corre:
--
--   update clients set auth_user_id = '<UUID_DO_AUTH_USER>'
--     where id = (select client_id from menus where slug = 'rest-no-manches-lisboa');
--
-- Confirma que ficou ligado:
--   select name, auth_user_id from clients
--    where id = (select client_id from menus where slug = 'rest-no-manches-lisboa');
-- ═══════════════════════════════════════════════════════════════════════
