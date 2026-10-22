import { defineConfig } from '@playwright/test';
import chatConfig from './playwright.chat.config';
export default defineConfig({
  ...chatConfig,
  testDir: './e2e/password-recovery',
  use: { ...chatConfig.use, baseURL: 'http://127.0.0.1:3031' },
  webServer: {
    ...chatConfig.webServer,
    command: 'npm run start -- --hostname 127.0.0.1 -p 3031',
    url: 'http://127.0.0.1:3031',
  },
});
