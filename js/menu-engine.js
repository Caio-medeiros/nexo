/* ═══════════════════════════════════════════════════════════════════════════
   NEXO MENU ENGINE — núcleo partilhado (i18n, helpers, render, carrinho, modal)
   Unidades top-level BYTE-IDÊNTICAS nos três menus (marisca/no-manches/template),
   extraídas verbatim. Carregado ANTES de script.js. A customização por menu
   continua em config.js e no restante de cada script.js. Gerado — não editar
   à mão para um só menu.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
   NEXO MENU — Script v5
   Novidades desta versão:
     • Category tabs — underline deslizante (.tab-ink animado via JS)
     • Banner tempo-dependente — Happy Hour 17-19h, Almoço 12-15h, Jantar 19-23h
     • Badges psicológicos — 🔥 Popular · ⭐ Chef · 🆕 Novo
     • Upsell no modal — "Combina com..." secção scrollável
     • Back to top — botão flutuante após 400px scroll
     • Tap feedback tátil — bounce + navigator.vibrate(8)
   ═══════════════════════════════════════════════════════════════════════════ */



/* ═══════════════════════════════════════════════════════════════════════════
   1. i18n CONSTANTES
   ═══════════════════════════════════════════════════════════════════════════ */


function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


const ALLERGENS_EU = {
  pt: { 1:"Glúten",2:"Crustáceos",3:"Ovos",4:"Peixe",5:"Amendoins",6:"Soja",7:"Lácteos",8:"Frutos de casca",9:"Aipo",10:"Mostarda",11:"Sésamo",12:"Sulfitos",13:"Tremoço",14:"Moluscos" },
  en: { 1:"Gluten",2:"Crustaceans",3:"Eggs",4:"Fish",5:"Peanuts",6:"Soy",7:"Dairy",8:"Nuts",9:"Celery",10:"Mustard",11:"Sesame",12:"Sulphites",13:"Lupin",14:"Molluscs" },
  es: { 1:"Gluten",2:"Crustáceos",3:"Huevos",4:"Pescado",5:"Cacahuetes",6:"Soja",7:"Lácteos",8:"Frutos cáscara",9:"Apio",10:"Mostaza",11:"Sésamo",12:"Sulfitos",13:"Altramuz",14:"Moluscos" },
  fr: { 1:"Gluten",2:"Crustacés",3:"Œufs",4:"Poisson",5:"Arachides",6:"Soja",7:"Laitiers",8:"Fruits à coque",9:"Céleri",10:"Moutarde",11:"Sésame",12:"Sulfites",13:"Lupin",14:"Mollusques" }
};


const DIET_LABELS = {
  pt: { V:"Vegetariano", VG:"Vegan", GF:"Sem glúten", LF:"Sem lactose" },
  en: { V:"Vegetarian", VG:"Vegan", GF:"Gluten-free", LF:"Lactose-free" },
  es: { V:"Vegetariano", VG:"Vegano", GF:"Sin gluten", LF:"Sin lactosa" },
  fr: { V:"Végétarien", VG:"Végan", GF:"Sans gluten", LF:"Sans lactose" }
};


const ITEM_BADGES = {
  popular: { emoji: "🔥", pt: "Popular",        en: "Popular",       es: "Popular",         fr: "Populaire"     },
  chef:    { emoji: "⭐", pt: "Escolha do Chef", en: "Chef's Choice", es: "Elección del Chef", fr: "Choix du Chef" },
  new:     { emoji: "🆕", pt: "Novo",            en: "New",           es: "Nuevo",            fr: "Nouveau"       }
};


/* ═══════════════════════════════════════════════════════════════════════════
   2. STATE
   ═══════════════════════════════════════════════════════════════════════════ */


function saveFavorites() {
  try { sessionStorage.setItem('nexo_favs', JSON.stringify([...favorites])); } catch(e) {}
}


/* ═══════════════════════════════════════════════════════════════════════════
   ANALYTICS — Google Analytics 4
   Measurement ID configurado em config.js (ga4MeasurementId).
   Deixar vazio para desactivar completamente.
   ═══════════════════════════════════════════════════════════════════════════ */


function initAnalytics() {
  const id = CONFIG.ga4MeasurementId;
  if (!id) return;

  // Skip script injection if GA4 already loaded via HTML head
  if (window.dataLayer && document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    return;
  }

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function() { window.dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', id, { send_page_view: false });
}


function track(event, params) {
  const enriched = {
    espaco_slug: (typeof ESPACO_SLUG !== 'undefined' ? ESPACO_SLUG : null) || CONFIG.slug,
    lang: currentLang,
    ...(params || {}),
  };
  if (typeof window.nexoTrack === 'function') {
    window.nexoTrack(event, enriched);
  } else if (typeof window.gtag === 'function') {
    window.gtag('event', event, { ...enriched, nexo_version: '1.0' });
  }
}


const PERSON_NAMES = {
  pt: ['Pessoa 1','Pessoa 2','Pessoa 3','Pessoa 4','Pessoa 5','Pessoa 6','Pessoa 7','Pessoa 8','Pessoa 9','Pessoa 10'],
  en: ['Person 1','Person 2','Person 3','Person 4','Person 5','Person 6','Person 7','Person 8','Person 9','Person 10'],
  es: ['Persona 1','Persona 2','Persona 3','Persona 4','Persona 5','Persona 6','Persona 7','Persona 8','Persona 9','Persona 10'],
  fr: ['Personne 1','Personne 2','Personne 3','Personne 4','Personne 5','Personne 6','Personne 7','Personne 8','Personne 9','Personne 10']
};


/* ═══════════════════════════════════════════════════════════════════════════
   3. INIT helpers
   ═══════════════════════════════════════════════════════════════════════════ */


function shadeColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}


function applyBrandColors() {
  if (!CONFIG.brandColor) return;
  const base = CONFIG.brandColor;
  document.documentElement.style.setProperty('--accent', base);
  // Auto-derive dark/bright variants — client only needs to set brandColor
  const dark = CONFIG.brandColorDark || shadeColor(base, -40);
  const bright = shadeColor(base, 20);
  document.documentElement.style.setProperty('--accent-dark', dark);
  document.documentElement.style.setProperty('--accent-bright', bright);
}


function detectInitialLanguage() {
  const SUPPORTED = ['pt', 'en', 'es', 'fr'];
  const STORAGE_KEY = 'nexo_lang_' + CONFIG.slug;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && SUPPORTED.includes(saved)) return { lang: saved, auto: false };

  const browserLang = (navigator.language || 'pt').slice(0, 2).toLowerCase();
  const detected = SUPPORTED.includes(browserLang) ? browserLang : 'pt';
  return { lang: detected, auto: true };
}


function detectLang() {
  const { lang, auto } = detectInitialLanguage();
  currentLang = lang;
  _langAutoDetected = auto;

  document.querySelectorAll('.lang-toggle button').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === currentLang);
  });
}


function haptic() {
  if (navigator.vibrate) navigator.vibrate(8);
}



/* ═══════════════════════════════════════════════════════════════════════════
   4. RENDER — HERO
   ═══════════════════════════════════════════════════════════════════════════ */


function renderHero() {
  const heroImage = document.getElementById('hero-image');
  if (CONFIG.heroImageUrl) {
    heroImage.style.backgroundImage = `url('${CONFIG.heroImageUrl}')`;
  }

  const logoEl = document.getElementById('hero-logo');
  if (CONFIG.logoUrl) {
    logoEl.innerHTML = `<img src="${CONFIG.logoUrl}" alt="${CONFIG.name}" loading="eager">`;
  } else {
    const initials = CONFIG.name
      .split(' ').filter(w => w.length > 1).slice(0, 2)
      .map(w => w[0]).join('').toUpperCase();
    logoEl.textContent = initials || CONFIG.name[0].toUpperCase();
  }

  const stampEl = document.getElementById('hero-stamp');
  if (stampEl && CONFIG.heroStamp && CONFIG.heroStamp[currentLang]) {
    stampEl.textContent = CONFIG.heroStamp[currentLang];
    stampEl.style.display = 'inline-block';
  } else if (stampEl) {
    stampEl.style.display = 'none';
  }

  const tableBadge = document.getElementById('table-badge');
  if (tableNumber) {
    tableBadge.textContent = `${t().tableHint} ${tableNumber}`;
    tableBadge.classList.add('show');
  }

  document.getElementById('html-root').lang = currentLang;
  document.getElementById('hero-name').textContent = CONFIG.name;
  document.getElementById('hero-tagline').textContent = CONFIG.tagline[currentLang];
  document.getElementById('hero-city').textContent = CONFIG.city;
  document.getElementById('hero-hours-today').textContent = CONFIG.hoursToday[currentLang];

  // Info pills (rating / preço) — reusáveis por qualquer restaurante.
  // Guardados: escondem-se sozinhos quando o config não traz o dado ou o
  // markup não existe (menus antigos ficam intactos).
  const ratingEl = document.getElementById('hero-rating');
  if (ratingEl) {
    if (CONFIG.googleRating != null && CONFIG.googleRating !== '') {
      const sep = currentLang === 'en' ? '.' : ',';
      document.getElementById('hero-rating-val').textContent =
        Number(CONFIG.googleRating).toFixed(1).replace('.', sep);
      const cntEl = document.getElementById('hero-rating-count');
      if (CONFIG.googleReviewCount) {
        cntEl.textContent = `(${CONFIG.googleReviewCount})`;
        cntEl.hidden = false;
      } else {
        cntEl.hidden = true;
      }
      ratingEl.hidden = false;
    } else {
      ratingEl.hidden = true;
    }
  }
  const priceEl = document.getElementById('hero-price');
  if (priceEl) {
    const pr = CONFIG.priceRange
      ? (typeof CONFIG.priceRange === 'string'
          ? CONFIG.priceRange
          : CONFIG.priceRange[currentLang])
      : '';
    if (pr) {
      priceEl.textContent = pr;
      priceEl.hidden = false;
    } else {
      priceEl.hidden = true;
    }
  }

  document.title = `${CONFIG.name} — Menu`;
}



/* ═══════════════════════════════════════════════════════════════════════════
   5. RENDER — QUICK NAV
   ═══════════════════════════════════════════════════════════════════════════ */


function renderQuickNav() {
  const nav = document.getElementById('quick-nav');

  const hasSupabase = CONFIG.supabaseUrl && CONFIG.supabaseAnonKey
    && CONFIG.supabaseUrl !== '{{SUPABASE_URL}}'
    && CONFIG.supabaseAnonKey !== '{{SUPABASE_ANON_KEY}}'
    && CONFIG.features?.sharedCart !== false;

  const buttons = [
    {
      label: t().navReview, target: 'review-modal', isReview: true,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
    },
    {
      label: t().navMenu, target: 'menu',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`
    },
    {
      label: t().navWines, target: 'section-wines',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2h8l-1 11a3 3 0 01-6 0L8 2z"/><line x1="12" y1="13" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>`
    },
    {
      label: t().navWifi, target: 'wifi-card',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0114 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`
    },
    ...(hasSupabase ? [{
      label: t().navMesa, target: null, isMesa: true,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
    }] : []),
    {
      label: t().navContact, target: 'loyalty-card',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>`
    },
  ];

  nav.innerHTML = buttons.map(b => {
    const classes = ['quick-nav-btn'];
    if (b.isReview) classes.push('quick-nav-review');
    if (b.isMesa) classes.push('quick-nav-mesa');
    return `<button class="${classes.join(' ')}" data-target="${b.target || ''}">${b.icon}<span>${b.label}</span></button>`;
  }).join('');
}


function renderSearchBar() {
  const input = document.getElementById('menu-search-input');
  const meta = document.getElementById('menu-search-meta');
  const search = document.querySelector('.menu-search');
  if (!input || !meta || !search) return;

  input.placeholder = t().searchPlaceholder;
  input.value = currentQuery;
  search.classList.toggle('has-value', !!currentQuery.trim());
  if (!currentQuery.trim()) meta.textContent = '';
}



/* ═══════════════════════════════════════════════════════════════════════════
   6. RENDER — BANNER TEMPO-DEPENDENTE (v5)
   Lê CONFIG.timeBanners e mostra o banner activo pela hora actual.
   Fora de qualquer janela horária → banner oculto.
   ═══════════════════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════════════════
   7. RENDER — MAIS PEDIDOS
   ═══════════════════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════════════════
   8. RENDER — CATEGORY TABS + DIET FILTER
   ═══════════════════════════════════════════════════════════════════════════ */


function renderCategoryTabs() {
  const tabsEl = document.getElementById('category-tabs');
  // Preservar o ink element (já está no HTML)
  const ink = document.getElementById('tab-ink');

  const tabsHtml = CONFIG.menu.map((sec, i) =>
    `<button class="category-tab ${i === 0 ? 'active' : ''}" data-category="${sec.id}">${sec.section[currentLang]}</button>`
  ).join('');

  // Reinsertar tabs mantendo o ink no DOM
  tabsEl.innerHTML = tabsHtml;
  tabsEl.appendChild(ink);

  // Posicionar ink no tab activo após render
  requestAnimationFrame(() => {
    const activeTab = tabsEl.querySelector('.category-tab.active');
    positionTabInk(activeTab, false); // sem transição na primeira vez
  });
}


function renderDietFilter() {
  const d = DIET_LABELS[currentLang];
  const options = [
    { key: 'all', label: t().all },
    { key: 'V', label: d.V },
    { key: 'VG', label: d.VG },
    { key: 'GF', label: d.GF },
    { key: 'LF', label: d.LF }
  ];
  document.getElementById('diet-filter').innerHTML = options.map(o =>
    `<button class="diet-chip ${currentFilter === o.key ? 'active' : ''}" data-filter="${o.key}">${o.label}</button>`
  ).join('');
}


function renderAllergenFilter() {
  const badgeEl = document.getElementById('allergen-legend-badge');
  const legendBtn = document.getElementById('allergen-legend-btn');
  const count = activeAllergenExcludes.size;
  if (badgeEl) {
    badgeEl.textContent = count;
    badgeEl.style.display = count > 0 ? 'inline-flex' : 'none';
  }
  if (legendBtn) legendBtn.classList.toggle('has-active', count > 0);
}



/* ═══════════════════════════════════════════════════════════════════════════
   TAB INK — deslizante (v5)
   Posiciona o underline animado em cima do tab activo
   ═══════════════════════════════════════════════════════════════════════════ */


