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

/* Badges psicológicos — emoji + texto multilíngue */
const ITEM_BADGES = {
  popular: { emoji: "🔥", pt: "Popular",        en: "Popular",       es: "Popular",         fr: "Populaire"     },
  chef:    { emoji: "⭐", pt: "Escolha do Chef", en: "Chef's Choice", es: "Elección del Chef", fr: "Choix du Chef" },
  new:     { emoji: "🆕", pt: "Novo",            en: "New",           es: "Nuevo",            fr: "Nouveau"       }
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
    googleSub: "Mais visibilidade no Maps", thefork: "TheFork", theforkSub: "A nossa comunidade",
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
    wineSpecAbv: "Álcool", wineSpecVolume: "Volume",
    upsellTitle: "Combina com...",
    // Order system
    addToOrder: "Adicionar ao pedido", addedToOrder: "Adicionado ✓",
    cartItem: "item", cartItems: "itens",
    cartTitle: "O meu pedido", cartEmpty: "Ainda não adicionou nada.",
    cartTotal: "Total", cartShowStaff: "Mostrar ao staff", cartClear: "Limpar pedido",
    staffHelper: "Mostre este ecrã ao staff para pedir"
  },
  en: {
    specialHappyHour: "Happy Hour", specialWeek: "This week",
    menu: "Menu",
    mostOrdered: "Most ordered", mostOrderedBadge: "House specialties",
    mostOrderedSub: "What our customers choose the most",
    eliteBadge: "The house experience",
    wines: "Wine list", winesBadge: "Chef's selection",
    wifi: "Wi-Fi", review: "Rate us",
    googleSub: "More visibility on Maps", thefork: "TheFork", theforkSub: "Our community",
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
    wineSpecAbv: "ABV", wineSpecVolume: "Volume",
    upsellTitle: "Goes well with...",
    addToOrder: "Add to order", addedToOrder: "Added ✓",
    cartItem: "item", cartItems: "items",
    cartTitle: "My order", cartEmpty: "Nothing added yet.",
    cartTotal: "Total", cartShowStaff: "Show to staff", cartClear: "Clear order",
    staffHelper: "Show this screen to staff to order"
  },
  es: {
    specialHappyHour: "Happy Hour", specialWeek: "Esta semana",
    menu: "Menú",
    mostOrdered: "Los más pedidos", mostOrderedBadge: "Especialidades de la casa",
    mostOrderedSub: "Lo que nuestros clientes más eligen",
    eliteBadge: "La experiencia de la casa",
    wines: "Carta de vinos", winesBadge: "Selección del chef",
    wifi: "Wi-Fi", review: "Valorar",
    googleSub: "Más visibilidad en Maps", thefork: "TheFork", theforkSub: "Nuestra comunidad",
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
    wineSpecAbv: "Alcohol", wineSpecVolume: "Volumen",
    upsellTitle: "Combina con...",
    addToOrder: "Añadir al pedido", addedToOrder: "Añadido ✓",
    cartItem: "artículo", cartItems: "artículos",
    cartTitle: "Mi pedido", cartEmpty: "Aún no ha añadido nada.",
    cartTotal: "Total", cartShowStaff: "Mostrar al staff", cartClear: "Vaciar pedido",
    staffHelper: "Muestre esta pantalla al staff para pedir"
  },
  fr: {
    specialHappyHour: "Happy Hour", specialWeek: "Cette semaine",
    menu: "Menu",
    mostOrdered: "Les plus commandés", mostOrderedBadge: "Spécialités maison",
    mostOrderedSub: "Ce que nos clients choisissent le plus",
    eliteBadge: "L'expérience maison",
    wines: "Carte des vins", winesBadge: "Sélection du chef",
    wifi: "Wi-Fi", review: "Évaluer",
    googleSub: "Plus de visibilité sur Maps", thefork: "TheFork", theforkSub: "Notre communauté",
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
    wineSpecAbv: "Alcool", wineSpecVolume: "Volume",
    upsellTitle: "Se marie avec...",
    addToOrder: "Ajouter à la commande", addedToOrder: "Ajouté ✓",
    cartItem: "article", cartItems: "articles",
    cartTitle: "Ma commande", cartEmpty: "Rien n'a été ajouté.",
    cartTotal: "Total", cartShowStaff: "Montrer au personnel", cartClear: "Vider",
    staffHelper: "Montrez cet écran au personnel pour commander"
  }
};


