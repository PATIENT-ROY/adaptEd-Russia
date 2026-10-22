import { after, before, beforeEach, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';
import { prisma } from './database';
import { hashPassword, comparePasswords } from './auth';
import router from '../api/auth';
import type { PasswordSetupToken } from '../../prisma/generated';
const realFetch = globalThis.fetch, realInfo = console.info, realError = console.error, env = { ...process.env };
let server: import('node:http').Server, base: string, known = true, version = 0, password = '';
let tokens: PasswordSetupToken[] = [], calls: { body: any; headers: Headers }[] = [], logs: unknown[][] = [];
let status = 200, gate: Promise<void> | undefined, transportError = false;
const user = { id: 'isolated-user', email: 'recovery@example.test' };
const generic = { success: true, message: 'Если аккаунт существует, инструкция по восстановлению будет отправлена на почту.' };
before(async () => {
  // No real database or provider: all used persistence methods and outbound mail are replaced.
  prisma.user.findUnique = (async () => known ? user : null) as any;
  prisma.user.update = (async ({ data }: any) => { password = data.password; version++; return user; }) as any;
  prisma.passwordSetupToken.create = (async ({ data }: any) => {
    const token = { ...data, id: crypto.randomUUID(), usedAt: null, createdAt: new Date() }; tokens.push(token); return token;
  }) as any;
  prisma.passwordSetupToken.findUnique = (async ({ where, include }: any) => {
    const token = tokens.find(t => t.tokenHash === where.tokenHash);
    return token ? { ...token, ...(include ? { user: { ...user, name: 'Test' } } : {}) } : null;
  }) as any;
  prisma.passwordSetupToken.updateMany = (async ({ where, data }: any) => {
    const matches = tokens.filter(t => (!where.id || t.id === where.id) && (!where.userId || t.userId === where.userId) &&
      (where.usedAt !== null || t.usedAt === null) && (!where.expiresAt?.gt || t.expiresAt > where.expiresAt.gt));
    for (const token of matches) Object.assign(token, data); return { count: matches.length };
  }) as any;
  prisma.$transaction = (async (fn: any) => fn({ user: prisma.user, passwordSetupToken: prisma.passwordSetupToken, $queryRaw: async () => [] })) as any;
  globalThis.fetch = (async (url: any, options?: any) => {
    if (String(url) === 'https://api.resend.com/emails') {
      calls.push({ body: JSON.parse(options.body), headers: new Headers(options.headers) });
      if (gate) await gate;
      if (transportError) throw new Error('sensitive provider text');
      return new Response(JSON.stringify({ id: 'mock-id', message: 'PRIVATE provider payload' }), { status });
    }
    assert.ok(base && String(url).startsWith(base), 'Unexpected external request'); return realFetch(url, options);
  }) as typeof fetch;
  console.info = (...args) => { logs.push(args); }; console.error = (...args) => { logs.push(args); };
  const app = express(); app.use(express.json()); app.use('/api/auth', router);
  server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as import('node:net').AddressInfo).port}`;
});
beforeEach(async () => {
  process.env.RESEND_API_KEY = 'mock-key-not-real'; process.env.EMAIL_FROM = 'AdaptEd <noreply@example.test>';
  process.env.APP_BASE_URL = 'https://app.example.test'; process.env.EMAIL_MAX_RETRIES = '1';
  known = true; version = 0; tokens = []; calls = []; logs = []; status = 200; gate = undefined; transportError = false;
  password = await hashPassword('UnchangedPassword1');
});
after(async () => {
  globalThis.fetch = realFetch; console.info = realInfo; console.error = realError; process.env = env;
  if (server) await new Promise<void>(resolve => server.close(() => resolve()));
});
const post = (path: string, data: unknown) => fetch(`${base}/api/auth/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
const request = (email = user.email) => post('forgot-password', { email });
const raw = () => new URL(calls[0].body.html.match(/href="([^"]+)"/)[1]).searchParams.get('token')!;
it('awaits provider, uses configured sender and HTTPS URL, stores hash with one-hour expiry', async () => {
  let release!: () => void; gate = new Promise(resolve => { release = resolve; }); let responded = false;
  const pending = request('  RECOVERY@example.test  ').then(r => { responded = true; return r; });
  while (!calls.length) await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(responded, false); release(); const response = await pending;
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), generic);
  assert.equal(calls[0].headers.get('authorization'), 'Bearer mock-key-not-real');
  assert.equal(calls[0].body.from, process.env.EMAIL_FROM); assert.deepEqual(calls[0].body.to, [user.email]);
  assert.match(raw(), /^[a-f0-9]{64}$/);
  assert.equal(tokens[0].tokenHash, crypto.createHash('sha256').update(raw()).digest('hex'));
  assert.ok(tokens[0].expiresAt.getTime() > Date.now() + 3590_000);
  assert.match(calls[0].body.html, /https:\/\/app.example.test\/set-password\?token=/);
  assert.ok(!JSON.stringify(logs).includes(raw())); assert.ok(await comparePasswords('UnchangedPassword1', password));
});
it('provider rejection is logged safely, failed token revoked, public response unchanged', async () => {
  status = 403; const response = await request(); assert.equal(response.status, 200); assert.deepEqual(await response.json(), generic);
  assert.ok(tokens[0].usedAt); const log = JSON.stringify(logs); assert.match(log, /email_failed/); assert.match(log, /403/);
  for (const secret of [raw(), user.email, 'PRIVATE', 'mock-key-not-real']) assert.ok(!log.includes(secret));
});
it('missing mail configuration is observable only in logs', async () => {
  delete process.env.RESEND_API_KEY; assert.deepEqual(await (await request()).json(), generic);
  assert.equal(calls.length, 0); assert.ok(tokens[0].usedAt); assert.match(JSON.stringify(logs), /missing_configuration/);
});
it('unknown email gets the same public response without token or mail', async () => {
  known = false; const response = await request('unknown@example.test');
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), generic); assert.equal(tokens.length, 0); assert.equal(calls.length, 0);
});
it('resend creates a fresh token and another provider request', async () => {
  await request(); await request(); assert.equal(calls.length, 2); assert.notEqual(tokens[0].tokenHash, tokens[1].tokenHash);
  assert.notEqual(calls[0].headers.get('idempotency-key'), calls[1].headers.get('idempotency-key'));
});
it('expired tokens fail verification and cannot change a password', async () => {
  await request(); const token = raw(); tokens[0].expiresAt = new Date(Date.now() - 1);
  assert.equal((await fetch(`${base}/api/auth/set-password/verify?token=${token}`)).status, 400);
  assert.equal((await post('set-password', { token, password: 'ChangedPassword2' })).status, 400);
  assert.equal(version, 0); assert.ok(await comparePasswords('UnchangedPassword1', password));
});
it('reset is single-use and invalidates all outstanding links', async () => {
  await request(); await request(); const token = raw();
  assert.equal((await fetch(`${base}/api/auth/set-password/verify?token=${token}`)).status, 200);
  assert.equal((await post('set-password', { token, password: 'ChangedPassword2' })).status, 200);
  assert.equal(version, 1); assert.ok(await comparePasswords('ChangedPassword2', password)); assert.ok(tokens.every(t => t.usedAt));
  assert.equal((await post('set-password', { token, password: 'AnotherPassword3' })).status, 400);
  assert.equal((await fetch(`${base}/api/auth/set-password/verify?token=${token}`)).status, 400); assert.equal(version, 1);
});
it('invalid input creates no token and sends no mail', async () => {
  assert.equal((await request('invalid')).status, 400); assert.equal(calls.length, 0); assert.equal(tokens.length, 0);
});
it('transport errors are retried and sanitized', async () => {
  transportError = true; assert.deepEqual(await (await request()).json(), generic);
  assert.equal(calls.length, 2); assert.ok(tokens[0].usedAt); assert.ok(!JSON.stringify(logs).includes('sensitive'));
});
it('unsafe configured URL cannot generate a reset link', async () => {
  process.env.APP_BASE_URL = 'https://example.test/incorrect-path'; assert.deepEqual(await (await request()).json(), generic);
  assert.equal(tokens.length, 0); assert.equal(calls.length, 0); assert.match(JSON.stringify(logs), /configuration/);
});