function positionTabInk(activeTab, animate = true) {
  const ink = document.getElementById('tab-ink');
  if (!ink || !activeTab) return;

  if (!animate) {
    ink.style.transition = 'none';
  } else {
    ink.style.transition = '';
  }

  // Padding horizontal do tab é var(--s2) = 12px
  const tabPad = 12;
  ink.style.width = (activeTab.offsetWidth - tabPad * 2) + 'px';
  ink.style.left  = (activeTab.offsetLeft + tabPad) + 'px';

  // Scroll do tab para ficar visível
  activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
}



/* ═══════════════════════════════════════════════════════════════════════════
   9. RENDER — MENU (com badges psicológicos — v5)
   ═══════════════════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════════════════
   10. RENDER — WINES
   ═══════════════════════════════════════════════════════════════════════════ */


function renderWineFilters() {
  if (!CONFIG.wines || CONFIG.wines.length === 0) {
    document.getElementById('section-wines').style.display = 'none';
    return;
  }

  document.getElementById('wine-section-title').textContent = t().wines;
  document.getElementById('wine-section-badge').textContent = t().winesBadge;
  document.getElementById('wine-filter-country-label').textContent = t().wineFilterCountry;
  document.getElementById('wine-filter-type-label').textContent = t().wineFilterType;
  document.getElementById('wine-filter-grape-label').textContent = t().wineFilterGrape;

  const countries = ['all', ...new Set(CONFIG.wines.map(w => w.country))];
  const types = ['all', ...new Set(CONFIG.wines.map(w => w.type))];

  const allGrapes = new Set();
  CONFIG.wines.forEach(w => {
    w.grape.split(',').forEach(g => { const trimmed = g.trim(); if (trimmed && trimmed !== '—') allGrapes.add(trimmed); });
  });
  const grapes = ['all', ...Array.from(allGrapes).slice(0, 10)];

  document.getElementById('wine-filter-country').innerHTML = countries.map(c =>
    `<button class="wine-chip ${wineFilters.country === c ? 'active' : ''}" data-filter-type="country" data-filter-value="${c}">${c === 'all' ? t().all : c}</button>`
  ).join('');

  document.getElementById('wine-filter-type').innerHTML = types.map(ty => {
    const label = ty === 'all' ? t().all : (WINE_TYPE_LABELS[currentLang][ty] || ty);
    return `<button class="wine-chip ${wineFilters.type === ty ? 'active' : ''}" data-filter-type="type" data-filter-value="${ty}">${label}</button>`;
  }).join('');

  document.getElementById('wine-filter-grape').innerHTML = grapes.map(g =>
    `<button class="wine-chip ${wineFilters.grape === g ? 'active' : ''}" data-filter-type="grape" data-filter-value="${g}">${g === 'all' ? t().all : g}</button>`
  ).join('');
}


function renderVivinoStars(rating) {
  const full = Math.floor(rating);
  const partial = rating - full; // 0.0–0.9
  const empty = 5 - full - (partial > 0 ? 1 : 0);
  let html = '';
  // Full stars
  for (let i = 0; i < full; i++) {
    html += `<svg class="vs" viewBox="0 0 20 20"><polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7" fill="currentColor"/></svg>`;
  }
  // Partial star (clip by percentage)
  if (partial > 0) {
    const pct = Math.round(partial * 100);
    const id = `vp${Math.random().toString(36).slice(2,7)}`;
    html += `<svg class="vs" viewBox="0 0 20 20">
      <defs><clipPath id="${id}"><rect x="0" y="0" width="${pct}%" height="20"/></clipPath></defs>
      <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7" fill="#E0D5C8"/>
      <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7" fill="currentColor" clip-path="url(#${id})"/>
    </svg>`;
  }
  // Empty stars
  for (let i = 0; i < empty; i++) {
    html += `<svg class="vs" viewBox="0 0 20 20"><polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7" fill="#E0D5C8"/></svg>`;
  }
  return html;
}


function wineOrderControlsHtml(realIdx, w) {
  if (parsePriceToNumber(w.price) === null) return '';
  const refId = `bebidas:${realIdx}`;
  const inCart = getCartQty(refId);
  return `
          <div class="menu-item-order-controls wine-order-controls ${inCart > 0 ? 'has-qty' : ''}" data-order-controls="${refId}">
            <button class="menu-item-step-btn menu-item-step-btn-minus ${inCart > 0 ? 'show' : ''}" data-decrement-ref="${refId}" aria-label="${t().reduceQty}" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <button class="menu-item-add-btn ${inCart > 0 ? 'added' : ''}" data-add-ref="${refId}" aria-label="${t().increaseQty}" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              ${inCart > 0 ? `<span class="qty-badge">${inCart}</span>` : ''}
            </button>
          </div>`;
}


/* ═══════════════════════════════════════════════════════════════════════════
   11. RENDER — WI-FI, LOYALTY, ACTIONS, FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */


function renderWifi() {
  document.getElementById('wifi-label').textContent = `${t().wifi} · ${CONFIG.wifiSsid}`;
  document.getElementById('wifi-pass').textContent = CONFIG.wifiPassword;
  document.getElementById('wifi-hint').textContent = t().copy;
}


function renderLoyalty() {
  document.getElementById('loyalty-title').textContent = t().loyalty;
  document.getElementById('loyalty-sub').textContent = t().loyaltySub;
  document.getElementById('loyalty-btn').textContent = t().loyaltyCta;
}


function renderFooter() {
  document.getElementById('footer-addr-label').textContent = t().address;
  document.getElementById('footer-address').textContent = CONFIG.address;
  document.getElementById('footer-phone-label').textContent = t().phone;
  const phoneLink = document.getElementById('footer-phone');
  phoneLink.textContent = CONFIG.phoneDisplay;
  phoneLink.href = `tel:${CONFIG.phone.replace(/\s/g, '')}`;
  document.getElementById('footer-hours-label').textContent = t().hours;
  document.getElementById('footer-hours').textContent = CONFIG.hours[currentLang];
  document.getElementById('share-label').textContent = t().share;
}


function renderReviewModal() {
  // Step 1 static text
  const s1title = document.getElementById('review-step1-title');
  const s1sub = document.getElementById('review-step1-sub');
  if (s1title) s1title.textContent = t().ratingStep1Title;
  if (s1sub) s1sub.textContent = t().ratingStep1Sub;

  // Happy step
  const happyTitle = document.getElementById('review-happy-title');
  const happySub = document.getElementById('review-happy-sub');
  if (happyTitle) happyTitle.textContent = t().ratingHappyTitle;
  if (happySub) happySub.textContent = t().ratingHappySub;

  // Unhappy step
  const unhappyTitle = document.getElementById('review-unhappy-title');
  const unhappySub = document.getElementById('review-unhappy-sub');
  const textarea = document.getElementById('review-textarea');
  const sendLabel = document.getElementById('review-send-label');
  const privateNote = document.getElementById('review-private-note');
  if (unhappyTitle) unhappyTitle.textContent = t().ratingUnhappyTitle;
  if (unhappySub) unhappySub.textContent = t().ratingUnhappySub;
  if (textarea) textarea.placeholder = t().ratingTextareaPlaceholder;
  if (sendLabel) sendLabel.textContent = t().ratingSendLabel;
  if (privateNote) privateNote.textContent = t().ratingPrivateNote;

  // Platform links
  const googleLink = document.getElementById('review-google');
  const theforkLink = document.getElementById('review-thefork');
  if (googleLink) googleLink.href = CONFIG.googleReviewUrl;
  if (theforkLink) theforkLink.href = CONFIG.theForkReviewUrl;
  const googleSub = document.getElementById('review-google-sub');
  const theforkSub = document.getElementById('review-thefork-sub');
  if (googleSub) googleSub.textContent = t().googleSub;
  if (theforkSub) theforkSub.textContent = t().theforkSub;
}


function showReviewStep(el) {
  if (!el) return;
  el.style.display = 'block';
  el.classList.remove('review-step-enter');
  void el.offsetWidth;
  el.classList.add('review-step-enter');
}

function hideReviewStep(el) {
  if (!el) return;
  el.style.display = 'none';
  el.classList.remove('review-step-enter');
}


function renderAll() {
  renderHero();
  renderQuickNav();
  renderSpecialBanner();
  renderMostOrdered();
  renderCategoryTabs();
  renderSearchBar();
  renderDietFilter();
  renderAllergenFilter();
  renderMenu();
  renderWineFilters();
  renderWineList();
  renderWifi();
  renderLoyalty();
  renderActions();
  renderFooter();
  renderReviewModal();
  if (window._attachMenuObserver) window._attachMenuObserver();
  // Cart UI usa textos i18n — re-render quando idioma muda
  if (typeof renderCartPill === 'function') renderCartPill();
  if (typeof renderCartSheet === 'function') renderCartSheet();
  if (typeof renderFavorites === 'function') renderFavorites();
  if (typeof setupCountdown === 'function') setupCountdown();
}



/* ═══════════════════════════════════════════════════════════════════════════
   12. INTERAÇÕES
   ═══════════════════════════════════════════════════════════════════════════ */


function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 1800);
}


function openModal(id) {
  document.getElementById(id).classList.add('show');
  document.body.style.overflow = 'hidden';
}


function closeModal(id) {
  document.getElementById(id).classList.remove('show');
  document.body.style.overflow = '';
}


function scrollToTarget(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const offset = 80;
  const y = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: y, behavior: 'smooth' });
}


function setupLanguage() {
  document.querySelectorAll('.lang-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-toggle button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const from = currentLang;
      currentLang = btn.dataset.lang;
      localStorage.setItem('nexo_lang_' + CONFIG.slug, currentLang);
      track('language_changed', { from_language: from, to_language: currentLang });
      renderAll();
    });
  });
}


function showLangPrompt() {
  if (!_langAutoDetected || currentLang === 'pt') return;

  track('language_autodetected', { espaco_slug: CONFIG.slug, detected_language: currentLang });

  const style = document.createElement('style');
  style.textContent = '#nexo-lang-prompt{position:fixed;top:16px;left:50%;'
    + 'transform:translateX(-50%) translateY(-140%);'
    + 'background:rgba(20,20,20,0.92);'
    + 'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);'
    + 'border:1px solid rgba(255,255,255,0.12);border-radius:999px;'
    + 'padding:8px 14px;font-size:13px;color:#fff;line-height:1;'
    + 'display:flex;align-items:center;gap:8px;'
    + 'z-index:99999;white-space:nowrap;'
    + 'transition:transform 300ms cubic-bezier(0.34,1.56,0.64,1);}'
    + '#nexo-lang-prompt.visible{transform:translateX(-50%) translateY(0);}'
    + '#nexo-lang-sim{background:rgba(255,255,255,0.18);border:none;border-radius:999px;'
    + 'color:#fff;font-size:12px;padding:4px 10px;cursor:pointer;font-weight:600;}'
    + '#nexo-lang-dismiss{background:none;border:none;color:rgba(255,255,255,0.6);'
    + 'font-size:14px;cursor:pointer;padding:0 2px;line-height:1;}';
  document.head.appendChild(style);

  const pill = document.createElement('div');
  pill.id = 'nexo-lang-prompt';
  pill.innerHTML = '<span>\uD83C\uDDF5\uD83C\uDDF9 Prefere portugu\u00eas?</span>'
    + '<button id="nexo-lang-sim">Sim</button>'
    + '<button id="nexo-lang-dismiss" aria-label="Fechar">\u2715</button>';
  document.body.appendChild(pill);

  let autoDismissTimer;
  const showTimer = setTimeout(() => {
    pill.classList.add('visible');
    autoDismissTimer = setTimeout(() => dismiss(null), 6000);
  }, 1000);

  function dismiss(saveLang) {
    clearTimeout(showTimer);
    clearTimeout(autoDismissTimer);
    pill.classList.remove('visible');
    setTimeout(() => pill.remove(), 350);
    if (saveLang !== null) localStorage.setItem('nexo_lang_' + CONFIG.slug, saveLang);
  }

  document.getElementById('nexo-lang-sim').addEventListener('click', () => {
    currentLang = 'pt';
    localStorage.setItem('nexo_lang_' + CONFIG.slug, 'pt');
    document.querySelectorAll('.lang-toggle button').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === 'pt');
    });
    renderAll();
    dismiss(null);
  });

  document.getElementById('nexo-lang-dismiss').addEventListener('click', () => {
    dismiss(currentLang);
  });
}


function setupQuickNav() {
  document.getElementById('quick-nav').addEventListener('click', e => {
    const btn = e.target.closest('[data-target]');
    if (!btn) return;
    haptic();
    btn.classList.remove('tap-bounce');
    void btn.offsetWidth;
    btn.classList.add('tap-bounce');
    btn.addEventListener('animationend', () => btn.classList.remove('tap-bounce'), { once: true });
    if (btn.classList.contains('quick-nav-review')) {
      resetReviewModal();
      openModal('review-modal');
      return;
    }
    if (btn.classList.contains('quick-nav-mesa')) {
      if (sharedCart) {
        openModal('cart-sheet');
      } else {
        openSharedCartSheet();
      }
      return;
    }
    scrollToTarget(btn.dataset.target);
  });
}


function setupDietFilter() {
  document.getElementById('diet-filter').addEventListener('click', e => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    haptic();
    currentFilter = btn.dataset.filter;
    track('filter_diet', { filter: currentFilter });
    renderDietFilter();
    renderMenu();
    if (window._attachMenuObserver) window._attachMenuObserver();
  });
}


function setupSearch() {
  const input = document.getElementById('menu-search-input');
  const clearBtn = document.getElementById('menu-search-clear');
  const search = document.querySelector('.menu-search');
  if (!input || !clearBtn || !search) return;

  let _searchTrackTimer = null;
  input.addEventListener('input', () => {
    currentQuery = input.value;
    search.classList.toggle('has-value', !!currentQuery.trim());
    renderMenu();
    if (window._attachMenuObserver) window._attachMenuObserver();

    clearTimeout(_searchTrackTimer);
    if (currentQuery.trim()) {
      _searchTrackTimer = setTimeout(() => {
        track('search', {
          query: currentQuery.trim(),
          results: lastVisibleItems,
          has_results: lastVisibleItems > 0
        });
      }, 1500);
    }
  });

  clearBtn.addEventListener('click', () => {
    currentQuery = '';
    input.value = '';
    search.classList.remove('has-value');
    renderMenu();
    if (window._attachMenuObserver) window._attachMenuObserver();
    input.focus();
  });

  // Reset button inside empty state (delegated)
  document.getElementById('menu').addEventListener('click', e => {
    if (e.target.closest('#menu-empty-reset')) {
      haptic();
      currentQuery = '';
      currentFilter = 'all';
      input.value = '';
      search.classList.remove('has-value');
      renderSearchBar();
      renderDietFilter();
      renderMenu();
      if (window._attachMenuObserver) window._attachMenuObserver();
    }
  });
}


