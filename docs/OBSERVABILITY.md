# NEXO — Observabilidade das Edge Functions

As 6 Edge Functions (Deno) partilham `supabase/functions/_shared/observability.ts`.
Objectivo: **uma function que falha gera um alerta observável, nunca uma falha
silenciosa descoberta pelo cliente.**

## Logging estruturado

Cada invocação cria `{ log, cid }` via `startInvocation(fn, req)`. Os logs são
**JSON de uma linha** (pesquisáveis nos logs do Supabase / qualquer agregador):

```json
{"ts":"2026-07-12T11:35:53.593Z","level":"info","fn":"check-client-health","cid":"a1b2-…","msg":"start","total_menus":4,"hourPT":13}
```

- **Níveis:** `debug` · `info` · `warn` · `error`.
- **`cid` (correlation id):** um uuid por invocação. Reutiliza o header
  `x-correlation-id`/`x-request-id` se vier válido; senão gera novo. Viaja em
  todos os logs dessa execução **e na resposta ao cliente** (campo `cid`), para
  correlacionar um erro reportado com os logs — sem expor nada sensível.
- **Sem PII:** loga slugs, contagens, ids, códigos. **Nunca** nomes, notas,
  `table_label`, emails, telefones, tokens ou corpos de request. (Regra ao
  escrever `log.*({...})`: só campos não-pessoais.)

Pesquisar (Supabase Dashboard → Edge Functions → Logs, ou CLI):
```
fn:"daily-digest" level:"error"
cid:"a1b2-..."          # segue uma invocação inteira
msg:"callmebot_failed"  # um evento específico
```

## Error tracking (Sentry)

`captureException(err, { fn, cid, ... })` envia o erro para o **Sentry** via
envelope HTTP (sem SDK — funciona em Edge/Deno, arranque frio mínimo). É:
- **Opcional:** só activo se `SENTRY_DSN` estiver nos secrets. Sem DSN, o erro
  fica na mesma no log estruturado (`level:"error"`, `msg:"exception"`).
- **Fail-safe:** um problema no reporting (timeout, DSN inválido) é engolido —
  nunca parte a function.
- **Com contexto:** tags `fn` + `cid`, `environment` (de `NEXO_ENV`), tipo e
  mensagem do erro, stack. **Sem PII.**

Setup (uma vez): criar um projeto Sentry → Project Settings → Client Keys (DSN)
→ Supabase → Project Settings → Edge Functions → Secrets:
```
SENTRY_DSN = https://<publicKey>@<host>/<projectId>
NEXO_ENV   = production   (ou staging)
```

## Respostas ao cliente — nunca vazam

`safeError(err, { log, cid, fn, publicMessage?, status?, headers? })`:
1. regista o **detalhe completo no servidor** (log + Sentry);
2. devolve ao cliente **só** `{ error: <mensagem genérica>, cid }`.

O código/mensagem/SQL da BD **nunca** chega ao cliente. Provado em
`_shared/observability.test.ts` (o corpo não contém `42P01`, `relation …`,
nomes de tabela — só a mensagem genérica + cid). Corrigiu os antigos
`error: String(err)` / `error.message` em generate-weekly-report,
send-push-notification e archive-stale-orders.

No portal, `renderFatalError` também deixou de renderizar o detalhe cru da BD
(vai para a consola; o utilizador vê só a mensagem amigável).

## Hardening

- **Fail closed no cron secret:** funções só-cron (check-client-health,
  daily-digest, archive-stale-orders) usam `cronGuard(req, log, { required:true })`
  — sem `NEXO_CRON_SECRET` configurado **ou** header errado → **401**, nunca
  correm. (migração 032 guarda o segredo no Vault e o pg_cron envia-o.)
  nexo-health-endpoint é pública (só o *detalhe* por cliente é auth-gated);
  generate-weekly-report/send-push-notification são invocadas pelo portal/menu.
- **Timeouts:** chamadas externas (CallMeBot, etc.) via `fetchWithTimeout`
  (5 s) — uma dependência lenta não prende a function.
- **Idempotência:** archive-stale-orders só toca comandas ainda não arquivadas
  > 18h → reexecutar é seguro (o cron pode repetir sem duplicar efeitos).

## Camada RPC para leituras sensíveis (auditoria)

Critério: qualquer leitura sensível que dependesse de RLS aberta segue o padrão
`nm_financeiro_stats` (036, SECURITY DEFINER, agregados sem PII). Estado actual
(nada em aberto):
- **comandas/itens/rondas:** as políticas `using (true)` (016/020/028) foram
  substituídas por **037** (token-scoped `scoped_read_*` + RPCs
  `nexo_table_access`/`nexo_join_comanda`/`nexo_can_read_comanda`).
- **financeiro:** `nm_financeiro_stats` (036) + auth do dono (038).
- **relatório semanal:** RPC SECURITY DEFINER `generate_weekly_report` (010).
- **menu_events/orders_log/staff_calls:** sem SELECT para anon (021); só
  `authenticated` via `owns_espaco` (028).

## Testes

`deno test --allow-env supabase/functions/_shared/observability.test.ts`
— 9 testes: fail-closed do cronGuard, `safeError` não vaza, JSON de uma linha,
propagação do cid.
