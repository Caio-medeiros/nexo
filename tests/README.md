# NEXO test suite

Free / open-source. No paid services. Corre no GitHub Actions em cada PR
(`nexo-tests.yml`, gate de merge) e em cada push a main/staging (`deploy.yml`,
gate de deploy).

## Layout
| Path | O quê | Infra |
|---|---|---|
| `tests/unit/run.mjs` | Unit tests do `js/nexo-security.js` real (sanitise, validators, rate-limit, safe errors, asserts). Plain Node, zero deps. Escreve `tests/test-report.html`. | none |
| `tests/scan/scan.mjs` | Scan dos ficheiros deployados: `{{config}}` por substituir, slug fantasma, fugas de segredos, **hashes/senhas hardcoded no cliente** (SENHA_HASH, hex MD5/SHA-1/SHA-256 junto a lógica de senha, bcrypt/argon2, `senha === 'literal'`). | none |
| `tests/rls/rls.mjs` | **Isolamento multi-tenant (RLS)** contra um projeto Supabase de teste: comandas sem `x-comanda-token` → 0 linhas (canário `using(true)`), faturação negada a anon, `table_tokens` invisível, dono confinado ao seu slug. Zero deps (fetch). | projeto Supabase de teste (ver `tests/rls/README.md`) |
| `tests/rls/selftest.mjs` | Prova o canário sem infra: emula um PostgREST inseguro (`using(true)`) e um seguro (037/038) e verifica que o `rls.mjs` falha/passa respectivamente. | none |
| `tests/e2e/menu-smoke` + `portal-auth` | Playwright, **read-only, seguros para prod**. | Playwright |
| `tests/e2e/advanced.spec.js` | Fluxos críticos com Supabase **mockado** (`page.route`): comanda directa (marisca → ronda `sent` + `client_token` 037), pedido assistido (no-manches → `awaiting_staff`, zero rondas), chamada de empregado + cooldown anti-spam, split bill. Zero escritas reais — corre no CI. | Playwright |

## Correr localmente
```bash
npm ci && npx playwright install chromium
npm test                     # coverage (limiar 90/75/95) + scan — o gate rápido
npm run test:coverage        # unit + cobertura → tests/coverage/
npm run test:rls             # precisa dos NEXO_RLS_* (ou NEXO_RLS_OPTIONAL=1 p/ skip)
node tests/rls/selftest.mjs  # prova do canário, sem infra
NEXO_TEST_ENV=prod  npx playwright test -c tests/e2e/playwright.config.js menu-smoke.spec.js portal-auth.spec.js
NEXO_TEST_ENV=local npx playwright test -c tests/e2e/playwright.config.js advanced.spec.js
```
Em `local` o Playwright sobe sozinho o `python3 -m http.server 8888` (webServer).

## Cobertura
`npm run test:coverage` corre os unit tests sob **c8** e falha abaixo de
90% linhas/statements, 75% branches, 95% funções (actual: ~95/81/100).
O relatório HTML fica em `tests/coverage/` e sobe como artefacto no CI.

## CI — gate de merge (nexo-tests.yml)
Três jobs, todos pensados para *branch protection required checks*:
`unit-and-scan` · `rls-isolation` · `e2e`. Para bloquear merges de facto,
marcá-los como required em Settings → Branches (main e staging).

O job `rls-isolation` precisa dos secrets `NEXO_RLS_*` (setup único —
`tests/rls/README.md`); sem eles falha com as instruções. **Nunca** apontar
os `NEXO_RLS_*` a produção: o teste escreve uma comanda de teste.

## Environment
- `NEXO_TEST_ENV` — `prod` (default) ou `local` (servidor automático na 8888).
- `NEXO_TEST_SLUG` — default `marisca-petisca`.
- `NEXO_RLS_*` — ver `tests/rls/README.md`.

## Notas históricas / adaptações
- **`rest-nexo-lisboa` → `marisca-petisca`** em todo o lado (o scan falha o
  build se o slug fantasma voltar; já apanhou um link morto no `/status/`).
- **`safeCount()` / `safeSplitBill()` não existem** no código — os unit tests
  cobrem os equivalentes reais do `nexo-security.js`.
- ⚠️ **Os menus NÃO carregam `/js/nexo-security.js` nem `/js/nexo-access.js`**
  (auditoria 2026-07-12): os call sites degradam para no-op. O rate-limit de
  `order_submit` e os guards TAT só existem quando esses scripts forem
  incluídos nos `index.html` dos menus — decisão de produto pendente. O
  anti-spam efectivo da chamada de empregado é o cooldown de 30s do
  `script.js` (coberto pelo E2E).
- **Nenhum teste escreve na Supabase de produção.** Os fluxos E2E usam mocks;
  o RLS usa um projeto de teste dedicado.

## Nota sobre `package.json`
Só para o tooling de testes — o site é estático, sem build step.
