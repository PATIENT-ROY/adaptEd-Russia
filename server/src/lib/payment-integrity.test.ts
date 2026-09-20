import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  addSubscriptionMonths,
  assertVerifiedPayment,
  calculatePremiumEntitlement,
} from './apply-premium';
import { createPayment, getPayment } from './yookassa';

it('clamps monthly and yearly access at the end of the month', () => {
  assert.equal(addSubscriptionMonths(new Date('2028-01-31T12:00:00Z'), 1).toISOString(), '2028-02-29T12:00:00.000Z');
  assert.equal(addSubscriptionMonths(new Date('2028-02-29T12:00:00Z'), 12).toISOString(), '2029-02-28T12:00:00.000Z');
});

it('replays remaining purchases across continuous access and gaps', () => {
  const first = new Date('2028-01-01T00:00:00Z');
  const second = new Date('2028-01-15T00:00:00Z');
  const afterGap = new Date('2029-01-01T00:00:00Z');
  const result = calculatePremiumEntitlement([
    { id: 'a', planId: 'month', durationMonths: 1, appliedAt: first },
    { id: 'b', planId: 'quarter', durationMonths: 3, appliedAt: second },
    { id: 'c', planId: 'month', durationMonths: 1, appliedAt: afterGap },
  ]);
  assert.equal(result?.startDate.toISOString(), afterGap.toISOString());
  assert.equal(result?.endDate.toISOString(), '2029-02-01T00:00:00.000Z');
  assert.equal(result?.paymentId, 'c');
});

it('rejects missing provider ids, mismatched amounts/currencies, and unpaid successes', () => {
  const payment = { yooKassaPaymentId: 'live-1', amount: 549, currency: 'RUB' };
  const verified = { id: 'live-1', status: 'succeeded', paid: true, amount: { value: '549.00', currency: 'RUB' } };
  assert.doesNotThrow(() => assertVerifiedPayment(payment, verified));
  assert.throws(() => assertVerifiedPayment({ ...payment, yooKassaPaymentId: null }, verified));
  for (const wrong of [
    { ...verified, id: 'other' }, { ...verified, paid: false },
    { ...verified, amount: { value: '199.00', currency: 'RUB' } },
    { ...verified, amount: { value: '549.00', currency: 'USD' } },
  ]) assert.throws(() => assertVerifiedPayment(payment, wrong));
});

it('sends the selected payment method and stable retry key to YooKassa', async () => {
  const previous = process.env.YOOKASSA_USE_MOCK;
  const originalFetch = globalThis.fetch;
  process.env.YOOKASSA_USE_MOCK = 'false';
  try {
    for (const [method, type] of [['CARD', 'bank_card'], ['SBP', 'sbp'], ['WALLET', 'yoo_money']] as const) {
      globalThis.fetch = async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        assert.equal(body.payment_method_data.type, type);
        assert.equal(body.amount.value, '549.00');
        assert.match(body.confirmation.return_url, /payment_id=local-id$/);
        assert.equal((init?.headers as Record<string, string>)['Idempotence-Key'], 'local-id');
        return new Response(JSON.stringify({ id: 'provider-id', status: 'pending' }));
      };
      await createPayment(549, 'Subscription', {}, {
        paymentMethod: method, idempotenceKey: 'local-id', returnUrlPaymentId: 'local-id',
      });
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (previous === undefined) delete process.env.YOOKASSA_USE_MOCK;
    else process.env.YOOKASSA_USE_MOCK = previous;
  }
});

it('never turns a real payment into a mock success when credentials are unavailable', async () => {
  const previous = process.env.YOOKASSA_USE_MOCK;
  process.env.YOOKASSA_USE_MOCK = 'true';
  try { await assert.rejects(getPayment('real-provider-id'), /not configured/); }
  finally {
    if (previous === undefined) delete process.env.YOOKASSA_USE_MOCK;
    else process.env.YOOKASSA_USE_MOCK = previous;
  }
});

