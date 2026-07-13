# NEXO — Modelo de Autorização (RLS)

> Auditoria tabela-a-tabela do projeto menus+portal (`kgbrtbpeekhkroibsgqq`).
> Fonte: `pg_policies` / `information_schema.role_table_grants` sobre o schema
> com as migrações 001–040 aplicadas (verificado 2026-07-12, não por leitura
> das migrações — pelo estado real da BD).

## Princípios

- **RLS ligado em TODAS as tabelas public** (021). Nenhuma tabela sem RLS.
- **anon** (chave do bundle) só pode: (a) inserir eventos/pedidos validados;
  (b) ler dados de *display* não-sensíveis; (c) ler a SUA comanda por token.
- **Leitura sensível** (PII, faturação, comanda de outrem) → `owns_espaco()`
  (dono autenticado) ou RPC `security definer` de agregados. Nunca RLS aberta.
- `owns_espaco(slug)` exige `auth.uid()` → **anon recebe sempre 0 linhas**
  mesmo tendo o GRANT.

## Como ler a tabela abaixo

- **SELECT anon**: o que a chave anon consegue LER (após RLS).
- **Escrita anon**: INSERT/UPDATE permitidos ao menu público.
- **Modelo**: a política que decide.

| Tabela | SELECT anon | Escrita anon | Modelo de autorização |
|---|---|---|---|
| `clients` | ✗ | ✗ | dono vê o próprio (`auth_user_id`); espelho do NEXO OS |
| `menus` | slug/url (display) | ✗ | leitura pública de display; escrita service-role |
| `menu_events` | ✗ (`owns_espaco`) | INSERT validado (021) | dono lê agregados; anon só escreve eventos |
| `orders_log` | ✗ (`authenticated`+owns) | INSERT validado (021) | faturação: só dono autenticado lê |
| `staff_calls` | ✗ (`authenticated`+owns) | INSERT validado + **trigger rate-limit (040)** | dono lê; anon só cria chamadas |
| `comandas` | **por token** (037) | INSERT validado (021) | `owns_espaco` OU `client_token` no header `x-comanda-token` |
| `comanda_items` | **por token** (037) | INSERT validado (021) | herda o escopo da comanda-mãe (`nexo_can_read_comanda`) |
| `comanda_rounds` | **por token** (037) | INSERT/UPDATE (020) | idem |
| `comanda_voids` | ✗ (`owns_espaco`) | ✗ | só o dono (portal) |
| `guest_profiles` (CRM/PII) | ✗ (`owns_espaco`) | ✗ | **PII: só dono autenticado** |
| `gift_cards` | ✗ (`owns_espaco`) | ✗ | só dono; validação de código via sala |
| `weekly_reports` | ✗ (`owns_espaco`) | ✗ | dono; geração via RPC definer (010) |
| `portal_notifications` | ✗ (`owns_espaco`) | ✗ | dono; escrita por triggers (service-role) |
| `menu_change_requests` | ✗ (scoped `auth.uid()`) | INSERT (cliente pede) | dono lê os seus pedidos |
| `order_flags` | ✗ (`owns_espaco`) | INSERT | dono revê flags |
| `waitlist_entries` | por token (RPC `waitlist_status`) | INSERT validado | posição via RPC definer (015) |
| `push_subscriptions` | ✗ (`owns_espaco`) | ✗ | staff autenticado |
| `item_availability` | ✓ `using(true)` | ✗ (dono escreve) | **display**: menu esconde esgotados (não-sensível) |
| `menu_overrides` | ✓ `using(true)` | ✗ | **display**: conteúdo do menu (não-sensível) |
| `menu_banners` | activos, venue real | ✗ | display; escrita `owns_espaco` |
| `venue_settings` | colunas não-sensíveis (037) | ✗ | `table_tokens` **revogado a anon** (037); resto display |
| `waitlist_settings` | ✓ `using(true)` | ✗ | display (tempo médio, is_open) — não-sensível |
| `shared_cart_items` | ✓ `using(true)` | INSERT | ⚠️ ver "risco aceite" abaixo |
| `error_log` `security_log` `monitoring_log` `system_alerts` `retention_rollup` | ✗ (sem policy → nega) | ✗ | **service-role only**; grant anon revogado (040) |
| `rate_limit_log` | ✗ (grant revogado, 040) | INSERT (limiter) | audita/bloqueia rate; ninguém lê como anon |
| `audit_log` (040) | ✗ (`owns_espaco`) | ✗ (só RPC `nexo_audit`) | dono lê o seu; escrita só via definer |

## Conclusão do critério "nenhuma tabela sensível com `using(true)`+anon"

