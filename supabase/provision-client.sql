-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — Provisionar um novo cliente na BASE DE DADOS (projeto menus+portal)
-- Correr no Supabase SQL Editor do projeto kgbrtbpeekhkroibsgqq.
--
-- 1) Edita as 6 variáveis abaixo.
-- 2) Run. Cria: clients (espelho) + menus + onboarding.
-- 3) Depois cria o utilizador no Supabase Auth (Authentication → Add user) e
--    corre o UPDATE do fim para ligar clients.auth_user_id.
--
-- Idempotente no slug (não duplica menu/settings se já existirem).
-- ═══════════════════════════════════════════════════════════════════════

do $$
declare
  -- ── EDITAR ───────────────────────────────────────────────
  v_slug    text := 'rest-EXEMPLO-cidade';     -- slug (igual ao da pasta /menu/<slug>/)
  v_name    text := 'Nome do Espaço';          -- nome comercial
  v_owner   text := 'Nome do Dono';            -- nome do contacto
  v_plan    text := 'starter';                 -- starter | growth | multi | enterprise | evento
  v_monthly numeric := 69;                     -- valor mensal (€)
  -- ─────────────────────────────────────────────────────────
  v_client_id uuid;
begin
  -- cliente (espelho do NEXO OS)
  select id into v_client_id from clients c
    join menus m on m.client_id = c.id where m.slug = v_slug limit 1;
  if v_client_id is null then
    insert into clients (name, owner_name, plan, status, monthly_value, plan_renewal_date)
      values (v_name, v_owner, v_plan, 'active', v_monthly, (now() + interval '30 days')::date)
      returning id into v_client_id;
  end if;

  -- menu
  insert into menus (client_id, slug, status, url)
    values (v_client_id, v_slug, 'setup', 'https://nexosolutions.pt/menu/' || v_slug || '/')
    on conflict (slug) do nothing;

  -- onboarding (checklist por cliente — NEXO OS atualiza)
  insert into onboarding (client_id) values (v_client_id)
    on conflict (client_id) do nothing;

  raise notice 'Cliente % provisionado (client_id=%)', v_name, v_client_id;
end $$;

-- Verificação
select c.name, c.plan, c.status, m.slug, m.url,
       (o.id is not null) as has_onboarding,
       (c.auth_user_id is not null) as tem_login
from clients c
join menus m on m.client_id = c.id
left join onboarding o on o.client_id = c.id
where m.slug = 'rest-EXEMPLO-cidade';   -- ← mesmo slug

-- ── DEPOIS de criar o utilizador em Authentication → Add user, liga-o: ──
-- update clients set auth_user_id = '<UUID_DO_AUTH_USER>'
--   where id = (select client_id from menus where slug = 'rest-EXEMPLO-cidade');
