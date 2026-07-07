// NEXO Portal — Onboarding interactivo — CONTEÚDO DOS PASSOS
// ─────────────────────────────────────────────────────────
// Ficheiro de conteúdo puro, sem lógica. Para alterar textos,
// ícones, alvos ou CTAs, edita apenas este ficheiro.
//
// Campos:
//   id              — identificador único do passo
//   icone           — emoji mostrado no cabeçalho do tooltip
//   titulo / corpo  — texto principal
//   detalhe         — nota de valor/estatística (opcional)
//   elemento_alvo   — selector CSS do elemento a iluminar
//   tooltip_posicao — top | right | bottom | left (desktop)
//   cta_label       — texto do botão de acção (null = sem CTA)
//   cta_abre_url    — true → abre o menuUrl numa tab nova
//   cta_navega      — URL interna para onde o CTA navega
//   is_final        — true → modal de conclusão (confetti)
//
// Nota: se o elemento_alvo não existir na página actual,
// o engine salta o passo sem crashar.

const ONBOARDING_STEPS = [

  {
    id: 'menu-digital',
    icone: '📱',
    titulo: 'O seu menu já está no telemóvel dos seus clientes',
    corpo: 'Assim que chegam à mesa, os seus clientes lêem o menu sem esperar por ninguém. Actualiza um preço hoje — aparece para toda a gente em segundos.',
    detalhe: 'Restaurantes com menu digital recebem em média menos 30% de perguntas repetidas ao staff.',
    elemento_alvo: '[data-onboarding="menu-link"]',
    tooltip_posicao: 'bottom',
    cta_label: 'Ver o meu menu →',
    cta_abre_url: true,   // abre menuUrl em tab nova
  },

  {
    id: 'configuracoes',
    icone: '🎨',
    titulo: 'O seu restaurante, à sua imagem',
    corpo: 'Nome do Wi-Fi, horário, Google Maps, banners do salão. São os detalhes que fazem o seu menu parecer feito à medida — e não um template qualquer.',
    detalhe: 'Clientes que vêem o Wi-Fi no menu pedem-no 4× menos ao staff.',
    elemento_alvo: '[data-onboarding="nav-configuracoes"]',
    tooltip_posicao: 'right',
    cta_label: 'Configurar agora',
    cta_navega: '/portal/configuracoes/',
  },

  {
    id: 'pedidos',
    icone: '🍽️',
    titulo: 'Pedidos da mesa direto à cozinha, sem ruído',
    corpo: 'O cliente escolhe, confirma, e o pedido aparece no ecrã da cozinha. Sem gritos, sem papel, sem erros de comunicação entre sala e cozinha.',
    detalhe: 'Mesas servidas mais rapidamente significam mais rotação — sem contratar mais ninguém.',
    elemento_alvo: '[data-onboarding="nav-cozinha"]',
    tooltip_posicao: 'right',
    cta_label: 'Ver a cozinha',
    cta_navega: '/portal/cozinha/',
  },

  {
    id: 'alteracoes',
    icone: '✏️',
    titulo: 'Precisa de mudar algo no menu? Um pedido chega-nos em segundos',
    corpo: 'Esgotou um prato, mudou um preço, quer um especial de fim-de-semana? Escreve aqui e a NEXO aplica. Sem emails para trás e para a frente.',
    detalhe: 'A maioria das alterações é aplicada no próprio dia.',
    elemento_alvo: '[data-onboarding="nav-alteracoes"]',
    tooltip_posicao: 'right',
    cta_label: 'Fazer o primeiro pedido',
    cta_navega: '/portal/menu/',
  },

  {
    id: 'estatisticas',
    icone: '📊',
    titulo: 'Saiba o que está a funcionar — com dados reais',
    corpo: 'Quantas pessoas abriram o menu hoje, de onde vieram, quanto tempo ficaram. Informação concreta para tomar decisões — sem precisar de contratar ninguém.',
    detalhe: 'Com 2 semanas de dados já consegue perceber os dias e horas de maior procura.',
    elemento_alvo: '[data-onboarding="nav-estatisticas"]',
    tooltip_posicao: 'right',
    cta_label: 'Ver estatísticas',
    cta_navega: '/portal/estatisticas/',
  },

  {
    id: 'suporte',
    icone: '💬',
    titulo: 'Não está sozinho — a NEXO está sempre disponível',
    corpo: 'Qualquer dúvida, qualquer problema, uma mensagem chega à equipa NEXO diretamente. Sem tickets, sem chatbots, sem esperas.',
    detalhe: 'Tempo médio de resposta: menos de 2 horas em dias úteis.',
    elemento_alvo: '[data-onboarding="btn-suporte"]',
    tooltip_posicao: 'top',
    cta_label: null,   // este step não tem CTA obrigatório
  },

  {
    id: 'concluido',
    is_final: true,
    icone: '🎉',
    titulo: null,   // gerado dinamicamente com nome do restaurante
    corpo: null,    // gerado dinamicamente
    elemento_alvo: null,
  },

];
