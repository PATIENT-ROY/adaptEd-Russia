/**
 * Cancel local PENDING payments older than 24h.
 * If YooKassa still has pending / waiting_for_capture, cancel there first.
 *
 * crontab (live API):
 * 0 3 * * * cd /home/c502756/api.adaptedrussia.ru/app/server && npx tsx src/scripts/cleanup-pending-payments.ts
 */
import dotenv from 'dotenv';
import { cleanupPendingPayments } from '../lib/cleanup-pending-payments.js';
import { prisma } from '../lib/database.js';

dotenv.config();

async function main() {
  const result = await cleanupPendingPayments(24);
  console.log(JSON.stringify({ ok: true, ...result }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
