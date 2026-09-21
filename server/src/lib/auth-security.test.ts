import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto, { randomUUID } from 'node:crypto';

it('rejects passwords that exceed bcrypt\'s 72-byte UTF-8 limit', async () => {
  const {
    BCRYPT_PASSWORD_MAX_BYTES,
    comparePasswords,
    hashPassword,
    passwordFitsBcryptLimit,
  } = await import('./auth');
  const maximum = `Aa1${'x'.repeat(BCRYPT_PASSWORD_MAX_BYTES - 3)}`;
  const tooLong = `${maximum}x`;

  assert.equal(Buffer.byteLength(maximum, 'utf8'), 72);
  assert.equal(passwordFitsBcryptLimit(maximum), true);
  assert.equal(passwordFitsBcryptLimit(tooLong), false);
  await assert.rejects(hashPassword(tooLong), RangeError);

  const hash = await hashPassword(maximum);
  assert.equal(await comparePasswords(maximum, hash), true);
  assert.equal(await comparePasswords(tooLong, hash), false);
  assert.equal(passwordFitsBcryptLimit(`Aa1${'😀'.repeat(18)}`), false);
});

const databaseUrl = process.env.AUTH_TEST_DATABASE_URL;

describe('authentication security (isolated PostgreSQL)', { skip: !databaseUrl }, () => {
  let db: typeof import('./database').prisma;
  let server: import('node:http').Server;
  let baseUrl: string;
  let generateToken: typeof import('./auth').generateToken;
  let hashPassword: typeof import('./auth').hashPassword;
  let comparePasswords: typeof import('./auth').comparePasswords;
  const userIds: string[] = [];

  before(async () => {
    const { PrismaClient } = await import('../../prisma/generated');
    db = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    const shared = (await import('./database')).prisma;
    shared.$transaction = db.$transaction.bind(db);
    shared.user.findUnique = db.user.findUnique.bind(db.user);
    shared.user.update = db.user.update.bind(db.user);
    shared.passwordSetupToken.findUnique = db.passwordSetupToken.findUnique.bind(db.passwordSetupToken);
    shared.passwordSetupToken.updateMany = db.passwordSetupToken.updateMany.bind(db.passwordSetupToken);

    ({ generateToken, hashPassword, comparePasswords } = await import('./auth'));
    const express = (await import('express')).default;
    const router = (await import('../api/auth')).default;
    const app = express();
    app.use(express.json());
    app.use(router);
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as import('node:net').AddressInfo).port}`;
  });

  after(async () => {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
    if (db) {
      await db.user.deleteMany({ where: { id: { in: userIds } } });
      await db.$disconnect();
    }
  });

  async function fixture(password = 'CurrentPass1') {
    const user = await db.user.create({
      data: {
        email: `${randomUUID()}@auth.test`,
        password: await hashPassword(password),
        name: 'Auth test',
        country: 'RU',
      },
    });
    userIds.push(user.id);
    return user;
  }

  async function setupToken(userId: string) {
    const raw = `${randomUUID()}${randomUUID()}`;
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    const record = await db.passwordSetupToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    return { raw, record };
  }

  function bearer(user: { id: string; email: string; role: string; tokenVersion: number }) {
    return generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });
  }

  it('allows an unused setup token to change the password exactly once', async () => {
    const user = await fixture();
    const { raw } = await setupToken(user.id);
    const responses = await Promise.all([
      fetch(`${baseUrl}/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: raw, password: 'FirstPassword1' }),
      }),
      fetch(`${baseUrl}/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: raw, password: 'SecondPassword2' }),
      }),
    ]);

    assert.deepEqual(responses.map((response) => response.status).sort(), [200, 400]);
    const updated = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    assert.equal(updated.tokenVersion, 1);
    const accepted = await Promise.all([
      comparePasswords('FirstPassword1', updated.password),
      comparePasswords('SecondPassword2', updated.password),
    ]);
    assert.equal(accepted.filter(Boolean).length, 1);
  });

  it('rejects registration passwords longer than 72 UTF-8 bytes', async () => {
    const email = `${randomUUID()}@auth.test`;
    const response = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: `Aa1${'x'.repeat(70)}`,
        name: 'Long password',
        country: 'RU',
        language: 'RU',
      }),
    });
    assert.equal(response.status, 400);
    assert.equal(await db.user.count({ where: { email } }), 0);
  });

  it('revokes unused setup links when the password is changed', async () => {
    const user = await fixture();
    const { raw, record } = await setupToken(user.id);
    const token = bearer(user);
    const changed = await fetch(`${baseUrl}/change-password`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentPassword: 'CurrentPass1', newPassword: 'ChangedPassword2' }),
    });
    assert.equal(changed.status, 200);
    assert.ok((await db.passwordSetupToken.findUniqueOrThrow({ where: { id: record.id } })).usedAt);

    const replay = await fetch(`${baseUrl}/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: raw, password: 'AttackerPassword3' }),
    });
    assert.equal(replay.status, 400);
  });

  it('revokes the presented JWT on ordinary logout', async () => {
    const user = await fixture();
    const token = bearer(user);
    const loggedOut = await fetch(`${baseUrl}/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(loggedOut.status, 200);

    const replay = await fetch(`${baseUrl}/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(replay.status, 401);
  });
});
