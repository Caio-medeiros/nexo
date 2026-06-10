/**
 * NEXO Menu Config — rest-nexo-lisboa
 * ─────────────────────────────────────────────────────────
 * TAXONOMY: All category names, item fields, tags and
 * allergens MUST use the exact strings defined in:
 * nexo-config-taxonomy.js
 *
 * WHY: GA4 captures item_name and item_category from this
 * config. Consistent naming = comparable data across all
 * NEXO clients = AI can analyse patterns at scale.
 *
 * BLOCK STRUCTURE (do not change order):
 * Block 1 — ESPACO
 * Block 2 — CORES
 * Block 3 — IDIOMAS
 * Block 4 — MENU
 * Block 5 — UPSELL
 * Block 6 — REVIEWS
 * Block 7 — HAPPY HOUR
 * Block 8 — ANALYTICS
 * Block 9 — FEATURES
 * Block 10 — TEXTOS
 * ─────────────────────────────────────────────────────────
 */


/* ═══════════════════════════════════════════════════════════════════════════
   NEXO MENU — CONFIG
   ───────────────────────────────────────────────────────────────────────────
   CAMPOS OBRIGATÓRIOS  →  marcados com  ★
   CAMPOS OPCIONAIS     →  marcados com  ○  (apagar ou deixar vazio/[])
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Helper de foto (Pexels CDN) ──────────────────────────────────────────
   P(id) constrói a URL a partir do ID numérico do Pexels.
   Passa null se não houver foto — o menu mostra a inicial do prato.
   Como encontrar o ID: abrir a foto no pexels.com → o número no URL é o ID.
   ──────────────────────────────────────────────────────────────────────── */
const P = (id) => id
  ? `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1`
  : null;

