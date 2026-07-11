# No Manches — Setup da Demo (menu + portal)

Runbook para pôr o **No Manches** (Mexican Street Food) a funcionar de ponta a
ponta: menu digital + portal (Dashboard, Modo Cozinha, Sala, Estatísticas),
**totalmente isolado da Marisca Petisca**.

- **Slug:** `rest-no-manches-lisboa`
- **Menu:** `https://nexosolutions.pt/menu/rest-no-manches-lisboa/`
- **Projeto Supabase (menus+portal):** `kgbrtbpeekhkroibsgqq`

---

## Como funciona o isolamento (porque não colide com a Marisca)

O portal é **uma só app multi-tenant** — não há um "portal do No Manches"
separado em ficheiros. A separação é por dados:

- Tudo (pedidos, analytics, comandas, chamadas, fila, notificações) é gravado
  e lido com `espaco_slug = 'rest-no-manches-lisboa'`. Como o slug é diferente
  de `marisca-petisca`, **os dados nunca se misturam**.
- O login determina o espaço: `clients.auth_user_id` → `menus.slug`. Cada
  utilizador só vê o seu espaço.
- O RLS (`owns_espaco`) garante isso ao nível da base de dados: mesmo com a
  mesma anon key, um login não consegue ler/escrever no espaço do outro.

Ou seja: **basta provisionar o No Manches como um espaço novo com o seu próprio
login.** Não é preciso duplicar nada do portal.

---

## Passo a passo (≈ 10 min)

### 1. Provisionar a base de dados  ⭐ obrigatório
No **Supabase → projeto `kgbrtbpeekhkroibsgqq` → SQL Editor**, corre:

```
supabase/provision-no-manches.sql
```

Cria `clients` + `menus` (status `active`) + `onboarding` + `venue_settings`
(8 mesas por defeito; os tokens de cada mesa são gerados automaticamente).

> **Porque é obrigatório:** sem a linha em `menus`, os writes do menu dão **401**
> (o RLS `menu_slug_exists()` rejeita slugs que não existem). É por isso que hoje
> o menu do No Manches mostra 3× 401 em `menu_events` e a Marisca não.

### 2. Criar o login do portal  ⭐ obrigatório
Não dá para fazer por SQL (é no GoTrue Auth):

1. **Supabase → Authentication → Users → Add user.**
   - Email: ex. `nomanches@nexosolutions.pt`
   - Password: define uma (será a password do portal). Marca "Auto-confirm".
2. Copia o **UUID** do utilizador criado.
3. Volta ao SQL Editor e liga-o ao espaço:

```sql
update clients set auth_user_id = '<UUID_DO_AUTH_USER>'
  where id = (select client_id from menus where slug = 'rest-no-manches-lisboa');
```

> Se saltares este passo, o login funciona mas o portal aparece **vazio**
> (não encontra o espaço do utilizador).

### 3. (Opcional) Semear números para o Dashboard/Estatísticas
Para a demo não parecer vazia (7 dias de aberturas, cliques de review, pedidos):

```
supabase/seed-no-manches-demo.sql
```

Só afeta o No Manches. Podes reverter a qualquer momento (passo 6).

### 4. Publicar os ficheiros do menu
Os ficheiros novos estão em `menu/rest-no-manches-lisboa/` (ainda por commitar).
Deploy = **push para `main`** (o GitHub Actions faz o deploy para produção
depois dos testes; auto-deploy do Netlify está OFF).

```bash
git add menu/rest-no-manches-lisboa supabase/*no-manches* SETUP-NO-MANCHES.md
git commit -m "feat(no-manches): menu demo + provisioning"
git push origin main   # ou abre PR e faz merge
```

Para testar **localmente** sem deploy: `python3 -m http.server 8888` na raiz do
repo e abre `http://localhost:8888/menu/rest-no-manches-lisboa/`.

### 5. QR codes das mesas
O menu lê a mesa do URL: **`?mesa=N`**. Os pedidos dessa mesa vão para o Modo
Cozinha e Sala com o rótulo "Mesa N".

