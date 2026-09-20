import { Prisma } from '../../prisma/generated';
import { prisma } from './database';

export type WebhookLogStatus = 'processed' | 'failed' | 'skipped';

function toJsonPayload(payload: unknown): Prisma.InputJsonValue {
  if (payload === undefined || payload === null) return {};
  try {
    return JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue;
  } catch {
    return { unserializable: true };
  }
}

/** Best-effort audit write — never throws into the webhook response path. */
export async function logWebhookEvent(
  event: string,
  payload: unknown,
  status: WebhookLogStatus,
  error?: string | null,
): Promise<void> {
  try {
    await prisma.webhookLog.create({
      data: {
        event: event || 'unknown',
        payload: toJsonPayload(payload),
        status,
        error: error ? String(error).slice(0, 2000) : null,
      },
    });
  } catch (err) {
    console.error('[webhook-log] failed to persist:', err);
  }
}
