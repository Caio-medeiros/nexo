/* ═══════════════════════════════════════════════════════════════════════════
   NEXO MENU — Script v4
   Mudanças desta versão:
     • Português default forte (auto-detect só muda se browser for EN/ES/FR)
     • Ranking visual #01/#02/#03 nos cards Mais Pedidos
     • Placeholders elite com gradient vermelho-vinho + inicial gold
   ═══════════════════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════════════════
   1. i18n CONSTANTES
   ═══════════════════════════════════════════════════════════════════════════ */

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

const WINE_TYPE_LABELS = {
  pt: { tinto:"Tinto", branco:"Branco", verde:"Verde", rose:"Rosé", espumante:"Espumante" },
  en: { tinto:"Red", branco:"White", verde:"Green", rose:"Rosé", espumante:"Sparkling" },
  es: { tinto:"Tinto", branco:"Blanco", verde:"Verde", rose:"Rosado", espumante:"Espumoso" },
  fr: { tinto:"Rouge", branco:"Blanc", verde:"Verde", rose:"Rosé", espumante:"Mousseux" }
};

const UI = {
  pt: {
    specialHappyHour: "Happy Hour", specialWeek: "Esta semana",
    menu: "Menu",
    mostOrdered: "Os mais pedidos", mostOrderedBadge: "Especialidades da casa",
    mostOrderedSub: "O que os nossos clientes mais escolhem",
    eliteBadge: "A experiência da casa",
    wines: "Carta de vinhos", winesBadge: "Seleção do chefe",
    wifi: "Wi-Fi", review: "Avaliar",
    googleSub: "Mais visibilidade no Maps", tripadvisorSub: "Ideal para turistas", facebookSub: "Partilha com amigos",
    reviewModalTitle: "Onde prefere avaliar?",
    instagram: "Instagram", share: "Partilhar",
    copy: "Tocar para copiar", copied: "Copiado ✓",
    address: "Morada", phone: "Telefone", hours: "Horário", all: "Tudo",
    tableHint: "Mesa",
    loyalty: "Falar com o restaurante",
    loyaltySub: "WhatsApp direto — reservas, dúvidas, sugestões",
    loyaltyCta: "Abrir WhatsApp",
    noAllergens: "Sem alergénios declarados.",
    allergenListLabel: "Contém",
    navMenu: "Menu", navTop: "Mais pedidos", navWines: "Vinhos",
    navWifi: "Wi-Fi", navContact: "Contacto", navReview: "Avaliar",
    wineFilterCountry: "País", wineFilterType: "Tipo", wineFilterGrape: "Casta",
    wineEmpty: "Nenhum vinho corresponde a estes filtros.",
    wineSpecCountry: "País", wineSpecRegion: "Região", wineSpecGrape: "Casta",
    wineSpecAbv: "Álcool", wineSpecVolume: "Volume"
  },
  en: {
    specialHappyHour: "Happy Hour", specialWeek: "This week",
    menu: "Menu",
    mostOrdered: "Most ordered", mostOrderedBadge: "House specialties",
    mostOrderedSub: "What our customers choose the most",
    eliteBadge: "The house experience",
    wines: "Wine list", winesBadge: "Chef's selection",
    wifi: "Wi-Fi", review: "Rate us",
    googleSub: "More visibility on Maps", tripadvisorSub: "Best for tourists", facebookSub: "Share with friends",
    reviewModalTitle: "Where would you like to rate us?",
    instagram: "Instagram", share: "Share",
    copy: "Tap to copy", copied: "Copied ✓",
    address: "Address", phone: "Phone", hours: "Hours", all: "All",
    tableHint: "Table",
    loyalty: "Contact the restaurant",
    loyaltySub: "Direct WhatsApp — bookings, questions, feedback",
    loyaltyCta: "Open WhatsApp",
    noAllergens: "No allergens declared.",
    allergenListLabel: "Contains",
    navMenu: "Menu", navTop: "Most ordered", navWines: "Wines",
    navWifi: "Wi-Fi", navContact: "Contact", navReview: "Rate",
    wineFilterCountry: "Country", wineFilterType: "Type", wineFilterGrape: "Grape",
    wineEmpty: "No wines match these filters.",
    wineSpecCountry: "Country", wineSpecRegion: "Region", wineSpecGrape: "Grape",
    wineSpecAbv: "ABV", wineSpecVolume: "Volume"
  },
  es: {
    specialHappyHour: "Happy Hour", specialWeek: "Esta semana",
    menu: "Menú",
    mostOrdered: "Los más pedidos", mostOrderedBadge: "Especialidades de la casa",
    mostOrderedSub: "Lo que nuestros clientes más eligen",
    eliteBadge: "La experiencia de la casa",
    wines: "Carta de vinos", winesBadge: "Selección del chef",
    wifi: "Wi-Fi", review: "Valorar",
    googleSub: "Más visibilidad en Maps", tripadvisorSub: "Ideal para turistas", facebookSub: "Compartir con amigos",
    reviewModalTitle: "¿Dónde prefiere valorar?",
    instagram: "Instagram", share: "Compartir",
    copy: "Tocar para copiar", copied: "Copiado ✓",
    address: "Dirección", phone: "Teléfono", hours: "Horario", all: "Todo",
    tableHint: "Mesa",
    loyalty: "Contactar el restaurante",
    loyaltySub: "WhatsApp directo — reservas, dudas, sugerencias",
    loyaltyCta: "Abrir WhatsApp",
    noAllergens: "Sin alérgenos declarados.",
    allergenListLabel: "Contiene",
    navMenu: "Menú", navTop: "Más pedidos", navWines: "Vinos",
    navWifi: "Wi-Fi", navContact: "Contacto", navReview: "Valorar",
    wineFilterCountry: "País", wineFilterType: "Tipo", wineFilterGrape: "Uva",
    wineEmpty: "Ningún vino coincide con estos filtros.",
    wineSpecCountry: "País", wineSpecRegion: "Región", wineSpecGrape: "Uva",
    wineSpecAbv: "Alcohol", wineSpecVolume: "Volumen"
  },
  fr: {
    specialHappyHour: "Happy Hour", specialWeek: "Cette semaine",
    menu: "Menu",
    mostOrdered: "Les plus commandés", mostOrderedBadge: "Spécialités maison",
    mostOrderedSub: "Ce que nos clients choisissent le plus",
    eliteBadge: "L'expérience maison",
    wines: "Carte des vins", winesBadge: "Sélection du chef",
    wifi: "Wi-Fi", review: "Évaluer",
    googleSub: "Plus de visibilité sur Maps", tripadvisorSub: "Idéal pour les touristes", facebookSub: "Partager avec des amis",
    reviewModalTitle: "Où préférez-vous évaluer?",
    instagram: "Instagram", share: "Partager",
    copy: "Toucher pour copier", copied: "Copié ✓",
    address: "Adresse", phone: "Téléphone", hours: "Horaires", all: "Tout",
    tableHint: "Table",
    loyalty: "Contacter le restaurant",
    loyaltySub: "WhatsApp direct — réservations, questions, retours",
    loyaltyCta: "Ouvrir WhatsApp",
    noAllergens: "Aucun allergène déclaré.",
    allergenListLabel: "Contient",
    navMenu: "Menu", navTop: "Plus commandés", navWines: "Vins",
    navWifi: "Wi-Fi", navContact: "Contact", navReview: "Évaluer",
    wineFilterCountry: "Pays", wineFilterType: "Type", wineFilterGrape: "Cépage",
    wineEmpty: "Aucun vin ne correspond à ces filtres.",
    wineSpecCountry: "Pays", wineSpecRegion: "Région", wineSpecGrape: "Cépage",
    wineSpecAbv: "Alcool", wineSpecVolume: "Volume"
  }
};


