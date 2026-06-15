# NEXO — Aprovação de alterações ao menu

Cada alteração que o cliente faz em **Editar Menu** (`/portal/menu/`) deixou de ir
ao ar na hora. Passou a criar um **pedido** que a NEXO tem de aprovar. Assim o
cliente depende da NEXO para qualquer mudança ao menu — e o menu público só mostra
estado aprovado.

> 'Esgotado' (Disponibilidade / `item_availability`) **não** passa por aqui — é
> operacional e mantém-se instantâneo.

## Como funciona

- **Cliente** edita → grava um pedido em `menu_change_requests` (estado `pending`).
  O menu público continua a ler só `menu_overrides` (estado aprovado/ao vivo).
- **NEXO** aprova → o pedido é aplicado em `menu_overrides` e fica visível.
  Rejeitar → o pedido fica `rejected` e nada muda. Em ambos os casos o cliente
  recebe uma notificação no portal (`portal_notifications`, tipo `menu_change`).
- O cliente **não** consegue escrever em `menu_overrides` nem aprovar (RLS +
  grants revogados). Só o `service_role` chama as funções de aprovação.

## Tabela `menu_change_requests`

| Campo | Notas |
|---|---|
| `espaco_slug`, `item_id` | item alvo. `item_id` = `seccao:idx` (do config.js) ou `custom:<uuid>` (prato novo) |
| `section_id`, `kind` | `kind` = `override` (item do config) ou `custom` (prato novo) |
| `action` | `set` = criar/substituir override (editar, adicionar, esconder/mostrar) · `clear` = remover override (repor original / eliminar custom) |
| `removed` | `true` = esconder do menu |
| `name`, `description`, `price`, `photo_url` | valores propostos (para `action='set'`) |
| `base_label` | nome do prato, para mostrar na fila de aprovação |
| `status` | `pending` → `approved`/`rejected` |
| `requested_by`, `reviewed_at`, `reviewed_by`, `review_note` | auditoria |

Só pode haver **1 pedido pendente por prato** (índice único parcial). Re-editar
substitui o pendente anterior.

## Integração NEXO OS

Autenticar com a **secret key** do projeto dos menus (`kgbrtbpeekhkroibsgqq`) —
role `service_role`. anon/authenticated estão bloqueados.

**Listar pendentes (todos os clientes):**
```sql
select id, espaco_slug, base_label, action, name, price, removed, created_at
from menu_change_requests
where status = 'pending'
order by created_at;
```

**Aprovar / rejeitar (RPC SECURITY DEFINER):**
```sql
select approve_menu_change('<request_id>'::uuid);            -- aplica em menu_overrides
select reject_menu_change('<request_id>'::uuid, 'motivo');   -- marca rejected + notifica
```
Via PostgREST (secret key):
```
POST /rest/v1/rpc/approve_menu_change   { "p_request_id": "<uuid>" }
POST /rest/v1/rpc/reject_menu_change    { "p_request_id": "<uuid>", "p_note": "motivo" }
```

**Tempo real:** `menu_change_requests` está na publicação `supabase_realtime` —
subscrever INSERTs para receber novos pedidos na hora.

Migração: `supabase/migrations/012_menu_change_approval.sql`.

## ⚠️ Erro `42501 permission denied for table menu_change_requests`

Se as **Aprovações de Menu** no NEXO OS mostrarem este erro, o projeto dos menus
não concedeu acesso ao `service_role` (este projeto teve as default privileges
alteradas e a 003 só corrigiu anon/authenticated). **Correr no SQL Editor do
projeto dos menus** `supabase/migrations/014_fix_service_role_grants.sql` — concede
o service_role em tudo o que existe e ativa default privileges para o futuro, por
isso resolve este e qualquer feature nova que dê o mesmo erro. É idempotente.
