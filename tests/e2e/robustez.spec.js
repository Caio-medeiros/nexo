import { test, expect } from '@playwright/test';

/**
 * ROBUSTEZ — E2E do 4.º lote (arranque, offline, confirmação).
 *
 * #1 CONFIG em falta OU malformado → aviso amigável com retry, nunca uma
 *    página quebrada.
 * #2 pedido/chamada sem rede → o cliente é avisado que NÃO foi enviado (não
 *    desaparece em silêncio) e pode reenviar.
 * #3 a confirmação é SEMPRE em página e nunca depende da permissão de
 *    notificação do browser (o menu nem sequer a pede).
 *
 * Supabase MOCKADO — nunca toca produção.
 */

const NM = '/menu/rest-no-manches-lisboa/';
const MARISCA = '/menu/marisca-petisca/';

async function baseRoutes(page) {
  await page.route('**/rest/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route('https://ntfy.sh/**', (r) => r.fulfill({ status: 200, body: '' }));
  await page.routeWebSocket(/supabase\.co/, () => {});
}
async function killAnims(page) {
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
}

// ════════════════════════════════════════════════════════════════════════
test.describe('#1 — CONFIG malformado mostra o aviso, não quebra', () => {
  for (const [name, url] of [['no-manches', NM], ['marisca', MARISCA]]) {
    test(`${name}: CONFIG sem name/menu → aviso amigável`, async ({ page }) => {
      await baseRoutes(page);
      // config.js "meio carregado": CONFIG existe mas sem os campos essenciais.
      await page.route('**/config.js', (r) => r.fulfill({
        status: 200, contentType: 'application/javascript',
        body: 'const CONFIG = { slug: "mock", supabaseUrl: "", supabaseAnonKey: "" };',
      }));
      await page.goto(url);
      await expect(page.getByText(/não foi possível carregar o menu/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /tentar novamente/i })).toBeVisible();
    });
  }
});

// ════════════════════════════════════════════════════════════════════════
test.describe('#2 — envio sem rede avisa (nunca silencioso)', () => {
  test.beforeEach(async ({ page }) => {
    await baseRoutes(page);
    await page.addInitScript(() => {
      try { sessionStorage.setItem('nexo_rated', '1'); } catch (_) {}
      // finge telemóvel offline
      Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
    });
  });

  test('pedido offline → avisa que NÃO foi enviado', async ({ page }) => {
    test.slow();
    await page.goto(NM);
    await killAnims(page);
    const add = page.locator('.menu-item-add-btn');
    await add.first().waitFor();
    await add.nth(0).click();
    await page.locator('#cart-pill').click();
    await page.locator('#cart-confirm-btn').click();
    await expect(page.locator('#confirm-screen')).toHaveClass(/show/);
    await page.locator('#confirm-table-input').fill('3'); // mesa é obrigatória antes de enviar
    await page.locator('#confirm-btn-kitchen').click();
    // aviso explícito de offline, com opção de reenviar
    await expect(page.locator('#nexo-staffhelp')).toContainText(/não foi enviado/i);
  });

  test('chamada de staff offline → botão diz "sem rede"', async ({ page }) => {
    test.slow();
    await page.goto(NM);
    await killAnims(page);
    await page.locator('#nexo-call-staff-btn').click();
    await expect(page.locator('#nexo-call-sheet')).toBeVisible();
    await page.locator('#nexo-call-table-input').fill('3');
    await page.locator('#nexo-call-send-btn').click();
    await expect(page.locator('#nexo-call-btn-text')).toContainText(/sem rede/i);
  });
});

// ════════════════════════════════════════════════════════════════════════
test.describe('#3 — confirmação em página, sem depender de notificações', () => {
  test('nunca pede permissão de Notification e confirma em página', async ({ page }) => {
    test.slow();
    await baseRoutes(page);
    await page.addInitScript(() => {
      window.__notifAsked = false;
      try {
        if (window.Notification) {
          window.Notification.requestPermission = function () { window.__notifAsked = true; return Promise.resolve('denied'); };
        }
      } catch (_) {}
      try { sessionStorage.setItem('nexo_rated', '1'); } catch (_) {}
    });
    await page.goto(NM);
    await killAnims(page);
    // fluxo que "confirma" algo ao cliente: chamar o staff
    await page.locator('#nexo-call-staff-btn').click();
    await expect(page.locator('#nexo-call-sheet')).toBeVisible();
    await page.locator('#nexo-call-table-input').fill('3');
    await page.locator('#nexo-call-send-btn').click();
    // confirmação IN-PAGE (não uma notificação do browser)
    await expect(page.locator('#nexo-call-btn-text')).toContainText(/a caminho|já cham[aá]mos/i);
    // e nunca foi pedida permissão de notificação
    expect(await page.evaluate(() => window.__notifAsked)).toBe(false);
  });
});
