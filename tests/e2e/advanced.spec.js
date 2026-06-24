import { test, expect } from '@playwright/test';

/**
 * ADVANCED E2E — gated OFF by default.
 *
 * These need a STAGING target (never prod — some WRITE to Supabase, which would
 * create real orders on the live restaurant), test credentials, and features
 * that are not yet deployed (the TAT token system: nexo-access.js + migrations
 * 022/023/024). Enable with:
 *
 *   NEXO_TEST_FULL=1  NEXO_TEST_ENV=local  npx playwright test -c tests/e2e/playwright.config.js
 *
 * Before enabling, confirm the cart selectors below match the menu DOM (left as
 * data-test-ish guesses) and point NEXO_TEST_* at a throwaway venue/project.
 */
const FULL = !!process.env.NEXO_TEST_FULL;
const SLUG = process.env.NEXO_TEST_SLUG || 'marisca-petisca';
const VALID_TOKEN = process.env.NEXO_TEST_TOKEN || '';

test.describe('Menu — cart (needs selector confirmation)', () => {
  test.skip(!FULL, 'set NEXO_TEST_FULL=1 to run');

  test('add 2 items → cart total adds up', async ({ page }) => {
    await page.goto(`/menu/${SLUG}/`);
    // TODO: confirm these selectors against the real menu before relying on them.
    const addButtons = page.locator('[data-add-to-cart], .item-add, button:has-text("+")');
    await addButtons.nth(0).click();
    await addButtons.nth(1).click();
    const cartCount = page.locator('[data-cart-count], .cart-count');
    await expect(cartCount).toHaveText(/2/);
  });
});

test.describe('Menu — TAT browse vs full (needs nexo-access.js deployed)', () => {
  test.skip(!FULL, 'set NEXO_TEST_FULL=1 to run');

  test('no token → browse banner + ordering blocked', async ({ page }) => {
    await page.goto(`/menu/${SLUG}/`);
    await expect(page.locator('#nexo-browse-banner')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('body')).toHaveAttribute('data-access-mode', 'browse');
    // attempting an order shows the blocked modal, not an insert
    const fire = page.locator('#confirm-btn-kitchen');
    if (await fire.count()) {
      await fire.click();
      await expect(page.locator('#nexo-access-modal')).toBeVisible();
    }
  });

  test('invalid table number → browse mode', async ({ page }) => {
    test.skip(!VALID_TOKEN, 'set NEXO_TEST_TOKEN to a valid token');
    await page.goto(`/menu/${SLUG}/?mesa=999&tok=${VALID_TOKEN}&src=qr`);
    await expect(page.locator('body')).toHaveAttribute('data-access-mode', 'browse');
  });
});

/**
 * RLS isolation (test 6) — API level, no browser. WRITES to Supabase, so it
 * MUST target a staging project. Implemented as a separate node script rather
 * than a Playwright spec; see tests/rls/README.md for the gated runner.
 */
