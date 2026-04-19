/* ═══════════════════════════════════════════════════════════════════════════
   NEXO MENU — Script
   NÃO EDITES ESTE FICHEIRO PARA NOVOS CLIENTES.
   Tudo específico do cliente está em config.js.
   ═══════════════════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════════════════
   1. CONSTANTES — tabelas i18n que NÃO mudam por cliente
   ═══════════════════════════════════════════════════════════════════════════ */

// Alergénios oficiais UE (Reg. 1169/2011) em 4 idiomas
const ALLERGENS_EU = {
  pt: { 1:"Glúten",2:"Crustáceos",3:"Ovos",4:"Peixe",5:"Amendoins",6:"Soja",7:"Lácteos",8:"Frutos de casca",9:"Aipo",10:"Mostarda",11:"Sésamo",12:"Sulfitos",13:"Tremoço",14:"Moluscos" },
  en: { 1:"Gluten",2:"Crustaceans",3:"Eggs",4:"Fish",5:"Peanuts",6:"Soy",7:"Dairy",8:"Nuts",9:"Celery",10:"Mustard",11:"Sesame",12:"Sulphites",13:"Lupin",14:"Molluscs" },
  es: { 1:"Gluten",2:"Crustáceos",3:"Huevos",4:"Pescado",5:"Cacahuetes",6:"Soja",7:"Lácteos",8:"Frutos cáscara",9:"Apio",10:"Mostaza",11:"Sésamo",12:"Sulfitos",13:"Altramuz",14:"Moluscos" },
  fr: { 1:"Gluten",2:"Crustacés",3:"Œufs",4:"Poisson",5:"Arachides",6:"Soja",7:"Laitiers",8:"Fruits à coque",9:"Céleri",10:"Moutarde",11:"Sésame",12:"Sulfites",13:"Lupin",14:"Mollusques" }
};

// Labels de dietas
const DIET_LABELS = {
  pt: { V:"Vegetariano", VG:"Vegan", GF:"Sem glúten", LF:"Sem lactose" },
  en: { V:"Vegetarian", VG:"Vegan", GF:"Gluten-free", LF:"Lactose-free" },
  es: { V:"Vegetariano", VG:"Vegano", GF:"Sin gluten", LF:"Sin lactosa" },
  fr: { V:"Végétarien", VG:"Végan", GF:"Sans gluten", LF:"Sans lactose" }
};

