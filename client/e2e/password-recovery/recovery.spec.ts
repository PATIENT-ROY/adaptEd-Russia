import { test, expect } from '@playwright/test';

test('form and resend make real HTTP requests; only API acknowledgement opens success', async ({ page }) => {
  const requests: { email: string }[] = [];
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  // Never allow these synthetic requests to reach a real API/mail provider.
  await page.route('**/api/**', route => route.fulfill({ status: 401, json: { success: false } }));
  await page.route('**/auth/forgot-password', async route => {
    expect(route.request().method()).toBe('POST');
    requests.push(route.request().postDataJSON());
    if (requests.length === 1) await pending;
    await route.fulfill({ status: 200, json: { success: true } });
  });
  await page.goto('/forgot-password');
  await expect(page.locator('#email')).toHaveCount(1);
  await page.locator('#email').fill('recovery@example.test');
  await page.getByRole('button', { name: 'Отправить инструкции', exact: true }).click();
  await expect.poll(() => requests.length).toBe(1);
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('button[type=submit]')).toBeDisabled();
  release();
  const resend = page.getByRole('button', { name: 'Отправить ещё раз', exact: true });
  await expect(resend).toBeVisible();
  await resend.click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests).toEqual([{ email: 'recovery@example.test' }, { email: 'recovery@example.test' }]);
  await expect(resend).toBeEnabled();
  await page.screenshot({ path: `../output/playwright/password-recovery-success-${test.info().project.name}.png` });
});

test('API and resend failures remain recoverable, without false success', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/**', route => route.fulfill({ status: 401, json: { success: false } }));
  await page.route('**/auth/forgot-password', route => {
    calls++;
    return route.fulfill({ status: calls === 2 ? 200 : 503, json: { success: calls === 2 } });
  });
  await page.goto('/forgot-password');
  await expect(page.locator('#email')).toHaveCount(1);
  await page.locator('#email').fill('recovery@example.test');
  await page.locator('button[type=submit]').click();
  await expect(page.getByRole('button', { name: 'Отправить ещё раз' })).toHaveCount(0);
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('form')).toContainText('Произошла ошибка при отправке запроса');
  await page.locator('button[type=submit]').click();
  await page.getByRole('button', { name: 'Отправить ещё раз', exact: true }).click();
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('form')).toContainText('Произошла ошибка при отправке запроса');
  expect(calls).toBe(3);
});
