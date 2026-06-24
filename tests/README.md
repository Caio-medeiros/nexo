# NEXO test suite

Free / open-source. No paid services. Runs in GitHub Actions on every push/PR to `main`.

## Layout
| Path | What | Infra needed |
|---|---|---|
| `tests/unit/run.mjs` | Unit tests for the real `js/nexo-security.js` (sanitise, validators, rate-limit, safe errors). Plain Node, no deps. Writes `tests/test-report.html`. | none |
| `tests/scan/scan.mjs` | Scans deployed files for unreplaced `{{config}}` values, the phantom slug `rest-nexo-lisboa`, and secret leaks. | none |
| `tests/e2e/*.spec.js` | Playwright E2E. `menu-smoke` + `portal-auth` are **read-only and safe for prod**. `advanced` is gated off (needs staging). | Playwright |

## Run locally
```bash
node tests/unit/run.mjs      # unit  → tests/test-report.html
node tests/scan/scan.mjs     # config scan
npm install                  # for Playwright
npx playwright install chromium
NEXO_TEST_ENV=prod  npx playwright test -c tests/e2e/playwright.config.js menu-smoke.spec.js portal-auth.spec.js
```
`npm test` runs unit + scan (the fast CI gate).

## Environment
- `NEXO_TEST_ENV` — `prod` (default, https://nexosolutions.pt) or `local` (http://localhost:8888 — serve the repo with `python3 -m http.server 8888`).
- `NEXO_TEST_SLUG` — defaults to `marisca-petisca` (the real live menu). **The prompt's `rest-nexo-lisboa` does not exist.**
- `NEXO_TEST_FULL=1` — enables the advanced specs.
- `NEXO_TEST_TOKEN` — a valid table token for the TAT tests.

## Adaptations vs. the original spec
- **`rest-nexo-lisboa` → `marisca-petisca`** everywhere (the phantom slug isn't deployed; the scan even fails the build if it leaks back in — it already caught a stale link on the public `/status/` page).
- **`safeCount()` / `safeSplitBill()` are not tested** — they came from an exception-handling prompt that was **not** implemented, so they don't exist. The unit tests cover the real shipped equivalents in `nexo-security.js` (`validateTableNumber`, `sanitise`, `validateOrderItems`, …).
- **No test writes to the live Supabase.** The prompt's data-sync (insert an order) and RLS tests create rows that would ding the real restaurant's Sala/notifications. They live in `advanced.spec.js`, are gated `OFF`, and must point at a **staging** project. `menu_events` is the only table the safe write-probe touches (on the `/portal/status/` page, not here).
- **Advanced specs depend on un-merged features** (the TAT token system: `nexo-access.js` + migrations 022/023/024). They stay skipped until those are deployed and the cart selectors are confirmed.

## Blocking the Netlify deploy on failure
GitHub Actions can't directly stop Netlify's auto-deploy. Either:
1. **Netlify dashboard → Build & deploy → Required checks**: mark the `NEXO tests` check as required (blocks publish on red), or
2. Turn off Netlify auto-deploy and deploy **from** the workflow after tests pass (`netlify deploy --prod`), using `NETLIFY_AUTH_TOKEN` + `NETLIFY_SITE_ID` repo secrets.

## Note on `package.json`
Added at the repo root for the test tooling only — there is **no build step** (the site is static). If Netlify ever tries to build because a `package.json` is present, set in `netlify.toml`:
```toml
[build]
  command = ""
  publish = "."
```
