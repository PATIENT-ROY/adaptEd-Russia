import { test, expect, type Page } from '@playwright/test';
import { t } from '../../src/lib/translations';
import { Language } from '../../src/types';
import { AI_TOOLS_INPUT_LIMIT } from '../../src/lib/ai-tools-limits';

const templateFields: Record<string, string[]> = {
  'coursework-plan': ['topic', 'subject'],
  resume: ['name', 'position', 'education', 'skills'],
  'teacher-email': ['teacher_name', 'purpose', 'details', 'your_name'],
  essay: ['topic'],
  application: ['recipient', 'purpose', 'your_name'],
  translation: ['source_lang', 'text'],
  'presentation-outline': ['topic'],
  'solve-task': ['subject', 'task'],
  'study-topic': ['topic'],
  'exam-prep': ['subject', 'topics'],
  'lecture-transcript': ['text'],
};

async function setup(page: Page, language = Language.RU) {
  await page.addInitScript(language => {
    localStorage.setItem('language', language);
    localStorage.setItem('token', 'ui-test-not-a-real-token');
    localStorage.setItem('user', JSON.stringify({ id: 'tools-test', name: 'Test', email: 'test@example.invalid', role: 'STUDENT', plan: 'FREEMIUM', language, country: 'Test' }));
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { (window as Window & { copiedText?: string }).copiedText = text; } } });
  }, language);
  const state = { requests: [] as Array<{ content: string; mode: string }>, status: 200, used: 0, error: 'AI_UNAVAILABLE', content: '# Test result\n\nUseful generated text.', wait: undefined as Promise<void> | undefined };
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/')) return url.origin === 'http://127.0.0.1:3017' ? route.continue() : route.abort();
    const reply = (status: number, body: unknown) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.pathname === '/api/chat/messages') {
      if (route.request().method() === 'GET') return reply(200, { success: true, data: [], usage: { used: state.used, limit: 15, plan: 'FREEMIUM' } });
      const body = route.request().postDataJSON();
      state.requests.push(body);
      if (body.content.trim().length > (body.mode === 'generator' ? AI_TOOLS_INPUT_LIMIT : 2000)) return reply(400, { success: false, error: 'AI_INPUT_TOO_LONG' });
      if (state.wait) await state.wait;
      if (state.status !== 200) return reply(state.status, { success: false, error: state.error });
      state.used++;
      return reply(201, { success: true, data: {
        aiMessage: { id: 'result', userId: 'tools-test', isUser: false, content: state.content, timestamp: new Date().toISOString() },
        usage: { used: state.used, limit: 15, plan: 'FREEMIUM' },
      } });
    }
    return reply(200, { success: true, data: { unreadCount: 0, count: 0 } });
  });
  return state;
}

async function choose(page: Page, id: string, language = Language.RU) {
  await page.getByRole('button').filter({ has: page.getByRole('heading', { name: t(`templates.item.${id}.name`, language), exact: true }) }).click();
}

async function fillRequired(page: Page, id: string) {
  for (const field of templateFields[id]) await page.locator(`#field-${field}`).fill('Test input');
}

for (const language of [Language.RU, Language.EN]) {
  test(`${language}: all 11 tool forms validate and send generator requests`, async ({ page }) => {
    const state = await setup(page, language);
    for (const [id, fields] of Object.entries(templateFields)) {
      await page.goto('/ai-helper/tools');
      await choose(page, id, language);
      const generate = page.getByRole('button', { name: t('templates.generate', language), exact: true });
      const before = state.requests.length;
      await generate.click();
      await expect(page.locator('fieldset [role="alert"]')).toHaveCount(fields.length);
      expect(state.requests).toHaveLength(before);
      await fillRequired(page, id);
      await generate.click();
      await expect(page.getByRole('heading', { name: 'Test result', exact: true })).toBeVisible();
      expect(state.requests.at(-1)?.mode).toBe('generator');
      expect(state.requests.at(-1)?.content).toContain('Test input');
      await page.getByRole('button', { name: t('templates.copy', language), exact: true }).click();
      expect(await page.evaluate(() => (window as Window & { copiedText?: string }).copiedText)).toContain('Useful generated text');
      await page.getByRole('button', { name: t('templates.edit', language), exact: true }).click();
      for (const field of fields) await expect(page.locator(`#field-${field}`)).toHaveValue('Test input');
    }
  });
}