function renderAllergenModal() {
  const list = document.getElementById('allergen-legend-list');
  const hint = document.getElementById('allergen-modal-hint');
  const clearBtn = document.getElementById('allergen-clear-btn');
  const badgeEl = document.getElementById('allergen-legend-badge');
  if (!list) return;

  const allergens = ALLERGENS_EU[currentLang] || ALLERGENS_EU.pt;
  const hints = {
    pt: 'Toque para excluir pratos que contenham esse alergénio.',
    en: 'Tap to hide dishes containing that allergen.',
    es: 'Toca para ocultar platos con ese alérgeno.',
    fr: 'Touchez pour masquer les plats contenant cet allergène.'
  };
  const clearLabels = {
    pt: 'Limpar filtros de alergénios',
    en: 'Clear allergen filters',
    es: 'Borrar filtros de alérgenos',
    fr: 'Effacer les filtres allergènes'
  };
  if (hint) hint.textContent = hints[currentLang] || hints.pt;
  if (clearBtn) {
    clearBtn.textContent = clearLabels[currentLang] || clearLabels.pt;
    clearBtn.style.display = activeAllergenExcludes.size > 0 ? 'block' : 'none';
  }

  list.innerHTML = Object.entries(allergens).map(([num, name]) => {
    const id = parseInt(num);
    const active = activeAllergenExcludes.has(id);
    return `
      <button class="allergen-legend-item ${active ? 'excluded' : ''}" data-allergen-toggle="${id}" aria-pressed="${active}">
        <span class="allergen-legend-num">${num}</span>
        <span class="allergen-legend-name">${name}</span>
        <span class="allergen-toggle-icon" aria-hidden="true">${active ? '✕' : ''}</span>
      </button>`;
  }).join('');

  // Update badge on ⓘ button
  const count = activeAllergenExcludes.size;
  if (badgeEl) {
    badgeEl.textContent = count;
    badgeEl.style.display = count > 0 ? 'inline-flex' : 'none';
  }
  const legendBtn = document.getElementById('allergen-legend-btn');
  if (legendBtn) legendBtn.classList.toggle('has-active', count > 0);
}


function setupAllergenLegend() {
  const btn = document.getElementById('allergen-legend-btn');
  const modal = document.getElementById('allergen-legend-modal');
  const closeBtn = document.getElementById('allergen-legend-close');
  const clearBtn = document.getElementById('allergen-clear-btn');
  const list = document.getElementById('allergen-legend-list');
  if (!btn || !modal) return;

  btn.addEventListener('click', () => {
    haptic();
    renderAllergenModal();
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  });

  if (list) {
    list.addEventListener('click', e => {
      const item = e.target.closest('[data-allergen-toggle]');
      if (!item) return;
      haptic();
      const id = parseInt(item.dataset.allergenToggle);
      const wasExcluded = activeAllergenExcludes.has(id);
      if (wasExcluded) {
        activeAllergenExcludes.delete(id);
      } else {
        activeAllergenExcludes.add(id);
      }
      track('filter_allergen', { allergen: id, action: wasExcluded ? 'remove' : 'add' });
      renderAllergenModal();
      renderAllergenFilter();
      renderMenu();
      if (window._attachMenuObserver) window._attachMenuObserver();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      haptic();
      activeAllergenExcludes.clear();
      renderAllergenModal();
      renderAllergenFilter();
      renderMenu();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    });
  }
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  });
}


function setupCategoryTabs() {
  const tabsEl = document.getElementById('category-tabs');

  tabsEl.addEventListener('click', e => {
    const tab = e.target.closest('[data-category]');
    if (!tab) return;
    haptic();
    track('category_browsed', { category_name: tab.dataset.category });
    // Activa tab visualmente
    tabsEl.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    positionTabInk(tab, true);
    scrollToTarget(`section-${tab.dataset.category}`);
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id.replace('section-', '');
        tabsEl.querySelectorAll('.category-tab').forEach(tab => {
          const isActive = tab.dataset.category === id;
          tab.classList.toggle('active', isActive);
          if (isActive) positionTabInk(tab, true);
        });
      }
    });
  }, {
    rootMargin: '-30% 0px -50% 0px',
    threshold: 0
  });

  window._attachMenuObserver = function() {
    observer.disconnect();
    document.querySelectorAll('.menu-section').forEach(sec => observer.observe(sec));
  };
  window._attachMenuObserver();

  // Hide category tabs when drinks section is in view
  const winesEl = document.getElementById('section-wines');
  if (winesEl) {
    const winesObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        tabsEl.style.opacity = entry.isIntersecting ? '0' : '1';
        tabsEl.style.pointerEvents = entry.isIntersecting ? 'none' : 'auto';
      });
    }, { rootMargin: '-10% 0px 0px 0px', threshold: 0.1 });
    winesObserver.observe(winesEl);
  }
}


function setupWineFilters() {
  const filtersEl = document.getElementById('wine-filters');
  if (!filtersEl) return;
  filtersEl.addEventListener('click', e => {
    const chip = e.target.closest('[data-filter-value]');
    if (!chip) return;
    haptic();
    const type = chip.dataset.filterType;
    const value = chip.dataset.filterValue;
    wineFilters[type] = value;
    renderWineFilters();
    renderWineList();
  });
}


function setupMostOrdered() {
  const list = document.getElementById('most-ordered-list');
  if (!list) return;
  list.addEventListener('click', e => {
    const card = e.target.closest('[data-item]');
    if (!card) return;
    haptic();
    const [sectionId, itemIdx] = card.dataset.item.split(':');
    openItemModal(sectionId, parseInt(itemIdx));
  });
}


function openPhotoLightbox(src, alt) {
  let lb = document.getElementById('photo-lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'photo-lightbox';
    lb.className = 'photo-lightbox';
    lb.innerHTML = `<img class="photo-lightbox-img" alt=""><button class="photo-lightbox-close" aria-label="Fechar">✕</button>`;
    document.body.appendChild(lb);
    lb.addEventListener('click', e => {
      if (!e.target.closest('.photo-lightbox-img')) {
        lb.classList.remove('show');
        document.body.style.overflow = '';
      }
    });
  }
  lb.querySelector('.photo-lightbox-img').src = src;
  lb.querySelector('.photo-lightbox-img').alt = alt || '';
  lb.classList.add('show');
  document.body.style.overflow = 'hidden';
  track('photo_open', { item: alt || '' });
}


function setupWineClicks() {
  const listEl = document.getElementById('wine-list');
  if (!listEl) return;
  listEl.addEventListener('click', e => {
    // +/− no cartão da bebida: adiciona/remove sem abrir o modal
    const addBtn = e.target.closest('[data-add-ref]');
    const decBtn = e.target.closest('[data-decrement-ref]');
    if (addBtn || decBtn) {
      e.stopPropagation();
      e.preventDefault();
      haptic();
      if (addBtn) addToCart(addBtn.dataset.addRef);
      else decrementCart(decBtn.dataset.decrementRef);
      return;
    }
    const card = e.target.closest('[data-wine-idx]');
    if (!card) return;
    haptic();
    openWineModal(parseInt(card.dataset.wineIdx));
  });
}


function openWineModal(idx) {
  const w = CONFIG.wines[idx];
  if (!w) return;

  const photoEl = document.getElementById('wine-modal-photo');
  if (w.photo) {
    photoEl.style.backgroundImage = `url('${w.photo}')`;
    photoEl.innerHTML = '';
    photoEl.classList.remove('is-placeholder');
  } else {
    photoEl.style.backgroundImage = '';
    photoEl.classList.add('is-placeholder');
    photoEl.innerHTML = `
      <svg width="72" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
        <path d="M8 2h8l-1 11a3 3 0 01-6 0L8 2z"/>
        <line x1="12" y1="13" x2="12" y2="22"/>
        <line x1="8" y1="22" x2="16" y2="22"/>
      </svg>
    `;
  }

  document.getElementById('wine-modal-name').textContent = w.name;
  document.getElementById('wine-modal-price').textContent = w.price;
  document.getElementById('wine-modal-desc').textContent = w.desc;

  const specs = [
    { label: t().wineSpecCountry, value: w.country },
    { label: t().wineSpecRegion, value: w.region },
    { label: t().wineSpecGrape, value: w.grape },
    { label: t().wineSpecAbv, value: w.abv },
    { label: t().wineSpecVolume, value: w.volume }
  ];

  document.getElementById('wine-modal-specs').innerHTML = specs.map(s => `
    <div class="wine-spec-row">
      <span class="wine-spec-label">${s.label}</span>
      <span class="wine-spec-value">${s.value}</span>
    </div>
  `).join('');

  // Vivino rating + link (optional — only if wine has rating)
  const vivinoBlock = document.getElementById('wine-modal-vivino');
  if (vivinoBlock) {
    if (w.vivinoRating && w.vivinoUrl) {
      vivinoBlock.style.display = 'flex';
      const starsEl = vivinoBlock.querySelector('.vivino-modal-stars');
      const scoreEl = vivinoBlock.querySelector('.vivino-modal-score');
      const linkEl = vivinoBlock.querySelector('.vivino-modal-link');
      if (starsEl) starsEl.innerHTML = renderVivinoStars(w.vivinoRating);
      if (scoreEl) scoreEl.textContent = w.vivinoRating.toFixed(1);
      if (linkEl) {
        linkEl.href = w.vivinoUrl;
        linkEl.textContent = t().vivinoSeeMore;
      }
    } else {
      vivinoBlock.style.display = 'none';
    }
  }

  // ═══ Adicionar bebida ao pedido (refId "bebidas:<idx>") ═══
  const addBtn = document.getElementById('wine-modal-add');
  const addLabel = document.getElementById('wine-modal-add-label');
  const decrementBtn = document.getElementById('wine-modal-decrement');
  const orderBar = document.getElementById('wine-modal-order-bar');
  if (addBtn && addLabel && orderBar) {
    const refId = `bebidas:${idx}`;
    if (parsePriceToNumber(w.price) !== null) {
      orderBar.style.display = 'flex';
      addBtn.dataset.addRef = refId;
      addBtn.setAttribute('aria-label', t().increaseQty);
      const qty = getCartQty(refId);
      addLabel.textContent = qty > 0 ? `${qty} ${t().inOrder}` : t().addToOrder;
      orderBar.classList.toggle('has-decrement', qty > 0);
      if (addBtn._feedbackTimer) { clearTimeout(addBtn._feedbackTimer); addBtn._feedbackTimer = null; }
      addBtn.classList.remove('just-added');
      if (decrementBtn) {
        decrementBtn.dataset.decrementRef = refId;
        decrementBtn.setAttribute('aria-label', t().reduceQty);
        decrementBtn.classList.toggle('show', qty > 0);
      }
    } else {
      orderBar.style.display = 'none';
      orderBar.classList.remove('has-decrement');
    }
  }

  track('wine_open', { name: w.name, price: w.price });
  openModal('wine-modal');
}


function setupWineModalAdd() {
  const btn = document.getElementById('wine-modal-add');
  const decrementBtn = document.getElementById('wine-modal-decrement');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const ref = btn.dataset.addRef;
    if (!ref) return;
    haptic();
    addToCart(ref);
    btn.classList.add('just-added');
    const label = document.getElementById('wine-modal-add-label');
    if (label) {
      label.textContent = t().addedToOrder;
      if (btn._feedbackTimer) clearTimeout(btn._feedbackTimer);
      btn._feedbackTimer = setTimeout(() => {
        btn.classList.remove('just-added');
        btn._feedbackTimer = null;
        updateOpenWineModalControls();
      }, 900);
    }
  });
  if (decrementBtn) {
    decrementBtn.addEventListener('click', () => {
      const ref = decrementBtn.dataset.decrementRef;
      if (!ref) return;
      haptic();
      decrementCart(ref);
    });
  }
}


function updateOpenWineModalControls() {
  const modal = document.getElementById('wine-modal');
  if (!modal || !modal.classList.contains('show')) return;
  const addBtn = document.getElementById('wine-modal-add');
  const addLabel = document.getElementById('wine-modal-add-label');
  const decrementBtn = document.getElementById('wine-modal-decrement');
  const orderBar = document.getElementById('wine-modal-order-bar');
  if (!addBtn || !addLabel || !addBtn.dataset.addRef) return;
  const qty = getCartQty(addBtn.dataset.addRef);
  addLabel.textContent = qty > 0 ? `${qty} ${t().inOrder}` : t().addToOrder;
  if (orderBar) orderBar.classList.toggle('has-decrement', qty > 0);
  if (decrementBtn) decrementBtn.classList.toggle('show', qty > 0);
}


function setupReviewButton() {
  document.getElementById('btn-review').addEventListener('click', () => {
    haptic();
    resetReviewModal();
    track('review_prompted');
    openModal('review-modal');
  });
}


function setupModalCloses() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      // If closing review modal, mark as seen so auto-popup doesn't re-trigger
      if (btn.dataset.close === 'review-modal') {
        try { sessionStorage.setItem('nexo_rated', '1'); } catch(e) {}
      }
      closeModal(btn.dataset.close);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        if (overlay.id === 'review-modal') {
          try { sessionStorage.setItem('nexo_rated', '1'); } catch(e) {}
        }
        closeModal(overlay.id);
      }
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.show').forEach(m => {
        if (m.id === 'review-modal') {
          try { sessionStorage.setItem('nexo_rated', '1'); } catch(e) {}
        }
        closeModal(m.id);
      });
    }
  });
}


function setupWifiCopy() {
  document.getElementById('wifi-card').addEventListener('click', () => {
    haptic();
    track('wifi_copy');
    const pwd = CONFIG.wifiPassword;
    const msg = t().copied;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(pwd)
        .then(() => showToast(msg))
        .catch(() => fallbackCopy(pwd, msg));
    } else {
      fallbackCopy(pwd, msg);
    }
  });
}


