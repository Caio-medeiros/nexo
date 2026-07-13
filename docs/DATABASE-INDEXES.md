# NEXO — Auditoria de Índices

> Verificado em 2026-07-11 com `EXPLAIN (ANALYZE)` em PostgreSQL 17, num
> ambiente limpo com as migrações 001–039 aplicadas e volume sintético
> realista (~480k `menu_events`, 4k `comandas`, 24k `comanda_items`,
> 8k `comanda_rounds`, 6k `orders_log`, 3k `staff_calls`, 2k `waitlist_entries`).
> Script reproduzível: ver secção "Como repetir a auditoria".

## Queries quentes → índice que as serve

Todas as queries abaixo foram confirmadas com EXPLAIN a usar o índice indicado
(nenhuma faz seq scan da tabela grande).

| # | Ecrã / origem | Query (resumo) | Índice usado | Migração |
|---|---|---|---|---|
| Q1 | **Sala** (`sala.js`) | `comandas` por `espaco_slug` + `status in (…)` + `archived_at is null`, ordenado por `created_at` | `comandas_active_idx` (parcial `where archived_at is null`) | 030 |
| Q2 | **Cozinha** | `comanda_rounds` por `espaco_slug` + `status in ('fired','acknowledged')`, ordem `fired_at desc` | `comanda_rounds_slug_idx` (status é filter — aceitável, ver notas) | 020 |
| Q3 | **Cozinha** | `comanda_items` por `round_id` | `comanda_items_round_idx` | 020 |
| Q4 | **Financeiro NM** (`financeiro.js`) | `comanda_items` por `espaco_slug` + `status in (BILLABLE)` + intervalo `created_at`, join `comandas` | `idx_comanda_items_financeiro` (parcial nos status facturáveis) + `comandas_pkey` no join | 035 |
| Q5 | **check-client-health** | `count(menu_events)` por `espaco_slug` + janela `created_at` (2h/24h/7d) | `menu_events_main_idx` (index-only scan) | 007 |
| Q6 | **nm_financeiro_stats** (036) / Estatísticas | `menu_events` por `espaco_slug` + `event_name` + janela | `menu_events_event_idx` (index-only scan) | 007 |
| Q7 | **check-client-health** | último evento do espaço (`order by created_at desc limit 1`) | `menu_events_main_idx` | 007 |
| Q8a | **Sala** (KPIs de hoje) | `orders_log` por `espaco_slug` + `created_at >= hoje` | `orders_log_espaco_idx` | 001 |
| Q8b | **Sala** (KPIs de hoje) | `staff_calls` por `espaco_slug` + `created_at >= hoje` | `staff_calls_espaco_idx` (created_at é filter — ver notas) | setup |
| Q9 | **Fila** (`waitlist_status`) | `waitlist_entries` por `espaco_slug` + `status='waiting'`, ordem `sort_order` | `waitlist_entries_sort_idx` | 004 |
| Q10 | **check-client-health** | `error_log` não resolvido nas últimas 24h | `error_log_unresolved_idx` (parcial `resolved=false`; com a tabela quase vazia o planner escolhe seq scan — correcto) | 025 |
| Q11 | **Portal (Mesas a confirmar)** | `comanda_items` com `status='awaiting_staff'` | `idx_comanda_items_awaiting` (parcial) | 034 |
| Q12 | **Cozinha (voids)** | `comanda_voids` não reconhecidos por espaço | `comanda_voids_unread_idx` (parcial `acknowledged=false`) | 020 |
| Q13 | **nexo_retention_sweep** (039) | deletes por `created_at < cutoff` em `menu_events` | seq scan paralelo **deliberado** — ver notas | 039 |

### Notas de desenho

- **Q2 (cozinha)**: `comanda_rounds_slug_idx` é `(espaco_slug, fired_at desc)`;
  o filtro de `status` é aplicado por cima. Com a retenção da 039 (rondas caem
  com as comandas ao fim de 24 meses) e o arquivo diário da 030, o conjunto
  por espaço mantém-se pequeno — um índice parcial por status não se justifica.
- **Q8b (staff_calls)**: o índice é só `(espaco_slug)`; o corte por dia é
  filter. Medido: 0.17 ms com 1000 chamadas por espaço. Com a retenção de
  13 meses (039) a tabela não cresce ao ponto de justificar o composto
  `(espaco_slug, created_at desc)`. Reavaliar se `idx_scan`/latência subirem.
- **Q13 (sweep)**: o delete diário do sweep varre a tabela por `created_at`
  sem índice dedicado — medido em 40 ms sobre 480k linhas, uma vez por dia
  às 04:20. Não vale a pena pagar um índice extra na tabela com mais escritas
  do sistema. Se o volume crescer 10×, a opção certa é um índice **BRIN** em
  `menu_events(created_at)` (tabela append-only → BRIN de KBs, não um btree).

## Inventário completo (o que cada índice serve)

### Tabelas quentes

