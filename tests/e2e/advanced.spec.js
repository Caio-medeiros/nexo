import { test, expect } from '@playwright/test';

/**
 * ADVANCED E2E — fluxos críticos do menu com Supabase MOCKADO.
 *
 * Corre no CI contra o repo servido estaticamente (NEXO_TEST_ENV=local):
 * page.route() intercepta TODO o tráfego para *.supabase.co e ntfy.sh, por
 * isso nunca escreve em produção e não precisa de infra além do browser.
 * O que se prova é o CONTRATO do cliente: que payloads o menu envia
 * (comanda directa → rondas 'sent'; assistida → 'awaiting_staff'), que o
 * client_token da 037 viaja no header, e que a UI responde (toast, sheet
 * de espera, cooldown da chamada, divisor de conta).
 *
 * NOTA (2026-07-20): o no-manches passou a carregar /js/nexo-security.js e
 * /js/nexo-access.js (marisca ainda não). Nestes testes o URL não traz
 * ?mesa=&tok=, por isso a camada de acesso fica em modo BROWSE e o guardOrder
 * degrada para suave (o pedido segue com a mesa digitada) — ver a cobertura da
 * mesa validada por token em tests/e2e/mesa-sessao.spec.js. O anti-spam real da
 * chamada de empregado continua a ser o cooldown de 30s do script.js.
 *
 * O isolamento RLS (leituras cross-venue) vive em tests/rls/rls.mjs.
 */

// Páginas pesadas (menu completo + mocks) — sequencial dentro deste ficheiro
// para não disputar CPU; os smoke specs continuam paralelos.
test.describe.configure({ mode: 'default' });

const MARISCA = '/menu/marisca-petisca/';
const NM = '/menu/rest-no-manches-lisboa/';