function fallbackCopy(text, successMsg) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast(successMsg);
  } catch (err) { /* silent */ }
  document.body.removeChild(ta);
}


function setupLoyalty() {
  document.getElementById('loyalty-btn').addEventListener('click', () => {
    haptic();
    const msg = CONFIG.whatsappLoyaltyMessage[currentLang] || CONFIG.whatsappLoyaltyMessage.pt;
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  });
}


function setupShare() {
  document.getElementById('share-btn').addEventListener('click', async () => {
    haptic();
    const shareData = {
      title: CONFIG.name,
      text: `${CONFIG.name} · ${CONFIG.city}`,
      url: window.location.href.split('?')[0]
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        showToast(t().copied);
      }
    } catch (err) { /* cancelled */ }
  });
}


function setupBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        btn.classList.toggle('visible', window.scrollY > 400);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    haptic();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}



/* ═══════════════════════════════════════════════════════════════════════════
   12B. ORDER SYSTEM — My Order feature
   ═══════════════════════════════════════════════════════════════════════════ */


function parsePriceToNumber(priceStr) {
  if (!priceStr || typeof priceStr !== 'string') return null;
  if (/p\.?v\.?p\.?/i.test(priceStr)) return null;
  // Extrai primeiro número com vírgula ou ponto
  const match = priceStr.match(/(\d+)[,.](\d{2})/) || priceStr.match(/(\d+)/);
  if (!match) return null;
  if (match.length === 3) {
    return parseFloat(`${match[1]}.${match[2]}`);
  }
  return parseFloat(match[1]);
}


function formatPrice(num) {
  return num.toFixed(2).replace('.', ',') + '€';
}


function getCartQty(refId) {
  if (sharedCart) return sharedCartItems.filter(r => r.item_id === refId).reduce((s, r) => s + r.quantity, 0);
  const entry = cart.find(c => c.refId === refId);
  return entry ? entry.qty : 0;
}


function decrementCart(refId) {
  if (sharedCart) { sharedDecrementCart(refId); return; }
  const entry = cart.find(c => c.refId === refId);
  if (!entry) return;
  entry.qty -= 1;
  if (entry.qty <= 0) {
    const _removedItem = getItemByRef(refId);
    if (_removedItem) track('item_removed', { item_name: _removedItem.name.pt });
    cart = cart.filter(c => c.refId !== refId);
  }
  onCartChange();
}


function removeFromCart(refId) {
  if (sharedCart) { sharedRemoveFromCart(refId); return; }
  const _removedItem = getItemByRef(refId);
  if (_removedItem) track('item_removed', { item_name: _removedItem.name.pt });
  cart = cart.filter(c => c.refId !== refId);
  onCartChange();
}


function clearCart() {
  if (sharedCart) { sharedClearCart(); return; }
  cart = [];
  onCartChange();
}


function getCartTotal() {
  if (sharedCart) {
    return sharedCartItems.reduce((sum, row) => {
      const item = getItemByRef(row.item_id);
      const price = item ? (parsePriceToNumber(item.price) || 0) : (row.item_price || 0);
      return sum + price * row.quantity;
    }, 0);
  }
  return cart.reduce((sum, entry) => {
    const item = getItemByRef(entry.refId);
    if (!item) return sum;
    const price = parsePriceToNumber(item.price);
    return sum + (price || 0) * entry.qty;
  }, 0);
}


function getCartItemCount() {
  if (sharedCart) return sharedCartItems.reduce((s, r) => s + r.quantity, 0);
  return cart.reduce((sum, entry) => sum + entry.qty, 0);
}


function getDrinkByIdx(idx) {
  const w = (CONFIG.wines || [])[idx];
  if (!w) return null;
  if (!_drinkItemCache[idx]) {
    _drinkItemCache[idx] = {
      isDrink: true,
      name: { pt: w.name, en: w.name, es: w.name, fr: w.name },
      desc: { pt: w.desc || '', en: w.desc || '', es: w.desc || '', fr: w.desc || '' },
      price: w.price, photo: w.photo || null, diet: [], allergens: []
    };
  }
  return _drinkItemCache[idx];
}

function getItemByRef(refId) {
  const [sid, iidxStr] = refId.split(':');
  if (sid === 'bebidas') return getDrinkByIdx(parseInt(iidxStr));
  const sec = CONFIG.menu.find(s => s.id === sid);
  if (!sec) return null;
  return sec.items[parseInt(iidxStr)] || null;
}


function setItemNote(refId, note) {
  if (sharedCart) { sharedSetItemNote(refId, note); return; }
  const entry = cart.find(c => c.refId === refId);
  if (entry !== undefined) entry.note = note || '';
}


function getItemNote(refId) {
  if (sharedCart) {
    const item = _myCartItems.find(i => i.item_id === refId);
    return item ? (item.note || '') : '';
  }
  const entry = cart.find(c => c.refId === refId);
  return entry ? (entry.note || '') : '';
}


function hasAnyNotes() {
  if (sharedCart) return sharedCartItems.some(r => r.note && r.note.trim().length > 0);
  return cart.some(e => e.note && e.note.trim().length > 0);
}


function onCartChange() {
  renderCartPill();
  renderCartSheet();
  updateAddBtnBadges();
  updateOpenItemModalControls();
  updateOpenWineModalControls();
  if (typeof onCartChangeSplitHook === 'function') onCartChangeSplitHook();
}


function updateAddBtnBadges() {
  document.querySelectorAll('.menu-item-order-controls').forEach(control => {
    const ref = control.dataset.orderControls;
    if (!ref) return;
    const qty = getCartQty(ref);
    const addBtn = control.querySelector('[data-add-ref]');
    const minusBtn = control.querySelector('[data-decrement-ref]');
    if (!addBtn || !minusBtn) return;

    const existingBadge = addBtn.querySelector('.qty-badge');
    control.classList.toggle('has-qty', qty > 0);
    addBtn.classList.toggle('added', qty > 0);
    minusBtn.classList.toggle('show', qty > 0);

    if (qty > 0) {
      if (existingBadge) {
        existingBadge.textContent = qty;
      } else {
        const badge = document.createElement('span');
        badge.className = 'qty-badge';
        badge.textContent = qty;
        addBtn.appendChild(badge);
      }
    } else if (existingBadge) {
      existingBadge.remove();
    }
  });

  document.querySelectorAll('#item-modal [data-add-ref]').forEach(btn => {
    const ref = btn.dataset.addRef;
    const qty = getCartQty(ref);
    btn.classList.toggle('added', qty > 0);
  });
}


function updateOpenItemModalControls() {
  const modal = document.getElementById('item-modal');
  if (!modal || !modal.classList.contains('show')) return;

  const addBtn = document.getElementById('item-modal-add');
  const addLabel = document.getElementById('item-modal-add-label');
  const decrementBtn = document.getElementById('item-modal-decrement');
  const orderBar = document.getElementById('item-modal-order-bar');
  if (!addBtn || !addLabel || !addBtn.dataset.addRef) return;

  const qty = getCartQty(addBtn.dataset.addRef);
  const newLabel = qty > 0 ? `${qty} ${t().inOrder}` : t().addToOrder;
  if (addLabel.textContent !== newLabel) {
    addLabel.textContent = newLabel;
    addLabel.classList.remove('qty-update');
    void addLabel.offsetWidth;
    addLabel.classList.add('qty-update');
    addLabel.addEventListener('animationend', () => addLabel.classList.remove('qty-update'), { once: true });
  }
  if (orderBar) {
    orderBar.classList.toggle('has-decrement', qty > 0);
  }
  if (decrementBtn) {
    decrementBtn.classList.toggle('show', qty > 0);
  }
}


function openStaffView(tableOverride) {
  if (getCartItemCount() === 0) return;

  track('order_placed', {
    item_count: getCartItemCount(),
    order_total: getCartTotal(),
    shared: sharedCart !== null,
  });

  const staffView = document.getElementById('staff-view');
  const tableEl = document.getElementById('staff-table');
  const orderIdEl = document.getElementById('staff-order-id');
  const helperEl = document.getElementById('staff-helper');
  const totalEl = document.getElementById('staff-total');
  if (!staffView) return;

  helperEl.textContent = t().staffHelper;

  // Mesa: usa override (da tela de confirmação) > URL param
  const tableVal = (tableOverride || '').trim() || tableNumber || '';
  if (tableVal) {
    tableEl.textContent = tableVal.startsWith(t().tableHint)
      ? tableVal
      : `${t().tableHint} ${tableVal}`;
    tableEl.classList.remove('no-table');
  } else {
    tableEl.textContent = CONFIG.name || '';
    tableEl.classList.add('no-table');
  }

  orderIdEl.textContent = `#${ORDER_ID}`;

  // Render current cart items
  renderStaffHistory();

  // Total = current cart only
  totalEl.innerHTML = `<span>${t().cartTotal}</span>${formatPrice(getCartTotal())}`;

  document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
  document.body.style.overflow = 'hidden';

  if (screen.orientation && screen.orientation.unlock) {
    try { screen.orientation.unlock(); } catch(e) {}
  }

  staffView.classList.add('show');
}


function closeStaffView() {
  const staffView = document.getElementById('staff-view');
  if (!staffView) return;
  staffView.classList.remove('show');
  document.body.style.overflow = '';
}



/* ═══════════════════════════════════════════════════════════════════════════
   12B-CONFIRM. CONFIRMATION SCREEN — Rever Pedido
   ═══════════════════════════════════════════════════════════════════════════ */


