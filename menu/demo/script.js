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
    googleSub: "Mais visibilidade no Maps", thefork: "TheFork", theforkSub: "Plataforma de reservas de restaurantes",
    reviewModalTitle: "Onde prefere avaliar?",
    instagram: "Instagram", share: "Partilhar",
    copy: "Tocar para copiar", copied: "Copiado ✓",
    address: "Morada", phone: "Telefone", hours: "Horário", all: "Tudo",
    tableHint: "Mesa",
    loyalty: "Falar com o restaurante",
    loyaltySub: "WhatsApp direto — dúvidas, sugestões, contacto",
    loyaltyCta: "Abrir WhatsApp",
    noAllergens: "Sem alergénios declarados.",
    allergenListLabel: "Contém",
    navMenu: "Menu", navTop: "Mais pedidos", navWines: "Vinhos",
    navWifi: "Wi-Fi", navContact: "Contacto", navReview: "Avaliar",navInsta: "Instagram",
    wineFilterCountry: "País", wineFilterType: "Tipo", wineFilterGrape: "Casta",
    wineEmpty: "Nenhum vinho corresponde a estes filtros.",
    wineSpecCountry: "País", wineSpecRegion: "Região", wineSpecGrape: "Casta",
    wineSpecAbv: "Álcool", wineSpecVolume: "Volume",
    vivinoSeeMore: "Ver no Vivino →",
    upsellTitle: "Combina com...",
    // Order system
    addToOrder: "Adicionar ao pedido", addedToOrder: "Adicionado ✓",
    inOrder: "No pedido", viewOrder: "Ver pedido", reduceQty: "Diminuir quantidade", increaseQty: "Aumentar quantidade",
    cartItem: "item", cartItems: "itens",
    cartTitle: "O meu pedido", cartEmpty: "Ainda não adicionou nada.",
    cartTotal: "Total", cartShowStaff: "Mostrar ao staff", cartClear: "Limpar pedido",
    staffHelper: "Mostre este ecrã ao staff para pedir",
    // Rating gate
    ratingStep1Title: "Como foi a sua experiência?",
    ratingStep1Sub: "A sua opinião ajuda-nos a melhorar.",
    starLabels: ["", "Muito mau", "Mau", "Razoável", "Bom", "Excelente!"],
    ratingHappyTitle: "Que bom! 🎉",
    ratingHappySub: "Partilhe a sua experiência numa plataforma:",
    ratingUnhappyTitle: "Pedimos desculpa.",
    ratingUnhappySub: "O que correu menos bem? O seu feedback vai diretamente à gerência.",
    ratingTextareaPlaceholder: "Conte-nos o que aconteceu...",
    ratingSendLabel: "Enviar pelo WhatsApp",
    ratingPrivateNote: "Mensagem privada. Só a gerência tem acesso.",
    ratingThanksHappyIcon: "🌟",
    ratingThanksHappyTitle: "Obrigado!",
    ratingThanksHappySub: "A sua avaliação ajuda outros clientes a encontrar-nos.",
    ratingThanksUnhappyIcon: "🙏",
    ratingThanksUnhappyTitle: "Recebemos o seu feedback.",
    ratingThanksUnhappySub: "A gerência vai analisar e responder assim que possível.",
    // Favorites
    favoritesTitle: "Os meus favoritos",
    bookmarkSave: "Guardar",
    bookmarkSaved: "Guardado ✓",
    favoritesCleared: "Favoritos limpos",
    // Share dish
    shareDish: "Partilhar",
    shareImageTitle: "Partilhar prato",
    shareNotSupported: "Copia o link e partilha manualmente.",
    searchPlaceholder: "Procurar prato, ingrediente ou palavra-chave",
    searchResults: "A mostrar {count} resultados para “{query}”.",
    searchEmpty: "Sem resultados. Experimente outro nome ou ingrediente.",
    searchReset: "Limpar filtros",
    favoritesEmpty: "Toca em 🔖 num prato para guardar aqui.",
    // Order history
    orderSent: "Enviado",
    orderHistoryLabel: "Pedido",
    pillSent: "Enviado ✓",
    // Split podium
    splitPodiumTitle: "Quem gastou mais?",
    splitPodiumWinner: "gastou mais hoje 👑",
    splitPodiumAllEqual: "Iguais! 🤝 Dividam em partes iguais.",
    splitPodiumUnassigned: "Há items sem dono — atribui tudo primeiro.",
    // Happy hour countdown
    happyHourEnds: "Termina em",
    // Allergen filter
    allergenFilterLabel: "Evitar alergénios:",
    soldOut: "Esgotado",
    // Google rating
    googleReviews: "avaliações no Google"
  },
  en: {
    specialHappyHour: "Happy Hour", specialWeek: "This week",
    menu: "Menu",
    mostOrdered: "Most ordered", mostOrderedBadge: "House specialties",
    mostOrderedSub: "What our customers choose the most",
    eliteBadge: "The house experience",
    wines: "Wine list", winesBadge: "Chef's selection",
    wifi: "Wi-Fi", review: "Rate us",
    googleSub: "More visibility on Maps", thefork: "TheFork", theforkSub: "Online restaurant booking platform",
    reviewModalTitle: "Where would you like to rate us?",
    instagram: "Instagram", share: "Share",
    copy: "Tap to copy", copied: "Copied ✓",
    address: "Address", phone: "Phone", hours: "Hours", all: "All",
    tableHint: "Table",
    loyalty: "Contact the restaurant",
    loyaltySub: "Direct WhatsApp — questions, feedback, contact",
    loyaltyCta: "Open WhatsApp",
    noAllergens: "No allergens declared.",
    allergenListLabel: "Contains",
    navMenu: "Menu", navTop: "Most ordered", navWines: "Wines",
    navWifi: "Wi-Fi", navContact: "Contact", navReview: "Rate", navInsta: "Instagram",
    wineFilterCountry: "Country", wineFilterType: "Type", wineFilterGrape: "Grape",
    wineEmpty: "No wines match these filters.",
    wineSpecCountry: "Country", wineSpecRegion: "Region", wineSpecGrape: "Grape",
    wineSpecAbv: "ABV", wineSpecVolume: "Volume",
    vivinoSeeMore: "See on Vivino →",
    upsellTitle: "Goes well with...",
    addToOrder: "Add to order", addedToOrder: "Added ✓",
    inOrder: "In order", viewOrder: "View order", reduceQty: "Decrease quantity", increaseQty: "Increase quantity",
    cartItem: "item", cartItems: "items",
    cartTitle: "My order", cartEmpty: "Nothing added yet.",
    cartTotal: "Total", cartShowStaff: "Show to staff", cartClear: "Clear order",
    staffHelper: "Show this screen to staff to order",
    ratingStep1Title: "How was your experience?",
    ratingStep1Sub: "Your opinion helps us improve.",
    starLabels: ["", "Very bad", "Bad", "OK", "Good", "Excellent!"],
    ratingHappyTitle: "Great! 🎉",
    ratingHappySub: "Share your experience on a platform:",
    ratingUnhappyTitle: "We're sorry.",
    ratingUnhappySub: "What went wrong? Your feedback goes directly to management.",
    ratingTextareaPlaceholder: "Tell us what happened...",
    ratingSendLabel: "Send via WhatsApp",
    ratingPrivateNote: "Private message. Only management can see it.",
    ratingThanksHappyIcon: "🌟",
    ratingThanksHappyTitle: "Thank you!",
    ratingThanksHappySub: "Your review helps others find us.",
    ratingThanksUnhappyIcon: "🙏",
    ratingThanksUnhappyTitle: "Feedback received.",
    ratingThanksUnhappySub: "Management will review and respond as soon as possible.",
    favoritesTitle: "My favourites",
    bookmarkSave: "Save",
    bookmarkSaved: "Saved ✓",
    favoritesCleared: "Favourites cleared",
    shareDish: "Share",
    shareImageTitle: "Share dish",
    shareNotSupported: "Copy the link and share manually.",
    searchPlaceholder: "Search dish, ingredient or keyword",
    searchResults: "Showing {count} results for “{query}”.",
    searchEmpty: "No results. Try another dish or ingredient.",
    searchReset: "Clear filters",
    favoritesEmpty: "Tap 🔖 on any dish to save it here.",
    orderSent: "Sent",
    orderHistoryLabel: "Order",
    pillSent: "Sent ✓",
    splitPodiumTitle: "Who spent the most?",
    splitPodiumWinner: "spent the most today 👑",
    splitPodiumAllEqual: "All equal! 🤝 Split evenly.",
    splitPodiumUnassigned: "Some items have no owner — assign everything first.",
    happyHourEnds: "Ends in",
    allergenFilterLabel: "Avoid allergens:",
    soldOut: "Sold out",
    googleReviews: "Google reviews"
  },
  es: {
    specialHappyHour: "Happy Hour", specialWeek: "Esta semana",
    menu: "Menú",
    mostOrdered: "Los más pedidos", mostOrderedBadge: "Especialidades de la casa",
    mostOrderedSub: "Lo que nuestros clientes más eligen",
    eliteBadge: "La experiencia de la casa",
    wines: "Carta de vinos", winesBadge: "Selección del chef",
    wifi: "Wi-Fi", review: "Valorar",
    googleSub: "Más visibilidad en Maps", thefork: "TheFork", theforkSub: "Plataforma de reservas de restaurantes",
    reviewModalTitle: "¿Dónde prefiere valorar?",
    instagram: "Instagram", share: "Compartir",
    copy: "Tocar para copiar", copied: "Copiado ✓",
    address: "Dirección", phone: "Teléfono", hours: "Horario", all: "Todo",
    tableHint: "Mesa",
    loyalty: "Contactar el restaurante",
    loyaltySub: "WhatsApp directo — dudas, sugerencias, contacto",
    loyaltyCta: "Abrir WhatsApp",
    noAllergens: "Sin alérgenos declarados.",
    allergenListLabel: "Contiene",
    navMenu: "Menú", navTop: "Más pedidos", navWines: "Vinos",
    navWifi: "Wi-Fi", navContact: "Contacto", navReview: "Valorar",navInsta: "Instagram",
    wineFilterCountry: "País", wineFilterType: "Tipo", wineFilterGrape: "Uva",
    wineEmpty: "Ningún vino coincide con estos filtros.",
    wineSpecCountry: "País", wineSpecRegion: "Región", wineSpecGrape: "Uva",
    wineSpecAbv: "Alcohol", wineSpecVolume: "Volumen",
    vivinoSeeMore: "Ver en Vivino →",
    upsellTitle: "Combina con...",
    addToOrder: "Añadir al pedido", addedToOrder: "Añadido ✓",
    inOrder: "En el pedido", viewOrder: "Ver pedido", reduceQty: "Reducir cantidad", increaseQty: "Aumentar cantidad",
    cartItem: "artículo", cartItems: "artículos",
    cartTitle: "Mi pedido", cartEmpty: "Aún no ha añadido nada.",
    cartTotal: "Total", cartShowStaff: "Mostrar al staff", cartClear: "Vaciar pedido",
    staffHelper: "Muestre esta pantalla al staff para pedir",
    ratingStep1Title: "¿Cómo fue su experiencia?",
    ratingStep1Sub: "Su opinión nos ayuda a mejorar.",
    starLabels: ["", "Muy malo", "Malo", "Regular", "Bueno", "¡Excelente!"],
    ratingHappyTitle: "¡Qué bien! 🎉",
    ratingHappySub: "Comparta su experiencia en una plataforma:",
    ratingUnhappyTitle: "Lo sentimos.",
    ratingUnhappySub: "¿Qué salió mal? Su feedback va directamente a la gerencia.",
    ratingTextareaPlaceholder: "Cuéntenos qué pasó...",
    ratingSendLabel: "Enviar por WhatsApp",
    ratingPrivateNote: "Mensaje privado. Solo la gerencia tiene acceso.",
    ratingThanksHappyIcon: "🌟",
    ratingThanksHappyTitle: "¡Gracias!",
    ratingThanksHappySub: "Su valoración ayuda a otros clientes a encontrarnos.",
    ratingThanksUnhappyIcon: "🙏",
    ratingThanksUnhappyTitle: "Feedback recibido.",
    ratingThanksUnhappySub: "La gerencia revisará y responderá lo antes posible.",
    favoritesTitle: "Mis favoritos",
    bookmarkSave: "Guardar",
    bookmarkSaved: "Guardado ✓",
    favoritesCleared: "Favoritos borrados",
    shareDish: "Compartir",
    shareImageTitle: "Compartir plato",
    shareNotSupported: "Copia el enlace y compártelo manualmente.",
    searchPlaceholder: "Buscar plato, ingrediente o palabra clave.",
    searchResults: "Mostrando {count} resultados para “{query}”.",
    searchEmpty: "Sin resultados. Pruebe otro plato o ingrediente.",
    searchReset: "Limpiar filtros",
    favoritesEmpty: "Toca 🔖 en un plato para guardarlo aquí.",
    orderSent: "Enviado",
    orderHistoryLabel: "Pedido",
    pillSent: "Enviado ✓",
    splitPodiumTitle: "¿Quién gastó más?",
    splitPodiumWinner: "gastó más hoy 👑",
    splitPodiumAllEqual: "¡Iguales! 🤝 Dividid a partes iguales.",
    splitPodiumUnassigned: "Hay ítems sin asignar — asígnalos todos primero.",
    happyHourEnds: "Termina en",
    allergenFilterLabel: "Evitar alérgenos:",
    soldOut: "Agotado",
    googleReviews: "reseñas en Google"
  },
  fr: {
    specialHappyHour: "Happy Hour", specialWeek: "Cette semaine",
    menu: "Menu",
    mostOrdered: "Les plus commandés", mostOrderedBadge: "Spécialités maison",
    mostOrderedSub: "Ce que nos clients choisissent le plus",
    eliteBadge: "L'expérience maison",
    wines: "Carte des vins", winesBadge: "Sélection du chef",
    wifi: "Wi-Fi", review: "Évaluer",
    googleSub: "Plus de visibilité sur Maps", thefork: "TheFork", theforkSub: "Plateforme de réservation de restaurants",
    reviewModalTitle: "Où préférez-vous évaluer?",
    instagram: "Instagram", share: "Partager",
    copy: "Toucher pour copier", copied: "Copié ✓",
    address: "Adresse", phone: "Téléphone", hours: "Horaires", all: "Tout",
    tableHint: "Table",
    loyalty: "Contacter le restaurant",
    loyaltySub: "WhatsApp direct — questions, retours, contact",
    loyaltyCta: "Ouvrir WhatsApp",
    noAllergens: "Aucun allergène déclaré.",
    allergenListLabel: "Contient",
    navMenu: "Menu", navTop: "Plus commandés", navWines: "Vins",
    navWifi: "Wi-Fi", navContact: "Contact", navReview: "Évaluer", navInsta: "Instagram",
    wineFilterCountry: "Pays", wineFilterType: "Type", wineFilterGrape: "Cépage",
    wineEmpty: "Aucun vin ne correspond à ces filtres.",
    wineSpecCountry: "Pays", wineSpecRegion: "Région", wineSpecGrape: "Cépage",
    wineSpecAbv: "Alcool", wineSpecVolume: "Volume",
    vivinoSeeMore: "Voir sur Vivino →",
    upsellTitle: "Se marie avec...",
    addToOrder: "Ajouter à la commande", addedToOrder: "Ajouté ✓",
    inOrder: "Dans la commande", viewOrder: "Voir la commande", reduceQty: "Réduire la quantité", increaseQty: "Augmenter la quantité",
    cartItem: "article", cartItems: "articles",
    cartTitle: "Ma commande", cartEmpty: "Rien n'a été ajouté.",
    cartTotal: "Total", cartShowStaff: "Montrer au personnel", cartClear: "Vider",
    staffHelper: "Montrez cet écran au personnel pour commander",
    ratingStep1Title: "Comment s'est passée votre expérience?",
    ratingStep1Sub: "Votre avis nous aide à nous améliorer.",
    starLabels: ["", "Très mauvais", "Mauvais", "Correct", "Bon", "Excellent!"],
    ratingHappyTitle: "Super! 🎉",
    ratingHappySub: "Partagez votre expérience sur une plateforme:",
    ratingUnhappyTitle: "Nous sommes désolés.",
    ratingUnhappySub: "Qu'est-ce qui s'est mal passé? Votre avis va directement à la direction.",
    ratingTextareaPlaceholder: "Dites-nous ce qui s'est passé...",
    ratingSendLabel: "Envoyer par WhatsApp",
    ratingPrivateNote: "Message privé. Seule la direction y a accès.",
    ratingThanksHappyIcon: "🌟",
    ratingThanksHappyTitle: "Merci!",
    ratingThanksHappySub: "Votre avis aide d'autres clients à nous trouver.",
    ratingThanksUnhappyIcon: "🙏",
    ratingThanksUnhappyTitle: "Feedback reçu.",
    ratingThanksUnhappySub: "La direction analysera et répondra dès que possible.",
    favoritesTitle: "Mes favoris",
    bookmarkSave: "Sauvegarder",
    bookmarkSaved: "Sauvegardé ✓",
    favoritesCleared: "Favoris effacés",
    shareDish: "Partager",
    shareImageTitle: "Partager le plat",
    shareNotSupported: "Copiez le lien et partagez manuellement.",
    searchPlaceholder: "Rechercher plat, ingrédient ou mot-clé",
    searchResults: "Affichage de {count} résultats pour « {query} ».",
    searchEmpty: "Aucun résultat. Essayez un autre plat ou ingrédient.",
    searchReset: "Effacer les filtres",
    favoritesEmpty: "Appuyez sur 🔖 pour sauvegarder un plat ici.",
    orderSent: "Envoyé",
    orderHistoryLabel: "Commande",
    pillSent: "Envoyé ✓",
    splitPodiumTitle: "Qui a dépensé le plus?",
    splitPodiumWinner: "a dépensé plus aujourd'hui 👑",
    splitPodiumAllEqual: "Égalité! 🤝 Partagez équitablement.",
    splitPodiumUnassigned: "Des articles n'ont pas de propriétaire — assignez tout d'abord.",
    happyHourEnds: "Termine dans",
    allergenFilterLabel: "Éviter les allergènes:",
    soldOut: "Épuisé",
    googleReviews: "avis sur Google"
  }
};


