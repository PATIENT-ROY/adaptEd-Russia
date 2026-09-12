import { test, expect } from '@playwright/test';
import { t } from '../../src/lib/translations';
import { Language } from '../../src/types';

for (const language of Object.values(Language)) {
  test(`${language}: honest error, retry, and only relevant guides`, async ({ page }) => {
    await page.addInitScript(language => {
      localStorage.setItem('language', language);
      localStorage.setItem('token', 'ui-test-not-a-real-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'ui-test', name: 'Test', email: 'test@example.invalid', role: 'STUDENT', plan: 'FREEMIUM', language, country: 'Test',
      }));
    }, language);
    let calls = 0;
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (!url.pathname.startsWith('/api/')) {
        return url.origin === 'http://127.0.0.1:3017' ? route.continue() : route.abort();
      }
      const fulfill = (status: number, data: unknown) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
      if (url.pathname === '/api/chat/messages') {
        if (route.request().method() === 'GET') return fulfill(200, { success: true, data: [], usage: { used: 0, limit: 15, plan: 'FREEMIUM' } });
        calls++;
        if (calls === 1) return fulfill(503, { success: false, error: 'AI_UNAVAILABLE' });
        if (calls === 2) return fulfill(504, { success: false, error: 'AI_TIMEOUT' });
        const content = route.request().postDataJSON().content;
        const banking = calls === 4;
        return fulfill(201, { success: true, data: {
          userMessage: { id: `user-${calls}`, userId: 'ui-test', content, isUser: true, timestamp: new Date().toISOString() },
          aiMessage: { id: `ai-${calls}`, userId: 'ui-test', content: banking ? 'Bank answer' : 'Hola — test translation', isUser: false, timestamp: new Date().toISOString() },
          relatedGuides: banking ? [{ title: 'Bank guide', url: '/guides/life/bank', category: 'life' }] : [],
          usage: { used: calls - 2, limit: 15, plan: 'FREEMIUM' },
        } });
      }
      if (url.pathname.includes('unread-count')) return fulfill(200, { success: true, data: { count: 0, unreadCount: 0 } });
      return fulfill(200, { success: true, data: [] });
    });
    await page.goto('/ai-helper/assistant');
    const input = page.getByPlaceholder(t('aiHelper.input.placeholder', language));
    const send = page.getByRole('button', { name: t('aiHelper.input.send', language), exact: true });
    const chatAlert = page.locator('main [role="alert"]');
    await input.fill('Translate hello');
    await send.click();
    await expect(chatAlert).toContainText(t('api.error.aiUnavailable', language));
    await expect(input).toHaveValue('Translate hello');
    await expect(send).toBeEnabled();
    await send.click();
    await expect(chatAlert).toContainText(t('api.error.aiTimeout', language));
    await send.click();
    await expect(page.getByText('Hola — test translation', { exact: true })).toBeVisible();
    await expect(chatAlert).toHaveCount(0);
    await expect(page.getByText(t('aiHelper.guides.related', language), { exact: true })).toHaveCount(0);
    await input.fill('How do I open a bank account?');
    await send.click();
    await expect(page.getByRole('link', { name: 'Bank guide', exact: true })).toBeVisible();
    await input.fill('Translate goodbye');
    await send.click();
    await expect(input).toHaveValue('');
    await expect(page.getByRole('link', { name: 'Bank guide', exact: true })).toHaveCount(0);
    await expect(page.getByText(t('aiHelper.guides.related', language), { exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
}