function openConfirmScreen() {
  if (!sharedCart && cart.length === 0) return;
  if (navigator.vibrate) navigator.vibrate(8);
  renderConfirmScreen();
  const screen = document.getElementById('confirm-screen');
  if (screen) {
    screen.classList.remove('closing');
    screen.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  // Reset pulse timer — user engaged
  if (pulseTimer) { clearTimeout(pulseTimer); pulseTimer = null; }
}


function closeConfirmScreen() {
  const screen = document.getElementById('confirm-screen');
  if (!screen) return;
  screen.classList.add('closing');
  setTimeout(() => {
    screen.classList.remove('show', 'closing');
    document.body.style.overflow = '';
  }, 260);
}


function renderConfirmScreen() {
  const itemsEl = document.getElementById('confirm-items');
  const totalEl = document.getElementById('confirm-total-value');
  const totalLabelEl = document.getElementById('confirm-total-label');
  const titleEl = document.getElementById('confirm-title');
  const sectionLabelEl = document.getElementById('confirm-section-label');
  const tableWrap = document.getElementById('confirm-table-wrap');
  const tableInput = document.getElementById('confirm-table-input');
  const tableLabelEl = document.getElementById('confirm-table-label');
  const whatsappBtn = document.getElementById('confirm-btn-whatsapp');
  const staffBtn = document.getElementById('confirm-btn-staff');
  const whatsappLabel = document.getElementById('confirm-whatsapp-label');
  const staffLabel = document.getElementById('confirm-staff-label');

  const tablePrefixEl = document.getElementById('confirm-table-prefix');
  const tableErrorEl  = document.getElementById('confirm-table-error');

  // Texts
  if (titleEl) titleEl.textContent = t().confirmTitle;
  if (sectionLabelEl) sectionLabelEl.textContent = sharedCart ? t().confirmSectionLabelShared || 'Pedido da mesa' : t().confirmSectionLabel;
  if (totalLabelEl) totalLabelEl.textContent = t().cartTotal;
  if (tableLabelEl) tableLabelEl.textContent = t().confirmTableLabel;
  if (tablePrefixEl) tablePrefixEl.textContent = t().confirmTablePrefix;
  if (tableInput) tableInput.placeholder = t().confirmTablePlaceholder;
  if (tableErrorEl) tableErrorEl.textContent = t().confirmTableRequired;
  if (whatsappLabel) whatsappLabel.textContent = t().confirmWhatsapp;
  if (staffLabel) staffLabel.textContent = t().confirmStaff;

  if (!itemsEl) return;

  // Render order summary
  if (sharedCart) {
    itemsEl.innerHTML = sharedCartItems.map((row, i) => {
      const item = getItemByRef(row.item_id);
      const nm = escHtml(item ? item.name[currentLang] : row.item_name);
      const price = item ? (parsePriceToNumber(item.price) || 0) : (row.item_price || 0);
      const lineTotal = price * row.quantity;
      const noteHtml = (row.note && row.note.trim())
        ? `<div class="confirm-item-note">↳ ${escHtml(row.note.trim())}</div>` : '';
      return `
        <div class="confirm-item-row${i > 0 ? ' with-divider' : ''}">
          <span class="confirm-item-qty">×${row.quantity}</span>
          <div class="confirm-item-info">
            <span class="confirm-item-name">${nm}</span>
            <span class="confirm-item-member-tag">${escHtml(row.member_name)}</span>
            ${noteHtml}
          </div>
          <span class="confirm-item-price">${formatPrice(lineTotal)}</span>
        </div>`;
    }).join('');
  } else {
    itemsEl.innerHTML = cart.map((entry, i) => {
      const item = getItemByRef(entry.refId);
      if (!item) return '';
      const unitPrice = parsePriceToNumber(item.price) || 0;
      const lineTotal = unitPrice * entry.qty;
      const noteHtml = (entry.note && entry.note.trim())
        ? `<div class="confirm-item-note">↳ ${escHtml(entry.note.trim())}</div>` : '';
      return `
        <div class="confirm-item-row${i > 0 ? ' with-divider' : ''}">
          <span class="confirm-item-qty">×${entry.qty}</span>
          <div class="confirm-item-info">
            <span class="confirm-item-name">${item.name[currentLang]}</span>
            ${noteHtml}
          </div>
          <span class="confirm-item-price">${formatPrice(lineTotal)}</span>
        </div>`;
    }).join('');
  }

  // Total
  if (totalEl) totalEl.textContent = formatPrice(getCartTotal());

  // Table input
  const tableEnabled = CONFIG.tableInputEnabled !== false;
  if (tableWrap) tableWrap.style.display = tableEnabled ? 'block' : 'none';
  if (tableInput && confirmTableValue) tableInput.value = confirmTableValue;

  // "Enviar para a cozinha" é sempre o botão primário (topo).
  const kitchenLabel = document.getElementById('confirm-kitchen-label');
  if (kitchenLabel) kitchenLabel.textContent = t().confirmKitchen;

  // WhatsApp passou a ser canal de RECURSO (fallback) — o botão nunca aparece.
  if (whatsappBtn) whatsappBtn.style.display = 'none';
  // Staff é sempre o botão secundário.
  if (staffBtn) staffBtn.classList.remove('confirm-btn-staff-primary');
}


function validateTableInput() {
  const tableEnabled = CONFIG.tableInputEnabled !== false;
  if (!tableEnabled) return true;
  const input = document.getElementById('confirm-table-input');
  const field = document.getElementById('confirm-table-field');
  const errorEl = document.getElementById('confirm-table-error');
  if (!input) return true;
  const raw = input.value.trim();
  if (raw) {
    // Validação do número máximo de mesas (venue_settings).
    const num = parseInt(raw, 10);
    if (nexoMaxTable && (!num || num < 1 || num > nexoMaxTable)) {
      if (errorEl) {
        errorEl.textContent = (num > nexoMaxTable)
          ? `Este espaço tem ${nexoMaxTable} mesas. Escolha um número entre 1 e ${nexoMaxTable}.`
          : 'Número de mesa inválido.';
        errorEl.style.display = 'block';
      }
      if (field) {
        field.classList.add('error', 'shake');
        field.addEventListener('animationend', () => field.classList.remove('shake'), { once: true });
      }
      input.focus();
      return false;
    }
    if (field) field.classList.remove('error');
    if (errorEl) errorEl.style.display = 'none';
    return true;
  }
  // Show error + shake
  if (field) {
    field.classList.add('error', 'shake');
    field.addEventListener('animationend', () => field.classList.remove('shake'), { once: true });
  }
  if (errorEl) errorEl.style.display = 'block';
  input.focus();
  return false;
}


function generateOrderMessage(cartItems, tableValue) {
  const n = (tableValue && tableValue.trim()) ? tableValue.trim() : '—';
  const prefix = 'Mesa';

  let itemLines;
  if (sharedCart) {
    itemLines = sharedCartItems.map(row => {
      const item = getItemByRef(row.item_id);
      const name = item ? (item.name['pt'] || item.name[currentLang]) : row.item_name;
      const price = item ? (parsePriceToNumber(item.price) || 0) : (row.item_price || 0);
      const qty = row.quantity > 1 ? `${row.quantity}x ` : '';
      const total = (price * row.quantity).toFixed(2).replace('.', ',');
      let line = `${qty}${name} — €${total} (${row.member_name})`;
      if (row.note && row.note.trim()) line += `\n   _${row.note.trim()}_`;
      return line;
    }).filter(Boolean).join('\n');
  } else {
    itemLines = cartItems.map(entry => {
      const item = getItemByRef(entry.refId);
      if (!item) return '';
      const qty = entry.qty > 1 ? `${entry.qty}x ` : '';
      const price = ((parsePriceToNumber(item.price) || 0) * entry.qty)
        .toFixed(2).replace('.', ',');
      const itemName = item.name['pt'] || item.name[currentLang];
      let line = `${qty}${itemName} — €${price}`;
      if (entry.note && entry.note.trim()) {
        line += `\n   _${entry.note.trim()}_`;
      }
      return line;
    }).filter(Boolean).join('\n');
  }

  const total = getCartTotal().toFixed(2).replace('.', ',');

  return (
    `*${prefix} ${n}*\n` +
    `━━━━━━━━━━━━━━━\n` +
    `${itemLines}\n` +
    `━━━━━━━━━━━━━━━\n` +
    `*Total: €${total}*\n\n` +
    `_via NEXO Menu_`
  );
}


function submitOrderWithTimeout(force) {
  const ORDER_TIMEOUT_MS = 15000;
  return new Promise(resolve => {
    let settled = false;
    const done = (r) => { if (!settled) { settled = true; resolve(r); } };
    const timer = setTimeout(() => done({ ok: false, reason: 'timeout' }), ORDER_TIMEOUT_MS);
    Promise.resolve()
      .then(() => window.NEXOPremium.onOrderConfirmed(force ? { force: true } : undefined))
      .then(r => { clearTimeout(timer); done(r || { ok: false, reason: 'error' }); })
      .catch(() => { clearTimeout(timer); done({ ok: false, reason: 'error' }); });
  });
}


function resetKitchenBtn() {
  const btn = document.getElementById('confirm-btn-kitchen');
  if (!btn) return;
  btn.disabled = false;
  btn.classList.remove('is-loading');
  if (_kitchenBtnOrigHTML !== null) { btn.innerHTML = _kitchenBtnOrigHTML; _kitchenBtnOrigHTML = null; }
}


function whatsappFallback(tableValue) {
  logOrderToSupabase(sharedCart ? 'shared' : 'whatsapp', tableValue);
  const number = (CONFIG.orderWhatsapp || '').replace(/\D/g, '');
  if (!number || CONFIG.orderWhatsapp === '{{ESPACO_WHATSAPP}}') return; // sem WA: ao menos ficou no log
  const message = generateOrderMessage(cart, tableValue);
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  const toast = document.getElementById('confirm-wa-toast');
  if (toast) {
    toast.textContent = t().confirmOpeningWA;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1600);
  }
  window.open(url, '_blank');
}


function setupConfirmButtonPulse() {
  function tryPulse() {
    if (pulseTimerFired) return;
    if (pulseTimer) clearTimeout(pulseTimer);
    pulseTimer = setTimeout(() => {
      const btn = document.getElementById('cart-confirm-btn');
      if (btn && cart.length > 0 && !pulseTimerFired) {
        btn.classList.add('nexo-pulse');
        btn.addEventListener('animationend', () => btn.classList.remove('nexo-pulse'), { once: true });
        pulseTimerFired = true;
      }
    }, 8000);
  }

  document.addEventListener('touchstart', tryPulse, { passive: true });
  document.addEventListener('click', () => {
    if (!pulseTimerFired) tryPulse();
  }, { passive: true });
  tryPulse();
}


function setupMenuAddButtons() {
  document.getElementById('menu').addEventListener('click', e => {
    const btn = e.target.closest('[data-add-ref]');
    const decBtn = e.target.closest('[data-decrement-ref]');
    if (!btn && !decBtn) return;
    // IMPORTANTE: bloquear também outros listeners no mesmo container
    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();
    haptic();
    if (btn) {
      addToCart(btn.dataset.addRef);
    } else if (decBtn) {
      decrementCart(decBtn.dataset.decrementRef);
    }
  });
}


function setupItemModalAdd() {
  const btn = document.getElementById('item-modal-add');
  const decrementBtn = document.getElementById('item-modal-decrement');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const ref = btn.dataset.addRef;
    if (!ref) return;
    haptic();
    addToCart(ref);
    btn.classList.add('just-added');
    const label = document.getElementById('item-modal-add-label');
    if (label) {
      label.textContent = t().addedToOrder;
      if (btn._feedbackTimer) clearTimeout(btn._feedbackTimer);
      btn._feedbackTimer = setTimeout(() => {
        btn.classList.remove('just-added');
        btn._feedbackTimer = null;
        updateOpenItemModalControls();
      }, 900);
    }
  });

  if (decrementBtn) {
    decrementBtn.addEventListener('click', () => {
      const ref = decrementBtn.dataset.decrementRef;
      if (!ref) return;
      haptic();
      decrementCart(ref);
    });
  }
}


function setupCartSheet() {
  const list = document.getElementById('cart-list');
  if (list) {
    list.addEventListener('click', e => {
      const inc = e.target.closest('[data-cart-increment]');
      const dec = e.target.closest('[data-cart-decrement]');
      const noteAdd = e.target.closest('[data-note-add]');
      const noteClear = e.target.closest('[data-note-clear]');
      const noteReopen = e.target.closest('[data-note-reopen]');

      if (inc) {
        haptic();
        addToCart(inc.dataset.cartIncrement);
      } else if (dec) {
        haptic();
        decrementCart(dec.dataset.cartDecrement);
      } else if (noteAdd) {
        showNoteInput(noteAdd.dataset.noteAdd);
      } else if (noteClear) {
        setItemNote(noteClear.dataset.noteClear, '');
        renderCartSheet();
      } else if (noteReopen) {
        showNoteInput(noteReopen.dataset.noteReopen);
      }
    });

    // Save note on blur (capture phase so it fires before re-render)
    list.addEventListener('focusout', e => {
      const input = e.target.closest('[data-note-refid]');
      if (input) saveNoteFromInput(input);
    }, true);

    // Save note on Enter
    list.addEventListener('keydown', e => {
      const input = e.target.closest('[data-note-refid]');
      if (input && e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      }
    });
  }

  const clearBtn = document.getElementById('cart-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      haptic();
      // Acção destrutiva: um toque acidental esvaziava o pedido inteiro.
      if (!window.confirm(t().cartClear + '?')) return;
      clearCart();
      closeModal('cart-sheet');
    });
  }

  const confirmBtn = document.getElementById('cart-confirm-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (!sharedCart && cart.length === 0) return;
      haptic();
      closeModal('cart-sheet');
      setTimeout(() => openConfirmScreen(), 100);
    });
  }
}


function showNoteInput(refId) {
  const wrap = document.querySelector(`[data-note-wrap="${refId}"]`);
  if (!wrap) return;
  const addBtn = wrap.querySelector('[data-note-add]');
  const preview = wrap.querySelector('.cart-item-note-preview');
  const inputWrap = document.getElementById(`note-input-wrap-${refId}`);
  const input = inputWrap ? inputWrap.querySelector('[data-note-refid]') : null;
  if (addBtn) addBtn.style.display = 'none';
  if (preview) preview.style.display = 'none';
  if (inputWrap) inputWrap.style.display = 'block';
  if (input) {
    input.value = getItemNote(refId);
    input.focus();
    setTimeout(() => input.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }
}


function saveNoteFromInput(input) {
  const refId = input.dataset.noteRefid;
  if (!refId) return;
  const note = input.value.trim();
  const oldNote = getItemNote(refId);
  if (note !== oldNote) {
    setItemNote(refId, note);
    renderCartSheet();
  }
}


function setupStaffView() {
  const view = document.getElementById('staff-view');
  const close = document.getElementById('staff-close');
  if (close) {
    close.addEventListener('click', e => {
      e.stopPropagation();
      closeStaffView();
    });
  }
  if (view) {
    view.addEventListener('click', e => {
      // Click em qualquer sítio fora do botão close fecha também
      if (e.target === view) closeStaffView();
    });
  }
  // ESC fecha staff view
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && view && view.classList.contains('show')) {
      closeStaffView();
    }
  });
}



/* ═══════════════════════════════════════════════════════════════════════════
   12C. SPLIT BILL — Dividir a conta
   ═══════════════════════════════════════════════════════════════════════════ */


function getPersonName(i) {
  return (customPersonNames[i] && customPersonNames[i].trim())
    || (PERSON_NAMES[currentLang] || PERSON_NAMES.pt)[i]
    || `P${i + 1}`;
}


function initSplitAssign() {
  splitAssign = Array.from({ length: splitPeople }, () => new Set());
  // Expande o array de nomes sem apagar os existentes
  while (customPersonNames.length < splitPeople) customPersonNames.push('');
}


function getSplitEntries() {
  if (typeof sharedCart !== 'undefined' && sharedCart && Array.isArray(sharedCartItems)) {
    const byRef = {};
    sharedCartItems.forEach(row => {
      const ref = row.item_id;
      if (!ref) return;
      if (!byRef[ref]) byRef[ref] = { refId: ref, qty: 0 };
      byRef[ref].qty += (row.quantity || 1);
    });
    return Object.values(byRef);
  }
  return cart.map(e => ({ refId: e.refId, qty: e.qty }));
}


function getPersonTotal(personIdx) {
  const assigned = splitAssign[personIdx];
  if (!assigned) return 0;
  return getSplitEntries().reduce((sum, entry) => {
    if (!assigned.has(entry.refId)) return sum;
    const item = getItemByRef(entry.refId);
    if (!item) return sum;
    const price = parsePriceToNumber(item.price) || 0;
    // Quantas pessoas partilham este item?
    const sharedBy = splitAssign.filter(s => s && s.has(entry.refId)).length || 1;
    return sum + (price * entry.qty) / sharedBy;
  }, 0);
}

function toggleAssign(refId) {
  const set = splitAssign[splitActivePerson];
  if (!set) return;
  if (set.has(refId)) {
    set.delete(refId);
  } else {
    set.add(refId);
  }
  renderSplitPanel();
}


function renderSplitPanel() {
  // Textos
  const tabOrderEl = document.getElementById('tab-order');
  const tabSplitEl = document.getElementById('tab-split');
  if (tabOrderEl) tabOrderEl.textContent = ts().tabOrder;
  if (tabSplitEl) tabSplitEl.textContent = ts().tabSplit;

  const peopleLabelEl = document.getElementById('split-people-label');
  if (peopleLabelEl) peopleLabelEl.textContent = ts().people;

  const countEl = document.getElementById('split-count');
  if (countEl) countEl.textContent = splitPeople;

  const modeEqualEl = document.getElementById('split-mode-equal');
  const modeCustomEl = document.getElementById('split-mode-custom');
  if (modeEqualEl) modeEqualEl.textContent = ts().modeEqual;
  if (modeCustomEl) modeCustomEl.textContent = ts().modeCustom;

  const renameHintLabel = document.getElementById('split-rename-hint-label');
  if (renameHintLabel) renameHintLabel.textContent = ts().renameHint;

  // Active state dos mode buttons
  if (modeEqualEl) modeEqualEl.classList.toggle('active', splitMode === 'equal');
  if (modeCustomEl) modeCustomEl.classList.toggle('active', splitMode === 'custom');

  // Disable stepper buttons at limits
  const minusBtn = document.getElementById('split-minus');
  const plusBtn = document.getElementById('split-plus');
  if (minusBtn) minusBtn.disabled = splitPeople <= SPLIT_MIN;
  if (plusBtn) plusBtn.disabled = splitPeople >= SPLIT_MAX;

  if (splitMode === 'equal') {
    renderSplitEqual();
    const customPanel = document.getElementById('split-custom-panel');
    const equalResult = document.getElementById('split-equal-result');
    if (customPanel) customPanel.style.display = 'none';
    if (equalResult) equalResult.style.display = 'block';
  } else {
    const customPanel = document.getElementById('split-custom-panel');
    const equalResult = document.getElementById('split-equal-result');
    if (customPanel) customPanel.style.display = 'block';
    if (equalResult) equalResult.style.display = 'none';
    renderSplitCustom();
  }
}


