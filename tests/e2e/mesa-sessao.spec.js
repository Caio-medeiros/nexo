import { test, expect } from '@playwright/test';

/**
 * MESA & SESSÃO — E2E das correções de integridade mesa/comanda/sessão.
 *
 * Cobre os problemas reportados:
 *   1. Pedido tem de cair na mesa validada (token) — nunca na digitada.
 *   2/6. Uma comanda por mesa: com token, o pedido passa SEMPRE pela RPC
 *        get-or-create (nexo_open_table_comanda) — o servidor trava a mesa.
 *   7. Sem token (modo suave) o pedido continua permitido indicando a mesa,
 *      MAS o modal de bloqueio nunca aparece e a camada de acesso está viva.
 *   8. Sessão antiga (localStorage) é revalidada contra o menu atual: itens
 *      fora do menu caem e os preços são refrescados para os de hoje.
 *
 * Supabase MOCKADO via page.route() — nunca toca produção.
 */

const NM = '/menu/rest-no-manches-lisboa/';
const SLUG = 'rest-no-manches-lisboa';

// Mock do PostgREST + RPCs relevantes à mesa/sessão.
async function mockSupabase(page, { comandaForTable } = {}) {
  const state = { comandas: [], items: [], rounds: [], posts: [], rpcCalls: [] };
  const uuid = () => crypto.randomUUID();

  function respond(route, rows, { status = 200 } = {}) {
    const accept = route.request().headers()['accept'] || '';
    const headers = { 'content-type': 'application/json', 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}` };
    if (accept.includes('vnd.pgrst.object')) {
      if (rows.length === 1) return route.fulfill({ status, headers, body: JSON.stringify(rows[0]) });
      return route.fulfill({ status: 406, headers, body: JSON.stringify({ code: 'PGRST116', message: 'no/multiple rows' }) });
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

    if (path.startsWith('rpc/')) {
      const fn = path.slice(4);
      state.rpcCalls.push({ fn, body });
      if (fn === 'espaco_active') return respond(route, [true]);
      // Presença validada (037): a mesa do URL existe e o token bate.
      if (fn === 'nexo_table_access') {
        return route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ valid: true, table_count: 12, comanda: null }) });
      }
      // 043 get-or-create: devolve SEMPRE a comanda da mesa validada no servidor.
      if (fn === 'nexo_open_table_comanda') {
        const n = (body && body.p_table_num) || 0;
        const c = comandaForTable
          ? comandaForTable(n)
          : { id: uuid(), session_code: 'S-' + n, table_label: 'Mesa ' + n, table_number: n, status: 'open', client_token: 'TOK-' + n };
        state.comandas.push(c);
        return route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ valid: true, joined: false, comanda: c }) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
    }

    if (path === 'comandas') {
      if (method === 'POST') {
        const row = { id: uuid(), session_code: 'CI-TEST', status: 'open', total: 0, created_at: new Date().toISOString(), archived_at: null, ...body };
        state.comandas.push(row);
        return respond(route, [row], { status: 201 });
      }
      if (method === 'PATCH') return respond(route, state.comandas.map((c) => ({ ...c, ...body })));
      const tok = req.headers()['x-comanda-token'];
      return respond(route, tok ? state.comandas.filter((c) => c.client_token === tok) : []);
    }
    if (path === 'comanda_rounds') {
      if (method === 'POST') { const row = { id: uuid(), status: 'fired', fired_at: new Date().toISOString(), ...body }; state.rounds.push(row); return respond(route, [row], { status: 201 }); }
      return respond(route, state.rounds.map((r) => ({ ...r, comanda_items: state.items.filter((i) => i.round_id === r.id) })));
    }
    if (path === 'comanda_items') {
      if (method === 'POST') { const rows = (Array.isArray(body) ? body : [body]).map((r) => ({ id: uuid(), ...r })); state.items.push(...rows); return respond(route, rows, { status: 201 }); }
      if (method === 'PATCH') return respond(route, []);
      return respond(route, state.items);
    }
    if (path === 'venue_settings') return respond(route, [{ espaco_slug: 'mock', table_count: 12 }]);
    if (method === 'POST') return respond(route, [], { status: 201 });
    return respond(route, []);
  });

  await page.route('https://ntfy.sh/**', (route) => route.fulfill({ status: 200, body: '' }));
  await page.routeWebSocket(/supabase\.co/, () => { /* engole realtime */ });
  return state;
}

async function killAnims(page) {
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
}
async function addTwoItems(page) {
  const add = page.locator('.menu-item-add-btn');
  await add.first().waitFor();
  await add.nth(0).click();
  await add.nth(1).click();
}

// ════════════════════════════════════════════════════════════════════════
test.describe('Mesa validada por token (TAT) — problemas 1, 2, 6', () => {
  test('com ?mesa=3&tok — campo trancado a 3 e pedido passa pela RPC da mesa 3', async ({ page }) => {
    test.slow();
    const state = await mockSupabase(page);
    await page.addInitScript(() => { try { sessionStorage.setItem('nexo_rated', '1'); } catch (_) {} });
    await page.goto(NM + '?mesa=3&tok=SECRET3&src=qr');
    await killAnims(page);

    // A camada de acesso está viva e validou a presença → modo FULL.
    await expect.poll(() => page.evaluate(() => document.body.dataset.accessMode)).toBe('full');
    expect(state.rpcCalls.some((c) => c.fn === 'nexo_table_access')).toBeTruthy();

    await addTwoItems(page);
    const pill = page.locator('#cart-pill');
    await expect(pill).toBeVisible();
    await pill.click();
    await page.locator('#cart-confirm-btn').click();
    await expect(page.locator('#confirm-screen')).toBeVisible();

    // Campo da mesa preenchido e TRANCADO com a mesa validada (não a digitada).
    const input = page.locator('#confirm-table-input');
    await expect(input).toHaveValue('3');
    await expect(input).toHaveJSProperty('readOnly', true);

    await page.locator('#confirm-btn-kitchen').click();

    // Contrato: o pedido passou pela RPC get-or-create da mesa 3 (nunca INSERT cego).
    await expect.poll(() => state.rpcCalls.filter((c) => c.fn === 'nexo_open_table_comanda').length).toBeGreaterThan(0);
    const rpc = state.rpcCalls.find((c) => c.fn === 'nexo_open_table_comanda');
    expect(rpc.body.p_table_num).toBe(3);
    expect(rpc.body.p_slug).toBe(SLUG);

    // Os itens caem na comanda devolvida pela RPC (mesa física correta) e o
    // cliente NUNCA cria uma 2.ª comanda via INSERT cego em /comandas.
    await expect.poll(() => state.posts.filter((p) => p.path === 'comanda_items' && p.method === 'POST').length).toBeGreaterThan(0);
    expect(state.posts.filter((p) => p.path === 'comandas' && p.method === 'POST').length).toBe(0);
    const itemsPost = state.posts.find((p) => p.path === 'comanda_items' && p.method === 'POST');
    const rows = Array.isArray(itemsPost.body) ? itemsPost.body : [itemsPost.body];
    for (const r of rows) expect(r.status).toBe('awaiting_staff');
  });
});

// ════════════════════════════════════════════════════════════════════════
test.describe('Modo suave (sem token) — problema 7', () => {
  test('sem token: pedido permitido indicando a mesa, sem modal de bloqueio', async ({ page }) => {
    test.slow();
    const state = await mockSupabase(page);
    await page.addInitScript(() => { try { sessionStorage.setItem('nexo_rated', '1'); } catch (_) {} });
    await page.goto(NM);
    await killAnims(page);

    // Sem ?mesa/tok → modo browse, mas a camada de acesso ESTÁ carregada.
    await expect.poll(() => page.evaluate(() => document.body.dataset.accessMode)).toBe('browse');
    expect(await page.evaluate(() => !!window.NexoAccess)).toBeTruthy();

    await addTwoItems(page);
    await page.locator('#cart-pill').click();
    await page.locator('#cart-confirm-btn').click();
    await expect(page.locator('#confirm-screen')).toBeVisible();
    await page.locator('#confirm-table-input').fill('7');
    await page.locator('#confirm-btn-kitchen').click();

    // O pedido segue (modo suave) e o modal de bloqueio TAT nunca aparece.
    await expect.poll(() => state.posts.filter((p) => p.path === 'comanda_items' && p.method === 'POST').length).toBeGreaterThan(0);
    expect(await page.locator('#nexo-access-modal').count()).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════
test.describe('Sessão antiga revalidada — problema 8', () => {
  test('itens fora do menu caem e preços são refrescados ao restaurar', async ({ page }) => {
    test.slow();
    await mockSupabase(page);
    await page.addInitScript(() => { try { sessionStorage.setItem('nexo_rated', '1'); } catch (_) {} });

    // 1) Carrega uma vez para ler um refId válido + o seu preço atual do CONFIG.
    await page.goto(NM);
    await killAnims(page);
    const seed = await page.evaluate(() => {
      const sec = CONFIG.menu.find((s) => s.items && s.items.length);
      const refId = sec.id + ':0';
      const item = getItemByRef(refId);
      return { refId, freshPrice: parsePriceToNumber(item.price) || 0,
               name: (item.name && (item.name.pt)) || 'X', slug: CONFIG.slug };
    });

    // 2) Injecta uma sessão partilhada ANTIGA: item válido com preço ERRADO
    //    (outro serviço/dia) + item que já não existe no menu.
    await page.evaluate(({ refId, slug }) => {
      const stale = {
        code: 'OLD123', memberKey: 'host-1', name: 'Anfitrião',
        ts: Date.now() - 60 * 60 * 1000, // 1h atrás (dentro do TTL de 2h)
        items: [
          { item_id: refId, item_name: 'Preço velho', item_price: 0.01, quantity: 1 },
          { item_id: 'zzz:999', item_name: 'Item que saiu do menu', item_price: 99.99, quantity: 2 },
        ],
      };
      localStorage.setItem('nexo_shared_session_' + slug, JSON.stringify(stale));
    }, seed);

    // 3) Recarrega → restoreSharedSession revalida contra o menu atual.
    await page.reload();
    await killAnims(page);

    // O item fora do menu foi descartado; o válido ficou com o preço de hoje.
    const restored = await page.evaluate(() => (typeof sharedCartItems !== 'undefined' ? sharedCartItems : []).map((i) => ({ id: i.item_id, price: i.item_price })));
    expect(restored.some((i) => i.id === 'zzz:999'), 'item fora do menu tinha de cair').toBeFalsy();
    const valid = restored.find((i) => i.id === seed.refId);
    expect(valid, 'o item válido tinha de sobreviver').toBeTruthy();
    expect(valid.price).toBeCloseTo(seed.freshPrice, 2);

    // E o que o menu ENVIA (readMenuCart) nunca inclui o item fora do menu
    // nem o preço em cache.
    const toSend = await page.evaluate(() => window.NEXOPremium.readMenuCart().map((i) => ({ id: i.id, price: i.price })));
    expect(toSend.some((i) => i.id === 'zzz:999')).toBeFalsy();
    const sendValid = toSend.find((i) => i.id === seed.refId);
    expect(sendValid.price).toBeCloseTo(seed.freshPrice, 2);
  });
});
