import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addMonths,
  computePaidWindow,
  hasPaidEntitlement,
  isComplimentaryGrantActive,
  resolveEffectivePlan,
  resolveSubscriptionAfterPayment,
  snapshotAfterCancel,
  subscriptionDurationMonths,
} from './effective-plan';
import { getNotesParseQuotaConfig, PLAN_CONFIG } from './plan-limits';

const now = new Date('2026-09-04T12:00:00.000Z');

function sub(overrides: {
  status: string;
  startDate?: Date;
  endDate?: Date;
}) {
  return {
    status: overrides.status,
    startDate: overrides.startDate ?? new Date('2026-08-04T12:00:00.000Z'),
    endDate: overrides.endDate ?? new Date('2026-10-04T12:00:00.000Z'),
  };
}

describe('PLAN_CONFIG', () => {
  it('keeps confirmed chat limits', () => {
    assert.equal(PLAN_CONFIG.FREEMIUM.dailyMessages, 15);
    assert.equal(PLAN_CONFIG.PREMIUM.dailyMessages, 200);
    assert.equal(PLAN_CONFIG.FREEMIUM.maxTokens, 1500);
    assert.equal(PLAN_CONFIG.PREMIUM.maxTokens, 3000);
  });
});

describe('subscriptionDurationMonths', () => {
  it('uses yearly interval', () => {
    assert.equal(subscriptionDurationMonths({ interval: 'YEARLY', name: 'Премиум' }), 12);
  });

  it('detects 6-month SKU even if interval is MONTHLY', () => {
    assert.equal(
      subscriptionDurationMonths({ interval: 'MONTHLY', name: 'Премиум (6 месяцев)' }),
      6,
    );
  });

  it('defaults monthly to 1', () => {
    assert.equal(subscriptionDurationMonths({ interval: 'MONTHLY', name: 'Премиум (месяц)' }), 1);
  });
});

describe('resolveEffectivePlan', () => {
  it('grants Premium from an active in-window subscription even if User.plan is FREEMIUM', () => {
    assert.equal(
      resolveEffectivePlan({
        userPlan: 'FREEMIUM',
        subscription: sub({ status: 'ACTIVE' }),
        now,
      }),
      'PREMIUM',
    );
  });

  it('keeps Premium after cancel while the paid window remains', () => {
    assert.equal(
      resolveEffectivePlan({
        userPlan: 'FREEMIUM',
        subscription: sub({ status: 'CANCELED' }),
        now,
      }),
      'PREMIUM',
    );
  });

  it('does not grant Premium for expired ACTIVE status leftover', () => {
    assert.equal(
      resolveEffectivePlan({
        userPlan: 'PREMIUM',
        subscription: sub({
          status: 'ACTIVE',
          endDate: new Date('2026-08-01T00:00:00.000Z'),
        }),
        now,
      }),
      'FREEMIUM',
    );
  });

  it('does not grant Premium for EXPIRED subscription even if User.plan is PREMIUM', () => {
    assert.equal(
      resolveEffectivePlan({
        userPlan: 'PREMIUM',
        subscription: sub({
          status: 'EXPIRED',
          endDate: new Date('2026-08-01T00:00:00.000Z'),
        }),
        now,
      }),
      'FREEMIUM',
    );
  });

  it('does not grant Premium for CANCELED after endDate', () => {
    assert.equal(
      resolveEffectivePlan({
        userPlan: 'PREMIUM',
        subscription: sub({
          status: 'CANCELED',
          endDate: new Date('2026-08-20T00:00:00.000Z'),
        }),
        now,
      }),
      'FREEMIUM',
    );
  });

  it('ignores PENDING subscription and keeps admin User.plan', () => {
    assert.equal(
      resolveEffectivePlan({
        userPlan: 'PREMIUM',
        subscription: sub({ status: 'PENDING' }),
        now,
      }),
      'PREMIUM',
    );
  });

  it('treats User.plan=PREMIUM without subscription as complimentary admin grant', () => {
    assert.equal(
      resolveEffectivePlan({
        userPlan: 'PREMIUM',
        subscription: null,
        now,
      }),
      'PREMIUM',
    );
  });

  it('is Freemium with no subscription and no grant', () => {
    assert.equal(
      resolveEffectivePlan({
        userPlan: 'FREEMIUM',
        subscription: null,
        now,
      }),
      'FREEMIUM',
    );
  });

  it('does not treat a future startDate as already paid', () => {
    assert.equal(
      hasPaidEntitlement(
        sub({
          status: 'ACTIVE',
          startDate: new Date('2026-10-01T00:00:00.000Z'),
          endDate: new Date('2026-11-01T00:00:00.000Z'),
        }),
        now,
      ),
      false,
    );
  });
});

describe('addMonths', () => {
  it('adds calendar months', () => {
    const end = addMonths(new Date('2026-01-15T00:00:00.000Z'), 1);
    assert.equal(end.getUTCMonth(), 1);
  });
});

