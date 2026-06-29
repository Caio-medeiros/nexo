# SEO Full Audit (Re-run) — NEXO Landing Page

- **Target:** `/Users/caiomedeiros/DEV/nexov1/index.html`
- **Canonical / live URL:** https://nexosolutions.pt/
- **Audit date:** 2026-06-29 (post-fix re-run)
- **Method:** LLM-first + bundled scripts (parse_html, validate_schema, readability, social_meta, llms_txt_checker) against the local source and live domain.

> ⚠️ **Deploy gap:** All fixes below are committed to the **local source** (`index.html`, `llms.txt`, new images). The **live production site has not been redeployed**, so live-domain scripts (`social_meta`, `llms_txt_checker`) still report the *old* state (`hero.png`, llms.txt 25/100). The scores here reflect the corrected source. Re-run live checks after deploy to confirm.

## Overall Score: 88 / 100 — *Good* (was 69)

| Category | Weight | Before | Now | Change |
|---|---|---|---|---|
| Technical SEO | 25% | 85 | 90 | Head scripts deferred |
| Content Quality | 20% | 78 | 78 | — |
| On-Page SEO | 15% | 85 | 92 | Meta description 88→152 chars |
| Schema / Structured Data | 15% | 40 | 92 | FAQPage → Organization+WebSite+Product/Offer |
| Performance (CWV) | 10% | 45 | 82 | LCP image 2.3 MB → 76 KB |
| Image Optimization | 10% | 60 | 95 | LCP WebP + optimized OG card |
| AI Search Readiness (GEO) | 5% | 55 | 85 | llms.txt rebuilt + links fixed |

---

## ✅ Resolved since last audit

1. **FAQPage schema removed.** Replaced with a valid `@graph`: `Organization` + `WebSite` + `Product` with two `Offer`s (Eventos €149, Growth €89/mo). Prices match the visible pricing table (`index.html` #planos). No more restricted-type or content-mismatch risk. *(JSON-LD parses cleanly.)*
2. **LCP image: 2,352 KB → 76 KB.** `demo-preview.png` → `demo-preview.webp` (720×1561, q80), still `fetchpriority="high"`. Largest above-the-fold paint is now lightweight.
3. **OG/Twitter share image fixed.** New dedicated **1200×630** branded card `img/og-card.jpg` (72 KB), correct ratio, with `og:image:type` + `image:alt`. Replaces the 1.9 MB portrait `hero.png`.
4. **llms.txt rebuilt.** Correct `/privacidade/` & `/termos/` links (old `.html` paths 404'd), a `>` blockquote summary, and `## Main pages / Pricing / Legal / Contact` sections with real links.
5. **Render-blocking scripts deferred.** `nexo-analytics.js` and `nexo-cookies.js` now `defer`.
6. **Meta description** extended to 152 chars (ideal range), reusing the stronger "sem app, sem instalação" copy.

## ✅ Still strong (unchanged)

- Single, well-formed **H1**; clean H1→H2→H3 hierarchy across 7 sections.
- **Title** ~33 chars, on-brand.
- Canonical, viewport, `lang="pt-PT"`, theme-color all correct.
- **All 4 images have descriptive `alt` + explicit `width`/`height`** (no CLS); below-fold images lazy-loaded.
- robots.txt + sitemap.xml valid; HTTPS/HTTP2 with strict CSP + `nosniff`.
- Original, benefit-led PT copy with cited third-party stats (E-E-A-T).

---

## ⚠️ Remaining (not code-fixable / lower priority)

| # | Item | Confidence | Note |
|---|---|---|---|
| 1 | **Deploy the changes** | Confirmed | Live site still serves old assets/meta/llms.txt. Highest-priority next step. |
| 2 | **Confirm Core Web Vitals on field/lab** | Hypothesis | PageSpeed API was rate-limited. After the 2.3 MB→76 KB LCP swap, LCP should pass, but verify with a PSI key / Lighthouse post-deploy. |
| 3 | **Organization trust signals** | Info | No `sameAs` (social profiles), no aggregated reviews/testimonials. Adding these would lift Content/E-E-A-T further. |
| 4 | **Readability flag is a false positive** | Info | `readability.py` Flesch 32.7 is English-tuned; copy is Portuguese marketing — not actionable. |
| 5 | **AI-crawler robots rules** | Info | `Allow: /` is intentional and correct for GEO — no action. |
| 6 | **`validate_schema.py` "Missing @type"** | False positive | Script doesn't recognize `@graph` (Google's recommended multi-entity container). Markup is valid. |

---

## Why not 100?
The source is in excellent shape, but a perfect score isn't claimable from static analysis: **CWV can't be field-verified** until deploy (perf stays partly hypothesis), and **off-page E-E-A-T signals** (real reviews, `sameAs`, backlinks) are inherently outside a single HTML file. The structural/technical/on-page/schema/image work is effectively maxed for this page.
