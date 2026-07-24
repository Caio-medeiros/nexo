import { test, expect } from '@playwright/test';

/**
 * CARRINHO · COMANDA · TOTAL — E2E das correções do 2.º lote.
 *
 * #5 reconciliação da mesa partilhada ao voltar online (reanuncia 'hello').
 * #6 split bill parte do total COBRÁVEL do servidor (_nexoComandaBillable),
 *    nunca de um número recalculado no cliente.
 * #7 nomes duplicados na mesa são desambiguados ("Convidado 2").
 * #8 staff retira/ajusta um item enviado → o cliente é avisado (o total nunca
 *    desce em silêncio).
 *
 * (#1-#4 e #9 já estavam cobertos: renderSentSection acumula todas as rondas +
 *  total do servidor + awaiting à parte; subscribeTab faz realtime+poll; e o
 *  preço fresco do CONFIG está provado em mesa-sessao.spec.js.)
 *
 * Supabase MOCKADO — nunca toca produção.
 */

const NM = '/menu/rest-no-manches-lisboa/';
const SLUG = 'rest-no-manches-lisboa';

async function mock(page) {
  const state = { comandas: [], items: [], rounds: [], posts: [] };
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
    const path = new URL(req.url()).pathname.replace(/^.*\/rest\/v1\//, '');
    const method = req.method();
    const body = ['POST', 'PATCH'].includes(method) ? (req.postDataJSON() ?? null) : null;
    if (body !== null) state.posts.push({ path, method, body });
    if (path.startsWith('rpc/')) return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
    if (path === 'comandas') {
      if (method === 'POST') { const row = { id: uuid(), session_code: 'CI', status: 'open', total: 0, archived_at: null, ...body }; state.comandas.push(row); return respond(route, [row], { status: 201 }); }
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
  await page.routeWebSocket(/supabase\.co/, () => {});
  return state;
}
async function killAnims(page) {
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
}

// ════════════════════════════════════════════════════════════════════════
test.describe('#6 — split parte do total cobrável do servidor', () => {
  test('comanda a correr (20€) + carrinho → split = (20 + carrinho) / N', async ({ page }) => {
    test.slow();
    await mock(page);
    await page.addInitScript(() => { try { sessionStorage.setItem('nexo_rated', '1'); } catch (_) {} });
    await page.goto(NM);
    await killAnims(page);

    // Um item no carrinho para a pill aparecer e o cart-sheet abrir.
    const add = page.locator('.menu-item-add-btn');
    await add.first().waitFor();
    await add.nth(0).click();
    await page.locator('#cart-pill').click();
    await expect(page.locator('#cart-sheet')).toBeVisible();

    // Simula uma comanda a correr com 20€ já confirmados no servidor.
    await page.evaluate(() => { window._nexoComandaBillable = 20; window._nexoComandaInfo = { total: 20 }; });

    await page.locator('#tab-split').click();
    await expect(page.locator('#panel-split')).toBeVisible();
    // 2 pessoas
    const count = await page.locator('#split-count').textContent();
    if (count.trim() !== '2') { await page.locator('#split-plus').click(); }

    // O split parte de _nexoComandaBillable + carrinho — nunca só do carrinho.
    const { basis, cartOnly, shown } = await page.evaluate(() => {
      renderSplitPanel();
      const per = document.querySelector('#split-equal-result .split-eq-amount');
      const num = per ? parseFloat(per.textContent.replace(/[^\d.,]/g, '').replace(',', '.')) : null;
      return { basis: _splitBasisTotal(), cartOnly: getCartTotal(), shown: num };
    });
    expect(basis).toBeGreaterThan(cartOnly);        // inclui os 20€ do servidor
    expect(basis - cartOnly).toBeCloseTo(20, 2);
    const people = parseInt((await page.locator('#split-count').textContent()).trim(), 10);
    expect(shown).toBeCloseTo(basis / people, 2);   // o mostrado é a base/N

    // E há a nota de que a divisão acompanha novas rondas.
    await expect(page.locator('#split-equal-result')).toContainText(/atualiza a cada novo pedido/i);
  });
});

// ════════════════════════════════════════════════════════════════════════
test.describe('#7 — nomes duplicados na mesa', () => {
  test('dois "Convidado" → o de chave maior passa a "Convidado 2"', async ({ page }) => {
    test.slow();
    await mock(page);
    await page.addInitScript(() => { try { sessionStorage.setItem('nexo_rated', '1'); } catch (_) {} });
    await page.goto(NM);
    await killAnims(page);

    // Chave MAIOR → cede e renomeia.
    const yielded = await page.evaluate(() => {
      sharedCart = { code: 'AAA' };
      _sharedCartChannel = null; // _trackMyPresence é no-op sem canal
      _myPresenceKey = 'guest-200';
      sharedMemberName = 'Convidado';
      _myCartItems = [];
      _memberStates = {
        'guest-100': { name: 'Convidado', items: [] },
        'guest-200': { name: 'Convidado', items: [] },
      };
      _dedupeMyName();
      return sharedMemberName;
    });
    expect(yielded).toBe('Convidado 2');

    // Chave MENOR → mantém o nome base (o outro é que cederá).
    const kept = await page.evaluate(() => {
      _myPresenceKey = 'guest-050';
      sharedMemberName = 'Convidado';
      _memberStates = {
        'guest-050': { name: 'Convidado', items: [] },
        'guest-100': { name: 'Convidado', items: [] },
      };
      _dedupeMyName();
      return sharedMemberName;
    });
    expect(kept).toBe('Convidado');
  });
});

// ════════════════════════════════════════════════════════════════════════
test.describe('#5 — reconciliação ao voltar online', () => {
  test('online → reanuncia hello para a mesa se ressincronizar', async ({ page }) => {
    test.slow();
    await mock(page);
    await page.addInitScript(() => { try { sessionStorage.setItem('nexo_rated', '1'); } catch (_) {} });
    await page.goto(NM);
    await killAnims(page);

    const sent = await page.evaluate(async () => {
      window.__sent = [];
      sharedCart = { code: 'AAA' };
      _myPresenceKey = 'host-1';
      sharedMemberName = 'Ana';
      _myCartItems = [{ item_id: 'x:0', item_name: 'Item', item_price: 1, quantity: 1 }];
      _sharedCartChannel = { send: (m) => { window.__sent.push(m); } };
      _sharedResilienceWired = false;
      _ensureSharedResilience();
      window.dispatchEvent(new Event('online'));
      await new Promise((r) => setTimeout(r, 50));
      return window.__sent;
    });
    const hello = sent.find((m) => m.event === 'hello');
    expect(hello, 'não reanunciou hello ao voltar online').toBeTruthy();
    expect(hello.payload.memberKey).toBe('host-1');
    expect(hello.payload.items.length).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════
test.describe('#8 — staff retira item enviado', () => {
  test('item enviado passa a cancelled → cliente avisado', async ({ page }) => {
    test.slow();
    const state = await mock(page);
    const CID = 'comanda-1', TOK = 'tok-1', RID = 'round-1';
    state.comandas.push({ id: CID, session_code: 'S1', status: 'submitted', total: 20, client_token: TOK, table_label: 'Mesa 1', archived_at: null });
    state.rounds.push({ id: RID, round_number: 1, comanda_id: CID, status: 'sent', fired_at: new Date().toISOString() });
    state.items.push({ id: 'it-1', comanda_id: CID, item_name: 'Tacos al Pastor', quantity: 2, item_price: 10, status: 'sent', round_id: RID });

    await page.addInitScript(([cid, tok, slug]) => {
      try {
        sessionStorage.setItem('nexo_comanda_' + slug, JSON.stringify({ id: cid, status: 'submitted', table_label: 'Mesa 1' }));
        sessionStorage.setItem('nexo_ctoken_' + slug, tok);
        sessionStorage.setItem('nexo_rated', '1');
      } catch (_) {}
    }, [CID, TOK, SLUG]);

    await page.goto(NM);
    await killAnims(page);

    // refreshTab inicial (activateTab) mostra o item enviado e semeia o snapshot.
    await expect(page.locator('#nexo-sent-section')).toContainText('Tacos al Pastor', { timeout: 10000 });

    // O staff cancela o item → próximo refresh detecta a remoção.
    state.items[0].status = 'cancelled';
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));

    await expect(page.locator('#nexo-cart-toast')).toContainText(/retirou/i, { timeout: 10000 });
  });
});
