/* ═══════════════════════════════════════════════════════════════════════════
   NEXO MENU — CONFIG v5
   Cliente: Picanharia by Oliboile · Carcavelos

   ESTRUTURA EM 9 BLOCOS — cada bloco é independente:
     1. IDENTIDADE        → nome, tagline, cidade
     2. VISUAL            → cores, fonte, hero, logo
     3. CONTACTOS         → morada, telefone, horário
     4. REDES & REVIEWS   → Instagram, Google, TripAdvisor, Facebook, WhatsApp
     5. WI-FI             → SSID e password
     6. BANNERS DINÂMICOS → por horário (almoço / jantar / default)
     7. MENU              → secções e items
        ↳ badge:  "popular" | "chef" | "new"   → ícone psicológico no item
        ↳ upsell: ["sec:idx", ...]              → "Combina com..." no modal
     8. MAIS PEDIDOS      → top 3 destacados
     9. VINHOS            → carta de vinhos com filtros

   REQUIRES_DEV (sessão seguinte):
     A) Secção Rodízio com layout especial (card com preço/pessoa em destaque,
        lista de incluídos com bullets, pill de upgrade "+3,75€")
     B) Quick-nav: separar "Bebidas" de "Vinhos" (actualmente só existe "Vinhos")
     C) Menu Executivo como banner condicional (12h–15h, Qua–Sex) — card fixo
        no topo do menu além de secção scrollável
   ═══════════════════════════════════════════════════════════════════════════ */

