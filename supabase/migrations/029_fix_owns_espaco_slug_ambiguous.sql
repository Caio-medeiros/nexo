-- ════════════════════════════════════════════════════════════════════════
-- 029 — FIX: owns_espaco() throws "column reference \"slug\" is ambiguous"
-- ════════════════════════════════════════════════════════════════════════
-- Migration 021 defined owns_espaco(slug text) with:
--     where m.slug = slug
-- In PL/pgSQL the unqualified `slug` on the right-hand side is ambiguous: it
-- can mean the function PARAMETER `slug` OR the COLUMN `menus.slug` (in scope
-- via the FROM clause). Postgres aborts with SQLSTATE 42702.
--
-- Impact (CONFIRMED live, 2026-06-26): EVERY authenticated query that goes
-- through owns_espaco fails with HTTP 400, e.g.
--   • Portal → Estatísticas: reads of menu_events / orders_log / staff_calls
--     all error → "estatísticas não sincronizam" (dishes, views, reviews).
--   • Portal → Disponibilidade: upsert into item_availability errors →
--     "Erro. Tente novamente." when toggling an item.
--   • Any other write gated by owns_espaco (banners, notifications, …).
-- (SELECTs that ALSO have a public-read policy still work, which is why the
--  pages load but show nothing / fail only on write — it masked the bug.)
--
-- Fix: KEEP the parameter name `slug` (renaming it is impossible via CREATE OR
-- REPLACE — "cannot change name of input parameter" — and DROP would cascade
-- into every RLS policy that depends on the function). Instead, qualify the
-- ambiguous reference with the function name: `owns_espaco.slug`. The
-- `#variable_conflict use_variable` directive is added as belt-and-suspenders.
-- Idempotent: safe to run multiple times. No policy changes required.
-- ────────────────────────────────────────────────────────────────────────

create or replace function owns_espaco(slug text)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
#variable_conflict use_variable
begin
  -- Reject null / empty slugs
  if slug is null or trim(slug) = '' then
    return false;
  end if;
  -- Valid slugs are lowercase letters, numbers and hyphens only.
  -- (hyphen placed last in the class is a literal hyphen — no backslash.)
  if slug !~ '^[a-z0-9-]+$' then
    return false;
  end if;
  -- Must be authenticated
  if auth.uid() is null then
    return false;
  end if;
  return exists (
    select 1
    from menus m
    join clients c on c.id = m.client_id
    where m.slug = owns_espaco.slug   -- qualified -> never ambiguous
      and c.auth_user_id = auth.uid()
  );
end;
$$;
