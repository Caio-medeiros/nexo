import { defineConfig, devices } from '@playwright/test';

// NEXO_TEST_ENV=prod   → https://nexosolutions.pt   (default)
// NEXO_TEST_ENV=local  → http://localhost:8888      (serve the repo: `python3 -m http.server 8888`)
const ENV = process.env.NEXO_TEST_ENV || 'prod';
const baseURL = ENV === 'local' ? 'http://localhost:8888' : 'https://nexosolutions.pt';

export default defineConfig({
  // Em local, sobe o servidor estático sozinho (o site não tem build step).
  ...(ENV === 'local' ? {
    webServer: {
      command: 'python3 -m http.server 8888 --directory ../..',
      url: 'http://localhost:8888/',
      reuseExistingServer: true,
      timeout: 15_000,
    },
  } : {}),
  testDir: '.',
  timeout: 15_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: '../playwright-report', open: 'never' }]],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 8_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
