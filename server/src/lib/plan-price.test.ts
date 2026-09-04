import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CONFIRMED_MONTHLY_PREMIUM_PLAN_ID,
  EXPECTED_STALE_MONTHLY_PREMIUM_CATALOG,
  MONTHLY_PREMIUM_PRICE_RUB,
  inspectMonthlyPremiumCatalog,
} from './plan-price';

const confirmedStale = { ...EXPECTED_STALE_MONTHLY_PREMIUM_CATALOG };

describe('inspectMonthlyPremiumCatalog', () => {
  it('allows update only for the expected stale production row', () => {
    assert.equal(CONFIRMED_MONTHLY_PREMIUM_PLAN_ID, 'cme0luycm000112i6v6afw68a');
    assert.equal(MONTHLY_PREMIUM_PRICE_RUB, 199);
    assert.deepEqual(inspectMonthlyPremiumCatalog(confirmedStale), {
      ok: true,
      action: 'update',
      reason: 'stale 299 -> 199',
    });
  });

  it('is a no-op when that row is already 199', () => {
    assert.deepEqual(inspectMonthlyPremiumCatalog({ ...confirmedStale, price: 199 }), {
      ok: true,
      action: 'already_current',
      reason: 'price already 199',
    });
  });

  it('does not retarget a six-month plan as 199', () => {
    const sixMonth = {
      id: 'plan-six-months',
      name: 'Премиум (6 месяцев)',
      interval: 'MONTHLY',
      currency: 'RUB',
      isActive: true,
      price: 1499,
    };
    const result = inspectMonthlyPremiumCatalog(sixMonth);
    assert.equal(result.action, 'abort');
    assert.equal(result.ok, false);
  });

  it('does not retarget a yearly plan as 199', () => {
    const yearly = {
      id: 'plan-yearly',
      name: 'Премиум (год)',
      interval: 'YEARLY',
      currency: 'RUB',
      isActive: true,
      price: 2990,
    };
    assert.equal(inspectMonthlyPremiumCatalog(yearly).action, 'abort');
  });

  it('does not retarget an unknown paid MONTHLY row as 199', () => {
    const unknown = {
      id: 'some-other-monthly-id',
      name: 'Премиум',
      interval: 'MONTHLY',
      currency: 'RUB',
      isActive: true,
      price: 299,
    };
    assert.equal(inspectMonthlyPremiumCatalog(unknown).action, 'abort');
  });

  it('aborts on missing row or unexpected fields', () => {
    assert.equal(inspectMonthlyPremiumCatalog(null).action, 'abort');
    assert.equal(
      inspectMonthlyPremiumCatalog({ ...confirmedStale, name: 'Премиум (месяц)' }).action,
      'abort',
    );
    assert.equal(inspectMonthlyPremiumCatalog({ ...confirmedStale, price: 1499 }).action, 'abort');
  });
});
