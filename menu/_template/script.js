/* Escapa dados de utilizador (notas, nomes de convidados, payloads Supabase)
   antes de qualquer interpolação em innerHTML. */
const WINE_TYPE_LABELS = {
  pt: { tinto:"Tinto", branco:"Branco", verde:"Verde", rose:"Rosé", espumante:"Espumante", agua:"Água", refrigerante:"Refrigerante", sumo:"Sumo Natural", cerveja:"Cerveja", cocktail:"Cocktail" },
  en: { tinto:"Red", branco:"White", verde:"Green", rose:"Rosé", espumante:"Sparkling", agua:"Water", refrigerante:"Soft Drink", sumo:"Fresh Juice", cerveja:"Beer", cocktail:"Cocktail" },
  es: { tinto:"Tinto", branco:"Blanco", verde:"Verde", rose:"Rosado", espumante:"Espumoso", agua:"Agua", refrigerante:"Refresco", sumo:"Zumo Natural", cerveja:"Cerveza", cocktail:"Cóctel" },
  fr: { tinto:"Rouge", branco:"Blanc", verde:"Verde", rose:"Rosé", espumante:"Mousseux", agua:"Eau", refrigerante:"Boisson gazeuse", sumo:"Jus Naturel", cerveja:"Bière", cocktail:"Cocktail" }
};