function renderSplitEqual() {
  const el = document.getElementById('split-equal-result');
  if (!el) return;
  const total = getCartTotal();
  const perPerson = total / splitPeople;

  const rows = Array.from({ length: splitPeople }, (_, i) => `
    <div class="split-eq-row">
      <span class="split-eq-person">${escHtml(getPersonName(i))}</span>
      <span class="split-eq-amount">${formatPrice(perPerson)}</span>
    </div>
  `).join('');

  el.innerHTML = rows + `<p class="split-total-note">${ts().totalNote(splitPeople)}</p>`;
}


function renderSplitCustom() {
  renderSplitPeopleTabs();
  renderSplitAssignList();
  renderSplitPersonSummary();
  renderSplitPodium();
}


function renderSplitPeopleTabs() {
  const el = document.getElementById('split-people-tabs');
  if (!el) return;

  el.innerHTML = Array.from({ length: splitPeople }, (_, i) => {
    const total = getPersonTotal(i);
    const totalStr = total > 0 ? formatPrice(total) : '—';
    const isActive = i === splitActivePerson;
    return `
      <button class="split-person-tab ${isActive ? 'active' : ''}" data-person="${i}">
        <span class="ptab-name" data-rename-idx="${i}">
          ${escHtml(getPersonName(i))}
          <svg class="ptab-edit-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </span>
        <span class="ptab-total">${totalStr}</span>
      </button>
    `;
  }).join('');
}


function renderSplitAssignList() {
  const el = document.getElementById('split-assign-list');
  if (!el) return;
  const assigned = splitAssign[splitActivePerson] || new Set();
  const entries = getSplitEntries();

  if (entries.length === 0) {
    el.innerHTML = `<div class="cart-empty" style="padding:var(--s4) 0">${t().cartEmpty}</div>`;
    return;
  }

  el.innerHTML = entries.map(entry => {
    const item = getItemByRef(entry.refId);
    if (!item) return '';
    const unitPrice = parsePriceToNumber(item.price) || 0;
    const lineTotal = unitPrice * entry.qty;
    const isChecked = assigned.has(entry.refId);

    // Quantas pessoas partilham este item (incluindo a activa se checked)
    const sharedBy = splitAssign.filter(s => s && s.has(entry.refId)).length || 0;
    const shareLabel = sharedBy > 1 ? `<span class="split-assign-shared">÷${sharedBy}</span>` : '';
    const displayPrice = sharedBy > 0 ? formatPrice(lineTotal / sharedBy) : formatPrice(lineTotal);

    return `
      <div class="split-assign-item ${isChecked ? 'checked' : ''}" data-assign-ref="${entry.refId}">
        <div class="split-assign-check"></div>
        <span class="split-assign-name">${item.name[currentLang]}</span>
        <span class="split-assign-qty">${entry.qty}×</span>
        ${shareLabel}
        <span class="split-assign-price">${displayPrice}</span>
      </div>
    `;
  }).join('');
}


function renderSplitPersonSummary() {
  const el = document.getElementById('split-person-summary');
  if (!el) return;
  const total = getPersonTotal(splitActivePerson);
  el.innerHTML = `
    <span class="split-summary-label">${ts().subtotal}</span>
    <span class="split-summary-value">${formatPrice(total)}</span>
  `;
}


function onCartChangeSplitHook() {
  const splitPanel = document.getElementById('panel-split');
  if (splitPanel && splitPanel.style.display !== 'none') {
    renderSplitPanel();
  }
  if (getSplitEntries().length === 0) {
    initSplitAssign();
  }
}



/* ═══════════════════════════════════════════════════════════════════════════
   12D. FAVORITES — Guardar favoritos em sessionStorage
   ═══════════════════════════════════════════════════════════════════════════ */


function toggleFavorite(refId) {
  if (favorites.has(refId)) {
    favorites.delete(refId);
  } else {
    favorites.add(refId);
    const _favItem = getItemByRef(refId);
    if (_favItem) track('item_bookmarked', { item_name: _favItem.name.pt });
  }
  saveFavorites();
  renderFavorites();
  // Update all bookmark buttons for this refId in menu
  document.querySelectorAll(`[data-bookmark-ref="${refId}"]`).forEach(btn => {
    btn.classList.toggle('saved', favorites.has(refId));
    btn.classList.remove('bookmark-pop');
    void btn.offsetWidth;
    btn.classList.add('bookmark-pop');
    btn.addEventListener('animationend', () => btn.classList.remove('bookmark-pop'), { once: true });
  });
  // Update modal bookmark button if open on this item
  const modalBtn = document.getElementById('item-bookmark-btn');
  if (modalBtn && modalBtn.dataset.bookmarkRef === refId) {
    const isSaved = favorites.has(refId);
    modalBtn.classList.toggle('saved', isSaved);
    const lbl = document.getElementById('bookmark-label');
    if (lbl) lbl.textContent = isSaved ? t().bookmarkSaved : t().bookmarkSave;
  }
}


function renderFavorites() {
  const section = document.getElementById('section-favorites');
  const list = document.getElementById('favorites-list');
  const titleEl = document.getElementById('favorites-title');
  if (!section || !list) return;

  if (titleEl) titleEl.textContent = t().favoritesTitle;

  const countEl = document.getElementById('favorites-count');

  if (favorites.size === 0) {
    section.style.display = 'none';
    return;
  }

  if (countEl) countEl.textContent = favorites.size;
  section.style.display = 'block';
  list.innerHTML = [...favorites].map(refId => {
    const item = getItemByRef(refId);
    if (!item) return '';
    return `
      <div class="fav-chip" data-fav-open="${refId}">
        <span class="fav-chip-name">${item.name[currentLang]}</span>
        <span class="fav-chip-price">${item.price}</span>
        <button class="fav-chip-remove" data-fav-remove="${refId}" aria-label="Remover" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;
  }).filter(Boolean).join('');
}


function setupFavorites() {
  // Menu item list: bookmark buttons (delegated)
  document.getElementById('menu').addEventListener('click', e => {
    const bookmarkBtn = e.target.closest('[data-bookmark-ref]');
    if (!bookmarkBtn) return;
    e.stopPropagation();
    haptic();
    toggleFavorite(bookmarkBtn.dataset.bookmarkRef);
  });

  // Item modal: bookmark button (correct ID: item-bookmark-btn)
  const modalBookmark = document.getElementById('item-bookmark-btn');
  if (modalBookmark) {
    modalBookmark.addEventListener('click', () => {
      haptic();
      toggleFavorite(modalBookmark.dataset.bookmarkRef);
    });
  }

  // Favorites section: chip click → open modal, ✕ → remove
  const section = document.getElementById('section-favorites');
  if (section) {
    section.addEventListener('click', e => {
      const removeBtn = e.target.closest('[data-fav-remove]');
      if (removeBtn) {
        haptic();
        toggleFavorite(removeBtn.dataset.favRemove);
        return;
      }
      const chip = e.target.closest('[data-fav-open]');
      if (chip) {
        haptic();
        const [sectionId, itemIdx] = chip.dataset.favOpen.split(':');
        openItemModal(sectionId, parseInt(itemIdx));
      }
    });
  }

  // Clear all button
  const clearBtn = document.getElementById('favorites-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      haptic();
      favorites.clear();
      saveFavorites();
      renderFavorites();
      document.querySelectorAll('[data-bookmark-ref]').forEach(b => b.classList.remove('saved'));
      showToast(t().favoritesCleared);
    });
  }
}



/* ═══════════════════════════════════════════════════════════════════════════
   12E. HAPPY HOUR COUNTDOWN
   ═══════════════════════════════════════════════════════════════════════════ */


function getCountdownBanner() {
  // Only count down for banners with id "happy-hour" (or any with countdown: true)
  if (!CONFIG.timeBanners) return null;
  const now = nexoNow();
  const h = now.getHours();
  const day = now.getDay();
  for (const banner of CONFIG.timeBanners) {
    if (banner.days && banner.days.length > 0 && !banner.days.includes(day)) continue;
    if (h >= banner.startH && h < banner.endH) {
      // Only countdown for happy-hour or banners explicitly marked
      if (banner.id === 'happy-hour' || banner.countdown === true) {
        return banner;
      }
    }
  }
  return null;
}


function setupCountdown() {
  function setDigit(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    const str = String(val).padStart(2, '0');
    if (el.textContent !== str) {
      el.textContent = str;
      el.classList.remove('tick');
      void el.offsetWidth;
      el.classList.add('tick');
      el.addEventListener('animationend', () => el.classList.remove('tick'), { once: true });
    }
  }

  function tick() {
    const banner = getCountdownBanner();
    const block = document.getElementById('special-countdown');
    if (!block) return;

    if (!banner) { block.style.display = 'none'; return; }

    const now = nexoNow();
    const endTime = new Date();
    endTime.setHours(banner.endH, 0, 0, 0);
    const diffMs = endTime - now;

    if (diffMs <= 0) {
      block.style.display = 'none';
      renderSpecialBanner();
      return;
    }

    const totalMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMins / 60);
    const mins  = totalMins % 60;
    const secs  = Math.floor((diffMs % 60000) / 1000);

    setDigit('cd-h', hours);
    setDigit('cd-m', mins);
    setDigit('cd-s', secs);

    const topEl = document.getElementById('special-cd-top');
    if (topEl) topEl.textContent = t().happyHourEnds;

    block.style.display = '';
    block.classList.toggle('urgent', totalMins < 10);
  }

  if (_countdownInterval) clearInterval(_countdownInterval);
  tick();
  _countdownInterval = setInterval(tick, 1000);
}



/* ═══════════════════════════════════════════════════════════════════════════
   12F. SHARE DISH — Canvas → Web Share API
   ═══════════════════════════════════════════════════════════════════════════ */


function setupShareDish() {
  // Delegated from item modal body — ID is item-share-btn
  const shareBtn = document.getElementById('item-share-btn');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    haptic();
    if (!currentShareItem) return;
    const { item } = currentShareItem;
    const name = item.name[currentLang];
    const price = item.price;
    const restName = CONFIG.name || '';

    try {
      const canvas = document.getElementById('share-canvas');
      const ctx = canvas.getContext('2d');
      const W = 1080, H = 1080;

      // Background gradient using brand colors
      const brandColor = CONFIG.brandColor || '#8B1A1A';
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, brandColor);
      grad.addColorStop(1, shadeColor(brandColor, -40));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Subtle noise texture overlay
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let i = 0; i < 8000; i++) {
        ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
      }

      // Gold accent line top
      ctx.fillStyle = '#D4A574';
      ctx.fillRect(60, 60, W - 120, 6);

      // Restaurant name
      ctx.fillStyle = 'rgba(212, 165, 116, 0.9)';
      ctx.font = `600 38px 'Outfit', sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(restName.toUpperCase(), 60, 130);

      // Item name — large serif
      ctx.fillStyle = '#FFFCF7';
      ctx.font = `900 ${name.length > 20 ? '82' : '100'}px Georgia, serif`;
      ctx.textAlign = 'left';
      wrapText(ctx, name, 60, 320, W - 120, name.length > 20 ? 95 : 115);

      // Price
      ctx.fillStyle = '#D4A574';
      ctx.font = `800 72px Georgia, serif`;
      ctx.fillText(price, 60, H - 200);

      // Gold line bottom
      ctx.fillStyle = '#D4A574';
      ctx.fillRect(60, H - 140, W - 120, 4);

      // NEXO watermark
      ctx.fillStyle = 'rgba(255,252,247,0.3)';
      ctx.font = `700 30px 'Outfit', sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText('menu.nexo.pt', W - 60, H - 60);

      canvas.toBlob(async (blob) => {
        if (!blob) { showToast(t().shareNotSupported); return; }
        const file = new File([blob], `${name}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: `${name} — ${restName}`, text: `${name} · ${price}` });
          } catch (err) { if (err.name !== 'AbortError') showToast(t().shareNotSupported); }
        } else if (navigator.share) {
          try {
            await navigator.share({ title: `${name} — ${restName}`, text: `${name} · ${price}`, url: window.location.href });
          } catch (err) { if (err.name !== 'AbortError') showToast(t().shareNotSupported); }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `${name}.png`; a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (err) {
      showToast(t().shareNotSupported);
    }
  });
}


function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, y);
}



/* ═══════════════════════════════════════════════════════════════════════════
   12G. ORDER HISTORY — Track pedidos enviados ao staff na sessão
   ═══════════════════════════════════════════════════════════════════════════ */


function renderStaffHistory() {
  const historyEl = document.getElementById('staff-history');
  if (!historyEl) return;

  const rows = sharedCart
    ? sharedCartItems.map(row => ({
        qty: row.quantity,
        name: (getItemByRef(row.item_id)?.name[currentLang]) || row.item_name,
        note: row.note || '',
        member: row.member_name,
      }))
    : cart.map(entry => {
        const item = getItemByRef(entry.refId);
        return item ? { qty: entry.qty, name: item.name[currentLang], note: entry.note || '', member: null } : null;
      }).filter(Boolean);

  historyEl.innerHTML = `
    <div class="staff-order-block">
      ${rows.map(r => {
        const noteHtml = r.note ? `
          <div class="staff-item-note">
            <svg class="staff-note-pencil" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span class="staff-note-text">${escHtml(r.note)}</span>
          </div>` : '';
        return `
          <div class="staff-list-item${r.note ? ' has-note' : ''}">
            <span class="staff-list-qty">${r.qty}×</span>
            <div class="staff-list-name-wrap">
              <span class="staff-list-name">${escHtml(r.name)}</span>
              ${r.member ? `<span class="staff-item-member">${escHtml(r.member)}</span>` : ''}
              ${noteHtml}
            </div>
          </div>`;
      }).join('')}
    </div>`;
}



/* ═══════════════════════════════════════════════════════════════════════════
   12H. SPLIT PODIUM — Gamificação do split bill
   ═══════════════════════════════════════════════════════════════════════════ */


