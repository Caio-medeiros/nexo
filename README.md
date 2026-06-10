# NEXO — nexosolutions.pt

Repositório principal da plataforma NEXO. Todos os menus digitais, landing page e infra vivem aqui.
Deploy: Netlify (auto-deploy em push para `main`). Domínio: `nexosolutions.pt`.

---

## Estrutura de pastas

```
/
├── index.html              Landing page pública
├── style.css               Estilos da landing
├── script.js               Script da landing
├── nexo-analytics.js       Analytics partilhado (usado em TODOS os menus)
├── nexo-cookies.js         Cookie consent (landing)
│
├── img/                    Imagens globais (logos, heroes, previews)
├── card/                   Designs dos cartões físicos NFC/QR
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
├── privacidade/            Página de Política de Privacidade
├── termos/                 Página de Termos e Condições
├── status/                 Página de estado do serviço
│
├── supabase/               Backend (Edge Functions + schema)
│   ├── schema.sql
│   └── functions/
│
└── .well-known/            security.txt
```

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