for (const language of Object.values(Language)) {
  test(`${language}: provider failure preserves form, retry works, layout fits`, async ({ page }) => {
    const state = await setup(page, language);
    state.status = 503;
    await page.goto('/ai-helper/tools');
    await choose(page, 'study-topic', language);
    await fillRequired(page, 'study-topic');
    const generate = page.getByRole('button', { name: t('templates.generate', language), exact: true });
    await generate.click();
    await expect(page.getByRole('status')).toContainText(t('templates.generateError', language));
    await expect(page.locator('#field-topic')).toHaveValue('Test input');
    await expect(generate).toBeEnabled();
    state.status = 200;
    await generate.click();
    await expect(page.getByRole('heading', { name: 'Test result' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
}

test('loaded quota disables generation', async ({ page }) => {
  const state = await setup(page);
  state.used = 15;
  await page.goto('/ai-helper/tools');
  await choose(page, 'study-topic');
  await fillRequired(page, 'study-topic');
  await expect(page.getByRole('button', { name: t('templates.generate', Language.RU), exact: true })).toBeDisabled();
  expect(state.requests).toHaveLength(0);
});

test('server-side quota error displays the correct overlay', async ({ page }) => {
  const state = await setup(page);
  state.status = 429;
  state.error = 'LIMIT_PREMIUM';
  await page.goto('/ai-helper/tools');
  await choose(page, 'study-topic');
  await fillRequired(page, 'study-topic');
  await page.getByRole('button', { name: t('templates.generate', Language.RU), exact: true }).click();
  await expect(page.getByText(t('aiHelper.limit.premiumDesc', Language.RU), { exact: true })).toBeVisible();
});

test('regeneration preserves previous result while pending and on failure, then replaces it on success', async ({ page }) => {
  const state = await setup(page);
  await page.goto('/ai-helper/tools');
  await choose(page, 'study-topic');
  await fillRequired(page, 'study-topic');
  await page.getByRole('button', { name: t('templates.generate', Language.RU), exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Test result' })).toBeVisible();
  state.status = 503;
  let release!: () => void;
  state.wait = new Promise<void>(resolve => { release = resolve; });
  await page.getByRole('button', { name: t('templates.regenerate', Language.RU), exact: true }).click();
  await expect.poll(() => state.requests.length).toBe(2);
  await expect(page.getByRole('heading', { name: 'Test result' })).toBeVisible();
  await expect(page.getByRole('button', { name: t('templates.edit', Language.RU), exact: true })).toBeDisabled();
  release();
  state.wait = undefined;
  await expect(page.getByRole('status')).toContainText(t('templates.generateError', Language.RU));
  await expect(page.getByRole('heading', { name: 'Test result' })).toBeVisible();
  await expect(page.locator('#field-topic')).toHaveCount(0);
  state.status = 200;
  state.content = '# Replacement result\n\nNew text.';
  await page.getByRole('button', { name: t('templates.regenerate', Language.RU), exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Replacement result' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Test result' })).toHaveCount(0);
});

test('lecture longer than 2000 characters succeeds without truncation', async ({ page }) => {
  const state = await setup(page);
  await page.goto('/ai-helper/tools');
  await choose(page, 'lecture-transcript');
  await page.locator('#field-text').fill('Lecture text. '.repeat(160));
  await page.getByRole('button', { name: t('templates.generate', Language.RU), exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Test result' })).toBeVisible();
  expect(state.requests.at(-1)!.content.length).toBeGreaterThan(2000);
  expect(state.requests.at(-1)!.content).toContain('Lecture text. '.repeat(160));
});

for (const language of Object.values(Language)) {
  test(`${language}: oversized prompt is blocked before sending and can be shortened`, async ({ page }) => {
    const state = await setup(page, language);
    await page.goto('/ai-helper/tools');
    await choose(page, 'lecture-transcript', language);
    // Even 12000 source characters exceed the limit once instructions are included.
    await page.locator('#field-text').fill('x'.repeat(AI_TOOLS_INPUT_LIMIT));
    const generate = page.getByRole('button', { name: t('templates.generate', language), exact: true });
    await expect(generate).toBeDisabled();
    await expect(page.locator('#tools-input-limit [role="alert"]')).toHaveText(t('templates.inputTooLong', language));
    expect(state.requests).toHaveLength(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await page.locator('#field-text').fill('Lecture text. '.repeat(160));
    await expect(generate).toBeEnabled();
    await generate.click();
    await expect(page.getByRole('heading', { name: 'Test result' })).toBeVisible();
  });
}
