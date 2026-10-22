import { test, expect } from '@playwright/test';

test('search, categories, cross-section links, pagination and reset', async ({ page }) => {
  for (const section of ['education', 'life']) {
    await page.goto(`/${section}-guide`);
    await expect(page.locator(`#${section}-guide-search-input`)).toHaveCount(1);
    const input = page.locator(`#${section}-guide-search-input`);
    const catalog = page.locator(`#${section}-guide-guides`);
    const hero = page.locator('section').first();
    await expect(input).toBeVisible();
    await expect(catalog.locator('h2')).toContainText(section === 'education' ? '17' : '31');
    const before = await catalog.locator('div.grid a:visible').count();
    await catalog.getByRole('button', { name: 'Показать ещё' }).click();
    await expect.poll(() => catalog.locator('div.grid a:visible').count()).toBeGreaterThan(before);
    await expect(catalog.locator('h2')).toContainText(section === 'education' ? '17' : '31');
    // Every category remains populated; toggle returns to all.
    const buttons = hero.locator('button').filter({ hasNotText: 'Я только приехал' });
    for (let i = 0; i < await buttons.count(); i++) {
      await buttons.nth(i).focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(700);
      await expect(catalog.locator('div.grid a:visible').first()).toBeVisible();
      await buttons.nth(i).focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(700);
    }
    await input.fill(section === 'life' ? 'ГОСТ' : 'Государственные праздники России');
    const other = page.getByRole('region', { name: /Результаты из раздела/ });
    await expect(other).toContainText('Подходящие инструкции есть');
    const href = await other.locator('a').first().getAttribute('href');
    expect(href).toMatch(/^\/guides\//);
    const response = await page.request.get(href!);
    expect(response.status()).toBe(200);
    await input.fill('документы');
    await expect(other).toContainText('Также найдено');
    await input.fill('zzzzzzzzzzz');
    await expect(other).toHaveCount(0);
    await expect(catalog.locator('div.grid a:visible')).toHaveCount(0);
    await input.fill(section === 'life' ? 'учет' : 'Подготовительный факультет');
    const firstTitles = await catalog.locator('div.grid a:visible').allTextContents();
    await input.fill(section === 'life' ? 'учёт' : '  ПОДГОТОВИТЕЛЬНЫЙ   ФАКУЛЬТЕТ  ');
    expect(await catalog.locator('div.grid a:visible').allTextContents()).toEqual(firstTitles);
    // Category hides a valid current-section result; clearing it preserves query.
    await input.fill(section === 'life' ? 'СНИЛС' : 'Подготовительный факультет');
    await hero.getByRole('button', { name: section === 'life' ? 'Транспорт' : 'Экзамены', exact: true }).click();
    await expect(catalog).toContainText('В выбранной категории ничего не найдено');
    await catalog.getByRole('button', { name: 'Искать во всех категориях' }).click();
    await expect(input).toHaveValue(section === 'life' ? 'СНИЛС' : 'Подготовительный факультет');
    await expect(catalog.locator('div.grid a:visible').first()).toBeVisible();
    await page.locator(`#${section}-guide-search`).getByRole('button').click();
    await expect(input).toHaveValue('');
    await expect(catalog.getByRole('button', { name: 'Показать ещё' })).toBeVisible();
  }
});

test('responsive search feedback has no horizontal overflow', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const section of ['education', 'life']) {
    await page.goto(`/${section}-guide`);
    await expect(page.locator(`#${section}-guide-search-input`)).toHaveCount(1);
    await page.locator(`#${section}-guide-search-input`).fill(section === 'life' ? 'ГОСТ' : 'Государственные праздники России');
    for (const width of [360,390,600,639,640,768,900,1023,1024,1200,1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.getByRole('region', { name: /Результаты из раздела/ }).scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      if ([360,390,768,1024,1440].includes(width)) await page.screenshot({ path: `../output/playwright/guides-${section}-${width}-${testInfo.project.name}.png` });
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('region', { name: /Результаты из раздела/ }).locator('a').first().focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/guides\//);
  }
  expect(errors).toEqual([]);
});

test('published links resolve and current category cannot hide other-section matches', async ({ page, request }) => {
  const paths = new Set<string>();
  for (const section of ['education', 'life']) {
    const response = await request.get(`/${section}-guide`);
    const html = await response.text();
    for (const match of html.matchAll(/href="(\/guides\/(?:education|life)\/[^"?#]+)"/g)) paths.add(match[1]);
    await page.goto(`/${section}-guide`);
    await expect(page.locator(`#${section}-guide-search-input`)).toHaveCount(1);
    await page.locator(`#${section}-guide-search-input`).fill(section === 'life' ? 'ГОСТ' : 'Государственные праздники России');
    const other = page.getByRole('region', { name: /Результаты из раздела/ });
    await expect(other).toBeVisible();
    const links = await other.locator('a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
    await page.locator('section').first().getByRole('button', { name: section === 'life' ? 'Транспорт' : 'Экзамены', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(other).toBeVisible();
    expect(await other.locator('a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))).toEqual(links);
  }
  expect(paths.size).toBeGreaterThanOrEqual(48);
  for (const path of paths) expect((await request.get(path)).status(), path).toBe(200);
});
