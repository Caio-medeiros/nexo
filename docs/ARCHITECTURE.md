# NEXO — Arquitectura

Site **estático** (sem build step) servido pelo Netlify. Três superfícies:

```
/menu/<slug>/     menu público do cliente (NFC/QR apontam para aqui — paths PERMANENTES)
/portal/          área do restaurante (sala, cozinha, financeiro, editor, estatísticas)
/ (raiz)          landing NEXO
```

Dados em tempo real e auth: **Supabase** (projeto menus+portal
`kgbrtbpeekhkroibsgqq`). Ver `docs/DATABASE-*.md`.

## Módulos partilhados (`/js`)

Servidos de um só sítio, usados por menus e/ou portal (cache 1h +
stale-while-revalidate — ver `netlify.toml`):

| Ficheiro | Papel |
|---|---|
| `nexo-security.js` | sanitização, validadores, rate-limit, erros seguros (menu + portal) |
| `nexo-access.js` | verificação de presença por token de mesa (TAT) |
| `nexo-analytics.js` | GA4 + eventos `menu_events` |
| `nexo-cookies.js` | consentimento |
| `comanda.js` | helpers de comanda |

**Direcção:** o core de render do menu deve juntar-se a esta lista como
`/js/menu-engine.js` — ver [ADR 0002](adr/0002-shared-menu-engine.md).

## Menu — como carrega hoje

```
index.html
 ├─ <head>: preconnect fonts · preload hero/wordmark + Bebas · CSS
 ├─ config.js      → const CONFIG (dados do restaurante) + helper P()
 ├─ config.json    → MESMOS dados, gerados de config.js (scripts/build-config-json.mjs)
 ├─ script.js      (defer) motor de render — ~5 400 linhas, HOJE copiado por cliente
 ├─ nexo-premium.js(defer) comanda/rondas
 └─ nexo-assisted.js (defer, só no-manches) fluxo awaiting_staff
```

Modo do venue:
- **direto** (marisca) — a confirmação do cliente dispara logo uma ronda p/ a cozinha.
- **assistido** (no-manches, `VENUE_TYPE:'assisted'`) — o pedido fica
  `awaiting_staff`; a cozinha só o vê depois de o staff confirmar.

## Config — fonte de dados

`config.json` é a **fonte de dados** (config-as-data). Fluxo:

```
config.js  ──(scripts/build-config-json.mjs, em build/CI)──►  config.json
                                                                  │
                       ┌──────────────────────────────────────────┤
              a página do menu (interim: ainda via config.js)   o PORTAL
                                                                  │
                                              fetch config.json + JSON.parse
                                              (portal.js, sala.js, pending-orders.js,
                                               portal/menu) — ZERO eval
```

O portal **nunca** avalia código: lê `config.json`. Isto removeu
`'unsafe-eval'` da CSP. Ver [ADR 0001](adr/0001-config-as-data.md) e
[ADR 0003](adr/0003-csp-hardening.md).

Regenerar / verificar:
```bash
node scripts/build-config-json.mjs          # regenera todos os config.json
node scripts/build-config-json.mjs --check  # CI: falha se algum estiver stale
```

## Segurança (CSP)

`netlify.toml` — CSP por rota, hosts inventariados do código real. **Sem
`'unsafe-eval'`** (desde 2026-07-12). `'unsafe-inline'` ainda necessário
(handlers/config inline); nonces são trabalho futuro.

## Testes (ver `tests/README.md`)
- unit + coverage (`nexo-security.js`), config scan (segredos/eval/senhas),
  RLS/isolamento multi-tenant, E2E (comanda direta/assistida, chamada, split),
  e orçamento de performance (Lighthouse CI — `docs/PERFORMANCE.md`).

## Registo de decisões (ADR)
- [0001 — Config como dado](adr/0001-config-as-data.md)
- [0002 — Motor de menu partilhado](adr/0002-shared-menu-engine.md)
- [0003 — Remoção de 'unsafe-eval'](adr/0003-csp-hardening.md)
