# NEXO — Checklist OWASP Top 10 (2021)

> Estado de cada categoria contra o produto (menus + portal + Edge Functions).
> Actualizado 2026-07-12. Ver também `docs/SECURITY-RLS.md`,
> `docs/OBSERVABILITY.md`, e os ADRs em `docs/adr/`.

Legenda: ✅ coberto · 🟡 parcial/risco aceite · ⬜ trabalho futuro.

## A01 — Broken Access Control ✅
- **RLS em todas as tabelas** (021); auditoria tabela-a-tabela em
  `docs/SECURITY-RLS.md` (feita sobre `pg_policies`, não sobre as migrações).
- Isolamento multi-tenant via `owns_espaco()` (autenticado) e `client_token`
  por comanda (037). PII (guest_profiles), faturação, notificações → só dono.
- **Testado no CI**: `tests/rls/rls.mjs` — canário que FALHA se uma política
  regredir para `using(true)`; faturação negada a anon; dono confinado ao slug.
- Nenhuma tabela sensível com `using(true)`+anon (só display/config).

## A02 — Cryptographic Failures ✅
- HTTPS forçado (HSTS `max-age=31536000; includeSubDomains`, netlify.toml).
- **service_role key nunca no cliente** — só Edge Functions/Vault; verificado
  pelo scan `tests/scan/scan.mjs` (procura `service_role`, `sk-ant-`, VAPID).
- Auth do dono via Supabase Auth (bcrypt server-side); **removido** o hash de
  senha client-side SHA-256 do financeiro (038). Scan bloqueia hashes/senhas
  hardcoded (SENHA_HASH, bcrypt/argon2, comparação plaintext).
- anon key é pública por design (não é segredo — a defesa é a RLS).

## A03 — Injection ✅
- **SQL**: sem SQL dinâmico no cliente; escrita via PostgREST parametrizado +
  RPCs `security definer` com `search_path` fixo e validação de forma de input
  (`slug !~ '^[a-z0-9\-]+$'`).
- **XSS**: todo o dado de cliente que chega a `innerHTML` passa por
  `escHtml`/`escapeHtml` (auditoria em `project_xss_innerhtml_audit`); guard
  no scan (`tests/scan`) que FALHA se `${note/table_label/member_name}` chegar
  a `innerHTML` sem escape.
- **Eval**: zero `eval`/`new Function` no código servido — config lê-se via
  `JSON.parse` (ADR 0001); scan bloqueia reintrodução.

## A04 — Insecure Design 🟡
- Defesa em profundidade: RLS (servidor) + validação (cliente) + rate-limit
  (cliente **e** servidor, 040) + fail-safe nos triggers de notificação (025).
- Modelo de ameaça documentado (RLS.md). 🟡 Falta um threat-model formal
  escrito para novos fluxos (recomendado antes de features de pagamento).

## A05 — Security Misconfiguration 🟡
- CSP por rota (netlify.toml), `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, HSTS.
- **`'unsafe-eval'` REMOVIDO** (ADR 0003).
- 🟡 **`'unsafe-inline'` mantém-se** — ver "Nota CSP" abaixo.
- Edge Functions: cron secret fail-closed (040/032/obs), timeouts, sem detalhe
  de erro para o cliente (`safeError`, `docs/OBSERVABILITY.md`).

## A06 — Vulnerable & Outdated Components 🟡
- Dependências mínimas e fixadas: supabase-js\@2, GSAP\@3.12.5, Chart.js\@4.4.1,
  QRCode\@1.5.3 (versões pin no CDN). Dev-deps (Playwright, c8, lighthouse, lhci)
  via `npm ci` (lockfile commitado).
- 🟡 Sem Dependabot/`npm audit` no CI — **recomendado** adicionar.

## A07 — Identification & Authentication Failures ✅
- Supabase Auth (JWT) para o portal e para o financeiro (storageKey próprio,
  não herda sessão — 038). Sem sessões/roles caseiros.
- Rate-limit em acções sensíveis (040) reduz brute-force/spam.

## A08 — Software & Data Integrity Failures ✅
- Deploy só via GitHub Actions após testes (deploy.yml); auto-deploy do Netlify
  desligado. Scripts CDN com versão fixa.
- `config.json` gerado e verificado no CI (`build-config-json.mjs --check`) —
  não pode divergir do `config.js` sem falhar.

## A09 — Security Logging & Monitoring Failures ✅
- **Logging estruturado + Sentry** nas 6 Edge Functions (`docs/OBSERVABILITY.md`):
  correlation id, níveis, sem PII; uma function que falha gera alerta.
- **Audit log** de acções sensíveis do portal (040): `audit_log` + `nexo_audit()`
  (quem editou menu, quem viu faturação, mudanças de disponibilidade). Grava o
  `auth.uid()` real (não forjável), só para o próprio espaço.
- Monitorização 3-camadas (health endpoint, cron horário, digest) + `error_log`.

## A10 — Server-Side Request Forgery (SSRF) ✅
- As Edge Functions só chamam hosts fixos conhecidos (CallMeBot, Sentry, ntfy)
  — nunca URLs vindas de input do utilizador. Sem proxy/fetch de URL arbitrária.

---

## Nota CSP — porque `'unsafe-inline'` ainda lá está

Remover `'unsafe-inline'` exigiria **nonces** ou **hashes** para todo o script/
estilo inline. No NEXO isso é impraticável **hoje** porque:

- O site é **estático no Netlify** (headers estáticos em `netlify.toml`).
  Nonces precisam de ser gerados **por resposta** — só possível movendo para
  **Netlify Edge Functions** que injectem o nonce no HTML e no header a cada
  pedido. É uma mudança arquitectural significativa.
- Há **~16 blocos `<script>` inline** (config GA4, `ESPACO_SLUG`, boot de vídeo),
  **~19 handlers `on*=`** e **~36 `style=`** inline. Hashes são frágeis (mudam
  com o conteúdo) e não cobrem handlers inline (têm de virar `addEventListener`).

**Risco residual mitigado por**: sem `'unsafe-eval'` (um XSS não pode
reconstruir payloads via eval), escape de todo o dado de cliente em `innerHTML`
(A03), e `X-Content-Type-Options`/`X-Frame-Options`.

**Caminho recomendado (faseado, futuro):**
1. Migrar handlers `on*=` inline → `addEventListener` (bom por si só).
2. Extrair os `<script>` inline para ficheiros `/js` com `src` (elimina a
   maioria dos inline).
3. Netlify Edge Function que injecta um nonce por resposta → trocar
   `'unsafe-inline'` por `'nonce-…'` no `script-src`. Só depois de 1–2.

Até lá, `'unsafe-inline'` é um **risco aceite e documentado**, não um descuido.

## `.well-known/security.txt`
✅ Presente e válido: `Contact`, `Canonical`, `Expires` (2027-04-21, não
expirado), `Preferred-Languages`. Rever o `Expires` anualmente.