- Mesa 3 → `https://nexosolutions.pt/menu/rest-no-manches-lisboa/?mesa=3`
- Gera 1 QR por mesa (1..8). No portal, **Configurações / Disponibilidade** têm
  gestão de QR/tokens se quiseres os QR "presença verificada".
- Para um teste rápido sem QR, é só abrir o URL com `?mesa=3` no telemóvel.

### 6. Antes do pitch real — limpar os números da demo
Para arrancar do zero à frente do cliente:

```
supabase/reset-no-manches.sql
```

Zera pedidos/analytics/comandas **só do No Manches**. Não mexe no menu nem no login.

---

## URLs para a apresentação

| O quê | URL |
|---|---|
| Menu (cliente) | `…/menu/rest-no-manches-lisboa/` |
| Menu numa mesa | `…/menu/rest-no-manches-lisboa/?mesa=3` |
| Portal — Login | `…/portal/` |
| Dashboard | `…/portal/dashboard/` |
| **Modo Cozinha** | `…/portal/cozinha/` |
| **Sala em Directo** | `…/portal/sala/` |
| Estatísticas | `…/portal/estatisticas/` |
| Fila de espera | `…/portal/fila/` |
| Disponibilidade (86 / esgotados) | `…/portal/disponibilidade/` |
| Configurações (mesas, QR) | `…/portal/configuracoes/` |

(Base em produção: `https://nexosolutions.pt`.)

---

## Guião da demo (o "wow" ao vivo)

1. Abre o **Modo Cozinha** (`/portal/cozinha/`) num ecrã/tablet, com o login do
   No Manches.
2. No telemóvel, abre o menu numa mesa: `…/?mesa=3`. Adiciona uns **Tacos Al
   Pastor ×3** e uma **Margarita**, e envia o pedido.
3. O pedido aparece **em tempo real** no Modo Cozinha (comanda da Mesa 3), e na
   **Sala em Directo** a mesa acende. → é a "tight sync".
4. Mostra o **Dashboard** e **Estatísticas** (números do seed) — aberturas de
   menu, pedidos, reviews.
5. No menu, mostra o **Happy Hour** (banner vermelho; entre as 16h–18h aparece o
   countdown ao vivo) e o toggle **×2 / ×3** dos tacos.

> Dica: tens o **Modo Cozinha** e o menu lado a lado (2 dispositivos ou 2
> janelas) para o efeito de sincronização ser imediato.

---

## Checklist rápida

- [ ] `provision-no-manches.sql` corrido (verificação mostra menu `active` + 8 mesas)
- [ ] Utilizador criado em Authentication + `auth_user_id` ligado
- [ ] (Opcional) `seed-no-manches-demo.sql` corrido
- [ ] Menu publicado (push `main`) ou a correr localmente
- [ ] Login no `/portal/` mostra dados do No Manches (e só do No Manches)
- [ ] Pedido de teste `?mesa=3` aparece no Modo Cozinha
- [ ] `reset-no-manches.sql` corrido mesmo antes do pitch

---

## Troubleshooting

| Sintoma | Causa | Solução |
|---|---|---|
| Menu dá **401** em `menu_events`/comandas | Falta a linha em `menus` | Corre `provision-no-manches.sql` |
| Portal entra mas aparece **vazio** | `clients.auth_user_id` não ligado | Corre o `update` do passo 2 |
| Portal mostra dados da **Marisca** | Login errado (user da Marisca) | Usa o login criado para o No Manches |
| Pedido não chega ao Modo Cozinha | Slug/mesa errados, ou `menus` em falta | Confirma `?mesa=N` e o passo 1 |
| Sala sem mesas | `venue_settings` em falta | Passo 1 cria `table_count = 8` |

---

## Ficheiros deste setup

- `menu/rest-no-manches-lisboa/` — o menu (config, tema, taco SVG, lógica)
- `supabase/provision-no-manches.sql` — provisionar espaço + menu + mesas *(obrigatório)*
- `supabase/seed-no-manches-demo.sql` — números de demo *(opcional)*
- `supabase/reset-no-manches.sql` — zerar antes do pitch
