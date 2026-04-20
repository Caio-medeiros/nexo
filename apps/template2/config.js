/* ═══════════════════════════════════════════════════════════════════════════
   NEXO MENU — CONFIG v5
   Cliente: O Nosso Prego (Parede · Quinta das Marianas)

   ESTRUTURA EM 9 BLOCOS — cada bloco é independente:
     1. IDENTIDADE        → nome, tagline, cidade
     2. VISUAL            → cores, fonte, hero, logo
     3. CONTACTOS         → morada, telefone, horário
     4. REDES & REVIEWS   → Instagram, Google, TripAdvisor, Facebook, WhatsApp
     5. WI-FI             → SSID e password
     6. BANNERS DINÂMICOS → por horário (almoço / happy hour / jantar)
     7. MENU              → secções e items
        ↳ badge:  "popular" | "chef" | "new"   → ícone psicológico no item
        ↳ upsell: ["sec:idx", ...]              → "Combina com..." no modal
     8. MAIS PEDIDOS      → top 3 destacados
     9. VINHOS            → carta de vinhos com filtros
   ═══════════════════════════════════════════════════════════════════════════ */

const CONFIG = {

  /* ═══ 1. IDENTIDADE ═══ */

  slug: "o-nosso-prego",
  name: "O Nosso Prego",
  tagline: {
    pt: "Restaurante, cervejaria e marisqueira",
    en: "Restaurant, brewery and seafood house",
    es: "Restaurante, cervecería y marisquería",
    fr: "Restaurant, brasserie et fruits de mer"
  },
  city: "Parede · Quinta das Marianas",
  heroStamp: {
    pt: "Desde 2009",
    en: "Since 2009",
    es: "Desde 2009",
    fr: "Depuis 2009"
  },


  /* ═══ 2. VISUAL ═══
     As cores abaixo controlam toda a identidade. Mudar aqui propaga para todo o site.
     Paleta O Nosso Prego: vermelho-vinho + gold + cream quente
     ═════════════════════ */

  brandColor: "#8B1A1A",          // vermelho-vinho (acento primário)
  brandColorDark: "#5C0F0F",      // wine burgundy (escuro)
  heroImageUrl: "https://cdn.website.dish.co/media/27/d6/1863874/O-Nosso-Prego-Parede-IMG-20191212-145139.jpg?w=1600&q=80",
  logoUrl: "https://onossoprego.pt/wp-content/uploads/2025/09/Nosso-Prego-10-2.jpg",                     // vazio = iniciais automáticas


  /* ═══ 3. CONTACTOS ═══ */

  address: "Rua Dr. João Baptista Jacquet, 120 · 2775-315 Parede",
  phone: "+351 210 186 581",
  phoneDisplay: "210 186 581",
  hours: {
    pt: "Seg–Dom · 12h–15h · 19h–23h",
    en: "Mon–Sun · 12–3pm · 7–11pm",
    es: "Lun–Dom · 12h–15h · 19h–23h",
    fr: "Lun–Dim · 12h–15h · 19h–23h"
  },
  hoursToday: {
    pt: "Aberto até 23h",
    en: "Open until 11pm",
    es: "Abierto hasta las 23h",
    fr: "Ouvert jusqu'à 23h"
  },


  /* ═══ 4. REDES & REVIEWS ═══ */

  googleReviewUrl: "https://www.google.com/search?q=O+Nosso+Prego+Parede+Quinta+das+Marianas",
  theForkReviewUrl: "https://www.thefork.pt/restaurante/o-nosso-prego-r534661/reviews",
  instagramHandle: "onossoprego",
  whatsappNumber: "351935438292",
  whatsappLoyaltyMessage: {
    pt: "Olá! Gostaria de falar com O Nosso Prego Parede.",
    en: "Hello! I would like to contact O Nosso Prego Parede.",
    es: "¡Hola! Me gustaría contactar con O Nosso Prego Parede.",
    fr: "Bonjour! Je souhaite contacter O Nosso Prego Parede."
  },


  /* ═══ 5. WI-FI ═══ */

  wifiSsid: "NossoPrego_Guest",
  wifiPassword: "prego2026",


  /* ═══ 6. BANNERS DINÂMICOS POR HORÁRIO ═══
     Cada banner tem um intervalo de horas (startH inclusive, endH exclusive).
     days: array de dias da semana — 0=Dom, 1=Seg … 6=Sáb
           omitir ou deixar vazio = todos os dias
     O banner ativo é o primeiro da lista cujo intervalo corresponde à hora atual.
     Se nenhum corresponder, o banner é ocultado automaticamente.
     ═════════════════════════════════════════════════════════════════ */

  timeBanners: [
    {
      id: "almoco",
      startH: 12, endH: 15,
      // days: [1,2,3,4,5,6,0], // todos os dias — omitido = mesmo resultado
      label: {
        pt: "Almoço", en: "Lunch", es: "Almuerzo", fr: "Déjeuner"
      },
      text: {
        pt: "Prato do dia + sobremesa + bebida · 9,95€ · Seg–Sex",
        en: "Daily dish + dessert + drink · €9.95 · Mon–Fri",
        es: "Plato del día + postre + bebida · 9,95€ · Lun–Vie",
        fr: "Plat du jour + dessert + boisson · 9,95€ · Lun–Ven"
      }
    },
    {
      id: "happy-hour",
      startH: 17, endH: 19,
      days: [1, 2, 3, 4, 5], // Seg–Sex
      label: {
        pt: "Happy Hour", en: "Happy Hour", es: "Happy Hour", fr: "Happy Hour"
      },
      text: {
        pt: "Imperial + Prego no Pão · 5,95€ · Seg–Sex, 17h–19h",
        en: "Draft Beer + Steak Sandwich · €5.95 · Mon–Fri, 5–7pm",
        es: "Caña + Prego en Pan · 5,95€ · Lun–Vie, 17h–19h",
        fr: "Bière pression + Prego · 5,95€ · Lun–Ven, 17h–19h"
      }
    },
    {
      id: "jantar",
      startH: 19, endH: 23,
      label: {
        pt: "Boa noite! Reserve a sua mesa pelo WhatsApp",
        en: "Good evening! Book your table on WhatsApp",
        es: "¡Buenas noches! Reserve su mesa por WhatsApp",
        fr: "Bonsoir! Réservez votre table sur WhatsApp"
      },
      text: {
        pt: "Cataplanas e arrozes de marisco — os favoritos do jantar",
        en: "Cataplanas and shellfish rice — dinner favourites",
        es: "Cataplanas y arroces de mariscos — favoritos de la noche",
        fr: "Cataplanas et riz aux fruits de mer — favoris du soir"
      }
    }
  ],


  /* ═══ 7. MENU ═══
     Diet tags: "V"=vegetariano  "VG"=vegan  "GF"=sem glúten  "LF"=sem lactose
     Allergens (Reg. UE 1169/2011):
       1-glúten  2-crustáceos  3-ovos  4-peixe  5-amendoim  6-soja  7-lácteos
       8-frutos-casca  9-aipo  10-mostarda  11-sésamo  12-sulfitos  13-tremoço  14-moluscos

     NOVIDADES v5:
       badge:  "popular" | "chef" | "new"
               → mostra ícone psicológico (🔥 Popular · ⭐ Chef · 🆕 Novo)
       upsell: ["secaoId:itemIndex", "secaoId:itemIndex"]
               → aparece no modal como "Combina com..."
     ═════════════════════════════════════════════════════════════════ */

  menu: [
    {
      id: "pregos",
      section: { pt: "Os Nossos Pregos", en: "Our Signature Pregos", es: "Nuestros Pregos", fr: "Nos Pregos Signature" },
      desc: { pt: "A especialidade da casa desde 2009.", en: "Our signature since 2009.", es: "Nuestra especialidad desde 2009.", fr: "Notre spécialité depuis 2009." },
      items: [
        {
          name: { pt: "Prego no Pão", en: "Steak Sandwich", es: "Prego en Pan", fr: "Prego en Pain" },
          desc: {
            pt: "Bife de vaca grelhado no nosso pão. A receita original desde 2009.",
            en: "Grilled beef steak in our bread. The original recipe since 2009.",
            es: "Filete de ternera a la parrilla en nuestro pan. La receta original.",
            fr: "Steak de bœuf grillé dans notre pain. La recette originale depuis 2009."
          },
          price: "4,95€",
          photo: "",
          diet: [],
          allergens: [1, 3, 7],
          badge: "popular",                          // 🔥 Popular
          upsell: ["petiscos:4", "entradas:1"]       // Combina com: Gamba à Guilho + Pão de Alho
        },
        {
          name: { pt: "Prego no Prato", en: "Steak with Fries and Rice", es: "Prego en Plato", fr: "Prego en Assiette" },
          desc: {
            pt: "Bife grelhado acompanhado de batata frita e arroz.",
            en: "Grilled steak with fries and rice.",
            es: "Filete a la parrilla con patatas fritas y arroz.",
            fr: "Steak grillé avec frites et riz."
          },
          price: "8,50€",
          photo: "",
          diet: [],
          allergens: [3],
          upsell: ["entradas:4", "sobremesas:0"]     // Combina com: Croquete + Arroz Doce
        },
        {
          name: { pt: "Prego no Bolo do Caco", en: "Steak Sandwich in Madeira Bread", es: "Prego en Bolo do Caco", fr: "Prego au Bolo do Caco" },
          desc: {
            pt: "Prego no tradicional pão madeirense com manteiga de alho.",
            en: "Steak in traditional Madeira bread with garlic butter.",
            es: "Prego en pan tradicional de Madeira con mantequilla de ajo.",
            fr: "Prego dans le pain traditionnel de Madère au beurre d'ail."
          },
          price: "6,20€",
          photo: "",
          diet: [],
          allergens: [1, 7]
        },
        {
          name: { pt: "Prego no Prato com Ovo", en: "Steak with Fries, Rice and Egg", es: "Prego con Huevo", fr: "Prego avec Œuf" },
          desc: {
            pt: "O clássico prego no prato com ovo estrelado.",
            en: "Classic steak plate with fried egg.",
            es: "Prego clásico con huevo frito.",
            fr: "Prego classique avec œuf au plat."
          },
          price: "9,50€",
          photo: "",
          diet: [],
          allergens: [3]
        },
        {
          name: { pt: "Bitoque à Nosso Prego", en: "O Nosso Prego Steak", es: "Bitoque à Nosso Prego", fr: "Bitoque à Nosso Prego" },
          desc: {
            pt: "A nossa versão especial do bitoque tradicional português.",
            en: "Our special version of the traditional Portuguese bitoque.",
            es: "Nuestra versión especial del bitoque tradicional portugués.",
            fr: "Notre version spéciale du bitoque traditionnel portugais."
          },
          price: "15,50€",
          photo: "",
          diet: [],
          allergens: [3, 7],
          badge: "chef",                             // ⭐ Escolha do Chef
          upsell: ["sobremesas:4", "sobremesas:5"]   // Combina com: Mousse Kit-Kat + Cheesecake
        }
      ]
    },

    {
      id: "entradas",
      section: { pt: "Entradas", en: "Starters", es: "Entrantes", fr: "Entrées" },
      desc: { pt: "Para começar.", en: "To start.", es: "Para empezar.", fr: "Pour commencer." },
      items: [
        { name: { pt: "Cesto Pão e Broa", en: "Bread & Cornbread Basket", es: "Cesta Pan y Broa", fr: "Corbeille de Pain et Broa" }, desc: { pt: "Pão do dia com broa de milho.", en: "Daily bread with cornbread.", es: "Pan del día con broa de maíz.", fr: "Pain du jour avec pain de maïs." }, price: "2,50€", photo: "", diet: ["V"], allergens: [1] },
        { name: { pt: "Pão de Alho", en: "Garlic Bread", es: "Pan de Ajo", fr: "Pain à l'Ail" }, desc: { pt: "Pão caseiro com manteiga de alho.", en: "Homemade bread with garlic butter.", es: "Pan casero con mantequilla de ajo.", fr: "Pain maison au beurre d'ail." }, price: "2,50€", photo: "", diet: ["V"], allergens: [1, 7] },
        { name: { pt: "Prato de Presunto (100gr)", en: "Portuguese Cured Ham (100g)", es: "Plato de Jamón (100g)", fr: "Jambon Cru Portugais (100g)" }, desc: { pt: "Presunto português de qualidade.", en: "Quality Portuguese cured ham.", es: "Jamón portugués de calidad.", fr: "Jambon portugais de qualité." }, price: "8,50€", photo: "", diet: ["GF", "LF"], allergens: [] },
        { name: { pt: "Queijo Curado", en: "Cured Cheese", es: "Queso Curado", fr: "Fromage Affiné" }, desc: { pt: "Queijo curado português.", en: "Portuguese cured cheese.", es: "Queso curado portugués.", fr: "Fromage affiné portugais." }, price: "3,50€", photo: "", diet: ["V", "GF"], allergens: [7] },
        { name: { pt: "Croquete", en: "Beef Croquette", es: "Croqueta de Carne", fr: "Croquette de Bœuf" }, desc: { pt: "Croquete de carne caseiro.", en: "Homemade beef croquette.", es: "Croqueta de carne casera.", fr: "Croquette de bœuf maison." }, price: "1,80€", photo: "", diet: [], allergens: [1, 3, 7], badge: "popular" }
      ]
    },

    {
      id: "petiscos",
      section: { pt: "Petiscos", en: "Snacks", es: "Tapas", fr: "Tapas" },
      desc: { pt: "Para partilhar.", en: "To share.", es: "Para compartir.", fr: "À partager." },
      items: [
        { name: { pt: "Moelas Estufadas (250gr)", en: "Chicken Gizzards (250g)", es: "Mollejas Estofadas (250g)", fr: "Gésiers Braisés (250g)" }, desc: { pt: "Moelas estufadas em vinho tinto e especiarias.", en: "Stewed in red wine and spices.", es: "Estofadas en vino tinto y especias.", fr: "Braisés au vin rouge et aux épices." }, price: "8,00€", photo: "", diet: ["GF", "LF"], allergens: [12] },
        { name: { pt: "Chouriço Assado", en: "Grilled Chorizo", es: "Chorizo Asado", fr: "Chorizo Grillé" }, desc: { pt: "Chouriço português assado na brasa.", en: "Portuguese chorizo grilled over charcoal.", es: "Chorizo portugués asado a la brasa.", fr: "Chorizo portugais grillé au charbon." }, price: "9,50€", photo: "", diet: ["GF", "LF"], allergens: [] },
        { name: { pt: "Morcela Assada", en: "Portuguese Black Sausage", es: "Morcilla Asada", fr: "Boudin Noir Grillé" }, desc: { pt: "Morcela de Estremoz grelhada.", en: "Grilled Estremoz black sausage.", es: "Morcilla de Estremoz a la parrilla.", fr: "Boudin noir d'Estremoz grillé." }, price: "9,50€", photo: "", diet: ["GF", "LF"], allergens: [] },
        { name: { pt: "Salada de Polvo (250gr)", en: "Octopus Salad (250g)", es: "Ensalada de Pulpo (250g)", fr: "Salade de Poulpe (250g)" }, desc: { pt: "Polvo cozido com cebola, salsa e azeite.", en: "Boiled octopus with onion, parsley and olive oil.", es: "Pulpo cocido con cebolla, perejil y aceite.", fr: "Poulpe cuit à l'oignon, persil et huile d'olive." }, price: "12,50€", photo: "", diet: ["GF", "LF"], allergens: [14] },
        { name: { pt: "Gamba à Guilho (230gr)", en: "Shrimps with Garlic Sauce", es: "Gambas al Ajillo", fr: "Crevettes à l'Ail" }, desc: { pt: "Gambas salteadas em azeite, alho e piri-piri.", en: "Shrimps sautéed in olive oil, garlic and chili.", es: "Gambas salteadas en aceite, ajo y guindilla.", fr: "Crevettes sautées à l'huile, ail et piment." }, price: "15,50€", photo: "", diet: ["GF", "LF"], allergens: [2], badge: "popular" },
        { name: { pt: "Amêijoa à Bulhão Pato (300gr)", en: "Clams Bulhão Pato (300g)", es: "Almejas Bulhão Pato", fr: "Palourdes Bulhão Pato" }, desc: { pt: "Amêijoas em azeite, alho, coentros e vinho branco.", en: "Clams in olive oil, garlic, coriander and white wine.", es: "Almejas en aceite, ajo, cilantro y vino blanco.", fr: "Palourdes à l'huile, ail, coriandre et vin blanc." }, price: "16,00€", photo: "", diet: ["GF", "LF"], allergens: [12, 14] },
        { name: { pt: "Pica-Pau (Vaca)", en: "Pica-Pau (Sautéed Beef)", es: "Pica-Pau (Ternera)", fr: "Pica-Pau (Bœuf)" }, desc: { pt: "Bife em cubos salteados com pickles e cerveja.", en: "Diced beef sautéed with pickles and beer.", es: "Carne en cubos salteada con encurtidos y cerveza.", fr: "Bœuf en dés sauté aux cornichons et à la bière." }, price: "13,50€", photo: "", diet: [], allergens: [10, 12] }
      ]
    },

    {
      id: "mariscos-quentes",
      section: { pt: "Mariscos Quentes", en: "Hot Seafood", es: "Mariscos Calientes", fr: "Fruits de Mer Chauds" },
      desc: { pt: "Do mar para a mesa.", en: "From sea to table.", es: "Del mar a la mesa.", fr: "De la mer à la table." },
      items: [
        { name: { pt: "Mexilhão à Bulhão Pato (300gr)", en: "Mussels Bulhão Pato", es: "Mejillones Bulhão Pato", fr: "Moules Bulhão Pato" }, desc: { pt: "Mexilhão com alho, coentros e vinho branco.", en: "Mussels with garlic, coriander and white wine.", es: "Mejillones con ajo, cilantro y vino blanco.", fr: "Moules à l'ail, coriandre et vin blanc." }, price: "11,50€", photo: "", diet: ["GF", "LF"], allergens: [12, 14] },
        { name: { pt: "Amêijoa ao Natural (300gr)", en: "Natural Clams", es: "Almejas al Natural", fr: "Palourdes Nature" }, desc: { pt: "Amêijoas abertas ao vapor.", en: "Steam-opened clams.", es: "Almejas al vapor.", fr: "Palourdes à la vapeur." }, price: "12,00€", photo: "", diet: ["GF", "LF"], allergens: [14] },
        { name: { pt: "Amêijoa à Nosso Prego (300gr)", en: "O Nosso Prego Clams", es: "Almejas à Nosso Prego", fr: "Palourdes à Nosso Prego" }, desc: { pt: "Receita exclusiva da casa.", en: "Exclusive house recipe.", es: "Receta exclusiva de la casa.", fr: "Recette exclusive maison." }, price: "16,00€", photo: "", diet: ["GF", "LF"], allergens: [12, 14], badge: "chef" },
        { name: { pt: "Gamba Frita (mín. 300gr)", en: "Fried Shrimps", es: "Gambas Fritas", fr: "Crevettes Frites" }, desc: { pt: "Gambas fritas no azeite com sal grosso.", en: "Fried in olive oil with coarse salt.", es: "Fritas en aceite con sal gruesa.", fr: "Frites à l'huile avec sel gros." }, price: "22,50€", photo: "", diet: ["GF", "LF"], allergens: [2] }
      ]
    },

    {
      id: "cataplana",
      section: { pt: "Cataplanas", en: "Portuguese Stews", es: "Cataplanas", fr: "Cataplanas" },
      desc: { pt: "Para 2 pessoas. O sabor de Portugal ao centro da mesa.", en: "For 2 people. Portugal's flavour at the centre of the table.", es: "Para 2 personas.", fr: "Pour 2 personnes." },
      items: [
        {
          name: { pt: "Cataplana de Porco e Amêijoa (2 pax)", en: "Pork & Clams Cataplana", es: "Cataplana de Cerdo y Almejas", fr: "Cataplana Porc et Palourdes" },
          desc: { pt: "O clássico alentejano numa cataplana de cobre.", en: "The Alentejo classic in a copper cataplana.", es: "El clásico alentejano.", fr: "Le classique de l'Alentejo." },
          price: "45,00€", photo: "", diet: ["LF"], allergens: [14],
          badge: "popular",
          upsell: ["entradas:0", "entradas:3"]       // Combina com: Cesto Pão + Queijo Curado
        },
        { name: { pt: "Cataplana de Garoupa c/ Gambas (2 pax)", en: "Grouper & Prawns Cataplana", es: "Cataplana de Mero", fr: "Cataplana de Mérou" }, desc: { pt: "Garoupa fresca com gambas e legumes.", en: "Fresh grouper with prawns and vegetables.", es: "Mero fresco con gambas.", fr: "Mérou frais aux crevettes." }, price: "60,00€", photo: "", diet: ["GF", "LF"], allergens: [2, 4] },
        { name: { pt: "Cataplana de Marisco (2 pax)", en: "Shellfish Cataplana", es: "Cataplana de Marisco", fr: "Cataplana de Fruits de Mer" }, desc: { pt: "Mistura de mariscos em caldo aromático.", en: "Mixed shellfish in aromatic broth.", es: "Mezcla de mariscos.", fr: "Mélange de fruits de mer." }, price: "60,00€", photo: "", diet: ["GF", "LF"], allergens: [2, 14], badge: "chef" },
        { name: { pt: "Cataplana de Tamboril e Gambas (2 pax)", en: "Monkfish & Prawns Cataplana", es: "Cataplana de Rape", fr: "Cataplana Lotte et Crevettes" }, desc: { pt: "Tamboril firme com gambas e coentros.", en: "Firm monkfish with prawns and coriander.", es: "Rape firme con gambas.", fr: "Lotte ferme aux crevettes." }, price: "77,50€", photo: "", diet: ["GF", "LF"], allergens: [2, 4] }
      ]
    },

    {
      id: "arroz",
      section: { pt: "Arroz", en: "Rice", es: "Arroz", fr: "Riz" },
      desc: { pt: "Sempre malandro. Para 2 pessoas.", en: "Soupy rice. For 2 people.", es: "Para 2 personas.", fr: "Pour 2 personnes." },
      items: [
        { name: { pt: "Arroz de Tamboril c/ Gambas (2 pax)", en: "Monkfish Rice with Prawns", es: "Arroz de Rape con Gambas", fr: "Riz à la Lotte et Crevettes" }, desc: { pt: "Arroz malandro com tamboril e gambas.", en: "Soupy rice with monkfish and prawns.", es: "Arroz caldoso con rape y gambas.", fr: "Riz mouillé à la lotte et crevettes." }, price: "52,50€", photo: "", diet: ["LF"], allergens: [2, 4] },
        { name: { pt: "Arroz de Marisco (2 pax)", en: "Shellfish Rice", es: "Arroz de Marisco", fr: "Riz aux Fruits de Mer" }, desc: { pt: "O clássico português com mariscos variados.", en: "Portuguese classic with mixed shellfish.", es: "El clásico portugués.", fr: "Le classique portugais." }, price: "52,50€", photo: "", diet: ["LF"], allergens: [2, 4, 14], badge: "popular" },
        { name: { pt: "Arroz de Lavagante (2 pax)", en: "Blue Lobster Rice", es: "Arroz de Bogavante", fr: "Riz au Homard" }, desc: { pt: "Lavagante azul em arroz malandro.", en: "Blue lobster in soupy rice.", es: "Bogavante azul.", fr: "Homard bleu." }, price: "70,00€", photo: "", diet: ["LF"], allergens: [2] },
        { name: { pt: "Arroz de Lagosta (2 pax)", en: "Lobster Rice", es: "Arroz de Langosta", fr: "Riz au Homard" }, desc: { pt: "Lagosta em arroz malandro — só aos fins-de-semana.", en: "Lobster rice — weekends only.", es: "Langosta en arroz caldoso.", fr: "Homard en riz mouillé." }, price: "85,00€", photo: "", diet: ["LF"], allergens: [2], badge: "new" }
      ]
    },

    {
      id: "carne",
      section: { pt: "Carne", en: "Meat", es: "Carne", fr: "Viande" },
      desc: { pt: "A qualidade da carne é o nosso nome.", en: "Quality meat is our name.", es: "La calidad de la carne.", fr: "La qualité de la viande." },
      items: [
        { name: { pt: "Alheira de Mirandela", en: "Mirandela Sausage", es: "Alheira de Mirandela", fr: "Alheira de Mirandela" }, desc: { pt: "Enchido tradicional com ovo e batata frita.", en: "Traditional sausage with egg and fries.", es: "Embutido tradicional.", fr: "Saucisse traditionnelle." }, price: "11,50€", photo: "", diet: ["LF"], allergens: [1, 3] },
        { name: { pt: "Bife de Frango", en: "Chicken Steak", es: "Filete de Pollo", fr: "Steak de Poulet" }, desc: { pt: "Peito de frango grelhado com batata frita.", en: "Grilled chicken breast with fries.", es: "Pechuga de pollo a la plancha.", fr: "Filet de poulet grillé." }, price: "13,00€", photo: "", diet: ["LF"], allergens: [] },
        { name: { pt: "Secretos de Porco", en: "Iberian Pork", es: "Secreto Ibérico", fr: "Secreto de Porc Ibérique" }, desc: { pt: "Secretos de porco preto grelhados.", en: "Grilled Iberian pork secreto.", es: "Secreto ibérico a la brasa.", fr: "Secreto de porc ibérique grillé." }, price: "14,50€", photo: "", diet: ["GF", "LF"], allergens: [] },
        { name: { pt: "Piano Grelhado", en: "Grilled Pork Ribs", es: "Costillar de Cerdo", fr: "Travers de Porc Grillé" }, desc: { pt: "Costeletas de porco no carvão.", en: "Charcoal-grilled pork ribs.", es: "Costillar a la brasa.", fr: "Travers grillé au charbon." }, price: "15,00€", photo: "", diet: ["GF", "LF"], allergens: [] },
        { name: { pt: "Costeletas de Borrego", en: "Grilled Lamb Chops", es: "Chuletitas de Cordero", fr: "Côtelettes d'Agneau" }, desc: { pt: "Costeletas de borrego grelhadas com alecrim.", en: "Grilled lamb chops with rosemary.", es: "Chuletitas al romero.", fr: "Côtelettes au romarin." }, price: "14,00€", photo: "", diet: ["GF", "LF"], allergens: [] },
        { name: { pt: "Bife de Vitela c/ Pimenta Verde", en: "Veal Steak with Green Pepper", es: "Ternera con Pimienta Verde", fr: "Veau Sauce Poivre Vert" }, desc: { pt: "Vitela grelhada com molho de pimenta verde.", en: "Grilled veal with green peppercorn sauce.", es: "Ternera con salsa de pimienta verde.", fr: "Veau sauce poivre vert." }, price: "17,50€", photo: "", diet: [], allergens: [7, 10, 12] },
        { name: { pt: "Bife de Vitela c/ Molho de Café", en: "Veal Steak with Coffee Sauce", es: "Ternera con Salsa de Café", fr: "Veau Sauce Café" }, desc: { pt: "Assinatura da casa — vitela com molho de café.", en: "House signature — veal with coffee sauce.", es: "Especialidad — ternera con café.", fr: "Spécialité — veau sauce café." }, price: "17,50€", photo: "", diet: [], allergens: [7, 12], badge: "chef" },
        { name: { pt: "Costeletas de Novilho", en: "Beef Chop", es: "Chuletón de Ternera", fr: "Côte de Bœuf" }, desc: { pt: "Costeletas de novilho maturado.", en: "Aged beef chop.", es: "Chuletón madurado.", fr: "Côte de bœuf maturée." }, price: "20,00€", photo: "", diet: ["GF", "LF"], allergens: [] },
        { name: { pt: "Espetada de Vitela", en: "Veal Skewer", es: "Espeto de Ternera", fr: "Brochette de Veau" }, desc: { pt: "Espetada de vitela na brasa com louro.", en: "Charcoal-grilled veal skewer with bay leaf.", es: "Espeto a la brasa.", fr: "Brochette au charbon." }, price: "19,00€", photo: "", diet: ["GF", "LF"], allergens: [] },
        { name: { pt: "Naco na Pedra", en: "Steak on Stone", es: "Entrecot en Piedra", fr: "Pavé sur Pierre" }, desc: { pt: "Naco de novilho servido em pedra a 400°C.", en: "Beef served on 400°C stone.", es: "Ternera en piedra caliente.", fr: "Bœuf sur pierre chaude." }, price: "22,50€", photo: "", diet: ["GF", "LF"], allergens: [], badge: "popular" },
        { name: { pt: "Picanha", en: "Picanha", es: "Picanha", fr: "Picanha" }, desc: { pt: "Picanha à brasileira, fatiada à mesa.", en: "Brazilian-style picanha, sliced tableside.", es: "Picanha brasileña.", fr: "Picanha brésilienne." }, price: "20,00€", photo: "", diet: ["GF", "LF"], allergens: [] }
      ]
    },

    {
      id: "peixe",
      section: { pt: "Peixe", en: "Fish", es: "Pescado", fr: "Poisson" },
      desc: { pt: "Fresco, do Atlântico.", en: "Fresh, from the Atlantic.", es: "Fresco del Atlántico.", fr: "Frais de l'Atlantique." },
      items: [
        { name: { pt: "Bacalhau à Nosso Prego", en: "O Nosso Prego Codfish", es: "Bacalao à Nosso Prego", fr: "Morue à Nosso Prego" }, desc: { pt: "Receita exclusiva da casa com bacalhau e broa.", en: "Exclusive house recipe with codfish and cornbread.", es: "Receta exclusiva.", fr: "Recette exclusive." }, price: "12,50€", photo: "", diet: ["LF"], allergens: [1, 4], badge: "chef" },
        { name: { pt: "Salmão Grelhado", en: "Grilled Salmon", es: "Salmón a la Parrilla", fr: "Saumon Grillé" }, desc: { pt: "Posta de salmão grelhada com legumes.", en: "Grilled salmon with vegetables.", es: "Salmón con verduras.", fr: "Saumon aux légumes." }, price: "13,50€", photo: "", diet: ["GF", "LF"], allergens: [4] },
        { name: { pt: "Chocos Grelhados", en: "Grilled Cuttlefish", es: "Sepia a la Parrilla", fr: "Seiche Grillée" }, desc: { pt: "Chocos grelhados com arroz de tinta.", en: "Grilled cuttlefish with ink rice.", es: "Sepia con arroz negro.", fr: "Seiche et riz noir." }, price: "14,00€", photo: "", diet: ["LF"], allergens: [14] },
        { name: { pt: "Robalo Escalado", en: "Grilled Sea Bass", es: "Lubina a la Parrilla", fr: "Bar Grillé" }, desc: { pt: "Robalo inteiro aberto e grelhado na brasa.", en: "Whole sea bass charcoal-grilled.", es: "Lubina entera a la brasa.", fr: "Bar entier au charbon." }, price: "13,50€", photo: "", diet: ["GF", "LF"], allergens: [4] },
        { name: { pt: "Polvo à Lagareiro", en: "Roasted Octopus", es: "Pulpo a Feira", fr: "Poulpe Rôti" }, desc: { pt: "Polvo assado no forno com batata a murro e azeite.", en: "Oven-roasted octopus with smashed potatoes.", es: "Pulpo al horno.", fr: "Poulpe au four." }, price: "25,00€", photo: "", diet: ["GF", "LF"], allergens: [14], badge: "popular" },
        { name: { pt: "Bacalhau à Lagareiro", en: "Roasted Codfish", es: "Bacalao à Lagareiro", fr: "Morue Rôtie" }, desc: { pt: "Posta de bacalhau no forno com batata a murro.", en: "Oven-roasted codfish with smashed potatoes.", es: "Bacalao al horno.", fr: "Morue au four." }, price: "22,50€", photo: "", diet: ["LF"], allergens: [4] }
      ]
    },

    {
      id: "sobremesas",
      section: { pt: "Sobremesas", en: "Desserts", es: "Postres", fr: "Desserts" },
      desc: { pt: "Para acabar em grande.", en: "End on a high note.", es: "Para acabar a lo grande.", fr: "Pour finir en beauté." },
      items: [
        { name: { pt: "Arroz Doce", en: "Rice Pudding", es: "Arroz con Leche", fr: "Riz au Lait" }, desc: { pt: "Arroz doce cremoso com canela.", en: "Creamy rice pudding with cinnamon.", es: "Arroz con leche y canela.", fr: "Riz au lait à la cannelle." }, price: "3,95€", photo: "", diet: ["V"], allergens: [7], badge: "popular" },
        { name: { pt: "Baba de Camelo", en: "Caramel Mousse", es: "Baba de Camello", fr: "Mousse au Caramel" }, desc: { pt: "Mousse de caramelo tradicional portuguesa.", en: "Traditional Portuguese caramel mousse.", es: "Mousse de caramelo.", fr: "Mousse au caramel." }, price: "3,95€", photo: "", diet: ["V"], allergens: [3, 7] },
        { name: { pt: "Leite Creme", en: "Portuguese Crème Brûlée", es: "Crema Quemada", fr: "Crème Brûlée" }, desc: { pt: "Creme com açúcar queimado.", en: "Cream with burnt sugar.", es: "Crema con azúcar quemado.", fr: "Crème au sucre brûlé." }, price: "3,95€", photo: "", diet: ["V"], allergens: [3, 7] },
        { name: { pt: "Mousse de Chocolate", en: "Chocolate Mousse", es: "Mousse de Chocolate", fr: "Mousse au Chocolat" }, desc: { pt: "Mousse de chocolate negro caseira.", en: "Homemade dark chocolate mousse.", es: "Mousse de chocolate negro.", fr: "Mousse au chocolat noir." }, price: "3,95€", photo: "", diet: ["V"], allergens: [3, 7] },
        { name: { pt: "Mousse de Kit-Kat", en: "Kit-Kat Mousse", es: "Mousse de Kit-Kat", fr: "Mousse Kit-Kat" }, desc: { pt: "Mousse de chocolate com pedaços de Kit-Kat.", en: "Chocolate mousse with Kit-Kat pieces.", es: "Mousse con trozos de Kit-Kat.", fr: "Mousse aux morceaux de Kit-Kat." }, price: "3,95€", photo: "", diet: ["V"], allergens: [1, 3, 7, 8], badge: "new" },
        { name: { pt: "Cheesecake", en: "Cheesecake", es: "Cheesecake", fr: "Cheesecake" }, desc: { pt: "Cheesecake com coulis de frutos vermelhos.", en: "Cheesecake with red fruit coulis.", es: "Cheesecake con frutos rojos.", fr: "Cheesecake aux fruits rouges." }, price: "4,50€", photo: "", diet: ["V"], allergens: [1, 3, 7] }
      ]
    }
  ],


  /* ═══ 8. MAIS PEDIDOS ═══
     Top 3 items destacados. refId = "sectionId:itemIndex"
     Ranking automático: primeiro = #01, segundo = #02, terceiro = #03
     ═════════════════════════════════════════════════════════════════ */

  mostOrdered: [
    {
      refId: "pregos:0",
      badge: { pt: "A lenda da casa", en: "House legend", es: "Leyenda de la casa", fr: "La légende maison" }
    },
    {
      refId: "cataplana:0",
      badge: { pt: "Clássico alentejano", en: "Alentejo classic", es: "Clásico alentejano", fr: "Classique alentejano" }
    },
    {
      refId: "peixe:4",
      badge: { pt: "Favorito dos clientes", en: "Customer favourite", es: "Favorito", fr: "Favori des clients" }
    }
  ],


  /* ═══ 9. VINHOS ═══ */

  wines: [
    { name: "Esporão Reserva Tinto", country: "Portugal", region: "Alentejo", type: "tinto", grape: "Aragonez, Trincadeira, Cabernet Sauvignon", abv: "14,5%", volume: "750ml", price: "28,50€", desc: "Tinto encorpado do Alentejo com notas de frutos pretos e especiarias. Estágio de 12 meses em barrica.", photo: "", vivinoRating: 3.8, vivinoUrl: "https://www.vivino.com/wines/1138696" },
    { name: "Quinta do Crasto Douro Tinto", country: "Portugal", region: "Douro", type: "tinto", grape: "Touriga Nacional, Touriga Franca, Tinta Roriz", abv: "14%", volume: "750ml", price: "24,00€", desc: "Clássico do Douro com taninos elegantes. Ideal para carnes vermelhas.", photo: "", vivinoRating: 3.9, vivinoUrl: "https://www.vivino.com/wines/1146697" },
    { name: "Pêra-Manca Tinto", country: "Portugal", region: "Alentejo", type: "tinto", grape: "Aragonez, Trincadeira", abv: "13,5%", volume: "750ml", price: "85,00€", desc: "Ícone do Alentejo. Vinho para momentos especiais.", photo: "", vivinoRating: 4.4, vivinoUrl: "https://www.vivino.com/wines/1158197" },
    { name: "Casa Ferreirinha Vinha Grande Tinto", country: "Portugal", region: "Douro", type: "tinto", grape: "Touriga Franca, Tinta Roriz", abv: "13,5%", volume: "750ml", price: "19,50€", desc: "Equilibrado, fácil de beber. Boa relação qualidade/preço.", photo: "", vivinoRating: 3.7, vivinoUrl: "https://www.vivino.com/wines/1131804" },
    { name: "Soalheiro Alvarinho", country: "Portugal", region: "Vinho Verde", type: "branco", grape: "Alvarinho", abv: "12,5%", volume: "750ml", price: "22,00€", desc: "Alvarinho de Monção e Melgaço. Fresco, mineral, com aromas cítricos.", photo: "", vivinoRating: 3.9, vivinoUrl: "https://www.vivino.com/wines/1146410" },
    { name: "Herdade do Esporão Branco", country: "Portugal", region: "Alentejo", type: "branco", grape: "Antão Vaz, Roupeiro, Arinto", abv: "13%", volume: "750ml", price: "16,50€", desc: "Branco alentejano com notas tropicais e final fresco.", photo: "", vivinoRating: 3.7, vivinoUrl: "https://www.vivino.com/wines/1138698" },
    { name: "Quinta dos Roques Encruzado", country: "Portugal", region: "Dão", type: "branco", grape: "Encruzado", abv: "13%", volume: "750ml", price: "20,00€", desc: "Encruzado do Dão — a melhor casta branca portuguesa. Elegante e complexo.", photo: "", vivinoRating: 4.0, vivinoUrl: "https://www.vivino.com/wines/1142876" },
    { name: "Aveleda Loureiro", country: "Portugal", region: "Vinho Verde", type: "verde", grape: "Loureiro", abv: "11%", volume: "750ml", price: "12,50€", desc: "Clássico verde jovem e aromático. Perfeito com mariscos.", photo: "", vivinoRating: 3.5, vivinoUrl: "https://www.vivino.com/wines/1129823" },
    { name: "Casal Garcia", country: "Portugal", region: "Vinho Verde", type: "verde", grape: "Loureiro, Trajadura", abv: "9,5%", volume: "750ml", price: "9,50€", desc: "Verde leve e refrescante. Popular e acessível.", photo: "", vivinoRating: 3.4, vivinoUrl: "https://www.vivino.com/wines/1124735" },
    { name: "Mateus Rosé", country: "Portugal", region: "Douro", type: "rose", grape: "Baga, Rufete", abv: "11%", volume: "750ml", price: "11,50€", desc: "O rosé português mais famoso. Leve e ligeiramente gaseificado.", photo: "", vivinoRating: 3.3, vivinoUrl: "https://www.vivino.com/wines/1125513" },
    { name: "Luís Pato Espumante Bruto", country: "Portugal", region: "Bairrada", type: "espumante", grape: "Baga, Maria Gomes", abv: "12,5%", volume: "750ml", price: "22,00€", desc: "Espumante da Bairrada, método tradicional. Fino e persistente.", photo: "", vivinoRating: 3.8, vivinoUrl: "https://www.vivino.com/wines/1138512" },
    { name: "Murganheira Bruto", country: "Portugal", region: "Távora-Varosa", type: "espumante", grape: "Chardonnay, Pinot Noir", abv: "12%", volume: "750ml", price: "18,00€", desc: "Espumante nacional de referência com bolha fina.", photo: "", vivinoRating: 3.6, vivinoUrl: "https://www.vivino.com/wines/1140251" },
    { name: "Rioja Reserva Campo Viejo", country: "Espanha", region: "Rioja", type: "tinto", grape: "Tempranillo", abv: "13,5%", volume: "750ml", price: "17,50€", desc: "Tempranillo da Rioja. Notas de baunilha e frutos vermelhos maduros.", photo: "", vivinoRating: 3.7, vivinoUrl: "https://www.vivino.com/wines/1129312" },
    { name: "Malbec Catena Argentina", country: "Argentina", region: "Mendoza", type: "tinto", grape: "Malbec", abv: "13,5%", volume: "750ml", price: "22,50€", desc: "Malbec argentino premium. Intenso e encorpado.", photo: "", vivinoRating: 4.1, vivinoUrl: "https://www.vivino.com/wines/1137817" }
  ]
};