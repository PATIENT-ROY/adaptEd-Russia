import { Prisma } from '../../prisma/generated';
import { prisma } from './database';
import {
  getNotesParseQuotaConfig,
  NOTES_PARSE_TAG,
  PLAN_CONFIG,
  PlanKey,
} from './plan-limits';

export type AiMeterKind = 'chat' | 'notes_parse';

export type AiMeterEvent = {
  kind: AiMeterKind;
  plan: PlanKey;
  ok: boolean;
  attempts: number;
  promptTokens?: number;
  completionTokens?: number;
  fallback?: boolean;
};

type Tx = Prisma.TransactionClient;

function isPostgres(): boolean {
  return (process.env.DATABASE_URL || '').startsWith('postgres');
}

function dailyLockKey(userId: string): number {
  const day = new Date().toISOString().slice(0, 10);
  const source = `${userId}:${day}`;
  let hash = 2166136261;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash | 0;
}

export function logAiMeter(event: AiMeterEvent): void {
  console.info('[ai-meter]', JSON.stringify(event));
}

export type ProviderUsage = {
  promptTokens?: number;
  completionTokens?: number;
};

export function parseDeepSeekUsage(payload: unknown): ProviderUsage {
  const usage = (payload as { usage?: { prompt_tokens?: number; completion_tokens?: number } })
    ?.usage;
  if (!usage) return {};
  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
  };
}

export function accumulateProviderUsage(parts: ProviderUsage[]): ProviderUsage {
  let prompt = 0;
  let completion = 0;
  let sawPrompt = false;
  let sawCompletion = false;

  for (const part of parts) {
    if (typeof part.promptTokens === 'number' && Number.isFinite(part.promptTokens)) {
      prompt += part.promptTokens;
      sawPrompt = true;
    }
    if (typeof part.completionTokens === 'number' && Number.isFinite(part.completionTokens)) {
      completion += part.completionTokens;
      sawCompletion = true;
    }
  }

  return {
    ...(sawPrompt ? { promptTokens: prompt } : {}),
    ...(sawCompletion ? { completionTokens: completion } : {}),
  };
}

/** Chat 15/200 counts user ChatMessage rows only. Notes with tags=ai-parse are a different table. */
export function countsTowardChatQuota(row: {
  source: 'chat' | 'note';
  isUser?: boolean;
  tags?: string | null;
}): boolean {
  return row.source === 'chat' && row.isUser === true;
}

export function tryReserveDailySlot(
  used: number,
  limit: number,
): { ok: true; used: number } | { ok: false; used: number; limit: number } {
  if (used >= limit) {
    return { ok: false, used, limit };
  }
  return { ok: true, used: used + 1 };
}

export function reserveDailySlotsSerialized(
  used: number,
  limit: number,
  concurrent: number,
): { used: number; accepted: number; rejected: number } {
  let current = used;
  let accepted = 0;
  let rejected = 0;
  for (let i = 0; i < concurrent; i += 1) {
    const result = tryReserveDailySlot(current, limit);
    if (result.ok) {
      current = result.used;
      accepted += 1;
    } else {
      rejected += 1;
    }
  }
  return { used: current, accepted, rejected };
}

/** One HTTP chat request = one reserved slot, even if DeepSeek is retried internally. */
export function chatQuotaDebitsForRequest(input: {
  httpRequests: number;
  providerAttempts: number;
}): number {
  return input.httpRequests;
}

export async function withUserDailyQuotaLock<T>(
  userId: string,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    if (isPostgres()) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${dailyLockKey(userId)})`;
    }
    return fn(tx);
  });
}

export function getTodayStart(now = new Date()): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function countChatUserMessagesToday(
  userId: string,
  tx: Tx | typeof prisma = prisma,
  now = new Date(),
): Promise<number> {
  return tx.chatMessage.count({
    where: {
      userId,
      isUser: true,
      createdAt: { gte: getTodayStart(now) },
    },
  });
}

export async function countNotesParsesToday(
  userId: string,
  tx: Tx | typeof prisma = prisma,
  now = new Date(),
): Promise<number> {
  return tx.note.count({
    where: {
      userId,
      tags: NOTES_PARSE_TAG,
      createdAt: { gte: getTodayStart(now) },
    },
  });
}

export class AiQuotaError extends Error {
  readonly code: 'LIMIT_FREEMIUM' | 'LIMIT_PREMIUM';
  readonly used: number;
  readonly limit: number;
  readonly plan: PlanKey;

  constructor(plan: PlanKey, used: number, limit: number) {
    super(plan === 'FREEMIUM' ? 'LIMIT_FREEMIUM' : 'LIMIT_PREMIUM');
    this.code = plan === 'FREEMIUM' ? 'LIMIT_FREEMIUM' : 'LIMIT_PREMIUM';
    this.used = used;
    this.limit = limit;
    this.plan = plan;
  }
}

export async function assertChatQuota(
  userId: string,
  plan: PlanKey,
  tx: Tx | typeof prisma = prisma,
): Promise<{ used: number; limit: number }> {
  const limit = PLAN_CONFIG[plan].dailyMessages;
  const used = await countChatUserMessagesToday(userId, tx);
  if (used >= limit) {
    throw new AiQuotaError(plan, used, limit);
  }
  return { used, limit };
}

/**
 * No-op unless AI_NOTES_PARSE_QUOTA=true and both daily limits are set.
 * Internal DeepSeek retries must not call this more than once per HTTP request.
 */
export async function assertNotesParseQuota(
  userId: string,
  plan: PlanKey,
  tx: Tx | typeof prisma = prisma,
): Promise<{ used: number; limit: number } | null> {
  const config = getNotesParseQuotaConfig();
  if (!config.enabled) return null;

  const limit = plan === 'PREMIUM' ? config.premium : config.freemium;
  const used = await countNotesParsesToday(userId, tx);
  if (used >= limit) {
    throw new AiQuotaError(plan, used, limit);
  }
  return { used, limit };
}