const CONFIG = {

  /* ═══ 1. IDENTIDADE ═══ */

  slug: "picanharia-oliboile",
  name: "Picanharia by Oliboile",
  tagline: {
    pt: "Picanharia · Carcavelos",
    en: "Steakhouse · Carcavelos",
    es: "Asador · Carcavelos",
    fr: "Rôtisserie · Carcavelos"
  },
  city: "Carcavelos",
  heroStamp: {
    pt: "Picanharia · Carcavelos",
    en: "Steakhouse · Carcavelos",
    es: "Asador · Carcavelos",
    fr: "Rôtisserie · Carcavelos"
  },


  /* ═══ 2. VISUAL ═══
     Identidade dark: fundo escuro, carne grelhada
     brandColor preto carbono para contrastar forte com elementos de destaque
     ═════════════════════ */

  brandColor: "#1A1A1A",           // preto carbono (acento primário)
  brandColorDark: "#0D0D0D",       // quase preto
  heroImageUrl: "https://oliboile.com/placeholders/menu-hero-meat.webp",
  logoUrl: "https://oliboile.com/assets/logo-DCXF7l9l.png",


  /* ═══ 3. CONTACTOS ═══ */

  address: "Avenida São Miguel, 249 · 2775-751 Carcavelos",
  phone: "+351 913 427 300",
  phoneDisplay: "913 427 300",
  hours: {
    pt: "Qua–Dom · Almoço 12h–15h · Jantar 19h30–23h30 · Sex e Sáb até 00h · Fecha Seg e Ter",
    en: "Wed–Sun · Lunch 12–3pm · Dinner 7:30–11:30pm · Fri & Sat until midnight · Closed Mon & Tue",
    es: "Mié–Dom · Almuerzo 12h–15h · Cena 19h30–23h30 · Vie y Sáb hasta 00h · Cierra Lun y Mar",
    fr: "Mer–Dim · Déjeuner 12h–15h · Dîner 19h30–23h30 · Ven et Sam jusqu'à minuit · Fermé Lun et Mar"
  },
  hoursToday: {
    pt: "Aberto até 23h30",
    en: "Open until 11:30pm",
    es: "Abierto hasta las 23h30",
    fr: "Ouvert jusqu'à 23h30"
  },


  /* ═══ 4. REDES & REVIEWS ═══ */

  // ⚠️ URLs aproximados — confirmar com o cliente antes do deploy
  googleReviewUrl: "https://www.google.com/search?q=Picanharia+Oliboile+Carcavelos+reviews",
  tripadvisorReviewUrl: "https://www.tripadvisor.com/Restaurant_Review-Oliboile-Carcavelos",
  facebookReviewUrl: "https://www.facebook.com/picanhariabyoliboile/reviews",
  instagramHandle: "picanharia_byoliboile",
  whatsappNumber: "351913427300",
  whatsappLoyaltyMessage: {
    pt: "Olá! Gostaria de falar com a Picanharia by Oliboile.",
    en: "Hello! I would like to contact Picanharia by Oliboile.",
    es: "¡Hola! Me gustaría contactar con Picanharia by Oliboile.",
    fr: "Bonjour! Je souhaite contacter la Picanharia by Oliboile."
  },


  /* ═══ 5. WI-FI ═══ */

  // ⚠️ Confirmar com o cliente — placeholder por agora
  wifiSsid: "Oliboile_Guest",
  wifiPassword: "Oliboile2026",


  /* ═══ 6. BANNERS DINÂMICOS POR HORÁRIO ═══
     Cada banner tem um intervalo de horas (startH inclusive, endH exclusive).
     days: array de dias da semana — 0=Dom, 1=Seg … 6=Sáb
           omitir ou deixar vazio = todos os dias
     O banner ativo é o primeiro da lista cujo intervalo corresponde à hora atual.
     Se nenhum corresponder, o banner de fallback (sem startH/endH) é usado.
     ═════════════════════════════════════════════════════════════════ */

  timeBanners: [
    {
      id: "almoco",
      startH: 12, endH: 15,
      days: [3, 4, 5, 6, 0],   // Qua(3) Qui(4) Sex(5) Sáb(6) Dom(0)
      label: {
        pt: "Menu Executivo", en: "Lunch Menu", es: "Menú Ejecutivo", fr: "Menu Déjeuner"
      },
      text: {
        pt: "Entrada + Prato + Bebida + Café · 17,90€ · Só dias úteis",
        en: "Starter + Main + Drink + Coffee · €17.90 · Weekdays only",
        es: "Entrada + Plato + Bebida + Café · 17,90€ · Solo entre semana",
        fr: "Entrée + Plat + Boisson + Café · 17,90€ · Jours ouvrables"
      }
    },
    {
      id: "jantar",
      startH: 19, endH: 24,
      days: [3, 4, 5, 6, 0],
      label: {
        pt: "Rodízio", en: "Rodízio", es: "Rodízio", fr: "Rodízio"
      },
      text: {
        pt: "Picanha sul-americana + secretos + acompanhamentos · a partir de 25,90€",
        en: "South American picanha + pork + sides · from €25.90",
        es: "Picaña sudamericana + secreto + guarniciones · desde 25,90€",
        fr: "Picanha sud-américaine + secretos + garnitures · à partir de 25,90€"
      }
    },
    {
      id: "default",
      label: {
        pt: "Quente que f*de", en: "Seriously good meat", es: "Carne de verdad", fr: "Viande sérieuse"
      },
      text: {
        pt: "Rodízio · Picanha · Wagyu · Francesinha byOliboile",
        en: "Rodízio · Picanha · Wagyu · Francesinha byOliboile",
        es: "Rodízio · Picaña · Wagyu · Francesinha byOliboile",
        fr: "Rodízio · Picanha · Wagyu · Francesinha byOliboile"
      }
    }
  ],


  /* ═══ 7. MENU ═══
     Diet tags: "V"=vegetariano  "VG"=vegan  "GF"=sem glúten  "LF"=sem lactose
     Allergens (Reg. UE 1169/2011): [] = "perguntar na mesa" (cliente completa depois)
     badge:  "popular" | "chef" | "new"
     upsell: ["secaoId:itemIndex", ...] → "Combina com..." no modal

     SECÇÕES NOVAS (vs. template anterior):
       - rodizio   → REQUIRES_DEV: card com preço/pessoa + upgrade pill
       - bebidas   → REQUIRES_DEV: layout com garrafas/copos/canecas
       - executivo → REQUIRES_DEV: banner condicional no topo (12h–15h Qua–Sex)
     ═════════════════════════════════════════════════════════════════ */

  menu: [

    /* ─── COUVERT ─── */
    {
      id: "couvert",
      section: { pt: "Couvert", en: "Couvert", es: "Couvert", fr: "Couvert" },
      desc: {
        pt: "Começa sempre com as preliminares.",
        en: "Always start with the basics.",
        es: "Siempre empieza con lo básico.",
        fr: "Commencez toujours par les bases."
      },
      items: [
        {
          name: { pt: "Couvert à Oliboile", en: "Oliboile Couvert", es: "Couvert à Oliboile", fr: "Couvert à Oliboile" },
          desc: {
            pt: "Pão português, azeite virgem extra com balsâmico, manteiga dos Açores, azeitonas temperadas.",
            en: "Portuguese bread, extra virgin olive oil with balsamic, Azores butter, seasoned olives.",
            es: "Pan portugués, aceite de oliva virgen extra con balsámico, mantequilla de Azores, aceitunas aliñadas.",
            fr: "Pain portugais, huile d'olive vierge extra au balsamique, beurre des Açores, olives assaisonnées."
          },
          price: "4€/pessoa",
          photo: "",
          diet: ["V"],
          allergens: [],
          upsell: ["entradas:0", "entradas:5", "bebidas:13"]
        }
      ]
    },

    /* ─── ENTRADAS ─── */
    {
      id: "entradas",
      section: { pt: "Entradas", en: "Starters", es: "Entrantes", fr: "Entrées" },
      desc: {
        pt: "Normalmente pede-se mais do que uma.",
        en: "Usually more than one is ordered.",
        es: "Normalmente se pide más de una.",
        fr: "On en commande généralement plus d'une."
      },
      items: [
        {
          name: { pt: "Oliovo", en: "Oliovo", es: "Oliovo", fr: "Oliovo" },
          desc: {
            pt: "Ovo, puré trufado, cogumelos portobello, mozzarella.",
            en: "Egg, truffle purée, portobello mushrooms, mozzarella.",
            es: "Huevo, puré trufado, champiñones portobello, mozzarella.",
            fr: "Œuf, purée truffée, champignons portobello, mozzarella."
          },
          price: "11€",
          photo: "",
          diet: ["V"],
          allergens: [],
          badge: "popular",
          upsell: ["bebidas:11", "bebidas:13", "principais:3"]
        },
        {
          name: { pt: "Cachorrinho à Oliboile", en: "Oliboile Hot Dog", es: "Perrito à Oliboile", fr: "Hot-dog à Oliboile" },
          desc: {
            pt: "Cachorro à moda da batalha com molho à Oliboile.",
            en: "Hot dog Batalha-style with Oliboile sauce.",
            es: "Perrito estilo Batalha con salsa Oliboile.",
            fr: "Hot-dog style Batalha avec sauce Oliboile."
          },
          price: "12€",
          photo: "",
          diet: [],
          allergens: [],
          badge: "new",
          upsell: ["bebidas:11", "bebidas:13"]
        },
        {
          name: { pt: "Carpaccio de Picanha", en: "Picanha Carpaccio", es: "Carpaccio de Picaña", fr: "Carpaccio de Picanha" },
          desc: {
            pt: "Picanha curada, rúcula, grana padano, pesto, com tostas.",
            en: "Cured picanha, rocket, grana padano, pesto, with toast.",
            es: "Picaña curada, rúcula, grana padano, pesto, con tostadas.",
            fr: "Picanha séchée, roquette, grana padano, pesto, avec toasts."
          },
          price: "14€",
          photo: "",
          diet: [],
          allergens: [],
          upsell: ["bebidas:13", "entradas:5"]
        },
        {
          name: { pt: "Pica-Pau de Picanha", en: "Picanha Pica-Pau", es: "Pica-Pau de Picaña", fr: "Pica-Pau de Picanha" },
          desc: {
            pt: "Picanha salteada, molho tradicional, pickles, com pão.",
            en: "Sautéed picanha, traditional sauce, pickles, with bread.",
            es: "Picaña salteada, salsa tradicional, encurtidos, con pan.",
            fr: "Picanha sautée, sauce traditionnelle, pickles, avec pain."
          },
          price: "14€",
          photo: "",
          diet: [],
          allergens: [],
          upsell: ["bebidas:8", "bebidas:13"]
        },
        {
          name: { pt: "Rafeirinhos (4 unid.)", en: "Rafeirinhos (4 pcs)", es: "Rafeirinhos (4 uds)", fr: "Rafeirinhos (4 pcs)" },
          desc: {
            pt: "Mini hambúrgueres de wagyu · 100% wagyu, cheddar & flamengo, maionese de trufa.",
            en: "Mini wagyu burgers · 100% wagyu, cheddar & flamengo, truffle mayo.",
            es: "Mini hamburguesas de wagyu · 100% wagyu, cheddar y flamengo, mayonesa de trufa.",
            fr: "Mini-burgers de wagyu · 100% wagyu, cheddar & flamengo, mayo truffe."
          },
          price: "26€",
          photo: "",
          diet: [],
          allergens: [],
          upsell: ["bebidas:11", "bebidas:13"]
        },
        {
          name: { pt: "Croquitos (1 / 3 unid.)", en: "Croquitos (1 / 3 pcs)", es: "Croquitos (1 / 3 uds)", fr: "Croquitos (1 / 3 pcs)" },
          desc: {
            pt: "Croquetes de carne caseiros, desfiada, com mostarda.",
            en: "Homemade shredded beef croquettes, with mustard.",
            es: "Croquetas caseras de carne desmenuzada, con mostaza.",
            fr: "Croquettes maison à la viande effilée, avec moutarde."
          },
          price: "4€ / 9€",
          photo: "",
          diet: [],
          allergens: [],
          upsell: ["bebidas:8", "entradas:0"]
        }
      ]
    },

    /* ─── RODÍZIO ─── REQUIRES_DEV: card visual distinto (preço/pessoa + upgrade pill) */
    {
      id: "rodizio",
      section: { pt: "Rodízio de Picanha", en: "Picanha Rodízio", es: "Rodízio de Picaña", fr: "Rodízio de Picanha" },
      desc: {
        pt: "Almoço 25,90€ · Jantar 29,90€ · Inclui: picanha sul-americana, secretos de porco preto e acompanhamentos. Upgrade premium +3,75€: queijo coalho grelhado.",
        en: "Lunch €25.90 · Dinner €29.90 · Includes: South American picanha, Iberian pork, sides. Premium upgrade +€3.75: grilled coalho cheese.",
        es: "Almuerzo 25,90€ · Cena 29,90€ · Incluye: picaña, secreto ibérico, guarniciones. Premium +3,75€: queso coalho.",
        fr: "Déjeuner 25,90€ · Dîner 29,90€ · Inclus: picanha, porc ibérique, garnitures. Premium +3,75€: fromage coalho grillé."
      },
      items: [
        {
          name: { pt: "Rodízio de Picanha — Almoço", en: "Picanha Rodízio — Lunch", es: "Rodízio de Picaña — Almuerzo", fr: "Rodízio de Picanha — Déjeuner" },
          desc: {
            pt: "Picanha sul-americana + secretos de porco preto + acompanhamentos do rodízio. Carne servida até não conseguires mais.",
            en: "South American picanha + Iberian pork secreto + rodízio sides. Meat served until you can't take any more.",
            es: "Picaña + secreto ibérico + guarniciones. Carne servida hasta que no puedas más.",
            fr: "Picanha + secreto + garnitures. Viande servie jusqu'à plus soif."
          },
          price: "25,90€",
          photo: "",
          diet: [],
          allergens: [],
          badge: "popular",
          upsell: ["rodizio:2", "bebidas:13", "sobremesas:0"]
        },
        {
          name: { pt: "Rodízio de Picanha — Jantar", en: "Picanha Rodízio — Dinner", es: "Rodízio de Picaña — Cena", fr: "Rodízio de Picanha — Dîner" },
          desc: {
            pt: "Picanha sul-americana + secretos de porco preto + acompanhamentos do rodízio.",
            en: "South American picanha + Iberian pork secreto + rodízio sides.",
            es: "Picaña + secreto ibérico + guarniciones.",
            fr: "Picanha + secreto + garnitures."
          },
          price: "29,90€",
          photo: "",
          diet: [],
          allergens: [],
          upsell: ["rodizio:2", "bebidas:13", "sobremesas:0"]
        },
        {
          name: { pt: "Upgrade Premium — Queijo Coalho", en: "Premium Upgrade — Coalho Cheese", es: "Upgrade Premium — Queso Coalho", fr: "Upgrade Premium — Fromage Coalho" },
          desc: {
            pt: "Queijo coalho grelhado incluído no rodízio. Suplemento ao preço base.",
            en: "Grilled coalho cheese added to the rodízio. Supplement on top of base price.",
            es: "Queso coalho a la brasa incluido en el rodízio. Suplemento al precio base.",
            fr: "Fromage coalho grillé inclus dans le rodízio. Supplément au prix de base."
          },
          price: "+3,75€",
          photo: "",
          diet: [],
          allergens: [],
          upsell: ["rodizio:0", "rodizio:1", "bebidas:13"]
        }
      ]
    },

    /* ─── PRATOS PRINCIPAIS ─── */
    {
      id: "principais",
      section: { pt: "Pratos Principais", en: "Main Courses", es: "Platos Principales", fr: "Plats Principaux" },
      desc: {
        pt: "Cuidado: aqui cria-se dependência.",
        en: "Warning: highly addictive.",
        es: "Cuidado: aquí se crea adicción.",
        fr: "Attention: crée une dépendance."
      },
      items: [
        {
          name: { pt: "Wagyu de Picanha", en: "Wagyu Picanha", es: "Wagyu de Picaña", fr: "Wagyu de Picanha" },
          desc: {
            pt: "Picanha wagyu australiana com puré de batata trufado e espargos.",
            en: "Australian wagyu picanha with truffle mashed potato and asparagus.",
            es: "Picaña wagyu australiana con puré trufado y espárragos.",
            fr: "Picanha wagyu australien avec purée truffée et asperges."
          },
          price: "44€",
          photo: "",
          diet: [],
          allergens: [],
          upsell: ["bebidas:13", "sobremesas:0"]
        },
        {
          name: { pt: "Tábua dos Carnívoros", en: "Carnivore Board", es: "Tabla de los Carnívoros", fr: "Planche des Carnivores" },
          desc: {
            pt: "Picanha argentina premium AA, picanha uruguai, vazia sul-americana, secretos de porco preto, salsicha fresca na brasa, queijo coalho e acompanhamentos clássicos. Para partilhar — serve 2/3 pessoas.",
            en: "Premium AA Argentine picanha, Uruguayan picanha, South American striploin, Iberian pork secreto, fresh sausage, coalho cheese and classic sides. To share — serves 2/3.",
            es: "Picaña argentina premium AA, picaña uruguaya, vacío, secreto ibérico, salchicha, queso coalho y guarniciones. Para compartir — 2/3 personas.",
            fr: "Picanha argentine premium AA, picanha uruguayenne, faux-filet, secreto ibérique, saucisse fraîche, fromage coalho et garnitures. À partager — 2/3 pers."
          },
          price: "58€",
          photo: "",
          diet: [],
          allergens: [],
          badge: "chef",
          upsell: ["bebidas:13", "bebidas:14", "sobremesas:0"]
        },
        {
          name: { pt: "O Laracho", en: "O Laracho", es: "O Laracho", fr: "O Laracho" },
          desc: {
            pt: "Bife da vazia sul-americano, molho cremoso de cogumelos selecionados com acompanhamentos à escolha.",
            en: "South American striploin steak, creamy mushroom sauce, sides of your choice.",
            es: "Bife de vacío sudamericano, salsa cremosa de setas con guarniciones a elegir.",
            fr: "Faux-filet sud-américain, sauce crémeuse aux champignons, accompagnements au choix."
          },
          price: "23€",
          photo: "",
          diet: [],
          allergens: [],
          upsell: ["bebidas:13", "sobremesas:1"]
        },
        {
          name: { pt: "Picanha", en: "Picanha", es: "Picaña", fr: "Picanha" },
          desc: {
            pt: "Picanha argentina premium AA com 3 acompanhamentos à escolha.",
            en: "Premium AA Argentine picanha with 3 sides of your choice.",
            es: "Picaña argentina premium AA con 3 guarniciones a elegir.",
            fr: "Picanha argentine premium AA avec 3 accompagnements au choix."
          },
          price: "24€",
          photo: "",
          diet: [],
          allergens: [],
          upsell: ["rodizio:2", "bebidas:13", "sobremesas:0"]
        },
        {
          name: { pt: "Francesinha byOliboile", en: "Francesinha byOliboile", es: "Francesinha byOliboile", fr: "Francesinha byOliboile" },
          desc: {
            pt: "Pão, queijo, enchidos, picanha, ovo, molho à Oliboile. A que toda a gente volta para repetir.",
            en: "Bread, cheese, charcuterie, picanha, egg, Oliboile sauce. The one everyone comes back for.",
            es: "Pan, queso, embutidos, picaña, huevo, salsa Oliboile. La que todo el mundo repite.",
            fr: "Pain, fromage, charcuterie, picanha, œuf, sauce Oliboile. Celle que tout le monde revient commander."
          },
          price: "19€",
          photo: "",
          diet: [],
          allergens: [],
          badge: "popular",
          upsell: ["bebidas:11", "bebidas:13", "sobremesas:0"]
        },
        {
          name: { pt: "Tascada", en: "Tascada", es: "Tascada", fr: "Tascada" },
          desc: {
            pt: "Maminha argentina grelhada (200g) com acompanhamentos clássicos. Suplemento picanha uruguai +3€.",
            en: "Grilled Argentine flank steak (200g) with classic sides. Uruguayan picanha upgrade +€3.",
            es: "Vacío argentino a la parrilla (200g) con guarniciones. Suplemento picaña uruguaya +3€.",
            fr: "Bavette argentine grillée (200g) avec garnitures classiques. Supplément picanha uruguayenne +3€."
          },
          price: "18€",
          photo: "",
          diet: [],
          allergens: [],
          upsell: ["bebidas:13", "sobremesas:3"]
        },
        {
          name: { pt: "Frango à Oliboile", en: "Oliboile Chicken", es: "Pollo à Oliboile", fr: "Poulet à Oliboile" },
          desc: {
            pt: "Frango marinado 48h, suculento, com dois acompanhamentos à escolha.",
            en: "Chicken marinated 48h, juicy, with two sides of your choice.",
            es: "Pollo marinado 48h, jugoso, con dos guarniciones a elegir.",
            fr: "Poulet mariné 48h, juteux, avec deux accompagnements au choix."
          },
          price: "17,50€",
          photo: "",
          diet: [],
          allergens: [],
          upsell: ["bebidas:5", "bebidas:14", "sobremesas:3"]
        },
        {
          name: { pt: "Pasta Pomodoro", en: "Pasta Pomodoro", es: "Pasta Pomodoro", fr: "Pasta Pomodoro" },
          desc: {
            pt: "Spaghetti, tomate, alho, manjericão e grana padano. Vegetariano.",
            en: "Spaghetti, tomato, garlic, basil and grana padano. Vegetarian.",
            es: "Spaghetti, tomate, ajo, albahaca y grana padano. Vegetariano.",
            fr: "Spaghetti, tomate, ail, basilic et grana padano. Végétarien."
          },
          price: "16€",
          photo: "",
          diet: ["V"],
          allergens: [],
          upsell: ["bebidas:5", "sobremesas:1"]
        },
        {
          name: { pt: "Hambúrguer de Picanha", en: "Picanha Burger", es: "Hamburguesa de Picaña", fr: "Burger de Picanha" },
          desc: {
            pt: "Hambúrguer 100% picanha, chouriço ibérico, rúcula, mix de queijos, batatas fritas.",
            en: "100% picanha burger, Iberian chorizo, rocket, cheese mix, fries.",
            es: "Hamburguesa 100% picaña, chorizo ibérico, rúcula, mix de quesos, patatas fritas.",
            fr: "Burger 100% picanha, chorizo ibérique, roquette, mix de fromages, frites."
          },
          price: "15€",
          photo: "",
          diet: [],
          allergens: [],
          upsell: ["bebidas:11", "bebidas:13"]
        }
      ]
    },

    /* ─── SOBREMESAS ─── */
    {
      id: "sobremesas",
      section: { pt: "Sobremesas", en: "Desserts", es: "Postres", fr: "Desserts" },
      desc: {
        pt: "*OBRIGATÓRIO*",
        en: "*MANDATORY*",
        es: "*OBLIGATORIO*",
        fr: "*OBLIGATOIRE*"
      },
      items: [
        {
          name: { pt: "Baba de Cão", en: "Baba de Cão", es: "Baba de Cão", fr: "Baba de Cão" },
          desc: {
            pt: "Receita secreta da casa. Para partilhar.",
            en: "House secret recipe. To share.",
            es: "Receta secreta de la casa. Para compartir.",
            fr: "Recette secrète maison. À partager."
          },
          price: "6,50€",
          photo: "",
          diet: ["V"],
          allergens: [],
          badge: "popular",
          upsell: ["bebidas:15", "sobremesas:2"]
        },
        {
          name: { pt: "Cheesecake", en: "Cheesecake", es: "Cheesecake", fr: "Cheesecake" },
          desc: {
            pt: "Frutos vermelhos ou pêssego do dia.",
            en: "Red fruits or peach of the day.",
            es: "Frutos rojos o melocotón del día.",
            fr: "Fruits rouges ou pêche du jour."
          },
          price: "6,50€",
          photo: "",
          diet: ["V"],
          allergens: [],
          upsell: ["bebidas:15", "sobremesas:3"]
        },
        {
          name: { pt: "Gelato Artigianale Italiano", en: "Italian Artisan Gelato", es: "Gelato Artesanal Italiano", fr: "Gelato Artisanal Italien" },
          desc: {
            pt: "Sabores: panna cotta · amarena fabbri · tiramisu.",
            en: "Flavours: panna cotta · amarena fabbri · tiramisu.",
            es: "Sabores: panna cotta · amarena fabbri · tiramisu.",
            fr: "Parfums: panna cotta · amarena fabbri · tiramisu."
          },
          price: "5,50€",
          photo: "",
          diet: ["V"],
          allergens: [],
          upsell: ["bebidas:15", "bebidas:16", "sobremesas:0"]
        },
        {
          name: { pt: "Abacaxi ao Natural", en: "Fresh Pineapple", es: "Piña Natural", fr: "Ananas Naturel" },
          desc: {
            pt: "Abacaxi com raspas de lima. Refrescante.",
            en: "Pineapple with lime zest. Refreshing.",
            es: "Piña con ralladura de lima. Refrescante.",
            fr: "Ananas aux zestes de citron vert. Rafraîchissant."
          },
          price: "5,50€",
          photo: "",
          diet: ["V", "VG", "GF", "LF"],
          allergens: [],
          upsell: ["bebidas:15", "bebidas:16"]
        }
      ]
    },

    /* ─── BEBIDAS ─── REQUIRES_DEV: layout com garrafas/copos/canecas separados */
    {
      id: "bebidas",
      section: { pt: "Bebidas", en: "Drinks", es: "Bebidas", fr: "Boissons" },
      desc: {
        pt: "Ninguém fica só por uma.",
        en: "Nobody stops at one.",
        es: "Nadie se queda en una.",
        fr: "Personne ne s'arrête à une."
      },
      items: [
        { name: { pt: "Água Luso 1L", en: "Water Luso 1L", es: "Agua Luso 1L", fr: "Eau Luso 1L" }, desc: { pt: "Água mineral natural.", en: "Natural mineral water.", es: "Agua mineral natural.", fr: "Eau minérale naturelle." }, price: "5€", photo: "", diet: ["V", "VG", "GF", "LF"], allergens: [] },
        { name: { pt: "Água Luso 50cl", en: "Water Luso 50cl", es: "Agua Luso 50cl", fr: "Eau Luso 50cl" }, desc: { pt: "Água mineral natural.", en: "Natural mineral water.", es: "Agua mineral natural.", fr: "Eau minérale naturelle." }, price: "3€", photo: "", diet: ["V", "VG", "GF", "LF"], allergens: [] },
        { name: { pt: "Castello 75cl", en: "Castello 75cl", es: "Castello 75cl", fr: "Castello 75cl" }, desc: { pt: "Água com gás.", en: "Sparkling water.", es: "Agua con gas.", fr: "Eau gazeuse." }, price: "5€", photo: "", diet: ["V", "VG", "GF", "LF"], allergens: [] },
        { name: { pt: "Castello 25cl", en: "Castello 25cl", es: "Castello 25cl", fr: "Castello 25cl" }, desc: { pt: "Água com gás.", en: "Sparkling water.", es: "Agua con gas.", fr: "Eau gazeuse." }, price: "3€", photo: "", diet: ["V", "VG", "GF", "LF"], allergens: [] },
        { name: { pt: "Refrigerante", en: "Soft Drink", es: "Refresco", fr: "Boisson gazeuse" }, desc: { pt: "Coca-Cola, Fuze Tea, Sprite, Fanta.", en: "Coca-Cola, Fuze Tea, Sprite, Fanta.", es: "Coca-Cola, Fuze Tea, Sprite, Fanta.", fr: "Coca-Cola, Fuze Tea, Sprite, Fanta." }, price: "4€", photo: "", diet: ["V", "VG"], allergens: [] },
        { name: { pt: "Limonada", en: "Lemonade", es: "Limonada", fr: "Citronnade" }, desc: { pt: "Limonada fresca.", en: "Fresh lemonade.", es: "Limonada fresca.", fr: "Citronnade fraîche." }, price: "4€", photo: "", diet: ["V", "VG"], allergens: [] },
        { name: { pt: "Sumo de Laranja", en: "Orange Juice", es: "Zumo de Naranja", fr: "Jus d'Orange" }, desc: { pt: "Sumo de laranja natural.", en: "Fresh orange juice.", es: "Zumo de naranja natural.", fr: "Jus d'orange frais." }, price: "4€", photo: "", diet: ["V", "VG", "GF", "LF"], allergens: [] },
        { name: { pt: "Sumo do Ruivo", en: "Ruivo's Juice", es: "Zumo del Ruivo", fr: "Jus du Ruivo" }, desc: { pt: "Sumo especial do chefe.", en: "Chef's special juice.", es: "Zumo especial del chef.", fr: "Jus spécial du chef." }, price: "5€", photo: "", diet: ["V", "VG"], allergens: [] },
        { name: { pt: "Heineken 25cl", en: "Heineken 25cl", es: "Heineken 25cl", fr: "Heineken 25cl" }, desc: { pt: "Cerveja de pressão.", en: "Draft beer.", es: "Cerveza de barril.", fr: "Bière pression." }, price: "3€", photo: "", diet: [], allergens: [] },
        { name: { pt: "Heineken 0% 25cl", en: "Heineken 0% 25cl", es: "Heineken 0% 25cl", fr: "Heineken 0% 25cl" }, desc: { pt: "Cerveja sem álcool.", en: "Non-alcoholic beer.", es: "Cerveza sin alcohol.", fr: "Bière sans alcool." }, price: "3€", photo: "", diet: [], allergens: [] },
        { name: { pt: "Bandida do Pomar 25cl", en: "Bandida do Pomar 25cl", es: "Bandida do Pomar 25cl", fr: "Bandida do Pomar 25cl" }, desc: { pt: "Cerveja artesanal portuguesa.", en: "Portuguese craft beer.", es: "Cerveza artesana portuguesa.", fr: "Bière artisanale portugaise." }, price: "3€", photo: "", diet: [], allergens: [] },
        { name: { pt: "Heineken Caneca 50cl", en: "Heineken Pint 50cl", es: "Heineken Jarra 50cl", fr: "Heineken Chope 50cl" }, desc: { pt: "Cerveja de pressão — caneca.", en: "Draft beer — pint.", es: "Cerveza de barril — jarra.", fr: "Bière pression — chope." }, price: "5€", photo: "", diet: [], allergens: [], badge: "popular", upsell: ["entradas:0", "principais:4", "entradas:1"] },
        { name: { pt: "Bandida Caneca 50cl", en: "Bandida Pint 50cl", es: "Bandida Jarra 50cl", fr: "Bandida Chope 50cl" }, desc: { pt: "Cerveja artesanal — caneca.", en: "Craft beer — pint.", es: "Cerveza artesana — jarra.", fr: "Bière artisanale — chope." }, price: "5€", photo: "", diet: [], allergens: [] },
        { name: { pt: "Sangria Tinta (0,75L / 1,8L)", en: "Red Sangria (0.75L / 1.8L)", es: "Sangría Tinta (0,75L / 1,8L)", fr: "Sangria Rouge (0,75L / 1,8L)" }, desc: { pt: "Mais pedida com carnes.", en: "Most ordered with meat.", es: "La más pedida con carnes.", fr: "La plus commandée avec la viande." }, price: "14€ / 23€", photo: "", diet: [], allergens: [], badge: "popular", upsell: ["principais:3", "rodizio:0", "principais:4"] },
        { name: { pt: "Sangria Passion Fruit (0,75L / 1,8L)", en: "Passion Fruit Sangria (0.75L / 1.8L)", es: "Sangría de Maracuyá (0,75L / 1,8L)", fr: "Sangria Fruit de la Passion (0,75L / 1,8L)" }, desc: { pt: "Fresca e tropical.", en: "Fresh and tropical.", es: "Fresca y tropical.", fr: "Fraîche et tropicale." }, price: "16€ / 25€", photo: "", diet: [], allergens: [], upsell: ["principais:6", "sobremesas:3"] },
        { name: { pt: "Café", en: "Coffee", es: "Café", fr: "Café" }, desc: { pt: "Espresso.", en: "Espresso.", es: "Espresso.", fr: "Espresso." }, price: "2€", photo: "", diet: ["V", "VG", "GF", "LF"], allergens: [], upsell: ["sobremesas:0", "sobremesas:1", "sobremesas:2"] },
        { name: { pt: "Descafeinado", en: "Decaf", es: "Descafeinado", fr: "Déca" }, desc: { pt: "Espresso descafeinado.", en: "Decaf espresso.", es: "Espresso descafeinado.", fr: "Espresso décaféiné." }, price: "2€", photo: "", diet: ["V", "VG", "GF", "LF"], allergens: [], upsell: ["sobremesas:0", "sobremesas:1", "sobremesas:2"] }
      ]
    },

    /* ─── MENU EXECUTIVO ─── REQUIRES_DEV: banner condicional no topo (12h–15h Qua–Sex) */
    {
      id: "executivo",
      section: { pt: "Menu Executivo", en: "Lunch Menu", es: "Menú Ejecutivo", fr: "Menu Déjeuner" },
      desc: {
        pt: "Entrada + Prato Principal + Bebida + Café · 17,90€ · Disponível ao almoço, dias úteis (Qua–Sex).",
        en: "Starter + Main Course + Drink + Coffee · €17.90 · Available at lunch, weekdays (Wed–Fri).",
        es: "Entrada + Plato + Bebida + Café · 17,90€ · Disponible en el almuerzo, días laborables (Mié–Vie).",
        fr: "Entrée + Plat Principal + Boisson + Café · 17,90€ · Disponible au déjeuner, jours ouvrables (Mer–Ven)."
      },
      items: [
        {
          name: { pt: "Couvert ou Croquito + Prato + Bebida + Café", en: "Couvert or Croquito + Main + Drink + Coffee", es: "Couvert o Croquito + Plato + Bebida + Café", fr: "Couvert ou Croquito + Plat + Boisson + Café" },
          desc: {
            pt: "Entrada: couvert à Oliboile ou croquito. Prato: frango à Oliboile, pasta pomodoro ou tascada executiva (maminha com 1 acompanhamento). Bebida: água ou refrigerante (+2€ copo de vinho, +1,50€ cerveja).",
            en: "Starter: couvert or croquito. Main: Oliboile chicken, pasta pomodoro or executive tascada. Drink: water or soft drink (+€2 glass of wine, +€1.50 beer).",
            es: "Entrada: couvert o croquito. Plato: pollo Oliboile, pasta pomodoro o tascada ejecutiva. Bebida: agua o refresco (+2€ vino, +1,50€ cerveza).",
            fr: "Entrée: couvert ou croquito. Plat: poulet Oliboile, pasta pomodoro ou tascada exécutif. Boisson: eau ou soda (+2€ verre de vin, +1,50€ bière)."
          },
          price: "17,90€",
          photo: "",
          diet: [],
          allergens: []
        }
      ]
    }

  ],


  /* ═══ 8. MAIS PEDIDOS ═══
     Top 3 items destacados. refId = "sectionId:itemIndex"
     Ranking automático: primeiro = #01, segundo = #02, terceiro = #03
     ═════════════════════════════════════════════════════════════════ */

  mostOrdered: [
    {
      refId: "entradas:0",   // Oliovo
      badge: { pt: "⭐ Mais pedido", en: "⭐ Most ordered", es: "⭐ Más pedido", fr: "⭐ Plus commandé" }
    },
    {
      refId: "rodizio:0",    // Rodízio de Picanha — Almoço
      badge: { pt: "🔥 O ex-líbris", en: "🔥 The signature", es: "🔥 El clásico", fr: "🔥 La spécialité" }
    },
    {
      refId: "principais:4", // Francesinha byOliboile
      badge: { pt: "👑 Todos repetem", en: "👑 Everyone comes back", es: "👑 Todos repiten", fr: "👑 Tout le monde revient" }
    }
  ],


  /* ═══ 9. VINHOS ═══
     ⚠️ Ratings Vivino aproximados — confirmar URLs reais com o cliente antes do deploy
     ═════════════════════════════════════════════════════════════════ */

  wines: [

    // A COPO
    { name: "Vallado Douro (copo)", country: "Portugal", region: "Douro", type: "tinto", grape: "Touriga Nacional, Tinta Roriz", abv: "13,5%", volume: "copo", price: "5€", desc: "Tinto do Douro elegante, servido a copo. O favorito da casa.", photo: "", vivinoRating: 3.8, vivinoUrl: "https://www.vivino.com/wines/1138696", badge: "popular" },
    { name: "Nóia Alentejo (copo)", country: "Portugal", region: "Alentejo", type: "tinto", grape: "Aragonez, Trincadeira", abv: "13%", volume: "copo", price: "4,50€", desc: "Tinto alentejano fácil e redondo. Boa relação qualidade/preço.", photo: "", vivinoRating: 3.5, vivinoUrl: "https://www.vivino.com/wines/1124735" },

    // GARRAFA — TINTO
    { name: "Nóia Alentejo", country: "Portugal", region: "Alentejo", type: "tinto", grape: "Aragonez, Trincadeira", abv: "13%", volume: "750ml", price: "14€", desc: "Tinto alentejano fácil e redondo.", photo: "", vivinoRating: 3.5, vivinoUrl: "https://www.vivino.com/wines/1124735" },
    { name: "Vallado Douro", country: "Portugal", region: "Douro", type: "tinto", grape: "Touriga Nacional, Tinta Roriz", abv: "13,5%", volume: "750ml", price: "19€", desc: "Tinto do Douro elegante. O favorito da casa.", photo: "", vivinoRating: 3.8, vivinoUrl: "https://www.vivino.com/wines/1138696", badge: "popular" },
    { name: "Castelares Superior Douro", country: "Portugal", region: "Douro", type: "tinto", grape: "Touriga Franca, Tinta Roriz", abv: "13,5%", volume: "750ml", price: "19€", desc: "Douro encorpado, bom para carnes grelhadas.", photo: "", vivinoRating: 3.7, vivinoUrl: "https://www.vivino.com/wines/1131804" },
    { name: "Vallado Superior", country: "Portugal", region: "Douro", type: "tinto", grape: "Touriga Nacional, Touriga Franca", abv: "14%", volume: "750ml", price: "24€", desc: "Versão premium do Vallado. Mais complexo e estruturado.", photo: "", vivinoRating: 3.9, vivinoUrl: "https://www.vivino.com/wines/1146697" },
    { name: "Bella Ellegance Dão", country: "Portugal", region: "Dão", type: "tinto", grape: "Touriga Nacional, Jaen", abv: "13%", volume: "750ml", price: "27€", desc: "Tinto do Dão refinado, acidez elegante.", photo: "", vivinoRating: 3.8, vivinoUrl: "https://www.vivino.com/wines/1142876" },
    { name: "Vallado Alicante Bouschet", country: "Portugal", region: "Douro", type: "tinto", grape: "Alicante Bouschet", abv: "14,5%", volume: "750ml", price: "38€", desc: "Casta francesa no Douro. Intenso, profundo e encorpado.", photo: "", vivinoRating: 4.0, vivinoUrl: "https://www.vivino.com/wines/1158197" },
    { name: "Monte das Bagas Reserva Alentejo", country: "Portugal", region: "Alentejo", type: "tinto", grape: "Aragonez, Alicante Bouschet", abv: "14%", volume: "750ml", price: "43€", desc: "Reserva premium do Alentejo. Para grandes ocasiões.", photo: "", vivinoRating: 4.1, vivinoUrl: "https://www.vivino.com/wines/1137817" },

    // GARRAFA — BRANCO
    { name: "Nóia Alentejo Branco", country: "Portugal", region: "Alentejo", type: "branco", grape: "Antão Vaz, Arinto", abv: "13%", volume: "750ml", price: "14€", desc: "Fresco e fácil. Ideal para entradas.", photo: "", vivinoRating: 3.4, vivinoUrl: "https://www.vivino.com/wines/1124735" },
    { name: "Vallado Douro Branco", country: "Portugal", region: "Douro", type: "branco", grape: "Rabigato, Viosinho", abv: "13%", volume: "750ml", price: "19€", desc: "Branco do Douro com boa acidez e mineralidade.", photo: "", vivinoRating: 3.7, vivinoUrl: "https://www.vivino.com/wines/1138698" },
    { name: "Castelares Vinhas a Norte Douro", country: "Portugal", region: "Douro", type: "branco", grape: "Rabigato, Códega", abv: "12,5%", volume: "750ml", price: "19€", desc: "Branco do Douro fresco e aromático.", photo: "", vivinoRating: 3.6, vivinoUrl: "https://www.vivino.com/wines/1140251" },
    { name: "Dom Bella Ellegance Dão", country: "Portugal", region: "Dão", type: "branco", grape: "Encruzado", abv: "13%", volume: "750ml", price: "27€", desc: "Encruzado do Dão — elegante e complexo.", photo: "", vivinoRating: 3.9, vivinoUrl: "https://www.vivino.com/wines/1146410" },
    { name: "Monte das Bagas Reserva Branco", country: "Portugal", region: "Alentejo", type: "branco", grape: "Antão Vaz, Alvarinho", abv: "13,5%", volume: "750ml", price: "43€", desc: "Branco premium do Alentejo. Cremoso e mineral.", photo: "", vivinoRating: 4.0, vivinoUrl: "https://www.vivino.com/wines/1142876" },

    // GARRAFA — ROSÉ
    { name: "Vallado Rosé", country: "Portugal", region: "Douro", type: "rose", grape: "Touriga Nacional, Tinta Roriz", abv: "12,5%", volume: "750ml", price: "19€", desc: "Ideal para partilhar, leve e fresco. Perfeito para começar.", photo: "", vivinoRating: 3.6, vivinoUrl: "https://www.vivino.com/wines/1129312" }

  ]
};