| Tabela | Índice | Definição | Serve |
|---|---|---|---|
| `menu_events` | `menu_events_main_idx` | `(espaco_slug, created_at desc)` | janelas de tempo por espaço (health, estatísticas, lifetime) |
| | `menu_events_event_idx` | `(espaco_slug, event_name, created_at desc)` | contagens por tipo de evento (036, dashboard) |
| `comandas` | `comandas_active_idx` | `(espaco_slug, status) where archived_at is null` | **o** índice da Sala/Cozinha (tudo o que está no ecrã) |
| | `comandas_slug_idx` | `(espaco_slug, created_at desc)` | histórico por espaço (pouco usado) |
| | `comandas_status_idx` | `(espaco_slug, status)` | ⚠️ redundante — ver abaixo |
| | `comandas_code_idx` | `(session_code)` | ⚠️ redundante — ver abaixo |
| | `comandas_session_code_key` | unique `(session_code)` | juntar-se à comanda por código |
| `comanda_items` | `comanda_items_comanda_idx` | `(comanda_id, status)` | itens de uma comanda (menu + sala) |
| | `comanda_items_round_idx` | `(round_id)` | itens de uma ronda (cozinha) |
| | `idx_comanda_items_financeiro` | `(espaco_slug, status, created_at) where status in (facturáveis)` | dashboard financeiro |
| | `idx_comanda_items_awaiting` | `(espaco_slug, status, created_at) where status='awaiting_staff'` | pedidos assistidos pendentes |
| `comanda_rounds` | `comanda_rounds_slug_idx` | `(espaco_slug, fired_at desc)` | fila da cozinha |
| | `comanda_rounds_comanda_idx` | `(comanda_id)` | rondas de uma comanda |
| | `…_comanda_id_round_number_key` | unique `(comanda_id, round_number)` | integridade (não remover) |
| `comanda_voids` | `comanda_voids_slug_idx` | `(espaco_slug, created_at desc)` | histórico de voids |
| | `comanda_voids_unread_idx` | `(espaco_slug, acknowledged) where acknowledged=false` | alerta na cozinha |

### Tabelas de suporte

| Tabela | Índice | Serve |
|---|---|---|
| `orders_log` | `orders_log_espaco_idx` `(espaco_slug, created_at desc)` | KPIs de hoje, health, lifetime |
| `staff_calls` | `staff_calls_espaco_idx` `(espaco_slug)` | chamadas do dia |
| `waitlist_entries` | `waitlist_entries_sort_idx` `(espaco_slug, status, sort_order)` | fila em directo |
| | `waitlist_entries_token_idx` unique `(token)` | RPC `waitlist_status(token)` |
| | `waitlist_entries_queue_idx` `(espaco_slug, status, created_at)` | ⚠️ redundante — ver abaixo |
| `portal_notifications` | `portal_notifications_slug_idx` / `portal_notifications_unread_idx` (parcial) | sino do portal |
| `rate_limit_log` | `rate_limit_session_idx` `(session_id, event_type, created_at desc)` | verificação de limite por sessão |
| | `rate_limit_cleanup_idx` `(created_at)` | purga das 24h (job da 039) |
| `security_log` | `security_log_cleanup_idx` `(created_at)` | purga dos 30 dias (job da 039) |
| `error_log` | `error_log_unresolved_idx` (parcial `resolved=false`) | health check |
| `order_flags` | `order_flags_slug_idx` / `order_flags_unreviewed_idx` | revisão de flags no portal |
| `monitoring_log` | `monitoring_log_checked_at_idx` | status page / health |
| `system_alerts` | `system_alerts_unacked_idx` (parcial) | alertas por reconhecer |
| `clients` / `menus` | `clients_auth_user_idx`, `clients_referred_by_idx`, `menus_slug_key` | owns_espaco(), referrals |

## ⚠️ Índices redundantes (candidatos a remoção)

Confirmados como não usados por nenhuma query do código nesta auditoria.
**Não são removidos automaticamente** — antes de dropar, confirmar em produção
que `idx_scan` continua ≈0 depois de ≥30 dias de tráfego real:

```sql
select relname, indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid))
from pg_stat_user_indexes
where indexrelname in ('comandas_code_idx','comandas_status_idx','waitlist_entries_queue_idx')
order by relname;
```

| Índice | Porquê é redundante | Acção |
|---|---|---|
| `comandas_code_idx` | Duplica byte-a-byte o índice da constraint `comandas_session_code_key` (016 declara `session_code unique` **e** cria o índice à parte) | `drop index if exists comandas_code_idx;` |
| `comandas_status_idx` | Mesmas colunas de `comandas_active_idx` (030) sem o predicado; todas as queries vivas filtram `archived_at is null` e usam o parcial | `drop index if exists comandas_status_idx;` (só se o histórico arquivado nunca for consultado por status) |
| `waitlist_entries_queue_idx` | A 004 substituiu a ordenação por `sort_order`; o prefixo `(espaco_slug, status)` já existe em `waitlist_entries_sort_idx` | `drop index if exists waitlist_entries_queue_idx;` |

Cada drop poupa escrita em tabelas quentes (`comandas` sobretudo) e é
reversível (`create index` de novo). Fazer um de cada vez, fora de horas.

## Como repetir a auditoria

1. Postgres limpo (o CI/local serve) com as migrações aplicadas 2×
   (ver `docs/DATABASE-DR.md`, secção "Reconstrução de schema").
2. Semear volume sintético e correr os EXPLAINs — o script usado nesta
   auditoria está documentado no relatório da sessão; o essencial:
   `explain (analyze, buffers)` sobre as queries Q1–Q13 acima, depois
   `select * from pg_stat_user_indexes order by idx_scan` para apanhar
   índices mortos.
3. Em produção (leitura, sem risco): a mesma query `pg_stat_user_indexes`
   no SQL Editor dá o uso real acumulado desde o último reset de stats.
