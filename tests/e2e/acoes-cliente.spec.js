import { test, expect } from '@playwright/test';

/**
 * AÇÕES DO CLIENTE — E2E do 3.º lote.
 *
 * #1 chamar empregado: a RPC nexo_call_staff (044) faz get-or-create ao nível da
 *    mesa → 2.º cliente vê "já chamámos" em vez de nova chamada.
 * #2 double-submit: o botão de enviar tranca no 1.º clique (orderLocked + loading).
 * #3 Back do browser a meio do checkout fecha o ecrã (não sai da página) e o
 *    carrinho fica intacto.
 * #4 duas abas do mesmo menu sincronizam o carrinho (BroadcastChannel).
 * #5 trocar de idioma a meio do pedido preserva o carrinho e as notas.
 *
 * Supabase MOCKADO — nunca toca produção.
 */

const NM = '/menu/rest-no-manches-lisboa/';
const SLUG = 'rest-no-manches-lisboa';

async function mock(page, { staffPending = false } = {}) {
  const state = { posts: [], calls: [] };
  await page.route('**/rest/v1/**', (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^.*\/rest\/v1\//, '');
    const method = req.method();
    const body = ['POST', 'PATCH'].includes(method) ? (req.postDataJSON() ?? null) : null;
    if (body !== null) state.posts.push({ path, method, body });
    if (path === 'rpc/nexo_call_staff') {
      state.calls.push(body);
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ ok: true, pending: staffPending }) });
    }
    if (path.startsWith('rpc/')) return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
    if (path === 'venue_settings') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ espaco_slug: 'mock', table_count: 12 }]) });
    if (method === 'POST') return route.fulfill({ status: 201, contentType: 'application/json', body: '[]' });
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('https://ntfy.sh/**', (route) => route.fulfill({ status: 200, body: '' }));
  await page.routeWebSocket(/supabase\.co/, () => {});
  return state;
}
async function boot(page, opts) {
  const state = await mock(page, opts);
  await page.addInitScript(() => { try { sessionStorage.setItem('nexo_rated', '1'); } catch (_) {} });
  await page.goto(NM);
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
  return state;
}

// ════════════════════════════════════════════════════════════════════════
test.describe('#1 — chamar empregado (044 get-or-create)', () => {
  test('RPC pending:true → mostra "já chamámos"', async ({ page }) => {
    test.slow();
    const state = await boot(page, { staffPending: true });
    await page.locator('#nexo-call-staff-btn').click();
    await expect(page.locator('#nexo-call-sheet')).toBeVisible();
    await page.locator('#nexo-call-table-input').fill('3');
    await page.locator('#nexo-call-send-btn').click();
    await expect(page.locator('#nexo-call-btn-text')).toContainText(/já cham[aá]mos/i);
    // usou a RPC (não o INSERT directo)
    expect(state.calls.length).toBeGreaterThan(0);
    expect(state.calls[0].p_slug).toBe(SLUG);
  });

  test('RPC pending:false → "atendente a caminho"', async ({ page }) => {
    test.slow();
    await boot(page, { staffPending: false });
    await page.locator('#nexo-call-staff-btn').click();
    await expect(page.locator('#nexo-call-sheet')).toBeVisible();
    await page.locator('#nexo-call-table-input').fill('3');
    await page.locator('#nexo-call-send-btn').click();
    await expect(page.locator('#nexo-call-btn-text')).toContainText(/atendente a caminho/i);
  });
});

// ════════════════════════════════════════════════════════════════════════
test.describe('#3 — Back a meio do checkout', () => {
  test('Back fecha o checkout e o carrinho fica intacto', async ({ page }) => {
    test.slow();
    await boot(page);
    const add = page.locator('.menu-item-add-btn');
    await add.first().waitFor();
    await add.nth(0).click();
    await page.locator('#cart-pill').click();
    await expect(page.locator('#cart-sheet')).toBeVisible();
    await page.locator('#cart-confirm-btn').click();
    await expect(page.locator('#confirm-screen')).toHaveClass(/show/);

    // Back do browser → fecha o overlay, NÃO navega para fora.
    await page.goBack();
    await expect(page.locator('#confirm-screen')).not.toHaveClass(/show/);
    // Continua na página do menu e o carrinho manteve o item.
    await expect(page).toHaveURL(new RegExp(SLUG));
    const count = await page.evaluate(() => (typeof cart !== 'undefined' ? cart.length : -1));
    expect(count).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════
test.describe('#4 — sincronização de carrinho entre abas', () => {
  test('mensagem "cart" de outra aba é adoptada', async ({ page }) => {
    test.slow();
    await boot(page);
    // refId válido do menu atual
    const refId = await page.evaluate(() => {
      const sec = CONFIG.menu.find((s) => s.items && s.items.length);
      return sec.id + ':0';
    });
    // Simula OUTRA aba a difundir o seu carrinho no mesmo BroadcastChannel.
    await page.evaluate(({ ref, slug }) => {
      const bc = new BroadcastChannel('nexo-cart-' + slug);
      bc.postMessage({ type: 'cart', tabId: 'other-tab', ts: Date.now(),
        cart: [{ refId: ref, qty: 2, note: '' }] });
    }, { ref: refId, slug: SLUG });
    // A aba actual adopta o carrinho remoto (last-write-wins).
    await page.waitForFunction(() => typeof cart !== 'undefined' && cart.length === 1 && cart[0].qty === 2, null, { timeout: 5000 });
    await expect(page.locator('#cart-pill')).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════════════════
test.describe('#5 — trocar de idioma a meio do pedido', () => {
  test('carrinho e notas sobrevivem à troca de idioma', async ({ page }) => {
    test.slow();
    await boot(page);
    const refId = await page.evaluate(() => {
      const sec = CONFIG.menu.find((s) => s.items && s.items.length);
      return sec.id + ':0';
    });
    // adiciona 1 item + uma nota
    await page.evaluate((ref) => {
      addToCart(ref);
      setItemNote(ref, 'sem picante');
    }, refId);
    const before = await page.evaluate((ref) => ({ len: cart.length, note: getItemNote(ref) }), refId);
    expect(before.len).toBe(1);
    expect(before.note).toBe('sem picante');

    // troca de idioma (botão da toggle que não seja o activo)
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('.lang-toggle button')];
      const other = btns.find((b) => !b.classList.contains('active'));
      if (other) other.click();
    });

    const after = await page.evaluate((ref) => ({ len: cart.length, note: getItemNote(ref), lang: currentLang }), refId);
    expect(after.len, 'carrinho perdeu-se ao trocar de idioma').toBe(1);
    expect(after.note, 'nota perdeu-se ao trocar de idioma').toBe('sem picante');
  });
});
