import { test, expect, Page } from '@playwright/test';

const plans = [
  { id: 'db-month', code: 'premium-month', durationMonths: 1, price: 250, name: 'Месяц' },
  { id: 'db-quarter', code: 'premium-3months', durationMonths: 3, price: 650, name: '3 месяца' },
  { id: 'db-year', code: 'premium-year', durationMonths: 12, price: 2500, name: 'Год' },
].map((p) => ({ ...p, currency: 'RUB', isActive: true, features: '[]', interval: p.durationMonths === 12 ? 'YEARLY' : 'MONTHLY' }));

async function mockApi(page: Page, options: { available?: boolean; empty?: boolean; failPlans?: boolean } = {}) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'ui-test-token');
    localStorage.setItem('language', 'RU');
    localStorage.setItem('user', JSON.stringify({ id: 'user', name: 'Тест', email: 'test@example.test', language: 'RU', plan: 'FREEMIUM' }));
  });
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/payments/plans')) {
      await route.fulfill({ status: options.failPlans ? 503 : 200, json: options.empty ? [] : plans });
    } else if (path.endsWith('/payments/availability')) {
      await route.fulfill({ json: { available: options.available ?? true } });
    } else if (path.endsWith('/payments/subscription')) {
      await route.fulfill({ json: null });
    } else {
      await route.fulfill({ json: [] });
    }
  });
}

const payButton = (page: Page) => page.getByRole('button', { name: /^(Оплатить|Оплата недоступна).*650.*₽/ }).filter({ visible: true });

test('uses server prices and sends the chosen method with the database plan id', async ({ page }, info) => {
  await mockApi(page);
  let body: unknown;
  await page.route('**/api/payments/create-payment', async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ json: { paymentId: 'p1', confirmationUrl: '/payment/callback?payment_id=p1', amount: { value: '650.00', currency: 'RUB' } } });
  });
  await page.goto('/payment');
  await expect(payButton(page)).toBeEnabled();
  const sbp = page.getByRole('button', { name: 'СБП', exact: true });
  await sbp.click();
  await expect(sbp).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `/private/tmp/payment-${info.project.name}.png`, fullPage: true });
  await payButton(page).click();
  await expect(page).toHaveURL(/payment\/callback\?payment_id=p1/);
  expect(body).toEqual({ planId: 'db-quarter', paymentMethod: 'SBP' });
});

test('disables payment before the provider is connected', async ({ page }) => {
  await mockApi(page, { available: false });
  await page.goto('/payment');
  await expect(payButton(page)).toBeDisabled();
  await expect(page.getByRole('status').filter({ hasText: 'подключаем платёжный сервис' })).toBeVisible();
});

for (const state of ['empty', 'failed'] as const) {
  test(`does not invent a purchasable tariff when the catalog is ${state}`, async ({ page }) => {
    await mockApi(page, { empty: state === 'empty', failPlans: state === 'failed' });
    await page.goto('/payment');
    await expect(page.getByText('Тариф временно недоступен. Попробуйте позже.')).toBeVisible();
    await expect(page.getByRole('button', { name: /—.*₽/ }).filter({ visible: true })).toBeDisabled();
    await expect(page.getByText(/npx tsx/)).toHaveCount(0);
  });
}

test('callback polls a pending payment and then returns to the checkout', async ({ page }) => {
  await mockApi(page);
  let checks = 0;
  await page.route('**/api/payments/payment/p1', (route) => route.fulfill({ json: {
    id: 'p1', status: ++checks < 2 ? 'PENDING' : 'SUCCEEDED', amount: 650, currency: 'RUB',
  } }));
  await page.goto('/payment/callback?payment_id=p1');
  await expect(page).toHaveURL(/\/payment\?payment_id=p1$/, { timeout: 12000 });
  expect(checks).toBeGreaterThanOrEqual(2);
});
