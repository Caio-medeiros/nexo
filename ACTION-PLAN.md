# SEO Action Plan (Re-run) — NEXO Landing Page

Source audit: `FULL-AUDIT-REPORT.md` (2026-06-29, post-fix). Score **88/100 (Good)**, up from 69.
All previous 🔴 critical items are **resolved in source**. Remaining work is deploy + verification + optional polish.

## 🔴 Do now

1. **Deploy the changes to production.** Live `nexosolutions.pt` still serves the old `hero.png` OG image, old llms.txt, and unoptimized LCP PNG. None of the fixes are live until deploy. *(Files changed: `index.html`, `llms.txt`, new `img/og-card.jpg`, `img/demo-preview.webp`.)*

## 🟠 Verify after deploy

2. **Re-run live checks** to confirm:
   - `social_meta.py https://nexosolutions.pt/` → should show `og-card.jpg`.
   - `llms_txt_checker.py https://nexosolutions.pt/` → should jump from 25 → ~85.
   - Facebook Sharing Debugger / X Card Validator → confirm the 1200×630 card renders.
3. **Confirm Core Web Vitals** — run PageSpeed Insights (with API key) or Lighthouse on the live URL. Verify LCP < 2.5 s, INP < 200 ms, CLS < 0.1 now that the hero image is 76 KB.
4. **Rich Results Test** — paste the live URL into Google's Rich Results Test to confirm `Organization` + `Product` parse and the offers show.

## 🟡 Optional polish (lifts E-E-A-T / GEO further)

5. **Add `sameAs` to the Organization schema** — Instagram / LinkedIn / Google Business Profile URLs once available.
6. **Add real social proof** — a testimonial or client logo strip (you already have the Marisca Petisca production install to reference).
7. **Consider `twitter:site`/`twitter:creator`** if a brand X handle exists (currently flagged optional/missing).

---

### Files changed in this round
| File | Change |
|---|---|
| `index.html` | meta description, OG/Twitter image, `defer` scripts, LCP `.webp`, schema swap |
| `llms.txt` | rebuilt with blockquote + sections + corrected links |
| `img/og-card.jpg` | new — 1200×630 share card (72 KB) |
| `img/demo-preview.webp` | new — optimized LCP image (76 KB, from 2.3 MB PNG) |

### Outcome
Source is at **88/100**. Remaining headroom (perf field-verification + off-page E-E-A-T) requires deploy + live data, not further code edits.