const CONFIG = {

  /* ════════════════════════════════════════════════════════════════════════
     1. IDENTIDADE  ★
     ════════════════════════════════════════════════════════════════════════ */

  slug:  "nexo-restaurant",
  name:  "NEXO Restaurant",
  city:  "Lisboa, Portugal",

  /* Analytics — preencher com o Measurement ID do GA4 (ex: "G-XXXXXXXXXX")
     Deixar vazio ("") para desactivar. */
  ga4MeasurementId: "G-PG76WZVLNB",

  /* Supabase — necessário para Carrinho de Mesa (Shared Cart) */
  supabaseUrl: '{{SUPABASE_URL}}',
  supabaseAnonKey: '{{SUPABASE_ANON_KEY}}',

  tagline: {
    pt: "Restaurante, cervejaria e marisqueira",
    en: "Restaurant, brewery and seafood house",
    es: "Restaurante, cervecería y marisquería",
    fr: "Restaurant, brasserie et fruits de mer"
  },

  heroStamp: {
    pt: "Desde 2009", en: "Since 2009", es: "Desde 2009", fr: "Depuis 2009"
  },


  /* ════════════════════════════════════════════════════════════════════════
     2. VISUAL  ★
     ════════════════════════════════════════════════════════════════════════ */

  brandColor:   "#8B4A35",
  heroImageUrl: "https://i0.wp.com/nikkibeach.com/porto-heli/wp-content/uploads/sites/14/2024/10/Untitled-Capture884.jpg?ssl=1&w=2500&quality=85",
  logoUrl: null,


  /* ════════════════════════════════════════════════════════════════════════
     3. CONTACTOS  ★
     ════════════════════════════════════════════════════════════════════════ */

  address:      "Rua Exemplo, 1 · 1000-001 Lisboa",
  phone:        "+351 200 000 000",
  phoneDisplay: "200 000 000",

  hours: {
    pt: "Seg–Dom · 12h–15h · 19h–24h",
    en: "Mon–Sun · 12–3pm · 7–12am",
    es: "Lun–Dom · 12h–15h · 19h–24h",
    fr: "Lun–Dim · 12h–15h · 19h–24h"
  },
  hoursToday: {
    pt: "Aberto até 24h", en: "Open until 12am",
    es: "Abierto hasta las 24h", fr: "Ouvert jusqu'à 24h"
  },


  /* ════════════════════════════════════════════════════════════════════════
     4. REDES & REVIEWS
     ════════════════════════════════════════════════════════════════════════ */

  googleReviewUrl:  "https://search.google.com/local/writereview?placeid=ChIJUzfB1lbJHg0R6f3asKfGros",
  googleRating:     4.6,       // ○ estrelas mostradas no hero (null para esconder)
  googleReviewCount:"1.2k",    // ○ nº de reviews (texto livre)
  theForkReviewUrl: "https://www.thefork.pt/restaurante/prego-de-ouro-r852491",
  instagramHandle:  "nexosolutions",
  whatsappNumber:   "351918104266",
  whatsappLoyaltyMessage: {
    pt: "Olá! Gostaria de falar com o NEXO Restaurant.",
    en: "Hello! I would like to contact NEXO Restaurant.",
    es: "¡Hola! Me gustaría contactar con NEXO Restaurant.",
    fr: "Bonjour! Je souhaite contacter NEXO Restaurant."
  },


  /* ════════════════════════════════════════════════════════════════════════
     5. WI-FI  ○
     ════════════════════════════════════════════════════════════════════════ */

  wifiSsid:     "NEXO_GUEST",
  wifiPassword: "nexo2026",


  /* ════════════════════════════════════════════════════════════════════════
     6. BANNERS POR HORÁRIO  ○
     ════════════════════════════════════════════════════════════════════════ */

  timeBanners: [
    {
      id: "almoco", startH: 12, endH: 15,
      ghost:    { pt: "Almoço", en: "Lunch", es: "Almuerzo", fr: "Déjeuner" },
      label:    { pt: "Almoço", en: "Lunch", es: "Almuerzo", fr: "Déjeuner" },
      headline: { pt: "Bom apetite.", en: "Enjoy your meal.", es: "Buen provecho.", fr: "Bon appétit." },
      text: {
        pt: "Prato do dia + sobremesa + bebida · 9,95€ · Seg–Sex",
        en: "Daily dish + dessert + drink · €9.95 · Mon–Fri",
        es: "Plato del día + postre + bebida · 9,95€ · Lun–Vie",
        fr: "Plat du jour + dessert + boisson · 9,95€ · Lun–Ven"
      }
    },
    {
      id: "happy-hour", startH: 17, endH: 19, days: [1,2,3,4,5],
      ghost:    { pt: "Happy", en: "Happy", es: "Happy", fr: "Happy" },
      label:    { pt: "Happy Hour · Seg–Sex", en: "Happy Hour · Mon–Fri", es: "Happy Hour · Lun–Vie", fr: "Happy Hour · Lun–Ven" },
      headline: { pt: "Hora de brindar.", en: "Time to toast.", es: "Hora de brindar.", fr: "L'heure de trinquer." },
      text: {
        pt: "Imperial + Prego no Pão · 5,95€ · Até às 19h",
        en: "Draft Beer + Steak Sandwich · €5.95 · Until 7pm",
        es: "Caña + Prego en Pan · 5,95€ · Hasta las 19h",
        fr: "Bière + Prego · 5,95€ · Jusqu'à 19h"
      }
    },
    {
      id: "jantar", startH: 19, endH: 24,
      ghost:    { pt: "Jantar", en: "Dinner", es: "Cena", fr: "Dîner" },
      label:    { pt: "Boa noite", en: "Good evening", es: "Buenas noches", fr: "Bonsoir" },
      headline: { pt: "A noite começa aqui.", en: "The night starts here.", es: "La noche empieza aquí.", fr: "La nuit commence ici." },
      text: {
        pt: "Cataplanas, arrozes de marisco e os clássicos da casa",
        en: "Cataplanas, shellfish rice and house classics",
        es: "Cataplanas, arroces de mariscos y clásicos de la casa",
        fr: "Cataplanas, riz aux fruits de mer et classiques maison"
      }
    }
  ],


  /* ════════════════════════════════════════════════════════════════════════
     7. MENU  ★
     photo: null → mostra placeholder com inicial do prato
     upsell: refIds culinariamente complementares
     ════════════════════════════════════════════════════════════════════════ */

  menu: [

    /* ── PREGOS ── */
    {
      id: "pregos",
      section: { pt: "Pregos Especiais", en: "Signature Pregos", es: "Pregos Especiales", fr: "Pregos Signature" },
      desc: { pt: "A especialidade da casa desde 2009.", en: "Our signature since 2009.", es: "Nuestra especialidad desde 2009.", fr: "Notre spécialité depuis 2009." },
      items: [
        {
          name: { pt: "Prego no Pão", en: "Steak Sandwich", es: "Prego en Pan", fr: "Prego en Pain" },
          desc: { pt: "Bife de vaca grelhado no nosso pão. A receita original desde 2009.", en: "Grilled beef steak in our bread. The original recipe since 2009.", es: "Filete a la parrilla en nuestro pan.", fr: "Steak de bœuf grillé dans notre pain." },
          price: "4,95€", photo: null, diet: [], allergens: [1,3,7], badge: "popular",
          upsell: ["entradas:4", "petiscos:1"]
          // Croquete clássico ao lado + Chouriço para partilhar — dupla perfeita com um prego no pão
        },
        {
          name: { pt: "Prego no Prato", en: "Steak with Fries and Rice", es: "Prego en Plato", fr: "Prego en Assiette" },
          desc: { pt: "Bife grelhado acompanhado de batata frita e arroz.", en: "Grilled steak with fries and rice.", es: "Filete con patatas fritas y arroz.", fr: "Steak grillé avec frites et riz." },
          price: "8,50€", photo: null, diet: [], allergens: [3],
          upsell: ["entradas:0", "sobremesas:0"]
          // Pão e broa para acompanhar o molho + Arroz Doce para fechar — clássico português
        },
        {
          name: { pt: "Prego no Bolo do Caco", en: "Steak in Madeira Bread", es: "Prego en Bolo do Caco", fr: "Prego au Bolo do Caco" },
          desc: { pt: "Prego no tradicional pão madeirense com manteiga de alho.", en: "Steak in traditional Madeira bread with garlic butter.", es: "Prego en pan de Madeira con mantequilla de ajo.", fr: "Prego dans le pain de Madère au beurre d'ail." },
          price: "6,20€", photo: null, diet: [], allergens: [1,7],
          upsell: ["petiscos:1", "petiscos:6"]
          // Chouriço assado partilha o perfil defumado do bolo do caco + Pica-Pau para completar
        },
        {
          name: { pt: "Prego no Prato com Ovo", en: "Steak with Fries, Rice and Egg", es: "Prego con Huevo", fr: "Prego avec Œuf" },
          desc: { pt: "O clássico prego no prato com ovo estrelado.", en: "Classic steak plate with fried egg.", es: "Prego clásico con huevo frito.", fr: "Prego classique avec œuf au plat." },
          price: "9,50€", photo: null, diet: [], allergens: [3],
          upsell: ["entradas:4", "sobremesas:1"]
          // Croquete como entrada quente + Baba de Camelo para acabar em grande
        },
        {
          name: { pt: "Bitoque da Casa", en: "House Steak", es: "Bitoque de la Casa", fr: "Bitoque de la Maison" },
          desc: { pt: "A nossa versão especial do bitoque tradicional português.", en: "Our special version of the traditional Portuguese bitoque.", es: "Nuestra versión del bitoque tradicional.", fr: "Notre version du bitoque traditionnel." },
          price: "15,50€", photo: null, diet: [], allergens: [3,7], badge: "chef",
          upsell: ["entradas:3", "sobremesas:2"]
          // Queijo curado como entrada elegante + Leite Creme para terminar a refeição
        }
      ]
    },

    /* ── ENTRADAS ── */
    {
      id: "entradas",
      section: { pt: "Entradas", en: "Starters", es: "Entrantes", fr: "Entrées" },
      desc: { pt: "Para começar.", en: "To start.", es: "Para empezar.", fr: "Pour commencer." },
      items: [
        {
          name: { pt: "Cesto Pão e Broa", en: "Bread & Cornbread Basket", es: "Cesta Pan y Broa", fr: "Corbeille de Pain et Broa" },
          desc: { pt: "Pão do dia com broa de milho.", en: "Daily bread with cornbread.", es: "Pan del día con broa.", fr: "Pain du jour avec pain de maïs." },
          price: "2,50€", photo: null, diet: ["V"], allergens: [1],
          upsell: ["entradas:3", "petiscos:5"]
          // Queijo curado acompanha naturalmente o pão + Amêijoa Bulhão Pato para molhar o pão
        },
        {
          name: { pt: "Pão de Alho", en: "Garlic Bread", es: "Pan de Ajo", fr: "Pain à l'Ail" },
          desc: { pt: "Pão caseiro com manteiga de alho.", en: "Homemade bread with garlic butter.", es: "Pan casero con mantequilla de ajo.", fr: "Pain maison au beurre d'ail." },
          price: "2,50€", photo: null, diet: ["V"], allergens: [1,7],
          upsell: ["petiscos:4", "petiscos:5"]
          // Gambas à guilho e Amêijoas têm molhos que pedem pão de alho para absorver
        },
        {
          name: { pt: "Prato de Presunto (100g)", en: "Portuguese Cured Ham (100g)", es: "Plato de Jamón (100g)", fr: "Jambon Cru Portugais (100g)" },
          desc: { pt: "Presunto português de qualidade.", en: "Quality Portuguese cured ham.", es: "Jamón portugués de calidad.", fr: "Jambon portugais de qualité." },
          price: "8,50€", photo: null, diet: ["GF","LF"], allergens: [],
          upsell: ["entradas:3", "petiscos:1"]
          // Presunto + Queijo curado = tábua de enchidos clássica + Chouriço para completar
        },
        {
          name: { pt: "Queijo Curado", en: "Cured Cheese", es: "Queso Curado", fr: "Fromage Affiné" },
          desc: { pt: "Queijo curado português.", en: "Portuguese cured cheese.", es: "Queso curado portugués.", fr: "Fromage affiné portugais." },
          price: "3,50€", photo: null, diet: ["V","GF"], allergens: [7],
          upsell: ["entradas:2", "entradas:0"]
          // Presunto ao lado é a combinação clássica + Pão e Broa para acompanhar
        },
        {
          name: { pt: "Croquete", en: "Beef Croquette", es: "Croqueta de Carne", fr: "Croquette de Bœuf" },
          desc: { pt: "Croquete de carne caseiro.", en: "Homemade beef croquette.", es: "Croqueta de carne casera.", fr: "Croquette de bœuf maison." },
          price: "1,80€", photo: null, diet: [], allergens: [1,3,7], badge: "popular",
          upsell: ["pregos:0", "petiscos:6"]
          // Prego no Pão é o acompanhamento natural do croquete + Pica-Pau no mesmo perfil de carne
        }
      ]
    },

    /* ── PETISCOS ── */
    {
      id: "petiscos",
      section: { pt: "Petiscos", en: "Snacks", es: "Tapas", fr: "Tapas" },
      desc: { pt: "Para partilhar.", en: "To share.", es: "Para compartir.", fr: "À partager." },
      items: [
        {
          name: { pt: "Moelas Estufadas (250g)", en: "Chicken Gizzards (250g)", es: "Mollejas (250g)", fr: "Gésiers Braisés (250g)" },
          desc: { pt: "Estufadas em vinho tinto e especiarias.", en: "Stewed in red wine and spices.", es: "Estofadas en vino tinto.", fr: "Braisés au vin rouge et épices." },
          price: "8,00€", photo: null, diet: ["GF","LF"], allergens: [12],
          upsell: ["entradas:0", "petiscos:1"]
          // Pão e Broa para mergulhar no molho de vinho tinto + Chouriço no mesmo registo defumado
        },
        {
          name: { pt: "Chouriço Assado", en: "Grilled Chorizo", es: "Chorizo Asado", fr: "Chorizo Grillé" },
          desc: { pt: "Chouriço português assado na brasa.", en: "Portuguese chorizo grilled over charcoal.", es: "Chorizo a la brasa.", fr: "Chorizo grillé au charbon." },
          price: "9,50€", photo: null, diet: ["GF","LF"], allergens: [],
          upsell: ["petiscos:2", "entradas:0"]
          // Morcela assada é o par natural do chouriço + Pão e Broa para absorver os sucos
        },
        {
          name: { pt: "Morcela Assada", en: "Portuguese Black Sausage", es: "Morcilla Asada", fr: "Boudin Noir Grillé" },
          desc: { pt: "Morcela de Estremoz grelhada.", en: "Grilled Estremoz black sausage.", es: "Morcilla de Estremoz a la parrilla.", fr: "Boudin noir d'Estremoz grillé." },
          price: "9,50€", photo: null, diet: ["GF","LF"], allergens: [],
          upsell: ["petiscos:1", "entradas:3"]
          // Chouriço é o par obrigatório + Queijo Curado para completar a tábua portuguesa
        },
        {
          name: { pt: "Salada de Polvo (250g)", en: "Octopus Salad (250g)", es: "Ensalada de Pulpo (250g)", fr: "Salade de Poulpe (250g)" },
          desc: { pt: "Polvo cozido com cebola, salsa e azeite.", en: "Boiled octopus with onion, parsley, olive oil.", es: "Pulpo con cebolla y aceite.", fr: "Poulpe à l'oignon et huile d'olive." },
          price: "12,50€", photo: null, diet: ["GF","LF"], allergens: [14],
          upsell: ["peixe:4", "mariscos-quentes:2"]
          // Polvo à Lagareiro é a versão quente do mesmo ingrediente + Amêijoa à Nosso Prego complementa o mar
        },
        {
          name: { pt: "Gamba à Guilho (230g)", en: "Shrimps with Garlic Sauce", es: "Gambas al Ajillo", fr: "Crevettes à l'Ail" },
          desc: { pt: "Gambas salteadas em azeite, alho e piri-piri.", en: "Shrimps sautéed in olive oil, garlic and chili.", es: "Gambas en aceite, ajo y guindilla.", fr: "Crevettes à l'huile, ail et piment." },
          price: "15,50€", photo: null, diet: ["GF","LF"], allergens: [2], badge: "popular",
          upsell: ["entradas:1", "petiscos:5"]
          // Pão de Alho para absorver o azeite e alho das gambas + Amêijoa Bulhão Pato no mesmo perfil de alho
        },
        {
          name: { pt: "Amêijoa à Bulhão Pato (300g)", en: "Clams Bulhão Pato (300g)", es: "Almejas Bulhão Pato", fr: "Palourdes Bulhão Pato" },
          desc: { pt: "Amêijoas em azeite, alho, coentros e vinho branco.", en: "Clams in olive oil, garlic, coriander and white wine.", es: "Almejas en aceite, ajo, cilantro.", fr: "Palourdes à l'huile, ail, coriandre." },
          price: "16,00€", photo: null, diet: ["GF","LF"], allergens: [12,14],
          upsell: ["entradas:1", "petiscos:4"]
          // Pão de Alho imprescindível para o caldo das amêijoas + Gambas à Guilho para uma mesa de mariscos
        },
        {
          name: { pt: "Pica-Pau (Vaca)", en: "Pica-Pau (Sautéed Beef)", es: "Pica-Pau (Ternera)", fr: "Pica-Pau (Bœuf)" },
          desc: { pt: "Bife em cubos salteados com pickles e cerveja.", en: "Diced beef sautéed with pickles and beer.", es: "Carne en cubos con encurtidos y cerveza.", fr: "Bœuf en dés aux cornichons et bière." },
          price: "13,50€", photo: null, diet: [], allergens: [10,12],
          upsell: ["entradas:4", "pregos:0"]
          // Croquete partilha o perfil de carne bovina + Prego no Pão para uma mesa de clássicos portugueses
        }
      ]
    },

    /* ── MARISCOS QUENTES ── */
    {
      id: "mariscos-quentes",
      section: { pt: "Mariscos Quentes", en: "Hot Seafood", es: "Mariscos Calientes", fr: "Fruits de Mer Chauds" },
      desc: { pt: "Do mar para a mesa.", en: "From sea to table.", es: "Del mar a la mesa.", fr: "De la mer à la table." },
      items: [
        {
          name: { pt: "Mexilhão à Bulhão Pato (300g)", en: "Mussels Bulhão Pato", es: "Mejillones Bulhão Pato", fr: "Moules Bulhão Pato" },
          desc: { pt: "Mexilhão com alho, coentros e vinho branco.", en: "Mussels with garlic, coriander and white wine.", es: "Mejillones con ajo y vino.", fr: "Moules à l'ail et vin blanc." },
          price: "11,50€", photo: null, diet: ["GF","LF"], allergens: [12,14],
          upsell: ["petiscos:4", "entradas:1"]
          // Gambas à Guilho complementam uma mesa de mariscos + Pão de Alho para o caldo
        },
        {
          name: { pt: "Amêijoa ao Natural (300g)", en: "Natural Clams", es: "Almejas al Natural", fr: "Palourdes Nature" },
          desc: { pt: "Amêijoas abertas ao vapor.", en: "Steam-opened clams.", es: "Almejas al vapor.", fr: "Palourdes à la vapeur." },
          price: "12,00€", photo: null, diet: ["GF","LF"], allergens: [14],
          upsell: ["petiscos:5", "mariscos-quentes:0"]
          // Amêijoa Bulhão Pato é a versão temperada do mesmo ingrediente + Mexilhão para mesa de bivalves
        },
        {
          name: { pt: "Amêijoa da Casa (300g)", en: "House Clams", es: "Almejas de la Casa", fr: "Palourdes Maison" },
          desc: { pt: "Receita exclusiva da casa.", en: "Exclusive house recipe.", es: "Receta exclusiva de la casa.", fr: "Recette exclusive maison." },
          price: "16,00€", photo: null, diet: ["GF","LF"], allergens: [12,14], badge: "chef",
          upsell: ["entradas:0", "cataplana:0"]
          // Pão e Broa para aproveitar o molho exclusivo + Cataplana Porco e Amêijoa no mesmo ingrediente
        },
        {
          name: { pt: "Gamba Frita (mín. 300g)", en: "Fried Shrimps", es: "Gambas Fritas", fr: "Crevettes Frites" },
          desc: { pt: "Gambas fritas no azeite com sal grosso.", en: "Fried in olive oil with coarse salt.", es: "Fritas en aceite con sal gruesa.", fr: "Frites à l'huile avec sel gros." },
          price: "22,50€", photo: null, diet: ["GF","LF"], allergens: [2],
          upsell: ["mariscos-quentes:0", "entradas:0"]
          // Mexilhão complementa uma mesa de mariscos fritos e cozidos + Pão e Broa imprescindível
        }
      ]
    },

    /* ── CATAPLANAS ── */
    {
      id: "cataplana",
      section: { pt: "Cataplanas", en: "Portuguese Stews", es: "Cataplanas", fr: "Cataplanas" },
      desc: { pt: "Para 2 pessoas.", en: "For 2 people.", es: "Para 2 personas.", fr: "Pour 2 personnes." },
      items: [
        {
          name: { pt: "Cataplana de Porco e Amêijoa (2 pax)", en: "Pork & Clams Cataplana", es: "Cataplana de Cerdo y Almejas", fr: "Cataplana Porc et Palourdes" },
          desc: { pt: "O clássico alentejano numa cataplana de cobre.", en: "The Alentejo classic in a copper cataplana.", es: "El clásico alentejano.", fr: "Le classique de l'Alentejo." },
          price: "45,00€", photo: null, diet: ["LF"], allergens: [14], badge: "popular",
          upsell: ["entradas:0", "sobremesas:2"]
          // Pão e Broa é obrigatório para uma cataplana — para molhar o caldo rico + Leite Creme para terminar
        },
        {
          name: { pt: "Cataplana de Garoupa c/ Gambas (2 pax)", en: "Grouper & Prawns Cataplana", es: "Cataplana de Mero", fr: "Cataplana de Mérou" },
          desc: { pt: "Garoupa fresca com gambas e legumes.", en: "Fresh grouper with prawns and vegetables.", es: "Mero fresco con gambas.", fr: "Mérou frais aux crevettes." },
          price: "60,00€", photo: null, diet: ["GF","LF"], allergens: [2,4],
          upsell: ["entradas:0", "sobremesas:0"]
          // Pão e Broa para o caldo do peixe + Arroz Doce — sobremesa leve para equilibrar o peixe
        },
        {
          name: { pt: "Cataplana de Marisco (2 pax)", en: "Shellfish Cataplana", es: "Cataplana de Marisco", fr: "Cataplana de Fruits de Mer" },
          desc: { pt: "Mistura de mariscos em caldo aromático.", en: "Mixed shellfish in aromatic broth.", es: "Mezcla de mariscos.", fr: "Mélange de fruits de mer." },
          price: "60,00€", photo: null, diet: ["GF","LF"], allergens: [2,14], badge: "chef",
          upsell: ["entradas:1", "sobremesas:1"]
          // Pão de Alho é perfeito para o caldo de marisco + Baba de Camelo como sobremesa tradicional
        },
        {
          name: { pt: "Cataplana de Tamboril e Gambas (2 pax)", en: "Monkfish & Prawns Cataplana", es: "Cataplana de Rape", fr: "Cataplana Lotte et Crevettes" },
          desc: { pt: "Tamboril firme com gambas e coentros.", en: "Firm monkfish with prawns and coriander.", es: "Rape firme con gambas.", fr: "Lotte ferme aux crevettes." },
          price: "77,50€", photo: null, diet: ["GF","LF"], allergens: [2,4],
          upsell: ["entradas:1", "sobremesas:5"]
          // Pão de Alho acompanha o tamboril na perfeição + Cheesecake para terminar uma refeição premium
        }
      ]
    },

    /* ── ARROZ ── */
    {
      id: "arroz",
      section: { pt: "Arroz", en: "Rice", es: "Arroz", fr: "Riz" },
      desc: { pt: "Sempre malandro. Para 2 pessoas.", en: "Soupy rice. For 2 people.", es: "Para 2 personas.", fr: "Pour 2 personnes." },
      items: [
        {
          name: { pt: "Arroz de Tamboril c/ Gambas (2 pax)", en: "Monkfish Rice with Prawns", es: "Arroz de Rape con Gambas", fr: "Riz à la Lotte et Crevettes" },
          desc: { pt: "Arroz malandro com tamboril e gambas.", en: "Soupy rice with monkfish and prawns.", es: "Arroz caldoso con rape y gambas.", fr: "Riz mouillé à la lotte et crevettes." },
          price: "52,50€", photo: null, diet: ["LF"], allergens: [2,4],
          upsell: ["entradas:0", "sobremesas:2"]
          // Pão e Broa para o arroz malandro + Leite Creme como sobremesa reconfortante
        },
        {
          name: { pt: "Arroz de Marisco (2 pax)", en: "Shellfish Rice", es: "Arroz de Marisco", fr: "Riz aux Fruits de Mer" },
          desc: { pt: "O clássico português com mariscos variados.", en: "Portuguese classic with mixed shellfish.", es: "El clásico portugués.", fr: "Le classique portugais." },
          price: "52,50€", photo: null, diet: ["LF"], allergens: [2,4,14], badge: "popular",
          upsell: ["entradas:1", "sobremesas:0"]
          // Pão de Alho para o caldo do marisco + Arroz Doce — ironia deliciosa de dois arrozes
        },
        {
          name: { pt: "Arroz de Lavagante (2 pax)", en: "Blue Lobster Rice", es: "Arroz de Bogavante", fr: "Riz au Homard Bleu" },
          desc: { pt: "Lavagante azul em arroz malandro.", en: "Blue lobster in soupy rice.", es: "Bogavante azul.", fr: "Homard bleu." },
          price: "70,00€", photo: null, diet: ["LF"], allergens: [2],
          upsell: ["entradas:2", "sobremesas:5"]
          // Presunto como entrada elegante antes de um lavagante + Cheesecake para uma experiência premium completa
        },
        {
          name: { pt: "Arroz de Lagosta (2 pax)", en: "Lobster Rice", es: "Arroz de Langosta", fr: "Riz au Homard" },
          desc: { pt: "Lagosta em arroz malandro — só aos fins-de-semana.", en: "Lobster rice — weekends only.", es: "Langosta. Solo fines de semana.", fr: "Homard. Week-ends uniquement." },
          price: "85,00€", photo: null, diet: ["LF"], allergens: [2], badge: "new",
          upsell: ["entradas:2", "sobremesas:5"]
          // Presunto como entrada de luxo antes da lagosta + Cheesecake para fechar uma refeição especial
        }
      ]
    },

    /* ── CARNE ── */
    {
      id: "carne",
      section: { pt: "Carne", en: "Meat", es: "Carne", fr: "Viande" },
      desc: { pt: "A qualidade da carne é o nosso nome.", en: "Quality meat is our name.", es: "La calidad de la carne.", fr: "La qualité de la viande." },
      items: [
        {
          name: { pt: "Alheira de Mirandela", en: "Mirandela Sausage", es: "Alheira de Mirandela", fr: "Alheira de Mirandela" },
          desc: { pt: "Enchido com ovo e batata frita.", en: "Traditional sausage with egg and fries.", es: "Embutido tradicional.", fr: "Saucisse traditionnelle." },
          price: "11,50€", photo: null, diet: ["LF"], allergens: [1,3],
          upsell: ["entradas:3", "sobremesas:0"]
          // Queijo Curado como entrada — combo transmontano clássico + Arroz Doce para terminar à portuguesa
        },
        {
          name: { pt: "Bife de Frango", en: "Chicken Steak", es: "Filete de Pollo", fr: "Steak de Poulet" },
          desc: { pt: "Peito de frango grelhado com batata frita.", en: "Grilled chicken breast with fries.", es: "Pechuga a la plancha.", fr: "Filet de poulet grillé." },
          price: "13,00€", photo: null, diet: ["LF"], allergens: [],
          upsell: ["entradas:0", "sobremesas:1"]
          // Pão e Broa para acompanhar + Baba de Camelo — sobremesa leve e portuguesa
        },
        {
          name: { pt: "Secretos de Porco", en: "Iberian Pork", es: "Secreto Ibérico", fr: "Secreto de Porc Ibérique" },
          desc: { pt: "Secretos de porco preto grelhados.", en: "Grilled Iberian pork secreto.", es: "Secreto ibérico a la brasa.", fr: "Secreto de porc ibérique grillé." },
          price: "14,50€", photo: null, diet: ["GF","LF"], allergens: [],
          upsell: ["petiscos:2", "sobremesas:2"]
          // Morcela Assada partilha o mesmo porco ibérico + Leite Creme para terminar com elegância
        },
        {
          name: { pt: "Piano Grelhado", en: "Grilled Pork Ribs", es: "Costillar de Cerdo", fr: "Travers de Porc Grillé" },
          desc: { pt: "Costeletas de porco no carvão.", en: "Charcoal-grilled pork ribs.", es: "Costillar a la brasa.", fr: "Travers grillé au charbon." },
          price: "15,00€", photo: null, diet: ["GF","LF"], allergens: [],
          upsell: ["petiscos:1", "sobremesas:3"]
          // Chouriço Assado no mesmo perfil de brasa + Mousse de Chocolate para terminar intenso
        },
        {
          name: { pt: "Costeletas de Borrego", en: "Grilled Lamb Chops", es: "Chuletitas de Cordero", fr: "Côtelettes d'Agneau" },
          desc: { pt: "Costeletas de borrego grelhadas com alecrim.", en: "Grilled lamb chops with rosemary.", es: "Chuletitas al romero.", fr: "Côtelettes au romarin." },
          price: "14,00€", photo: null, diet: ["GF","LF"], allergens: [],
          upsell: ["entradas:3", "sobremesas:2"]
          // Queijo Curado complementa o borrego como entrada elegante + Leite Creme para fechar
        },
        {
          name: { pt: "Bife de Vitela c/ Pimenta Verde", en: "Veal with Green Pepper Sauce", es: "Ternera con Pimienta Verde", fr: "Veau Sauce Poivre Vert" },
          desc: { pt: "Vitela grelhada com molho de pimenta verde.", en: "Grilled veal with green peppercorn sauce.", es: "Ternera con pimienta verde.", fr: "Veau sauce poivre vert." },
          price: "17,50€", photo: null, diet: [], allergens: [7,10,12],
          upsell: ["entradas:0", "sobremesas:5"]
          // Pão e Broa para o molho de pimenta + Cheesecake — frescura láctea para contrastar com a pimenta
        },
        {
          name: { pt: "Bife de Vitela c/ Molho de Café", en: "Veal with Coffee Sauce", es: "Ternera con Salsa de Café", fr: "Veau Sauce Café" },
          desc: { pt: "Assinatura da casa — vitela com molho de café.", en: "House signature — veal with coffee sauce.", es: "Especialidad — ternera con café.", fr: "Spécialité — veau sauce café." },
          price: "17,50€", photo: null, diet: [], allergens: [7,12], badge: "chef",
          upsell: ["entradas:3", "sobremesas:3"]
          // Queijo Curado como entrada sóbria antes de um prato de chef + Mousse de Chocolate — café + chocolate é clássico
        },
        {
          name: { pt: "Costeletas de Novilho", en: "Beef Chop", es: "Chuletón de Ternera", fr: "Côte de Bœuf" },
          desc: { pt: "Costeletas de novilho maturado.", en: "Aged beef chop.", es: "Chuletón madurado.", fr: "Côte de bœuf maturée." },
          price: "20,00€", photo: null, diet: ["GF","LF"], allergens: [],
          upsell: ["petiscos:6", "sobremesas:3"]
          // Pica-Pau de boi como entrada no mesmo espírito de carne bovina + Mousse de Chocolate para terminar
        },
        {
          name: { pt: "Espetada de Vitela", en: "Veal Skewer", es: "Espeto de Ternera", fr: "Brochette de Veau" },
          desc: { pt: "Espetada de vitela na brasa com louro.", en: "Charcoal-grilled veal skewer with bay leaf.", es: "Espeto a la brasa.", fr: "Brochette au charbon." },
          price: "19,00€", photo: null, diet: ["GF","LF"], allergens: [],
          upsell: ["entradas:0", "sobremesas:1"]
          // Pão e Broa para a espetada + Baba de Camelo — terminar uma espetada com uma sobremesa cremosa
        },
        {
          name: { pt: "Naco na Pedra", en: "Steak on Stone", es: "Entrecot en Piedra", fr: "Pavé sur Pierre" },
          desc: { pt: "Naco de novilho servido em pedra a 400°C.", en: "Beef served on 400°C stone.", es: "Ternera en piedra caliente.", fr: "Bœuf sur pierre chaude." },
          price: "22,50€", photo: null, diet: ["GF","LF"], allergens: [], badge: "popular",
          upsell: ["petiscos:6", "sobremesas:4"]
          // Pica-Pau de entrada — mesmo perfil de novilho + Mousse Kit-Kat para uma noite memorável
        },
        {
          name: { pt: "Picanha", en: "Picanha", es: "Picanha", fr: "Picanha" },
          desc: { pt: "Picanha à brasileira, fatiada à mesa.", en: "Brazilian-style picanha, sliced tableside.", es: "Picanha brasileña.", fr: "Picanha brésilienne." },
          price: "20,00€", photo: null, diet: ["GF","LF"], allergens: [],
          upsell: ["petiscos:1", "sobremesas:1"]
          // Chouriço Assado como petisco de entrada — família das carnes grelhadas + Baba de Camelo para terminar
        }
      ]
    },

    /* ── PEIXE ── */
    {
      id: "peixe",
      section: { pt: "Peixe", en: "Fish", es: "Pescado", fr: "Poisson" },
      desc: { pt: "Fresco, do Atlântico.", en: "Fresh, from the Atlantic.", es: "Fresco del Atlántico.", fr: "Frais de l'Atlantique." },
      items: [
        {
          name: { pt: "Bacalhau da Casa", en: "House Codfish", es: "Bacalao de la Casa", fr: "Morue Maison" },
          desc: { pt: "Receita exclusiva com bacalhau e broa.", en: "Exclusive house recipe with codfish and cornbread.", es: "Receta exclusiva.", fr: "Recette exclusive." },
          price: "12,50€", photo: null, diet: ["LF"], allergens: [1,4], badge: "chef",
          upsell: ["entradas:0", "sobremesas:2"]
          // Pão e Broa — o bacalhau pede broa, e este prato já a tem dentro + Leite Creme para terminar português
        },
        {
          name: { pt: "Salmão Grelhado", en: "Grilled Salmon", es: "Salmón a la Parrilla", fr: "Saumon Grillé" },
          desc: { pt: "Posta de salmão grelhada com legumes.", en: "Grilled salmon with vegetables.", es: "Salmón con verduras.", fr: "Saumon aux légumes." },
          price: "13,50€", photo: null, diet: ["GF","LF"], allergens: [4],
          upsell: ["petiscos:5", "sobremesas:5"]
          // Amêijoa Bulhão Pato — bivalve fresco para iniciar + Cheesecake — frescura cítrica que acompanha peixe
        },
        {
          name: { pt: "Chocos Grelhados", en: "Grilled Cuttlefish", es: "Sepia a la Parrilla", fr: "Seiche Grillée" },
          desc: { pt: "Chocos grelhados com arroz de tinta.", en: "Grilled cuttlefish with ink rice.", es: "Sepia con arroz negro.", fr: "Seiche et riz noir." },
          price: "14,00€", photo: null, diet: ["LF"], allergens: [14],
          upsell: ["petiscos:3", "sobremesas:0"]
          // Salada de Polvo — cefalópodes combinam na entrada + Arroz Doce para contrastar com o tinto de choco
        },
        {
          name: { pt: "Robalo Escalado", en: "Grilled Sea Bass", es: "Lubina a la Parrilla", fr: "Bar Grillé" },
          desc: { pt: "Robalo inteiro aberto e grelhado na brasa.", en: "Whole sea bass charcoal-grilled.", es: "Lubina entera a la brasa.", fr: "Bar entier au charbon." },
          price: "13,50€", photo: null, diet: ["GF","LF"], allergens: [4],
          upsell: ["petiscos:4", "sobremesas:1"]
          // Gambas à Guilho como petisco de mar + Baba de Camelo — cremosa e leve para terminar peixe grelhado
        },
        {
          name: { pt: "Polvo à Lagareiro", en: "Roasted Octopus", es: "Pulpo a Feira", fr: "Poulpe Rôti" },
          desc: { pt: "Polvo assado no forno com batata a murro e azeite.", en: "Oven-roasted octopus with smashed potatoes.", es: "Pulpo al horno.", fr: "Poulpe au four." },
          price: "25,00€", photo: null, diet: ["GF","LF"], allergens: [14], badge: "popular",
          upsell: ["petiscos:3", "sobremesas:2"]
          // Salada de Polvo como entrada — mesmo ingrediente, temperatura diferente + Leite Creme para acabar
        },
        {
          name: { pt: "Bacalhau à Lagareiro", en: "Roasted Codfish", es: "Bacalao à Lagareiro", fr: "Morue Rôtie" },
          desc: { pt: "Posta de bacalhau no forno com batata a murro.", en: "Oven-roasted codfish with smashed potatoes.", es: "Bacalao al horno.", fr: "Morue au four." },
          price: "22,50€", photo: null, diet: ["LF"], allergens: [4],
          upsell: ["entradas:0", "sobremesas:0"]
          // Pão e Broa — o bacalhau exige pão + Arroz Doce — sobremesa clássica portuguesa para bacalhau
        }
      ]
    },

    /* ── SOBREMESAS ── */
    {
      id: "sobremesas",
      section: { pt: "Sobremesas", en: "Desserts", es: "Postres", fr: "Desserts" },
      desc: { pt: "Para acabar em grande.", en: "End on a high note.", es: "Para acabar a lo grande.", fr: "Pour finir en beauté." },
      items: [
        {
          name: { pt: "Arroz Doce", en: "Rice Pudding", es: "Arroz con Leche", fr: "Riz au Lait" },
          desc: { pt: "Arroz doce cremoso com canela.", en: "Creamy rice pudding with cinnamon.", es: "Arroz con leche y canela.", fr: "Riz au lait à la cannelle." },
          price: "3,95€", photo: null, diet: ["V"], allergens: [7], badge: "popular",
          upsell: ["sobremesas:1", "sobremesas:2"]
          // Baba de Camelo e Leite Creme — os outros clássicos portugueses para quem quer provar as três sobremesas da casa
        },
        {
          name: { pt: "Baba de Camelo", en: "Caramel Mousse", es: "Baba de Camello", fr: "Mousse au Caramel" },
          desc: { pt: "Mousse de caramelo tradicional portuguesa.", en: "Traditional Portuguese caramel mousse.", es: "Mousse de caramelo.", fr: "Mousse au caramel." },
          price: "3,95€", photo: null, diet: ["V"], allergens: [3,7],
          upsell: ["sobremesas:0", "sobremesas:3"]
          // Arroz Doce — o outro clássico + Mousse de Chocolate para variar entre doce e intenso
        },
        {
          name: { pt: "Leite Creme", en: "Portuguese Crème Brûlée", es: "Crema Quemada", fr: "Crème Brûlée" },
          desc: { pt: "Creme com açúcar queimado.", en: "Cream with burnt sugar.", es: "Crema con azúcar quemado.", fr: "Crème au sucre brûlé." },
          price: "3,95€", photo: null, diet: ["V"], allergens: [3,7],
          upsell: ["sobremesas:1", "sobremesas:5"]
          // Baba de Camelo — cremosas e carameladas + Cheesecake para quem prefere algo mais fresco
        },
        {
          name: { pt: "Mousse de Chocolate", en: "Chocolate Mousse", es: "Mousse de Chocolate", fr: "Mousse au Chocolat" },
          desc: { pt: "Mousse de chocolate negro caseira.", en: "Homemade dark chocolate mousse.", es: "Mousse de chocolate negro.", fr: "Mousse au chocolat noir." },
          price: "3,95€", photo: null, diet: ["V"], allergens: [3,7],
          upsell: ["sobremesas:4", "sobremesas:1"]
          // Mousse Kit-Kat — mesma base de chocolate com variação + Baba de Camelo para contraste de sabores
        },
        {
          name: { pt: "Mousse de Kit-Kat", en: "Kit-Kat Mousse", es: "Mousse de Kit-Kat", fr: "Mousse Kit-Kat" },
          desc: { pt: "Mousse de chocolate com pedaços de Kit-Kat.", en: "Chocolate mousse with Kit-Kat pieces.", es: "Mousse con Kit-Kat.", fr: "Mousse aux morceaux de Kit-Kat." },
          price: "3,95€", photo: null, diet: ["V"], allergens: [1,3,7,8], badge: "new",
          upsell: ["sobremesas:3", "sobremesas:5"]
          // Mousse de Chocolate — a versão clássica ao lado + Cheesecake para quem divide a mesa
        },
        {
          name: { pt: "Cheesecake", en: "Cheesecake", es: "Cheesecake", fr: "Cheesecake" },
          desc: { pt: "Cheesecake com coulis de frutos vermelhos.", en: "Cheesecake with red fruit coulis.", es: "Cheesecake con frutos rojos.", fr: "Cheesecake aux fruits rouges." },
          price: "4,50€", photo: null, diet: ["V"], allergens: [1,3,7],
          upsell: ["sobremesas:0", "sobremesas:2"]
          // Arroz Doce — o clássico português ao lado do internacional + Leite Creme para completar a mesa de sobremesas
        }
      ]
    }
  ],


  /* ════════════════════════════════════════════════════════════════════════
     8. MAIS PEDIDOS  ○
     ════════════════════════════════════════════════════════════════════════ */

  mostOrdered: [
    { refId: "pregos:0",    badge: { pt: "A lenda da casa",       en: "House legend",       es: "Leyenda de la casa",      fr: "La légende maison"     } },
    { refId: "cataplana:0", badge: { pt: "Clássico alentejano",   en: "Alentejo classic",   es: "Clásico alentejano",      fr: "Classique alentejano"  } },
    { refId: "peixe:4",     badge: { pt: "Favorito dos clientes", en: "Customer favourite", es: "Favorito de los clientes", fr: "Favori des clients"    } }
  ],


  /* ════════════════════════════════════════════════════════════════════════
     9. VINHOS  ○  — photos mantidas (garrafas, não comida)
     ════════════════════════════════════════════════════════════════════════ */

  wines: [
    { name: "Esporão Reserva Tinto",              country: "Portugal",  region: "Alentejo",      type: "tinto",     grape: "Aragonez, Trincadeira, Cabernet Sauvignon",     abv: "14,5%", volume: "750ml", price: "28,50€", photo: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcTPTRtrGs1wnpXAhdVrjLu58JAHLlIuQKTsomrNcUntvxE4tf9Twxc1ZmY1eL3SqO5u6G0x-5y70iuwkSQzljFiJozt1kZ6TXDNKamOotnLXg7-_KOV5onEZoj76zVIIx_FTq_Bnw&usqp=CAc", desc: "Tinto encorpado com notas de frutos pretos. Estágio de 12 meses em barrica.",    vivinoRating: 3.8, vivinoUrl: "https://www.vivino.com/wines/1138696" },
    { name: "Quinta do Crasto Douro Tinto",        country: "Portugal",  region: "Douro",         type: "tinto",     grape: "Touriga Nacional, Touriga Franca, Tinta Roriz",  abv: "14%",   volume: "750ml", price: "24,00€", photo: "https://www.dourado.com.pt/image/cache/products/quinta%20crasto/crasto_to_doc-900x900.jpg", desc: "Clássico do Douro com taninos elegantes. Ideal para carnes vermelhas.",         vivinoRating: 3.9, vivinoUrl: "https://www.vivino.com/wines/1146697" },
    { name: "Pêra-Manca Tinto",                   country: "Portugal",  region: "Alentejo",      type: "tinto",     grape: "Aragonez, Trincadeira",                          abv: "13,5%", volume: "750ml", price: "85,00€", photo: "https://www.adegavinhateira.pt/910-large_default/pera-manca-tinto-750ml.jpg", desc: "Ícone do Alentejo. Vinho para momentos especiais.",                            vivinoRating: 4.4, vivinoUrl: "https://www.vivino.com/wines/1158197" },
    { name: "Casa Ferreirinha Vinha Grande Tinto", country: "Portugal",  region: "Douro",         type: "tinto",     grape: "Touriga Franca, Tinta Roriz",                    abv: "13,5%", volume: "750ml", price: "19,50€", photo: "https://www.almadeportugal.com/cdn/shop/files/vinhagrande.png?v=1774957157&width=3840", desc: "Equilibrado e fácil de beber. Boa relação qualidade/preço.",                  vivinoRating: 3.7, vivinoUrl: "https://www.vivino.com/wines/1131804" },
    { name: "Soalheiro Alvarinho",                 country: "Portugal",  region: "Vinho Verde",   type: "branco",    grape: "Alvarinho",                                      abv: "12,5%", volume: "750ml", price: "22,00€", photo: "https://cdnx.jumpseller.com/vinhalvarinho-pt/image/21851030/Soalheiro-Alvarinho-Classico-2020.jpg?1652801739", desc: "Alvarinho de Monção. Fresco, mineral, com aromas cítricos.",                  vivinoRating: 3.9, vivinoUrl: "https://www.vivino.com/wines/1146410" },
    { name: "Herdade do Esporão Branco",           country: "Portugal",  region: "Alentejo",      type: "branco",    grape: "Antão Vaz, Roupeiro, Arinto",                    abv: "13%",   volume: "750ml", price: "16,50€", photo: "https://www.dourado.com.pt/image/cache/products/herdade%20esporao/esporao%20res22-900x900.jpg", desc: "Branco alentejano com notas tropicais e final fresco.",                        vivinoRating: 3.7, vivinoUrl: "https://www.vivino.com/wines/1138698" },
    { name: "Quinta dos Roques Encruzado",         country: "Portugal",  region: "Dão",           type: "branco",    grape: "Encruzado",                                      abv: "13%",   volume: "750ml", price: "20,00€", photo: "https://www.vinha.pt/wp-content/uploads/2022/05/106120-2.png", desc: "Encruzado do Dão — elegante e complexo.",                                      vivinoRating: 4.0, vivinoUrl: "https://www.vivino.com/wines/1142876" },
    { name: "Aveleda Loureiro",                    country: "Portugal",  region: "Vinho Verde",   type: "verde",     grape: "Loureiro",                                       abv: "11%",   volume: "750ml", price: "12,50€", photo: "https://aveledashop.pt/wp-content/uploads/2020/04/Aveleda_Castas_Loureiro-scaled.jpg", desc: "Verde jovem e aromático. Perfeito com mariscos.",                              vivinoRating: 3.5, vivinoUrl: "https://www.vivino.com/wines/1129823" },
    { name: "Casal Garcia",                        country: "Portugal",  region: "Vinho Verde",   type: "verde",     grape: "Loureiro, Trajadura",                            abv: "9,5%",  volume: "750ml", price: "9,50€",  photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSgGB4-Y9k0yX0w1468tNNLPG0MvNQY5ggWg&s", desc: "Verde leve e refrescante. Popular e acessível.",                               vivinoRating: 3.4, vivinoUrl: "https://www.vivino.com/wines/1124735" },
    { name: "Mateus Rosé",                         country: "Portugal",  region: "Douro",         type: "rose",      grape: "Baga, Rufete",                                   abv: "11%",   volume: "750ml", price: "11,50€", photo: "https://cdnx.jumpseller.com/selectmoment/image/48174714/Publica__o2-152.png?1714746046", desc: "O rosé português mais famoso. Leve e ligeiramente gaseificado.",               vivinoRating: 3.3, vivinoUrl: "https://www.vivino.com/wines/1125513" },
    { name: "Luís Pato Espumante Bruto",           country: "Portugal",  region: "Bairrada",      type: "espumante", grape: "Baga, Maria Gomes",                              abv: "12,5%", volume: "750ml", price: "22,00€", photo: "https://acasagarrafeira.pt/wp-content/uploads/2022/05/Luis-Pato-Espumante-Bruto.jpeg", desc: "Espumante da Bairrada, método tradicional. Fino e persistente.",               vivinoRating: 3.8, vivinoUrl: "https://www.vivino.com/wines/1138512" },
    { name: "Murganheira Bruto",                   country: "Portugal",  region: "Távora-Varosa", type: "espumante", grape: "Chardonnay, Pinot Noir",                         abv: "12%",   volume: "750ml", price: "18,00€", photo: "https://www.vinha.pt/wp-content/uploads/2015/05/100121.png", desc: "Espumante nacional de referência com bolha fina.",                              vivinoRating: 3.6, vivinoUrl: "https://www.vivino.com/wines/1140251" },
    { name: "Rioja Reserva Campo Viejo",           country: "Espanha",   region: "Rioja",         type: "tinto",     grape: "Tempranillo",                                    abv: "13,5%", volume: "750ml", price: "17,50€", photo: "https://www.bodeboca.pt/sites/default/files/wines/2026-01/bot-campoviejo-reserva-2021.jpg", desc: "Tempranillo da Rioja. Notas de baunilha e frutos vermelhos maduros.",          vivinoRating: 3.7, vivinoUrl: "https://www.vivino.com/wines/1129312" },
    { name: "Malbec Catena Argentina",             country: "Argentina", region: "Mendoza",       type: "tinto",     grape: "Malbec",                                         abv: "13,5%", volume: "750ml", price: "22,50€", photo: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTYi90oTdgWYUiDN4T0fuuK3IZfCSrNnpr29LWSEb8FLiAxN7kqBzVNdNUOOvYt735R6fwxcdwsW8glw8B_cO1881KXzIg52wVLDDQlJbdLuSe4XRckiHDq2UnA6M1XIWoTow&usqp=CAc1", desc: "Malbec argentino premium. Intenso e encorpado.",                               vivinoRating: 4.1, vivinoUrl: "https://www.vivino.com/wines/1137817" }
  ],

  features: {
    callStaff: false,
    sharedCart: true,
  }
};