/* ═══════════════════════════════════════════════════════════════════════════
   2. STATE
   ═══════════════════════════════════════════════════════════════════════════ */

let currentLang = 'pt';
let currentFilter = 'all';
let wineFilters = { country: 'all', type: 'all', grape: 'all' };

/* ─── ORDER SYSTEM STATE ─── */
// Cart: array de objetos { refId: "sectionId:itemIdx", qty: number }
// Nunca persiste (intencional) — estado morre ao fechar o separador
let cart = [];

// Order ID curto, gerado uma vez por sessão (staff referencia se várias mesas mostram)
const ORDER_ID = Math.random().toString(36).substring(2, 6).toUpperCase();

/* ─── SPLIT BILL STATE & i18n (declared early so renderCartSheet can use ts()) ─── */
const SPLIT_MAX = 10;
const SPLIT_MIN = 2;

const PERSON_NAMES = {
  pt: ['Pessoa 1','Pessoa 2','Pessoa 3','Pessoa 4','Pessoa 5','Pessoa 6','Pessoa 7','Pessoa 8','Pessoa 9','Pessoa 10'],
  en: ['Person 1','Person 2','Person 3','Person 4','Person 5','Person 6','Person 7','Person 8','Person 9','Person 10'],
  es: ['Persona 1','Persona 2','Persona 3','Persona 4','Persona 5','Persona 6','Persona 7','Persona 8','Persona 9','Persona 10'],
  fr: ['Personne 1','Personne 2','Personne 3','Personne 4','Personne 5','Personne 6','Personne 7','Personne 8','Personne 9','Personne 10']
};

const SPLIT_UI = {
  pt: {
    tabOrder: '🧾 Pedido', tabSplit: '➗ Dividir',
    people: 'Pessoas',
    modeEqual: 'Partes iguais', modeCustom: 'Por item',
    perPerson: 'por pessoa',
    unassigned: 'Não atribuído',
    totalNote: (n) => `Total ${formatPrice(getCartTotal())} ÷ ${n} pessoas`,
    myItems: 'Os meus itens',
    subtotal: 'Subtotal',
  },
  en: {
    tabOrder: '🧾 Order', tabSplit: '➗ Split',
    people: 'People',
    modeEqual: 'Equal split', modeCustom: 'By item',
    perPerson: 'per person',
    unassigned: 'Unassigned',
    totalNote: (n) => `Total ${formatPrice(getCartTotal())} ÷ ${n} people`,
    myItems: 'My items',
    subtotal: 'Subtotal',
  },
  es: {
    tabOrder: '🧾 Pedido', tabSplit: '➗ Dividir',
    people: 'Personas',
    modeEqual: 'A partes iguales', modeCustom: 'Por ítem',
    perPerson: 'por persona',
    unassigned: 'Sin asignar',
    totalNote: (n) => `Total ${formatPrice(getCartTotal())} ÷ ${n} personas`,
    myItems: 'Mis ítems',
    subtotal: 'Subtotal',
  },
  fr: {
    tabOrder: '🧾 Commande', tabSplit: '➗ Partager',
    people: 'Personnes',
    modeEqual: 'Parts égales', modeCustom: 'Par article',
    perPerson: 'par personne',
    unassigned: 'Non attribué',
    totalNote: (n) => `Total ${formatPrice(getCartTotal())} ÷ ${n} personnes`,
    myItems: 'Mes articles',
    subtotal: 'Sous-total',
  }
};

const ts = () => SPLIT_UI[currentLang] || SPLIT_UI.pt;

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

function detectLang() {
  const browserLang = (navigator.language || 'pt').substring(0, 2).toLowerCase();
  // Se o browser estiver numa das línguas suportadas (excepto PT que já é default), muda.
  if (['en', 'es', 'fr'].includes(browserLang)) {
    currentLang = browserLang;
    document.querySelectorAll('.lang-toggle button').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === currentLang);
    });
  }
}

/* Haptic feedback subtil — chama se disponível */
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

  document.title = `${CONFIG.name} — Menu`;
}


/* ═══════════════════════════════════════════════════════════════════════════
   5. RENDER — QUICK NAV
   ═══════════════════════════════════════════════════════════════════════════ */

