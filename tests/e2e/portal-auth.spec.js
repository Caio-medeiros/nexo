import { test, expect } from '@playwright/test';

// READ-ONLY, safe for prod: verifies the portal protects authenticated pages.
test.describe('Portal — auth gate (safe for prod)', () => {
  test('unauthenticated dashboard redirects to login', async ({ page }) => {
    await page.goto('/portal/dashboard/');
    // portal.js requireAuth() redirects to /portal/?redirect=...
    await page.waitForURL(/\/portal\/(\?|$|index)/, { timeout: 8000 });
    expect(page.url()).toContain('/portal/');
    // login form present
    await expect(page.locator('input[type="email"], input[type="password"]').first()).toBeVisible();
  });
});
