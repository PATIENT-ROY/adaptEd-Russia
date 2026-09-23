import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { refundRatePercent } from './payment-metrics';
import { formatRefundAmount } from './email';

describe('refund metrics', () => {
  it('returns 0 when there is no paid volume', () => {
    assert.equal(refundRatePercent(199, 0), 0);
    assert.equal(refundRatePercent(0, 0), 0);
  });

  it('rounds refunds as a percent of gross paid volume', () => {
    assert.equal(refundRatePercent(199, 1990), 10);
    assert.equal(refundRatePercent(100, 300), 33.3);
  });
});

describe('refund email amount', () => {
  it('formats rubles without trailing zeros', () => {
    assert.equal(formatRefundAmount(199, 'RUB'), '199 ₽');
    assert.equal(formatRefundAmount(199.5, 'RUB'), '199.50 ₽');
  });
});