✅ **Cumprido.** As únicas políticas `SELECT using(true)` para anon são de
dados de **display/config não-sensíveis**: `item_availability`, `menu_overrides`,
`waitlist_settings`, `venue_settings` (já com colunas sensíveis revogadas em
037). Toda a PII (guest_profiles), faturação (orders_log, weekly_reports),
notificações e comandas de outrem estão atrás de `owns_espaco()` ou token.

### Auditoria empírica contra a base VIVA (2026-07-14)
Sondámos `SELECT` anónimo (anon key do bundle) a **34 tabelas**. Resultado:

| Classe | Tabelas | Anon |
|---|---|---|
| Negado (401, sem grant) | clients, menus, orders_log, staff_calls, waitlist_entries, venue_settings (`*`), error_log, security_log, monitoring_log, rate_limit_log, retention_rollup, system_alerts, push_subscriptions, referrals, onboarding, update_requests, menu_change_requests, shared_carts | ✅ |
| 200 mas RLS→0 linhas (`owns_espaco`/token) | comandas, comanda_items, comanda_rounds, comanda_voids (037-token); guest_profiles, gift_cards, weekly_reports, portal_notifications, order_flags, menu_events, audit_log (owns_espaco) | ✅ |
| Público por design (menu) | item_availability, menu_overrides, menu_banners, waitlist_settings, venue_settings (só colunas públicas: table_count, venue_name…) | ✅ |
| ⚠️ Aberto → fechado pela 041 | shared_cart_items | ✅ após 041 |

Todas as 4 políticas `using(true)` ainda "vivas" (`item_availability`,
`waitlist_settings`, `menu_overrides`, `venue_settings`) são de dados de menu
públicos ou têm as colunas sensíveis já revogadas (037). `venue_settings.
table_tokens` confirmado inacessível a anon (`select=*`→401; só colunas
whitelisted→200). Nenhuma tabela com PII/faturação legível por anon.

### ✅ Fechado: `shared_cart_items` (migração 041, 2026-07-14)
Antes, `using(true)` deixava qualquer anon ler/escrever todos os carrinhos
partilhados (contém `member_name`, `item_name`, `note`). A auditoria de
2026-07-14 confirmou que **nenhum código deployado** usa mais estas tabelas — o
carrinho partilhado dos menus vivos passou a ser 100% via **broadcast realtime**
(`nexo-<slug>-<code>`, payload efémero, zero persistência); só o `menu/demo/`
(removido na Fase 1) as usava. Por isso a **041 revoga todo o acesso anon** a
`shared_cart_items` (e reafirma `shared_carts`, já sem grant) em vez de escopar —
superfície mínima. Verificação: `has_table_privilege('anon', 'shared_cart_items',
'SELECT') = false`. Se algum dia voltar um carrinho persistido em BD, criar
política com escopo por header (padrão `x-comanda-token` da 037).

## Rotação da chave anon

A **anon key** está no bundle de cada menu (é pública por design). Esta
auditoria confirma que ela **não dá acesso a nada além do pretendido** (ver
tabela). Ainda assim, se for preciso rodá-la (ex.: suspeita de abuso, mudança
de política), o procedimento é:

1. **Gerar nova anon key**: Supabase → Project Settings → API → *Roll* anon/
   public key. (O JWT secret não muda; só a chave pública derivada.)
2. **Actualizar os consumidores** — a chave vive em:
   - `menu/<slug>/config.js` + `config.json` (campo `supabaseAnonKey`) — todos os menus;
   - `portal/**` (constante `SUPABASE_KEY`/`SB_*` nas páginas);
   - `fila/index.html`; edge functions que usam anon (`generate-weekly-report`).
   `grep -rn "supabaseAnonKey\|SUPABASE_KEY\|SUPABASE_ANON" menu/ portal/ fila/`.
3. **Regenerar `config.json`**: `node scripts/build-config-json.mjs`.
4. **Deploy** (main → produção). A chave antiga deixa de validar assim que
   rodada — fazer num período de baixo tráfego; menus em cache (max-age 300)
   apanham a nova em ≤5 min.
5. **Confirmar**: abrir um menu e o portal; `menu_events` a registar.

Nota: a chave anon **não** é um segredo (está no cliente). A segurança real é
a RLS desta auditoria + a `service_role` (essa SIM secreta, só nas Edge
Functions / Vault, nunca no cliente — verificado pelo scan `tests/scan`).

## Reproduzir a auditoria

Num Postgres com 001–041 aplicadas (ver `docs/DATABASE-DR.md` §3.3):
```sql
-- políticas SELECT abertas
select tablename, policyname, roles from pg_policies
 where cmd='SELECT' and coalesce(qual,'true')='true';
-- tabelas sem RLS (deve vir vazio)
select tablename from pg_tables where schemaname='public' and rowsecurity=false;
-- grants SELECT a anon
select table_name from information_schema.role_table_grants
 where grantee='anon' and privilege_type='SELECT';
```
