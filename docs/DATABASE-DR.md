# NEXO — Backup & Disaster Recovery (Base de Dados)

> Actualizado 2026-07-11. Aplica-se aos DOIS projetos Supabase:
> **menus+portal** (`kgbrtbpeekhkroibsgqq`) e **NEXO OS** (`vniduodmiatkjiyxidba`).
> O resto da plataforma (Netlify) é estático e reconstrói-se do git —
> a base de dados é o único estado que pode ser perdido.

## 1. Objectivos (RTO / RPO)

| Métrica | Alvo | Como se atinge |
|---|---|---|
| **RPO** (dados perdidos no pior caso) | ≤ 24 h | dump diário automático (secção 2). Com PITR do Supabase: ≤ 2 min |
| **RTO** (tempo até voltar a servir) | ≤ 4 h | runbook da secção 3 + schema reconstruível do git em minutos |

Racional: os dados de maior valor (facturação em `orders_log`, CRM) mudam
devagar; os dados em tempo real (comandas do dia) perdem valor em horas —
um restauro que perca a tarde de hoje é mau, mas um menu offline durante um
dia inteiro é pior. Por isso o RTO curto tem prioridade sobre o RPO fino.

## 2. Camadas de backup

### 2.1 O que o Supabase dá (verificar o plano no dashboard!)

| Plano | Backups automáticos | PITR |
|---|---|---|
| Free | **NENHUM** | não disponível |
| Pro | diário, retenção 7 dias | add-on pago (WAL a cada ~2 min, retenção configurável) |

Dashboard → *Database → Backups*. **Se o projeto está no plano Free, a
secção 2.2 não é opcional — é o único backup que existe.**

PITR (quando activo): *Database → Backups → Point in Time* → escolher o
timestamp → o Supabase restaura o projeto inteiro para esse ponto.
Atenção: o restauro é do projeto TODO — escritas feitas depois do ponto
escolhido perdem-se (ver decisão na secção 4).

### 2.2 Dump diário próprio (independente do plano)

Um workflow do GitHub Actions (o repo já usa Actions para deploy/testes)
faz `pg_dump` todas as noites e guarda o dump cifrado como artifact:

```yaml
# .github/workflows/db-backup.yml
name: db-backup
on:
  schedule: [{ cron: '30 3 * * *' }]   # 03:30 UTC, diário
  workflow_dispatch:
jobs:
  dump:
    runs-on: ubuntu-latest
    steps:
      - name: Dump (schema + dados)
        run: |
          pg_dump "$DB_URL" --format=custom --no-owner \
            --file=nexo-$(date +%F).dump
        env:
          DB_URL: ${{ secrets.SUPABASE_DB_URL }}   # usar o URL do session pooler (porta 5432)
      - name: Cifrar
        run: |
          gpg --batch --symmetric --cipher-algo AES256 \
            --passphrase "${{ secrets.BACKUP_PASSPHRASE }}" nexo-*.dump
      - uses: actions/upload-artifact@v4
        with:
          name: db-backup-${{ github.run_id }}
          path: '*.dump.gpg'
          retention-days: 30
```

Segredos necessários: `SUPABASE_DB_URL` (Dashboard → *Project Settings →
Database → Connection string*, com a password da BD) e `BACKUP_PASSPHRASE`
(`openssl rand -hex 32`, guardar no gestor de passwords). Repetir o job
para o projeto NEXO OS com o segundo URL.

### 2.3 Schema: o git é o backup

Provado em 2026-07-11: um Postgres limpo + `setup-complete.sql` +
migrações `001…039` por ordem reconstrói o schema completo (tabelas,
políticas RLS, funções, triggers, crons), e a **segunda passagem não
falha** — as 40 ficheiros são idempotentes. Ou seja: perder o schema
nunca é um desastre; perder DADOS é. Os dumps da 2.2 existem para os dados.

O que NÃO está no git e precisa de nota manual quando muda:
- segredos do Vault (`nexo_cron_secret` — passos manuais no cabeçalho da 032)
- secrets das Edge Functions (Dashboard → Edge Functions → Secrets)
- utilizadores Auth (donos dos portais) — vêm no dump (schema `auth`)
- config por menu (`config.js` com URL/anon key) — está no git

## 3. Runbook de restauro

### 3.1 Restauro de dados no MESMO projeto (caso normal)

Usar quando: dados corrompidos/apagados por engano, migração destrutiva.
Não muda URL nem keys — os menus e o portal continuam a apontar bem.

1. **Congelar escritas**: Dashboard → *Settings → API* → desactivar
   temporariamente o `anon` key OU pausar o site no Netlify. (Escritas
   durante o restauro serão perdidas ou inconsistentes.)
2. Obter o dump mais recente (artifact do Actions → `gpg --decrypt`,
   ou backup diário do Supabase se plano Pro).
3. Restaurar as tabelas afectadas (não o projeto todo, se o estrago for
   localizado):
   ```bash
   pg_restore "$DB_URL" --data-only --disable-triggers \
     --table=orders_log --table=comandas --table=comanda_items nexo-YYYY-MM-DD.dump
   ```
   (`--disable-triggers` evita notificações/totais recalculados durante a carga.)
   Para restauro total: `pg_restore "$DB_URL" --clean --if-exists nexo-….dump`.