/* Badges psicológicos — emoji + texto multilíngue */
const UI = {
  pt: {
    specialHappyHour: "Happy Hour", specialWeek: "Esta semana",
    menu: "Menu",
    mostOrdered: "Os mais pedidos", mostOrderedBadge: "Especialidades da casa",
    mostOrderedSub: "O que os nossos clientes mais escolhem",
    eliteBadge: "A experiência da casa",
    wines: "Drinks", winesBadge: "Bebidas da casa",
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
    navMenu: "Menu", navTop: "Mais pedidos", navWines: "Drinks",
    navWifi: "Wi-Fi", navContact: "Contacto", navReview: "Avaliar",navInsta: "Instagram", navMesa: "Mesa",
    wineFilterCountry: "País", wineFilterType: "Tipo", wineFilterGrape: "Marca",
    wineEmpty: "Nenhuma bebida corresponde a estes filtros.",
    wineSpecCountry: "País", wineSpecRegion: "Região", wineSpecGrape: "Marca",
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
    // Confirm order
    confirmOrder: "Confirmar Pedido →",
    confirmTitle: "Rever Pedido",
    confirmSectionLabel: "O seu pedido",
    confirmTableLabel: "Número da mesa",
    confirmTablePlaceholder: "4",
    confirmTablePrefix: "Mesa",
    confirmTableRequired: "Indique o número da mesa para continuar.",
    confirmWhatsapp: "Enviar por WhatsApp",
    confirmStaff: "Mostrar ao Staff",
    confirmKitchen: "Enviar para a cozinha",
    confirmOpeningWA: "✓ A abrir WhatsApp...",
    cartNotesBadge: "Notas adicionadas",
    noteAdd: "+ adicionar nota",
    notePlaceholder: "ex: sem ovo, arroz em vez de batata...",
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
    wines: "Drinks", winesBadge: "House drinks",
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
    navMenu: "Menu", navTop: "Most ordered", navWines: "Drinks",
    navWifi: "Wi-Fi", navContact: "Contact", navReview: "Rate", navInsta: "Instagram", navMesa: "Table",
    wineFilterCountry: "Country", wineFilterType: "Type", wineFilterGrape: "Brand",
    wineEmpty: "No drinks match these filters.",
    wineSpecCountry: "Country", wineSpecRegion: "Region", wineSpecGrape: "Brand",
    wineSpecAbv: "ABV", wineSpecVolume: "Volume",
    vivinoSeeMore: "See on Vivino →",
    upsellTitle: "Goes well with...",
    addToOrder: "Add to order", addedToOrder: "Added ✓",
    inOrder: "In order", viewOrder: "View order", reduceQty: "Decrease quantity", increaseQty: "Increase quantity",
    cartItem: "item", cartItems: "items",
    cartTitle: "My order", cartEmpty: "Nothing added yet.",
    cartTotal: "Total", cartShowStaff: "Show to staff", cartClear: "Clear order",
    staffHelper: "Show this screen to staff to order",
    confirmOrder: "Confirm Order →",
    confirmTitle: "Review Order",
    confirmSectionLabel: "Your order",
    confirmTableLabel: "Table number",
    confirmTablePlaceholder: "4",
    confirmTablePrefix: "Table",
    confirmTableRequired: "Please enter the table number to continue.",
    confirmWhatsapp: "Send via WhatsApp",
    confirmStaff: "Show to Staff",
    confirmKitchen: "Send to kitchen",
    confirmOpeningWA: "✓ Opening WhatsApp...",
    cartNotesBadge: "Notes added",
    noteAdd: "+ add note",
    notePlaceholder: "e.g. no egg, rice instead of fries...",
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
    wines: "Drinks", winesBadge: "Bebidas de la casa",
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
    navMenu: "Menú", navTop: "Más pedidos", navWines: "Drinks",
    navWifi: "Wi-Fi", navContact: "Contacto", navReview: "Valorar",navInsta: "Instagram", navMesa: "Mesa",
    wineFilterCountry: "País", wineFilterType: "Tipo", wineFilterGrape: "Marca",
    wineEmpty: "Ninguna bebida coincide con estos filtros.",
    wineSpecCountry: "País", wineSpecRegion: "Región", wineSpecGrape: "Marca",
    wineSpecAbv: "Alcohol", wineSpecVolume: "Volumen",
    vivinoSeeMore: "Ver en Vivino →",
    upsellTitle: "Combina con...",
    addToOrder: "Añadir al pedido", addedToOrder: "Añadido ✓",
    inOrder: "En el pedido", viewOrder: "Ver pedido", reduceQty: "Reducir cantidad", increaseQty: "Aumentar cantidad",
    cartItem: "artículo", cartItems: "artículos",
    cartTitle: "Mi pedido", cartEmpty: "Aún no ha añadido nada.",
    cartTotal: "Total", cartShowStaff: "Mostrar al staff", cartClear: "Vaciar pedido",
    staffHelper: "Muestre esta pantalla al staff para pedir",
    confirmOrder: "Confirmar Pedido →",
    confirmTitle: "Revisar Pedido",
    confirmSectionLabel: "Su pedido",
    confirmTableLabel: "Número de mesa",
    confirmTablePlaceholder: "4",
    confirmTablePrefix: "Mesa",
    confirmTableRequired: "Indique el número de mesa para continuar.",
    confirmWhatsapp: "Enviar por WhatsApp",
    confirmStaff: "Mostrar al Staff",
    confirmKitchen: "Enviar a la cocina",
    confirmOpeningWA: "✓ Abriendo WhatsApp...",
    cartNotesBadge: "Notas añadidas",
    noteAdd: "+ añadir nota",
    notePlaceholder: "ej: sin huevo, arroz en vez de patatas...",
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
    wines: "Drinks", winesBadge: "Boissons maison",
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
    navMenu: "Menu", navTop: "Plus commandés", navWines: "Drinks",
    navWifi: "Wi-Fi", navContact: "Contact", navReview: "Évaluer", navInsta: "Instagram", navMesa: "Table",
    wineFilterCountry: "Pays", wineFilterType: "Type", wineFilterGrape: "Marque",
    wineEmpty: "Aucune boisson ne correspond à ces filtres.",
    wineSpecCountry: "Pays", wineSpecRegion: "Région", wineSpecGrape: "Marque",
    wineSpecAbv: "Alcool", wineSpecVolume: "Volume",
    vivinoSeeMore: "Voir sur Vivino →",
    upsellTitle: "Se marie avec...",
    addToOrder: "Ajouter à la commande", addedToOrder: "Ajouté ✓",
    inOrder: "Dans la commande", viewOrder: "Voir la commande", reduceQty: "Réduire la quantité", increaseQty: "Augmenter la quantité",
    cartItem: "article", cartItems: "articles",
    cartTitle: "Ma commande", cartEmpty: "Rien n'a été ajouté.",
    cartTotal: "Total", cartShowStaff: "Montrer au personnel", cartClear: "Vider",
    staffHelper: "Montrez cet écran au personnel pour commander",
    confirmOrder: "Confirmer la Commande →",
    confirmTitle: "Vérifier la Commande",
    confirmSectionLabel: "Votre commande",
    confirmTableLabel: "Numéro de table",
    confirmTablePlaceholder: "4",
    confirmTablePrefix: "Table",
    confirmTableRequired: "Indiquez le numéro de table pour continuer.",
    confirmWhatsapp: "Envoyer par WhatsApp",
    confirmStaff: "Montrer au Personnel",
    confirmKitchen: "Envoyer en cuisine",
    confirmOpeningWA: "✓ Ouverture de WhatsApp...",
    cartNotesBadge: "Notes ajoutées",
    noteAdd: "+ ajouter une note",
    notePlaceholder: "ex: sans œuf, riz à la place des frites...",
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


let currentLang = 'pt';
let currentFilter = 'all';
let currentQuery = '';
let wineFilters = { country: 'all', type: 'all', grape: 'all' };
let activeAllergenExcludes = new Set();

/* ─── ORDER SYSTEM STATE ─── */
// Cart: array de objetos { refId: "sectionId:itemIdx", qty: number, note: string }
// Nunca persiste (intencional) — estado morre ao fechar o separador
let cart = [];

/* ─── SHARED CART STATE ─── */
let sharedCart       = null;  // { code } when active, null otherwise
let sharedMemberName = '';    // current user's display name
let sharedCartItems  = [];    // aggregated from all members' Broadcast states
let _myCartItems     = [];    // this member's own items
let _memberStates    = {};    // { [memberKey]: { name, items[] } }
let _pendingCartCode = null;  // code pre-generated for the CREATE flow
let _supabaseClient  = null;
let _sharedCartChannel = null;
let _myPresenceKey   = null;  // unique key for this member

let confirmTableValue = '';     // mesa atual no ecrã de confirmação
let pulseTimerFired = false;    // pulse do botão Confirmar (só uma vez por sessão)
let pulseTimer = null;

// Order ID curto, gerado uma vez por sessão (staff referencia se várias mesas mostram)
const ORDER_ID = Math.random().toString(36).substring(2, 6).toUpperCase();

/* ─── FAVORITES STATE ─── */
let favorites = new Set(JSON.parse(sessionStorage.getItem('nexo_favs') || '[]'));

let currentShareItem = null; // item currently open in modal for share

let lastVisibleItems = 0; // updated by renderMenu(), read by search debounce

/* ─── SPLIT BILL STATE & i18n (declared early so renderCartSheet can use ts()) ─── */
const SPLIT_MAX = 10;
const SPLIT_MIN = 2;

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


/* ─── shadeColor helper — used by applyBrandColors and share canvas ─── */
// NEXO — Auto Language Detection
let _langAutoDetected = false;

/* Haptic feedback subtil — chama se disponível */
// SUBSTITUIR getActiveBanner() — devolve agora ghost + headline
// ─── Hora do servidor ────────────────────────────────────────────────
// O happy hour deve seguir a hora REAL, não o relógio do telemóvel (que
// pode estar errado/em outro fuso). Offset via header Date do próprio
// servidor (Netlify edge), calculado uma vez ao arrancar; 0 se falhar.
let _serverClockOffset = 0;
try {
  fetch(location.href, { method: 'HEAD', cache: 'no-store' }).then((r) => {
    const d = r.headers.get('Date');
    if (d) {
      const server = new Date(d).getTime();
      // ignora diferenças <60s (latência) — só corrige relógios mesmo errados
      if (!isNaN(server) && Math.abs(server - Date.now()) > 60000) {
        _serverClockOffset = server - Date.now();
      }
    }
  }).catch(() => {});
} catch (_) {}
function nexoNow() { return new Date(Date.now() + _serverClockOffset); }

function getActiveBanner() {
  if (!CONFIG.timeBanners || CONFIG.timeBanners.length === 0) {
    if (CONFIG.todaysSpecial) {
      const label = CONFIG.specialMode === 'happy-hour' ? t().specialHappyHour : t().specialWeek;
      return { label, headline: label, text: CONFIG.todaysSpecial[currentLang] || '', ghost: label };
    }
    return null;
  }

  const now = nexoNow();
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


function renderMenu() {
  const normalizedQuery = currentQuery.trim().toLowerCase();
  let visibleItems = 0;

  const html = CONFIG.menu.map(sec => {
    let sectionVisibleItems = 0;

    const itemsHtml = sec.items.map((item, idx) => {
        if (item._hidden) return '';   // escondido via Portal NEXO
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

        const refId = `${sec.id}:${idx}`;
        // soldOut: flag estático do config OU disponibilidade realtime (Portal NEXO)
        const soldOut = !!item.soldOut || _nexoAvailability[refId] === false;

        // Badge psicológico
        const badgeHtml = soldOut
          ? `<div class="item-badge item-badge-soldout">${t().soldOut}</div>`
          : (item.badge && ITEM_BADGES[item.badge]
            ? `<div class="item-badge item-badge-${item.badge}">${ITEM_BADGES[item.badge].emoji} ${ITEM_BADGES[item.badge][currentLang]}</div>`
            : '');

        // Botão "+" só aparece se item tem preço parseable (€) e não está esgotado
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
              : `<div class="menu-item-photo is-placeholder" data-section="${sec.id}"><span>${item.name[currentLang][0].toUpperCase()}</span></div>`
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


// Renders Vivino-style partial star SVGs for a rating (0–5, one decimal)
// Controlos +/− da bebida (refId "bebidas:<idx>") — mesma estrutura e
// classes dos cartões de comida: o updateAddBtnBadges() apanha-os sem
// alterações e o carrinho trata bebidas como qualquer item.
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
            ${wineOrderControlsHtml(realIdx, w)}
          </div>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('wine-list').innerHTML = html;
}


function renderActions() {
  document.getElementById('btn-review-label').textContent = t().review;
  const tableText = tableNumber ? ` · ${t().tableHint} ${tableNumber}` : '';
  const ratingText = CONFIG.googleRating ? `★ ${CONFIG.googleRating} · ` : '';
  document.getElementById('btn-review-sub').textContent = `${ratingText}Google · TheFork${tableText}`;

  document.getElementById('btn-instagram').href = `https://instagram.com/${CONFIG.instagramHandle}`;
  document.getElementById('btn-instagram-label').textContent = t().instagram;
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

// Language toggle
// PT override prompt — shown when auto-detect picks a non-PT language
// Quick nav
// Diet filter
// Allergen exclude filter


// Allergen legend modal
// Scroll-to-top on tab change
// Wine filters
// Most ordered → modal
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
// Abrir modal de item — com upsell (v5)
function openItemModal(sectionId, itemIdx) {
  const section = CONFIG.menu.find(s => s.id === sectionId);
  if (!section) return;
  const item = section.items[itemIdx];
  if (!item) return;

  const photoEl = document.getElementById('item-modal-photo');
  photoEl.dataset.section = sectionId;
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
      // getItemByRef resolve comida ("secção:idx") E bebidas ("bebidas:idx")
      const upsellItems = item.upsell.map(ref => {
        const it = getItemByRef(ref);
        return it ? { item: it, ref } : null;
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
            if (sid === 'bebidas') {
              setTimeout(() => openWineModal(parseInt(iidxStr)), 220);
            } else {
              setTimeout(() => openItemModal(sid, parseInt(iidxStr)), 220);
            }
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
// Botão "Adicionar ao pedido" do modal de bebida — mesmo feedback do item modal
// Review button
// Close modals
// Wi-Fi copy
// Loyalty → WhatsApp
// Share
/* ═══ BACK TO TOP (v5) ═══
   Aparece após 400px de scroll, desaparece ao voltar ao topo.
   ════════════════════════ */
// Converte "4,95€" ou "€12.50" ou "22,50€" → número. Retorna null se não parseable (P.V.P.).
// Formata número para string de preço com EUR ("12,50 €")
// Retorna quantidade do item no cart (0 se não existe)
// Adiciona 1x ao cart (ou incrementa)
function addToCart(refId) {
  if (sharedCart) { sharedAddToCart(refId); return; }
  const pill = document.getElementById('cart-pill');
  const wasVisible = pill?.classList.contains('show');
  const entry = cart.find(c => c.refId === refId);
  if (entry) {
    entry.qty += 1;
  } else {
    cart.push({ refId, qty: 1, note: '' });
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
// Remove completamente
// Limpa tudo
// Total do cart em número
// Total de items (soma das quantidades)
// Helper: get item object por refId
// Suporta também refs "bebidas:<idx>" — bebidas do separador Drinks (wines[])
// embrulhadas na forma de item do menu, para poderem entrar no pedido.
const _drinkItemCache = {};
// Note helpers
// Chamado sempre que o cart muda — atualiza UI
// Render: atualiza o floating pill
function renderCartPill() {
  const pill = document.getElementById('cart-pill');
  const textEl = document.getElementById('cart-pill-text');
  const totalEl = document.getElementById('cart-pill-total');
  if (!pill || !textEl || !totalEl) return;

  const countBadge = document.getElementById('cart-pill-count');
  const count = getCartItemCount();
  const comandaInfo = window._nexoComandaInfo || null;

  // ── Comanda mode: carrinho vazio mas comanda activa ──────────
  if (count === 0 && comandaInfo) {
    const statusIcon = { open: '🛒', submitted: '⏳', preparing: '🔥', ready: '✅' }[comandaInfo.status] || '⏳';
    textEl.textContent = `${statusIcon} ${comandaInfo.table_label || 'Mesa'} · Ver comanda`;
    totalEl.textContent = formatPrice(comandaInfo.total || 0);
    totalEl.classList.remove('hidden');
    pill.classList.add('show', 'cart-pill--comanda');
    document.body.classList.add('has-cart');
    pill.setAttribute('aria-label', 'Ver comanda da mesa');
    if (countBadge) { countBadge.textContent = ''; countBadge.style.display = 'none'; }
    return;
  }

  // ── Normal mode ───────────────────────────────────────────────
  pill.classList.remove('cart-pill--comanda');
  if (countBadge) { countBadge.style.display = ''; countBadge.textContent = String(count); }

  if (count === 0) {
    pill.classList.remove('show');
    document.body.classList.remove('has-cart');
    return;
  }

  // Badge shows count; text shows label only (no redundant count in text)
  textEl.textContent = sharedCart ? `👥 ${t().viewOrder}` : t().viewOrder;
  pill.setAttribute('aria-label', `${t().viewOrder}: ${count} ${count === 1 ? t().cartItem : t().cartItems}`);

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
  const clearBtn = document.getElementById('cart-clear-btn');
  const confirmBtn = document.getElementById('cart-confirm-btn');
  const confirmLabel = document.getElementById('cart-confirm-label');
  const notesBadge = document.getElementById('cart-notes-badge');
  const notesBadgeText = document.getElementById('cart-notes-badge-text');
  if (!listEl) return;

  if (titleEl) titleEl.textContent = t().cartTitle;
  if (totalLabel) totalLabel.textContent = t().cartTotal;
  if (clearBtn) clearBtn.textContent = t().cartClear;
  if (confirmLabel) confirmLabel.textContent = t().confirmOrder;

  // Always set tab labels
  const tabOrderEl = document.getElementById('tab-order');
  const tabSplitEl = document.getElementById('tab-split');
  if (tabOrderEl) tabOrderEl.textContent = ts().tabOrder;
  if (tabSplitEl) tabSplitEl.textContent = ts().tabSplit;

  // Notes badge
  const hasNotes = hasAnyNotes();
  if (notesBadge) notesBadge.style.display = hasNotes ? 'flex' : 'none';
  if (notesBadgeText) notesBadgeText.textContent = t().cartNotesBadge;

  // Shared Cart: update header, toggle trigger
  renderSharedCartHeader();
  const _scTrigger = document.getElementById('nexo-shared-cart-trigger');
  if (_scTrigger) _scTrigger.style.display = sharedCart ? 'none' : '';

  if (sharedCart) {
    const sharedItems = sharedCartItems;
    if (sharedItems.length === 0) {
      listEl.innerHTML = `<div class="cart-empty">${t().cartEmpty}</div>`;
      if (totalValue) totalValue.textContent = formatPrice(0);
      if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.style.opacity = '0.4'; }
      if (clearBtn) clearBtn.style.display = 'none';
      return;
    }
    if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.style.opacity = ''; }
    if (clearBtn) clearBtn.style.display = 'block';
    listEl.innerHTML = sharedItems.map(row => {
      const item = getItemByRef(row.item_id);
      const nm   = escHtml(item ? item.name[currentLang] : row.item_name);
      const price = item ? (parsePriceToNumber(item.price) || 0) : (row.item_price || 0);
      const lineTotal = price * row.quantity;
      const isOwn = row.member_key === _myPresenceKey;
      const note  = row.note || '';
      const safeNote = note.replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const safeId = row.item_id.replace(/"/g,'');
      const noteHtml = isOwn
        ? (note
          ? `<div class="cart-item-note-wrap" data-note-wrap="${safeId}">
              <div class="cart-item-note-preview">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span class="cart-note-text" data-note-reopen="${safeId}">${safeNote}</span>
                <button class="cart-note-clear" data-note-clear="${safeId}" aria-label="Remover nota" type="button">×</button>
              </div>
              <div class="cart-item-note-input-wrap" id="note-input-wrap-${safeId}" style="display:none">
                <input type="text" class="cart-item-note-input" data-note-refid="${safeId}"
                  placeholder="${t().notePlaceholder}" value="${safeNote}">
              </div>
            </div>`
          : `<div class="cart-item-note-wrap" data-note-wrap="${safeId}">
              <button class="cart-item-note-add" data-note-add="${safeId}" type="button">${t().noteAdd}</button>
              <div class="cart-item-note-input-wrap" id="note-input-wrap-${safeId}" style="display:none">
                <input type="text" class="cart-item-note-input" data-note-refid="${safeId}"
                  placeholder="${t().notePlaceholder}" value="">
              </div>
            </div>`)
        : (note ? `<span class="cart-item-note-readonly">${safeNote}</span>` : '');
      return `
        <div class="cart-list-item">
          <div class="cart-item-main-row">
            <span class="cart-item-qty">${row.quantity}×</span>
            <div class="cart-item-name-col">
              <span class="cart-item-name">${nm}</span>
              <span class="cart-item-member">adicionado por ${escHtml(row.member_name)}</span>
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
          </div>
          ${noteHtml}
        </div>`;
    }).join('');
    if (totalValue) totalValue.textContent = formatPrice(getCartTotal());
    return;
  }

  if (cart.length === 0) {
    listEl.innerHTML = `<div class="cart-empty">${t().cartEmpty}</div>`;
    if (totalValue) totalValue.textContent = formatPrice(0);
    if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.style.opacity = '0.4'; }
    if (clearBtn) clearBtn.style.display = 'none';
    return;
  }

  if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.style.opacity = ''; }
  if (clearBtn) clearBtn.style.display = 'block';

  listEl.innerHTML = cart.map(entry => {
    const item = getItemByRef(entry.refId);
    if (!item) return '';
    const unitPrice = parsePriceToNumber(item.price) || 0;
    const lineTotal = unitPrice * entry.qty;
    const note = entry.note || '';
    const safeNote = note.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeRefId = entry.refId.replace(/"/g, '');

    let noteHtml;
    if (note) {
      noteHtml = `
        <div class="cart-item-note-wrap" data-note-wrap="${safeRefId}">
          <div class="cart-item-note-preview">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            <span class="cart-note-text" data-note-reopen="${safeRefId}">${safeNote}</span>
            <button class="cart-note-clear" data-note-clear="${safeRefId}" aria-label="Remover nota" type="button">×</button>
          </div>
          <div class="cart-item-note-input-wrap" id="note-input-wrap-${safeRefId}" style="display:none">
            <input type="text" class="cart-item-note-input" data-note-refid="${safeRefId}"
              placeholder="${t().notePlaceholder}" value="${safeNote}">
          </div>
        </div>`;
    } else {
      noteHtml = `
        <div class="cart-item-note-wrap" data-note-wrap="${safeRefId}">
          <button class="cart-item-note-add" data-note-add="${safeRefId}" type="button">${t().noteAdd}</button>
          <div class="cart-item-note-input-wrap" id="note-input-wrap-${safeRefId}" style="display:none">
            <input type="text" class="cart-item-note-input" data-note-refid="${safeRefId}"
              placeholder="${t().notePlaceholder}" value="">
          </div>
        </div>`;
    }

    return `
      <div class="cart-list-item">
        <div class="cart-item-main-row">
          <span class="cart-item-qty">${entry.qty}×</span>
          <span class="cart-item-name">${item.name[currentLang]}</span>
          <span class="cart-item-price">${formatPrice(lineTotal)}</span>
          <div class="cart-item-controls">
            <button class="cart-qty-btn" data-cart-decrement="${safeRefId}" aria-label="Menos">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <button class="cart-qty-btn" data-cart-increment="${safeRefId}" aria-label="Mais">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
        </div>
        ${noteHtml}
      </div>
    `;
  }).join('');

  if (totalValue) totalValue.textContent = formatPrice(getCartTotal());
}

// Atualiza badges de qty nos botões "+" do menu sem re-render completo
// STAFF VIEW — fullscreen
// Lock anti-duplicação de pedidos: impede reenvios por toque duplo / impaciência.
let _orderLockUntil = 0;
function orderLocked() { return Date.now() < _orderLockUntil; }
function lockOrder(ms) { _orderLockUntil = Date.now() + (ms || 6000); }

// Botão primário: enviar directamente para a cozinha (comanda). O WhatsApp
// passou a ser canal de RECURSO — o cliente nunca o escolhe; só entra em acção
// se a cozinha falhar, para nenhum pedido se perder.
async function sendToKitchen() {
  if (!validateTableInput()) return;
  if (orderLocked()) return;
  lockOrder();
  const tableInput = document.getElementById('confirm-table-input');
  const tableValue = (tableInput ? tableInput.value.trim() : '') || confirmTableValue || '';
  confirmTableValue = tableValue;

  const routing = !!(window.NEXOPremium && window.NEXOPremium.comandaRouting && window.NEXOPremium.onOrderConfirmed);
  let res = null;
  if (routing) {
    setKitchenBtnLoading('A enviar…');
    // 1ª tentativa (timeout 15s). Falha → 1 retry automático após 3s.
    res = await submitOrderWithTimeout(false);
    if (res && !res.ok && res.reason !== 'duplicate' && res.reason !== 'locked') {
      setKitchenBtnLoading('A tentar novamente…');
      await new Promise(r => setTimeout(r, 3000));
      res = await submitOrderWithTimeout(true); // force: ignora o lock anti-duplo
    }
    resetKitchenBtn();
    // Duplicado/lock: intencional — não reenviar nem cair para o recurso.
    if (res && (res.reason === 'duplicate' || res.reason === 'locked')) { closeConfirmScreen(); return; }
  }

  if (res && res.ok) {
    closeConfirmScreen();          // comanda criou a ronda (mostra toast próprio)
  } else {
    whatsappFallback(tableValue);  // recurso: garante que o pedido chega na mesma
    closeConfirmScreen();
  }
}

// Envia a comanda com timeout de 15s. Se o onOrderConfirmed pendurar (rede
// lenta), devolve {ok:false,reason:'timeout'} para o retry/recurso entrarem.
// O retry passa force=true para contornar o lock anti-duplo do premium — a
// deduplicação por assinatura (mesmo pedido/mesa) evita rondas duplicadas.
// Estado de loading do botão primário "Enviar para a cozinha".
let _kitchenBtnOrigHTML = null;
function setKitchenBtnLoading(label) {
  const btn = document.getElementById('confirm-btn-kitchen');
  if (!btn) return;
  if (_kitchenBtnOrigHTML === null) _kitchenBtnOrigHTML = btn.innerHTML;
  btn.disabled = true;
  btn.classList.add('is-loading');
  btn.innerHTML = '<span class="nexo-btn-spinner" aria-hidden="true"></span><span>' + label + '</span>';
}
// Canal de recurso (fallback) silencioso: regista o pedido e, se houver número
// configurado, abre o WhatsApp. Só corre quando a cozinha não capturou o pedido
// (routing desligado ou falha) — assim um pedido nunca se perde.
function setupConfirmScreen() {
  const backBtn = document.getElementById('confirm-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      haptic();
      closeConfirmScreen();
    });
  }

  const kitchenBtn = document.getElementById('confirm-btn-kitchen');
  if (kitchenBtn) {
    kitchenBtn.addEventListener('click', () => {
      haptic();
      sendToKitchen();
      track('order_kitchen', { item_count: getCartItemCount(), order_total: getCartTotal() });
    });
  }

  const staffBtn = document.getElementById('confirm-btn-staff');
  if (staffBtn) {
    staffBtn.addEventListener('click', () => {
      haptic();
      const tableInput = document.getElementById('confirm-table-input');
      const tableVal = (tableInput ? tableInput.value.trim() : '') || confirmTableValue || '';
      confirmTableValue = tableVal;
      closeConfirmScreen();
      // "Mostrar ao Staff" é 100% LOCAL: mostra o pedido no ecrã para o empregado
      // ler e registar à mão. NÃO insere nada no Supabase, NÃO dispara a comanda
      // (não chama onOrderConfirmed), NÃO notifica a cozinha e NÃO muda o estado
      // do pedido. O carrinho fica intacto — o cliente pode ainda "Enviar para a
      // cozinha" depois de fechar.
      setTimeout(() => openStaffView(tableVal), 270);
    });
  }

  // Save table value as user types
  const tableInput = document.getElementById('confirm-table-input');
  if (tableInput) {
    tableInput.addEventListener('input', () => {
      confirmTableValue = tableInput.value;
    });
    // Focus: animate border
    tableInput.addEventListener('focus', () => {
      tableInput.classList.add('focused');
    });
    tableInput.addEventListener('blur', () => {
      tableInput.classList.remove('focused');
    });
  }
}

/* Pulse: botão "Confirmar Pedido" após 8s sem interação */
// Setup: botões "+" no menu (delegação)
// Setup: botão "Adicionar ao pedido" no modal
// Setup: click no pill abre bottom sheet
function setupCartPill() {
  const pill = document.getElementById('cart-pill');
  if (!pill) return;
  pill.addEventListener('click', () => {
    haptic();
    openModal('cart-sheet');
  });
}

// Setup: controles +/-, notas e confirm no bottom sheet
// Setup: fechar staff view (click anywhere or X button)
/* Estado do split */
let splitPeople = 2;
let splitMode = 'equal';
let splitActivePerson = 0;
let splitAssign = [];
let customPersonNames = []; // nomes personalizados nesta sessão

// Nome de uma pessoa — custom > PERSON_NAMES > fallback
// Inicializa/reset os sets de atribuição — preserva nomes custom
// Itens activos para a divisão da conta. Funciona tanto no carrinho normal
// (`cart`) como no carrinho partilhado / Mesa em grupo (`sharedCartItems`).
// Devolve sempre [{ refId, qty }] agregado por item.
// Total atribuído a uma pessoa (soma por item)
// Toggle: atribuir/retirar item de pessoa activa
/* ─── Render: painel completo de split ─── */
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
function isFavorited(refId) { return favorites.has(refId); }

let _countdownInterval = null;

// Canvas text word-wrap helper
// Snapshot the current cart into history when "Mostrar ao staff" is used
/* ─── Rename de pessoa no split ─── */
// refId ("seccao:idx") → true/false. false = esgotado (definido no Portal).
let _nexoAvailability = {};

// Máximo de mesas do espaço (venue_settings). null = sem limite conhecido.
let nexoMaxTable = null;
// Edições feitas pelo restaurante no Portal NEXO (nome/desc/preço/foto,
// pratos escondidos e pratos novos) aplicadas por cima do config.js.
// Insert fiável via REST com keepalive — completa mesmo que a página navegue
// (ex.: abrir o WhatsApp). Não depende do CDN supabase-js (mais rápido e robusto).
function nexoInsert(table, row) {
  const { supabaseUrl, supabaseAnonKey } = (typeof CONFIG !== 'undefined' ? CONFIG : {});
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.indexOf('{{') !== -1) return;
  try {
    fetch(supabaseUrl + '/rest/v1/' + table, {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: supabaseAnonKey,
        Authorization: 'Bearer ' + supabaseAnonKey,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    }).catch(() => {});
  } catch (_) {}
}

// Regista chamada de mesa (Sala / Modo Staff do Portal)
function logStaffCallToSupabase(tableLabel) {
  var NS = window.NexoSecurity || null;
  nexoInsert('staff_calls', {
    espaco_slug: CONFIG.slug,
    table_label: tableLabel ? (NS ? NS.sanitise(tableLabel, 50) : tableLabel) : null,
  });
}
// (order_source/had_valid_token vivem em orders_log/comandas; staff_calls não
//  tem essas colunas — a presença é garantida pelo guardStaffCall acima.)

// Regista pedido no orders_log (Sala / Modo Staff do Portal)
// ── Token de comanda (RLS da migração 037) ──────────────────────────────
// A leitura da comanda deixou de ser pública: o Supabase só devolve linhas
// se o pedido levar o header x-comanda-token com o token desta comanda.
// Guardado por sessão; injectado em todos os pedidos REST pelo fetch
// personalizado do loadSupabase (o realtime não precisa — usa broadcast).
// uuid v4 gerado no dispositivo — tem de ser conhecido ANTES do insert da
// comanda, porque o returning já vem filtrado pela política de SELECT.
/* ─── Broadcast-based sync ─── */
// Toast do menu para eventos da MESA partilhada — todos os membros veem o
// mesmo feedback (pedido enviado, staff a caminho), evitando duplicados.
function _setupChannelListeners(channel) {
  channel
    .on('broadcast', { event: 'state' }, ({ payload }) => {
      if (!payload?.memberKey) return;
      _memberStates[payload.memberKey] = { name: payload.name, items: payload.items || [] };
      syncSharedCartItems();
    })
    .on('broadcast', { event: 'hello' }, ({ payload }) => {
      // New member joined — register them immediately, then reply with our state
      if (payload?.memberKey) {
        _memberStates[payload.memberKey] = { name: payload.name || 'Convidado', items: payload.items || [] };
        syncSharedCartItems();
      }
      _trackMyPresence();
    })
    .on('broadcast', { event: 'bye' }, ({ payload }) => {
      if (!payload?.memberKey) return;
      delete _memberStates[payload.memberKey];
      syncSharedCartItems();
    })
    .on('broadcast', { event: 'staff_called' }, () => {
      // Alguém da mesa chamou o staff — todos ficam a saber.
      sharedTableToast('🙋 Staff a caminho — chamado pela vossa mesa');
    });
}

/* ─── Cart mutation helpers ─── */
/* ─── Create / Join / Leave ─── */
/* ─── Session persistence ─── */
const _SESSION_TTL = 2 * 60 * 60 * 1000; // 2 hours

/* ─── UI helpers ─── */
// ─── KILL-SWITCH POR CONTRATO ───────────────────────────────────────────
// Se o contrato do espaço estiver inativo/vencido, o menu fica indisponível.
// FAIL-OPEN: qualquer falha de rede/config → o menu abre normalmente (nunca
// deixa um cliente pagante sem menu por causa de um hiccup).
document.addEventListener('DOMContentLoaded', () => {
  // config.js falhou a carregar (rede/deploy a meio) → erro amigável com
  // retry em vez de um crash de JS numa página em branco.
  if (typeof CONFIG === 'undefined') {
    document.body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;min-height:100dvh;background:#181818;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px;gap:16px">' +
      '<p style="font-size:17px;max-width:32ch;line-height:1.5">Não foi possível carregar o menu. Tenta novamente.</p>' +
      '<button onclick="location.reload()" style="background:#fff;color:#181818;border:none;border-radius:12px;padding:14px 22px;font-size:16px;font-weight:700;min-height:48px;cursor:pointer">↻ Tentar novamente</button></div>';
    return;
  }
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
  initMenuOverrides();
  initAvailabilityRealtime();
  loadVenueConfig();
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
  setupWineModalAdd();
  setupCartPill();
  setupCartSheet();
  setupStaffView();
  setupConfirmScreen();
  setupConfirmButtonPulse();
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

  // ─── Call Staff ───
  setupCallStaff();
  // ─── Restore shared cart session (survives refresh, 2h TTL) ───
  restoreSharedSession();
});


function setupCallStaff() {
  const TOPIC      = (typeof CONFIG !== 'undefined' && CONFIG.callStaffTopic) || '';
  const FEATURE_ON = typeof CONFIG !== 'undefined' && CONFIG.features && CONFIG.features.callStaff !== false;

  const callBtn    = document.getElementById('nexo-call-staff-btn');
  const sheet      = document.getElementById('nexo-call-sheet');
  const closeBtn   = document.getElementById('nexo-call-sheet-close');
  const backdrop   = sheet && sheet.querySelector('.nexo-sheet-backdrop');
  const sendBtn    = document.getElementById('nexo-call-send-btn');
  const tableInput = document.getElementById('nexo-call-table-input');
  const btnText    = document.getElementById('nexo-call-btn-text');

  if (!FEATURE_ON || !TOPIC) {
    if (callBtn) callBtn.classList.add('hidden');
    return;
  }

  if (tableInput && tableNumber) tableInput.value = tableNumber;

  let cooldownActive = false;

  function openSheet() {
    if (cooldownActive) return;
    if (sheet) {
      sheet.classList.remove('hidden');
      requestAnimationFrame(() => {
        sheet.classList.add('open');
        // Focus + select immediately so numeric keyboard appears and value is ready to replace
        if (tableInput) { tableInput.focus(); tableInput.select(); }
      });
    }
  }

  function closeSheet() {
    if (sheet) {
      sheet.classList.remove('open');
      setTimeout(() => sheet.classList.add('hidden'), 350);
    }
    if (tableInput && !tableNumber) tableInput.value = '';
    resetSendBtnState();
  }

  function resetSendBtnState() {
    if (sendBtn) {
      sendBtn.classList.remove('loading');
      sendBtn.style.background = '';
      sendBtn.style.color = '';
    }
    if (btnText) btnText.textContent = '🙋 Chamar Atendente';
  }

  if (callBtn) callBtn.addEventListener('click', openSheet);
  if (closeBtn) closeBtn.addEventListener('click', closeSheet);
  if (backdrop) backdrop.addEventListener('click', closeSheet);

  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      // TAT: só permite chamar empregado em modo FULL (token de mesa válido)
      if (window.NexoAccess && !(await NexoAccess.guardStaffCall())) return;
      if (cooldownActive) return;
      cooldownActive = true; // bloqueia reentrância imediata (evita spam/duplicados)

      const mesa = tableInput ? tableInput.value.trim() : '';
      const msg  = mesa
        ? 'Mesa ' + mesa + ' a pedir atendimento'
        : 'A pedir atendimento (mesa não indicada)';

      sendBtn.classList.add('loading');
      if (btnText) btnText.textContent = 'A enviar...';

      // Regista no Portal NEXO (Modo Staff) em paralelo com o ntfy
      logStaffCallToSupabase(mesa ? 'Mesa ' + mesa : null);

      try {
        // Nota: valores de headers HTTP têm de ser ASCII (emoji faz o fetch
        // lançar TypeError). O ícone vem da tag 'bell'.
        const response = await fetch('https://ntfy.sh/' + TOPIC, {
          method: 'POST',
          headers: {
            'Title': 'Chamada de Mesa',
            'Priority': 'high',
            'Tags': 'bell',
            'Content-Type': 'text/plain; charset=utf-8',
          },
        // fire-and-forget: nunca mais de 5s à espera do ntfy
        ...(typeof AbortSignal !== 'undefined' && AbortSignal.timeout
            ? { signal: AbortSignal.timeout(5000) } : {}),
          body: msg,
        });

        if (response.ok) {
          if (btnText) btnText.textContent = '✓ Atendente a caminho!';
          // Mesa partilhada: avisa os restantes membros de que o staff já vem.
          if (typeof sharedCart !== 'undefined' && sharedCart && typeof _sharedCartChannel !== 'undefined' && _sharedCartChannel) {
            try { _sharedCartChannel.send({ type: 'broadcast', event: 'staff_called', payload: {} }); } catch (_) {}
          }
          if (sendBtn) { sendBtn.style.background = '#22C55E'; sendBtn.style.color = 'white'; }
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

          setTimeout(() => {
            closeSheet();
            if (callBtn) {
              callBtn.classList.add('success');
              callBtn.textContent = '✓';
            }
            cooldownActive = true;
            setTimeout(() => {
              cooldownActive = false;
              if (callBtn) {
                callBtn.classList.remove('success');
                callBtn.textContent = '🙋';
              }
            }, 30000);
          }, 1500);

          track('staff_called', { table_label: mesa || null });
        } else {
          throw new Error('HTTP ' + response.status);
        }
      } catch (err) {
        if (btnText) btnText.textContent = '✕ Erro — tente novamente';
        if (sendBtn) sendBtn.style.background = 'rgba(239,68,68,0.2)';
        cooldownActive = false; // falhou — permite tentar de novo
        setTimeout(resetSendBtnState, 2500);
      }
    });
  }
}