/* ═══════════════════════════════════════════════════════════════════════════
   2. STATE
   ═══════════════════════════════════════════════════════════════════════════ */

// PT default — sempre. detectLang() só muda se browser for claramente EN/ES/FR
let currentLang = 'pt';
let currentFilter = 'all';
let wineFilters = { country: 'all', type: 'all', grape: 'all' };

const urlParams = new URLSearchParams(window.location.search);
const tableNumber = urlParams.get('mesa') || urlParams.get('table') || '';

const t = () => UI[currentLang];


/* ═══════════════════════════════════════════════════════════════════════════
   3. INIT helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function applyBrandColors() {
  if (CONFIG.brandColor) {
    document.documentElement.style.setProperty('--accent', CONFIG.brandColor);
  }
  if (CONFIG.brandColorDark) {
    document.documentElement.style.setProperty('--accent-dark', CONFIG.brandColorDark);
  }
}

// PT default forte: só muda se browser for EN/ES/FR puro
function detectLang() {
  const browserLang = (navigator.language || 'pt').substring(0, 2).toLowerCase();
  // PT-BR, PT-PT, undefined → todos ficam PT
  // Só EN, ES, FR mudam
  if (['en', 'es', 'fr'].includes(browserLang)) {
    currentLang = browserLang;
    document.querySelectorAll('.lang-toggle button').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === currentLang);
    });
  }
  // Senão: fica PT (default)
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

  // Hero stamp "Desde 2009"
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

  document.title = `${CONFIG.name} — Menu`;
}


/* ═══════════════════════════════════════════════════════════════════════════
   5. RENDER — QUICK NAV
   ═══════════════════════════════════════════════════════════════════════════ */

