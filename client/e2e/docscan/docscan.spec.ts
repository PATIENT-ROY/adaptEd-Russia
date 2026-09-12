import { test, expect, type Page } from '@playwright/test';
import { t } from '../../src/lib/translations';
import { Language } from '../../src/types';
import { OCR_LANGUAGES } from '../../src/lib/docscan-ocr';

async function setup(page: Page, language: Language, imagePage = false) {
  await page.addInitScript(({ language, imagePage }) => {
    localStorage.setItem('language', language);
    localStorage.setItem('token', 'docscan-test-not-a-real-token');
    localStorage.setItem('user', JSON.stringify({ id: 'scan-test', name: 'Test', email: 'test@example.invalid', role: 'STUDENT', plan: 'FREEMIUM', language }));
    const state = { jobs: [] as Array<{ action: string; payload: Record<string, unknown> }>, terminated: 0, pdfDestroyed: false };
    Object.assign(window, { scanTest: state });
    // UI contract test: emulate only the worker protocol, no external OCR service.
    class FakeWorker {
      onmessage?: (event: { data: unknown }) => void;
      postMessage(job: { action: string; payload: Record<string, unknown> }) {
        state.jobs.push(job);
        queueMicrotask(() => this.onmessage?.({ data: { ...job, status: 'resolve', data: job.action === 'recognize' ? { text: 'Recognized document 12345', confidence: 86 } : {} } }));
      }
      terminate() { state.terminated++; }
    }
    Object.defineProperty(window, 'Worker', { value: FakeWorker, configurable: true });
    Object.assign(window, { pdfjsLib: {
      OPS: { paintImageXObject: 85 },
      getDocument: () => ({ promise: Promise.resolve({
        numPages: 1,
        getPage: async () => ({
          getTextContent: async () => ({ items: [{ str: 'Original PDF document 12345', hasEOL: true }] }),
          getOperatorList: async () => ({ fnArray: imagePage ? [85] : [] }),
          getViewport: ({ scale }: { scale: number }) => ({ width: 600 * scale, height: 800 * scale }),
          render: () => ({ promise: Promise.resolve() }),
          cleanup: () => {},
        }),
        destroy: async () => { state.pdfDestroyed = true; },
      }) }),
    } });
  }, { language, imagePage });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { unreadCount: 0 } }) });
    return url.origin === 'http://127.0.0.1:3017' ? route.continue() : route.abort();
  });
}

async function uploadPdf(page: Page, language: Language) {
  await page.goto('/docscan');
  await page.locator('input[type="file"]').setInputFiles({ name: 'synthetic.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test fixture') });
  await page.getByRole('button', { name: t('docscan.upload', language), exact: true }).click();
}

for (const language of Object.values(Language)) {
  test(`${language}: native PDF text is preserved without an invented 100%`, async ({ page }) => {
    await setup(page, language);
    await uploadPdf(page, language);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Original PDF document 12345');
    await expect(dialog).toContainText(t('docscan.result.nativeText', language));
    await expect(dialog).not.toContainText('100%');
    await expect(dialog).toContainText(t('docscan.result.confidenceNote', language));
    expect(await page.evaluate(() => (window as unknown as { scanTest: { jobs: unknown[] } }).scanTest.jobs.length)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
}

test('image-containing PDF uses selected OCR language and keeps the real 86% score', async ({ page }) => {
  await setup(page, Language.RU, true);
  await page.goto('/docscan');
  await expect(page.locator('#docscan-source-language option')).toHaveCount(6);
  await page.locator('#docscan-source-language').selectOption('es');
  await page.locator('input[type="file"]').setInputFiles({ name: 'scan.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test fixture') });
  await page.getByRole('button', { name: t('docscan.upload', Language.RU), exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Recognized document 12345');
  await expect(dialog).toContainText('86%');
  await expect(dialog).not.toContainText('Original PDF document');
  const state = await page.evaluate(() => (window as unknown as { scanTest: { jobs: Array<{ action: string; payload: Record<string, unknown> }>; terminated: number; pdfDestroyed: boolean } }).scanTest);
  expect(state.jobs.find(job => job.action === 'loadLanguage')?.payload.langs).toBe(OCR_LANGUAGES.es);
  expect(state.jobs.find(job => job.action === 'setParameters')?.payload.params).toMatchObject({ tessedit_pageseg_mode: '3' });
  expect(state.terminated).toBe(1);
  expect(state.pdfDestroyed).toBe(true);
});

test('photo upload passes through canvas preparation and releases the OCR worker', async ({ page }) => {
  await setup(page, Language.RU);
  await page.goto('/docscan');
  const encoded = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 560;
    canvas.height = 300;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.fillText('Synthetic document 12345', 20, 40);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('input[type="file"]').setInputFiles({ name: 'synthetic.png', mimeType: 'image/png', buffer: Buffer.from(encoded, 'base64') });
  await page.getByRole('button', { name: t('docscan.upload', Language.RU), exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Recognized document 12345');
  await expect.poll(() => page.evaluate(() => (window as unknown as { scanTest: { terminated: number } }).scanTest.terminated)).toBe(1);
});
