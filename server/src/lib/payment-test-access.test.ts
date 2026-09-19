import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canApplyFromYooKassaStatus,
  isMockYooKassaPaymentId,
  isPaymentTester,
  parsePaymentTestEmails,
} from './payment-test-access';

describe('payment-test-access', () => {
  it('parses emails', () => {
    assert.deepEqual(parsePaymentTestEmails('A@x.com, b@y.com ;C@Z.com'), [
      'a@x.com',
      'b@y.com',
      'c@z.com',
    ]);
  });

  it('allows ADMIN and listed emails', () => {
    assert.equal(isPaymentTester({ role: 'ADMIN', email: 'x@y.com' }), true);
    const prev = process.env.PAYMENT_TEST_EMAILS;
    process.env.PAYMENT_TEST_EMAILS = 'tester@adaptedrussia.ru';
    try {
      assert.equal(isPaymentTester({ role: 'STUDENT', email: 'tester@adaptedrussia.ru' }), true);
      assert.equal(isPaymentTester({ role: 'STUDENT', email: 'other@adaptedrussia.ru' }), false);
    } finally {
      if (prev === undefined) delete process.env.PAYMENT_TEST_EMAILS;
      else process.env.PAYMENT_TEST_EMAILS = prev;
    }
  });

  it('blocks mock apply for regular users', () => {
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