// ── Mock do PostgREST/ntfy ──────────────────────────────────────────────────
// Estado por teste: o router responde como o PostgREST (Accept
// vnd.pgrst.object → objecto; sem linhas → 406 PGRST116) e regista cada
// escrita em state.posts para as asserções de payload.
async function mockSupabase(page) {
  const state = { comandas: [], items: [], rounds: [], posts: [] };
  const uuid = () => crypto.randomUUID();

  function respond(route, rows, { status = 200 } = {}) {
    const accept = route.request().headers()['accept'] || '';
    const headers = { 'content-type': 'application/json', 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}` };
    if (accept.includes('vnd.pgrst.object')) {
      if (rows.length === 1) return route.fulfill({ status, headers, body: JSON.stringify(rows[0]) });
      return route.fulfill({
        status: 406, headers,
        body: JSON.stringify({ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' }),
      });
    }
    return route.fulfill({ status, headers, body: JSON.stringify(rows) });
  }

  await page.route('**/rest/v1/**', (route) => {
    const req = route.request();
    const u = new URL(req.url());
    const path = u.pathname.replace(/^.*\/rest\/v1\//, '');
    const method = req.method();
    const body = ['POST', 'PATCH'].includes(method) ? (req.postDataJSON() ?? null) : null;
    if (body !== null) state.posts.push({ path, method, body, headers: req.headers() });

    // RPCs
    if (path.startsWith('rpc/')) {
      const fn = path.slice(4);
      if (fn === 'espaco_active') return respond(route, [true]);
      if (fn === 'nexo_table_access') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, table_count: 12, comanda: null }) });
      if (fn === 'nexo_join_comanda') return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
      return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
    }

    // comandas
    if (path === 'comandas') {
      if (method === 'POST') {
        const row = { id: uuid(), session_code: 'CI99-TEST', status: 'open', total: 0, created_at: new Date().toISOString(), archived_at: null, ...body };
        state.comandas.push(row);
        return respond(route, [row], { status: 201 });
      }
      if (method === 'PATCH') {
        const total = state.items.reduce((s, i) => s + (i.item_price || 0) * (i.quantity || 1), 0);
        const rows = state.comandas.map((c) => ({ ...c, ...body, total }));
        return respond(route, rows);
      }
      // GET: só quem apresenta o x-comanda-token vê a comanda (compat 037)
      const tok = req.headers()['x-comanda-token'];
      const rows = tok ? state.comandas.filter((c) => c.client_token === tok) : [];
      return respond(route, rows);
    }

    if (path === 'comanda_rounds') {
      if (method === 'POST') {
        const row = { id: uuid(), status: 'fired', fired_at: new Date().toISOString(), ...body };
        state.rounds.push(row);
        return respond(route, [row], { status: 201 });
      }
      // embeds do dedupe: comanda_items(item_name, quantity)
      const rows = state.rounds.map((r) => ({
        ...r, comanda_items: state.items.filter((i) => i.round_id === r.id),
      }));
      return respond(route, rows);
    }

    if (path === 'comanda_items') {
      if (method === 'POST') {
        const rows = (Array.isArray(body) ? body : [body]).map((r) => ({ id: uuid(), ...r }));
        state.items.push(...rows);
        return respond(route, rows, { status: 201 });
      }
      if (method === 'PATCH') return respond(route, []);
      return respond(route, state.items);
    }

    if (path === 'venue_settings') return respond(route, [{ espaco_slug: 'mock', table_count: 12 }]);
    if (method === 'POST') return respond(route, [], { status: 201 }); // menu_events, staff_calls, rate_limit_log…
    return respond(route, []); // menu_banners, item_availability, …
  });

  // ntfy (canal secundário da chamada de empregado) — nunca sair para a rede
  await page.route('https://ntfy.sh/**', (route) => route.fulfill({ status: 200, body: '' }));
  // realtime: nunca ligar ao projecto real
  await page.routeWebSocket(/supabase\.co/, () => { /* engole a ligação */ });

  return state;
}

// mock + goto + mata animações (em paralelo o CPU atrasa transições e os
// elementos nunca ficam "estáveis" para o Playwright clicar)
async function boot(page, url) {
  const state = await mockSupabase(page);
  // o modal de review auto-dispara aos 30s e intercepta cliques — marca a
  // sessão como "já avaliou" antes do script correr
  await page.addInitScript(() => { try { sessionStorage.setItem('nexo_rated', '1'); } catch (_) {} });
  await page.goto(url);
  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}',
  });
  return state;
}

async function addTwoItems(page) {
  const add = page.locator('.menu-item-add-btn');
  await add.first().waitFor();
  await add.nth(0).click();
  await add.nth(1).click();
}

async function openCart(page) {
  const pill = page.locator('#cart-pill');
  await expect(pill).toBeVisible();
  await pill.click();
  await expect(page.locator('#cart-sheet')).toBeVisible();
  }

// ════════════════════════════════════════════════════════════════════════
test.describe('Comanda directa (marisca) — carrinho → ronda na cozinha', () => {
  test('2 itens → confirmar → comanda + ronda + itens "sent" com client_token (037)', async ({ page }) => {
    test.slow();
    const state = await boot(page, MARISCA);
    await addTwoItems(page);
    await openCart(page);

    const confirm = page.locator('#cart-confirm-btn');
    await expect(confirm).toBeEnabled();
    await confirm.click();
    await expect(page.locator('#confirm-screen')).toBeVisible();
    await page.locator('#confirm-table-input').fill('4');
    await page.locator('#confirm-btn-kitchen').click();

    // O contrato de rede: 1 comanda (com token 037 no corpo E no header),
    // 1 ronda, itens disparados como 'sent' na ronda 1.
    await expect.poll(() => state.posts.filter((p) => p.path === 'comanda_rounds').length,
      { message: 'o menu nunca criou a ronda' }).toBe(1);

    const comandaPost = state.posts.find((p) => p.path === 'comandas' && p.method === 'POST');
    expect(comandaPost, 'o menu não criou a comanda').toBeTruthy();
    expect(comandaPost.body.client_token, 'client_token (037) em falta no INSERT').toBeTruthy();
    expect(comandaPost.headers['x-comanda-token']).toBe(comandaPost.body.client_token);
    expect(comandaPost.body.espaco_slug).toBe('marisca-petisca');

    const itemsPost = state.posts.find((p) => p.path === 'comanda_items' && p.method === 'POST');
    const rows = Array.isArray(itemsPost.body) ? itemsPost.body : [itemsPost.body];
    expect(rows.length).toBe(2);
    for (const r of rows) {
      expect(r.status, 'itens da comanda directa disparam como sent').toBe('sent');
      expect(r.round_number).toBe(1);
      expect(r.round_id).toBeTruthy();
    }

    await expect(page.getByText(/enviado para a cozinha/i).first()).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════════════
test.describe('Pedido assistido (no-manches) — awaiting_staff, nunca ronda', () => {
  test('confirmar → itens "awaiting_staff", zero rondas, UI de espera', async ({ page }) => {
    test.slow();
    const state = await boot(page, NM);
    await addTwoItems(page);
    await openCart(page);

    await page.locator('#cart-confirm-btn').click();
    await expect(page.locator('#confirm-screen')).toBeVisible();
    await page.locator('#confirm-table-input').fill('7');
    await page.locator('#confirm-btn-kitchen').click();

    await expect.poll(() => state.posts.filter((p) => p.path === 'comanda_items').length,
      { message: 'o menu nunca inseriu os itens' }).toBeGreaterThan(0);

    const itemsPost = state.posts.find((p) => p.path === 'comanda_items' && p.method === 'POST');
    const rows = Array.isArray(itemsPost.body) ? itemsPost.body : [itemsPost.body];
    for (const r of rows) {
      expect(r.status, 'no modo assistido a cozinha NÃO pode ver itens antes do staff').toBe('awaiting_staff');
    }
    // A regra de ouro do assistido: nenhuma ronda é criada pelo cliente.
    expect(state.posts.filter((p) => p.path === 'comanda_rounds').length).toBe(0);

    // UI de espera (sheet "pedido em espera" ou pill minimizada)
    await expect(page.locator('#nm-assisted-sheet.show, #nm-waiting-pill').first()).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════════════
test.describe('Chamada de empregado — envia 1× e entra em cooldown (anti-spam)', () => {
  test('sucesso → "a caminho" → segunda chamada bloqueada 30s', async ({ page }) => {
    test.slow();
    const state = await boot(page, MARISCA);

    const callBtn = page.locator('#nexo-call-staff-btn');
    await callBtn.click();
    await expect(page.locator('#nexo-call-sheet')).toBeVisible();
    await page.locator('#nexo-call-table-input').fill('3');
    await page.locator('#nexo-call-send-btn').click();

    await expect(page.locator('#nexo-call-btn-text')).toContainText(/a caminho/i);
    // fecha e fica em cooldown (o botão mostra "Enviado")
    await expect(callBtn).toContainText(/enviado/i, { timeout: 5000 });

    // exactamente UMA chamada (044: via RPC get-or-create nexo_call_staff)
    const callCount = () => state.posts.filter((p) => p.path === 'rpc/nexo_call_staff').length;
    expect(callCount()).toBe(1);

    // anti-spam: durante o cooldown o sheet não reabre
    // (dispatchEvent: o botão pode ficar sob o nav sticky após fechar o
    // sheet; o que interessa é o guard do cooldown, não o hit-testing)
    await callBtn.dispatchEvent('click');
    await expect(page.locator('#nexo-call-sheet')).toBeHidden();
    expect(callCount()).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════
test.describe('Split bill — divisor de conta no carrinho', () => {
  test('2 itens → tab Dividir → nº de pessoas ajusta e mostra valores', async ({ page }) => {
    test.slow();
    await boot(page, MARISCA);
    await addTwoItems(page);
    await openCart(page);

    await page.locator('#tab-split').click();
    await expect(page.locator('#panel-split')).toBeVisible();
    await expect(page.locator('#split-count')).toHaveText('2');
    await page.locator('#split-plus').click();
    await expect(page.locator('#split-count')).toHaveText('3');
    // divisão em partes iguais renderizada (algum valor €)
    await expect(page.locator('#panel-split')).toContainText('€');
  });
});
