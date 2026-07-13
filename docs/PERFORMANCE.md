# NEXO — Performance dos menus (Core Web Vitals mobile)

> Optimização de `menu/marisca-petisca/` e `menu/rest-no-manches-lisboa/`.
> Medido com Lighthouse 12 (mobile, `throttlingMethod: simulate` = Slow-4G +
> 4× CPU). Data: 2026-07-12.

## Metodologia (importante para ler os números)

- **Compressão**: o `python -m http.server` do baseline **não comprime**; o
  Netlify serve `text/*` com brotli/gzip. Para medir como produção, o estado
  final é servido por `tests/perf/gzserve.mjs` (brotli/gzip on-the-fly). Onde
  os números misturam servidores, está assinalado.
- **Ruído**: o modelo *simulado* do Lighthouse é pessimista e variável
  (LCP/FCP oscilam ±2–3 s entre corridas; ocasionalmente devolve `NO_LCP`).
  Por isso o gate de CI (§4) assenta nos **orçamentos de peso (deterministas)**
  e usa a CLS como guarda de regressão, com os timings só como aviso.
- Os ganhos de **imagem** e **peso de bundle** são independentes do servidor e
  da compressão — são a parte mais sólida e reprodutível deste trabalho.

## 1. Antes → Depois

| Métrica | marisca (antes¹) | marisca (depois²) | no-manches (antes¹) | no-manches (depois²) |
|---|---|---|---|---|
| **Imagens iniciais** | **2 693 KB** | **63 KB** | 1 905 KB | ~298 KB |
| Transferência total | 3 556 KB | ~930 KB | 2 778 KB | ~1 680 KB |
| Pedidos de fonts | 3 (Google) | 1 (Google) | 3 (Google) | 1 (Google) + Bebas local |
| FCP | 5.8 s | ~2–3 s | 6.1 s | ~1.7–4 s |
| LCP | 14.5 s | ~3.7–7 s | `NO_LCP` | ~5–6.8 s |
| CLS | 0.03³ | ~0.18 | ~0.8 | ~0.17 |
| TBT | 630 ms | ~300–600 ms | — | ~300 ms |

¹ servidor sem compressão (como o baseline foi medido originalmente).
² servidor com brotli/gzip (≈ Netlify).
³ o 0.03 do baseline foi sorte de temporização — a shift de injecção real era
  ~0.7–0.8, como confirmado depois (ver §3).

**Ganho-chave, independente de metodologia:** a foto do hero do marisca passou
de 1360×1080/211 KB para 900px/64 KB, e ~2.5 MB de fotos de bebidas externas
deixaram de carregar no arranque (lazy-load) → **imagens iniciais −98 %**.

## 2. O que foi feito

### Imagens (o maior ganho)
- **Hero marisca** (`thumb.webp`) redimensionado 1360px→900px: 211 KB → 64 KB.
- **Fotos de vinhos/bebidas** (marisca e no-manches) eram `background-image`
  inline — que **não têm `loading="lazy"` nativo**, por isso ~2.5 MB de fotos
  externas carregavam no arranque e afogavam o hero (LCP). Passaram a
  `data-bg` + `IntersectionObserver` (`observeLazyBackgrounds` em `script.js`),
  carregando só perto do viewport.
- **PNG→WebP no no-manches**: `pattern-ingredientes`, `wordmark`, `logo-mark`,
  `greca-banda` e 12 fotos de `img/bebidas/` — 2.86 MB → 1.12 MB. Referências
  actualizadas em `config.js` e `nexo-nomanches.css`.
- Fotos de item já tinham `loading="lazy"` (mantido).

### Hero (elemento LCP)
- O hero era pintado só quando o `script.js` (224 KB) corria `renderHero()`.
  Agora o `background-image` está **inline no HTML** (`#hero-image`) e há um
  **`<link rel="preload" as="image" fetchpriority="high">`** no `<head>`, para
  o hero pintar no parse do HTML, sem esperar pelo JS.
- No-manches (hero de cor sólida): o LCP é a marca — **`wordmark.webp`
  pré-carregada**.

