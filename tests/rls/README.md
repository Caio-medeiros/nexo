# Testes de RLS / isolamento multi-tenant

`rls.mjs` prova, contra um projeto Supabase de **teste**, que a anon key não
atravessa venues: comandas sem `x-comanda-token` → 0 linhas (o canário que
falha se alguma política voltar a `using (true)`), faturação negada a anon,
`table_tokens` invisível, e o dono autenticado confinado ao seu slug.

Zero dependências (só `fetch` do Node ≥18). **Escreve** uma comanda de teste
(`Mesa RLS-CI`, cancelada no fim; o arquivo da 030 limpa restos) — por isso
NUNCA apontar a produção.

## Projeto de teste — seed mínimo

1. Projeto Supabase dedicado (free serve) com as migrações aplicadas por
   ordem: `setup-complete.sql` + `001…039` (ver docs/DATABASE-DR.md §3.3).
2. Dois venues em `menus` (ex.: `marisca-petisca` e `rest-no-manches-lisboa`)
   — o insert de comandas exige que o slug exista.
3. Uma conta Auth "dono de teste" ligada a UM deles
   (`clients.auth_user_id`), para os testes de dono/cross-tenant.

## Variáveis

| Var | Obrigatória | Exemplo |
|---|---|---|
| `NEXO_RLS_URL` | ✅ | `https://xyz.supabase.co` |
| `NEXO_RLS_ANON_KEY` | ✅ | anon key do projeto de teste |
| `NEXO_RLS_SLUG` | — (default `marisca-petisca`) | venue do dono de teste |
| `NEXO_RLS_OWNER_EMAIL` / `NEXO_RLS_OWNER_PASSWORD` | p/ testes de dono | |
| `NEXO_RLS_OTHER_SLUG` | p/ cross-tenant | venue que o dono NÃO possui |
| `NEXO_RLS_OPTIONAL` | — | `1` = sem config sai 0 (uso local); no CI fica por definir → gate real |

```bash
npm run test:rls
```

No CI (`nexo-tests.yml`, job `rls-isolation`) as variáveis vêm dos secrets do
repositório e o job é **bloqueante**: sem secrets configurados falha com as
instruções de setup — configurar uma vez e fica.