describe('getNotesParseQuotaConfig', () => {
  it('stays disabled without explicit env', () => {
    delete process.env.AI_NOTES_PARSE_QUOTA;
    delete process.env.AI_NOTES_PARSE_DAILY_FREEMIUM;
    delete process.env.AI_NOTES_PARSE_DAILY_PREMIUM;
    assert.deepEqual(getNotesParseQuotaConfig(), { enabled: false });
  });

  it('stays disabled if flag is on but limits are missing', () => {
    process.env.AI_NOTES_PARSE_QUOTA = 'true';
    delete process.env.AI_NOTES_PARSE_DAILY_FREEMIUM;
    delete process.env.AI_NOTES_PARSE_DAILY_PREMIUM;
    assert.deepEqual(getNotesParseQuotaConfig(), { enabled: false });
    delete process.env.AI_NOTES_PARSE_QUOTA;
  });
});

const monthly = { interval: 'MONTHLY', name: 'Премиум (месяц)' };
const sixMonths = { interval: 'MONTHLY', name: 'Премиум (6 месяцев)' };

describe('endDate boundary', () => {
  const startDate = new Date('2026-08-04T12:00:00.000Z');
  const endDate = new Date('2026-09-04T12:00:00.000Z');

  it('is Premium at exact endDate', () => {
    assert.equal(
      hasPaidEntitlement({ status: 'ACTIVE', startDate, endDate }, endDate),
      true,
    );
    assert.equal(
      resolveEffectivePlan({
        userPlan: 'FREEMIUM',
        subscription: { status: 'ACTIVE', startDate, endDate },
        now: endDate,
      }),
      'PREMIUM',
    );
  });

  it('is Freemium 1ms after endDate even if User.plan is PREMIUM', () => {
    const after = new Date(endDate.getTime() + 1);
    assert.equal(
      hasPaidEntitlement({ status: 'ACTIVE', startDate, endDate }, after),
      false,
    );
    assert.equal(
      resolveEffectivePlan({
        userPlan: 'PREMIUM',
        subscription: { status: 'ACTIVE', startDate, endDate },
        now: after,
      }),
      'FREEMIUM',
    );
  });
});

describe('complimentary / admin grant vs leftover User.plan', () => {
  const expired = sub({
    status: 'ACTIVE',
    endDate: new Date('2026-08-01T00:00:00.000Z'),
  });

  it('has no persisted grant marker: leftover User.plan + expired row is Freemium', () => {
    assert.equal(
      resolveEffectivePlan({
        userPlan: 'PREMIUM',
        subscription: expired,
        now,
      }),
      'FREEMIUM',
    );
    assert.equal(isComplimentaryGrantActive(undefined, now), false);
    assert.equal(isComplimentaryGrantActive(null, now), false);
  });

  it('proposed PlanGrant keeps Premium without deleting the expired subscription row', () => {
    assert.equal(
      resolveEffectivePlan({
        userPlan: 'FREEMIUM',
        subscription: expired,
        grant: { until: null },
        now,
      }),
      'PREMIUM',
    );
  });

  it('expired or revoked grant does not override an expired paid row', () => {
    assert.equal(
      resolveEffectivePlan({
        userPlan: 'PREMIUM',
        subscription: expired,
        grant: { until: new Date('2026-08-01T00:00:00.000Z') },
        now,
      }),
      'FREEMIUM',
    );
    assert.equal(
      resolveEffectivePlan({
        userPlan: 'PREMIUM',
        subscription: expired,
        grant: { until: null, revokedAt: now },
        now,
      }),
      'FREEMIUM',
    );
  });
});

