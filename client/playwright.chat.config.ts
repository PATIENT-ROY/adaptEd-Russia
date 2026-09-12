import { defineConfig, devices } from '@playwright/test';

// UI-only tests: all API traffic is mocked; no backend or real credentials.
export default defineConfig({
  testDir: './e2e/chat',
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:3017', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'npm run start -- --hostname 127.0.0.1 -p 3017',
    url: 'http://127.0.0.1:3017',
    reuseExistingServer: false,
    timeout: 60000,
  },
});