function renderSplitPodium() {
  const podiumEl = document.getElementById('split-podium');
  if (!podiumEl) return;

  if (splitMode !== 'custom') { podiumEl.style.display = 'none'; return; }

  // Só mostra depois de todos os items terem pelo menos 1 pessoa atribuída
  const _splitEntries = getSplitEntries();
  const allAssigned = _splitEntries.length > 0 && _splitEntries.every(entry =>
    splitAssign.some(s => s && s.has(entry.refId))
  );

  if (!allAssigned) {
    podiumEl.innerHTML = `<div class="split-podium-unassigned">${t().splitPodiumUnassigned}</div>`;
    podiumEl.style.display = 'block';
    return;
  }

  const standings = Array.from({ length: splitPeople }, (_, i) => ({
    name: getPersonName(i),
    total: getPersonTotal(i)
  })).sort((a, b) => b.total - a.total);

  const max = standings[0]?.total || 1;
  const medals = ['🥇', '🥈', '🥉'];

  const allEqual = standings.every(s => Math.abs(s.total - standings[0].total) < 0.01);
  if (allEqual) {
    podiumEl.innerHTML = `
      <div class="split-podium-title">${t().splitPodiumTitle}</div>
      <div class="split-podium-allequal">${t().splitPodiumAllEqual}</div>`;
    podiumEl.style.display = 'block';
    return;
  }

  podiumEl.innerHTML = `
    <div class="split-podium-title">${t().splitPodiumTitle}</div>
    <div class="split-podium-winner">
      <span style="color:var(--gold-bright)">${escHtml(standings[0].name)}</span>
      ${t().splitPodiumWinner}
    </div>
    <div class="split-podium-bars">
      ${standings.map((s, rank) => {
        const pct = max > 0 ? (s.total / max) * 100 : 0;
        return `
          <div class="podium-row">
            <span class="podium-medal">${medals[rank] || ''}</span>
            <span class="podium-name">${escHtml(s.name)}</span>
            <div class="podium-bar-track">
              <div class="podium-bar-fill" style="width:${pct}%"></div>
            </div>
            <span class="podium-amount">${formatPrice(s.total)}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
  podiumEl.style.display = 'block';
}



function setupPersonRename() {
  const tabsEl = document.getElementById('split-people-tabs');
  if (!tabsEl) return;

  tabsEl.addEventListener('click', e => {
    const editIcon = e.target.closest('.ptab-edit-icon');
    if (!editIcon) return;
    e.stopPropagation();

    const nameEl = editIcon.closest('.ptab-name');
    if (!nameEl) return;

    haptic();
    const idx = parseInt(nameEl.dataset.renameIdx);

    // Switch active person first if needed, then re-query the name element
    if (splitActivePerson !== idx) {
      splitActivePerson = idx;
      renderSplitPeopleTabs();
      renderSplitAssignList();
      renderSplitPersonSummary();
    }

    const freshNameEl = tabsEl.querySelector(`[data-rename-idx="${idx}"]`);
    if (!freshNameEl) return;

    const input = document.createElement('input');
    input.className = 'ptab-rename-input';
    input.value = getPersonName(idx);
    input.maxLength = 12;
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('spellcheck', 'false');
    freshNameEl.replaceWith(input);
    input.focus();
    input.select();

    const save = () => {
      const newName = input.value.trim();
      customPersonNames[idx] = newName || '';
      renderSplitPanel();
    };

    input.addEventListener('blur', save, { once: true });
    input.addEventListener('keydown', ev => {
      if (ev.key === 'Enter')  { ev.preventDefault(); input.blur(); }
      if (ev.key === 'Escape') { customPersonNames[idx] = ''; input.blur(); }
    });
  });
}



/* ═══════════════════════════════════════════════════════════════════════════
   14b. NEXO PORTAL — Disponibilidade realtime + registo de chamadas/pedidos
   (todas opcionais — só activas quando CONFIG.supabaseUrl está preenchido)
   ═══════════════════════════════════════════════════════════════════════════ */


async function loadVenueConfig() {
  const { supabaseUrl, supabaseAnonKey } = (typeof CONFIG !== 'undefined' ? CONFIG : {});
  if (!supabaseUrl || !supabaseAnonKey) return;
  try {
    const sb = await loadSupabase();
    const { data } = await sb.from('venue_settings')
      .select('table_count').eq('espaco_slug', CONFIG.slug).maybeSingle();
    if (data && data.table_count) {
      nexoMaxTable = data.table_count;
      const input = document.getElementById('confirm-table-input');
      if (input) input.placeholder = `1 a ${nexoMaxTable}`;
    }
  } catch (_) { /* não-crítico — sem limite */ }
}


async function initAvailabilityRealtime() {
  const { supabaseUrl, supabaseAnonKey } = (typeof CONFIG !== 'undefined' ? CONFIG : {});
  if (!supabaseUrl || !supabaseAnonKey) return;
  try {
    const sb = await loadSupabase();
    const { data } = await sb.from('item_availability')
      .select('item_id, available')
      .eq('espaco_slug', CONFIG.slug);
    (data || []).forEach(r => { _nexoAvailability[r.item_id] = r.available !== false; });
    if (data && data.some(r => r.available === false)) renderMenu();

    // Anti-duplicados: re-correr esta função (retry) remove o canal anterior.
    if (initAvailabilityRealtime._ch) {
      try { sb.removeChannel(initAvailabilityRealtime._ch); } catch (_) {}
      initAvailabilityRealtime._ch = null;
    }
    initAvailabilityRealtime._ch = sb.channel('nexo-availability-' + CONFIG.slug)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'item_availability',
          filter: 'espaco_slug=eq.' + CONFIG.slug },
        (payload) => {
          const row = payload.new;
          if (!row || !row.item_id) return;
          _nexoAvailability[row.item_id] = row.available !== false;
          renderMenu();
        })
      .subscribe((status) => {
        // Se o realtime cair, a disponibilidade ficava presa no último estado
        // conhecido — re-liga (e refaz a query) ao fim de 15s.
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(initAvailabilityRealtime._retry);
          initAvailabilityRealtime._retry = setTimeout(initAvailabilityRealtime, 15000);
        }
      });
  } catch (_) { /* disponibilidade é opcional — menu funciona sem Supabase */ }
}


async function initMenuOverrides() {
  const { supabaseUrl, supabaseAnonKey } = (typeof CONFIG !== 'undefined' ? CONFIG : {});
  if (!supabaseUrl || !supabaseAnonKey) return;
  try {
    const sb = await loadSupabase();
    const { data } = await sb.from('menu_overrides')
      .select('*')
      .eq('espaco_slug', CONFIG.slug)
      .order('created_at', { ascending: true });
    if (!data || data.length === 0) return;

    const L = (v) => ({ pt: v, en: v, es: v, fr: v });
    let changed = false;

    data.forEach(o => {
      if (o.kind === 'custom') {
        // prato novo criado no portal — acrescenta no fim da secção
        if (o.removed) return;
        const sec = CONFIG.menu.find(s => s.id === o.section_id);
        if (!sec) return;
        sec.items.push({
          name: L(o.name || 'Novo prato'),
          desc: o.description ? L(o.description) : null,
          price: o.price || '',
          photo: o.photo_url || null,
          diet: [], allergens: [],
          _customId: o.item_id,
        });
        changed = true;
      } else {
        // override de item existente ('seccao:idx')
        const parts = (o.item_id || '').split(':');
        const sec = CONFIG.menu.find(s => s.id === parts[0]);
        const item = sec && sec.items[parseInt(parts[1], 10)];
        if (!item) return;
        if (o.removed) item._hidden = true;     // esconde sem partir os índices
        if (o.name) item.name = L(o.name);
        if (o.description) item.desc = L(o.description);
        if (o.price) item.price = o.price;
        if (o.photo_url) item.photo = o.photo_url;
        changed = true;
      }
    });

    if (changed) renderMenu();
  } catch (_) { /* edições são opcionais — menu funciona sem Supabase */ }
}


function logOrderToSupabase(channel, tableValue) {
  const { supabaseUrl, supabaseAnonKey } = (typeof CONFIG !== 'undefined' ? CONFIG : {});
  if (!supabaseUrl || !supabaseAnonKey) return;
  try {
    let items = [];
    let memberCount = 1;

    if (sharedCart && sharedCartItems && sharedCartItems.length) {
      items = sharedCartItems.map(row => {
        const item = getItemByRef(row.item_id);
        return {
          qty: row.quantity || 1,
          name: item ? (item.name.pt || item.name[currentLang]) : (row.item_name || row.item_id),
          price: item ? item.price : (row.item_price ? `€${row.item_price}` : ''),
          note: (row.note && row.note.trim()) || null,
        };
      });
      memberCount = new Set(
        sharedCartItems.map(r => r.member_key || r.member_name)
      ).size || 1;
    } else {
      items = cart.map(entry => {
        const item = getItemByRef(entry.refId);
        if (!item) return null;
        return {
          qty: entry.qty,
          name: item.name.pt || item.name[currentLang],
          price: item.price,
          note: (entry.note && entry.note.trim()) || null,
        };
      }).filter(Boolean);
    }

    if (!items.length) return;

    nexoInsert('orders_log', {
      espaco_slug: CONFIG.slug,
      table_label: (tableValue && tableValue.trim()) ? `Mesa ${tableValue.trim()}` : null,
      items,
      total: getCartTotal(),
      member_count: memberCount,
      channel,
      ...(window.NexoAccess ? NexoAccess.getOrderMetadata() : {}), // TAT source
    });
  } catch (_) {}
}



/* ═══════════════════════════════════════════════════════════════════════════
   15. SHARED CART — Mesa em Grupo (Realtime Broadcast — no SQL tables needed)
   ═══════════════════════════════════════════════════════════════════════════ */


function generateCartCode() {
  const C = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length: 6}, () => C[Math.floor(Math.random() * C.length)]).join('');
}


function nexoComandaToken(tok) {
  const key = 'nexo_ctoken_' + ((typeof CONFIG !== 'undefined' && CONFIG.slug) || '');
  if (tok !== undefined) {
    try { tok ? sessionStorage.setItem(key, tok) : sessionStorage.removeItem(key); } catch (_) {}
    return tok || null;
  }
  try { return sessionStorage.getItem(key); } catch (_) { return null; }
}

function nexoNewComandaToken() {
  try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (_) {}
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 3 | 8)).toString(16);
  });
}

function nexoTokenFetch(url, opts) {
  opts = opts || {};
  const tok = nexoComandaToken();
  if (tok) {
    const h = new Headers(opts.headers || {});
    h.set('x-comanda-token', tok);
    opts = Object.assign({}, opts, { headers: h });
  }
  return fetch(url, opts);
}


async function loadSupabase() {
  if (_supabaseClient) return _supabaseClient;
  const { supabaseUrl, supabaseAnonKey } = CONFIG;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase not configured');
  if (typeof window.supabase !== 'undefined') {
    _supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey, { global: { fetch: nexoTokenFetch } });
    return _supabaseClient;
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload = () => {
      _supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey, { global: { fetch: nexoTokenFetch } });
      resolve(_supabaseClient);
    };
    s.onerror = () => reject(new Error('Failed to load Supabase'));
    document.head.appendChild(s);
  });
}


function showCartToast(msg) {
  let el = document.getElementById('nexo-cart-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'nexo-cart-toast';
    el.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);'
      + 'background:rgba(20,20,20,0.92);color:#fff;font-size:13px;padding:8px 16px;'
      + 'border-radius:20px;z-index:99998;opacity:0;transition:opacity 0.25s;pointer-events:none;'
      + 'max-width:280px;text-align:center;white-space:pre-wrap;';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; }, 3500);
}


function syncSharedCartItems() {
  const items = [];
  for (const [key, member] of Object.entries(_memberStates)) {
    for (const item of (member.items || [])) {
      items.push({ ...item, member_name: member.name || 'Convidado', member_key: key });
    }
  }
  sharedCartItems = items;
  onCartChange();
}


async function _trackMyPresence() {
  if (!_sharedCartChannel) return;
  // Optimistic local update
  _memberStates[_myPresenceKey] = { name: sharedMemberName, items: _myCartItems };
  syncSharedCartItems();
  _saveSharedSession();
  // Broadcast to all other channel members
  try {
    await _sharedCartChannel.send({
      type: 'broadcast', event: 'state',
      payload: { memberKey: _myPresenceKey, name: sharedMemberName, items: _myCartItems },
    });
  } catch (e) { console.warn('[SharedCart] broadcast error', e); }
}


function sharedTableToast(msg) {
  let el = document.getElementById('nexo-table-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'nexo-table-toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
    const s = document.createElement('style');
    s.textContent = '#nexo-table-toast{position:fixed;left:50%;bottom:calc(96px + env(safe-area-inset-bottom));transform:translateX(-50%) translateY(20px);background:#1A1A1A;color:#fff;padding:12px 18px;border-radius:12px;font-size:14px;font-weight:600;z-index:2700;opacity:0;transition:opacity .3s ease,transform .3s ease;pointer-events:none;max-width:92vw;text-align:center;box-shadow:0 8px 28px rgba(0,0,0,.35)}#nexo-table-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}';
    document.head.appendChild(s);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(sharedTableToast._t);
  sharedTableToast._t = setTimeout(() => el.classList.remove('show'), 4000);
}


function sharedAddToCart(refId) {
  const item = getItemByRef(refId);
  if (!item) return;
  const existing = _myCartItems.find(i => i.item_id === refId);
  if (existing) {
    existing.quantity++;
  } else {
    _myCartItems.push({
      item_id: refId,
      item_name: item.name?.[currentLang] || item.name?.pt || refId,
      item_price: parsePriceToNumber(item.price) || 0,
      quantity: 1,
    });
  }
  track('item_added', { item_name: item.name?.pt, item_category: refId.split(':')[0], item_price: parsePriceToNumber(item.price) || 0 });
  _trackMyPresence();
}


function sharedDecrementCart(refId) {
  const idx = _myCartItems.findIndex(i => i.item_id === refId);
  if (idx < 0) return;
  if (_myCartItems[idx].quantity <= 1) {
    _myCartItems.splice(idx, 1);
  } else {
    _myCartItems[idx].quantity--;
  }
  _trackMyPresence();
}


function sharedRemoveFromCart(refId) {
  _myCartItems = _myCartItems.filter(i => i.item_id !== refId);
  _trackMyPresence();
}


function sharedClearCart() {
  _myCartItems = [];
  _trackMyPresence();
}


function sharedSetItemNote(refId, note) {
  const item = _myCartItems.find(i => i.item_id === refId);
  if (item) { item.note = note || null; _trackMyPresence(); }
}


async function createSharedCart(name, code) {
  const sb = await loadSupabase();
  code = code.toUpperCase();
  _myPresenceKey = 'host-' + Date.now();
  _memberStates = {};

  // Migrate local cart items
  _myCartItems = cart.map(entry => {
    const item = getItemByRef(entry.refId);
    return {
      item_id: entry.refId,
      item_name: item?.name?.[currentLang] || item?.name?.pt || entry.refId,
      item_price: parsePriceToNumber(item?.price) || 0,
      quantity: entry.qty,
      note: entry.note || null,
    };
  });
  cart = [];

  // Activate shared mode BEFORE any render so migrated items stay visible
  sharedCart = { code };
  sharedMemberName = name;
  _memberStates[_myPresenceKey] = { name, items: _myCartItems };
  localStorage.setItem('nexo_member_name', name);
  syncSharedCartItems();
  _saveSharedSession();

  const channel = sb.channel('nexo-' + CONFIG.slug + '-' + code);
  _sharedCartChannel = channel;
  _setupChannelListeners(channel);

  await new Promise((resolve, reject) => {
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await _trackMyPresence(); // broadcast initial state
        resolve();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        sharedCart = null;
        _sharedCartChannel = null;
        try { sb.removeChannel(channel); } catch (_) {}
        reject(new Error('Realtime connection failed'));
      }
    });
  });

  track('shared_cart_created', { espaco_slug: CONFIG.slug });
}


