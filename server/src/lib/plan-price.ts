/**
 * Guard for a one-row catalog UPDATE of the confirmed production monthly Premium plan.
 * API/checkout read subscription_plans.price as-is. Do not overlay other plan ids.
 */
export const CONFIRMED_MONTHLY_PREMIUM_PLAN_ID = 'cme0luycm000112i6v6afw68a';
export const MONTHLY_PREMIUM_PRICE_RUB = 199;
export const EXPECTED_STALE_MONTHLY_PREMIUM_PRICE_RUB = 299;

export const EXPECTED_STALE_MONTHLY_PREMIUM_CATALOG = {
  id: CONFIRMED_MONTHLY_PREMIUM_PLAN_ID,
  name: 'Премиум',
  interval: 'MONTHLY',
  currency: 'RUB',
  isActive: true,
  price: EXPECTED_STALE_MONTHLY_PREMIUM_PRICE_RUB,
} as const;

export type CatalogGuardInput = {
  id: string;
  name: string;
  interval: string;
  currency: string;
  isActive: boolean;
  price: number;
};

export function inspectMonthlyPremiumCatalog(plan: CatalogGuardInput | null): {
  ok: boolean;
  action: 'update' | 'already_current' | 'abort';
  reason: string;
} {
  const expected = EXPECTED_STALE_MONTHLY_PREMIUM_CATALOG;
  if (!plan) {
    return { ok: false, action: 'abort', reason: `plan ${expected.id} not found` };
  }

  const mismatches: string[] = [];
  if (plan.id !== expected.id) mismatches.push(`id=${plan.id}`);
  if (plan.name !== expected.name) mismatches.push(`name=${plan.name}`);
  if (plan.interval !== expected.interval) mismatches.push(`interval=${plan.interval}`);
  if (plan.currency !== expected.currency) mismatches.push(`currency=${plan.currency}`);
  if (plan.isActive !== expected.isActive) mismatches.push(`isActive=${plan.isActive}`);

  if (mismatches.length > 0) {
    return {
      ok: false,
      action: 'abort',
      reason: `catalog mismatch: ${mismatches.join(', ')}`,
    };
  }

  if (plan.price === MONTHLY_PREMIUM_PRICE_RUB) {
    return { ok: true, action: 'already_current', reason: 'price already 199' };
  }

  if (plan.price !== expected.price) {
    return {
      ok: false,
      action: 'abort',
      reason: `unexpected price ${plan.price}, expected stale ${expected.price} or current ${MONTHLY_PREMIUM_PRICE_RUB}`,
    };
  }

  return { ok: true, action: 'update', reason: `stale ${expected.price} -> ${MONTHLY_PREMIUM_PRICE_RUB}` };
}
