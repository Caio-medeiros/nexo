# ADR 0002 — Motor de menu partilhado (/js/menu-engine.js)

- **Estado:** Aceite (direcção); Fase 0 feita, Fases 1–3 planeadas
- **Contexto:** Missão "motor partilhado + config-as-data"

## Contexto / Problema

Cada cliente é uma **cópia** do `menu/_template/` (`script.js` ~5 400 linhas,
`style.css` ~141 KB, `nexo-premium.js`, etc.). As cópias já divergiram do
template (medido em 2026-07-12, `diff`):

| Ficheiro | marisca | no-manches | de (linhas) |
|---|---|---|---|
| `script.js` | 542 linhas | 854 linhas | ~5 500 (~85–90 % comum) |
| `nexo-premium.js` | 85 linhas | 85 linhas | ~1 000 |
| `script.js` marisca↔no-manches | — | 322 linhas entre si | — |

**Consequência:** um patch de segurança (ex.: as Missões 037/033, o escHtml
XSS) tem de ser aplicado **à mão em cada cópia** — não escala e é propenso a
esquecer uma. (Ironia observada: a própria optimização de performance desta
sessão adicionou o lazy-load a marisca e no-manches mas não ao template,
aumentando a divergência — é exactamente o problema.)

## Decisão

Extrair o **core comum** para um `/js/menu-engine.js` **partilhado** (mesmo
modelo do `nexo-analytics.js`/`nexo-security.js`, já partilhados em `/js`).
Cada `menu/<slug>/` fica só com:

- `config.json` (dados — ver [[0001-config-as-data]]),
- assets (`img/`, `fonts/`),
- **overrides mínimos** (tema/CSS, e um hook JS opcional por-menu).

O modo (**direto** vs **assistido**) passa a ser **dado no config**
(`VENUE_TYPE`), não código copiado: o motor ramifica pelo config, como o
`nexo-assisted.js` já faz condicionalmente.

**Alvo:** uma alteração no motor propaga-se a todos os menus sem edição
por-cliente.

## Porque NÃO foi feito de uma vez nesta sessão

Os paths dos menus são permanentes (NFC/QR físicos apontam para eles) e o
critério é "comportamento de marisca e no-manches **inalterado**". Unificar
5 500 linhas com 542/854 de divergência real (parte comportamental —
direto vs assistido —, parte tema, parte *drift*/bugs acumulados) é um
refactor grande e arriscado que **tem de ser feito e revisto como esforço
dedicado**, com os E2E a passar a cada micro-passo. Rush = partir menus live.

## Plano de migração faseado (incremental, E2E verde a cada passo)

- **Fase 0 — feito:** `/js` já tem partilhados (`nexo-analytics`,
  `nexo-security`, `nexo-access`, `comanda`, `nexo-cookies`); `config.json`
  como fonte de dados ([[0001-config-as-data]]).
- **Fase 1 — bootstrap partilhado:** criar `/js/menu-boot.js` (defer) que faz
  `fetch config.json` → `window.CONFIG`/`ESPACO_SLUG` → carrega o motor.
  Migrar a página do menu de `<script src="config.js">` para este boot; dropar
  o `config.js` servido. E2E (Missão 2: comanda direta/assistida, chamada,
  split) verde.
- **Fase 2 — extrair o core:** `diff` de 3 vias (template↔marisca↔no-manches),
  classificar cada bloco divergente em: (a) **config-driven** → mover para o
  motor com switch por `CONFIG`; (b) **tema** → CSS override; (c)
  **drift/bug** → reconciliar para uma só versão. Mover o comum para
  `/js/menu-engine.js`. Um menu de cada vez, E2E a cada um.
- **Fase 3 — casca fina:** cada `menu/<slug>/index.html` carrega
  `/js/menu-engine.js` + `config.json` + overrides. `script.js` por-cliente
  desaparece. Provar: um patch no motor chega aos dois menus sem edição.

## Alternativas consideradas

- **Build/bundler (Vite/esbuild):** resolveria isto com imports, mas introduz
  um passo de build num site hoje 100 % estático — maior mudança operacional.
  Adiado; o motor partilhado por `<script src>` (como já se faz em `/js`) não
  precisa de build e é o passo natural seguinte.
- **Manter cópias + script de sync:** trata o sintoma, não a causa; a
  divergência continua a acumular.
