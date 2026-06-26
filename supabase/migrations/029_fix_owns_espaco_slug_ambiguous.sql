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
-- Fix: rename the parameter to `p_slug` so there is no name collision. The
-- RLS policies call it positionally — owns_espaco(espaco_slug) — so renaming
-- the parameter does NOT require touching any policy.
-- Idempotent: safe to run multiple times.
-- ────────────────────────────────────────────────────────────────────────

create or replace function owns_espaco(p_slug text)
returns boolean as $$
begin
  -- Reject null / empty slugs
  if p_slug is null or trim(p_slug) = '' then
    return false;
  end if;

  -- Valid slugs are lowercase letters, numbers and hyphens only.
  -- Rejects any injection-shaped input before it reaches the join.
  if p_slug !~ '^[a-z0-9\-]+$' then
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
    where m.slug = p_slug
      and c.auth_user_id = auth.uid()
  );
end;
$$ language plpgsql security definer stable
   set search_path = public;

-- Extra belt-and-suspenders: tell PL/pgSQL to prefer the variable on any
-- future name collision instead of erroring (defensive; the rename above is
-- already sufficient).
-- (Applied via the function body option below is not portable, so we rely on
--  the explicit parameter rename, which fully resolves the ambiguity.)
