# NEXO — nexosolutions.pt

Repositório principal da plataforma NEXO. Todos os menus digitais, landing page e infra vivem aqui.
Deploy: Netlify (auto-deploy em push para `main`). Domínio: `nexosolutions.pt`.

---

## Estrutura de pastas

```
/
├── index.html              Landing page pública (nexosolutions.pt/)
│
├── js/                     JavaScript partilhado (servido em /js/*)
│   ├── landing.js          Script da landing page
│   ├── nexo-analytics.js   Analytics partilhado (usado em TODOS os menus)
│   ├── nexo-cookies.js     Cookie consent (landing, privacidade, termos)
│   ├── nexo-security.js    Sanitização/validação partilhada (menus + portal)
│   ├── nexo-access.js      Table Access Tokens (verificação de presença)
│   └── comanda.js          Lógica de comanda partilhada
├── css/
│   └── landing.css         Estilos da landing (e privacidade/termos)
│
├── img/                    Imagens usadas pelo site (logos, heroes, og-card)
├── card/                   Cartões físicos NFC/QR (usados na landing)
├── design/                 Ficheiros-fonte de design NÃO usados pelo site
│
├── menu/                   TODOS os menus digitais vivem aqui
│   ├── _template/          Base para novos menus — NUNCA editar directamente
│   │   ├── README.md       Guia de deploy passo-a-passo
│   │   ├── config.js       Configuração de exemplo (substituir por cliente)
│   │   ├── nexo-config-taxonomy.js  Taxonomia obrigatória (categorias, tags, alergénios)
│   │   ├── index.html
│   │   ├── script.js
│   │   └── style.css
│   ├── demo/               Demo genérico para a landing page (noindex)
│   └── [slug-cliente]/     Um por cliente — ex: marisca-petisca
│       └── ...
│
├── portal/                 Portal dos restaurantes (PWA) — nexosolutions.pt/portal/
│   ├── _assets/            CSS/JS partilhado do portal
│   ├── sala/ cozinha/ ...  Uma pasta por área do portal
│   └── sw.js               Service worker (PWA)
│
├── fila/                   Ecrã público de fila de espera
├── privacidade/            Página de Política de Privacidade
├── termos/                 Página de Termos e Condições
├── status/                 Página de estado do serviço (interna)
│
├── supabase/               Backend (schema, migrações, Edge Functions)
│   ├── schema.sql
│   ├── migrations/         Migrações numeradas (aplicar por ordem)
│   └── functions/          Edge Functions (health, monitoring, digest)
│
├── docs/                   Documentação interna
│   ├── DEPLOYMENT.md       Pipeline de deploy + rollback
│   ├── NEW-CLIENT-RUNBOOK.md  Runbook para onboarding de clientes
│   ├── MENU-APPROVAL.md    Fluxo de aprovação de alterações de menu
│   ├── SETUP-NO-MANCHES.md Setup do cliente No Manches
│   ├── ACTION-PLAN.md      Plano de acção da auditoria (histórico)
│   └── FULL-AUDIT-REPORT.md  Relatório de auditoria (histórico)
│
├── scripts/                Scripts de manutenção (new-client, smoke, ícones PWA)
├── tests/                  Testes (unit + config scan + Playwright E2E)
├── netlify.toml            Headers de segurança, cache e redirects
└── .well-known/            security.txt
```

> **Nota:** os assets partilhados viviam na raiz (`/nexo-analytics.js`, `/style.css`, …).
> Foram movidos para `js/` e `css/`; o `netlify.toml` mantém redirects 301 dos
> paths antigos para não partir HTML em cache.

---

## Adicionar um novo cliente

1. Duplicar `menu/_template/` para `menu/[slug]/`
2. Seguir o guia: `menu/_template/README.md`
3. Slug format: `[tipo]-[nome]-[cidade]` (ex: `rest-solcarioca-lisboa`)
4. URL final: `https://nexosolutions.pt/menu/[slug]/`
5. Programar chips NFC com esse URL

## URLs importantes

| Destino                  | URL                                          |
|--------------------------|----------------------------------------------|
| Landing page             | `nexosolutions.pt/`                          |
| Demo (landing CTA)       | `nexosolutions.pt/menu/demo/`               |
| Template base            | `menu/_template/` (nunca publicar)          |
| Marisca Petisca          | `nexosolutions.pt/menu/marisca-petisca/`    |
| Privacidade              | `nexosolutions.pt/privacidade/`             |
| Termos                   | `nexosolutions.pt/termos/`                  |

---

## Regras criticas

- **Paths dos menus sao permanentes.** Chips NFC e QR codes apontam para eles. Nunca renomear uma pasta de cliente activo.
- **Nunca editar `menu/_template/` directamente.** Duplicar sempre.
- **`nexo-analytics.js` e partilhado.** Qualquer alteracao afecta todos os menus.
- **Slugs seguem taxonomia.** Ver `menu/_template/nexo-config-taxonomy.js`.
