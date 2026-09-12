import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import type { AddressInfo } from 'node:net';

// Explicit opt-in only. Never load the project's .env or use its normal DB.
const testUrl = process.env.AI_TEST_DATABASE_URL;
test('chat routes, migration and quota against isolated PostgreSQL', { skip: !testUrl }, async t => {
  const url = new URL(testUrl!);
  assert.equal(url.hostname, '127.0.0.1');
  assert.ok(url.pathname.startsWith('/adapted_ai_test'));
  const previousDatabase = process.env.DATABASE_URL;
  const previousKey = process.env.DEEPSEEK_API_KEY;
  process.env.DATABASE_URL = testUrl;
  process.env.DEEPSEEK_API_KEY = 'test-only-not-a-real-key';
  const { prisma } = await import('../src/lib/database');
  const { chatUsageDay, getChatUsage, reserveChatQuota, releaseChatQuota } = await import('../src/lib/chat-quota');
  const { generateToken } = await import('../src/lib/auth');
  const { default: router } = await import('../src/api/chat');
  const { default: express } = await import('express');
  const app = express();
  app.use(express.json());
  app.use('/api/chat', router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const originalFetch = globalThis.fetch;
  let providerStatus = 200;
  let providerCalls = 0;
  globalThis.fetch = async (input, init) => {
    if (String(input) === 'https://api.deepseek.com/v1/chat/completions') {
      providerCalls++;
      return providerStatus === 200
        ? Response.json({ choices: [{ message: { content: 'Hoy conocí a tres estudiantes.' } }] })
        : new Response('', { status: providerStatus });
    }
    throw new Error('Unexpected network request in test');
  };
  const userId = 'chat-test-user';
  const email = 'chat-test@example.invalid';
  const token = generateToken({ userId, email, role: 'STUDENT', tokenVersion: 0 });
  const request = (method: string, content?: string, mode = 'study') => originalFetch(`${base}/api/chat/messages`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(content === undefined ? {} : { body: JSON.stringify({ content, mode }) }),
  });
  try {
    await prisma.user.create({ data: { id: userId, email, name: 'Test', password: 'not-a-login-password', country: 'Test' } });
    await t.test('migration preserves historical usage, counting only user messages', async () => {
      const day = chatUsageDay();
      await prisma.chatMessage.createMany({ data: [
        { userId, content: 'old request', isUser: true, createdAt: day },
        { userId, content: 'old response', isUser: false, createdAt: day },
      ] });
      // Isolated, disposable test database, guarded above.
      await prisma.$executeRawUnsafe('DROP TABLE "chat_daily_usage"');
      const sql = await readFile(new URL('../prisma/migrations/20260912020000_add_chat_daily_usage/migration.sql', import.meta.url), 'utf8');
      for (const statement of sql.split(';').filter(s => s.trim())) await prisma.$executeRawUnsafe(statement);
      assert.equal(await getChatUsage(userId), 1);
    });
    await t.test('unauthenticated access remains protected', async () => {
      assert.equal((await originalFetch(`${base}/api/chat/messages`)).status, 401);
    });
    await t.test('clearing history does not reset usage', async () => {
      assert.equal((await request('DELETE')).status, 200);
      assert.equal(await prisma.chatMessage.count({ where: { userId } }), 0);
      assert.equal(await getChatUsage(userId), 1);
      const body = await (await request('GET')).json();
      assert.equal(body.usage.used, 1);
    });
    await t.test('success saves exactly a pair with no unrelated guides', async () => {
      const response = await request('POST', 'Переведи на испанский. Объясни слово из перевода.');
      assert.equal(response.status, 201);
      const body = await response.json();
      assert.deepEqual(body.data.relatedGuides, []);
      assert.equal(body.data.usage.used, 2);
      assert.equal(await prisma.chatMessage.count({ where: { userId } }), 2);
    });
    await t.test('provider error is explicit and refunds quota without saving a fake answer', async () => {
      providerStatus = 402;
      const previousCalls = providerCalls;
      const response = await request('POST', 'test failure');
      assert.equal(response.status, 503);
      assert.equal((await response.json()).error, 'AI_UNAVAILABLE');
      assert.equal(providerCalls - previousCalls, 1);
      assert.equal(await getChatUsage(userId), 2);
      assert.equal(await prisma.chatMessage.count({ where: { userId } }), 2);
      providerStatus = 200;
    });
    await t.test('missing configuration consumes no quota', async () => {
      delete process.env.DEEPSEEK_API_KEY;
      const response = await request('POST', 'test missing key');
      assert.equal(response.status, 503);
      assert.equal((await response.json()).error, 'AI_SERVICE_NOT_CONFIGURED');
      assert.equal(await getChatUsage(userId), 2);
      process.env.DEEPSEEK_API_KEY = 'test-only-not-a-real-key';
    });
    await t.test('blank input consumes no quota', async () => {
      assert.equal((await request('POST', '   ')).status, 400);
      assert.equal(await getChatUsage(userId), 2);
    });
    await t.test('concurrent reservations cannot exceed the daily allowance', async () => {
      const results = await Promise.all(Array.from({ length: 25 }, () => reserveChatQuota(userId, 15)));
      assert.equal(results.filter(Boolean).length, 13);
      assert.equal(await getChatUsage(userId), 15);
    });
    await t.test('daily limit also applies to generator, even after history deletion', async () => {
      await request('DELETE');
      const previousCalls = providerCalls;
      const response = await request('POST', 'Write a letter', 'generator');
      assert.equal(response.status, 429);
      assert.equal((await response.json()).error, 'LIMIT_FREEMIUM');
      assert.equal(providerCalls, previousCalls);
    });
    await t.test('premium uses its own allowance and error code', async () => {
      await prisma.user.update({ where: { id: userId }, data: { plan: 'PREMIUM' } });
      assert.equal((await request('POST', 'Premium test')).status, 201);
      await prisma.chatDailyUsage.update({ where: { userId_day: { userId, day: chatUsageDay() } }, data: { used: 200 } });
      const response = await request('POST', 'Premium limit test');
      assert.equal(response.status, 429);
      assert.equal((await response.json()).error, 'LIMIT_PREMIUM');
    });
    await t.test('UTC date rollover and refunds target the original day', async () => {
      const day = chatUsageDay(new Date('2030-01-02T23:59:59Z'));
      const nextDay = chatUsageDay(new Date('2030-01-03T00:00:01Z'));
      assert.equal(await reserveChatQuota(userId, 1, day), true);
      assert.equal(await reserveChatQuota(userId, 1, day), false);
      assert.equal(await reserveChatQuota(userId, 1, nextDay), true);
      await releaseChatQuota(userId, day);
      assert.equal(await getChatUsage(userId, day), 0);
      assert.equal(await getChatUsage(userId, nextDay), 1);
    });
    await t.test('generator accepts long input; oversized requests consume no quota', async () => {
      await prisma.chatDailyUsage.update({ where: { userId_day: { userId, day: chatUsageDay() } }, data: { used: 0 } });
      const previousCalls = providerCalls;
      const tooLong = await request('POST', 'x'.repeat(12001), 'generator');
      assert.equal(tooLong.status, 400);
      assert.equal((await tooLong.json()).error, 'AI_INPUT_TOO_LONG');
      const chatTooLong = await request('POST', 'x'.repeat(2001), 'study');
      assert.equal(chatTooLong.status, 400);
      assert.equal((await chatTooLong.json()).error, 'CHAT_INPUT_TOO_LONG');
      assert.equal(await getChatUsage(userId), 0);
      assert.equal(providerCalls, previousCalls);
      const content = 'Lecture text. '.repeat(250);
      assert.equal((await request('POST', content, 'generator')).status, 201);
      assert.equal(await getChatUsage(userId), 1);
      assert.equal(await prisma.chatMessage.count({ where: { userId, content: content.trim(), isUser: true } }), 1);
    });
  } finally {
    globalThis.fetch = originalFetch;
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    if (previousDatabase === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabase;
    if (previousKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = previousKey;
  }
});
