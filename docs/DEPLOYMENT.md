# NEXO — Deployment Guide

## Branch strategy

| Branch    | Deploys to                              | Trigger       |
|-----------|-----------------------------------------|---------------|
| `main`    | nexosolutions.pt (production)           | Push (post-CI)|
| `staging` | staging--nexosolutions.netlify.app      | Push (post-CI)|
| PRs       | No deploy — tests only                  | PR opened/updated |

Auto-deploy in Netlify is **disabled**. GitHub Actions (`deploy.yml`) deploys
after all tests pass.

---

## Rollback procedure (< 2 minutes)

### Via Netlify Dashboard (preferred)
1. Open Netlify → **Deploys** tab
2. Find the last working deploy in the list
3. Click **"Publish deploy"**
4. Done — no git needed, instant.

### Via Git (if Netlify rollback fails)
```bash
git revert HEAD
git push origin main
```
CI runs, tests pass, auto-deploys the revert.

---

## Deploy checklist (before pushing to main)

- [ ] Tested on `staging` branch first (`git push origin <branch>:staging`)
- [ ] No console errors in Chrome DevTools on mobile viewport (375px)
- [ ] Menu opens correctly — NFC/QR flow works end-to-end
- [ ] Supabase inserts working (check Network tab — no 401/403)
- [ ] Zero `{{placeholders}}` in changed files (`npm run test:scan`)
- [ ] Portal dashboard loads and auth flow completes
- [ ] All unit tests green (`npm test`)

---

## GitHub Secrets required

Set in: **GitHub repo → Settings → Secrets and variables → Actions**

| Secret                | Where to get it                                          |
|-----------------------|----------------------------------------------------------|
| `NETLIFY_AUTH_TOKEN`  | netlify.com → User settings → Personal access tokens    |
| `NETLIFY_SITE_ID`     | Netlify → Site config → Site details → Site ID          |
| `TELEGRAM_BOT_TOKEN`  | Optional — @BotFather on Telegram                       |
| `TELEGRAM_CHAT_ID`    | Optional — your Telegram chat ID                        |

Telegram notifications are silently skipped if `TELEGRAM_BOT_TOKEN` is not set.

---

## Netlify configuration

- Auto-publish: **OFF** (managed by CI)
- Branch deploys: `staging` branch → staging URL
- Required checks: mark **"NEXO CI/CD"** as required in
  `GitHub → Branch protection rules → main`

To block merges to `main` until CI passes:
`GitHub → Settings → Branches → main → Require status checks → NEXO CI/CD / Run Tests`

---

## Promoting staging to production

Staging is an independent branch, not a preview of a PR.
To promote: merge `staging` into `main` once validated.

```bash
git checkout main
git merge staging
git push origin main
```

CI runs the full test suite again before deploying to production.

---

## Testing locally

```bash
npm test              # unit tests + config scan
npm run test:e2e      # Playwright E2E (needs Chrome)
```

E2E tests run against the live production URL by default.
Set `NEXO_TEST_ENV=staging` to point at the staging URL.
