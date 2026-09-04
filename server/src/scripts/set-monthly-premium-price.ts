/**
 * Point-update only cme0luycm000112i6v6afw68a from 299 to 199.
 * Aborts if the live row does not match the expected stale catalog snapshot.
 * Does not rewrite payments.
 *
 * Dry-run by default. Apply: npx tsx src/scripts/set-monthly-premium-price.ts --apply
 * Do not run --apply against production until explicitly approved.
 */
import { PrismaClient } from '../../prisma/generated';
import {
  CONFIRMED_MONTHLY_PREMIUM_PLAN_ID,
  EXPECTED_STALE_MONTHLY_PREMIUM_CATALOG,
  MONTHLY_PREMIUM_PRICE_RUB,
  inspectMonthlyPremiumCatalog,
} from '../lib/plan-price';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

async function main() {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: CONFIRMED_MONTHLY_PREMIUM_PLAN_ID },
  });
  const inspection = inspectMonthlyPremiumCatalog(plan);

  console.log(
    JSON.stringify(
      {
        apply,
        expected: EXPECTED_STALE_MONTHLY_PREMIUM_CATALOG,
        canonicalPrice: MONTHLY_PREMIUM_PRICE_RUB,
        found: plan
          ? {
              id: plan.id,
              name: plan.name,
              interval: plan.interval,
              currency: plan.currency,
              isActive: plan.isActive,
              price: plan.price,
            }
          : null,
        inspection,
      },
      null,
      2,
    ),
  );

  if (!inspection.ok || inspection.action === 'abort') {
    throw new Error(`Refusing to change catalog: ${inspection.reason}`);
  }

  if (inspection.action === 'already_current') {
    console.log('No catalog update needed. Payments were not touched.');
    return;
  }

  if (!apply) {
    console.log('Dry-run only. Re-run with --apply to UPDATE this single row.');
    return;
  }

  const result = await prisma.subscriptionPlan.updateMany({
    where: {
      id: CONFIRMED_MONTHLY_PREMIUM_PLAN_ID,
      price: EXPECTED_STALE_MONTHLY_PREMIUM_CATALOG.price,
      interval: EXPECTED_STALE_MONTHLY_PREMIUM_CATALOG.interval,
      currency: EXPECTED_STALE_MONTHLY_PREMIUM_CATALOG.currency,
      name: EXPECTED_STALE_MONTHLY_PREMIUM_CATALOG.name,
      isActive: EXPECTED_STALE_MONTHLY_PREMIUM_CATALOG.isActive,
    },
    data: { price: MONTHLY_PREMIUM_PRICE_RUB },
  });

  if (result.count !== 1) {
    throw new Error(`Expected to update 1 row, updated ${result.count}. Payments were not touched.`);
  }

  console.log('Updated 1 subscription_plans row. Payments were not touched.');
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