### Fonts
- As 3 folhas do Google combinadas numa só (menos ligações), `display=swap`.
- **Bebas Neue auto-hospedada** (`menu/rest-no-manches-lisboa/fonts/`) e
  pré-carregada: sendo condensada, o swap tardio a partir de um fallback largo
  remetia o hero de 54px (CLS). Servida da mesma origem, chega antes do paint.
  Bónus: menos uma dependência de 3ª parte.

### JavaScript
- `nexo-premium.js` + `nexo-assisted.js` (~65 KB) passam a **`defer`** — saem
  do caminho crítico de render. `config.js`/`script.js` ficam `defer` também
  (descarregam em paralelo; a ordem de execução é preservada).
- **Não foi feito split do monólito `script.js` (224 KB)** — ver §3/§5.

### CLS (layout shift)
- A causa é **render client-side**: o `script.js` injecta o conteúdo
  (carrossel "mais pedidos", tabs, banner de happy-hour, texto do hero) DEPOIS
  do primeiro paint, empurrando o que já estava visível.
- Reservou-se espaço com `min-height` nos contentores preenchidos por JS:
  `#section-most-ordered`/`.most-ordered-list` e `.hero-content` (ancorado ao
  fundo do hero). Isto **reduziu a CLS de ~0.8 para ~0.17**.

## 3. Onde os alvos NÃO são atingidos (honestidade)

Os critérios pediam **Perf ≥ 90, LCP < 2.5 s, CLS < 0.1**. Não são atingidos de
forma fiável, e a razão é arquitectural, não de afinação:

- **Os menus renderizam 100 % client-side** a partir de um `script.js` de
  224 KB. Em Slow-4G + 4× CPU esse script demora ~1.5 s a executar (TBT) e só
  então injecta o conteúdo → (a) o LCP de conteúdo textual fica preso a essa
  execução; (b) a injecção pós-paint gera CLS residual (~0.17) que as reservas
  de espaço mitigam mas não eliminam (o texto do menu, a barra de pesquisa e as
  tabs de categoria aparecem depois do paint).
- O modelo simulado do Lighthouse é pessimista: o **LCP *observado*** (lab,
  mais perto do real) foi **~3.3 s**, que o modelo simulado mapeia para ~6.7 s.
  Em campo, com cache de fonts/CDN, os números são melhores.

**Para fechar o gap seria preciso** (fora do âmbito "não partir os menus
ativos", exige mudança arquitectural):
1. **Pré-renderizar o above-the-fold em HTML estático** no deploy (o conteúdo
   vem do `CONFIG`, é determinável) → mata a CLS de injecção e o LCP de texto.
2. **Inline do CSS crítico** e carregamento assíncrono do resto de `style.css`.
3. **Split real do `script.js`** (core de render vs. features frias — split
   bill, share canvas, vivino, lightbox) com `import()` dinâmico; precisa de um
   passo de build (hoje o site é estático sem build).

## 4. Gate de CI — orçamento de performance

`.lighthouserc.json` + `tests/perf/budget.json`, corrido por `npm run perf:ci`
(Lighthouse CI). Servido por `tests/perf/gzserve.mjs` (brotli/gzip ≈ Netlify).
Job `lighthouse-budget` em `.github/workflows/nexo-tests.yml`.

- **Orçamentos de peso (ERRO, deterministas)** — o gate forte. Por rota:
  imagem, script, css, fonts e total (KB). Falha se um bundle inchar (ex.:
  alguém volta a carregar as fotos eager, ou adiciona uma biblioteca pesada).
- **CLS ≤ 0.2 (ERRO, guarda de regressão)** — apanha uma regressão para o
  ~0.8 original; passa no ~0.17 actual. (Não é <0.1 — ver §3.)
- **LCP/FCP/TBT (AVISO)** — informativo; o simulado é ruidoso demais para
  bloquear merges sem flakiness.

Correr localmente:
```bash
npm run perf:ci          # serve + 3 corridas/rota + assere orçamentos
npm run perf:serve       # só o servidor comprimido (debug manual)
```

## 5. Próximos passos recomendados (por ROI)
1. Pré-render estático do above-the-fold (hero + tabs + 1.ª secção) → CLS<0.1 e
   LCP real <2.5 s. **Maior ROI.**
2. Split do `script.js` (introduzir build) → baixa o TBT e o LCP de conteúdo.
3. Inline do CSS crítico.
4. `img/bebidas/bebidas_1-02.png` (979 KB) é órfão — pode ser removido.
