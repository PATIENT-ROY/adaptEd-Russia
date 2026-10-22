import { defineConfig } from '@playwright/test';
import chatConfig from './playwright.chat.config';
export default defineConfig({ ...chatConfig, testDir: './e2e/guide-search', timeout: 120000, use: { ...chatConfig.use, baseURL: 'http://127.0.0.1:3028' }, webServer: { ...chatConfig.webServer, command: 'npm run start -- --hostname 127.0.0.1 -p 3028', url: 'http://127.0.0.1:3028' } });