function renderQuickNav() {
  const nav = document.getElementById('quick-nav');

  const buttons = [
    {
      label: t().navTop, target: 'section-most-ordered', highlighted: true,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
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
    {
      label: t().navContact, target: 'loyalty-card',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>`
    },
    {
      label: t().navReview, target: 'section-actions', isReview: true,
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z"/></svg>`
    }
  ];

  nav.innerHTML = buttons.map(b => {
    const classes = ['quick-nav-btn'];
    if (b.highlighted) classes.push('highlighted');
    if (b.isReview) classes.push('quick-nav-review');
    return `<button class="${classes.join(' ')}" data-target="${b.target}">${b.icon}<span>${b.label}</span></button>`;
  }).join('');
}


/* ═══════════════════════════════════════════════════════════════════════════
   6. RENDER — SPECIAL BANNER
   ═══════════════════════════════════════════════════════════════════════════ */

function renderSpecialBanner() {
  const label = CONFIG.specialMode === 'happy-hour' ? t().specialHappyHour : t().specialWeek;
  document.getElementById('special-label').textContent = label;
  document.getElementById('special-text').textContent = CONFIG.todaysSpecial[currentLang];
}


/* ═══════════════════════════════════════════════════════════════════════════
   7. RENDER — MAIS PEDIDOS (ELITE + ranking visual #01/#02/#03)
   ═══════════════════════════════════════════════════════════════════════════ */

function renderMostOrdered() {
  if (!CONFIG.mostOrdered || CONFIG.mostOrdered.length === 0) {
    document.getElementById('section-most-ordered').style.display = 'none';
    return;
  }

  // Elite badge "A experiência da casa"
  const eliteBadgeText = document.getElementById('elite-badge-text');
  if (eliteBadgeText) eliteBadgeText.textContent = t().eliteBadge;

  document.getElementById('most-ordered-title').textContent = t().mostOrdered;
  const subEl = document.getElementById('most-ordered-sub');
  if (subEl) subEl.textContent = t().mostOrderedSub;

  const list = document.getElementById('most-ordered-list');

  list.innerHTML = CONFIG.mostOrdered.map((ref, idx) => {
    const [sectionId, itemIdx] = ref.refId.split(':');
    const section = CONFIG.menu.find(s => s.id === sectionId);
    if (!section) return '';
    const item = section.items[parseInt(itemIdx)];
    if (!item) return '';

    // Ranking automático: #01, #02, #03
    const rank = String(idx + 1).padStart(2, '0');

    return `
      <div class="most-ordered-card" data-item="${sectionId}:${itemIdx}">
        <span class="most-ordered-rank">#${rank}</span>
        <div class="most-ordered-card-badge">${ref.badge[currentLang]}</div>
        <div class="most-ordered-card-name">${item.name[currentLang]}</div>
        <div class="most-ordered-card-desc">${item.desc[currentLang] || ''}</div>
        <div class="most-ordered-card-price">${item.price}</div>
      </div>
    `;
  }).join('');
}


/* ═══════════════════════════════════════════════════════════════════════════
   8. RENDER — CATEGORY TABS + DIET FILTER
   ═══════════════════════════════════════════════════════════════════════════ */

function renderCategoryTabs() {
  const tabs = CONFIG.menu.map((sec, i) =>
    `<button class="category-tab ${i === 0 ? 'active' : ''}" data-category="${sec.id}">${sec.section[currentLang]}</button>`
  ).join('');
  document.getElementById('category-tabs').innerHTML = tabs;
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


/* ═══════════════════════════════════════════════════════════════════════════
   9. RENDER — MENU
   ═══════════════════════════════════════════════════════════════════════════ */

function renderMenu() {
  const html = CONFIG.menu.map(sec => `
    <section class="menu-section" id="section-${sec.id}">
      <h2 class="menu-section-title">${sec.section[currentLang]}</h2>
      ${sec.desc && sec.desc[currentLang] ? `<p class="menu-section-desc">${sec.desc[currentLang]}</p>` : ''}
      ${sec.items.map((item, idx) => {
        const matches = currentFilter === 'all' || (item.diet || []).includes(currentFilter);
        return `
        <article class="menu-item ${matches ? '' : 'hidden'}" data-item="${sec.id}:${idx}">
          <div class="menu-item-body">
            <h3 class="menu-item-name">${item.name[currentLang]}</h3>
            ${item.desc && item.desc[currentLang] ? `<p class="menu-item-desc">${item.desc[currentLang]}</p>` : ''}
            <div class="menu-item-meta">
              <span class="menu-item-price">${item.price}</span>
              ${(item.diet || []).length > 0 ? `
                <div class="menu-item-tags">
                  ${item.diet.map(d => `<span class="tag tag-diet">${d}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
          ${item.photo
            ? `<img class="menu-item-photo" src="${item.photo}" loading="lazy" alt="${item.name[currentLang]}">`
            : `<div class="menu-item-photo-placeholder">${item.name[currentLang][0].toUpperCase()}</div>`
          }
        </article>
        `;
      }).join('')}
    </section>
  `).join('');
  document.getElementById('menu').innerHTML = html;
}


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
    w.grape.split(',').forEach(g => allGrapes.add(g.trim()));
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

function renderWineList() {
  if (!CONFIG.wines || CONFIG.wines.length === 0) {
    document.getElementById('wine-list').innerHTML = '';
    return;
  }

  const filtered = CONFIG.wines.filter(w => {
    if (wineFilters.country !== 'all' && w.country !== wineFilters.country) return false;
    if (wineFilters.type !== 'all' && w.type !== wineFilters.type) return false;
    if (wineFilters.grape !== 'all' && !w.grape.toLowerCase().includes(wineFilters.grape.toLowerCase())) return false;
    return true;
  });

  if (filtered.length === 0) {
    document.getElementById('wine-list').innerHTML = `<div class="wine-empty">${t().wineEmpty}</div>`;
    return;
  }

  const bottleIcon = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M8 2h8l-1 11a3 3 0 01-6 0L8 2z"/>
      <line x1="12" y1="13" x2="12" y2="22"/>
      <line x1="8" y1="22" x2="16" y2="22"/>
    </svg>
  `;

  const html = filtered.map(w => {
    const realIdx = CONFIG.wines.indexOf(w);
    const typeLabel = WINE_TYPE_LABELS[currentLang][w.type] || w.type;

    return `
      <div class="wine-card-item" data-wine-idx="${realIdx}">
        <div class="wine-card-photo ${w.photo ? 'has-image' : ''}" ${w.photo ? `style="background-image:url('${w.photo}')"` : ''}>
          ${!w.photo ? bottleIcon : ''}
        </div>
        <div class="wine-card-body">
          <div class="wine-card-name">${w.name}</div>
          <div class="wine-card-meta">
            <span class="wine-meta-pill wine-meta-country">${w.country}</span>
            <span class="wine-meta-pill wine-meta-type-${w.type}">${typeLabel}</span>
            <span class="wine-meta-pill">${w.abv}</span>
          </div>
          <div class="wine-card-desc">${w.desc}</div>
          <div class="wine-card-footer">
            <span class="wine-card-price">${w.price}</span>
            <span class="wine-card-volume">${w.volume}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('wine-list').innerHTML = html;
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

function renderActions() {
  document.getElementById('btn-review-label').textContent = t().review;
  const tableText = tableNumber ? ` · ${t().tableHint} ${tableNumber}` : '';
  document.getElementById('btn-review-sub').textContent = `Google · TripAdvisor · Facebook${tableText}`;

  document.getElementById('btn-instagram').href = `https://instagram.com/${CONFIG.instagramHandle}`;
  document.getElementById('btn-instagram-label').textContent = t().instagram;
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
  document.getElementById('review-modal-title').textContent = t().reviewModalTitle;
  document.getElementById('review-google').href = CONFIG.googleReviewUrl;
  document.getElementById('review-tripadvisor').href = CONFIG.tripadvisorReviewUrl;
  document.getElementById('review-facebook').href = CONFIG.facebookReviewUrl;
  document.getElementById('review-google-sub').textContent = t().googleSub;
  document.getElementById('review-tripadvisor-sub').textContent = t().tripadvisorSub;
  document.getElementById('review-facebook-sub').textContent = t().facebookSub;
}

function renderAll() {
  renderHero();
  renderQuickNav();
  renderSpecialBanner();
  renderMostOrdered();
  renderCategoryTabs();
  renderDietFilter();
  renderMenu();
  renderWineFilters();
  renderWineList();
  renderWifi();
  renderLoyalty();
  renderActions();
  renderFooter();
  renderReviewModal();
  if (window._attachMenuObserver) window._attachMenuObserver();
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

// Language toggle
function setupLanguage() {
  document.querySelectorAll('.lang-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-toggle button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLang = btn.dataset.lang;
      renderAll();
    });
  });
}

// Quick nav
function setupQuickNav() {
  document.getElementById('quick-nav').addEventListener('click', e => {
    const btn = e.target.closest('[data-target]');
    if (!btn) return;
    if (btn.classList.contains('quick-nav-review')) {
      openModal('review-modal');
      return;
    }
    scrollToTarget(btn.dataset.target);
  });
}

// Diet filter
function setupDietFilter() {
  document.getElementById('diet-filter').addEventListener('click', e => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    currentFilter = btn.dataset.filter;
    renderDietFilter();
    renderMenu();
  });
}

// Category tabs + scroll-spy
function setupCategoryTabs() {
  document.getElementById('category-tabs').addEventListener('click', e => {
    const tab = e.target.closest('[data-category]');
    if (!tab) return;
    scrollToTarget(`section-${tab.dataset.category}`);
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id.replace('section-', '');
        document.querySelectorAll('.category-tab').forEach(tab => {
          tab.classList.toggle('active', tab.dataset.category === id);
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
}

// Wine filters
function setupWineFilters() {
  const filtersEl = document.getElementById('wine-filters');
  if (!filtersEl) return;
  filtersEl.addEventListener('click', e => {
    const chip = e.target.closest('[data-filter-value]');
    if (!chip) return;
    const type = chip.dataset.filterType;
    const value = chip.dataset.filterValue;
    wineFilters[type] = value;
    renderWineFilters();
    renderWineList();
  });
}

// Most ordered → modal
function setupMostOrdered() {
  const list = document.getElementById('most-ordered-list');
  if (!list) return;
  list.addEventListener('click', e => {
    const card = e.target.closest('[data-item]');
    if (!card) return;
    const [sectionId, itemIdx] = card.dataset.item.split(':');
    openItemModal(sectionId, parseInt(itemIdx));
  });
}

// Menu clicks → modal
function setupMenuClicks() {
  document.getElementById('menu').addEventListener('click', e => {
    const item = e.target.closest('[data-item]');
    if (!item) return;
    const [sectionId, itemIdx] = item.dataset.item.split(':');
    openItemModal(sectionId, parseInt(itemIdx));
  });
}

function openItemModal(sectionId, itemIdx) {
  const section = CONFIG.menu.find(s => s.id === sectionId);
  if (!section) return;
  const item = section.items[itemIdx];
  if (!item) return;

  const photoEl = document.getElementById('item-modal-photo');
  if (item.photo) {
    photoEl.style.backgroundImage = `url('${item.photo}')`;
    photoEl.textContent = '';
    photoEl.classList.remove('is-placeholder');
  } else {
    photoEl.style.backgroundImage = '';
    photoEl.textContent = item.name[currentLang][0].toUpperCase();
    photoEl.classList.add('is-placeholder');
  }

  document.getElementById('item-modal-name').textContent = item.name[currentLang];
  document.getElementById('item-modal-price').textContent = item.price;

  const descEl = document.getElementById('item-modal-desc');
  if (item.desc && item.desc[currentLang]) {
    descEl.textContent = item.desc[currentLang];
    descEl.style.display = 'block';
  } else {
    descEl.style.display = 'none';
  }

  const tagsEl = document.getElementById('item-modal-tags');
  const dietTags = (item.diet || []).map(d =>
    `<span class="tag tag-diet">${DIET_LABELS[currentLang][d] || d}</span>`
  ).join('');
  const allergenTags = (item.allergens || []).length > 0
    ? `<div style="width:100%;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);font-size:11px;color:var(--text-muted);font-weight:600;">
         <span style="text-transform:uppercase;letter-spacing:0.5px;">${t().allergenListLabel}:</span>
         ${item.allergens.map(a => ` ${ALLERGENS_EU[currentLang][a]}`).join(' · ')}
       </div>`
    : `<div style="width:100%;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);font-size:11px;color:var(--text-muted);font-style:italic;">${t().noAllergens}</div>`;

  tagsEl.innerHTML = dietTags + allergenTags;

  openModal('item-modal');
}

// Wine clicks → modal
function setupWineClicks() {
  const listEl = document.getElementById('wine-list');
  if (!listEl) return;
  listEl.addEventListener('click', e => {
    const card = e.target.closest('[data-wine-idx]');
    if (!card) return;
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

  openModal('wine-modal');
}

// Review button
function setupReviewButton() {
  document.getElementById('btn-review').addEventListener('click', () => {
    openModal('review-modal');
  });
}

// Close modals
function setupModalCloses() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.show').forEach(m => closeModal(m.id));
    }
  });
}

// Wi-Fi copy
function setupWifiCopy() {
  document.getElementById('wifi-card').addEventListener('click', () => {
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

// Loyalty → WhatsApp
function setupLoyalty() {
  document.getElementById('loyalty-btn').addEventListener('click', () => {
    const msg = CONFIG.whatsappLoyaltyMessage[currentLang] || CONFIG.whatsappLoyaltyMessage.pt;
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  });
}

// Share
function setupShare() {
  document.getElementById('share-btn').addEventListener('click', async () => {
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


/* ═══════════════════════════════════════════════════════════════════════════
   13. BOOT
   ═══════════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  applyBrandColors();
  detectLang();
  renderAll();
  setupLanguage();
  setupQuickNav();
  setupDietFilter();
  setupCategoryTabs();
  setupWineFilters();
  setupMostOrdered();
  setupMenuClicks();
  setupWineClicks();
  setupReviewButton();
  setupModalCloses();
  setupWifiCopy();
  setupLoyalty();
  setupShare();
});