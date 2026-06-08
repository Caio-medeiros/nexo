/**
 * NEXO Menu Config — marisca-petisca
 * ─────────────────────────────────────────────────────────
 * Marisca Petisca · Praia de Carcavelos
 * ─────────────────────────────────────────────────────────
 */

const P = (id) => id
  ? `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1`
  : null;

const CONFIG = {

  /* ════════════════════════════════════════════════════════════════════════
     1. IDENTIDADE  ★
     ════════════════════════════════════════════════════════════════════════ */

  slug:  "marisca-petisca",
  name:  "Marisca Petisca",
  city:  "Praia de Carcavelos, Portugal",

  ga4MeasurementId: "",

  /* Tópico ntfy.sh — garçons instalam app ntfy e subscrevem este tópico */
  callStaffTopic: 'nexoteste',

  tagline: {
    pt: "Marisqueira e restaurante à beira-mar",
    en: "Seafood & restaurant by the sea",
    es: "Marisquería y restaurante junto al mar",
    fr: "Marisquière et restaurant en bord de mer"
  },

  heroStamp: {
    pt: "Carcavelos Beach", en: "Carcavelos Beach", es: "Carcavelos Beach", fr: "Carcavelos Beach"
  },


  /* ════════════════════════════════════════════════════════════════════════
     2. VISUAL  ★
     ════════════════════════════════════════════════════════════════════════ */

  brandColor:   "#1A4FA0",
  heroImageUrl: "./img/thumb.webp",
  logoUrl: null,


  /* ════════════════════════════════════════════════════════════════════════
     3. CONTACTOS  ★
     ════════════════════════════════════════════════════════════════════════ */

  address:      "Av. Marginal · Praia de Carcavelos · 2775-583 Carcavelos",
  phone:        "+351 214 570 000",
  phoneDisplay: "214 570 000",

  hours: {
    pt: "Seg–Dom · 12h–23h",
    en: "Mon–Sun · 12pm–11pm",
    es: "Lun–Dom · 12h–23h",
    fr: "Lun–Dim · 12h–23h"
  },
  hoursToday: {
    pt: "Aberto até 23h", en: "Open until 11pm",
    es: "Abierto hasta las 23h", fr: "Ouvert jusqu'à 23h"
  },


  /* ════════════════════════════════════════════════════════════════════════
     4. REDES & REVIEWS
     ════════════════════════════════════════════════════════════════════════ */

  googleReviewUrl:  "https://search.google.com/local/writereview?placeid=PLACEHOLDER",
  googleRating:     4.3,
  googleReviewCount:"412",
  theForkReviewUrl: null,
  instagramHandle:  "mariscapetisca",
  whatsappNumber:   "351214570000",
  whatsappLoyaltyMessage: {
    pt: "Olá! Gostaria de contactar a Marisca Petisca.",
    en: "Hello! I would like to contact Marisca Petisca.",
    es: "¡Hola! Me gustaría contactar con Marisca Petisca.",
    fr: "Bonjour! Je souhaite contacter Marisca Petisca."
  },

  orderWhatsapp: '351918690783',
  // WhatsApp da Marisca Petisca para receber pedidos.
  // Deixar vazio '' para desativar a opção WhatsApp.

  tableInputEnabled: true,
  // Se true: o ecrã de confirmação pede número/nome da mesa antes de enviar.


  /* ════════════════════════════════════════════════════════════════════════
     5. WI-FI  ○
     ════════════════════════════════════════════════════════════════════════ */

  wifiSsid:     "Marisca_Guest",
  wifiPassword: "marisca2025",


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
        pt: "Sopas, petiscos e especialidades do dia à beira-mar",
        en: "Soups, small plates and daily specials by the sea",
        es: "Sopas, tapas y platos del día junto al mar",
        fr: "Soupes, petiscos et plats du jour au bord de la mer"
      }
    },
    {
      id: "tarde", startH: 15, endH: 19,
      ghost:    { pt: "Petiscos", en: "Snacks", es: "Tapas", fr: "Tapas" },
      label:    { pt: "Tarde à beira-mar", en: "Afternoon by the sea", es: "Tarde junto al mar", fr: "Après-midi en mer" },
      headline: { pt: "Hora de petiscar.", en: "Time for snacks.", es: "Hora de tapear.", fr: "L'heure de grignoter." },
      text: {
        pt: "Amêijoas, lingueirão e cocktails com vista para a praia",
        en: "Clams, razor clams and cocktails with beach views",
        es: "Almejas, navajas y cócteles con vistas al mar",
        fr: "Palourdes, couteaux et cocktails face à la mer"
      }
    },
    {
      id: "jantar", startH: 19, endH: 23,
      ghost:    { pt: "Jantar", en: "Dinner", es: "Cena", fr: "Dîner" },
      label:    { pt: "Jantar", en: "Dinner", es: "Cena", fr: "Dîner" },
      headline: { pt: "O mar na mesa.", en: "The sea on your table.", es: "El mar en la mesa.", fr: "La mer dans votre assiette." },
      text: {
        pt: "Arrozes, tachos e grelhados frescos do Atlântico",
        en: "Rice dishes, stews and fresh Atlantic grills",
        es: "Arroces, guisos y frescos del Atlántico a la brasa",
        fr: "Riz, ragoûts et grillades frais de l'Atlantique"
      }
    }
  ],


  /* ════════════════════════════════════════════════════════════════════════
     7. MENU  ★
     ════════════════════════════════════════════════════════════════════════ */

  menu: [

    /* ── ESPECIALIDADES ── */
    {
      id: "especialidades",
      section: { pt: "Especialidades", en: "Specialities", es: "Especialidades", fr: "Spécialités" },
      desc: { pt: "Os pratos que nos definem.", en: "The dishes that define us.", es: "Los platos que nos definen.", fr: "Les plats qui nous définissent." },
      items: [
        {
          name: { pt: "Arroz de Lingueirão com Pregado (2 px)", en: "Razor Clam Rice with Turbot (2 pax)", es: "Arroz de Navaja con Rodaballo (2 px)", fr: "Riz Couteau et Turbot (2 px)" },
          desc: { pt: "Arroz malandro de lingueirão com pregado fresco. A estrela da casa.", en: "Soupy razor clam rice with fresh turbot. Our house star.", es: "Arroz caldoso de navaja con rodaballo fresco. La estrella de la casa.", fr: "Riz aux couteaux et turbot frais. L'étoile de la maison." },
          price: "44,00€", photo: null, diet: ["GF","LF"], allergens: [4,14], badge: "chef",
          upsell: ["couvert:0", "sobremesas:1"]
        },
        {
          name: { pt: "Tábua Mista de Peixe Grelhado no Carvão", en: "Mixed Charcoal-Grilled Fish Board", es: "Tabla Mixta de Pescado a la Brasa", fr: "Plateau Mixte de Poissons au Charbon" },
          desc: { pt: "Robalo, dourada, salmão, camarão, lulas e mexilhão — grelhados na brasa.", en: "Seabass, seabream, salmon, shrimp, squid and mussels — charcoal-grilled.", es: "Lubina, dorada, salmón, gambas, calamares y mejillones — a la brasa.", fr: "Bar, daurade, saumon, crevettes, calamars et moules — au charbon." },
          price: "55,00€", photo: null, diet: ["GF","LF"], allergens: [2,4,14], badge: "popular",
          upsell: ["couvert:0", "sobremesas:2"]
        },
        {
          name: { pt: "Ensopado de Raia em Pão Frito (2 px)", en: "Traditional Ray Fish Stew with Fried Bread (2 pax)", es: "Guiso de Raya con Pan Frito (2 px)", fr: "Ragoût de Raie au Pain Frit (2 px)" },
          desc: { pt: "Ensopado tradicional de raia servido com pão frito estaladiço. Para dois.", en: "Traditional ray fish stew served with crispy fried bread. For two.", es: "Guiso tradicional de raya con pan frito crujiente. Para dos.", fr: "Ragoût traditionnel de raie au pain frit croustillant. Pour deux." },
          price: "35,00€", photo: null, diet: ["LF"], allergens: [1,4],
          upsell: ["couvert:0", "sobremesas:0"]
        },
        {
          name: { pt: "Arroz de Berbigão c/ Raia", en: "Cockle Rice with Ray", es: "Arroz de Berberecho con Raya", fr: "Riz aux Coques et Raie" },
          desc: { pt: "Arroz cremoso de berbigão com raia fresca do dia.", en: "Creamy cockle rice with fresh ray of the day.", es: "Arroz cremoso de berberecho con raya fresca del día.", fr: "Riz crémeux aux coques et raie fraîche du jour." },
          price: "18,00€", photo: null, diet: ["GF","LF"], allergens: [4,14],
          upsell: ["couvert:0", "sobremesas:1"]
        },
        {
          name: { pt: "Grelhada Mista de Porco Preto com Arroz de Feijão", en: "Black Pork Mixed Grill with Bean Rice", es: "Parrillada de Cerdo Negro con Arroz de Judías", fr: "Grillade Mixte Porc Noir et Riz aux Haricots" },
          desc: { pt: "Secretos e piano de porco preto grelhados com arroz de feijão caseiro.", en: "Black pork secreto and ribs, grilled and served with homemade bean rice.", es: "Secreto y piano de cerdo negro a la plancha con arroz de judías casero.", fr: "Secreto et travers de porc noir grillés, riz aux haricots maison." },
          price: "15,50€", photo: null, diet: ["GF","LF"], allergens: [],
          upsell: ["petiscos:11", "sobremesas:1"]
        }
      ]
    },

    /* ── COUVERT ── */
    {
      id: "couvert",
      section: { pt: "Couvert", en: "Starters", es: "Cubierto", fr: "Couvert" },
      desc: { pt: "Para começar bem.", en: "To start well.", es: "Para comenzar bien.", fr: "Pour bien commencer." },
      items: [
        {
          name: { pt: "Pão", en: "Bread", es: "Pan", fr: "Pain" },
          desc: { pt: "Pão fresco do dia.", en: "Fresh daily bread.", es: "Pan fresco del día.", fr: "Pain frais du jour." },
          price: "1,80€", photo: null, diet: ["V"], allergens: [1],
          upsell: ["petiscos:8", "sopas:1"]
        },
        {
          name: { pt: "Azeitonas", en: "Olives", es: "Aceitunas", fr: "Olives" },
          desc: { pt: "Azeitonas temperadas da casa.", en: "House-seasoned olives.", es: "Aceitunas aliñadas de la casa.", fr: "Olives assaisonnées maison." },
          price: "1,80€", photo: null, diet: ["V","GF","LF"], allergens: [],
          upsell: ["couvert:5", "petiscos:8"]
        },
        {
          name: { pt: "Manteiga", en: "Butter", es: "Mantequilla", fr: "Beurre" },
          desc: { pt: "Manteiga de qualidade.", en: "Quality butter.", es: "Mantequilla de calidad.", fr: "Beurre de qualité." },
          price: "1,60€", photo: null, diet: ["V","GF"], allergens: [7],
          upsell: ["couvert:0", "couvert:4"]
        },
        {
          name: { pt: "Azeite", en: "Olive Oil", es: "Aceite de Oliva", fr: "Huile d'Olive" },
          desc: { pt: "Azeite extra virgem português.", en: "Portuguese extra virgin olive oil.", es: "Aceite de oliva virgen extra portugués.", fr: "Huile d'olive vierge extra portugaise." },
          price: "1,60€", photo: null, diet: ["V","GF","LF"], allergens: [],
          upsell: ["couvert:0", "petiscos:9"]
        },
        {
          name: { pt: "Pão Torrado", en: "Toasted Bread", es: "Pan Tostado", fr: "Pain Grillé" },
          desc: { pt: "Fatias de pão torrado.", en: "Toasted bread slices.", es: "Rebanadas de pan tostado.", fr: "Tranches de pain grillé." },
          price: "2,30€", photo: null, diet: ["V"], allergens: [1],
          upsell: ["couvert:2", "sopas:1"]
        },
        {
          name: { pt: "Bolo do Caco c/ Manteiga de Alho", en: "Garlic Butter Bolo do Caco", es: "Bolo do Caco con Mantequilla de Ajo", fr: "Bolo do Caco au Beurre d'Ail" },
          desc: { pt: "O tradicional pão madeirense com manteiga de alho caseira.", en: "Traditional Madeiran bread with homemade garlic butter.", es: "Pan madeirense tradicional con mantequilla de ajo casera.", fr: "Pain madérien traditionnel au beurre d'ail maison." },
          price: "3,00€", photo: null, diet: ["V"], allergens: [1,7], badge: "popular",
          upsell: ["petiscos:8", "petiscos:9"]
        },
        {
          name: { pt: "Queijo", en: "Cheese", es: "Queso", fr: "Fromage" },
          desc: { pt: "Queijo curado português.", en: "Portuguese cured cheese.", es: "Queso curado portugués.", fr: "Fromage affiné portugais." },
          price: "4,50€", photo: null, diet: ["V","GF"], allergens: [7],
          upsell: ["couvert:1", "couvert:0"]
        },
        {
          name: { pt: "Croquete (un.)", en: "Croquette", es: "Croqueta", fr: "Croquette" },
          desc: { pt: "Croquete caseiro — a entrada clássica portuguesa.", en: "Homemade croquette — the classic Portuguese snack.", es: "Croqueta casera — el clásico aperitivo portugués.", fr: "Croquette maison — le classique portugais." },
          price: "1,90€", photo: null, diet: [], allergens: [1,3,7],
          upsell: ["couvert:0", "petiscos:11"]
        }
      ]
    },

    /* ── SOPAS ── */
    {
      id: "sopas",
      section: { pt: "Sopas", en: "Soups", es: "Sopas", fr: "Soupes" },
      desc: { pt: "Reconfortantes.", en: "Comforting.", es: "Reconfortantes.", fr: "Réconfortantes." },
      items: [
        {
          name: { pt: "Sopa de Legumes", en: "Vegetable Soup", es: "Sopa de Verduras", fr: "Soupe de Légumes" },
          desc: { pt: "Sopa de legumes frescos da época.", en: "Fresh seasonal vegetable soup.", es: "Sopa de verduras frescas de temporada.", fr: "Soupe de légumes frais de saison." },
          price: "4,00€", photo: null, diet: ["V","GF","LF"], allergens: [],
          upsell: ["couvert:0", "couvert:4"]
        },
        {
          name: { pt: "Creme de Marisco", en: "Seafood Cream Soup", es: "Crema de Marisco", fr: "Crème de Fruits de Mer" },
          desc: { pt: "Creme aveludado de mariscos do Atlântico. Um clássico à beira-mar.", en: "Velvety cream of Atlantic seafood. A seaside classic.", es: "Crema aterciopelada de mariscos del Atlántico. Un clásico costero.", fr: "Crème veloutée de fruits de mer de l'Atlantique. Un classique côtier." },
          price: "5,00€", photo: null, diet: ["GF","LF"], allergens: [2,14], badge: "popular",
          upsell: ["couvert:0", "petiscos:9"]
        },
        {
          name: { pt: "Sopa de Peixe", en: "Fish Soup", es: "Sopa de Pescado", fr: "Soupe de Poisson" },
          desc: { pt: "Sopa de peixe fresco do dia.", en: "Fresh fish soup of the day.", es: "Sopa de pescado fresco del día.", fr: "Soupe de poisson frais du jour." },
          price: "5,00€", photo: null, diet: ["GF","LF"], allergens: [4],
          upsell: ["couvert:0", "peixe:0"]
        }
      ]
    },

    /* ── PETISCOS ── */
    {
      id: "petiscos",
      section: { pt: "Petiscos", en: "Small Plates", es: "Tapas", fr: "Petiscos" },
      desc: { pt: "Para partilhar à beira-mar.", en: "To share by the sea.", es: "Para compartir junto al mar.", fr: "À partager au bord de la mer." },
      items: [
        {
          name: { pt: "Peixinhos da Horta", en: "Green Bean Fritters", es: "Peixinhos da Horta", fr: "Beignets de Haricots Verts" },
          desc: { pt: "Feijão verde em massa crocante — o petisco vegetariano da casa.", en: "Crispy battered green beans — the house vegetarian snack.", es: "Judías verdes en tempura crujiente — el aperitivo vegetariano de la casa.", fr: "Haricots verts en pâte croustillante — le snack végétarien maison." },
          price: "7,00€", photo: null, diet: ["V"], allergens: [1,3],
          upsell: ["petiscos:4", "sopas:0"]
        },
        {
          name: { pt: "Pimentos Padrão", en: "Padrón Peppers", es: "Pimientos de Padrón", fr: "Piments Padrón" },
          desc: { pt: "Pimentos padrão salteados com sal grosso.", en: "Padron peppers sautéed with coarse salt.", es: "Pimientos de Padrón salteados con sal gruesa.", fr: "Piments Padrón sautés au gros sel." },
          price: "6,00€", photo: null, diet: ["V","GF","LF"], allergens: [],
          upsell: ["couvert:1", "petiscos:0"]
        },
        {
          name: { pt: "Ovos com Farinheira", en: "Eggs with Farinheira Sausage", es: "Huevos con Farinheira", fr: "Oeufs à la Farinheira" },
          desc: { pt: "Ovos mexidos com farinheira crocante — petisco tradicional português.", en: "Scrambled eggs with crispy farinheira sausage — traditional Portuguese snack.", es: "Huevos revueltos con farinheira crujiente — aperitivo tradicional portugués.", fr: "Oeufs brouillés à la farinheira croustillante — snack traditionnel portugais." },
          price: "7,50€", photo: null, diet: [], allergens: [1,3],
          upsell: ["couvert:0", "sopas:0"]
        },
        {
          name: { pt: "Ovos Rotos", en: "Broken Eggs", es: "Huevos Rotos", fr: "Oeufs Cassés" },
          desc: { pt: "Batata frita com ovo estrelado — o petisco casual que toda a gente pede.", en: "Fries topped with a fried egg — the casual snack everyone orders.", es: "Patatas fritas con huevo frito — el aperitivo casual que todos piden.", fr: "Frites avec oeuf au plat — le snack casual que tout le monde commande." },
          price: "9,50€", photo: null, diet: ["V","LF"], allergens: [3],
          upsell: ["petiscos:2", "couvert:0"]
        },
        {
          name: { pt: "Pataniscas de Bacalhau", en: "Cod Fritters", es: "Pataniscas de Bacalao", fr: "Beignets de Morue" },
          desc: { pt: "Pataniscas de bacalhau crocantes — receita tradicional da casa.", en: "Crispy cod fritters — the house traditional recipe.", es: "Buñuelos de bacalao crujientes — receta tradicional de la casa.", fr: "Beignets de morue croustillants — recette traditionnelle maison." },
          price: "7,50€", photo: null, diet: [], allergens: [1,3,4], badge: "popular",
          upsell: ["peixe:0", "couvert:0"]
        },
        {
          name: { pt: "Salada de Bacalhau", en: "Codfish Salad", es: "Ensalada de Bacalao", fr: "Salade de Morue" },
          desc: { pt: "Bacalhau desfiado com grão, azeite e salsa.", en: "Shredded cod with chickpeas, olive oil and parsley.", es: "Bacalao desmigado con garbanzos, aceite y perejil.", fr: "Morue effilochée aux pois chiches, huile et persil." },
          price: "7,00€", photo: null, diet: ["GF","LF"], allergens: [4],
          upsell: ["couvert:3", "peixe:4"]
        },
        {
          name: { pt: "Calamares", en: "Fried Squid", es: "Calamares Fritos", fr: "Calamars Frits" },
          desc: { pt: "Anéis de lula fritos em massa leve. Irresistíveis à beira-mar.", en: "Squid rings fried in light batter. Irresistible by the sea.", es: "Anillas de calamar fritas en masa ligera. Irresistibles junto al mar.", fr: "Rondelles de calmar en pâte légère. Irrésistibles en bord de mer." },
          price: "10,00€", photo: null, diet: [], allergens: [1,3,14],
          upsell: ["petiscos:7", "grelha:3"]
        },
        {
          name: { pt: "Choco Frito", en: "Fried Cuttlefish", es: "Jibia Frita", fr: "Seiche Frite" },
          desc: { pt: "Choco frito estaladiço — especialidade de marisqueira.", en: "Crispy fried cuttlefish — seafood house speciality.", es: "Jibia frita crujiente — especialidad de la marisquería.", fr: "Seiche frite croustillante — spécialité marisqueira." },
          price: "12,50€", photo: null, diet: [], allergens: [1,3,14],
          upsell: ["petiscos:6", "peixe:2"]
        },
        {
          name: { pt: "Gambas à Guilho", en: "Garlic Prawns", es: "Gambas al Ajillo", fr: "Crevettes à l'Ail" },
          desc: { pt: "Gambas salteadas em azeite, alho e piri-piri. Pede pão para o molho.", en: "Prawns sautéed in olive oil, garlic and piri-piri. Order bread for the sauce.", es: "Gambas salteadas en aceite, ajo y piri-piri. Pide pan para la salsa.", fr: "Crevettes sautées à l'huile, ail et piri-piri. Prenez du pain pour la sauce." },
          price: "12,50€", photo: null, diet: ["GF","LF"], allergens: [2],
          upsell: ["couvert:5", "petiscos:9"]
        },
        {
          name: { pt: "Amêijoas à Bulhão Pato", en: "Clams with Garlic & Coriander", es: "Almejas Bulhão Pato", fr: "Palourdes Ail et Coriandre" },
          desc: { pt: "Amêijoas frescas em azeite, alho e coentros. O clássico do mar português.", en: "Fresh clams in olive oil, garlic and coriander. The Portuguese sea classic.", es: "Almejas frescas en aceite, ajo y cilantro. El clásico del mar portugués.", fr: "Palourdes fraîches à l'huile, ail et coriandre. Le classique de la mer portugaise." },
          price: "18,50€", photo: null, diet: ["GF","LF"], allergens: [14], badge: "popular",
          upsell: ["couvert:5", "petiscos:10"]
        },
        {
          name: { pt: "Lingueirão à Bulhão Pato", en: "Razor Clam with Garlic & Coriander", es: "Navaja Bulhão Pato", fr: "Couteau Ail et Coriandre" },
          desc: { pt: "Lingueirão fresco em azeite, alho e coentros. Uma raridade à mesa.", en: "Fresh razor clam in olive oil, garlic and coriander. A rarity on the table.", es: "Navaja fresca en aceite, ajo y cilantro. Una rareza en la mesa.", fr: "Couteau frais à l'huile, ail et coriandre. Une rareté à table." },
          price: "18,50€", photo: null, diet: ["GF","LF"], allergens: [14],
          upsell: ["couvert:5", "especialidades:0"]
        },
        {
          name: { pt: "Picapau de Vitela", en: "Stir-Fried Veal", es: "Picapau de Ternera", fr: "Picapau de Veau" },
          desc: { pt: "Cubos de vitela salteados com pickles e cerveja — petisco de autor.", en: "Diced veal sautéed with pickles and beer — signature snack.", es: "Cubos de ternera salteados con encurtidos y cerveza — aperitivo de autor.", fr: "Cubes de veau aux cornichons et bière — snack signature." },
          price: "12,50€", photo: null, diet: [], allergens: [10,12],
          upsell: ["couvert:7", "carne:2"]
        },
        {
          name: { pt: "Picapau de Atum com Puré de Batata Doce", en: "Stir-Fried Tuna with Sweet Potato Purée", es: "Picapau de Atún con Puré de Batata", fr: "Picapau de Thon et Purée de Patate Douce" },
          desc: { pt: "Atum em cubos salteados com puré de batata doce — fusão atlântica.", en: "Diced tuna sautéed with sweet potato purée — Atlantic fusion.", es: "Atún en cubos con puré de batata — fusión atlántica.", fr: "Thon en dés et purée de patate douce — fusion atlantique." },
          price: "12,50€", photo: null, diet: ["GF","LF"], allergens: [4],
          upsell: ["grelha:0", "sobremesas:0"]
        }
      ]
    },

    /* ── PEIXE ── */
    {
      id: "peixe",
      section: { pt: "Pratos de Peixe", en: "Fish Dishes", es: "Platos de Pescado", fr: "Plats de Poisson" },
      desc: { pt: "Do Atlântico para a sua mesa.", en: "From the Atlantic to your table.", es: "Del Atlántico a su mesa.", fr: "De l'Atlantique à votre table." },
      items: [
        {
          name: { pt: "Pataniscas de Bacalhau c/ Arroz de Tomate", en: "Cod Fritters with Tomato Rice", es: "Pataniscas de Bacalao con Arroz de Tomate", fr: "Beignets de Morue et Riz Tomate" },
          desc: { pt: "As nossas pataniscas com arroz de tomate caseiro.", en: "Our house cod fritters with homemade tomato rice.", es: "Nuestras pataniscas con arroz de tomate casero.", fr: "Nos beignets de morue avec riz à la tomate maison." },
          price: "13,50€", photo: null, diet: [], allergens: [1,3,4],
          upsell: ["petiscos:4", "sobremesas:1"]
        },
        {
          name: { pt: "Filetes de Peixe-Galo c/ Arroz de Tomate", en: "John Dory Fillets with Tomato Rice", es: "Filetes de San Pedro con Arroz de Tomate", fr: "Filets de Saint-Pierre et Riz Tomate" },
          desc: { pt: "Filetes de peixe-galo grelhados com arroz de tomate.", en: "Grilled John Dory fillets with tomato rice.", es: "Filetes de pez de San Pedro a la plancha con arroz de tomate.", fr: "Filets de Saint-Pierre grillés avec riz à la tomate." },
          price: "16,00€", photo: null, diet: [], allergens: [1,3,4],
          upsell: ["couvert:0", "sobremesas:1"]
        },
        {
          name: { pt: "Choco Frito c/ Batata e Salada", en: "Fried Cuttlefish with Potatoes & Salad", es: "Jibia Frita con Patatas y Ensalada", fr: "Seiche Frite, Frites et Salade" },
          desc: { pt: "Choco frito servido com batata frita e salada da casa.", en: "Fried cuttlefish served with fries and house salad.", es: "Jibia frita con patatas fritas y ensalada de la casa.", fr: "Seiche frite avec frites et salade maison." },
          price: "15,00€", photo: null, diet: [], allergens: [1,3,14],
          upsell: ["petiscos:7", "sobremesas:2"]
        },
        {
          name: { pt: "Açorda de Camarão", en: "Shrimp Bread Stew", es: "Açorda de Gambas", fr: "Açorda aux Crevettes" },
          desc: { pt: "Açorda alentejana com camarão fresco — tradição do litoral.", en: "Alentejo bread stew with fresh shrimp — coastal tradition.", es: "Açorda alentejana con gambas frescas — tradición costera.", fr: "Açorda alentejane aux crevettes fraîches — tradition côtière." },
          price: "15,00€", photo: null, diet: [], allergens: [1,2,3], badge: "popular",
          upsell: ["couvert:0", "sobremesas:0"]
        },
        {
          name: { pt: "Bacalhau à Brás", en: "Cod à Brás (Eggs & Potato)", es: "Bacalao à Brás (Huevos y Patata)", fr: "Morue à Brás (Oeufs et Pommes Paille)" },
          desc: { pt: "O clássico bacalhau à Brás com batata palha e ovos mexidos.", en: "The classic cod à Brás with shoestring potatoes and scrambled eggs.", es: "El clásico bacalao à Brás con patata paja y huevos revueltos.", fr: "Le classique morue à Brás aux pommes paille et oeufs brouillés." },
          price: "16,50€", photo: null, diet: [], allergens: [1,3,4],
          upsell: ["couvert:0", "sobremesas:1"]
        },
        {
          name: { pt: "Caril de Gambas", en: "Prawn Curry", es: "Curry de Gambas", fr: "Curry de Crevettes" },
          desc: { pt: "Gambas em molho de caril suave com arroz aromático.", en: "Prawns in mild curry sauce with aromatic rice.", es: "Gambas en salsa de curry suave con arroz aromático.", fr: "Crevettes en sauce curry douce avec riz aromatique." },
          price: "17,50€", photo: null, diet: ["GF","LF"], allergens: [2],
          upsell: ["petiscos:8", "sobremesas:2"]
        },
        {
          name: { pt: "Bacalhau Desfiado à Lagareiro", en: "Shredded Cod Lagareiro Style", es: "Bacalao Desmigado à Lagareiro", fr: "Morue Effilochée à la Lagareiro" },
          desc: { pt: "Bacalhau desfiado no forno com batata a murro e azeite virgem.", en: "Oven-baked shredded cod with smashed potatoes and virgin olive oil.", es: "Bacalao desmigado al horno con patatas a puñetazo y aceite virgen.", fr: "Morue effilochée au four, pommes écrasées et huile vierge." },
          price: "22,00€", photo: null, diet: ["LF"], allergens: [4],
          upsell: ["couvert:3", "sobremesas:2"]
        },
        {
          name: { pt: "Polvo à Lagareiro", en: "Octopus Lagareiro Style", es: "Pulpo à Lagareiro", fr: "Pieuvre à la Lagareiro" },
          desc: { pt: "Polvo assado no forno com batata a murro e azeite — o prato de eleição.", en: "Oven-roasted octopus with smashed potatoes and olive oil — the signature dish.", es: "Pulpo al horno con patatas y aceite — el plato estrella.", fr: "Pieuvre rôtie, pommes écrasées et huile — le plat signature." },
          price: "23,00€", photo: null, diet: ["GF","LF"], allergens: [14], badge: "chef",
          upsell: ["petiscos:5", "sobremesas:1"]
        }
      ]
    },

    /* ── GRELHA ── */
    {
      id: "grelha",
      section: { pt: "Peixe na Grelha", en: "Grilled Fish", es: "Pescado a la Parrilla", fr: "Poisson au Gril" },
      desc: { pt: "Frescos do Atlântico, grelhados no carvão.", en: "Fresh from the Atlantic, charcoal-grilled.", es: "Frescos del Atlántico, a la brasa.", fr: "Frais de l'Atlantique, au charbon de bois." },
      items: [
        {
          name: { pt: "Bife de Atum", en: "Tuna Steak", es: "Filete de Atún", fr: "Pavé de Thon" },
          desc: { pt: "Bife de atum fresco grelhado ao ponto.", en: "Fresh tuna steak grilled to perfection.", es: "Filete de atún fresco a la plancha al punto.", fr: "Pavé de thon frais grillé à la perfection." },
          price: "14,00€", photo: null, diet: ["GF","LF"], allergens: [4],
          upsell: ["petiscos:12", "sobremesas:2"]
        },
        {
          name: { pt: "Posta de Salmão", en: "Salmon Steak", es: "Rodaja de Salmón", fr: "Pavé de Saumon" },
          desc: { pt: "Posta de salmão grelhada com legumes salteados.", en: "Grilled salmon steak with sautéed vegetables.", es: "Rodaja de salmón a la plancha con verduras salteadas.", fr: "Pavé de saumon grillé aux légumes sautés." },
          price: "14,00€", photo: null, diet: ["GF","LF"], allergens: [4],
          upsell: ["couvert:3", "sobremesas:0"]
        },
        {
          name: { pt: "Pregado", en: "Turbot", es: "Rodaballo", fr: "Turbot" },
          desc: { pt: "Pregado fresco grelhado no carvão — ao peso. A nobreza do mar.", en: "Fresh turbot charcoal-grilled — priced by weight. The nobility of the sea.", es: "Rodaballo fresco a la brasa — precio por kilo. La nobleza del mar.", fr: "Turbot frais au charbon — au poids. La noblesse de la mer." },
          price: "55,00€/kg", photo: null, diet: ["GF","LF"], allergens: [4], badge: "chef",
          upsell: ["couvert:0", "sobremesas:1"]
        },
        {
          name: { pt: "Choco Grelhado", en: "Grilled Cuttlefish", es: "Jibia a la Parrilla", fr: "Seiche Grillée" },
          desc: { pt: "Choco inteiro grelhado no carvão — ao peso.", en: "Whole cuttlefish charcoal-grilled — by weight.", es: "Jibia entera a la brasa — al peso.", fr: "Seiche entière au charbon — au poids." },
          price: "55,00€/kg", photo: null, diet: ["GF","LF"], allergens: [14],
          upsell: ["petiscos:7", "sobremesas:2"]
        },
        {
          name: { pt: "Robalo ou Dourada (400–600g)", en: "Sea Bass or Bream (400–600g)", es: "Lubina o Dorada (400–600g)", fr: "Bar ou Daurade (400–600g)" },
          desc: { pt: "Robalo ou dourada fresco grelhado no carvão. 400 a 600g.", en: "Fresh sea bass or bream charcoal-grilled. 400 to 600g.", es: "Lubina o dorada fresca a la brasa. 400 a 600g.", fr: "Bar ou daurade frais au charbon. 400 à 600g." },
          price: "35,00€/kg", photo: null, diet: ["GF","LF"], allergens: [4], badge: "popular",
          upsell: ["couvert:0", "sobremesas:1"]
        },
        {
          name: { pt: "Robalo ou Dourada (+800g)", en: "Sea Bass or Bream (+800g)", es: "Lubina o Dorada (+800g)", fr: "Bar ou Daurade (+800g)" },
          desc: { pt: "Robalo ou dourada grande grelhado. Para partilhar em mesa.", en: "Large sea bass or bream charcoal-grilled. To share at the table.", es: "Lubina o dorada grande a la brasa. Para compartir en la mesa.", fr: "Grand bar ou daurade grillé. À partager à table." },
          price: "50,00€/kg", photo: null, diet: ["GF","LF"], allergens: [4],
          upsell: ["couvert:0", "sobremesas:2"]
        }
      ]
    },

    /* ── TACHO ── */
    {
      id: "tacho",
      section: { pt: "No Tacho", en: "Traditional", es: "En el Puchero", fr: "Au Faitout" },
      desc: { pt: "Tradição à mesa. Alguns para 2 pessoas.", en: "Tradition on the table. Some for 2 people.", es: "Tradición en la mesa. Algunos para 2 personas.", fr: "Tradition à table. Certains pour 2 personnes." },
      items: [
        {
          name: { pt: "Arroz de Polvo c/ Filetes", en: "Octopus Rice with Fillets", es: "Arroz de Pulpo con Filetes", fr: "Riz à la Pieuvre et Filets" },
          desc: { pt: "Arroz malandro de polvo com filetes de peixe branco.", en: "Soupy octopus rice with white fish fillets.", es: "Arroz caldoso de pulpo con filetes de pescado blanco.", fr: "Riz mouillé à la pieuvre et filets de poisson blanc." },
          price: "23,00€", photo: null, diet: ["GF","LF"], allergens: [4,14],
          upsell: ["couvert:0", "sobremesas:1"]
        },
        {
          name: { pt: "Arroz de Berbigão c/ Raia", en: "Cockle Rice with Ray", es: "Arroz de Berberecho con Raya", fr: "Riz aux Coques et Raie" },
          desc: { pt: "Arroz de berbigão com raia tenra — receita de pescador.", en: "Cockle rice with tender ray — fisherman's recipe.", es: "Arroz de berberecho con raya tierna — receta de pescador.", fr: "Riz aux coques et raie tendre — recette de pêcheur." },
          price: "18,00€", photo: null, diet: ["GF","LF"], allergens: [4,14],
          upsell: ["couvert:0", "sobremesas:0"]
        },
        {
          name: { pt: "Arroz de Lingueirão c/ Peixe-Galo", en: "Razor Clam Rice with John Dory", es: "Arroz de Navaja con San Pedro", fr: "Riz Couteau et Saint-Pierre" },
          desc: { pt: "Lingueirão e peixe-galo num arroz aromático da costa.", en: "Razor clam and John Dory in a fragrant coastal rice.", es: "Navaja y pez de San Pedro en un arroz aromático costero.", fr: "Couteau et Saint-Pierre dans un riz parfumé côtier." },
          price: "22,00€", photo: null, diet: ["GF","LF"], allergens: [4,14],
          upsell: ["couvert:0", "sobremesas:2"]
        },
        {
          name: { pt: "Massada de Peixe à Portuguesa (2 pax)", en: "Portuguese Fish Pasta (2 pax)", es: "Fideuà de Pescado à Portuguesa (2 px)", fr: "Pâtes au Poisson Portugaises (2 px)" },
          desc: { pt: "Massa com peixe fresco e marisco em caldo aromático. Para dois.", en: "Pasta with fresh fish and seafood in aromatic broth. For two.", es: "Pasta con pescado fresco y marisco en caldo aromático. Para dos.", fr: "Pâtes au poisson frais et fruits de mer en bouillon. Pour deux." },
          price: "35,00€", photo: null, diet: [], allergens: [1,3,4,14],
          upsell: ["couvert:0", "sobremesas:2"]
        },
        {
          name: { pt: "Ensopada de Raia em Pão Frito (2 pax)", en: "Ray Stew in Fried Bread (2 pax)", es: "Guiso de Raya en Pan Frito (2 px)", fr: "Ragoût de Raie au Pain Frit (2 px)" },
          desc: { pt: "Raia estufada servida sobre pão frito estaladiço. Receita tradicional. Para dois.", en: "Braised ray served over crispy fried bread. Traditional recipe. For two.", es: "Raya guisada sobre pan frito crujiente. Receta tradicional. Para dos.", fr: "Raie braisée sur pain frit croustillant. Recette traditionnelle. Pour deux." },
          price: "35,00€", photo: null, diet: [], allergens: [1,3,4],
          upsell: ["couvert:0", "sobremesas:1"]
        },
        {
          name: { pt: "Arroz de Peixe e Gambas (2 pax)", en: "Fish & Prawn Rice (2 pax)", es: "Arroz de Pescado y Gambas (2 px)", fr: "Riz Poisson et Crevettes (2 px)" },
          desc: { pt: "Arroz malandro com peixe fresco e gambas. Para dois.", en: "Soupy rice with fresh fish and prawns. For two.", es: "Arroz caldoso con pescado fresco y gambas. Para dos.", fr: "Riz mouillé au poisson frais et crevettes. Pour deux." },
          price: "35,00€", photo: null, diet: ["GF","LF"], allergens: [2,4],
          upsell: ["couvert:0", "sobremesas:2"]
        },
        {
          name: { pt: "Arroz de Marisco (2 pax)", en: "Seafood Rice (2 pax)", es: "Arroz de Marisco (2 px)", fr: "Riz aux Fruits de Mer (2 px)" },
          desc: { pt: "O grande arroz de marisco — amêijoas, gambas, mexilhão e lingueirão. Para dois.", en: "The grand seafood rice — clams, prawns, mussels and razor clams. For two.", es: "El gran arroz de marisco — almejas, gambas, mejillones y navajas. Para dos.", fr: "Le grand riz aux fruits de mer — palourdes, crevettes, moules et couteaux. Pour deux." },
          price: "40,00€", photo: null, diet: ["GF","LF"], allergens: [2,14], badge: "popular",
          upsell: ["couvert:5", "sobremesas:2"]
        }
      ]
    },

    /* ── CARNE ── */
    {
      id: "carne",
      section: { pt: "Pratos de Carne", en: "Meat Dishes", es: "Platos de Carne", fr: "Plats de Viande" },
      desc: { pt: "Para os que preferem terra a mar.", en: "For those who prefer land to sea.", es: "Para los que prefieren la tierra al mar.", fr: "Pour ceux qui préfèrent la terre à la mer." },
      items: [
        {
          name: { pt: "Secretos de Porco c/ Batata e Salada", en: "Pork Secreto with Potatoes & Salad", es: "Secreto de Cerdo con Patatas y Ensalada", fr: "Secreto de Porc, Frites et Salade" },
          desc: { pt: "Secretos de porco grelhados com batata frita e salada da casa.", en: "Grilled pork secreto with fries and house salad.", es: "Secreto de cerdo a la plancha con patatas fritas y ensalada.", fr: "Secreto de porc grillé avec frites et salade maison." },
          price: "13,50€", photo: null, diet: ["GF","LF"], allergens: [],
          upsell: ["especialidades:4", "sobremesas:1"]
        },
        {
          name: { pt: "Piano de Porco c/ Batata e Salada", en: "Pork Ribs with Potatoes & Salad", es: "Costillar de Cerdo con Patatas y Ensalada", fr: "Travers de Porc, Frites et Salade" },
          desc: { pt: "Piano de porco grelhado com batata frita e salada.", en: "Grilled pork ribs with fries and salad.", es: "Costillar de cerdo a la plancha con patatas fritas y ensalada.", fr: "Travers de porc grillé avec frites et salade." },
          price: "13,50€", photo: null, diet: ["GF","LF"], allergens: [],
          upsell: ["carne:0", "sobremesas:2"]
        },
        {
          name: { pt: "Bife de Vitela c/ Molho Especial", en: "Veal Steak with Special Sauce", es: "Filete de Ternera con Salsa Especial", fr: "Steak de Veau Sauce Spéciale" },
          desc: { pt: "Bife de vitela grelhado com o nosso molho especial da casa.", en: "Grilled veal steak with our special house sauce.", es: "Filete de ternera a la plancha con nuestra salsa especial de la casa.", fr: "Steak de veau grillé avec notre sauce spéciale maison." },
          price: "15,00€", photo: null, diet: [], allergens: [7,12], badge: "chef",
          upsell: ["couvert:0", "sobremesas:1"]
        },
        {
          name: { pt: "Bife de Frango Grelhado ou Panado", en: "Grilled or Breaded Chicken Steak", es: "Filete de Pollo a la Plancha o Empanado", fr: "Steak de Poulet Grillé ou Pané" },
          desc: { pt: "Peito de frango à escolha — grelhado ou panado — com batata e salada.", en: "Chicken breast — grilled or breaded — with potatoes and salad.", es: "Pechuga de pollo — a la plancha o empanada — con patatas y ensalada.", fr: "Filet de poulet — grillé ou pané — avec pommes de terre et salade." },
          price: "13,50€", photo: null, diet: [], allergens: [1,3],
          upsell: ["couvert:0", "sobremesas:0"]
        }
      ]
    },

    /* ── NO PÃO ── */
    {
      id: "pao-recheado",
      section: { pt: "No Pão", en: "In the Bread", es: "En el Pan", fr: "Dans le Pain" },
      desc: { pt: "Sandes com carácter.", en: "Sandwiches with character.", es: "Bocadillos con carácter.", fr: "Sandwichs avec caractère." },
      items: [
        {
          name: { pt: "Prego no Bolo do Caco", en: "Steak in Bolo do Caco", es: "Prego en Bolo do Caco", fr: "Steak dans le Bolo do Caco" },
          desc: { pt: "Bife de vitela grelhado no tradicional bolo do caco madeirense com manteiga de alho.", en: "Grilled veal steak in traditional Madeiran bolo do caco with garlic butter.", es: "Filete de ternera en el tradicional bolo do caco madeirense con mantequilla de ajo.", fr: "Steak de veau dans le bolo do caco madérien au beurre d'ail." },
          price: "11,00€", photo: null, diet: [], allergens: [1,7],
          upsell: ["couvert:1", "sobremesas:0"]
        },
        {
          name: { pt: "Choco Frito em Baguete Rústica", en: "Crispy Fried Cuttlefish in Rustic Baguette", es: "Jibia Frita en Baguette Rústica", fr: "Seiche Frite en Baguette Rustique" },
          desc: { pt: "Choco frito estaladiço numa baguete rústica. O snack perfeito de marisqueira.", en: "Crispy fried cuttlefish in a rustic baguette. The perfect seafood house snack.", es: "Jibia frita crujiente en baguette rústica. El snack perfecto de marisquería.", fr: "Seiche frite croustillante en baguette rustique. Le snack parfait de marisqueira." },
          price: "11,00€", photo: null, diet: [], allergens: [1,3,14], badge: "popular",
          upsell: ["petiscos:6", "couvert:1"]
        },
        {
          name: { pt: "Hamburguer em Pão Brioche com Queijo e Cebola", en: "Cheeseburger in Brioche Bun", es: "Hamburguesa en Brioche con Queso y Cebolla", fr: "Cheeseburger en Brioche" },
          desc: { pt: "Hamburguer de novilho com queijo fundido e cebola caramelizada em pão brioche.", en: "Beef burger with melted cheese and caramelized onion in brioche bun.", es: "Hamburguesa de ternera con queso fundido y cebolla caramelizada en brioche.", fr: "Hamburger au bœuf, fromage fondu et oignon caramélisé en brioche." },
          price: "12,00€", photo: null, diet: [], allergens: [1,3,7,10],
          upsell: ["couvert:1", "sobremesas:2"]
        },
        {
          name: { pt: "Hamburguer Vegetariano em Pão Brioche com Cogumelos", en: "Veggie Burger in Brioche Bun with Mushrooms", es: "Hamburguesa Vegetariana en Brioche con Champiñones", fr: "Burger Végétarien en Brioche aux Champignons" },
          desc: { pt: "Hamburguer vegetal com cogumelos salteados em pão brioche.", en: "Plant-based burger with sautéed mushrooms in brioche bun.", es: "Hamburguesa vegetal con champiñones salteados en brioche.", fr: "Burger végétal aux champignons sautés en brioche." },
          price: "12,00€", photo: null, diet: ["V"], allergens: [1,3],
          upsell: ["vegetariano:0", "sobremesas:0"]
        }
      ]
    },

    /* ── VEGETARIANO ── */
    {
      id: "vegetariano",
      section: { pt: "Pratos Vegetarianos", en: "Vegetarian", es: "Platos Vegetarianos", fr: "Plats Végétariens" },
      desc: { pt: "Da horta para a mesa.", en: "From the garden to the table.", es: "Del huerto a la mesa.", fr: "Du jardin à la table." },
      items: [
        {
          name: { pt: "Legumes à Brás", en: "Vegetables à Brás", es: "Verduras à Brás", fr: "Légumes à Brás" },
          desc: { pt: "A versão vegetariana do clássico à Brás — legumes salteados com ovos e batata palha.", en: "The vegetarian version of the classic à Brás — sautéed vegetables with eggs and shoestring potatoes.", es: "La versión vegetariana del clásico à Brás — verduras con huevos y patata paja.", fr: "La version végétarienne du classique à Brás — légumes sautés aux oeufs et pommes paille." },
          price: "13,50€", photo: null, diet: ["V"], allergens: [1,3],
          upsell: ["petiscos:0", "sobremesas:0"]
        },
        {
          name: { pt: "Caril de Legumes", en: "Vegetable Curry", es: "Curry de Verduras", fr: "Curry de Légumes" },
          desc: { pt: "Legumes da época em molho de caril com arroz aromático.", en: "Seasonal vegetables in curry sauce with aromatic rice.", es: "Verduras de temporada en salsa de curry con arroz aromático.", fr: "Légumes de saison en sauce curry avec riz aromatique." },
          price: "13,50€", photo: null, diet: ["V","GF","LF"], allergens: [],
          upsell: ["petiscos:1", "sobremesas:2"]
        },
        {
          name: { pt: "Hamburguer Vegan", en: "Vegan Burger", es: "Hamburguesa Vegana", fr: "Burger Vegan" },
          desc: { pt: "Hamburguer 100% vegetal com legumes grelhados.", en: "100% plant-based burger with grilled vegetables.", es: "Hamburguesa 100% vegetal con verduras a la plancha.", fr: "Burger 100% végétal avec légumes grillés." },
          price: "12,00€", photo: null, diet: ["V","VG","LF"], allergens: [1],
          upsell: ["petiscos:0", "sopas:0"]
        }
      ]
    },

    /* ── SOBREMESAS ── */
    {
      id: "sobremesas",
      section: { pt: "Sobremesas", en: "Desserts", es: "Postres", fr: "Desserts" },
      desc: { pt: "Para acabar com charme.", en: "To finish with charm.", es: "Para terminar con estilo.", fr: "Pour finir avec charme." },
      items: [
        {
          name: { pt: "Fruta da Época", en: "Seasonal Fruit", es: "Fruta de Temporada", fr: "Fruit de Saison" },
          desc: { pt: "Fruta fresca da época — o final mais fresco.", en: "Fresh seasonal fruit — the freshest ending.", es: "Fruta fresca de temporada — el final más fresco.", fr: "Fruit frais de saison — la fin la plus fraîche." },
          price: "4,00€", photo: null, diet: ["V","VG","GF","LF"], allergens: [],
          upsell: ["sobremesas:1", "sobremesas:2"]
        },
        {
          name: { pt: "Mousse de Chocolate Caseira", en: "Homemade Chocolate Mousse", es: "Mousse de Chocolate Casera", fr: "Mousse au Chocolat Maison" },
          desc: { pt: "Mousse de chocolate negro feita na casa. Intensa e aveludada.", en: "Dark chocolate mousse made in-house. Intense and velvety.", es: "Mousse de chocolate negro casera. Intensa y aterciopelada.", fr: "Mousse au chocolat noir maison. Intense et veloutée." },
          price: "4,50€", photo: null, diet: ["V","GF"], allergens: [3,7], badge: "popular",
          upsell: ["sobremesas:2", "sobremesas:0"]
        },
        {
          name: { pt: "Cheesecake Caseiro", en: "Homemade Cheesecake", es: "Cheesecake Casero", fr: "Cheesecake Maison" },
          desc: { pt: "Cheesecake cremoso feito na casa. A sobremesa favorita da casa.", en: "Creamy homemade cheesecake. The house favourite dessert.", es: "Cheesecake cremoso casero. El postre favorito de la casa.", fr: "Cheesecake crémeux maison. Le dessert favori de la maison." },
          price: "4,50€", photo: null, diet: ["V"], allergens: [1,3,7], badge: "chef",
          upsell: ["sobremesas:1", "sobremesas:0"]
        }
      ]
    }
  ],


  /* ════════════════════════════════════════════════════════════════════════
     8. MAIS PEDIDOS  ○
     ════════════════════════════════════════════════════════════════════════ */

  mostOrdered: [
    { refId: "especialidades:1", badge: { pt: "Favorito do verão",  en: "Summer favourite",      es: "Favorito del verano", fr: "Favori de l'été"   } },
    { refId: "petiscos:9",       badge: { pt: "Mais pedido à mesa", en: "Most ordered at table", es: "Más pedido en mesa",  fr: "Le plus commandé" } },
    { refId: "tacho:6",          badge: { pt: "Clássico da casa",   en: "House classic",         es: "Clásico de la casa", fr: "Classique maison"  } }
  ],


  /* ════════════════════════════════════════════════════════════════════════
     9. DRINKS  ○  — bebidas da casa
     ════════════════════════════════════════════════════════════════════════ */

  wines: [

    /* ── ÁGUAS ── */
    { name: "Água Sem Gás 33cl",       country: "Portugal", region: "—", type: "agua",        grape: "—",          abv: "0%",    volume: "33cl",  price: "1,80€",  photo: null, desc: "Água natural sem gás." },
    { name: "Água Sem Gás 75cl",       country: "Portugal", region: "—", type: "agua",        grape: "—",          abv: "0%",    volume: "75cl",  price: "3,00€",  photo: null, desc: "Água natural sem gás, garrafa grande." },
    { name: "Água Com Gás 33cl",       country: "Portugal", region: "—", type: "agua",        grape: "—",          abv: "0%",    volume: "33cl",  price: "2,00€",  photo: null, desc: "Água mineral com gás." },

    /* ── REFRIGERANTES ── */
    { name: "Coca-Cola",               country: "EUA",      region: "—", type: "refrigerante", grape: "Coca-Cola",  abv: "0%",   volume: "33cl",  price: "3,50€",  photo: null, desc: "O refrigerante mais famoso do mundo. Fresco e icónico." },
    { name: "Coca-Cola Zero",          country: "EUA",      region: "—", type: "refrigerante", grape: "Coca-Cola",  abv: "0%",   volume: "33cl",  price: "3,50€",  photo: null, desc: "Todo o sabor da Coca-Cola, sem açúcar." },
    { name: "Sumol Laranja",           country: "Portugal", region: "—", type: "refrigerante", grape: "Sumol",      abv: "0%",   volume: "33cl",  price: "3,50€",  photo: null, desc: "O clássico refrigerante português de laranja." },
    { name: "Sumol Ananás",            country: "Portugal", region: "—", type: "refrigerante", grape: "Sumol",      abv: "0%",   volume: "33cl",  price: "3,50€",  photo: null, desc: "Refrigerante português de ananás — verão num copo." },

    /* ── SUMOS ── */
    { name: "Sumo Natural de Laranja", country: "Portugal", region: "—", type: "sumo",         grape: "Natural",    abv: "0%",   volume: "25cl",  price: "4,50€",  photo: null, desc: "Sumo de laranja espremido na hora." },

    /* ── CERVEJAS ── */
    { name: "Super Bock Imperial",     country: "Portugal", region: "Porto",  type: "cerveja",  grape: "Super Bock", abv: "5,2%", volume: "20cl",  price: "2,50€",  photo: null, desc: "A imperial portuguesa por excelência. Fresca e bem servida." },
    { name: "Super Bock Garrafa",      country: "Portugal", region: "Porto",  type: "cerveja",  grape: "Super Bock", abv: "5,2%", volume: "33cl",  price: "3,50€",  photo: null, desc: "Super Bock em garrafa — perfeita com marisco." },
    { name: "Sagres",                  country: "Portugal", region: "Lisboa", type: "cerveja",  grape: "Sagres",     abv: "5%",   volume: "33cl",  price: "3,50€",  photo: null, desc: "Cerveja portuguesa leve e refrescante." },
    { name: "Super Bock Sem Álcool",   country: "Portugal", region: "Porto",  type: "cerveja",  grape: "Super Bock", abv: "0%",   volume: "33cl",  price: "3,00€",  photo: null, desc: "Super Bock sem álcool — todo o sabor, zero álcool." },

    /* ── COCKTAILS ── */
    { name: "Caipirinha",              country: "Brasil",   region: "Cachaça", type: "cocktail", grape: "Cachaça",   abv: "15%",  volume: "25cl",  price: "9,00€",  photo: null, desc: "A clássica caipirinha com cachaça, lima e açúcar. Irresistível à beira-mar." },
    { name: "Mojito",                  country: "Cuba",     region: "Rum",     type: "cocktail", grape: "Rum",       abv: "10%",  volume: "30cl",  price: "9,00€",  photo: null, desc: "Rum branco, hortelã, lima e água com gás — o cocktail do verão." },
    { name: "Sangria Branca",          country: "Portugal", region: "—",       type: "cocktail", grape: "Vinho",     abv: "8%",   volume: "30cl",  price: "7,00€",  photo: null, desc: "Sangria branca com vinho verde, frutas frescas e hortelã. Perfeita partilhada." },

    /* ── VINHOS (com Vivino) ── */
    { name: "Soalheiro Alvarinho",     country: "Portugal", region: "Vinho Verde",   type: "branco",    grape: "Alvarinho",          abv: "12,5%", volume: "750ml", price: "22,00€", photo: null, desc: "Alvarinho premium de Monção. Fresco, mineral — o parceiro ideal do marisco.",    vivinoRating: 3.9, vivinoUrl: "https://www.vivino.com/wines/1146410" },
    { name: "Casal Garcia",            country: "Portugal", region: "Vinho Verde",   type: "verde",     grape: "Loureiro, Trajadura", abv: "9,5%",  volume: "750ml", price: "9,50€",  photo: null, desc: "Verde leve e refrescante. Acessível e ideal com frutos do mar.",                 vivinoRating: 3.4, vivinoUrl: "https://www.vivino.com/wines/1124735" },
    { name: "Mateus Rosé",             country: "Portugal", region: "Douro",         type: "rose",      grape: "Baga, Rufete",        abv: "11%",   volume: "750ml", price: "11,50€", photo: null, desc: "O rosé português mais famoso. Leve e refrescante — o verão numa garrafa.",         vivinoRating: 3.3, vivinoUrl: "https://www.vivino.com/wines/1125513" },
    { name: "Murganheira Bruto",       country: "Portugal", region: "Távora-Varosa", type: "espumante", grape: "Chardonnay, Pinot Noir", abv: "12%", volume: "750ml", price: "18,00€", photo: null, desc: "Espumante nacional com bolha fina. Ideal para abrir uma mesa de mariscos.",      vivinoRating: 3.6, vivinoUrl: "https://www.vivino.com/wines/1140251" }
  ],


  /* ════════════════════════════════════════════════════════════════════════
     10. FEATURES  ○
     ════════════════════════════════════════════════════════════════════════ */

  features: {
    callStaff: true,
  }
};