4. Verificar: `select nexo_health_check();` no SQL Editor +
   `/portal/status/` + abrir um menu e confirmar que o evento aparece
   em `menu_events`.
5. Reactivar escritas (passo 1 ao contrário).

### 3.2 PITR (plano Pro + add-on)

1. Congelar escritas (3.1 passo 1).
2. *Database → Backups → Point in Time* → escolher o minuto ANTES do
   incidente → restaurar.
3. Verificação da 3.1 passo 4. As escritas entre o ponto e o presente
   perderam-se — avisar o(s) restaurante(s) afectado(s).

### 3.3 Projeto perdido/irrecuperável (pior caso)

1. Criar projeto Supabase novo (mesma região, eu-west).
2. Reconstruir schema do git: SQL Editor → correr `setup-complete.sql` e
   depois `001`→`039` por ordem (são idempotentes; erro a meio ⇒ pode
   re-correr o ficheiro inteiro).
3. Passos manuais: segredo do Vault (cabeçalho da 032), secrets + deploy
   das Edge Functions (`supabase functions deploy …`), agendamentos já
   ficam criados pelas migrações (027/032/025/026/030/039).
4. Restaurar dados: `pg_restore --data-only` do último dump.
5. **URL e anon key mudaram** → actualizar `config.js` de cada menu +
   portal e fazer deploy Netlify. (Este é o passo que torna o caso 3.3
   caro — tudo o resto é mecânico.)
6. Verificação completa: suite de testes do repo + `/portal/status/`.

### 3.4 Ensaio (fazer 1× por trimestre)

Restaurar o último dump num projeto Supabase descartável (ou Postgres
local) e abrir o portal contra ele. O ensaio de 2026-07-11 (Postgres 17
local) validou: schema 2× idempotente, crons agendados, sweep de retenção
a funcionar, EXPLAIN das queries quentes nos índices certos. Registar a
data e o resultado de cada ensaio aqui:

| Data | Dump | Resultado |
|---|---|---|
| 2026-07-11 | (schema do git; dados sintéticos) | ✅ 40 ficheiros × 2 passagens, 0 falhas |

## 4. Migração que corre mal em produção — estratégia real

Precedente real: as 021/022 quebraram os INSERTs anónimos (42501 em todas
as escritas do menu). A resposta certa NÃO foi restaurar backup — foi a
migração compensatória 023 (`menu_slug_exists()`), porque um restauro
teria deitado fora as escritas legítimas que continuavam a chegar.

**Regra de decisão:**

| Situação | Resposta |
|---|---|
| Migração partiu **código** (função/política/trigger errada) | **Corrigir para a frente**: migração compensatória nova (o schema está no git; reverter = re-aplicar a definição anterior num ficheiro `0XX_fix_…`) |
| Migração **apagou/corrompeu dados** e há tráfego a escrever | Congelar escritas → restaurar SÓ as tabelas afectadas do dump (3.1) → migração compensatória → reabrir |
| Migração apagou dados e o projeto está parado | PITR/restauro total para o minuto anterior (3.2) |

**Antes de correr qualquer migração em produção:**
1. Correr no SQL Editor **de staging** primeiro (ou no ensaio local 2×).
2. Se a migração faz DELETE/UPDATE em massa: snapshot barato das tabelas
   tocadas no próprio SQL Editor —
   `create table _pre039_orders_log as select * from orders_log;`
   (apagar os `_pre*` depois de 48 h de produção saudável).
3. Ter o dump da noite anterior à mão (2.2).

**Depois de correr:**
1. `select nexo_health_check();` — `errors_last_hour` e `menu_events_24h`.
2. Abrir um menu real e fazer uma escrita (o modo de avaria das 021/022
   era exactamente este: SELECTs ok, INSERTs 42501 → o portal "parecia"
   saudável mas ia a zeros).
3. `/portal/status/` + `error_log` (`select * from error_log where
   created_at > now() - interval '1 hour' order by created_at desc;`).

## 5. Manutenção automática em produção (para referência)

| Job (pg_cron) | Agenda (UTC) | O quê |
|---|---|---|
| `nexo-retention-sweep` | 04:20 diário | retenção completa (039): purga logs, eventos >13 m, comandas terminadas >24 m, preserva agregados no `retention_rollup` |
| `nexo-monitoring-cleanup` | 04:00 seg. | monitoring_log/system_alerts >30 d (026) |
| `nexo-archive-stale-comandas` | 05:00 diário | arquiva comandas presas >18 h (030) |
| `nexo-daily-health` | 06:00 diário | health check → error_log (025) |
| `nexo-check-client-health` | hora a hora | Edge Function de monitorização (027/032) |
| `nexo-daily-digest` | 09:00 diário | digest WhatsApp (027/032) |

Verificar que estão vivos: `select jobname, schedule, active from cron.job;`
e as últimas execuções: `select * from cron.job_run_details order by start_time desc limit 20;`.
