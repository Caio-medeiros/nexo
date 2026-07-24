/**
 * NEXO Menu Config — rest-no-manches-lisboa
 * ─────────────────────────────────────────────────────────
 * No Manches · Mexican Street Food · Lisboa
 * ─────────────────────────────────────────────────────────
 * NOTA: o JS de lógica (script.js) é partilhado. Apenas este
 * config.js é específico do venue. Feature nova neste venue:
 * TACOS com variantes ×2 / ×3 (ver secção "tacos" — cada
 * variante é um item próprio com `group` + `variantLabel`,
 * renderizados como um único cartão com toggle).
 */

const CONFIG = {

  /* ════════════════════════════════════════════════════════════════════════
     1. IDENTIDADE  ★
     ════════════════════════════════════════════════════════════════════════ */

  slug:  "rest-no-manches-lisboa",
  name:  "No Manches",
  city:  "Lisboa, Portugal",

  ga4MeasurementId: "",

  callStaffTopic: 'rest-nexo-no-manches',

  /* ── PEDIDO ASSISTIDO ─────────────────────────────────────────
     'assisted' → o pedido do cliente fica em espera ('awaiting_staff')
     até um membro do staff confirmar no portal. undefined/'direct' →
     comportamento clássico (ronda disparada directamente p/ cozinha). */
  VENUE_TYPE: 'assisted',
  NTFY_TOPIC: 'nexo-no-manches',

  ASSISTED_CTA:           'Estou pronto — chamar staff',
  ASSISTED_MSG_WAITING:   'O staff está a caminho 🙌',
  ASSISTED_MSG_REVIEWING: 'A verificar o seu pedido 📋',
  ASSISTED_MSG_ALMOST:    'Quase pronto! 🌮',
  ASSISTED_MSG_CONFIRMED: 'Pedido confirmado! A preparar... 🍽️',
  ASSISTED_MSG_CANCELLED: 'Pedido cancelado. Chama um membro do staff.',

  /* Supabase — partilhado com a Marisca (mesmo projeto menus+portal) */
  supabaseUrl: 'https://kgbrtbpeekhkroibsgqq.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYnJ0YnBlZWtoa3JvaWJzZ3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDAwMTMsImV4cCI6MjA5NjYxNjAxM30.vFvSLysnS3456WWKa2a659YuIVuOceYHG4NMd79Jerc',

  tagline: {
    pt: "Mexican Street Food",
    en: "Mexican Street Food",
    es: "Mexican Street Food",
    fr: "Mexican Street Food"
  },

  heroStamp: {
    pt: "@no.manches.mexican.street.food",
    en: "@no.manches.mexican.street.food",
    es: "@no.manches.mexican.street.food",
    fr: "@no.manches.mexican.street.food"
  },


  /* ════════════════════════════════════════════════════════════════════════
     2. VISUAL  ★  — tema dourado/mostarda; hero escuro via nexo-nomanches.css
     ════════════════════════════════════════════════════════════════════════ */

  brandColor:     "#C8952A",   // dourado mostarda (headers do menu físico)
  brandColorDark: "#A67820",
  accentColor:    "#D64C2B",   // vermelho mexicano / terra cota (lido pelo override CSS)
  heroImageUrl:   null,        // hero escuro sólido (#1A1A1A) — sem foto
  logoUrl:        "./img/logo-mark.webp",


  /* ════════════════════════════════════════════════════════════════════════
     3. CONTACTOS  ★
     ════════════════════════════════════════════════════════════════════════ */

  address:      "Lisboa, Portugal",
  phone:        "",
  phoneDisplay: "",

  hours: {
    pt: "Seg–Dom · 12h–24h",
    en: "Mon–Sun · 12pm–12am",
    es: "Lun–Dom · 12h–24h",
    fr: "Lun–Dim · 12h–24h"
  },
  hoursToday: {
    pt: "Aberto agora", en: "Open now",
    es: "Abierto ahora", fr: "Ouvert maintenant"
  },
  // Horário estruturado p/ calcular "Aberto agora / Fechado" no banner.
  // No Manches: todos os dias 12:00–24:00 (24:00 = meia-noite).
  openSchedule: {
    everyday: [["12:00", "24:00"]]
  },


  /* ════════════════════════════════════════════════════════════════════════
     4. REDES & REVIEWS  (vazios na demo)
     ════════════════════════════════════════════════════════════════════════ */

  // Abre directamente a caixa "Escrever crítica" do Google (place ID real
  // do No Manches — Mexican Street Food, Rua de Cantabria 42, Carcavelos)
  googleReviewUrl:  "https://search.google.com/local/writereview?placeid=ChIJgaAlnT7JHg0RubIqzsLvDiA",
  googleRating:     5,
  googleReviewCount:"155",
  priceRange:       "10–15 €",
  theForkReviewUrl: null,   // só Google — sem TheFork
  // Críticas privadas (≤3 estrelas) vão para este WhatsApp, não para o Google
  reviewWhatsappNumber: "351918690783",
  instagramHandle:  "no.manches.mexican.street.food",
  whatsappNumber:   "",
  whatsappLoyaltyMessage: {
    pt: "Olá! Gostaria de contactar o No Manches.",
    en: "Hello! I would like to contact No Manches.",
    es: "¡Hola! Me gustaría contactar con No Manches.",
    fr: "Bonjour! Je souhaite contacter No Manches."
  },

  orderWhatsapp: '',           // demo — sem WhatsApp
  tableInputEnabled: true,


  /* ════════════════════════════════════════════════════════════════════════
     5. WI-FI  ○
     ════════════════════════════════════════════════════════════════════════ */

  wifiSsid:     "NoManches_Guest",
  wifiPassword: "arriba2025",


  /* ════════════════════════════════════════════════════════════════════════
     6. HAPPY HOUR — banner + countdown ao vivo (16h–18h, todos os dias)
        A 1ª janela (16–18) tem countdown; a 2ª (0–24) é o aviso fora de horas.
        getActiveBanner() devolve a 1ª que coincide → durante 16–18 ganha o
        happy hour; fora disso ganha o aviso.
     ════════════════════════════════════════════════════════════════════════ */

  timeBanners: [
    {
      id: "happy-hour", startH: 16, endH: 18, countdown: true,
      days: [0,1,2,3,4,5,6],
      ghost:    { pt: "Happy Hour", en: "Happy Hour", es: "Happy Hour", fr: "Happy Hour" },
      label:    { pt: "Happy Hour", en: "Happy Hour", es: "Happy Hour", fr: "Happy Hour" },
      headline: { pt: "🎉 Happy Hour", en: "🎉 Happy Hour", es: "🎉 Happy Hour", fr: "🎉 Happy Hour" },
      text: {
        pt: "Bebidas 2×1 na compra de totopos ou quesadillas",
        en: "2-for-1 drinks with any totopos or quesadillas",
        es: "Bebidas 2×1 con la compra de totopos o quesadillas",
        fr: "Boissons 2 pour 1 avec des totopos ou quesadillas"
      }
    },
    {
      id: "happy-hour-info", startH: 0, endH: 24,
      days: [0,1,2,3,4,5,6],
      ghost:    { pt: "Happy Hour", en: "Happy Hour", es: "Happy Hour", fr: "Happy Hour" },
      label:    { pt: "Todos os dias", en: "Every day", es: "Todos los días", fr: "Tous les jours" },
      headline: { pt: "Happy Hour das 16h–18h 🌮", en: "Happy Hour 4pm–6pm 🌮", es: "Happy Hour de 16h a 18h 🌮", fr: "Happy Hour de 16h à 18h 🌮" },
      text: {
        pt: "Bebidas 2×1 na compra de totopos ou quesadillas",
        en: "2-for-1 drinks with any totopos or quesadillas",
        es: "Bebidas 2×1 con la compra de totopos o quesadillas",
        fr: "Boissons 2 pour 1 avec des totopos ou quesadillas"
      }
    }
  ],


  /* ════════════════════════════════════════════════════════════════════════
     7. MENU  ★  (comida — bebidas ficam no separador Drinks / wines[])
     ════════════════════════════════════════════════════════════════════════ */

  menu: [

    /* ── ANTOJITOS ── */
    {
      id: "antojitos",
      section: { pt: "Antojitos", en: "Antojitos", es: "Antojitos", fr: "Antojitos" },
      desc: { pt: "Para abrir o apetite à mexicana.", en: "Mexican-style openers.", es: "Para abrir boca al estilo mexicano.", fr: "Pour ouvrir l'appétit à la mexicaine." },
      items: [
        {
          name: { pt: "Poke Mexicano", en: "Mexican Poke", es: "Poke Mexicano", fr: "Poke Mexicain" },
          desc: {
            pt: '"Burrito desnudo": base de arroz, o nosso feijão preto, abacate, pico de gallo, proteína e salsa à escolha. Aconselhamos com carne de birria ou camarão. (Também em versão burrito em tortilha de trigo.)',
            en: '"Naked burrito": rice base, our black beans, avocado, pico de gallo, your choice of protein and salsa. We recommend it with birria beef or shrimp. (Also as a wheat-tortilla burrito.)',
            es: '"Burrito desnudo": base de arroz, nuestros frijoles negros, aguacate, pico de gallo, proteína y salsa a elegir. Lo recomendamos con carne de birria o camarón. (También en versión burrito en tortilla de trigo.)',
            fr: '"Burrito nu" : base de riz, nos haricots noirs, avocat, pico de gallo, protéine et salsa au choix. Nous le conseillons avec bœuf birria ou crevettes. (Aussi en burrito dans une tortilla de blé.)'
          },
          price: "8,00€", photo: null, diet: ["GF"], allergens: [], badge: "popular",
          upsell: ["bebidas:1", "sobremesa:2"]
        },
        {
          name: { pt: "Birria Ramen Ramón", en: "Birria Ramen Ramón", es: "Birria Ramen Ramón", fr: "Birria Ramen Ramón" },
          desc: {
            pt: "O nosso prato de fusão: o delicioso consomé junta-se a uns noodles gulosos com coentro, cebola fresca e pedaços da nossa carne Birria.",
            en: "Our fusion dish: rich consommé meets indulgent noodles with coriander, fresh onion and pieces of our Birria beef.",
            es: "Nuestro plato de fusión: el delicioso consomé se une a unos noodles golosos con cilantro, cebolla fresca y trozos de nuestra carne Birria.",
            fr: "Notre plat fusion : un consommé délicieux rencontre des nouilles gourmandes avec coriandre, oignon frais et morceaux de notre viande Birria."
          },
          price: "7,50€", photo: null, diet: [], allergens: [1,3], badge: "chef",
          upsell: ["bebidas:15", "sobremesa:2"]
        },
        {
          name: { pt: "Ceviche de Polvo", en: "Octopus Ceviche", es: "Ceviche de Pulpo", fr: "Ceviche de Poulpe" },
          desc: {
            pt: "Polvo estilo ceviche com pico de gallo, guacamole, manga e porção de nachos.",
            en: "Ceviche-style octopus with pico de gallo, guacamole, mango and a portion of nachos.",
            es: "Pulpo estilo ceviche con pico de gallo, guacamole, mango y una porción de nachos.",
            fr: "Poulpe façon ceviche avec pico de gallo, guacamole, mangue et une portion de nachos."
          },
          price: "10,00€", photo: null, diet: ["GF"], allergens: [14],
          upsell: ["totopos:0", "bebidas:17", "sobremesa:2"]
        }
      ]
    },

    /* ── TOTOPOS ── */
    {
      id: "totopos",
      section: { pt: "Totopos", en: "Totopos", es: "Totopos", fr: "Totopos" },
      desc: { pt: "Nachos da casa, para partilhar.", en: "House nachos, made for sharing.", es: "Nachos de la casa, para compartir.", fr: "Nachos maison, à partager." },
      items: [
        {
          name: { pt: "Totopos Guacamole", en: "Guacamole Totopos", es: "Totopos Guacamole", fr: "Totopos Guacamole" },
          desc: {
            pt: "Nachos com guacamole e pico de gallo, ou com feijão.",
            en: "Nachos with guacamole and pico de gallo, or with beans.",
            es: "Nachos con guacamole y pico de gallo, o con frijoles.",
            fr: "Nachos avec guacamole et pico de gallo, ou avec haricots."
          },
          price: "6,50€", photo: null, diet: ["V","GF"], allergens: [],
          upsell: ["totopos:1", "tacos:0"]
        },
        {
          name: { pt: "Totopos Completos", en: "Loaded Totopos", es: "Totopos Completos", fr: "Totopos Complets" },
          desc: {
            pt: "Nachos com guacamole, pico de gallo, feijão e queijo fundido.",
            en: "Nachos with guacamole, pico de gallo, beans and melted cheese.",
            es: "Nachos con guacamole, pico de gallo, frijoles y queso fundido.",
            fr: "Nachos avec guacamole, pico de gallo, haricots et fromage fondu."
          },
          price: "8,50€", photo: null, diet: ["V","GF"], allergens: [7],
          upsell: ["totopos:2", "tacos:0"]
        },
        {
          name: { pt: "Totopos Hiper-Completos", en: "Fully Loaded Totopos", es: "Totopos Hiper-Completos", fr: "Totopos Hyper-Complets" },
          desc: {
            pt: "Nachos com guacamole, pico de gallo, feijão, queijo fundido e uma proteína.",
            en: "Nachos with guacamole, pico de gallo, beans, melted cheese and a protein.",
            es: "Nachos con guacamole, pico de gallo, frijoles, queso fundido y una proteína.",
            fr: "Nachos avec guacamole, pico de gallo, haricots, fromage fondu et une protéine."
          },
          price: "11,00€", photo: null, diet: ["GF"], allergens: [7], badge: "popular",
          upsell: ["tacos:0", "sobremesa:0"]
        }
      ]
    },

    /* ── QUESADILLAS ── */
    {
      id: "quesadillas",
      section: { pt: "Quesadillas", en: "Quesadillas", es: "Quesadillas", fr: "Quesadillas" },
      desc: { pt: "Tortilhas quentes, recheadas e douradas.", en: "Warm tortillas, stuffed and golden.", es: "Tortillas calientes, rellenas y doradas.", fr: "Tortillas chaudes, garnies et dorées." },
      items: [
        {
          name: { pt: "4 Quesadillas de Milho", en: "4 Corn Quesadillas", es: "4 Quesadillas de Maíz", fr: "4 Quesadillas de Maïs" },
          desc: {
            pt: "Tortilha de milho azul de 13cm. Podem ser simples, c/ jalapeños, abacate ou feijão.",
            en: "13cm blue-corn tortilla. Plain, or with jalapeños, avocado or beans.",
            es: "Tortilla de maíz azul de 13cm. Simples, o con jalapeños, aguacate o frijoles.",
            fr: "Tortilla de maïs bleu de 13cm. Nature, ou avec jalapeños, avocat ou haricots."
          },
          price: "5,50€", photo: null, diet: ["V"], allergens: [7],
          upsell: ["quesadillas:2", "totopos:0"]
        },
        {
          name: { pt: 'Quesadilla de Trigo "Feijão"', en: 'Wheat Quesadilla "Beans"', es: 'Quesadilla de Trigo "Frijol"', fr: 'Quesadilla de Blé "Haricots"' },
          desc: {
            pt: "Tortilha de trigo de 25cm c/ feijão e pico de gallo.",
            en: "25cm wheat tortilla with beans and pico de gallo.",
            es: "Tortilla de trigo de 25cm con frijoles y pico de gallo.",
            fr: "Tortilla de blé de 25cm avec haricots et pico de gallo."
          },
          price: "6,00€", photo: null, diet: ["V"], allergens: [1,7],
          upsell: ["totopos:0", "bebidas:0", "sobremesa:2"]
        },
        {
          name: { pt: "Quesadilla Gringa Pastor", en: "Gringa Pastor Quesadilla", es: "Quesadilla Gringa Pastor", fr: "Quesadilla Gringa Pastor" },
          desc: {
            pt: "Tortilha de trigo de 25cm recheada com carne al pastor.",
            en: "25cm wheat tortilla stuffed with al pastor pork.",
            es: "Tortilla de trigo de 25cm rellena de carne al pastor.",
            fr: "Tortilla de blé de 25cm garnie de porc al pastor."
          },
          price: "8,00€", photo: null, diet: [], allergens: [1,7],
          upsell: ["bebidas:6", "sobremesa:2"]
        },
        {
          name: { pt: "Quesadilla de Camarão", en: "Shrimp Quesadilla", es: "Quesadilla de Camarón", fr: "Quesadilla de Crevettes" },
          desc: {
            pt: "Tortilha de trigo de 25cm recheada com camarão grelhado, pico de gallo, couve e maionese fumada da casa.",
            en: "25cm wheat tortilla with grilled shrimp, pico de gallo, cabbage and our house smoked mayo.",
            es: "Tortilla de trigo de 25cm con camarón a la plancha, pico de gallo, col y mayonesa ahumada de la casa.",
            fr: "Tortilla de blé de 25cm avec crevettes grillées, pico de gallo, chou et mayonnaise fumée maison."
          },
          price: "8,50€", photo: null, diet: [], allergens: [1,2,3,7], badge: "chef",
          upsell: ["antojitos:2", "bebidas:14", "sobremesa:2"]
        }
      ]
    },

    /* ── TACOS ── (feature: variantes ×2 / ×3 — cada variante é 1 item com `group`) */
    {
      id: "tacos",
      section: { pt: "Tacos", en: "Tacos", es: "Tacos", fr: "Tacos" },
      desc: { pt: "Tortilha de milho, dobrada à mão.", en: "Corn tortilla, folded by hand.", es: "Tortilla de maíz, doblada a mano.", fr: "Tortilla de maïs, pliée à la main." },
      note: { pt: "+€1,50 para queijo gratinado", en: "+€1.50 for gratinated cheese", es: "+€1,50 por queso gratinado", fr: "+€1,50 pour fromage gratiné" },
      items: [
        /* Al Pastor */
        {
          group: "taco-al-pastor", variantLabel: "×2",
          baseName: { pt: "Taco Al Pastor", en: "Al Pastor Taco", es: "Taco Al Pastor", fr: "Taco Al Pastor" },
          name: { pt: "Taco Al Pastor ×2", en: "Al Pastor Taco ×2", es: "Taco Al Pastor ×2", fr: "Taco Al Pastor ×2" },
          desc: {
            pt: "Carne de porco marinada em especiarias tipicamente mexicanas, grelhada e suculenta, com ananás, cebola picada e coentros.",
            en: "Pork marinated in traditional Mexican spices, grilled and juicy, with pineapple, chopped onion and coriander.",
            es: "Carne de cerdo marinada en especias típicamente mexicanas, a la parrilla y jugosa, con piña, cebolla picada y cilantro.",
            fr: "Porc mariné aux épices typiquement mexicaines, grillé et juteux, avec ananas, oignon haché et coriandre."
          },
          price: "7,90€", photo: null, diet: ["GF"], allergens: [], badge: "popular",
          upsell: ["totopos:1", "bebidas:3", "sobremesa:2"]
        },
        {
          group: "taco-al-pastor", variantLabel: "×3",
          baseName: { pt: "Taco Al Pastor", en: "Al Pastor Taco", es: "Taco Al Pastor", fr: "Taco Al Pastor" },
          name: { pt: "Taco Al Pastor ×3", en: "Al Pastor Taco ×3", es: "Taco Al Pastor ×3", fr: "Taco Al Pastor ×3" },
          price: "9,90€", photo: null, diet: ["GF"], allergens: [],
          upsell: ["totopos:1", "bebidas:3", "sobremesa:2"]
        },
        /* Birria */
        {
          group: "taco-birria", variantLabel: "×2",
          baseName: { pt: "Taco de Birria", en: "Birria Taco", es: "Taco de Birria", fr: "Taco de Birria" },
          name: { pt: "Taco de Birria ×2", en: "Birria Taco ×2", es: "Taco de Birria ×2", fr: "Taco de Birria ×2" },
          desc: {
            pt: "Carne de vaca cozinhada lentamente e desfiada, com o delicioso caldo, cebola picada e coentros. Molha o taco no caldo antes de comer — experiência 5 estrelas.",
            en: "Slow-cooked shredded beef with its rich broth, chopped onion and coriander. Dip the taco in the broth before eating — a 5-star experience.",
            es: "Carne de res cocida lentamente y deshebrada, con su delicioso caldo, cebolla picada y cilantro. Moja el taco en el caldo antes de comer — experiencia 5 estrellas.",
            fr: "Bœuf mijoté et effiloché, avec son délicieux bouillon, oignon haché et coriandre. Trempez le taco dans le bouillon avant de déguster — expérience 5 étoiles."
          },
          price: "7,90€", photo: null, diet: ["GF"], allergens: [], badge: "chef",
          upsell: ["bebidas:2", "sobremesa:2"]
        },
        {
          group: "taco-birria", variantLabel: "×3",
          baseName: { pt: "Taco de Birria", en: "Birria Taco", es: "Taco de Birria", fr: "Taco de Birria" },
          name: { pt: "Taco de Birria ×3", en: "Birria Taco ×3", es: "Taco de Birria ×3", fr: "Taco de Birria ×3" },
          price: "9,90€", photo: null, diet: ["GF"], allergens: [],
          upsell: ["bebidas:2", "sobremesa:2"]
        },
        /* Al Pastor Vegan */
        {
          group: "taco-al-pastor-vegan", variantLabel: "×2",
          baseName: { pt: "Taco Al Pastor Vegan", en: "Vegan Al Pastor Taco", es: "Taco Al Pastor Vegano", fr: "Taco Al Pastor Vegan" },
          name: { pt: "Taco Al Pastor Vegan ×2", en: "Vegan Al Pastor Taco ×2", es: "Taco Al Pastor Vegano ×2", fr: "Taco Al Pastor Vegan ×2" },
          desc: {
            pt: "Pedaços de soja marinados em especiarias tipicamente mexicanas, grelhados e suculentos, com ananás, cebola picada e coentros. Toda a tradição sem culpa.",
            en: "Soy pieces marinated in traditional Mexican spices, grilled and juicy, with pineapple, chopped onion and coriander. All the tradition, none of the guilt.",
            es: "Trozos de soja marinados en especias típicamente mexicanas, a la parrilla y jugosos, con piña, cebolla picada y cilantro. Toda la tradición sin culpa.",
            fr: "Morceaux de soja marinés aux épices typiquement mexicaines, grillés et juteux, avec ananas, oignon haché et coriandre. Toute la tradition sans culpabilité."
          },
          price: "7,50€", photo: null, diet: ["V","VG"], allergens: [6],
          upsell: ["totopos:0", "quesadillas:0", "bebidas:18", "sobremesa:2"]
        },
        {
          group: "taco-al-pastor-vegan", variantLabel: "×3",
          baseName: { pt: "Taco Al Pastor Vegan", en: "Vegan Al Pastor Taco", es: "Taco Al Pastor Vegano", fr: "Taco Al Pastor Vegan" },
          name: { pt: "Taco Al Pastor Vegan ×3", en: "Vegan Al Pastor Taco ×3", es: "Taco Al Pastor Vegano ×3", fr: "Taco Al Pastor Vegan ×3" },
          price: "8,90€", photo: null, diet: ["V","VG"], allergens: [6],
          upsell: ["totopos:0", "quesadillas:0", "bebidas:18", "sobremesa:2"]
        },
        /* Cogumelo Panado */
        {
          group: "taco-cogumelo", variantLabel: "×2",
          baseName: { pt: "Taco de Cogumelo Panado", en: "Breaded Mushroom Taco", es: "Taco de Champiñón Empanado", fr: "Taco de Champignon Pané" },
          name: { pt: "Taco de Cogumelo Panado ×2", en: "Breaded Mushroom Taco ×2", es: "Taco de Champiñón Empanado ×2", fr: "Taco de Champignon Pané ×2" },
          desc: {
            pt: "Cogumelo marinado, panado e frito até ficar crocante, com maionese cremosa de alho, couve branca e pico de gallo.",
            en: "Marinated mushroom, breaded and fried until crispy, with creamy garlic mayo, white cabbage and pico de gallo.",
            es: "Champiñón marinado, empanado y frito hasta quedar crujiente, con mayonesa cremosa de ajo, col blanca y pico de gallo.",
            fr: "Champignon mariné, pané et frit jusqu'à être croustillant, avec mayonnaise crémeuse à l'ail, chou blanc et pico de gallo."
          },
          price: "7,50€", photo: null, diet: ["V"], allergens: [1,3], badge: "popular",
          upsell: ["totopos:1", "bebidas:5", "bebidas:16", "sobremesa:2"]
        },
        {
          group: "taco-cogumelo", variantLabel: "×3",
          baseName: { pt: "Taco de Cogumelo Panado", en: "Breaded Mushroom Taco", es: "Taco de Champiñón Empanado", fr: "Taco de Champignon Pané" },
          name: { pt: "Taco de Cogumelo Panado ×3", en: "Breaded Mushroom Taco ×3", es: "Taco de Champiñón Empanado ×3", fr: "Taco de Champignon Pané ×3" },
          price: "8,90€", photo: null, diet: ["V"], allergens: [1,3],
          upsell: ["totopos:1", "bebidas:5", "bebidas:16", "sobremesa:2"]
        },
        /* Camarão */
        {
          group: "taco-camarao", variantLabel: "×2",
          baseName: { pt: "Taco de Camarão", en: "Shrimp Taco", es: "Taco de Camarón", fr: "Taco de Crevettes" },
          name: { pt: "Taco de Camarão ×2", en: "Shrimp Taco ×2", es: "Taco de Camarón ×2", fr: "Taco de Crevettes ×2" },
          desc: {
            pt: "Camarão grelhado, com mix de couve picada e uma cremosa maionese fumada da casa.",
            en: "Grilled shrimp with a mix of chopped cabbage and our creamy house smoked mayo.",
            es: "Camarón a la plancha, con mix de col picada y una cremosa mayonesa ahumada de la casa.",
            fr: "Crevettes grillées, avec un mélange de chou haché et une mayonnaise fumée crémeuse maison."
          },
          price: "7,90€", photo: null, diet: [], allergens: [2,3],
          upsell: ["quesadillas:0", "bebidas:4", "sobremesa:2"]
        },
        {
          group: "taco-camarao", variantLabel: "×3",
          baseName: { pt: "Taco de Camarão", en: "Shrimp Taco", es: "Taco de Camarón", fr: "Taco de Crevettes" },
          name: { pt: "Taco de Camarão ×3", en: "Shrimp Taco ×3", es: "Taco de Camarón ×3", fr: "Taco de Crevettes ×3" },
          price: "9,90€", photo: null, diet: [], allergens: [2,3],
          upsell: ["quesadillas:0", "bebidas:4", "sobremesa:2"]
        },

        /* ── ADICIONAL (escondido do menu; entra no pedido/cozinha como linha
              própria via prompt "queres juntar?" ao adicionar um taco) ── */
        {
          isExtra: true, _hidden: true,
          name: { pt: "+ Queijo Gratinado", en: "+ Gratinated Cheese", es: "+ Queso Gratinado", fr: "+ Fromage Gratiné" },
          desc: { pt: "Adicional para tacos.", en: "Add-on for tacos.", es: "Adicional para tacos.", fr: "Supplément pour tacos." },
          price: "1,50€", photo: null, diet: [], allergens: [7]
        }
      ],

      /* Prompt do adicional — aparece ao juntar qualquer taco ao pedido */
      extraOffer: {
        question: {
          pt: "Queres juntar queijo gratinado?",
          en: "Add gratinated cheese?",
          es: "¿Quieres añadir queso gratinado?",
          fr: "Ajouter du fromage gratiné ?"
        },
        yes: { pt: "Sim, juntar", en: "Yes, add it", es: "Sí, añadir", fr: "Oui, ajouter" },
        no:  { pt: "Não, obrigado", en: "No, thanks", es: "No, gracias", fr: "Non, merci" }
      }
    },

    /* ── SOBREMESA ── */
    {
      id: "sobremesa",
      section: { pt: "Sobremesa", en: "Dessert", es: "Postre", fr: "Dessert" },
      desc: { pt: "Doce final à mexicana.", en: "A sweet Mexican finish.", es: "Un final dulce a la mexicana.", fr: "Une fin sucrée à la mexicaine." },
      items: [
        {
          name: { pt: "Churros", en: "Churros", es: "Churros", fr: "Churros" },
          desc: {
            pt: "Com doce de leite salgado, canela e açúcar.",
            en: "With salted dulce de leche, cinnamon and sugar.",
            es: "Con dulce de leche salado, canela y azúcar.",
            fr: "Avec dulce de leche salé, cannelle et sucre."
          },
          price: "3,50€", photo: null, diet: ["V"], allergens: [1,7], badge: "popular",
          upsell: ["sobremesa:2", "sobremesa:3"]
        },
        {
          name: { pt: "Bolo do Dia", en: "Cake of the Day", es: "Pastel del Día", fr: "Gâteau du Jour" },
          desc: { pt: "", en: "", es: "", fr: "" },
          price: "3,50€", photo: null, diet: ["V"], allergens: [1,3,7],
          upsell: ["sobremesa:0", "sobremesa:2"]
        },
        {
          name: { pt: "Chamoyada", en: "Chamoyada", es: "Chamoyada", fr: "Chamoyada" },
          desc: {
            pt: 'A sobremesa perfeita para dias quentes: granizado de manga para comer à colher, com lima e molho chamoy.',
            en: 'The perfect hot-day dessert: mango shaved ice to eat with a spoon, with lime and chamoy sauce.',
            es: 'El postre perfecto para días calurosos: granizado de mango para comer a cucharadas, con lima y salsa chamoy.',
            fr: 'Le dessert parfait pour les jours chauds : granité de mangue à la cuillère, avec citron vert et sauce chamoy.'
          },
          price: "5,50€", photo: null, diet: ["V","GF"], allergens: [], badge: "chef",
          upsell: ["sobremesa:3", "sobremesa:0"]
        },
        {
          name: { pt: "Brownie c/ Twist", en: "Brownie with a Twist", es: "Brownie con Twist", fr: "Brownie Twist" },
          desc: { pt: "Com calda chamoy.", en: "With chamoy sauce.", es: "Con salsa chamoy.", fr: "Avec sauce chamoy." },
          price: "4,00€", photo: null, diet: ["V"], allergens: [1,3,7],
          upsell: ["sobremesa:0", "sobremesa:2"]
        }
      ]
    }
  ],


  /* ════════════════════════════════════════════════════════════════════════
     8. AVISOS DO MENU  ○  — renderizados no fim do menu (info, não pedíveis)
     ════════════════════════════════════════════════════════════════════════ */

  menuDoDia: {
    label:     { pt: "Menu do Dia", en: "Menu of the Day", es: "Menú del Día", fr: "Menu du Jour" },
    price:     "+€4,00",
    desc: {
      pt: "Completa o teu prato com uma porção pequena de totopos, refrigerante/limonada/água e café.",
      en: "Complete your dish with a small portion of totopos, a soft drink/lemonade/water and a coffee.",
      es: "Completa tu plato con una porción pequeña de totopos, refresco/limonada/agua y café.",
      fr: "Complétez votre plat avec une petite portion de totopos, une boisson/limonade/eau et un café."
    }
  },

  allergenNotice: {
    pt: "*Alguns pratos contêm amendoim.",
    en: "*Some dishes contain peanuts.",
    es: "*Algunos platos contienen cacahuete.",
    fr: "*Certains plats contiennent des arachides."
  },


  /* ════════════════════════════════════════════════════════════════════════
     9. MAIS PEDIDOS  ○
     ════════════════════════════════════════════════════════════════════════ */

  mostOrdered: [
    { refId: "quesadillas:3", badge: { pt: "A mais pedida",          en: "Most ordered",         es: "La más pedida",          fr: "La plus commandée"   } },
    { refId: "totopos:2",     badge: { pt: "Para partilhar",         en: "Made for sharing",     es: "Para compartir",         fr: "À partager"          } },
    { refId: "tacos:2",       badge: { pt: "Experiência 5 estrelas", en: "5-star experience",    es: "Experiencia 5 estrellas", fr: "Expérience 5 étoiles" } },
    { refId: "tacos:6",       badge: { pt: "Favorito veggie",        en: "Veggie favourite",     es: "Favorito veggie",        fr: "Favori veggie"       } }
  ],


  /* ════════════════════════════════════════════════════════════════════════
     10. DRINKS  ○  — separador "Drinks" (wines[]). Fiesta Fuel (com álcool)
         + Bebidas com Pinta (sem álcool). `type` alimenta o filtro por tipo;
         `grape` alimenta o filtro "Marca" (base/espírito).
     ════════════════════════════════════════════════════════════════════════ */

  wines: [

    /* ── FIESTA FUEL · com álcool ── */
    { name: "Margarita",                         country: "México",   region: "Tequila",  type: "margarita", grape: "Tequila",   abv: "13%",  volume: "25cl", price: "6,50€",  photo: "./img/bebidas/margarita.webp", desc: "Clássica, spicy, manga ou maracujá." },
    { name: "Mezcal Margarita",                  country: "México",   region: "Mezcal",   type: "margarita", grape: "Mezcal",    abv: "13%",  volume: "25cl", price: "7,00€",  photo: "./img/bebidas/mezcal-margarita.svg", desc: "Clássica, spicy, manga ou maracujá — com o toque fumado do mezcal." },
    { name: "Vodka Sour Tamarindo",              country: "México",   region: "—",        type: "cocktail",  grape: "Vodka",     abv: "12%",  volume: "25cl", price: "6,00€",  photo: "./img/bebidas/cocktail-mano.webp", desc: "Vodka, tamarindo e um final ácido irresistível." },
    { name: "Charro Negro",                      country: "México",   region: "—",        type: "cocktail",  grape: "Tequila",   abv: "10%",  volume: "30cl", price: "5,00€",  photo: "./img/bebidas/coca-negra.webp", desc: "Coca-Cola com sumo de lima, tequila ou vodka." },
    { name: "Corona Chrus",                      country: "México",   region: "—",        type: "cocktail",  grape: "Tequila",   abv: "8%",   volume: "33cl", price: "5,50€",  photo: "./img/bebidas/corona-chrus.svg", desc: "Calipo de lima-limão, coronita, tequila e gelo picado." },
    { name: "Merengue",                          country: "México",   region: "—",        type: "cocktail",  grape: "Cerveja",   abv: "4%",   volume: "33cl", price: "3,00€",  photo: "./img/bebidas/merengue.svg", desc: "Sprite, groselha e cerveja Corona." },
    { name: "Cerveja Coronita",                  country: "México",   region: "—",        type: "cerveja",   grape: "Corona",    abv: "4,5%", volume: "21cl", price: "2,50€",  photo: "./img/bebidas/cerveza-mini.webp", desc: "A mini Corona, gelada." },
    { name: "Cerveja Nacional",                  country: "Portugal", region: "—",        type: "cerveja",   grape: "Nacional",  abv: "5%",   volume: "20cl", price: "2,00€",  photo: "./img/bebidas/cerveza-jarra.webp", desc: "Imperial portuguesa fresca." },
    { name: "Shot de Tequila",                   country: "México",   region: "—",        type: "shot",      grape: "Tequila",   abv: "38%",  volume: "4cl",  price: "2,00€",  photo: "./img/bebidas/tequila-shot.webp", desc: "Puro, com sal e lima." },
    { name: "Shot de Mezcal",                    country: "México",   region: "—",        type: "shot",      grape: "Mezcal",    abv: "40%",  volume: "4cl",  price: "2,50€",  photo: "./img/bebidas/shot-salero.webp", desc: "Fumado, com sal de verme." },
    { name: "Shot de Vodka Tamarindo",           country: "México",   region: "—",        type: "shot",      grape: "Vodka",     abv: "30%",  volume: "4cl",  price: "2,00€",  photo: "./img/bebidas/cheers-shots.webp", desc: "Doce-ácido, com kick de tamarindo." },
    { name: "Sangria Branca (1L)",               country: "Portugal", region: "—",        type: "sangria",   grape: "Vinho",     abv: "9%",   volume: "1L",   price: "12,00€", photo: "./img/bebidas/sangria-blanca.svg", desc: "Para partilhar. Vinho branco e fruta fresca." },
    { name: "Sangria Espumante c/ Morango (1L)", country: "Portugal", region: "—",        type: "sangria",   grape: "Espumante", abv: "10%",  volume: "1L",   price: "15,00€", photo: "./img/bebidas/sangria-morango.svg", desc: "Espumante e morango — festa numa jarra." },
    { name: "Jarro de Margarita (1,5L)",         country: "México",   region: "Tequila",  type: "margarita", grape: "Tequila",   abv: "13%",  volume: "1,5L", price: "25,00€", photo: "./img/bebidas/jarra-margarita.webp", desc: "Para o grupo. Margarita clássica em jarro." },

    /* ── BEBIDAS COM PINTA · sem álcool ── */
    { name: "Água Fresca",       country: "México",   region: "—", type: "sem-alcool", grape: "Sem álcool", abv: "0%", volume: "40cl", price: "2,50€", photo: "./img/bebidas/vaso-hielo.webp", desc: "Ananás, água de coco, lima, açúcar e gelo." },
    { name: "Água de Jamaica",   country: "México",   region: "—", type: "sem-alcool", grape: "Sem álcool", abv: "0%", volume: "40cl", price: "2,00€", photo: "./img/bebidas/agua-jamaica.svg", desc: "Infusão de hibisco, refrescante e ligeiramente ácida." },
    { name: "Monaco",            country: "Portugal", region: "—", type: "sem-alcool", grape: "Sem álcool", abv: "0%", volume: "33cl", price: "2,50€", photo: "./img/bebidas/monaco.svg", desc: "Groselha e Sprite." },
    { name: "Limonada de Coco",  country: "México",   region: "—", type: "sem-alcool", grape: "Sem álcool", abv: "0%", volume: "40cl", price: "3,50€", photo: "./img/bebidas/limonada-coco.svg", desc: "Leite de coco, leite condensado, sumo de lima e gelo picado." },
    { name: "Limonada Tropical", country: "México",   region: "—", type: "sem-alcool", grape: "Sem álcool", abv: "0%", volume: "40cl", price: "2,50€", photo: "./img/bebidas/limonada-tropical.svg", desc: "De maracujá, manga ou frutos vermelhos." },
    { name: "Limonada",          country: "México",   region: "—", type: "sem-alcool", grape: "Sem álcool", abv: "0%", volume: "40cl", price: "2,00€", photo: "./img/bebidas/limonada.svg", desc: "Fresca, feita na hora." },
    { name: "Água",              country: "Portugal", region: "—", type: "sem-alcool", grape: "Sem álcool", abv: "0%", volume: "50cl", price: "1,50€", photo: "./img/bebidas/agua.svg", desc: "Água natural sem gás." },
    { name: "Água com Gás",      country: "Portugal", region: "—", type: "sem-alcool", grape: "Sem álcool", abv: "0%", volume: "50cl", price: "1,50€", photo: "./img/bebidas/agua-gas.svg", desc: "Água mineral com gás." },
    { name: "Ice Tea",           country: "Portugal", region: "—", type: "sem-alcool", grape: "Sem álcool", abv: "0%", volume: "33cl", price: "1,50€", photo: "./img/bebidas/ice-tea.webp", desc: "Gelado, pêssego ou limão." },
    { name: "Refrigerante",      country: "—",        region: "—", type: "sem-alcool", grape: "Sem álcool", abv: "0%", volume: "33cl", price: "2,50€", photo: "./img/bebidas/cocas-cheers.webp", desc: "Coca-Cola, Coca-Cola Zero, Sprite ou Fanta." }
  ],


  /* ════════════════════════════════════════════════════════════════════════
     11. FEATURES  ○
     ════════════════════════════════════════════════════════════════════════ */

  features: {
    callStaff: true,
    sharedCart: true,
    comanda: {
      enabled: true,
      dedupeMinutes: 3,
    },
    banners: {
      enabled: false,
    },
  }
};