// Opt-in: only an explicitly supplied disposable database is used for integration tests.
const databaseUrl = process.env.PAYMENT_TEST_DATABASE_URL;
describe('payment integration (isolated PostgreSQL)', { skip: !databaseUrl }, () => {
  let db: typeof import('./database').prisma;
  let apply: typeof import('./apply-premium').applyVerifiedPayment;
  let applyRefund: typeof import('./apply-premium').applyVerifiedRefund;
  let sync: typeof import('./apply-premium').synchronizePayment;
  let server: import('node:http').Server;
  let baseUrl: string;
  let token: (user: any) => string;
  const users: string[] = [];
  const planId = randomUUID();
  const originalFetch = globalThis.fetch;

  before(async () => {
    // The shared client may already be imported, so provide a separate explicit datasource.
    const { PrismaClient } = await import('../../prisma/generated');
    db = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    const shared = (await import('./database')).prisma;
    // Run production transactions and queries against only this isolated database.
    shared.$transaction = db.$transaction.bind(db);
    shared.payment.findUnique = db.payment.findUnique.bind(db.payment);
    shared.payment.findFirst = db.payment.findFirst.bind(db.payment);
    shared.payment.findMany = db.payment.findMany.bind(db.payment);
    shared.user.findUnique = db.user.findUnique.bind(db.user);
    shared.webhookLog.create = db.webhookLog.create.bind(db.webhookLog);
    ({
      applyVerifiedPayment: apply,
      applyVerifiedRefund: applyRefund,
      synchronizePayment: sync,
    } = await import('./apply-premium'));
    const express = (await import('express')).default;
    const router = (await import('../api/payments')).default;
    const auth = await import('./auth');
    token = (user) => auth.generateToken({ userId: user.id, email: user.email, role: user.role, tokenVersion: 0 });
    const app = express();
    app.use(express.json());
    app.use(router);
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as import('node:net').AddressInfo).port}`;
    await db.subscriptionPlan.create({ data: { id: planId, name: 'Payment regression fixture',
      price: 549, durationMonths: 3, features: '[]' } });
  });

  after(async () => {
    globalThis.fetch = originalFetch;
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
    if (db) {
      await db.subscription.deleteMany({ where: { userId: { in: users } } });
      await db.payment.deleteMany({ where: { userId: { in: users } } });
      await db.user.deleteMany({ where: { id: { in: users } } });
      await db.subscriptionPlan.delete({ where: { id: planId } });
      await db.$disconnect();
    }
  });

  async function fixture(role = 'STUDENT', providerId: string | null = randomUUID()) {
    const user = await db.user.create({ data: { email: `${randomUUID()}@payment.test`,
      password: 'unused', name: 'Payment test', country: 'RU', role } });
    users.push(user.id);
    const payment = await purchase(user.id, providerId);
    return { user, payment };
  }
  function purchase(userId: string, providerId: string | null = randomUUID()) {
    return db.payment.create({ data: { userId, planId, amount: 549, currency: 'RUB',
      durationMonths: 3, description: 'Payment regression fixture', yooKassaPaymentId: providerId } });
  }
  const success = (id: string) => ({ id, status: 'succeeded', paid: true,
    amount: { value: '549.00', currency: 'RUB' } });
  const refund = (id: string, paymentId: string, value = '549.00') => ({
    id,
    payment_id: paymentId,
    status: 'succeeded',
    amount: { value, currency: 'RUB' },
  });

  it('rejects an orphan payment through the public apply endpoint', async () => {
    const { user, payment } = await fixture('STUDENT', null);
    await assert.rejects(sync(payment.id), /no provider confirmation/);
    const response = await originalFetch(`${baseUrl}/apply-premium/${payment.id}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token(user)}` },
    });
    assert.equal(response.status, 400);
    assert.equal(await db.subscription.count({ where: { userId: user.id } }), 0);
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).plan, 'FREEMIUM');
  });

  it('rejects unpaid provider status via the apply endpoint', async () => {
    const { user, payment } = await fixture();
    const prev = process.env.YOOKASSA_USE_MOCK;
    process.env.YOOKASSA_USE_MOCK = 'false';
    globalThis.fetch = async () => new Response(JSON.stringify({ ...success(payment.yooKassaPaymentId!), status: 'pending', paid: false }));
    try {
      const response = await originalFetch(`${baseUrl}/apply-premium/${payment.id}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token(user)}` },
      });
      assert.equal(response.status, 400);
      assert.equal(await db.subscription.count({ where: { userId: user.id } }), 0);
    } finally {
      globalThis.fetch = originalFetch;
      if (prev === undefined) delete process.env.YOOKASSA_USE_MOCK;
      else process.env.YOOKASSA_USE_MOCK = prev;
    }
  });

  it('applies concurrent duplicate notifications exactly once', async () => {
    const { user, payment } = await fixture();
    const results = await Promise.all(Array.from({ length: 5 }, () => apply(payment.id, success(payment.yooKassaPaymentId!))));
    assert.equal(new Set(results.map((r) => r.appliedAt?.toISOString())).size, 1);
    const first = await db.subscription.findUniqueOrThrow({ where: { userId: user.id } });
    await apply(payment.id, success(payment.yooKassaPaymentId!));
    const again = await db.subscription.findUniqueOrThrow({ where: { userId: user.id } });
    assert.equal(again.endDate.toISOString(), first.endDate.toISOString());
    assert.equal(first.autoRenew, false);
  });

  it('extends remaining access for different concurrent purchases and ignores old replays', async () => {
    const { user, payment } = await fixture();
    await apply(payment.id, success(payment.yooKassaPaymentId!));
    const first = await db.subscription.findUniqueOrThrow({ where: { userId: user.id } });
    const second = await purchase(user.id);
    const third = await purchase(user.id);
    await Promise.all([second, third].map((p) => apply(p.id, success(p.yooKassaPaymentId!))));
    const extended = await db.subscription.findUniqueOrThrow({ where: { userId: user.id } });
    assert.equal(extended.endDate.toISOString(), addSubscriptionMonths(addSubscriptionMonths(first.endDate, 3), 3).toISOString());
    await apply(payment.id, success(payment.yooKassaPaymentId!));
    assert.equal((await db.subscription.findUniqueOrThrow({ where: { userId: user.id } })).endDate.toISOString(), extended.endDate.toISOString());
  });

  it('blocks real sandbox and local mock successes for ordinary users', async () => {
    for (const id of [randomUUID(), `test_${randomUUID()}`]) {
      const { user, payment } = await fixture('STUDENT', id);
      await assert.rejects(apply(payment.id, { ...success(id), test: true }), /PAYMENT_TEST_ONLY/);
      assert.equal(await db.subscription.count({ where: { userId: user.id } }), 0);
      assert.equal((await db.payment.findUniqueOrThrow({ where: { id: payment.id } })).status, 'PENDING');
    }
  });

  it('uses the purchased duration even after the plan changes', async () => {
    const { user, payment } = await fixture();
    await db.subscriptionPlan.update({ where: { id: planId }, data: { durationMonths: 12, price: 999 } });
    try {
      await apply(payment.id, success(payment.yooKassaPaymentId!));
      const sub = await db.subscription.findUniqueOrThrow({ where: { userId: user.id } });
      assert.equal(sub.endDate.toISOString(), addSubscriptionMonths(sub.startDate, 3).toISOString());
    } finally {
      await db.subscriptionPlan.update({ where: { id: planId }, data: { durationMonths: 3, price: 549 } });
    }
  });

  it('rolls back all changes on a wrong amount', async () => {
    const { user, payment } = await fixture();
    await assert.rejects(apply(payment.id, { ...success(payment.yooKassaPaymentId!), amount: { value: '1.00', currency: 'RUB' } }));
    assert.equal(await db.subscription.count({ where: { userId: user.id } }), 0);
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).plan, 'FREEMIUM');
    assert.equal((await db.payment.findUniqueOrThrow({ where: { id: payment.id } })).appliedAt, null);
  });

  it('keeps access for partial refunds and applies webhook retries once', async () => {
    const { user, payment } = await fixture();
    await apply(payment.id, success(payment.yooKassaPaymentId!));
    const before = await db.subscription.findUniqueOrThrow({ where: { userId: user.id } });

    const partial = refund('refund-partial', payment.yooKassaPaymentId!, '100.00');
    const first = await applyRefund(partial);
    const repeated = await applyRefund(partial);
    assert.equal(first.fullyRefunded, false);
    assert.equal(repeated.alreadyProcessed, true);
    assert.equal(await db.paymentRefund.count({ where: { paymentId: payment.id } }), 1);
    assert.equal((await db.payment.findUniqueOrThrow({ where: { id: payment.id } })).status, 'SUCCEEDED');
    assert.equal(
      (await db.subscription.findUniqueOrThrow({ where: { userId: user.id } })).endDate.toISOString(),
      before.endDate.toISOString(),
    );

    const completed = await applyRefund(refund('refund-rest', payment.yooKassaPaymentId!, '449.00'));
    assert.equal(completed.fullyRefunded, true);
    assert.equal((await db.payment.findUniqueOrThrow({ where: { id: payment.id } })).status, 'REFUNDED');
    assert.equal((await db.subscription.findUniqueOrThrow({ where: { userId: user.id } })).status, 'CANCELED');
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).plan, 'FREEMIUM');
  });

  it('verifies and applies a mock refund through the public webhook route', async () => {
    const providerId = `test_${randomUUID()}`;
    const { user, payment } = await fixture('ADMIN', providerId);
    await apply(payment.id, { ...success(providerId), test: true });

    const refundId = providerId.replace(/^test_/, 'test_refund_');
    const response = await originalFetch(`${baseUrl}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'refund.succeeded', object: { id: refundId } }),
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).fullyRefunded, true);
    assert.equal((await db.payment.findUniqueOrThrow({ where: { id: payment.id } })).status, 'REFUNDED');
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: user.id } })).plan, 'FREEMIUM');
  });

  it('rebuilds stacked access when older and newer purchases are refunded', async () => {
    const { user, payment: first } = await fixture();
    await apply(first.id, success(first.yooKassaPaymentId!));
    const second = await purchase(user.id);
    const secondApplied = await apply(second.id, success(second.yooKassaPaymentId!));
    const third = await purchase(user.id);
    await apply(third.id, success(third.yooKassaPaymentId!));

    await applyRefund(refund('refund-oldest', first.yooKassaPaymentId!));
    let subscription = await db.subscription.findUniqueOrThrow({ where: { userId: user.id } });
    assert.equal(subscription.paymentId, third.id);
    assert.equal(
      subscription.endDate.toISOString(),
      addSubscriptionMonths(addSubscriptionMonths(secondApplied.appliedAt!, 3), 3).toISOString(),
    );

    await applyRefund(refund('refund-newest', third.yooKassaPaymentId!));
    subscription = await db.subscription.findUniqueOrThrow({ where: { userId: user.id } });
    assert.equal(subscription.status, 'ACTIVE');
    assert.equal(subscription.paymentId, second.id);
    assert.equal(
      subscription.endDate.toISOString(),
      addSubscriptionMonths(secondApplied.appliedAt!, 3).toISOString(),
    );
  });

  it('rejects refund currency mismatches and over-refunds atomically', async () => {
    const { payment } = await fixture();
    await apply(payment.id, success(payment.yooKassaPaymentId!));
    await assert.rejects(
      applyRefund({
        ...refund('refund-usd', payment.yooKassaPaymentId!),
        amount: { value: '549.00', currency: 'USD' },
      }),
      /currency/i,
    );
    await assert.rejects(
      applyRefund(refund('refund-too-large', payment.yooKassaPaymentId!, '550.00')),
      /exceeds/i,
    );
    assert.equal(await db.paymentRefund.count({ where: { paymentId: payment.id } }), 0);
    assert.equal((await db.payment.findUniqueOrThrow({ where: { id: payment.id } })).status, 'SUCCEEDED');
  });
});
