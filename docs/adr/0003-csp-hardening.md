# ADR 0003 — Remoção de 'unsafe-eval' da CSP

- **Estado:** Aceite e implementado (2026-07-12)

## Contexto

A CSP em `netlify.toml` incluía `'unsafe-eval'` no `script-src`,
exclusivamente porque o portal avaliava `config.js` com `new Function()`
(ver [[0001-config-as-data]]). `'unsafe-eval'` permite `eval`, `new Function`,
`setTimeout('string')` — vias que um XSS injectado usa para reconstruir
payloads que a CSP de outra forma bloquearia.

## Decisão

Removido `'unsafe-eval'` do `script-src`. Pré-condições verificadas:

1. **Código NEXO:** zero `new Function`/`eval` (os 5 sítios do portal migrados
   para `JSON.parse`). Confirmado por grep sobre `js/ portal/ menu/`.
2. **Libs servidas:** `supabase-js` (cópia local inspeccionada — sem
   `new Function(`/`eval(`), `Chart.js 4`, `GSAP 3`, `QRCode` — todas
   CSP-compatíveis por design (GSAP e Chart.js documentam suporte a CSP sem
   `unsafe-eval`).

`script-src` final:
```
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net
  https://cdnjs.cloudflare.com https://www.googletagmanager.com
  https://*.google-analytics.com
```

## Consequências

- **+ Segurança:** um `<script>` injectado já não pode usar `eval`/`Function`.
- **Nota:** `'unsafe-inline'` mantém-se (os menus/portal têm handlers e config
  inline — GA4, `ESPACO_SLUG`, o boot de vídeo do no-manches). Removê-lo exige
  nonces/hashes por página — trabalho futuro, fora do âmbito desta missão.
- **Regressão a vigiar:** se alguém reintroduzir `new Function`/`eval` ou uma
  lib que dependa deles, o portal/menu parte em produção (a CSP bloqueia).
  Um teste de scan (`tests/scan/scan.mjs`) já procura padrões perigosos;
  considerar adicionar uma asserção anti-`eval`.
