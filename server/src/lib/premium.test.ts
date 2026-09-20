import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isPremiumActive } from './premium';
import { assertVerifiedPayment } from './apply-premium';

describe('isPremiumActive', () => {
  it('requires PREMIUM plan and a future endDate', () => {
    const future = new Date(Date.now() + 86_400_000);
    const past = new Date(Date.now() - 86_400_000);
    assert.equal(isPremiumActive({ plan: 'PREMIUM', premiumUntil: future }), true);
    assert.equal(isPremiumActive({ plan: 'PREMIUM', premiumUntil: past }), false);
    assert.equal(isPremiumActive({ plan: 'PREMIUM', premiumUntil: null }), false);
    assert.equal(isPremiumActive({ plan: 'FREEMIUM', premiumUntil: future }), false);
  });
});

describe('assertVerifiedPayment refunded guard', () => {
  it('rejects locally refunded payments even if provider still says succeeded', () => {
    const payment = {
      yooKassaPaymentId: 'live-1',
      amount: 549,
      currency: 'RUB',
      status: 'REFUNDED',
    };
    const verified = {
      id: 'live-1',
      status: 'succeeded',
      paid: true,
      amount: { value: '549.00', currency: 'RUB' },
    };
    assert.throws(() => assertVerifiedPayment(payment, verified), /refunded/i);
  });
});
