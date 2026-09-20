import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canApplyFromYooKassaStatus,
  isMockYooKassaPaymentId,
  isPaymentTester,
  parsePaymentTestEmails,
  parsePaymentTestUserIds,
} from './payment-test-access';

describe('payment-test-access', () => {
  it('parses emails', () => {
    assert.deepEqual(parsePaymentTestEmails('A@x.com, b@y.com ;C@Z.com'), [
      'a@x.com',
      'b@y.com',
      'c@z.com',
    ]);
  });

  it('allows ADMIN, listed user ids, and only verified listed emails', () => {
    assert.equal(isPaymentTester({ role: 'ADMIN', email: 'x@y.com' }), true);
    const previousEmails = process.env.PAYMENT_TEST_EMAILS;
    const previousIds = process.env.PAYMENT_TEST_USER_IDS;
    process.env.PAYMENT_TEST_EMAILS = 'tester@adaptedrussia.ru';
    process.env.PAYMENT_TEST_USER_IDS = 'user-1, user-2';
    try {
      assert.deepEqual(parsePaymentTestUserIds(), ['user-1', 'user-2']);
      assert.equal(isPaymentTester({ role: 'STUDENT', userId: 'user-1' }), true);
      assert.equal(isPaymentTester({ role: 'STUDENT', id: 'user-2' }), true);
      assert.equal(isPaymentTester({ role: 'STUDENT', email: 'tester@adaptedrussia.ru' }), false);
      assert.equal(isPaymentTester({ role: 'STUDENT', email: 'Tester@AdaptedRussia.ru' }), false);
      assert.equal(isPaymentTester({ role: 'STUDENT', email: ' other@adaptedrussia.ru ' }), false);
      assert.equal(
        isPaymentTester({ role: 'STUDENT', email: 'tester@adaptedrussia.ru', emailVerified: false }),
        false,
      );
      assert.equal(
        isPaymentTester({ role: 'STUDENT', email: 'tester@adaptedrussia.ru', emailVerified: true }),
        true,
      );
    } finally {
      if (previousEmails === undefined) delete process.env.PAYMENT_TEST_EMAILS;
      else process.env.PAYMENT_TEST_EMAILS = previousEmails;
      if (previousIds === undefined) delete process.env.PAYMENT_TEST_USER_IDS;
      else process.env.PAYMENT_TEST_USER_IDS = previousIds;
    }
  });

  it('blocks mock apply for regular users', () => {
    assert.equal(canApplyFromYooKassaStatus({ role: 'ADMIN' }, null), false);
    assert.equal(canApplyFromYooKassaStatus({ role: 'STUDENT' }, ''), false);
    assert.equal(isMockYooKassaPaymentId('test_123'), true);
    assert.equal(isMockYooKassaPaymentId('2c8a-live'), false);
    assert.equal(
      canApplyFromYooKassaStatus({ role: 'STUDENT', email: 'a@b.c' }, 'test_1'),
      false,
    );
    assert.equal(
      canApplyFromYooKassaStatus({ role: 'ADMIN', email: 'a@b.c' }, 'test_1'),
      true,
    );
    assert.equal(
      canApplyFromYooKassaStatus({ role: 'STUDENT', email: 'a@b.c' }, 'live-id'),
      true,
    );
  });
});
