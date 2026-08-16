/**
 * One-shot ETL: SQLite → PostgreSQL for AdaptEd Russia.
 *
 * Required env:
 *   SQLITE_DATABASE_URL   e.g. file:./prisma/dev.db  (or absolute file: URL)
 *   POSTGRES_DATABASE_URL e.g. postgresql://user:pass@host:5432/dbname
 *
 * Does NOT:
 *   - modify production DATABASE_URL
 *   - delete/alter SQLite files
 *   - run init-payment-data.ts
 *
 * Prerequisites:
 *   1) npx prisma generate --schema=prisma/migrate-sqlite-to-postgres/schema.sqlite.prisma
 *   2) npx prisma generate --schema=prisma/migrate-sqlite-to-postgres/schema.postgres.prisma
 *   3) npx prisma db push --schema=prisma/migrate-sqlite-to-postgres/schema.postgres.prisma
 */

import path from 'node:path';
import { PrismaClient as SqliteClient } from './generated-sqlite';
import { PrismaClient as PostgresClient } from './generated-postgres';

type Counts = Record<string, number>;

/** Resolve relative file: URLs against process.cwd() (run from server/). */
function normalizeSqliteUrl(url: string): string {
  if (!url.startsWith('file:')) return url;
  const filePath = url.slice('file:'.length);
  if (path.isAbsolute(filePath)) return `file:${filePath}`;
  return `file:${path.resolve(process.cwd(), filePath)}`;
}

/** Expected SQLite baseline (fail if source differs — safety check). */
const EXPECTED_SQLITE_COUNTS: Counts = {
  users: 39,
  password_setup_tokens: 2,
  profiles: 4,
  notes: 4,
  reminders: 11,
  guides: 0,
  chat_messages: 50,
  support_tickets: 4,
  support_responses: 3,
  admins: 0,
  subscription_plans: 3,
  payments: 16,
  subscriptions: 5,
  grants: 0,
  user_grant_applications: 0,
  questions: 181,
  answers: 10,
  question_likes: 13,
  guide_reads: 40,
  reviews: 7,
};

/** Parent → child order (FK-safe). */
const TRANSFER_ORDER = [
  'users',
  'admins',
  'subscription_plans',
  'guides',
  'grants',
  'profiles',
  'password_setup_tokens',
  'notes',
  'chat_messages',
  'guide_reads',
  'reviews',
  'questions',
  'support_tickets',
  'payments',
  'reminders',
  'answers',
  'question_likes',
  'support_responses',
  'user_grant_applications',
  'subscriptions',
] as const;

type TableName = (typeof TRANSFER_ORDER)[number];

const BATCH_SIZE = 200;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

async function getCounts(db: SqliteClient | PostgresClient): Promise<Counts> {
  const [
    users,
    password_setup_tokens,
    profiles,
    notes,
    reminders,
    guides,
    chat_messages,
    support_tickets,
    support_responses,
    admins,
    subscription_plans,
    payments,
    subscriptions,
    grants,
    user_grant_applications,
    questions,
    answers,
    question_likes,
    guide_reads,
    reviews,
  ] = await Promise.all([
    db.user.count(),
    db.passwordSetupToken.count(),
    db.profile.count(),
    db.note.count(),
    db.reminder.count(),
    db.guide.count(),
    db.chatMessage.count(),
    db.supportTicket.count(),
    db.supportResponse.count(),
    db.admin.count(),
    db.subscriptionPlan.count(),
    db.payment.count(),
    db.subscription.count(),
    db.grant.count(),
    db.userGrantApplication.count(),
    db.question.count(),
    db.answer.count(),
    db.questionLike.count(),
    db.guideRead.count(),
    db.review.count(),
  ]);

  return {
    users,
    password_setup_tokens,
    profiles,
    notes,
    reminders,
    guides,
    chat_messages,
    support_tickets,
    support_responses,
    admins,
    subscription_plans,
    payments,
    subscriptions,
    grants,
    user_grant_applications,
    questions,
    answers,
    question_likes,
    guide_reads,
    reviews,
  };
}

function printCounts(label: string, counts: Counts): void {
  console.log(`\n=== ${label} ===`);
  for (const key of Object.keys(EXPECTED_SQLITE_COUNTS)) {
    console.log(`  ${key}: ${counts[key] ?? 0}`);
  }
}

function assertCountsEqual(label: string, actual: Counts, expected: Counts): void {
  const mismatches: string[] = [];
  for (const key of Object.keys(expected)) {
    const a = actual[key] ?? 0;
    const e = expected[key] ?? 0;
    if (a !== e) {
      mismatches.push(`${key}: got ${a}, expected ${e}`);
    }
  }
  if (mismatches.length > 0) {
    throw new Error(`${label} count mismatch:\n  - ${mismatches.join('\n  - ')}`);
  }
}

function assertTargetEmpty(counts: Counts): void {
  const nonEmpty = Object.entries(counts).filter(([, n]) => n > 0);
  if (nonEmpty.length > 0) {
    throw new Error(
      `PostgreSQL target is not empty (refusing to migrate):\n  - ${nonEmpty
        .map(([k, n]) => `${k}=${n}`)
        .join('\n  - ')}\nWipe target tables first or use a fresh database.`
    );
  }
}

async function createInBatches<T>(
  label: string,
  rows: T[],
  insert: (chunk: T[]) => Promise<unknown>
): Promise<void> {
  if (rows.length === 0) {
    console.log(`  → ${label}: 0 rows (skip)`);
    return;
  }
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    await insert(chunk);
  }
  console.log(`  → ${label}: ${rows.length} rows`);
}

