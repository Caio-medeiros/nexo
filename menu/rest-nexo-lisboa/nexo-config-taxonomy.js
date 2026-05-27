// NEXO Config Taxonomy — v1.0
// MANDATORY: all menu configs must use these exact category
// and field names. Never invent new ones — add to this file first.

const NEXO_TAXONOMY = {

  // ─── CATEGORY NAMES ───────────────────────────────────────
  // Use these exact strings in config.js category definitions.
  // Never use: "Starters", "Mains", "Drinks", "Desserts" (English)
  // Never use: free-form names like "Os Nossos Pratos"

  categories: {
    ENTRADAS:        'Entradas',
    SOPAS:           'Sopas',
    SALADAS:         'Saladas',
    PRATOS:          'Pratos Principais',
    PEIXE:           'Peixe',
    CARNE:           'Carne',
    VEGETARIANO:     'Vegetariano',
    MASSAS:          'Massas & Risotto',
    SNACKS:          'Snacks',
    PETISCOS:        'Petiscos',
    PIZZAS:          'Pizzas',
    HAMBURGERES:     'Hambúrgueres',
    SOBREMESAS:      'Sobremesas',
    CAFES:           'Cafés & Chás',
    SUMOS:           'Sumos & Águas',
    CERVEJAS:        'Cervejas',
    VINHOS_BRANCOS:  'Vinhos Brancos',
    VINHOS_TINTOS:   'Vinhos Tintos',
    VINHOS_ROSES:    'Vinhos Rosés',
    ESPUMANTES:      'Espumantes & Champagne',
    COCKTAILS:       'Cocktails',
    SHOTS:           'Shots',
    DIGESTIVOS:      'Digestivos',
    MENU_DIA:        'Menu do Dia',
    SUGESTOES:       'Sugestões do Chef',
    HAPPY_HOUR:      'Happy Hour',
    INFANTIL:        'Menu Infantil',
  },

  // ─── ITEM FIELD NAMES ─────────────────────────────────────
  // Every item object in config.js must use these exact keys.

  itemFields: {
    id:            'id',           // string, unique per menu
    name:          'name',         // string, display name
    description:   'description',  // string, optional
    price:         'price',        // number, in euros (e.g. 12.50)
    category:      'category',     // string, from categories above
    image:         'image',        // string, URL or relative path
    available:     'available',    // boolean
    tags:          'tags',         // array: see tags below
    allergens:     'allergens',    // array: see allergens below
    vivino_rating: 'vivino_rating',// number, for wines only
    vivino_url:    'vivino_url',   // string, for wines only
    pairing:       'pairing',      // array of item IDs (upsell)
    happy_hour:    'happy_hour',   // boolean
    featured:      'featured',     // boolean (chef suggestion)
    new:           'new',          // boolean (new item badge)
  },

  // ─── TAGS ─────────────────────────────────────────────────
  tags: {
    VEGETARIANO:   'vegetariano',
    VEGANO:        'vegano',
    SEM_GLUTEN:    'sem-gluten',
    SEM_LACTOSE:   'sem-lactose',
    PICANTE:       'picante',
    MUITO_PICANTE: 'muito-picante',
    POPULAR:       'popular',
    NOVO:          'novo',
    DESTAQUE:      'destaque',
    PREMIUM:       'premium',
  },

  // ─── ALLERGENS ────────────────────────────────────────────
  allergens: {
    GLUTEN:       'gluten',
    CRUSTACEOS:   'crustaceos',
    OVOS:         'ovos',
    PEIXE:        'peixe',
    AMENDOINS:    'amendoins',
    SOJA:         'soja',
    LEITE:        'leite',
    FRUTAS_CASCA: 'frutas-casca',
    AIPO:         'aipo',
    MOSTARDA:     'mostarda',
    SESAMO:       'sesamo',
    SULFITOS:     'sulfitos',
    TREMOCOS:     'tremocos',
    MOLUSCOS:     'moluscos',
  },

  // ─── CONFIG.JS BLOCK NUMBERS ──────────────────────────────
  // config.js is organized in numbered blocks.
  // These numbers are fixed — never change the order.

  configBlocks: {
    1:  'ESPACO — identidade, nome, slug, contacto',
    2:  'CORES — primary, secondary, accent, background',
    3:  'IDIOMAS — available languages and default',
    4:  'MENU — categorias e items',
    5:  'UPSELL — pairings e sugestões automáticas',
    6:  'REVIEWS — Google URL, TheFork URL, WhatsApp',
    7:  'HAPPY HOUR — horário e items em destaque',
    8:  'ANALYTICS — GA4 ID, espaco_slug, espaco_tipo',
    9:  'FEATURES — toggles para activar/desactivar funcionalidades',
    10: 'TEXTOS — strings traduzíveis por idioma',
  },
};

// Expose globally for use in config.js validation
if (typeof window !== 'undefined') {
  window.NEXO_TAXONOMY = NEXO_TAXONOMY;
}
if (typeof module !== 'undefined') {
  module.exports = NEXO_TAXONOMY;
}