/* ═══════════════════════════════════════════════════════════════════════════
   2. STATE
   ═══════════════════════════════════════════════════════════════════════════ */

let currentLang = 'pt';
let currentFilter = 'all';
let currentQuery = '';
let wineFilters = { country: 'all', type: 'all', grape: 'all' };
let activeAllergenExcludes = new Set();

/* ─── ORDER SYSTEM STATE ─── */
// Cart: array de objetos { refId: "sectionId:itemIdx", qty: number }
// Nunca persiste (intencional) — estado morre ao fechar o separador
let cart = [];

/* ─── SHARED CART STATE ─── */
let sharedCart       = null;
let sharedMemberName = '';
let sharedCartItems  = [];
let _pendingCartCode = null;
let _supabaseClient  = null;
let _sharedCartChannel = null;

// Order ID curto, gerado uma vez por sessão (staff referencia se várias mesas mostram)
const ORDER_ID = Math.random().toString(36).substring(2, 6).toUpperCase();

/* ─── FAVORITES STATE ─── */
let favorites = new Set(JSON.parse(sessionStorage.getItem('nexo_favs') || '[]'));

function saveFavorites() {
  try { sessionStorage.setItem('nexo_favs', JSON.stringify([...favorites])); } catch(e) {}
}

let currentShareItem = null; // item currently open in modal for share