async function transferAll(sqlite: SqliteClient, postgres: PostgresClient): Promise<void> {
  console.log('\n=== Transferring tables (FK order) ===');

  for (const table of TRANSFER_ORDER) {
    await transferTable(table, sqlite, postgres);
  }
}

async function transferTable(
  table: TableName,
  sqlite: SqliteClient,
  postgres: PostgresClient
): Promise<void> {
  switch (table) {
    case 'users': {
      const rows = await sqlite.user.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.user.createMany({ data: chunk })
      );
      break;
    }
    case 'admins': {
      const rows = await sqlite.admin.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.admin.createMany({ data: chunk })
      );
      break;
    }
    case 'subscription_plans': {
      const rows = await sqlite.subscriptionPlan.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.subscriptionPlan.createMany({ data: chunk })
      );
      break;
    }
    case 'guides': {
      const rows = await sqlite.guide.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.guide.createMany({ data: chunk })
      );
      break;
    }
    case 'grants': {
      const rows = await sqlite.grant.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.grant.createMany({ data: chunk })
      );
      break;
    }
    case 'profiles': {
      const rows = await sqlite.profile.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.profile.createMany({ data: chunk })
      );
      break;
    }
    case 'password_setup_tokens': {
      const rows = await sqlite.passwordSetupToken.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.passwordSetupToken.createMany({ data: chunk })
      );
      break;
    }
    case 'notes': {
      const rows = await sqlite.note.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.note.createMany({ data: chunk })
      );
      break;
    }
    case 'chat_messages': {
      const rows = await sqlite.chatMessage.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.chatMessage.createMany({ data: chunk })
      );
      break;
    }
    case 'guide_reads': {
      const rows = await sqlite.guideRead.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.guideRead.createMany({ data: chunk })
      );
      break;
    }
    case 'reviews': {
      const rows = await sqlite.review.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.review.createMany({ data: chunk })
      );
      break;
    }
    case 'questions': {
      const rows = await sqlite.question.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.question.createMany({ data: chunk })
      );
      break;
    }
    case 'support_tickets': {
      const rows = await sqlite.supportTicket.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.supportTicket.createMany({ data: chunk })
      );
      break;
    }
    case 'payments': {
      const rows = await sqlite.payment.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.payment.createMany({ data: chunk })
      );
      break;
    }
    case 'reminders': {
      const rows = await sqlite.reminder.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.reminder.createMany({ data: chunk })
      );
      break;
    }
    case 'answers': {
      const rows = await sqlite.answer.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.answer.createMany({ data: chunk })
      );
      break;
    }
    case 'question_likes': {
      const rows = await sqlite.questionLike.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.questionLike.createMany({ data: chunk })
      );
      break;
    }
    case 'support_responses': {
      const rows = await sqlite.supportResponse.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.supportResponse.createMany({ data: chunk })
      );
      break;
    }
    case 'user_grant_applications': {
      const rows = await sqlite.userGrantApplication.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.userGrantApplication.createMany({ data: chunk })
      );
      break;
    }
    case 'subscriptions': {
      const rows = await sqlite.subscription.findMany();
      await createInBatches(table, rows, (chunk) =>
        postgres.subscription.createMany({ data: chunk })
      );
      break;
    }
    default: {
      const _exhaustive: never = table;
      throw new Error(`Unhandled table: ${_exhaustive}`);
    }
  }
}

async function main(): Promise<void> {
  // Touch env early so generate/runtime errors are clear
  const sqliteUrl = normalizeSqliteUrl(requireEnv('SQLITE_DATABASE_URL'));
  const postgresUrl = requireEnv('POSTGRES_DATABASE_URL');

  console.log('AdaptEd Russia — SQLite → PostgreSQL one-shot migration');
  console.log(`SQLite URL set: ${sqliteUrl}`);
  console.log('Postgres URL set: [hidden]');

  const sqlite = new SqliteClient({
    datasources: { db: { url: sqliteUrl } },
  });
  const postgres = new PostgresClient({
    datasources: { db: { url: postgresUrl } },
  });

  try {
    await sqlite.$connect();

    const sourceCounts = await getCounts(sqlite);
    printCounts('SQLite (source)', sourceCounts);

    if (process.env.SKIP_EXPECTED_COUNT_CHECK === '1') {
      console.warn(
        '\n⚠ SKIP_EXPECTED_COUNT_CHECK=1 — skipping SQLite vs expected baseline check'
      );
    } else {
      assertCountsEqual('SQLite vs expected baseline', sourceCounts, EXPECTED_SQLITE_COUNTS);
      console.log('\n✓ SQLite counts match expected baseline');
    }

    await postgres.$connect();

    const targetBefore = await getCounts(postgres);
    printCounts('PostgreSQL (before)', targetBefore);
    assertTargetEmpty(targetBefore);
    console.log('\n✓ PostgreSQL target is empty');

    await transferAll(sqlite, postgres);

    const targetAfter = await getCounts(postgres);
    printCounts('PostgreSQL (after)', targetAfter);
    assertCountsEqual('PostgreSQL vs SQLite', targetAfter, sourceCounts);

    console.log('\n✅ Migration OK — all table counts match SQLite.');
    console.log(
      'Next: point production DATABASE_URL to PostgreSQL and switch provider in server/prisma/schema.prisma (manual).'
    );
    console.log('Do NOT run init-payment-data.ts — plans were migrated.');
  } finally {
    await sqlite.$disconnect().catch(() => undefined);
    await postgres.$disconnect().catch(() => undefined);
  }
}

main().catch((err) => {
  console.error('\n❌ Migration failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