async function joinSharedCart(code, name) {
  const sb = await loadSupabase();
  code = code.toUpperCase().trim();
  _myPresenceKey = 'guest-' + Date.now();
  _memberStates = {};

  // Activate shared mode BEFORE any render
  sharedCart = { code };
  sharedMemberName = name;
  _myCartItems = [];
  _memberStates[_myPresenceKey] = { name, items: [] };
  localStorage.setItem('nexo_member_name', name);
  syncSharedCartItems();
  _saveSharedSession();

  const channel = sb.channel('nexo-' + CONFIG.slug + '-' + code);
  _sharedCartChannel = channel;
  _setupChannelListeners(channel);

  await new Promise((resolve, reject) => {
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Announce ourselves (with name+items) — others register us and reply with their state
        try {
          await channel.send({
            type: 'broadcast', event: 'hello',
            payload: { memberKey: _myPresenceKey, name: sharedMemberName, items: _myCartItems },
          });
        } catch (_) {}
        resolve();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        sharedCart = null;
        _sharedCartChannel = null;
        try { sb.removeChannel(channel); } catch (_) {}
        reject(new Error('Realtime connection failed'));
      }
    });
  });

  // Validação: o carrinho existe? Depois de nos anunciarmos, o anfitrião (e
  // outros membros) respondem com o seu estado. Se ninguém responder em ~2s,
  // o código não existe → não deixamos entrar num carrinho inexistente.
  const exists = await new Promise((resolve) => {
    const start = Date.now();
    const iv = setInterval(() => {
      const others = Object.keys(_memberStates).filter(k => k !== _myPresenceKey).length;
      if (others > 0) { clearInterval(iv); resolve(true); }
      else if (Date.now() - start > 2000) { clearInterval(iv); resolve(false); }
    }, 120);
  });
  if (!exists) {
    try { await channel.send({ type: 'broadcast', event: 'bye', payload: { memberKey: _myPresenceKey } }); } catch (_) {}
    try { sb.removeChannel(channel); } catch (_) {}
    _sharedCartChannel = null; sharedCart = null; sharedMemberName = '';
    sharedCartItems = []; _myCartItems = []; _memberStates = {}; _myPresenceKey = null;
    _clearSharedSession();
    const err = new Error('CART_NOT_FOUND'); err.code = 'NOT_FOUND'; throw err;
  }

  track('shared_cart_joined', { espaco_slug: CONFIG.slug });
}


async function leaveSharedCart() {
  if (_sharedCartChannel) {
    try {
      await _sharedCartChannel.send({ type: 'broadcast', event: 'bye', payload: { memberKey: _myPresenceKey } });
      const sb = await loadSupabase();
      sb.removeChannel(_sharedCartChannel);
    } catch (_) {}
    _sharedCartChannel = null;
  }
  sharedCart = null;
  sharedMemberName = '';
  sharedCartItems = [];
  _myCartItems = [];
  _memberStates = {};
  _myPresenceKey = null;
  cart = [];
  _clearSharedSession();
  onCartChange();
}


function _saveSharedSession() {
  if (!sharedCart || !_myPresenceKey) return;
  try {
    localStorage.setItem('nexo_shared_session_' + CONFIG.slug, JSON.stringify({
      code: sharedCart.code,
      memberKey: _myPresenceKey,
      name: sharedMemberName,
      items: _myCartItems,
      ts: Date.now(),
    }));
  } catch(e) {}
}


function _clearSharedSession() {
  try { localStorage.removeItem('nexo_shared_session_' + CONFIG.slug); } catch(e) {}
}


async function restoreSharedSession() {
  try {
    const raw = localStorage.getItem('nexo_shared_session_' + CONFIG.slug);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s?.code || !s?.memberKey || !s?.ts) return;
    if (Date.now() - s.ts > _SESSION_TTL) { _clearSharedSession(); return; }

    _myPresenceKey = s.memberKey;
    _myCartItems = s.items || [];
    sharedMemberName = s.name || 'Anfitrião';
    _memberStates = { [_myPresenceKey]: { name: sharedMemberName, items: _myCartItems } };
    sharedCart = { code: s.code };
    syncSharedCartItems();

    const sb = await loadSupabase();
    const channel = sb.channel('nexo-' + CONFIG.slug + '-' + s.code);
    _sharedCartChannel = channel;
    _setupChannelListeners(channel);

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        try {
          await channel.send({ type: 'broadcast', event: 'hello',
            payload: { memberKey: _myPresenceKey, name: sharedMemberName, items: _myCartItems } });
        } catch(_) {}
        _saveSharedSession();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        sharedCart = null;
        _sharedCartChannel = null;
        _clearSharedSession();
        try { sb.removeChannel(channel); } catch(_) {}
        onCartChange();
      }
    });
  } catch(e) {
    console.warn('[SharedCart] restore failed', e);
  }
}


function renderSharedCartHeader() {
  const el = document.getElementById('nexo-shared-cart-header');
  if (!el) return;
  if (!sharedCart) { el.style.display = 'none'; return; }
  const memberCount = Object.keys(_memberStates).length || 1;
  el.style.display = 'flex';
  el.innerHTML =
    `<span class="shared-cart-label">👥 Mesa partilhada</span>`
    + `<span class="shared-cart-code-chip" id="nexo-shared-code-chip" title="Clique para copiar">${sharedCart.code}</span>`
    + `<span class="shared-cart-members">${memberCount} ${memberCount === 1 ? 'pessoa' : 'pessoas'}</span>`
    + `<button class="shared-cart-leave-btn" id="nexo-shared-leave-btn">Sair</button>`;

  document.getElementById('nexo-shared-code-chip')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(sharedCart.code);
      const chip = document.getElementById('nexo-shared-code-chip');
      if (chip) { const orig = chip.textContent; chip.textContent = '✓ Copiado'; setTimeout(() => { if (chip) chip.textContent = orig; }, 1500); }
    } catch(_) {}
  });
  document.getElementById('nexo-shared-leave-btn')?.addEventListener('click', () => {
    if (confirm('Sair do carrinho de mesa? O teu pedido não será enviado.')) leaveSharedCart();
  });
}


function _showSharedView(view) {
  ['initial', 'create', 'join'].forEach(v => {
    const el = document.getElementById('nexo-shared-view-' + v);
    if (el) el.style.display = v === view ? '' : 'none';
  });
  if (view === 'create') {
    _pendingCartCode = generateCartCode();
    const codeEl = document.getElementById('nexo-shared-code-display');
    if (codeEl) codeEl.textContent = _pendingCartCode;
  }
  if (view === 'join') {
    setTimeout(() => document.getElementById('nexo-shared-join-code')?.focus(), 100);
  }
}


function openSharedCartSheet() {
  const sheet = document.getElementById('nexo-shared-sheet');
  if (!sheet) return;
  _showSharedView('initial');
  sheet.classList.remove('hidden');
  requestAnimationFrame(() => sheet.classList.add('open'));
}


function closeSharedCartSheet() {
  const sheet = document.getElementById('nexo-shared-sheet');
  if (!sheet) return;
  sheet.classList.remove('open');
  setTimeout(() => sheet.classList.add('hidden'), 350);
}


function setupSharedCart() {
  const hasSupabase = CONFIG.supabaseUrl
    && CONFIG.supabaseAnonKey
    && CONFIG.supabaseUrl !== '{{SUPABASE_URL}}'
    && CONFIG.supabaseAnonKey !== '{{SUPABASE_ANON_KEY}}';

  const trigger = document.getElementById('nexo-shared-cart-trigger');

  if (!hasSupabase || CONFIG.features?.sharedCart === false) {
    if (trigger) trigger.style.display = 'none';
    return;
  }

  if (trigger) {
    trigger.addEventListener('click', () => {
      haptic();
      closeModal('cart-sheet');
      openSharedCartSheet();
    });
  }

  const sheet    = document.getElementById('nexo-shared-sheet');
  const backdrop = sheet?.querySelector('.nexo-sheet-backdrop');
  const closeBtn = document.getElementById('nexo-shared-close');

  if (closeBtn)  closeBtn.addEventListener('click',  closeSharedCartSheet);
  if (backdrop)  backdrop.addEventListener('click',  closeSharedCartSheet);

  // Create flow
  document.getElementById('nexo-shared-create-btn')?.addEventListener('click', () => {
    _showSharedView('create');
  });

  document.getElementById('nexo-shared-create-confirm')?.addEventListener('click', async () => {
    const btn = document.getElementById('nexo-shared-create-confirm');
    if (btn) { btn.disabled = true; btn.textContent = 'A criar...'; }
    try {
      await createSharedCart('Anfitrião', _pendingCartCode || generateCartCode());
      closeSharedCartSheet();
      setTimeout(() => openModal('cart-sheet'), 200);
    } catch (e) {
      console.error('[SharedCart] create error', e);
      const msg = e?.message || e?.error_description || JSON.stringify(e);
      showCartToast('Erro ao criar carrinho:\n' + msg);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Criar'; }
    }
  });

  // Join flow
  document.getElementById('nexo-shared-join-btn')?.addEventListener('click', () => {
    _showSharedView('join');
  });

  const joinCode  = document.getElementById('nexo-shared-join-code');
  const joinError = document.getElementById('nexo-shared-join-error');

  async function doJoin() {
    const code = joinCode?.value.trim() || '';
    const btn  = document.getElementById('nexo-shared-join-confirm');
    if (code.length !== 6) {
      if (joinError) { joinError.textContent = 'O código tem 6 caracteres.'; joinError.style.display = 'block'; }
      joinCode?.focus(); return;
    }
    if (btn) { btn.disabled = true; btn.textContent = 'A juntar...'; }
    if (joinError) joinError.style.display = 'none';
    try {
      await joinSharedCart(code, 'Convidado');
      closeSharedCartSheet();
      setTimeout(() => openModal('cart-sheet'), 200);
    } catch (e) {
      if (joinError) {
        joinError.textContent = (e && e.code === 'NOT_FOUND')
          ? 'Código não encontrado. Confirma e tenta de novo.'
          : 'Erro de ligação — tenta novamente.';
        joinError.style.display = 'block';
      }
      joinCode?.focus();
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Juntar'; }
    }
  }

  if (joinCode) {
    joinCode.addEventListener('input', () => {
      // 6 caracteres (igual ao código gerado). NÃO entra sozinho — só ao clicar
      // "Juntar" (evitava juntar a um carrinho errado a meio da digitação).
      joinCode.value = joinCode.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6);
      if (joinError) joinError.style.display = 'none';
    });
    joinCode.addEventListener('keydown', (e) => { if (e.key === 'Enter') doJoin(); });
  }

  document.getElementById('nexo-shared-join-confirm')?.addEventListener('click', doJoin);
}



/* ═══════════════════════════════════════════════════════════════════════════
   13. BOOT
   ═══════════════════════════════════════════════════════════════════════════ */


async function initContractGate() {
  try {
    const { supabaseUrl, supabaseAnonKey, slug } = (typeof CONFIG !== 'undefined' ? CONFIG : {});
    if (!supabaseUrl || !supabaseAnonKey || !slug) return;
    const res = await fetch(supabaseUrl + '/rest/v1/rpc/espaco_active', {
      method: 'POST',
      headers: { apikey: supabaseAnonKey, Authorization: 'Bearer ' + supabaseAnonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_slug: slug }),
    });
    if (!res.ok) return;
    if ((await res.json()) === false) showMenuUnavailable();
  } catch (_) { /* fail-open */ }
}

function showMenuUnavailable() {
  if (document.getElementById('nexo-gate')) return;
  const name = (typeof CONFIG !== 'undefined' && CONFIG.name) ? CONFIG.name : 'Este espaço';
  const el = document.createElement('div');
  el.id = 'nexo-gate';
  el.setAttribute('role', 'alert');
  el.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:#0b0b0c;color:#fff;font-family:Geist,system-ui,sans-serif;text-align:center';
  el.innerHTML = '<div style="max-width:420px">'
    + '<div style="font-size:40px;margin-bottom:14px">🔒</div>'
    + '<h1 style="font-size:20px;font-weight:700;margin:0 0 10px">Menu temporariamente indisponível</h1>'
    + '<p style="font-size:14px;line-height:1.6;color:#b5b5b8;margin:0">O menu digital de <strong style="color:#fff">' + name + '</strong> está pausado neste momento. Por favor peça a carta à equipa.</p>'
    + '<p style="font-size:12px;color:#6b6b70;margin-top:18px">powered by NEXO</p>'
    + '</div>';
  document.body.appendChild(el);
  document.body.style.overflow = 'hidden';
}


/* ═══════════════════════════════════════════════════════════════════════════
   14. CALL STAFF SYSTEM — Chamar Empregado
   ═══════════════════════════════════════════════════════════════════════════ */