/* ═══════════════════════════════════════════════════════════════════════════
   ANALYTICS — Google Analytics 4
   Measurement ID configurado em config.js (ga4MeasurementId).
   Deixar vazio para desactivar completamente.
   ═══════════════════════════════════════════════════════════════════════════ */

let lastVisibleItems = 0; // updated by renderMenu(), read by search debounce

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
    renameHint: 'Toque em ✎ para renomear',
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
    renameHint: 'Tap ✎ to rename',
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
    renameHint: 'Toca ✎ para renombrar',
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
    renameHint: 'Touchez ✎ pour renommer',
  }
};

const ts = () => SPLIT_UI[currentLang] || SPLIT_UI.pt;

const urlParams = new URLSearchParams(window.location.search);
const tableNumber = urlParams.get('mesa') || urlParams.get('table') || '';

const t = () => UI[currentLang];


/* ═══════════════════════════════════════════════════════════════════════════
   3. INIT helpers
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── shadeColor helper — used by applyBrandColors and share canvas ─── */
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

// NEXO — Auto Language Detection
let _langAutoDetected = false;

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
    label: t().navReview, target: 'review-modal', isReview: true,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
  },
  // ... resto dos botões que já tens
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
  if (b.isReview) classes.push('quick-nav-review');
  return `<button class="${classes.join(' ')}" data-target="${b.target}">${b.icon}<span>${b.label}</span></button>`;
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

// SUBSTITUIR getActiveBanner() — devolve agora ghost + headline
function getActiveBanner() {
  if (!CONFIG.timeBanners || CONFIG.timeBanners.length === 0) {
    if (CONFIG.todaysSpecial) {
      const label = CONFIG.specialMode === 'happy-hour' ? t().specialHappyHour : t().specialWeek;
      return { label, headline: label, text: CONFIG.todaysSpecial[currentLang] || '', ghost: label };
    }
    return null;
  }

  const now = new Date();
  const h   = now.getHours();
  const day = now.getDay();

  for (const b of CONFIG.timeBanners) {
    if (b.days && b.days.length > 0 && !b.days.includes(day)) continue;
    if (h >= b.startH && h < b.endH) {
      return {
        label:    b.label[currentLang]    || b.label.pt    || '',
        headline: b.headline              ? (b.headline[currentLang] || b.headline.pt || '') : (b.label[currentLang] || ''),
        text:     b.text[currentLang]     || b.text.pt     || '',
        ghost:    b.ghost                 ? (b.ghost[currentLang]    || b.ghost.pt    || '') : ''
      };
    }
  }
  return null;
}

