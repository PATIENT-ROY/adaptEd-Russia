import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/payment',
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:3019', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true } },
  ],
  webServer: {
    command: 'npm run start -- --hostname 127.0.0.1 -p 3019',
    url: 'http://127.0.0.1:3019', reuseExistingServer: false, timeout: 60000,
  },
});