// Strings da interface
const UI = {
  pt: {
    special: "Esta semana", menu: "Menu", events: "Eventos",
    wines: "Carta de vinhos", wineLink: "Ver lista completa",
    review: "Avaliar", google: "Google", tripadvisor: "TripAdvisor", facebook: "Facebook",
    googleSub: "Mais visibilidade no Maps", tripadvisorSub: "Ideal para turistas", facebookSub: "Partilha com amigos",
    reviewModalTitle: "Onde prefere avaliar?",
    instagram: "Instagram", staff: "Staff", book: "Reservar",
    share: "Partilhar", wifi: "Wi-Fi", copy: "Tocar para copiar", copied: "Copiado ✓",
    allergens: "Alergénios UE", allergenNote: "Conforme Reg. UE 1169/2011. Informe o staff sobre qualquer intolerância.",
    address: "Morada", hours: "Horário", all: "Tudo",
    tableHint: "Mesa",
    loyalty: "Receber os pratos especiais",
    loyaltySub: "Por WhatsApp · apenas quando há novidades",
    loyaltyCta: "Aceitar",
    loyaltyMsg: "Olá! Quero receber os pratos especiais da semana de {name}.",
    noAllergens: "Sem alergénios declarados.",
    allergenListLabel: "Contém"
  },
  en: {
    special: "This week", menu: "Menu", events: "Events",
    wines: "Wine list", wineLink: "See full list",
    review: "Rate us", google: "Google", tripadvisor: "TripAdvisor", facebook: "Facebook",
    googleSub: "More visibility on Maps", tripadvisorSub: "Best for tourists", facebookSub: "Share with friends",
    reviewModalTitle: "Where do you prefer to rate us?",
    instagram: "Instagram", staff: "Staff", book: "Book",
    share: "Share", wifi: "Wi-Fi", copy: "Tap to copy", copied: "Copied ✓",
    allergens: "EU allergens", allergenNote: "Per EU Reg. 1169/2011. Please inform staff of any intolerance.",
    address: "Address", hours: "Hours", all: "All",
    tableHint: "Table",
    loyalty: "Get the weekly specials",
    loyaltySub: "Via WhatsApp · only when there's news",
    loyaltyCta: "Accept",
    loyaltyMsg: "Hi! I'd like to receive the weekly specials from {name}.",
    noAllergens: "No allergens declared.",
    allergenListLabel: "Contains"
  },
  es: {
    special: "Esta semana", menu: "Menú", events: "Eventos",
    wines: "Carta de vinos", wineLink: "Ver lista completa",
    review: "Valorar", google: "Google", tripadvisor: "TripAdvisor", facebook: "Facebook",
    googleSub: "Más visibilidad en Maps", tripadvisorSub: "Ideal para turistas", facebookSub: "Compartir con amigos",
    reviewModalTitle: "¿Dónde prefiere valorar?",
    instagram: "Instagram", staff: "Personal", book: "Reservar",
    share: "Compartir", wifi: "Wi-Fi", copy: "Tocar para copiar", copied: "Copiado ✓",
    allergens: "Alérgenos UE", allergenNote: "Conforme Reg. UE 1169/2011. Informe al personal de cualquier intolerancia.",
    address: "Dirección", hours: "Horario", all: "Todo",
    tableHint: "Mesa",
    loyalty: "Recibir los platos especiales",
    loyaltySub: "Por WhatsApp · solo cuando hay novedades",
    loyaltyCta: "Aceptar",
    loyaltyMsg: "¡Hola! Quiero recibir los platos especiales de {name}.",
    noAllergens: "Sin alérgenos declarados.",
    allergenListLabel: "Contiene"
  },
  fr: {
    special: "Cette semaine", menu: "Menu", events: "Événements",
    wines: "Carte des vins", wineLink: "Voir la liste",
    review: "Évaluer", google: "Google", tripadvisor: "TripAdvisor", facebook: "Facebook",
    googleSub: "Plus de visibilité sur Maps", tripadvisorSub: "Idéal pour les touristes", facebookSub: "Partager avec des amis",
    reviewModalTitle: "Où préférez-vous évaluer?",
    instagram: "Instagram", staff: "Personnel", book: "Réserver",
    share: "Partager", wifi: "Wi-Fi", copy: "Toucher pour copier", copied: "Copié ✓",
    allergens: "Allergènes UE", allergenNote: "Selon Reg. UE 1169/2011. Informez le personnel de toute intolérance.",
    address: "Adresse", hours: "Horaires", all: "Tout",
    tableHint: "Table",
    loyalty: "Recevoir les plats de la semaine",
    loyaltySub: "Par WhatsApp · seulement quand il y a des nouveautés",
    loyaltyCta: "Accepter",
    loyaltyMsg: "Bonjour! Je veux recevoir les plats de la semaine de {name}.",
    noAllergens: "Aucun allergène déclaré.",
    allergenListLabel: "Contient"
  }
};


/* ═══════════════════════════════════════════════════════════════════════════
   2. STATE
   ═══════════════════════════════════════════════════════════════════════════ */

let currentLang = 'pt';
let currentFilter = 'all';
let currentCategory = null;

// Mesa a partir do URL (?mesa=7 ou ?table=7)
const urlParams = new URLSearchParams(window.location.search);
const tableNumber = urlParams.get('mesa') || urlParams.get('table') || '';

// Helper: retorna string UI do idioma corrente
const t = () => UI[currentLang];


/* ═══════════════════════════════════════════════════════════════════════════
   3. INIT — aplicar cores, detetar idioma, renderizar
   ═══════════════════════════════════════════════════════════════════════════ */

function applyBrandColors() {
  document.documentElement.style.setProperty('--accent', CONFIG.brandColor);
  if (CONFIG.brandColorDark) {
    document.documentElement.style.setProperty('--accent-dark', CONFIG.brandColorDark);
  }
}

