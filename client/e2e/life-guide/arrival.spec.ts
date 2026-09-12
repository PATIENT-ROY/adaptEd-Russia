import { test, expect } from '@playwright/test';
import { t } from '../../src/lib/translations';
import { Language } from '../../src/types';

for (const language of [Language.RU, Language.FR]) {
  test(`${language}: emergency sits between banner and checklist, housing opens directly, documents keep choice`, async ({ page }) => {
    const readRequests: unknown[] = [];
    await page.addInitScript(language => {
      localStorage.setItem('language', language);
      localStorage.setItem('token', 'life-guide-test-token');
      localStorage.setItem('user', JSON.stringify({ id: 'guide-test', name: 'Test', email: 'test@example.invalid', role: 'STUDENT', plan: 'FREEMIUM', language }));
    }, language);
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.pathname.startsWith('/api/')) {
        if (url.pathname.endsWith('/guide-progress') && route.request().method() === 'POST') readRequests.push(route.request().postDataJSON());
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: url.pathname.endsWith('/guide-progress') ? [] : { unreadCount: 0 } }) });
      }
      return url.origin === 'http://127.0.0.1:3017' ? route.continue() : route.abort();
    });
    await page.goto('/life-guide');
    const emergency = page.locator('#life-guide-emergency');
    // Wait for React to remove its temporary streamed/hydration tree.
    await expect(emergency).toHaveCount(1);
    await expect(emergency).toBeVisible();
    expect(await emergency.evaluate(element => element.nextElementSibling?.id)).toBe('life-guide-arrival');
    expect(await emergency.evaluate(element => Boolean(element.previousElementSibling?.querySelector('h1')))).toBe(true);
    for (const number of ['101', '102', '103', '112']) await expect(emergency.locator(`a[href="tel:${number}"]`)).toBeVisible();

    const checklist = page.locator('#life-guide-arrival');
    const housing = checklist.getByRole('link', { name: t('lifeGuide.arrival.steps.housing', language), exact: true });
    await expect(housing).toHaveAttribute('href', '/guides/life/dorm');
    const documents = checklist.getByRole('link', { name: t('lifeGuide.arrival.steps.documents', language), exact: true });
    await expect(documents).toHaveAttribute('href', '/life-guide?cat=documents#life-guide-guides');
    await documents.click();
    await expect(page).toHaveURL(/\/life-guide\?cat=documents#life-guide-guides$/);
    await expect(page.locator('#life-guide-guides a[href^="/guides/life/"]')).toHaveCount(7);
    await housing.click();
    await expect(page).toHaveURL(/\/guides\/life\/dorm$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect.poll(() => readRequests).toContainEqual({ guideId: '1', guideType: 'life' });
  });
}