describe('resolveSubscriptionAfterPayment', () => {
  const paymentCreatedAt = new Date('2026-08-04T12:00:00.000Z');

  it('creates a 1-month window from payment.createdAt', () => {
    const result = resolveSubscriptionAfterPayment({
      source: 'live',
      existing: null,
      paymentId: 'pay-month',
      paymentCreatedAt,
      plan: monthly,
      now,
    });
    assert.equal(result.kind, 'write');
    if (result.kind !== 'write') return;
    assert.equal(result.startDate.toISOString(), paymentCreatedAt.toISOString());
    assert.equal(
      result.endDate.toISOString(),
      addMonths(paymentCreatedAt, 1).toISOString(),
    );
  });

  it('creates a 6-month window from SKU name even if interval is MONTHLY', () => {
    const result = resolveSubscriptionAfterPayment({
      source: 'live',
      existing: null,
      paymentId: 'pay-six',
      paymentCreatedAt,
      plan: sixMonths,
      now,
    });
    assert.equal(result.kind, 'write');
    if (result.kind !== 'write') return;
    assert.equal(
      result.endDate.toISOString(),
      addMonths(paymentCreatedAt, 6).toISOString(),
    );
    assert.deepEqual(computePaidWindow(paymentCreatedAt, sixMonths), {
      startDate: result.startDate,
      endDate: result.endDate,
    });
  });

  it('stacks renewal onto the current endDate, not onto now', () => {
    const existing = {
      status: 'ACTIVE',
      startDate: paymentCreatedAt,
      endDate: addMonths(paymentCreatedAt, 1),
      paymentId: 'pay-1',
    };
    const renewalCreatedAt = new Date('2026-08-20T12:00:00.000Z');
    const result = resolveSubscriptionAfterPayment({
      source: 'live',
      existing,
      paymentId: 'pay-2',
      paymentCreatedAt: renewalCreatedAt,
      plan: monthly,
      now,
    });
    assert.equal(result.kind, 'write');
    if (result.kind !== 'write') return;
    assert.equal(result.startDate.toISOString(), existing.startDate.toISOString());
    assert.equal(
      result.endDate.toISOString(),
      addMonths(existing.endDate, 1).toISOString(),
    );
  });

  it('uses payment.createdAt for a delayed first webhook instead of now', () => {
    const delayedNow = new Date('2026-08-06T12:00:00.000Z');
    const fromNow = computePaidWindow(delayedNow, monthly);
    const result = resolveSubscriptionAfterPayment({
      source: 'live',
      existing: null,
      paymentId: 'pay-delayed',
      paymentCreatedAt,
      plan: monthly,
      now: delayedNow,
    });
    assert.equal(result.kind, 'write');
    if (result.kind !== 'write') return;
    assert.equal(result.startDate.toISOString(), paymentCreatedAt.toISOString());
    assert.notEqual(result.endDate.toISOString(), fromNow.endDate.toISOString());
  });

  it('is a no-op for a duplicate webhook of the same paymentId', () => {
    const existing = {
      status: 'ACTIVE',
      startDate: paymentCreatedAt,
      endDate: addMonths(paymentCreatedAt, 1),
      paymentId: 'pay-1',
    };
    const result = resolveSubscriptionAfterPayment({
      source: 'live',
      existing,
      paymentId: 'pay-1',
      paymentCreatedAt,
      plan: monthly,
      now,
    });
    assert.deepEqual(result, { kind: 'noop', reason: 'duplicate' });
  });

  it('does not restack a delayed older payment whose window is already covered', () => {
    const existing = {
      status: 'ACTIVE',
      startDate: paymentCreatedAt,
      endDate: addMonths(paymentCreatedAt, 2),
      paymentId: 'pay-2',
    };
    const result = resolveSubscriptionAfterPayment({
      source: 'live',
      existing,
      paymentId: 'pay-1',
      paymentCreatedAt,
      plan: monthly,
      now,
    });
    assert.deepEqual(result, { kind: 'noop', reason: 'already_covered' });
  });

  it('keeps paid dates on cancel', () => {
    const active = {
      status: 'ACTIVE' as const,
      startDate: paymentCreatedAt,
      endDate: addMonths(paymentCreatedAt, 1),
      paymentId: 'pay-1',
    };
    const canceled = snapshotAfterCancel(active);
    assert.equal(canceled.status, 'CANCELED');
    assert.equal(canceled.startDate.toISOString(), active.startDate.toISOString());
    assert.equal(canceled.endDate.toISOString(), active.endDate.toISOString());
    assert.equal(hasPaidEntitlement(canceled, now), true);
    assert.equal(
      resolveEffectivePlan({ userPlan: 'FREEMIUM', subscription: canceled, now }),
      'PREMIUM',
    );
  });

  it('does not mint a new period from an old SUCCEEDED payment after endDate', () => {
    const oldCreatedAt = new Date('2026-06-01T12:00:00.000Z');
    const expiredRow = {
      status: 'ACTIVE',
      startDate: oldCreatedAt,
      endDate: addMonths(oldCreatedAt, 1),
      paymentId: 'pay-old',
    };

    assert.deepEqual(
      resolveSubscriptionAfterPayment({
        source: 'restore',
        existing: expiredRow,
        paymentId: 'pay-old',
        paymentCreatedAt: oldCreatedAt,
        plan: monthly,
        now,
      }),
      { kind: 'noop', reason: 'duplicate' },
    );

    assert.deepEqual(
      resolveSubscriptionAfterPayment({
        source: 'restore',
        existing: expiredRow,
        paymentId: 'pay-other',
        paymentCreatedAt: oldCreatedAt,
        plan: monthly,
        now,
      }),
      { kind: 'noop', reason: 'existing_row' },
    );

    assert.deepEqual(
      resolveSubscriptionAfterPayment({
        source: 'restore',
        existing: null,
        paymentId: 'pay-old',
        paymentCreatedAt: oldCreatedAt,
        plan: monthly,
        now,
      }),
      { kind: 'noop', reason: 'window_expired' },
    );

    assert.deepEqual(
      resolveSubscriptionAfterPayment({
        source: 'live',
        existing: expiredRow,
        paymentId: 'pay-old-2',
        paymentCreatedAt: oldCreatedAt,
        plan: monthly,
        now,
      }),
      { kind: 'noop', reason: 'window_expired' },
    );
  });
});
