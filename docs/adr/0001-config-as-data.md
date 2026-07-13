# ADR 0001 — Config como dado (config.json), não código (config.js)

- **Estado:** Aceite e implementado (2026-07-12)
- **Contexto:** Missão "motor partilhado + config-as-data"

## Contexto

Cada menu tem um `menu/<slug>/config.js` com os dados do restaurante
(`const CONFIG = {…}`) e um helper `const P = (id) => …` que constrói URLs de
fotos Pexels. Dois consumidores lêem-no:

1. **A própria página do menu** — via `<script src="config.js">`, que expõe o
   `CONFIG` global usado pelo `script.js`.
2. **O portal** (5 sítios: `portal.js` ×2, `sala.js`, `pending-orders.js`,
   `portal/menu/index.html`) — fazia `fetch('/menu/<slug>/config.js')` e
   **avaliava o texto com `new Function(text + ';return CONFIG')()`** para
   extrair o objecto.

O `new Function()` é `eval`. Obrigava a `'unsafe-eval'` na CSP do site inteiro
(`netlify.toml`), o que enfraquece a protecção contra XSS: um atacante que
injecte um `<script>` pode usar `eval` para reconstruir payloads.

## Decisão

Tornar **`config.json` a fonte de dados** e ler tudo com `JSON.parse`
(`res.json()`), eliminando o `eval`:

- Um gerador de build (`scripts/build-config-json.mjs`) avalia `config.js`
  **uma vez, em Node, no commit/CI** (nunca no browser), resolve o `P()` e
  serializa o `CONFIG` para `config.json`. Build-time eval de código NOSSO
  versionado ≠ runtime eval de texto fetchado.
- Os 5 sítios do portal passam a `fetch('/menu/<slug>/config.json')` +
  `res.json()`. **Zero `new Function`/`eval` no código servido.**
- `'unsafe-eval'` sai da CSP (ver [[0003-csp-hardening]]).
- Um passo de CI (`build-config-json.mjs --check`) falha se algum
  `config.json` estiver dessincronizado do `config.js`.

## Consequências

- **+ Segurança:** CSP sem `'unsafe-eval'`; superfície de XSS reduzida.
- **+ Simplicidade:** o portal lê dados, não avalia código arbitrário.
- **Interim:** os menus continuam a servir `config.js` como `<script>` (que é
  CSP-safe — não é eval). `config.json` é gerado a partir dele. A migração da
  própria página do menu para `config.json` (removendo o `config.js`) é a Fase
  2 de [[0002-shared-menu-engine]] — adiada para não mexer no arranque dos
  menus live (NFC/QR) sem uma passagem dedicada e testada.
- **Verificação:** os 4 `config.json` gerados são `JSON.stringify`-idênticos
  ao output de avaliar o `config.js` — dados fiéis, comportamento inalterado.
