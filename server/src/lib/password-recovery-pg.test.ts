import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const databaseUrl = process.env.AUTH_TEST_DATABASE_URL;

describe('password recovery on isolated PostgreSQL', { skip: !databaseUrl }, () => {
  let db: typeof import('./database').prisma;
  let server: import('node:http').Server;
  let base: string;
  let user: { id: string; email: string };
  const realFetch = globalThis.fetch;
  const env = { ...process.env };
  let sentToken = '';
  let sendCount = 0;
  before(async () => {
    const { PrismaClient } = await import('../../prisma/generated');
    db = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    const shared = (await import('./database')).prisma;
    shared.$transaction = db.$transaction.bind(db);
    shared.user.findUnique = db.user.findUnique.bind(db.user);
    shared.user.update = db.user.update.bind(db.user);
    shared.passwordSetupToken.create = db.passwordSetupToken.create.bind(db.passwordSetupToken);
    shared.passwordSetupToken.findUnique = db.passwordSetupToken.findUnique.bind(db.passwordSetupToken);
    shared.passwordSetupToken.updateMany = db.passwordSetupToken.updateMany.bind(db.passwordSetupToken);
    user = await db.user.create({ data: { email: `${crypto.randomUUID()}@example.test`, name: 'Recovery fixture', country: 'RU', password: await (await import('./auth')).hashPassword('UnchangedPassword1') } });
    process.env.RESEND_API_KEY = 'mock-key'; process.env.EMAIL_FROM = 'noreply@example.test'; process.env.APP_BASE_URL = 'https://app.example.test';
    globalThis.fetch = (async (url: any, options?: any) => {
      if (String(url) === 'https://api.resend.com/emails') {
        const body = JSON.parse(options.body);
        sentToken = new URL(body.html.match(/href="([^"]+)"/)[1]).searchParams.get('token')!;
        sendCount++;
        return new Response(JSON.stringify({ id: 'mock-id' }), { status: 200 });
      }
      assert.ok(base && String(url).startsWith(base), 'Unexpected external request');
      return realFetch(url, options);
    }) as typeof fetch;
    const express = (await import('express')).default;
    const app = express(); app.use(express.json()); app.use('/api/auth', (await import('../api/auth')).default);
    server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
    base = `http://127.0.0.1:${(server.address() as import('node:net').AddressInfo).port}`;
  });
  after(async () => {
    globalThis.fetch = realFetch; process.env = env;
    if (server) await new Promise<void>(resolve => server.close(() => resolve()));
    if (db) { if (user) await db.user.delete({ where: { id: user.id } }); await db.$disconnect(); }
  });
  const post = (path: string, body: unknown) => fetch(`${base}/api/auth/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  it('persists a real reset token, sends via the mocked provider, and permits exactly one concurrent reset', async () => {
    const response = await post('forgot-password', { email: user.email });
    assert.equal(response.status, 200); assert.equal(sendCount, 1);
    const tokenHash = crypto.createHash('sha256').update(sentToken).digest('hex');
    const token = await db.passwordSetupToken.findUniqueOrThrow({ where: { tokenHash } });
    assert.equal(token.userId, user.id); assert.equal(token.usedAt, null);
    const responses = await Promise.all([
      post('set-password', { token: sentToken, password: 'ChangedPassword2' }),
      post('set-password', { token: sentToken, password: 'AnotherPassword3' }),
    ]);
    assert.deepEqual(responses.map(r => r.status).sort(), [200, 400]);
    assert.ok((await db.passwordSetupToken.findUniqueOrThrow({ where: { tokenHash } })).usedAt);
    const updated = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    assert.equal(updated.tokenVersion, 1);
    assert.equal((await post('set-password', { token: sentToken, password: 'ReplayPassword4' })).status, 400);
  });
  it('rejects a persisted expired token without changing the password', async () => {
    await post('forgot-password', { email: user.email });
    const tokenHash = crypto.createHash('sha256').update(sentToken).digest('hex');
    await db.passwordSetupToken.update({ where: { tokenHash }, data: { expiresAt: new Date(Date.now() - 1000) } });
    assert.equal((await fetch(`${base}/api/auth/set-password/verify?token=${sentToken}`)).status, 400);
    assert.equal((await post('set-password', { token: sentToken, password: 'ExpiredPassword5' })).status, 400);
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).tokenVersion, 1);
  });
});
