/* ═══════════════════════════════════════════════════════════════════════════
   NEXO MENU — CONFIG

   ESTE É O ÚNICO FICHEIRO QUE EDITAS PARA UM NOVO CLIENTE.
   Não toques em index.html, style.css ou script.js.

   COMO USAR:
   1. Duplica esta pasta e renomeia com o slug do cliente (ex: sushi-zen/)
   2. Edita APENAS este ficheiro config.js com os dados do cliente
   3. Substitui assets/hero.webp e assets/logo.webp pelas fotos reais
   4. Faz push para Netlify/GitHub → live em 30 segundos

   CHECKLIST POR CLIENTE:
   □ Nome, slug, cidade
   □ brandColor (hex principal do cliente)
   □ heroImageUrl (foto do restaurante, 1600×900 WebP)
   □ logoUrl (se tiver logo — senão usa iniciais automáticas)
   □ URLs de review (Google, TripAdvisor, Facebook)
   □ Instagram handle, WhatsApp number
   □ Wi-Fi SSID + password
   □ Endereço e horário
   □ Menu completo com fotos dos pratos
   ═══════════════════════════════════════════════════════════════════════════ */

const CONFIG = {

  // ══════════ IDENTIDADE ══════════
  slug: "taberna-do-tejo",
  name: "Taberna do Tejo",
  tagline: {
    pt: "Cozinha portuguesa contemporânea",
    en: "Contemporary Portuguese cuisine",
    es: "Cocina portuguesa contemporánea",
    fr: "Cuisine portugaise contemporaine"
  },
  city: "Alfama, Lisboa",

  // ══════════ VISUAL ══════════
  heroImageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80",
  logoUrl: "",                   // deixa vazio para usar iniciais automáticas
  brandColor: "#C2410C",         // cor primária do cliente
  brandColorDark: "#9A3412",

  // ══════════ REVIEWS (3 plataformas) ══════════
  googleReviewUrl: "https://g.page/r/taberna-do-tejo/review",
  tripadvisorReviewUrl: "https://www.tripadvisor.com/UserReview-g189158-taberna-do-tejo.html",
  facebookReviewUrl: "https://www.facebook.com/tabernadotejo/reviews",

  // ══════════ REDES SOCIAIS ══════════
  instagramHandle: "tabernadotejo",
  whatsappNumber: "351912345678",         // sem + nem espaços

  // ══════════ MENSAGENS WHATSAPP (por idioma, {mesa} substituído automaticamente) ══════════
  whatsappStaffMessage: {
    pt: "Olá! Estou na mesa {mesa} da Taberna do Tejo.",
    en: "Hello! I'm at table {mesa} at Taberna do Tejo.",
    es: "¡Hola! Estoy en la mesa {mesa} de Taberna do Tejo.",
    fr: "Bonjour! Je suis à la table {mesa} à Taberna do Tejo."
  },

  bookingUrl: "https://wa.me/351912345678?text=Gostaria%20de%20reservar%20mesa",

  // ══════════ WI-FI ══════════
  wifiSsid: "Taberna_Tejo_Guest",
  wifiPassword: "bacalhau2025",

  // ══════════ BANNER DA SEMANA (editável via WhatsApp) ══════════
  todaysSpecial: {
    pt: "Bacalhau à Brás com ovos caseiros — 14,50€",
    en: "Cod à Brás with farm eggs — €14.50",
    es: "Bacalao à Brás con huevos caseros — 14,50€",
    fr: "Morue à Brás aux œufs fermiers — 14,50€"
  },

  // ══════════ EVENTOS (array vazio = secção não aparece) ══════════
  events: [
    {
      date: { pt: "Sex 18 Abr", en: "Fri 18 Apr", es: "Vie 18 Abr", fr: "Ven 18 Avr" },
      title: { pt: "Noite de Fado", en: "Fado Night", es: "Noche de Fado", fr: "Soirée Fado" },
      desc: { pt: "Carla Rocha ao vivo · 21h", en: "Carla Rocha live · 9pm", es: "Carla Rocha en vivo · 21h", fr: "Carla Rocha en direct · 21h" }
    },
    {
      date: { pt: "Sáb 19 Abr", en: "Sat 19 Apr", es: "Sáb 19 Abr", fr: "Sam 19 Avr" },
      title: { pt: "Degustação de vinhos", en: "Wine tasting", es: "Cata de vinos", fr: "Dégustation de vins" },
      desc: { pt: "5 vinhos do Douro · 19h · 25€", en: "5 Douro wines · 7pm · €25", es: "5 vinos del Duero · 19h · 25€", fr: "5 vins du Douro · 19h · 25€" }
    }
  ],

  // ══════════ CARTA DE VINHOS (link para menu separado — deixa vazio se não tiver) ══════════
  wineMenuUrl: "https://menu.nexo.pt/taberna-do-tejo/vinhos",

  // ══════════ ENDEREÇO E HORÁRIO ══════════
  address: "Rua dos Bacalhoeiros 42, 1100-071 Lisboa",
  hours: {
    pt: "Ter–Dom · 12h–15h · 19h–23h",
    en: "Tue–Sun · 12–3pm · 7–11pm",
    es: "Mar–Dom · 12h–15h · 19h–23h",
    fr: "Mar–Dim · 12h–15h · 19h–23h"
  },
  hoursToday: {                    // texto curto mostrado no hero
    pt: "Aberto até 23h",
    en: "Open until 11pm",
    es: "Abierto hasta las 23h",
    fr: "Ouvert jusqu'à 23h"
  },

  // ══════════ MENU ══════════
  // diet: V=vegetariano, VG=vegan, GF=sem glúten, LF=sem lactose
  // allergens (Reg. UE 1169/2011):
  //   1-glúten, 2-crustáceos, 3-ovos, 4-peixe, 5-amendoim, 6-soja, 7-lácteos,
  //   8-frutos de casca, 9-aipo, 10-mostarda, 11-sésamo, 12-sulfitos, 13-tremoço, 14-moluscos
  menu: [
    {
      id: "entradas",
      section: { pt: "Entradas", en: "Starters", es: "Entrantes", fr: "Entrées" },
      desc: { pt: "Para começar.", en: "To start.", es: "Para empezar.", fr: "Pour commencer." },
      items: [
        {
          name: { pt: "Pão da casa com manteiga de alho", en: "House bread with garlic butter", es: "Pan de la casa con mantequilla de ajo", fr: "Pain maison, beurre à l'ail" },
          desc: {
            pt: "Fermentação lenta de 48 horas, farinha do moinho da Atalaia, manteiga batida à mão com alho assado.",
            en: "48-hour slow fermentation, Atalaia mill flour, hand-beaten butter with roasted garlic.",
            es: "Fermentación lenta de 48 horas, harina del molino de Atalaia, mantequilla batida a mano con ajo asado.",
            fr: "Fermentation lente de 48h, farine du moulin d'Atalaia, beurre battu main à l'ail rôti."
          },
          price: "3,50€",
          photo: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80",
          diet: ["V"],
          allergens: [1, 7]
        },
        {
          name: { pt: "Peixinhos da horta", en: "Tempura green beans", es: "Tempura de judías verdes", fr: "Haricots verts tempura" },
          desc: {
            pt: "Feijão-verde em tempura estaladiça, maionese de limão caseira com raspa e coentros.",
            en: "Crispy tempura green beans, homemade lemon mayo with zest and coriander.",
            es: "Judías verdes en tempura crujiente, mayonesa casera de limón con ralladura y cilantro.",
            fr: "Haricots verts en tempura croustillante, mayonnaise citron maison avec zeste et coriandre."
          },
          price: "8,00€",
          photo: "https://images.unsplash.com/photo-1625944525533-473f1b3d9684?w=400&q=80",
          diet: ["V"],
          allergens: [1, 3]
        },
        {
          name: { pt: "Amêijoas à Bulhão Pato", en: "Clams Bulhão Pato", es: "Almejas Bulhão Pato", fr: "Palourdes Bulhão Pato" },
          desc: {
            pt: "Azeite virgem extra do Alentejo, alho, coentros frescos, vinho branco de Colares.",
            en: "Extra virgin Alentejo olive oil, garlic, fresh coriander, Colares white wine.",
            es: "Aceite virgen extra del Alentejo, ajo, cilantro fresco, vino blanco de Colares.",
            fr: "Huile d'olive extra de l'Alentejo, ail, coriandre fraîche, vin blanc de Colares."
          },
          price: "12,00€",
          photo: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=400&q=80",
          diet: ["GF", "LF"],
          allergens: [12, 14]
        }
      ]
    },
    {
      id: "pratos",
      section: { pt: "Pratos", en: "Mains", es: "Principales", fr: "Plats" },
      desc: { pt: "Do mar e da terra.", en: "From sea and land.", es: "Del mar y de la tierra.", fr: "De la mer et de la terre." },
      items: [
        {
          name: { pt: "Bacalhau à Brás", en: "Cod à Brás", es: "Bacalao à Brás", fr: "Morue à Brás" },
          desc: {
            pt: "Bacalhau desfiado à mão, batata palha caseira, ovos de galinhas criadas ao ar livre, azeitonas Galega.",
            en: "Hand-shredded cod, homemade straw potatoes, free-range eggs, Galega olives.",
            es: "Bacalao desmenuzado a mano, patatas paja caseras, huevos de gallinas camperas, aceitunas Galega.",
            fr: "Morue effilochée à la main, pommes paille maison, œufs de poules élevées en plein air, olives Galega."
          },
          price: "14,50€",
          photo: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80",
          diet: ["LF"],
          allergens: [3, 4]
        },
        {
          name: { pt: "Polvo à lagareiro", en: "Grilled octopus", es: "Pulpo a la brasa", fr: "Poulpe grillé" },
          desc: {
            pt: "Polvo grelhado sobre carvão, batata a murro no azeite do Alentejo, coentros e alho assado.",
            en: "Charcoal-grilled octopus, smashed potatoes in Alentejo olive oil, coriander and roasted garlic.",
            es: "Pulpo a la brasa, patatas al puño en aceite del Alentejo, cilantro y ajo asado.",
            fr: "Poulpe grillé au charbon, pommes écrasées à l'huile de l'Alentejo, coriandre et ail rôti."
          },
          price: "19,00€",
          photo: "https://images.unsplash.com/photo-1580959375944-abd7e991f971?w=400&q=80",
          diet: ["GF", "LF"],
          allergens: [14]
        },
        {
          name: { pt: "Risotto de cogumelos", en: "Mushroom risotto", es: "Risotto de setas", fr: "Risotto aux champignons" },
          desc: {
            pt: "Arroz carnaroli, mistura de cogumelos shiitake e portobello, tomilho, azeite trufado.",
            en: "Carnaroli rice, shiitake and portobello mushroom mix, thyme, truffle oil.",
            es: "Arroz carnaroli, mezcla de shiitake y portobello, tomillo, aceite trufado.",
            fr: "Riz carnaroli, mélange de shiitake et portobello, thym, huile truffée."
          },
          price: "15,00€",
          photo: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80",
          diet: ["V"],
          allergens: [7, 9, 12]
        },
        {
          name: { pt: "Bife da vazia com pimenta", en: "Pepper sirloin steak", es: "Solomillo a la pimienta", fr: "Faux-filet au poivre" },
          desc: {
            pt: "Bife da vazia de 250g maturado 30 dias, molho de pimenta verde, batata frita caseira.",
            en: "250g 30-day dry-aged sirloin, green peppercorn sauce, homemade fries.",
            es: "Solomillo de 250g madurado 30 días, salsa de pimienta verde, patatas fritas caseras.",
            fr: "Faux-filet 250g maturé 30 jours, sauce au poivre vert, frites maison."
          },
          price: "22,00€",
          photo: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
          diet: [],
          allergens: [7, 10, 12]
        }
      ]
    },
    {
      id: "sobremesas",
      section: { pt: "Sobremesas", en: "Desserts", es: "Postres", fr: "Desserts" },
      desc: { pt: "Para acabar em grande.", en: "End on a high note.", es: "Para acabar a lo grande.", fr: "Pour finir en beauté." },
      items: [
        {
          name: { pt: "Pastel de nata artesanal", en: "Artisanal custard tart", es: "Pastel de nata artesanal", fr: "Pastel de nata artisanal" },
          desc: {
            pt: "Feito na casa todas as manhãs. Massa folhada 64 camadas, creme de ovos. Canela e açúcar em pó a pedido.",
            en: "Made fresh every morning. 64-layer puff pastry, egg custard. Cinnamon and powdered sugar on request.",
            es: "Hecho cada mañana. Hojaldre de 64 capas, crema de huevos. Canela y azúcar glas a petición.",
            fr: "Fait chaque matin. Pâte feuilletée 64 couches, crème aux œufs. Cannelle et sucre glace sur demande."
          },
          price: "2,50€",
          photo: "https://images.unsplash.com/photo-1589352912336-ec2c5f55d6f8?w=400&q=80",
          diet: ["V"],
          allergens: [1, 3, 7]
        },
        {
          name: { pt: "Mousse de chocolate 70%", en: "70% chocolate mousse", es: "Mousse de chocolate 70%", fr: "Mousse au chocolat 70%" },
          desc: {
            pt: "Chocolate negro 70% de origem São Tomé, flor de sal, azeite virgem extra.",
            en: "70% São Tomé dark chocolate, flor de sal, extra virgin olive oil.",
            es: "Chocolate negro 70% de São Tomé, flor de sal, aceite virgen extra.",
            fr: "Chocolat noir 70% de São Tomé, fleur de sel, huile d'olive extra."
          },
          price: "6,00€",
          photo: "https://images.unsplash.com/photo-1511715282680-fbf93a50e721?w=400&q=80",
          diet: ["V", "GF"],
          allergens: [3, 7]
        },
        {
          name: { pt: "Gelado de azeite e limão", en: "Olive oil & lemon sorbet", es: "Helado de aceite y limón", fr: "Sorbet huile d'olive et citron" },
          desc: {
            pt: "Produção artesanal do Ribatejo. Azeite Olival da Risca, limão da Tavira.",
            en: "Artisanal production from Ribatejo. Olival da Risca oil, Tavira lemon.",
            es: "Producción artesanal del Ribatejo. Aceite Olival da Risca, limón de Tavira.",
            fr: "Production artisanale du Ribatejo. Huile Olival da Risca, citron de Tavira."
          },
          price: "5,00€",
          photo: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&q=80",
          diet: ["VG", "GF", "LF"],
          allergens: []
        }
      ]
    }
  ]
};