function detectLang() {
  const browserLang = (navigator.language || 'pt').substring(0, 2).toLowerCase();
  if (['pt', 'en', 'es', 'fr'].includes(browserLang)) {
    currentLang = browserLang;
    document.querySelectorAll('.lang-toggle button').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === currentLang);
    });
  }
}


/* ═══════════════════════════════════════════════════════════════════════════
   4. RENDER — hero, actions, banner, tabs, filtro, menu, eventos, Wi-Fi, loyalty, footer
   ═══════════════════════════════════════════════════════════════════════════ */

function renderHero() {
  // Foto do hero
  const heroImage = document.getElementById('hero-image');
  if (CONFIG.heroImageUrl) {
    heroImage.style.backgroundImage = `url('${CONFIG.heroImageUrl}')`;
  }

  // Logo circular
  const logoEl = document.getElementById('hero-logo');
  if (CONFIG.logoUrl) {
    logoEl.innerHTML = `<img src="${CONFIG.logoUrl}" alt="${CONFIG.name}" loading="eager">`;
  } else {
    // Fallback: iniciais geradas do nome
    const initials = CONFIG.name
      .split(' ')
      .filter(w => w.length > 2)
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
    logoEl.textContent = initials || CONFIG.name[0].toUpperCase();
  }

  // Mesa badge (se ?mesa=N no URL)
  const tableBadge = document.getElementById('table-badge');
  if (tableNumber) {
    tableBadge.textContent = `${t().tableHint} ${tableNumber}`;
    tableBadge.classList.add('show');
  }

  // Textos
  document.getElementById('html-root').lang = currentLang;
  document.getElementById('hero-name').textContent = CONFIG.name;
  document.getElementById('hero-tagline').textContent = CONFIG.tagline[currentLang];
  document.getElementById('hero-city').textContent = CONFIG.city;
  document.getElementById('hero-hours-today').textContent = CONFIG.hoursToday[currentLang];

  document.title = `${CONFIG.name} — Menu`;
}

