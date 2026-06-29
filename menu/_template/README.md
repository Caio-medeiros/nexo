# NEXO Menu — Deploy Guide
> Use this folder as the base for every new client menu.
> Follow ALL steps in order. Zero exceptions.

---

## Before you start

You need from the client:
- [ ] Menu content (full dish list with prices)
- [ ] Logo file (PNG or SVG, transparent background)
- [ ] Brand colors (primary + secondary hex codes)
- [ ] Google Maps review link
- [ ] TheFork profile link (if applicable)
- [ ] WhatsApp number for feedback routing
- [ ] Number of tables (for hardware quantity)
- [ ] Confirmation of languages needed (default: PT + EN)

---

## Step 1 — Generate the slug

Use the Slug Generator in NEXO OS → Menus section.

Format: `[tipo]-[nome]-[cidade]`
Example: `rest-solcarioca-lisboa`

Confirm the slug is:
- [ ] Lowercase, no accents, no spaces
- [ ] Not already in use (check NEXO OS → Menus)
- [ ] Registered in NEXO OS before deployment

---

## Step 2 — Duplicate this folder

Copy the entire `_template` folder.
Rename the copy to the client's slug:
`/menu/[slug]/`

Never edit `_template` directly.
Never deploy `_template` — it is not a live menu.

---

## Step 3 — Replace all placeholders

Find and replace these strings in the new folder:

| Placeholder             | Replace with                       |
|-------------------------|------------------------------------|
| `{{ESPACO_SLUG}}`       | e.g. `rest-solcarioca-lisboa`      |
| `{{ESPACO_NOME}}`       | e.g. `Sol Carioca`                 |
| `{{ESPACO_TIPO}}`       | e.g. `rest`                        |
| `{{GA4_MEASUREMENT_ID}}`| NEXO GA4 ID (same for all menus)   |
| `{{ESPACO_WHATSAPP}}`   | WhatsApp do restaurante para pedidos (ex: `351912345678`). Deixar vazio `''` para desativar opção WhatsApp. |
| `{{SUPABASE_URL}}`      | URL do projeto Supabase (ex: `https://xxx.supabase.co`). Necessário para "Chamar Empregado". |
| `{{SUPABASE_ANON_KEY}}` | Chave anon pública do Supabase (Project Settings → API). |

Run a search for `{{` in the folder after replacing.
Zero occurrences = ready to proceed.

---

## Step 4 — Configure config.js

Fill in all 10 blocks following the taxonomy in
`nexo-config-taxonomy.js`.

Rules:
- Category names: use NEXO_TAXONOMY.categories only
- Item fields: use NEXO_TAXONOMY.itemFields only
- Tags: use NEXO_TAXONOMY.tags only
- Allergens: use NEXO_TAXONOMY.allergens only
- Block order: 1 through 10, never change

---

## Step 5 — Add client assets

Replace in /menu/[slug]/assets/:
- `logo.png` — client logo
- `hero.jpg` — hero/background image (optional)
- `og-image.jpg` — 1200×630px social share image

---

## Step 6 — Deploy to Netlify

Push the new folder to the repository.
Netlify auto-deploys on push.

Confirm deploy succeeded in Netlify dashboard.
Live URL: `https://nexosolutions.pt/menu/[slug]/`

---

## Step 7 — Test before delivering

Open the live URL on:
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Desktop browser

Check:
- [ ] Menu loads correctly
- [ ] All categories visible
- [ ] Images loading
- [ ] Prices correct
- [ ] Languages switching
- [ ] Review gate working (test tap on rating)
- [ ] GA4 receiving events (check GA4 Realtime view)
- [ ] "Chamar" button visible (only if `features.callStaff: true` and Supabase configured)
- [ ] Staff call sheet opens, sends, and closes correctly
- [ ] 30s cooldown prevents double-tap spam

### ntfy — staff alerts (REQUIRED for live venues)

The `callStaffTopic` in `config.js` powers **two** push alerts to the staff's phone:

1. **"Chamada de Mesa"** — customer tapped *Chamar Empregado*.
2. **"Mesa precisa de ajuda"** — an order failed to send and the customer is
   waiting (fired from the error modal's *Mostrar ao Staff* button — see FIX 4C).

**The operator MUST, on at least one staff phone:**

1. Install the free **ntfy** app (iOS App Store / Google Play).
2. Open it → **Subscribe to topic**.
3. Server: keep the default **ntfy.sh** (public — do *not* pick "Use another server").
4. Topic: paste the exact `callStaffTopic` value (e.g. `nexo-marisca-petisca-staff`).
5. Send a test from the menu's *Chamar Empregado* button and confirm the push arrives.

> The same alerts also surface in the NEXO portal **Sala** in real time
> (the table shows as "a chamar"), so the staff sees them even without the app.

---

## Step 8 — Register in NEXO OS

In NEXO OS → Clientes → [Espaço] → tab Menus:
- [ ] Add menu with slug and URL
- [ ] Set status to "Em Setup"
- [ ] Change to "Live" only after client approves

---

## Step 9 — Client approval

Send the live URL to the client via WhatsApp:
"Olá [Nome]! O menu está pronto para revisão.
Pode confirmar aqui: nexosolutions.pt/menu/[slug]/
Diga-nos se quer alguma alteração antes de activarmos. 👌"

- [ ] Client confirms approval
- [ ] Mark "Live" in NEXO OS
- [ ] Mark "Menu aprovado pelo cliente" in Onboarding

---

## Step 10 — Programme NFC chips

Use NFC Tools app.
Write URL: `https://nexosolutions.pt/menu/[slug]/`
Programme one chip per table + 1 spare.

- [ ] Test each chip with iPhone and Android
- [ ] Update hardware stock in NEXO OS

---

## Taxonomy reference

All naming conventions: `nexo-config-taxonomy.js`
All operational processes: NEXO OS → Playbook
Slug generator: NEXO OS → Menus