function renderQuickNav() {
  const nav = document.getElementById('quick-nav');

  const buttons = [
        {
      label: t().navReview, target: 'section-actions', isReview: true,
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z"/></svg>`
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
   6. RENDER — BANNER TEMPO-DEPENDENTE (v5)
   Lê CONFIG.timeBanners e mostra o banner activo pela hora actual.
   Fora de qualquer janela horária → banner oculto.
   ═══════════════════════════════════════════════════════════════════════════ */

function getActiveBanner() {
  // Suporte para o formato legado (specialMode + todaysSpecial)
  if (!CONFIG.timeBanners || CONFIG.timeBanners.length === 0) {
    if (CONFIG.todaysSpecial) {
      const label = CONFIG.specialMode === 'happy-hour' ? t().specialHappyHour : t().specialWeek;
      return { label, text: CONFIG.todaysSpecial[currentLang] || '' };
    }
    return null;
  }

  const now = new Date();
  const h = now.getHours();
  const day = now.getDay(); // 0=Dom 1=Seg … 6=Sáb

  for (const banner of CONFIG.timeBanners) {
    // Verificar dia da semana (omitir = todos os dias)
    if (banner.days && banner.days.length > 0 && !banner.days.includes(day)) continue;
    // Verificar intervalo horário
    if (h >= banner.startH && h < banner.endH) {
      return {
        label: (banner.label[currentLang] || banner.label.pt || ''),
        text:  (banner.text[currentLang]  || banner.text.pt  || '')
      };
    }
  }
  return null; // fora de qualquer janela → sem banner
}

function renderSpecialBanner() {
  const el = document.getElementById('special-banner');
  const banner = getActiveBanner();

  if (!banner) {
    el.style.display = 'none';
    return;
  }

  el.style.display = '';
  document.getElementById('special-label').textContent = banner.label;
  document.getElementById('special-text').textContent = banner.text;
}


/* ═══════════════════════════════════════════════════════════════════════════
   7. RENDER — MAIS PEDIDOS
   ═══════════════════════════════════════════════════════════════════════════ */

function renderMostOrdered() {
  if (!CONFIG.mostOrdered || CONFIG.mostOrdered.length === 0) {
    document.getElementById('section-most-ordered').style.display = 'none';
    return;
  }

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

    const rank = String(idx + 1).padStart(2, '0');

    // Badge psicológico no card elite
    const badgeHtml = item.badge && ITEM_BADGES[item.badge]
      ? ``
      : '';

    return `
      <div class="most-ordered-card" data-item="${sectionId}:${itemIdx}">
        <span class="most-ordered-rank">#${rank}</span>
        <div class="most-ordered-card-badge">${ref.badge[currentLang]}</div>
        ${badgeHtml}
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

function renderMenu() {
  const html = CONFIG.menu.map(sec => `
    <section class="menu-section" id="section-${sec.id}">
      <h2 class="menu-section-title">${sec.section[currentLang]}</h2>
      ${sec.desc && sec.desc[currentLang] ? `<p class="menu-section-desc">${sec.desc[currentLang]}</p>` : ''}
      ${sec.items.map((item, idx) => {
        const matches = currentFilter === 'all' || (item.diet || []).includes(currentFilter);

        // Badge psicológico
        const badgeHtml = item.badge && ITEM_BADGES[item.badge]
          ? `<div class="item-badge item-badge-${item.badge}">${ITEM_BADGES[item.badge].emoji} ${ITEM_BADGES[item.badge][currentLang]}</div>`
          : '';

        // Botão "+" só aparece se item tem preço parseable (€)
        const refId = `${sec.id}:${idx}`;
        const canOrder = parsePriceToNumber(item.price) !== null;
        const inCart = getCartQty(refId);
        const addBtnHtml = canOrder ? `
          <button class="menu-item-add-btn ${inCart > 0 ? 'added' : ''}" data-add-ref="${refId}" aria-label="Adicionar" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            ${inCart > 0 ? `<span class="qty-badge">${inCart}</span>` : ''}
          </button>
        ` : '';

        return `
        <article class="menu-item ${matches ? '' : 'hidden'}" data-item="${refId}">
          <div class="menu-item-body">
            ${badgeHtml}
            <h3 class="menu-item-name">${item.name[currentLang]}</h3>
            ${item.desc && item.desc[currentLang] ? `<p class="menu-item-desc">${item.desc[currentLang]}</p>` : ''}
            <div class="menu-item-meta">
              <span class="menu-item-price">${item.price}</span>
              ${(item.diet || []).length > 0 ? `
                <div class="menu-item-tags">
                  ${item.diet.map(d => `<span class="tag tag-diet">${d}</span>`).join('')}
                </div>
              ` : ''}
              ${addBtnHtml}
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
  document.getElementById('review-thefork').href = CONFIG.theForkReviewUrl;
  document.getElementById('review-google-sub').textContent = t().googleSub;
  document.getElementById('review-thefork-sub').textContent = t().theforkSub;
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
  // Cart UI usa textos i18n — re-render quando idioma muda
  if (typeof renderCartPill === 'function') renderCartPill();
  if (typeof renderCartSheet === 'function') renderCartSheet();
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
    haptic();
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
    haptic();
    currentFilter = btn.dataset.filter;
    renderDietFilter();
    renderMenu();
    if (window._attachMenuObserver) window._attachMenuObserver();
  });
}

// Category tabs + scroll-spy + tab ink
function setupCategoryTabs() {
  const tabsEl = document.getElementById('category-tabs');

  tabsEl.addEventListener('click', e => {
    const tab = e.target.closest('[data-category]');
    if (!tab) return;
    haptic();
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
}

// Wine filters
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

// Most ordered → modal
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

// Menu clicks → modal + bounce tátil
function setupMenuClicks() {
  document.getElementById('menu').addEventListener('click', e => {
    // Ignorar clicks no botão "+" (tratados pelo setupMenuAddButtons)
    if (e.target.closest('[data-add-ref]')) return;
    const articleEl = e.target.closest('[data-item]');
    if (!articleEl) return;
    haptic();
    // Bounce visual
    articleEl.classList.remove('tap-bounce');
    void articleEl.offsetWidth; // reflow
    articleEl.classList.add('tap-bounce');
    setTimeout(() => articleEl.classList.remove('tap-bounce'), 300);

    const [sectionId, itemIdx] = articleEl.dataset.item.split(':');
    openItemModal(sectionId, parseInt(itemIdx));
  });
}

// Abrir modal de item — com upsell (v5)
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

  // ═══ Primary CTA: Adicionar ao pedido ═══
  const addBtn = document.getElementById('item-modal-add');
  const addLabel = document.getElementById('item-modal-add-label');
  if (addBtn && addLabel) {
    const refId = `${sectionId}:${itemIdx}`;
    const canOrder = parsePriceToNumber(item.price) !== null;
    if (canOrder) {
      addBtn.style.display = 'flex';
      addBtn.dataset.addRef = refId;
      addLabel.textContent = t().addToOrder;
      addBtn.classList.remove('just-added');
    } else {
      // Items com P.V.P. (preço não definido) — não ordenáveis via cart
      addBtn.style.display = 'none';
    }
  }

  // ═══ UPSELL "Combina com..." ═══
  const upsellEl = document.getElementById('item-modal-upsell');
  if (upsellEl) {
    if (item.upsell && item.upsell.length > 0) {
      const upsellItems = item.upsell.map(ref => {
        const [sid, iidxStr] = ref.split(':');
        const sec = CONFIG.menu.find(s => s.id === sid);
        return sec ? { item: sec.items[parseInt(iidxStr)], ref } : null;
      }).filter(Boolean);

      if (upsellItems.length > 0) {
        upsellEl.innerHTML = `
          <div class="upsell-title">${t().upsellTitle}</div>
          <div class="upsell-list">
            ${upsellItems.map(({ item: ui, ref }) => `
              <div class="upsell-card" data-upsell-ref="${ref}">
                <div class="upsell-card-name">${ui.name[currentLang]}</div>
                <div class="upsell-card-price">${ui.price}</div>
              </div>
            `).join('')}
          </div>
        `;
        upsellEl.style.display = 'block';

        // Click nos cards de upsell → abre esse item
        upsellEl.querySelectorAll('[data-upsell-ref]').forEach(card => {
          card.addEventListener('click', e => {
            e.stopPropagation();
            haptic();
            const [sid, iidxStr] = card.dataset.upsellRef.split(':');
            closeModal('item-modal');
            setTimeout(() => openItemModal(sid, parseInt(iidxStr)), 220);
          });
        });
      } else {
        upsellEl.style.display = 'none';
      }
    } else {
      upsellEl.style.display = 'none';
    }
  }

  openModal('item-modal');
}

// Wine clicks → modal
function setupWineClicks() {
  const listEl = document.getElementById('wine-list');
  if (!listEl) return;
  listEl.addEventListener('click', e => {
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

  openModal('wine-modal');
}

// Review button
function setupReviewButton() {
  document.getElementById('btn-review').addEventListener('click', () => {
    haptic();
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
    haptic();
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
    haptic();
    const msg = CONFIG.whatsappLoyaltyMessage[currentLang] || CONFIG.whatsappLoyaltyMessage.pt;
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  });
}

// Share
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

/* ═══ BACK TO TOP (v5) ═══
   Aparece após 400px de scroll, desaparece ao voltar ao topo.
   ════════════════════════ */
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

// Converte "4,95€" ou "€12.50" ou "22,50€" → número. Retorna null se não parseable (P.V.P.).
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

// Formata número para string de preço com EUR ("12,50 €")
function formatPrice(num) {
  return num.toFixed(2).replace('.', ',') + '€';
}

// Retorna quantidade do item no cart (0 se não existe)
function getCartQty(refId) {
  const entry = cart.find(c => c.refId === refId);
  return entry ? entry.qty : 0;
}

// Adiciona 1x ao cart (ou incrementa)
function addToCart(refId) {
  const entry = cart.find(c => c.refId === refId);
  if (entry) {
    entry.qty += 1;
  } else {
    cart.push({ refId, qty: 1 });
  }
  onCartChange();
}

// Decrementa 1x (se 0, remove)
function decrementCart(refId) {
  const entry = cart.find(c => c.refId === refId);
  if (!entry) return;
  entry.qty -= 1;
  if (entry.qty <= 0) {
    cart = cart.filter(c => c.refId !== refId);
  }
  onCartChange();
}

// Remove completamente
function removeFromCart(refId) {
  cart = cart.filter(c => c.refId !== refId);
  onCartChange();
}

// Limpa tudo
function clearCart() {
  cart = [];
  onCartChange();
}

// Total do cart em número
function getCartTotal() {
  return cart.reduce((sum, entry) => {
    const item = getItemByRef(entry.refId);
    if (!item) return sum;
    const price = parsePriceToNumber(item.price);
    return sum + (price || 0) * entry.qty;
  }, 0);
}

// Total de items (soma das quantidades)
function getCartItemCount() {
  return cart.reduce((sum, entry) => sum + entry.qty, 0);
}

// Helper: get item object por refId
function getItemByRef(refId) {
  const [sid, iidxStr] = refId.split(':');
  const sec = CONFIG.menu.find(s => s.id === sid);
  if (!sec) return null;
  return sec.items[parseInt(iidxStr)] || null;
}

// Chamado sempre que o cart muda — atualiza UI
function onCartChange() {
  renderCartPill();
  renderCartSheet();
  updateAddBtnBadges();
  if (typeof onCartChangeSplitHook === 'function') onCartChangeSplitHook();
}

// Render: atualiza o floating pill
function renderCartPill() {
  const pill = document.getElementById('cart-pill');
  const textEl = document.getElementById('cart-pill-text');
  const totalEl = document.getElementById('cart-pill-total');
  if (!pill || !textEl || !totalEl) return;

  const count = getCartItemCount();

  if (count === 0) {
    pill.classList.remove('show');
    document.body.classList.remove('has-cart');
    return;
  }

  const label = count === 1 ? t().cartItem : t().cartItems;
  textEl.textContent = `${count} ${label}`;

  const total = getCartTotal();
  if (total > 0) {
    totalEl.textContent = formatPrice(total);
    totalEl.classList.remove('hidden');
  } else {
    totalEl.classList.add('hidden');
  }

  pill.classList.add('show');
  document.body.classList.add('has-cart');
}

// Render: bottom sheet com lista completa
function renderCartSheet() {
  const titleEl = document.getElementById('cart-sheet-title');
  const listEl = document.getElementById('cart-list');
  const totalLabel = document.getElementById('cart-total-label');
  const totalValue = document.getElementById('cart-total-value');
  const showStaffLabel = document.getElementById('cart-show-staff-label');
  const clearBtn = document.getElementById('cart-clear-btn');
  const showStaffBtn = document.getElementById('cart-show-staff-btn');
  if (!listEl) return;

  if (titleEl) titleEl.textContent = t().cartTitle;
  if (totalLabel) totalLabel.textContent = t().cartTotal;
  if (showStaffLabel) showStaffLabel.textContent = t().cartShowStaff;
  if (clearBtn) clearBtn.textContent = t().cartClear;

  // Always set tab labels (fix: they were only set when split tab was clicked)
  const tabOrderEl = document.getElementById('tab-order');
  const tabSplitEl = document.getElementById('tab-split');
  if (tabOrderEl) tabOrderEl.textContent = ts().tabOrder;
  if (tabSplitEl) tabSplitEl.textContent = ts().tabSplit;

  if (cart.length === 0) {
    listEl.innerHTML = `<div class="cart-empty">${t().cartEmpty}</div>`;
    if (totalValue) totalValue.textContent = formatPrice(0);
    if (showStaffBtn) showStaffBtn.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
    return;
  }

  if (showStaffBtn) showStaffBtn.style.display = 'flex';
  if (clearBtn) clearBtn.style.display = 'block';

  listEl.innerHTML = cart.map(entry => {
    const item = getItemByRef(entry.refId);
    if (!item) return '';
    const unitPrice = parsePriceToNumber(item.price) || 0;
    const lineTotal = unitPrice * entry.qty;
    return `
      <div class="cart-list-item">
        <span class="cart-item-qty">${entry.qty}×</span>
        <span class="cart-item-name">${item.name[currentLang]}</span>
        <span class="cart-item-price">${formatPrice(lineTotal)}</span>
        <div class="cart-item-controls">
          <button class="cart-qty-btn" data-cart-decrement="${entry.refId}" aria-label="Menos">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button class="cart-qty-btn" data-cart-increment="${entry.refId}" aria-label="Mais">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (totalValue) totalValue.textContent = formatPrice(getCartTotal());
}

// Atualiza badges de qty nos botões "+" do menu sem re-render completo
function updateAddBtnBadges() {
  document.querySelectorAll('[data-add-ref]').forEach(btn => {
    const ref = btn.dataset.addRef;
    const qty = getCartQty(ref);
    const existingBadge = btn.querySelector('.qty-badge');
    if (qty > 0) {
      btn.classList.add('added');
      if (existingBadge) {
        existingBadge.textContent = qty;
      } else {
        const badge = document.createElement('span');
        badge.className = 'qty-badge';
        badge.textContent = qty;
        btn.appendChild(badge);
      }
    } else {
      btn.classList.remove('added');
      if (existingBadge) existingBadge.remove();
    }
  });
}

// STAFF VIEW — fullscreen
function openStaffView() {
  if (cart.length === 0) return;

  const staffView = document.getElementById('staff-view');
  const tableEl = document.getElementById('staff-table');
  const orderIdEl = document.getElementById('staff-order-id');
  const helperEl = document.getElementById('staff-helper');
  const listEl = document.getElementById('staff-list');
  const totalEl = document.getElementById('staff-total');
  if (!staffView) return;

  // Helper text
  helperEl.textContent = t().staffHelper;

  // Mesa — grande
  if (tableNumber) {
    tableEl.textContent = `${t().tableHint} ${tableNumber}`;
    tableEl.classList.remove('no-table');
  } else {
    tableEl.textContent = CONFIG.name || '';
    tableEl.classList.add('no-table');
  }

  // Order ID curto
  orderIdEl.textContent = `#${ORDER_ID}`;

  // Lista de items no formato "1× Nome"
  listEl.innerHTML = cart.map(entry => {
    const item = getItemByRef(entry.refId);
    if (!item) return '';
    return `
      <div class="staff-list-item">
        <span class="staff-list-qty">${entry.qty}×</span>
        <span class="staff-list-name">${item.name[currentLang]}</span>
      </div>
    `;
  }).join('');

  // Total
  totalEl.innerHTML = `<span>${t().cartTotal}</span>${formatPrice(getCartTotal())}`;

  // Fecha todos os modals abertos antes de abrir o staff view
  document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
  document.body.style.overflow = 'hidden';

  // Força landscape-friendly e evita screen sleep se suportado
  if (screen.orientation && screen.orientation.unlock) {
    try { screen.orientation.unlock(); } catch(e) { /* silent */ }
  }

  staffView.classList.add('show');
}

function closeStaffView() {
  const staffView = document.getElementById('staff-view');
  if (!staffView) return;
  staffView.classList.remove('show');
  document.body.style.overflow = '';
}

// Setup: botões "+" no menu (delegação)
function setupMenuAddButtons() {
  document.getElementById('menu').addEventListener('click', e => {
    const btn = e.target.closest('[data-add-ref]');
    if (!btn) return;
    // IMPORTANTE: stopPropagation para não abrir o modal do item
    e.stopPropagation();
    e.preventDefault();
    haptic();
    addToCart(btn.dataset.addRef);
  });
}

// Setup: botão "Adicionar ao pedido" no modal
function setupItemModalAdd() {
  const btn = document.getElementById('item-modal-add');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const ref = btn.dataset.addRef;
    if (!ref) return;
    haptic();
    addToCart(ref);
    btn.classList.add('just-added');
    const label = document.getElementById('item-modal-add-label');
    if (label) {
      const original = t().addToOrder;
      label.textContent = t().addedToOrder;
      setTimeout(() => {
        label.textContent = original;
        btn.classList.remove('just-added');
      }, 900);
    }
  });
}

// Setup: click no pill abre bottom sheet
function setupCartPill() {
  const pill = document.getElementById('cart-pill');
  if (!pill) return;
  pill.addEventListener('click', () => {
    haptic();
    openModal('cart-sheet');
  });
}

// Setup: controles +/- e remove no bottom sheet
function setupCartSheet() {
  const list = document.getElementById('cart-list');
  if (list) {
    list.addEventListener('click', e => {
      const inc = e.target.closest('[data-cart-increment]');
      const dec = e.target.closest('[data-cart-decrement]');
      if (inc) {
        haptic();
        addToCart(inc.dataset.cartIncrement);
      } else if (dec) {
        haptic();
        decrementCart(dec.dataset.cartDecrement);
      }
    });
  }

  const clearBtn = document.getElementById('cart-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      haptic();
      clearCart();
      closeModal('cart-sheet');
    });
  }

  const staffBtn = document.getElementById('cart-show-staff-btn');
  if (staffBtn) {
    staffBtn.addEventListener('click', () => {
      haptic();
      openStaffView();
    });
  }
}

// Setup: fechar staff view (click anywhere or X button)
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

/* Estado do split */
let splitPeople = 2;
let splitMode = 'equal';
let splitActivePerson = 0;
let splitAssign = [];

// Inicializa/reset os sets de atribuição
function initSplitAssign() {
  splitAssign = Array.from({ length: splitPeople }, () => new Set());
}

// Total atribuído a uma pessoa (soma por item)
function getPersonTotal(personIdx) {
  const assigned = splitAssign[personIdx];
  if (!assigned) return 0;
  return cart.reduce((sum, entry) => {
    if (!assigned.has(entry.refId)) return sum;
    const item = getItemByRef(entry.refId);
    if (!item) return sum;
    const price = parsePriceToNumber(item.price) || 0;
    return sum + price * entry.qty;
  }, 0);
}

// Toggle: atribuir/retirar item de pessoa activa
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

/* ─── Render: painel completo de split ─── */
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
  const names = PERSON_NAMES[currentLang] || PERSON_NAMES.pt;

  const rows = Array.from({ length: splitPeople }, (_, i) => `
    <div class="split-eq-row">
      <span class="split-eq-person">${names[i]}</span>
      <span class="split-eq-amount">${formatPrice(perPerson)}</span>
    </div>
  `).join('');

  el.innerHTML = rows + `<p class="split-total-note">${ts().totalNote(splitPeople)}</p>`;
}

function renderSplitCustom() {
  renderSplitPeopleTabs();
  renderSplitAssignList();
  renderSplitPersonSummary();
}

function renderSplitPeopleTabs() {
  const el = document.getElementById('split-people-tabs');
  if (!el) return;
  const names = PERSON_NAMES[currentLang] || PERSON_NAMES.pt;

  el.innerHTML = Array.from({ length: splitPeople }, (_, i) => {
    const total = getPersonTotal(i);
    const totalStr = total > 0 ? formatPrice(total) : '—';
    return `
      <button class="split-person-tab ${i === splitActivePerson ? 'active' : ''}" data-person="${i}">
        ${names[i]}
        <span class="ptab-total">${totalStr}</span>
      </button>
    `;
  }).join('');
}

function renderSplitAssignList() {
  const el = document.getElementById('split-assign-list');
  if (!el) return;
  const assigned = splitAssign[splitActivePerson] || new Set();

  if (cart.length === 0) {
    el.innerHTML = `<div class="cart-empty" style="padding:var(--s4) 0">${t().cartEmpty}</div>`;
    return;
  }

  el.innerHTML = cart.map(entry => {
    const item = getItemByRef(entry.refId);
    if (!item) return '';
    const unitPrice = parsePriceToNumber(item.price) || 0;
    const lineTotal = unitPrice * entry.qty;
    const isChecked = assigned.has(entry.refId);

    return `
      <div class="split-assign-item ${isChecked ? 'checked' : ''}" data-assign-ref="${entry.refId}">
        <div class="split-assign-check"></div>
        <span class="split-assign-name">${item.name[currentLang]}</span>
        <span class="split-assign-qty">${entry.qty}×</span>
        <span class="split-assign-price">${formatPrice(lineTotal)}</span>
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

/* ─── Setup: interações do split ─── */
function setupSplitBill() {
  // Tabs Pedido / Dividir
  const tabs = document.getElementById('cart-tabs');
  if (tabs) {
    tabs.addEventListener('click', e => {
      const btn = e.target.closest('.cart-tab');
      if (!btn) return;
      const tabName = btn.dataset.tab;
      document.querySelectorAll('.cart-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-order').style.display = tabName === 'order' ? 'block' : 'none';
      document.getElementById('panel-split').style.display = tabName === 'split' ? 'block' : 'none';
      if (tabName === 'split') {
        // Garante que o assign está inicializado com pessoas correctas
        if (splitAssign.length !== splitPeople) initSplitAssign();
        renderSplitPanel();
      }
    });
  }

  // Stepper: − e +
  const minusBtn = document.getElementById('split-minus');
  const plusBtn = document.getElementById('split-plus');
  if (minusBtn) {
    minusBtn.addEventListener('click', () => {
      if (splitPeople <= SPLIT_MIN) return;
      splitPeople--;
      // Remove sets extra se havia mais pessoas
      splitAssign = splitAssign.slice(0, splitPeople);
      if (splitActivePerson >= splitPeople) splitActivePerson = splitPeople - 1;
      haptic();
      renderSplitPanel();
    });
  }
  if (plusBtn) {
    plusBtn.addEventListener('click', () => {
      if (splitPeople >= SPLIT_MAX) return;
      splitPeople++;
      // Adiciona set novo para a pessoa extra
      if (splitAssign.length < splitPeople) splitAssign.push(new Set());
      haptic();
      renderSplitPanel();
    });
  }

  // Mode toggle: Equal / Custom
  const modeRow = document.getElementById('panel-split');
  if (modeRow) {
    modeRow.addEventListener('click', e => {
      const modeBtn = e.target.closest('[data-mode]');
      if (!modeBtn) return;
      splitMode = modeBtn.dataset.mode;
      if (splitMode === 'custom' && splitAssign.length !== splitPeople) initSplitAssign();
      haptic();
      renderSplitPanel();
    });
  }

  // Person tabs (custom mode)
  const customPanel = document.getElementById('split-custom-panel');
  if (customPanel) {
    // Tab switch
    customPanel.addEventListener('click', e => {
      const tab = e.target.closest('[data-person]');
      if (tab) {
        haptic();
        splitActivePerson = parseInt(tab.dataset.person);
        renderSplitCustom();
        return;
      }
      // Assign toggle
      const assignItem = e.target.closest('[data-assign-ref]');
      if (assignItem) {
        haptic();
        toggleAssign(assignItem.dataset.assignRef);
      }
    });
  }
}

/* Quando o cart muda, re-render split se estiver visível */
function onCartChangeSplitHook() {
  const splitPanel = document.getElementById('panel-split');
  if (splitPanel && splitPanel.style.display !== 'none') {
    renderSplitPanel();
  }
  if (cart.length === 0) {
    initSplitAssign();
  }
}


/* ═══════════════════════════════════════════════════════════════════════════
   13. BOOT
   ═══════════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  applyBrandColors();
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
  setupBackToTop();
  // ─── Order System ───
  setupMenuAddButtons();
  setupItemModalAdd();
  setupCartPill();
  setupCartSheet();
  setupStaffView();
  renderCartPill();
  // ─── Split Bill ───
  initSplitAssign();
  setupSplitBill();
});