function renderActionBar() {
  document.getElementById('action-review-label').textContent = t().review;
  document.getElementById('action-instagram-label').textContent = t().instagram;
  document.getElementById('action-staff-label').textContent = t().staff;
  document.getElementById('action-book-label').textContent = t().book;

  // Instagram
  document.getElementById('action-instagram').href = `https://instagram.com/${CONFIG.instagramHandle}`;

  // Staff via WhatsApp (com nº mesa se disponível)
  const staffMsg = CONFIG.whatsappStaffMessage[currentLang].replace('{mesa}', tableNumber || '___');
  document.getElementById('action-staff').href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(staffMsg)}`;

  // Reserva
  document.getElementById('action-book').href = CONFIG.bookingUrl;
}

function renderSpecialBanner() {
  document.getElementById('special-label').textContent = t().special;
  document.getElementById('special-text').textContent = CONFIG.todaysSpecial[currentLang];
}

function renderCategoryTabs() {
  const tabs = CONFIG.menu.map((sec, i) =>
    `<button class="category-tab ${i === 0 ? 'active' : ''}" data-category="${sec.id}">${sec.section[currentLang]}</button>`
  ).join('');
  document.getElementById('category-tabs').innerHTML = tabs;
  currentCategory = CONFIG.menu[0].id;
}

function renderDietFilter() {
  const options = [
    { key: 'all', label: t().all },
    { key: 'V', label: DIET_LABELS[currentLang].V },
    { key: 'VG', label: DIET_LABELS[currentLang].VG },
    { key: 'GF', label: DIET_LABELS[currentLang].GF },
    { key: 'LF', label: DIET_LABELS[currentLang].LF }
  ];

  document.getElementById('diet-filter').innerHTML = options.map(o =>
    `<button class="diet-chip ${currentFilter === o.key ? 'active' : ''}" data-filter="${o.key}">${o.label}</button>`
  ).join('');
}

function renderMenu() {
  const html = CONFIG.menu.map(sec => `
    <section class="menu-section" id="section-${sec.id}">
      <h2 class="menu-section-title">${sec.section[currentLang]}</h2>
      ${sec.desc && sec.desc[currentLang] ? `<p class="menu-section-desc">${sec.desc[currentLang]}</p>` : ''}
      ${sec.items.map((item, idx) => {
        const matches = currentFilter === 'all' || (item.diet || []).includes(currentFilter);
        const dataIdx = `${sec.id}-${idx}`;

        return `
        <article class="menu-item ${matches ? '' : 'hidden'}" data-item="${dataIdx}">
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

function renderWineCard() {
  const wineCard = document.getElementById('wine-card');
  if (!CONFIG.wineMenuUrl) {
    wineCard.style.display = 'none';
    return;
  }
  wineCard.style.display = 'flex';
  wineCard.href = CONFIG.wineMenuUrl;
  document.getElementById('wine-title').textContent = t().wines;
  document.getElementById('wine-sub').textContent = t().wineLink + ' →';
}

function renderEvents() {
  const section = document.getElementById('events-section');

  // Se não há eventos, esconde secção
  if (!CONFIG.events || CONFIG.events.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  document.getElementById('events-title').innerHTML = t().events;

  document.getElementById('events-list').innerHTML = CONFIG.events.map(e => `
    <div class="event-card">
      <div class="event-date">${e.date[currentLang]}</div>
      <div class="event-body">
        <div class="event-title">${e.title[currentLang]}</div>
        <div class="event-desc">${e.desc[currentLang]}</div>
      </div>
    </div>
  `).join('');
}

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
  renderActionBar();
  renderSpecialBanner();
  renderCategoryTabs();
  renderDietFilter();
  renderMenu();
  renderWineCard();
  renderEvents();
  renderWifi();
  renderLoyalty();
  renderFooter();
  renderReviewModal();
}


/* ═══════════════════════════════════════════════════════════════════════════
   5. INTERAÇÕES — language, filtros, tabs, modais, Wi-Fi, loyalty, share
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

// ─── Language toggle ───
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

// ─── Filtro de dieta ───
function setupDietFilter() {
  document.getElementById('diet-filter').addEventListener('click', e => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    currentFilter = btn.dataset.filter;
    renderDietFilter();
    renderMenu();
  });
}

// ─── Tabs de categoria (scroll-spy + click) ───
function setupCategoryTabs() {
  // Click: scrolla para a secção
  document.getElementById('category-tabs').addEventListener('click', e => {
    const tab = e.target.closest('[data-category]');
    if (!tab) return;
    const id = tab.dataset.category;
    const section = document.getElementById(`section-${id}`);
    if (section) {
      const offset = 110; // action-bar + tabs
      const y = section.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  });

  // Scroll-spy: detetar secção visível e atualizar tab ativa
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id.replace('section-', '');
        document.querySelectorAll('.category-tab').forEach(t => {
          t.classList.toggle('active', t.dataset.category === id);
        });
        currentCategory = id;
      }
    });
  }, {
    rootMargin: '-30% 0px -50% 0px',
    threshold: 0
  });

  // Precisa reconectar o observer após re-render
  function attachObserver() {
    observer.disconnect();
    document.querySelectorAll('.menu-section').forEach(sec => observer.observe(sec));
  }
  attachObserver();

  // Guarda referência para re-attach depois de renderMenu()
  window._attachMenuObserver = attachObserver;
}

// ─── Modal de Review (3 plataformas) ───
function setupReviewButton() {
  document.getElementById('action-review').addEventListener('click', () => {
    openModal('review-modal');
  });
}

// ─── Modal de Alergénios ───
function openAllergenModal() {
  const list = document.getElementById('allergen-list');
  const allergensObj = ALLERGENS_EU[currentLang];

  list.innerHTML = Object.entries(allergensObj).map(([num, name]) =>
    `<li><strong>${num}</strong><span>${name}</span></li>`
  ).join('');

  document.getElementById('allergen-modal-title').textContent = t().allergens;
  document.getElementById('allergen-note').textContent = t().allergenNote;
  openModal('allergen-modal');
}

// ─── Modal de Detalhe do Prato (estilo LiveMenu) ───
function openItemModal(sectionId, itemIdx) {
  const section = CONFIG.menu.find(s => s.id === sectionId);
  if (!section) return;
  const item = section.items[itemIdx];
  if (!item) return;

  // Foto (ou placeholder)
  const photoEl = document.getElementById('item-modal-photo');
  if (item.photo) {
    photoEl.style.backgroundImage = `url('${item.photo}')`;
    photoEl.classList.remove('item-modal-photo-empty');
    photoEl.textContent = '';
  } else {
    photoEl.style.backgroundImage = '';
    photoEl.classList.add('item-modal-photo-empty');
    photoEl.textContent = item.name[currentLang][0].toUpperCase();
  }

  // Textos
  document.getElementById('item-modal-name').textContent = item.name[currentLang];
  document.getElementById('item-modal-price').textContent = item.price;
  const descEl = document.getElementById('item-modal-desc');
  if (item.desc && item.desc[currentLang]) {
    descEl.textContent = item.desc[currentLang];
    descEl.style.display = 'block';
  } else {
    descEl.style.display = 'none';
  }

  // Tags de dieta
  const tagsEl = document.getElementById('item-modal-tags');
  tagsEl.innerHTML = (item.diet || []).map(d =>
    `<span class="tag tag-diet">${DIET_LABELS[currentLang][d] || d}</span>`
  ).join('');

  // Alergénios
  const allergensEl = document.getElementById('item-modal-allergens');
  if (item.allergens && item.allergens.length > 0) {
    allergensEl.innerHTML = `
      <div class="item-modal-allergens-title">${t().allergenListLabel}:</div>
      <div class="item-modal-allergens-list">
        ${item.allergens.map(a => `<span>${ALLERGENS_EU[currentLang][a]}</span>`).join('')}
      </div>
    `;
  } else {
    allergensEl.innerHTML = `
      <div class="item-modal-no-allergens">${t().noAllergens}</div>
    `;
  }

  openModal('item-modal');
}

// ─── Clicks no menu: abrir detalhe OU abrir alergénios ───
function setupMenuClicks() {
  document.getElementById('menu').addEventListener('click', e => {
    const tagAllergen = e.target.closest('.tag-allergen');
    if (tagAllergen) {
      e.stopPropagation();
      openAllergenModal();
      return;
    }

    const item = e.target.closest('[data-item]');
    if (!item) return;
    const [sectionId, itemIdx] = item.dataset.item.split('-');
    openItemModal(sectionId, parseInt(itemIdx));
  });
}

// ─── Fechar modais ───
function setupModalCloses() {
  // Botões X dentro dos modais
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  // Click no overlay (fora do conteúdo)
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // ESC para fechar
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.show').forEach(m => closeModal(m.id));
    }
  });
}

// ─── Wi-Fi: copiar password com um toque ───
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
  } catch (err) {
    // silent fail
  }
  document.body.removeChild(ta);
}

// ─── Loyalty opt-in ───
function setupLoyalty() {
  document.getElementById('loyalty-btn').addEventListener('click', () => {
    const msg = t().loyaltyMsg.replace('{name}', CONFIG.name);
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  });
}

// ─── Partilhar (Web Share API nativa) ───
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
        // Fallback: copiar URL
        await navigator.clipboard.writeText(shareData.url);
        showToast(t().copied);
      }
    } catch (err) {
      // Utilizador cancelou — ignorar silenciosamente
    }
  });
}


/* ═══════════════════════════════════════════════════════════════════════════
   6. RE-RENDER WRAPPER — quando muda idioma, precisa reconectar observers
   ═══════════════════════════════════════════════════════════════════════════ */

const originalRenderAll = renderAll;
renderAll = function() {
  originalRenderAll();
  if (window._attachMenuObserver) window._attachMenuObserver();
};


/* ═══════════════════════════════════════════════════════════════════════════
   7. BOOT
   ═══════════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  applyBrandColors();
  detectLang();
  renderAll();
  setupLanguage();
  setupDietFilter();
  setupCategoryTabs();
  setupReviewButton();
  setupMenuClicks();
  setupModalCloses();
  setupWifiCopy();
  setupLoyalty();
  setupShare();
});