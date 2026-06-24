-- ═══════════════════════════════════════════════════════════════════════
-- NEXO — 024 Tokens de mesa: sincronização automática
-- Projeto dos menus+portal: kgbrtbpeekhkroibsgqq — correr no SQL Editor.
--
-- PROBLEMA: o restaurante pode adicionar/remover mesas (table_count). Os
-- tokens só eram gerados no setup/backfill ou no botão "Regenerar". Ao subir
-- o nº de mesas, as novas ficavam SEM token (não podiam pedir).
--
-- CORREÇÃO: trigger BEFORE em venue_settings que garante exactamente 1 token
-- por mesa 1..table_count. PRESERVA os tokens existentes (os QR já impressos
-- das mesas que não mudaram continuam válidos), gera para as mesas novas e
-- remove os das mesas que deixaram de existir.
--
-- (O botão "Regenerar tokens" continua a existir para forçar tokens novos em
--  todas as mesas — ex.: suspeita de fuga de um QR.)
--
-- Idempotente: seguro re-correr.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function venue_ensure_tokens()
returns trigger
language plpgsql
as $$
declare
  cur    jsonb := coalesce(new.table_tokens, '{}'::jsonb);
  result jsonb := '{}'::jsonb;
  n      integer := greatest(coalesce(new.table_count, 0), 0);
  i      integer;
  tok    text;
begin
  for i in 1..n loop
    if cur ? i::text then
      result := result || jsonb_build_object(i::text, cur ->> (i::text)); -- preserva
    else
      tok := 'tok_' || lower(substr(md5(
        coalesce(new.espaco_slug, '') || i::text || clock_timestamp()::text || random()::text
      ), 1, 12));
      result := result || jsonb_build_object(i::text, tok);               -- mesa nova
    end if;
  end loop;

  new.table_tokens := result;
  if result is distinct from cur then
    new.tokens_generated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists venue_settings_ensure_tokens on venue_settings;
create trigger venue_settings_ensure_tokens
  before insert or update on venue_settings
  for each row execute function venue_ensure_tokens();

-- Sincroniza já os espaços existentes (gera/preenche o que falta sem mexer no
-- que já existe). Um update no-op dispara o trigger.
update venue_settings set updated_at = now();

-- Verificação
select espaco_slug, table_count, jsonb_object_keys(table_tokens) as mesa
from venue_settings order by espaco_slug;