let _happyHourTracked = false;
// SUBSTITUIR renderSpecialBanner() — usa ghost próprio
function renderSpecialBanner() {
  const el     = document.getElementById('special-banner');
  const banner = getActiveBanner();

  if (!banner) { el.style.display = 'none'; return; }

  if (!_happyHourTracked) {
    _happyHourTracked = true;
    track('happy_hour_viewed');
  }

  el.style.display = '';

  const ghostEl        = document.getElementById('special-ghost');
  const labelEl        = document.getElementById('special-label');
  const headlineTextEl = document.getElementById('special-headline-text');
  const textEl         = document.getElementById('special-text');

  if (ghostEl)        ghostEl.textContent        = banner.ghost;
  if (labelEl)        labelEl.textContent        = banner.label;
  if (headlineTextEl) headlineTextEl.textContent = banner.headline;
  if (textEl)         textEl.textContent         = banner.text;
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

  return `
    <div class="most-ordered-card" data-item="${sectionId}:${itemIdx}">
      <span class="most-ordered-rank">${rank}</span>
      <div class="most-ordered-card-content">
        <span class="most-ordered-card-badge">${ref.badge[currentLang]}</span>
        <div class="most-ordered-card-name">${item.name[currentLang]}</div>
      </div>
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

function renderMenu() {
  const normalizedQuery = currentQuery.trim().toLowerCase();
  let visibleItems = 0;

  const html = CONFIG.menu.map(sec => {
    let sectionVisibleItems = 0;

    const itemsHtml = sec.items.map((item, idx) => {
        const matchesFilter = currentFilter === 'all' || (item.diet || []).includes(currentFilter);
        const haystack = [
          item.name[currentLang],
          item.desc && item.desc[currentLang],
          item.name.pt,
          item.name.en,
          item.name.es,
          item.name.fr
        ].filter(Boolean).join(' ').toLowerCase();
        const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
        const matchesAllergens = activeAllergenExcludes.size === 0 ||
          !(item.allergens || []).some(a => activeAllergenExcludes.has(a));
        const matches = matchesFilter && matchesQuery && matchesAllergens;
        if (matches) {
          visibleItems++;
          sectionVisibleItems++;
        }

        const soldOut = !!item.soldOut;

        // Badge psicológico
        const badgeHtml = soldOut
          ? `<div class="item-badge item-badge-soldout">${t().soldOut}</div>`
          : (item.badge && ITEM_BADGES[item.badge]
            ? `<div class="item-badge item-badge-${item.badge}">${ITEM_BADGES[item.badge].emoji} ${ITEM_BADGES[item.badge][currentLang]}</div>`
            : '');

        // Botão "+" só aparece se item tem preço parseable (€) e não está esgotado
        const refId = `${sec.id}:${idx}`;
        const canOrder = !soldOut && parsePriceToNumber(item.price) !== null;
        const inCart = getCartQty(refId);
        const addBtnHtml = canOrder ? `
          <div class="menu-item-order-controls ${inCart > 0 ? 'has-qty' : ''}" data-order-controls="${refId}">
            <button class="menu-item-step-btn menu-item-step-btn-minus ${inCart > 0 ? 'show' : ''}" data-decrement-ref="${refId}" aria-label="${t().reduceQty}" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <button class="menu-item-add-btn ${inCart > 0 ? 'added' : ''}" data-add-ref="${refId}" aria-label="${t().increaseQty}" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              ${inCart > 0 ? `<span class="qty-badge">${inCart}</span>` : ''}
            </button>
          </div>
        ` : '';

        return `
        <article class="menu-item ${matches ? '' : 'hidden'}${soldOut ? ' sold-out' : ''}" data-item="${refId}">
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
              <div class="menu-item-actions">
                ${addBtnHtml}
              </div>
            </div>
          </div>
          <div class="menu-item-visual">
            ${item.photo
              ? `<img class="menu-item-photo" src="${item.photo}" loading="lazy" alt="${item.name[currentLang]}">`
              : `<div class="menu-item-photo-placeholder" data-section="${sec.id}"><span>${item.name[currentLang][0].toUpperCase()}</span></div>`
            }
            <button class="menu-item-bookmark ${isFavorited(refId) ? 'saved' : ''}" data-bookmark-ref="${refId}" aria-label="Guardar favorito" type="button">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>
            </button>
          </div>
        </article>
        `;
      }).join('');

    return `
    <section class="menu-section ${sectionVisibleItems > 0 ? '' : 'hidden'}" id="section-${sec.id}">
      <h2 class="menu-section-title">${sec.section[currentLang]}</h2>
      ${sec.desc && sec.desc[currentLang] ? `<p class="menu-section-desc">${sec.desc[currentLang]}</p>` : ''}
      ${itemsHtml}
    </section>
  `;
  }).join('');

  const emptyState = visibleItems === 0
    ? `<div class="menu-empty-state">
         <div class="menu-empty-icon">🔍</div>
         <div class="menu-empty-title">${t().searchEmpty}</div>
         <button class="menu-empty-reset" id="menu-empty-reset">${t().searchReset || 'Limpar filtros'}</button>
       </div>`
    : '';

  document.getElementById('menu').innerHTML = html + emptyState;

  lastVisibleItems = visibleItems;

  const meta = document.getElementById('menu-search-meta');
  if (meta) {
    meta.textContent = normalizedQuery
      ? t().searchResults.replace('{count}', String(visibleItems)).replace('{query}', currentQuery.trim())
      : '';
  }
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

// Renders Vivino-style partial star SVGs for a rating (0–5, one decimal)
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
    const vivinoHtml = w.vivinoRating ? `
      <div class="wine-card-vivino">
        ${renderVivinoStars(w.vivinoRating)}
        <span class="vivino-score"></span>
        <span class="vivino-logo">Vivino</span>
      </div>
    ` : '';

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
          ${vivinoHtml}
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
  const ratingText = CONFIG.googleRating ? `★ ${CONFIG.googleRating} · ` : '';
  document.getElementById('btn-review-sub').textContent = `${ratingText}Google · TheFork${tableText}`;

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

/* ─── Rating gate state & interactions ─── */
let currentRating = 0;

function resetReviewModal() {
  currentRating = 0;
  // Clear auto-triggered flag (manual open resets it)
  const modal = document.getElementById('review-modal');
  if (modal) {
    delete modal.dataset.autoTriggered;
    const inner = modal.querySelector('.modal');
    if (inner) inner.removeAttribute('data-context-label');
  }
  // Show step 1, hide rest
  const s1 = document.getElementById('review-step-1');
  const s2h = document.getElementById('review-step-2-happy');
  const s2u = document.getElementById('review-step-2-unhappy');
  const s3 = document.getElementById('review-step-3');
  showReviewStep(s1);
  hideReviewStep(s2h);
  hideReviewStep(s2u);
  hideReviewStep(s3);
  // Reset stars
  document.querySelectorAll('.star-btn').forEach(b => b.classList.remove('lit'));
  const label = document.getElementById('star-label');
  if (label) { label.textContent = '\u200B'; label.className = 'star-label'; }
  // Clear textarea
  const ta = document.getElementById('review-textarea');
  if (ta) ta.value = '';
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

function setupRatingGate() {
  const picker = document.getElementById('star-picker');
  if (!picker) return;

  // Hover: light up stars up to hovered index (instant \u2014 no stagger on hover)
  picker.addEventListener('mouseover', e => {
    const btn = e.target.closest('.star-btn');
    if (!btn) return;
    const n = parseInt(btn.dataset.star);
    document.querySelectorAll('.star-btn').forEach((b, i) => {
      b.style.setProperty('--star-d', '0ms');
      b.classList.toggle('lit', i < n);
    });
    const label = document.getElementById('star-label');
    if (label) {
      label.textContent = t().starLabels[n] || '';
      label.className = 'star-label pop ' + (n >= 4 ? 'positive' : 'negative');
    }
  });

  picker.addEventListener('mouseleave', () => {
    // Restore to currentRating state (instant)
    document.querySelectorAll('.star-btn').forEach((b, i) => {
      b.style.setProperty('--star-d', '0ms');
      b.classList.toggle('lit', i < currentRating);
    });
    const label = document.getElementById('star-label');
    if (label && currentRating === 0) {
      label.textContent = '\u200B';
      label.className = 'star-label';
    }
  });

  // Click: commit rating and advance
  picker.addEventListener('click', e => {
    const btn = e.target.closest('.star-btn');
    if (!btn) return;
    haptic();
    currentRating = parseInt(btn.dataset.star);
    if (currentRating >= 4) {
      track('review_positive', { rating: currentRating });
    } else {
      track('review_negative', { rating: currentRating });
    }

    // Light up stars permanently with stagger
    document.querySelectorAll('.star-btn').forEach((b, i) => {
      b.style.setProperty('--star-d', `${i * 45}ms`);
      b.classList.toggle('lit', i < currentRating);
    });

    // Brief pause then advance to step 2
    setTimeout(() => {
      hideReviewStep(document.getElementById('review-step-1'));

      if (currentRating >= 4) {
        showReviewStep(document.getElementById('review-step-2-happy'));
      } else {
        showReviewStep(document.getElementById('review-step-2-unhappy'));
        const ta = document.getElementById('review-textarea');
        if (ta) setTimeout(() => ta.focus(), 50);
      }
    }, 380);
  });

  // Send private feedback via WhatsApp
  const sendBtn = document.getElementById('review-send-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      haptic();
      track('review_whatsapp_clicked');
      const ta = document.getElementById('review-textarea');
      const text = ta ? ta.value.trim() : '';
      const stars = '★'.repeat(currentRating) + '☆'.repeat(5 - currentRating);
      const table = tableNumber ? ` | Mesa ${tableNumber}` : '';
      const msg = `[Feedback Privado${table}] ${stars}\n${text || '(sem comentário)'}`;
      window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
      showThanks(false);
    });
  }

  // Char counter for private feedback textarea
  const reviewTa = document.getElementById('review-textarea');
  if (reviewTa) {
    const counter = document.createElement('p');
    counter.className = 'review-char-counter';
    reviewTa.insertAdjacentElement('afterend', counter);
    const maxLen = parseInt(reviewTa.getAttribute('maxlength') || 500);
    function updateCharCounter() {
      const used = reviewTa.value.length;
      counter.textContent = `${used}/${maxLen}`;
      counter.classList.toggle('review-char-warn', maxLen - used < 60);
    }
    reviewTa.addEventListener('input', updateCharCounter);
    updateCharCounter();
  }

  // When user clicks a platform link on happy path → show thanks after
  ['review-google', 'review-thefork'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', () => {
        if (id === 'review-google') {
          track('review_google_clicked');
        } else {
          track('review_thefork_clicked');
        }
        setTimeout(() => showThanks(true), 300);
      });
    }
  });
}

function showThanks(happy) {
  const s2h = document.getElementById('review-step-2-happy');
  const s2u = document.getElementById('review-step-2-unhappy');
  const s3 = document.getElementById('review-step-3');
  hideReviewStep(s2h);
  hideReviewStep(s2u);
  showReviewStep(s3);

  const icon = document.getElementById('review-thankyou-icon');
  const title = document.getElementById('review-thanks-title');
  const sub = document.getElementById('review-thanks-sub');
  if (happy) {
    if (icon) icon.textContent = t().ratingThanksHappyIcon;
    if (title) title.textContent = t().ratingThanksHappyTitle;
    if (sub) sub.textContent = t().ratingThanksHappySub;
  } else {
    if (icon) icon.textContent = t().ratingThanksUnhappyIcon;
    if (title) title.textContent = t().ratingThanksUnhappyTitle;
    if (sub) sub.textContent = t().ratingThanksUnhappySub;
  }

  // Mark this session as rated — auto-modal won't show again
  try { sessionStorage.setItem('nexo_rated', '1'); } catch(e) {}

  // Auto-close after 3s
  setTimeout(() => closeModal('review-modal'), 3000);
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

// Language toggle
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

// PT override prompt — shown when auto-detect picks a non-PT language
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

// Quick nav
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
    track('filter_diet', { filter: currentFilter });
    renderDietFilter();
    renderMenu();
    if (window._attachMenuObserver) window._attachMenuObserver();
  });
}

// Allergen exclude filter


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

// Allergen legend modal
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

// Scroll-to-top on tab change
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
    // Photo tap → lightbox (not modal)
    const photoEl = e.target.closest('.menu-item-photo');
    if (photoEl && photoEl.src) {
      openPhotoLightbox(photoEl.src, photoEl.alt);
      return;
    }

    // Ignorar clicks nos controlos de quantidade (tratados pelo setupMenuAddButtons)
    if (e.target.closest('[data-add-ref]') || e.target.closest('[data-decrement-ref]')) return;
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

// Photo lightbox
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
  const decrementBtn = document.getElementById('item-modal-decrement');
  const orderBar = document.getElementById('item-modal-order-bar');
  if (addBtn && addLabel && orderBar) {
    const refId = `${sectionId}:${itemIdx}`;
    const canOrder = parsePriceToNumber(item.price) !== null;
    if (canOrder) {
      orderBar.style.display = 'flex';
      addBtn.dataset.addRef = refId;
      addBtn.setAttribute('aria-label', t().increaseQty);
      const qty = getCartQty(refId);
      addLabel.textContent = qty > 0 ? `${qty} ${t().inOrder}` : t().addToOrder;
      orderBar.classList.toggle('has-decrement', qty > 0);
      if (addBtn._feedbackTimer) {
        clearTimeout(addBtn._feedbackTimer);
        addBtn._feedbackTimer = null;
      }
      addBtn.classList.remove('just-added');
      if (decrementBtn) {
        decrementBtn.dataset.decrementRef = refId;
        decrementBtn.setAttribute('aria-label', t().reduceQty);
        decrementBtn.classList.toggle('show', qty > 0);
      }
    } else {
      // Items com P.V.P. (preço não definido) — não ordenáveis via cart
      orderBar.style.display = 'none';
      orderBar.classList.remove('has-decrement');
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

  // ═══ BOOKMARK button ═══
  const bookmarkBtn = document.getElementById('item-bookmark-btn');
  const bookmarkLabel = document.getElementById('bookmark-label');
  const bookmarkIcon = document.getElementById('bookmark-icon');
  if (bookmarkBtn) {
    const refId = `${sectionId}:${itemIdx}`;
    bookmarkBtn.dataset.bookmarkRef = refId;
    const isSaved = favorites.has(refId);
    bookmarkBtn.classList.toggle('saved', isSaved);
    if (bookmarkIcon) bookmarkIcon.textContent = isSaved ? '🔖' : '🔖';
    if (bookmarkLabel) bookmarkLabel.textContent = isSaved ? t().bookmarkSaved : t().bookmarkSave;
  }

  // ═══ SHARE button — store current item for canvas generation ═══
  currentShareItem = { sectionId, itemIdx, item };
  const shareBtn = document.getElementById('item-share-btn');
  const shareLabel = document.getElementById('item-share-label');
  if (shareBtn) {
    if (shareLabel) shareLabel.textContent = t().shareDish;
  }

  track('item_viewed', { item_name: item.name.pt, item_category: sectionId, item_price: parsePriceToNumber(item.price) || 0 });
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

  track('wine_open', { name: w.name, price: w.price });
  openModal('wine-modal');
}

// Review button
function setupReviewButton() {
  document.getElementById('btn-review').addEventListener('click', () => {
    haptic();
    resetReviewModal();
    track('review_prompted');
    openModal('review-modal');
  });
}

// Close modals
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

// Wi-Fi copy
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
  if (sharedCart) return sharedCartItems.filter(r => r.item_id === refId).reduce((s, r) => s + r.quantity, 0);
  const entry = cart.find(c => c.refId === refId);
  return entry ? entry.qty : 0;
}

// Adiciona 1x ao cart (ou incrementa)
function addToCart(refId) {
  if (sharedCart) { sharedAddToCart(refId); return; }
  const pill = document.getElementById('cart-pill');
  const wasVisible = pill?.classList.contains('show');
  const entry = cart.find(c => c.refId === refId);
  if (entry) {
    entry.qty += 1;
  } else {
    cart.push({ refId, qty: 1 });
  }
  const it = getItemByRef(refId);
  if (it) track('item_added', { item_name: it.name.pt, item_category: refId.split(':')[0], item_price: parsePriceToNumber(it.price) || 0 });
  onCartChange();
  if (wasVisible && pill) {
    pill.classList.remove('pop');
    void pill.offsetWidth;
    pill.classList.add('pop');
    setTimeout(() => pill.classList.remove('pop'), 450);
  }
}

// Decrementa 1x (se 0, remove)
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

// Remove completamente
function removeFromCart(refId) {
  if (sharedCart) { sharedRemoveFromCart(refId); return; }
  const _removedItem = getItemByRef(refId);
  if (_removedItem) track('item_removed', { item_name: _removedItem.name.pt });
  cart = cart.filter(c => c.refId !== refId);
  onCartChange();
}

// Limpa tudo
function clearCart() {
  if (sharedCart) { sharedClearCart(); return; }
  cart = [];
  onCartChange();
}

// Total do cart em número
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

// Total de items (soma das quantidades)
function getCartItemCount() {
  if (sharedCart) return sharedCartItems.reduce((s, r) => s + r.quantity, 0);
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
  updateOpenItemModalControls();
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
  textEl.textContent = sharedCart
    ? `👥 ${t().viewOrder} · ${count} ${label}`
    : `${t().viewOrder} · ${count} ${label}`;
  pill.setAttribute('aria-label', `${t().viewOrder}: ${count} ${label}`);

  const total = getCartTotal();
  if (total > 0) {
    const prev = totalEl.textContent;
    totalEl.textContent = formatPrice(total);
    totalEl.classList.remove('hidden');
    if (prev !== totalEl.textContent) {
      totalEl.classList.remove('pulse');
      void totalEl.offsetWidth;
      totalEl.classList.add('pulse');
      totalEl.addEventListener('animationend', () => totalEl.classList.remove('pulse'), { once: true });
    }
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

  // Shared Cart: update header, toggle trigger
  renderSharedCartHeader();
  const _scTrigger = document.getElementById('nexo-shared-cart-trigger');
  if (_scTrigger) _scTrigger.style.display = sharedCart ? 'none' : '';

  if (sharedCart) {
    const sharedItems = sharedCartItems;
    if (sharedItems.length === 0) {
      listEl.innerHTML = `<div class="cart-empty">${t().cartEmpty}</div>`;
      if (totalValue) totalValue.textContent = formatPrice(0);
      if (showStaffBtn) showStaffBtn.style.display = 'none';
      if (clearBtn) clearBtn.style.display = 'none';
      return;
    }
    if (showStaffBtn) showStaffBtn.style.display = 'flex';
    if (clearBtn) clearBtn.style.display = 'block';
    listEl.innerHTML = sharedItems.map(row => {
      const item = getItemByRef(row.item_id);
      const nm   = item ? item.name[currentLang] : row.item_name;
      const price = item ? (parsePriceToNumber(item.price) || 0) : (row.item_price || 0);
      const lineTotal = price * row.quantity;
      const isOwn = row.member_name === sharedMemberName;
      const safeId = row.item_id.replace(/"/g,'');
      return `
        <div class="cart-list-item">
          <span class="cart-item-qty">${row.quantity}×</span>
          <div class="cart-item-name-col">
            <span class="cart-item-name">${nm}</span>
            <span class="cart-item-member">adicionado por ${row.member_name}</span>
          </div>
          <span class="cart-item-price">${formatPrice(lineTotal)}</span>
          <div class="cart-item-controls"${isOwn ? '' : ' style="visibility:hidden"'}>
            <button class="cart-qty-btn" data-cart-decrement="${safeId}" aria-label="Menos">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <button class="cart-qty-btn" data-cart-increment="${safeId}" aria-label="Mais">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
        </div>`;
    }).join('');
    if (totalValue) totalValue.textContent = formatPrice(getCartTotal());
    return;
  }

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

// STAFF VIEW — fullscreen
function openStaffView() {
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

  if (tableNumber) {
    tableEl.textContent = `${t().tableHint} ${tableNumber}`;
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

// Setup: botões "+" no menu (delegação)
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

// Setup: botão "Adicionar ao pedido" no modal
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
      const _splitPanel = document.getElementById('panel-split');
      if (_splitPanel && _splitPanel.style.display !== 'none') {
        track('split_bill_completed', { split_mode: splitMode, people_count: splitPeople });
      }
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
let customPersonNames = []; // nomes personalizados nesta sessão

// Nome de uma pessoa — custom > PERSON_NAMES > fallback
function getPersonName(i) {
  return (customPersonNames[i] && customPersonNames[i].trim())
    || (PERSON_NAMES[currentLang] || PERSON_NAMES.pt)[i]
    || `P${i + 1}`;
}

// Inicializa/reset os sets de atribuição — preserva nomes custom
function initSplitAssign() {
  splitAssign = Array.from({ length: splitPeople }, () => new Set());
  // Expande o array de nomes sem apagar os existentes
  while (customPersonNames.length < splitPeople) customPersonNames.push('');
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
    // Quantas pessoas partilham este item?
    const sharedBy = splitAssign.filter(s => s && s.has(entry.refId)).length || 1;
    return sum + (price * entry.qty) / sharedBy;
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
      <span class="split-eq-person">${getPersonName(i)}</span>
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
          ${getPersonName(i)}
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
        track('split_bill_opened', { split_mode: splitMode });
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
   12D. FAVORITES — Guardar favoritos em sessionStorage
   ═══════════════════════════════════════════════════════════════════════════ */

function isFavorited(refId) { return favorites.has(refId); }

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

let _countdownInterval = null;

function getCountdownBanner() {
  // Only count down for banners with id "happy-hour" (or any with countdown: true)
  if (!CONFIG.timeBanners) return null;
  const now = new Date();
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

    const now = new Date();
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

// Canvas text word-wrap helper
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

// Darken/lighten hex color
function shadeColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}


/* ═══════════════════════════════════════════════════════════════════════════
   12G. ORDER HISTORY — Track pedidos enviados ao staff na sessão
   ═══════════════════════════════════════════════════════════════════════════ */

// Snapshot the current cart into history when "Mostrar ao staff" is used
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
        return item ? { qty: entry.qty, name: item.name[currentLang], note: '', member: null } : null;
      }).filter(Boolean);

  historyEl.innerHTML = `
    <div class="staff-order-block">
      ${rows.map(r => `
        <div class="staff-list-item">
          <span class="staff-list-qty">${r.qty}×</span>
          <div class="staff-list-name-wrap">
            <span class="staff-list-name">${r.name}</span>
            ${r.member ? `<span class="staff-item-member">${r.member}</span>` : ''}
          </div>
        </div>`).join('')}
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
  const allAssigned = cart.length > 0 && cart.every(entry =>
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
      <span style="color:var(--gold-bright)">${standings[0].name}</span>
      ${t().splitPodiumWinner}
    </div>
    <div class="split-podium-bars">
      ${standings.map((s, rank) => {
        const pct = max > 0 ? (s.total / max) * 100 : 0;
        return `
          <div class="podium-row">
            <span class="podium-medal">${medals[rank] || ''}</span>
            <span class="podium-name">${s.name}</span>
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


/* ─── Rename de pessoa no split ─── */
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
   13. BOOT
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── KILL-SWITCH POR CONTRATO ───────────────────────────────────────────
// Se o contrato do espaço estiver inativo/vencido, o menu fica indisponível.
// FAIL-OPEN: qualquer falha de rede/config → o menu abre normalmente (nunca
// deixa um cliente pagante sem menu por causa de um hiccup).
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

document.addEventListener('DOMContentLoaded', () => {
  initContractGate();
  applyBrandColors();
  detectLang();
  initAnalytics();
  renderAll();
  showLangPrompt();
  track('menu_opened', {
    espaco_tipo: (typeof ESPACO_TIPO !== 'undefined' ? ESPACO_TIPO : 'rest'),
    menu_language: currentLang,
  });
  setupLanguage();
  setupSharedCart();
  setupQuickNav();
  setupSearch();
  setupDietFilter();
  setupCategoryTabs();
  setupWineFilters();
  setupMostOrdered();
  setupMenuClicks();
  setupWineClicks();
  setupReviewButton();
  setupModalCloses();
  setupRatingGate();
  resetReviewModal();
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
  setupPersonRename();
  // ─── Favorites ───
  setupFavorites();
  renderFavorites();
  // ─── Happy Hour Countdown ───
  setupCountdown();
  // ─── Allergen Legend + Filter ───
  setupAllergenLegend();
  // ─── Share Dish ───
  setupShareDish();

  // ─── Auto review modal after 30s ───
  // Only shows if: no modal is already open, user hasn't already rated this session
  setTimeout(() => {
    const alreadyRated = sessionStorage.getItem('nexo_rated');
    const anyOpen = document.querySelector('.modal-overlay.show');
    const modal = document.getElementById('review-modal');
    if (!alreadyRated && !anyOpen) {
      resetReviewModal();
      track('review_prompted');
      // Mark as auto-triggered and set context label (shown via CSS ::before)
      if (modal) {
        modal.dataset.autoTriggered = '1';
        const inner = modal.querySelector('.modal');
        if (inner) {
          const labels = { pt: 'Como foi a sua visita?', en: 'How was your visit?', es: '¿Cómo fue su visita?', fr: "Comment s'était votre visite?" };
          inner.dataset.contextLabel = labels[currentLang] || labels.pt;
        }
      }
      openModal('review-modal');
    }
  }, 30000);
});


/* ═══════════════════════════════════════════════════════════════════════════
   15. SHARED CART — Mesa em Grupo
   ═══════════════════════════════════════════════════════════════════════════ */

function generateCartCode() {
  const C = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length: 4}, () => C[Math.floor(Math.random() * C.length)]).join('');
}

async function loadSupabase() {
  if (_supabaseClient) return _supabaseClient;
  const { supabaseUrl, supabaseAnonKey } = CONFIG;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase not configured');
  if (typeof window.supabase !== 'undefined') {
    _supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    return _supabaseClient;
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload = () => {
      _supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
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

/* ─── Supabase ops ─── */
async function syncSharedCartItems() {
  if (!sharedCart) return;
  try {
    const sb = await loadSupabase();
    const { data, error } = await sb
      .from('shared_cart_items')
      .select('*')
      .eq('cart_id', sharedCart.id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    sharedCartItems = data || [];
  } catch (e) {
    console.warn('[SharedCart] sync error', e);
  }
  onCartChange();
}

async function subscribeSharedCart(cartId) {
  const sb = await loadSupabase();
  if (_sharedCartChannel) { try { sb.removeChannel(_sharedCartChannel); } catch (_) {} }
  _sharedCartChannel = sb.channel('nexo-cart-' + cartId)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'shared_cart_items',
      filter: 'cart_id=eq.' + cartId,
    }, () => syncSharedCartItems())
    .subscribe(status => {
      if (status === 'CHANNEL_ERROR') showCartToast('Ligação perdida — a tentar reconectar...');
    });
}

async function sharedAddToCart(refId) {
  const item = getItemByRef(refId);
  if (!item) return;
  const existing = sharedCartItems.find(r => r.item_id === refId && r.member_name === sharedMemberName);
  if (existing) {
    existing.quantity += 1;
  } else {
    sharedCartItems.push({
      id: 'opt-' + Date.now(),
      cart_id: sharedCart.id,
      member_name: sharedMemberName,
      item_id: refId,
      item_name: item.name.pt || item.name[currentLang],
      item_price: parsePriceToNumber(item.price) || 0,
      quantity: 1,
      note: null,
      created_at: new Date().toISOString(),
    });
  }
  onCartChange();
  try {
    const sb = await loadSupabase();
    if (existing && !String(existing.id).startsWith('opt-')) {
      const { error } = await sb.from('shared_cart_items')
        .update({ quantity: existing.quantity }).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await sb.from('shared_cart_items').insert({
        cart_id: sharedCart.id,
        member_name: sharedMemberName,
        item_id: refId,
        item_name: item.name.pt || item.name[currentLang],
        item_price: parsePriceToNumber(item.price) || 0,
        quantity: 1,
        note: null,
      });
      if (error) throw error;
    }
    track('item_added', { item_name: item.name.pt, item_category: refId.split(':')[0], item_price: parsePriceToNumber(item.price) || 0 });
    await syncSharedCartItems();
  } catch (e) {
    console.warn('[SharedCart] add error', e);
    showCartToast('Erro ao adicionar item');
    await syncSharedCartItems();
  }
}

async function sharedDecrementCart(refId) {
  const existing = sharedCartItems.find(r => r.item_id === refId && r.member_name === sharedMemberName);
  if (!existing) return;
  const prevQty = existing.quantity;
  if (existing.quantity <= 1) {
    sharedCartItems = sharedCartItems.filter(r => r !== existing);
  } else {
    existing.quantity -= 1;
  }
  onCartChange();
  try {
    const sb = await loadSupabase();
    if (prevQty <= 1) {
      const { error } = await sb.from('shared_cart_items').delete().eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await sb.from('shared_cart_items')
        .update({ quantity: existing.quantity }).eq('id', existing.id);
      if (error) throw error;
    }
    await syncSharedCartItems();
  } catch (e) {
    console.warn('[SharedCart] decrement error', e);
    showCartToast('Erro ao atualizar item');
    await syncSharedCartItems();
  }
}

async function sharedRemoveFromCart(refId) {
  const existing = sharedCartItems.find(r => r.item_id === refId && r.member_name === sharedMemberName);
  if (!existing) return;
  sharedCartItems = sharedCartItems.filter(r => r !== existing);
  onCartChange();
  try {
    const sb = await loadSupabase();
    const { error } = await sb.from('shared_cart_items').delete().eq('id', existing.id);
    if (error) throw error;
    await syncSharedCartItems();
  } catch (e) {
    console.warn('[SharedCart] remove error', e);
    await syncSharedCartItems();
  }
}

async function sharedClearCart() {
  sharedCartItems = sharedCartItems.filter(r => r.member_name !== sharedMemberName);
  onCartChange();
  try {
    const sb = await loadSupabase();
    const { error } = await sb.from('shared_cart_items')
      .delete().eq('cart_id', sharedCart.id).eq('member_name', sharedMemberName);
    if (error) throw error;
    await syncSharedCartItems();
  } catch (e) {
    console.warn('[SharedCart] clear error', e);
    await syncSharedCartItems();
  }
}

/* ─── Create / Join / Leave ─── */
async function createSharedCart(name, code) {
  const sb = await loadSupabase();
  const { data: exists } = await sb.from('shared_carts').select('id')
    .eq('espaco_slug', CONFIG.slug).eq('code', code).maybeSingle();
  if (exists) code = generateCartCode();

  const { data, error } = await sb.from('shared_carts')
    .insert({ espaco_slug: CONFIG.slug, code })
    .select().single();
  if (error) throw error;

  sharedCart = { id: data.id, code: data.code };
  sharedMemberName = name;
  localStorage.setItem('nexo_member_name', name);

  for (const entry of cart) {
    const item = getItemByRef(entry.refId);
    if (!item) continue;
    await sb.from('shared_cart_items').insert({
      cart_id: data.id,
      member_name: name,
      item_id: entry.refId,
      item_name: item.name.pt || item.name[currentLang],
      item_price: parsePriceToNumber(item.price) || 0,
      quantity: entry.qty,
      note: entry.note || null,
    });
  }
  cart = [];

  await subscribeSharedCart(data.id);
  await syncSharedCartItems();
  track('shared_cart_created', { espaco_slug: CONFIG.slug });
}

async function joinSharedCart(code, name) {
  const sb = await loadSupabase();
  const { data, error } = await sb.from('shared_carts').select('*')
    .eq('espaco_slug', CONFIG.slug)
    .eq('code', code.toUpperCase().trim())
    .gte('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error || !data) throw new Error('cart_not_found');

  sharedCart = { id: data.id, code: data.code };
  sharedMemberName = name;
  localStorage.setItem('nexo_member_name', name);

  await subscribeSharedCart(data.id);
  await syncSharedCartItems();

  const members = new Set(sharedCartItems.map(i => i.member_name));
  track('shared_cart_joined', { espaco_slug: CONFIG.slug, member_count: members.size });
}

async function leaveSharedCart() {
  if (_sharedCartChannel) {
    try { const sb = await loadSupabase(); sb.removeChannel(_sharedCartChannel); } catch (_) {}
    _sharedCartChannel = null;
  }
  sharedCart = null;
  sharedMemberName = '';
  sharedCartItems = [];
  cart = [];
  onCartChange();
}

/* ─── UI helpers ─── */
function renderSharedCartHeader() {
  const el = document.getElementById('nexo-shared-cart-header');
  if (!el) return;
  if (!sharedCart) { el.style.display = 'none'; return; }
  const members = [...new Set(sharedCartItems.map(r => r.member_name))];
  el.style.display = 'flex';
  el.innerHTML =
    `<span>👥 Carrinho de mesa · <strong>${sharedCart.code}</strong></span>`
    + `<span class="shared-cart-members">${members.length} ${members.length === 1 ? 'pessoa' : 'pessoas'}</span>`
    + `<button class="shared-cart-leave-btn" id="nexo-shared-leave-btn">Sair</button>`;
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
    const savedName = localStorage.getItem('nexo_member_name') || '';
    const nameEl = document.getElementById('nexo-shared-create-name');
    if (nameEl && !nameEl.value) nameEl.value = savedName;
    setTimeout(() => document.getElementById('nexo-shared-create-name')?.focus(), 100);
  }
  if (view === 'join') {
    const savedName = localStorage.getItem('nexo_member_name') || '';
    const nameEl = document.getElementById('nexo-shared-join-name');
    if (nameEl && !nameEl.value) nameEl.value = savedName;
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
    const nameInput = document.getElementById('nexo-shared-create-name');
    const name = nameInput?.value.trim() || 'Convidado';
    const btn = document.getElementById('nexo-shared-create-confirm');
    if (btn) { btn.disabled = true; btn.textContent = 'A criar...'; }
    try {
      await createSharedCart(name, _pendingCartCode || generateCartCode());
      closeSharedCartSheet();
      setTimeout(() => openModal('cart-sheet'), 200);
    } catch (e) {
      console.error('[SharedCart] create error', e);
      showCartToast('Erro ao criar carrinho. Tenta novamente.');
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

  if (joinCode) {
    joinCode.addEventListener('input', () => {
      joinCode.value = joinCode.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 4);
      if (joinError) joinError.style.display = 'none';
    });
  }

  document.getElementById('nexo-shared-join-confirm')?.addEventListener('click', async () => {
    const code = joinCode?.value.trim() || '';
    const name = document.getElementById('nexo-shared-join-name')?.value.trim() || 'Convidado';
    const btn  = document.getElementById('nexo-shared-join-confirm');
    if (code.length !== 4) { joinCode?.focus(); return; }
    if (btn) { btn.disabled = true; btn.textContent = 'A juntar...'; }
    if (joinError) joinError.style.display = 'none';
    try {
      await joinSharedCart(code, name);
      closeSharedCartSheet();
      setTimeout(() => openModal('cart-sheet'), 200);
    } catch (e) {
      if (joinError) { joinError.textContent = 'Código não encontrado. Confirma com a mesa.'; joinError.style.display = 'block'; }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Juntar'; }
    }
  });
}



