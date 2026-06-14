# NEXO — Runbook de Novo Cliente

> Passo-a-passo para colocar um novo cliente 100% funcional (menu + portal +
> reservas + sala em directo + fila + analytics). Seguir por ordem.
> Tempo típico: 30–60 min depois de ter o conteúdo do cliente.

---

## 0. Recolher do cliente (antes de começar)

- [ ] Conteúdo do menu (pratos, descrições, preços) — idealmente em texto/Excel
- [ ] Logótipo (PNG/SVG, fundo transparente)
- [ ] Cores da marca (hex primária + secundária)
- [ ] Link de avaliações Google (Google Maps → Partilhar → copiar)
- [ ] Link TheFork (se aplicável)
- [ ] **WhatsApp do restaurante** para pedidos e alertas de reserva
- [ ] Nº de mesas (para hardware NFC)
- [ ] Idiomas (default: PT + EN)
- [ ] Horário de funcionamento (para reservas)
- [ ] Email do dono (para o login do portal)

> Estes pontos estão explicados ao cliente em **Portal → Guia** (`/portal/guia/`).

---

## 1. Slug

Formato: `tipo-nome-cidade` (minúsculas, sem acentos/espaços).
Ex.: `rest-solcarioca-lisboa`. Confirmar que não existe já em `/menu/`.

---

## 2. Scaffold dos ficheiros (automático)

```bash
scripts/new-client.sh rest-solcarioca-lisboa "Sol Carioca" rest
```

Cria `menu/<slug>/` e `reservar/<slug>/` com o slug já preenchido
(slug, nome, `callStaffTopic`, `ESPACO_SLUG`, `ESPACO_TIPO`).

> A página de reservas (`reservar/<slug>/`) **não precisa de edição** — lê o
> slug do URL e as definições da BD.

---

## 3. Personalizar `menu/<slug>/config.js`

Editar por blocos (a estrutura está comentada no ficheiro):

| Bloco | O que mudar |
|---|---|
| 1 ESPACO | `slug`/`name` (já preenchidos), morada, etc. |
| 2 CORES | `brandColor` (cor da marca) |
| 3 IDIOMAS | idiomas ativos |
| 4 MENU | **os pratos** (nome PT/EN/ES/FR, preço, categoria, alergénios) |
| 6 REVIEWS | link Google / TheFork |
| 1/9 | `whatsappNumber` (feedback) e `orderWhatsapp` (pedidos) |

Regra de ouro: usar os nomes de categoria/alergénio de
`nexo-config-taxonomy.js` (dados comparáveis entre clientes).

No fim, confirmar que não sobrou nenhum `{{...}}`:
```bash
grep -rn "{{" menu/<slug>/
```

Credenciais Supabase (`supabaseUrl`/`supabaseAnonKey`) já vêm preenchidas do
template — são partilhadas. Não mexer.

---

## 4. Provisionar a base de dados

Abrir `supabase/provision-client.sql`, editar as 6 variáveis no topo
(slug, nome, dono, plano, mensalidade, WhatsApp de notificações) e correr no
**SQL Editor** do projeto `kgbrtbpeekhkroibsgqq`.

Cria: `clients` (espelho) + `menus` + `onboarding` + `reservation_settings`.

> Espelho: o cliente "oficial" vive no NEXO OS. Este SQL cria o espelho leve
> que o portal/menu precisam. Manter os dois alinhados.

---

## 5. Login do portal

1. Supabase → **Authentication → Add user** → email do dono + password.
2. Copiar o UUID do utilizador.
3. Correr (SQL Editor), com o slug certo:
   ```sql
   update clients set auth_user_id = '<UUID>'
     where id = (select client_id from menus where slug = '<slug>');
   ```
4. O cliente entra em `nexosolutions.pt/portal/`.

---

## 6. Reservas (opcional, se o cliente quer)

No portal do cliente → **Reservas → Configurações**:
- Ligar "Reservas activas"
- Definir capacidade, duração, antecedência, aviso mínimo
- **WhatsApp para notificações** (para o restaurante receber alertas)
- Horário de funcionamento (controla os dias/horas disponíveis)
- Mensagem de confirmação

O link público `nexosolutions.pt/reservar/<slug>/` e o QR ficam nessa página
para partilhar (Instagram, Google, porta).

---

## 7. Deploy

```bash
git add menu/<slug> reservar/<slug>
git commit -m "novo cliente: <slug>"
git push           # Netlify faz deploy automático
```

Menu: `nexosolutions.pt/menu/<slug>/`

---

## 8. Hardware NFC

Programar as tags/cartões com o URL do menu. Quantidade = nº de mesas
(+ alguns extra). Marcar `nfc_programmed` no onboarding (NEXO OS).

---

## 9. Validação final (automática)

```bash
scripts/smoke-client.sh <slug>
```

Testa pedidos, chamadas, fila, reservas, analytics, triggers e edge functions
contra produção e limpa os dados de teste. Tem de dar **0 falhas**.

Confirmar ainda no portal:
- [ ] Dashboard mostra o nome certo
- [ ] Sala em Directo recebe um pedido de teste ao vivo
- [ ] Estatísticas começam a contar visitas ao abrir o menu

---

## Mapa das features (o que liga a quê)

| Feature (menu) | Tabela | Onde aparece no portal |
|---|---|---|
| Abrir menu / ver prato | `menu_events` | Dashboard, Estatísticas |
| Pedido (Staff/WhatsApp/Grupo) | `orders_log` | Sala em Directo, Dashboard |
| Chamar empregado | `staff_calls` | Sala em Directo |
| Fila de espera | `waitlist_entries` | Sala em Directo, Fila |
| Reserva (página pública) | `reservations` | Reservas, Sala, Dashboard |
| Item esgotado | `item_availability` | Disponibilidade (e esconde no menu) |
| Tudo o acima | `portal_notifications` | Sino + Actividade (tempo real) |
| Relatório semanal | `weekly_reports` | Estatísticas (RPC `generate_weekly_report`) |

Notas técnicas relevantes:
- Os triggers de notificação são `SECURITY DEFINER` (migração 008) — inserts
  anónimos do menu criam notificações sem bater no RLS.
- As edge functions usam a **chave anon** + RPC `SECURITY DEFINER` (migração
  010), porque a service-role legada deixou de autenticar no novo sistema de
  chaves.
- `nexo-analytics.js` lê `CONFIG` lexicalmente e usa `CONFIG.slug` — garantir
  que o `config.js` tem o `slug` certo (o scaffold trata disto).
