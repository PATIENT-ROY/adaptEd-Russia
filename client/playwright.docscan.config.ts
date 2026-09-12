import { defineConfig } from '@playwright/test';
import chatConfig from './playwright.chat.config';

export default defineConfig({ ...chatConfig, testDir: './e2e/docscan' });
