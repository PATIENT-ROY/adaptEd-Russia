export type PlanKey = 'FREEMIUM' | 'PREMIUM';

export const PLAN_CONFIG = {
  FREEMIUM: { dailyMessages: 15, maxTokens: 1500 },
  PREMIUM: { dailyMessages: 200, maxTokens: 3000 },
} as const;

export const FREEMIUM_MONTHLY_NOTIFICATIONS = 2;

export const NOTES_PARSE_TAG = 'ai-parse';

/**
 * Notes-parse quota is off unless both the flag and numeric limits are set.
 * Do not set these in production until product agrees on the numbers.
 */
export function getNotesParseQuotaConfig():
  | { enabled: false }
  | { enabled: true; freemium: number; premium: number } {
  if (process.env.AI_NOTES_PARSE_QUOTA !== 'true') {
    return { enabled: false };
  }

  const freemium = Number(process.env.AI_NOTES_PARSE_DAILY_FREEMIUM);
  const premium = Number(process.env.AI_NOTES_PARSE_DAILY_PREMIUM);
  if (!Number.isFinite(freemium) || freemium < 0 || !Number.isFinite(premium) || premium < 0) {
    return { enabled: false };
  }

  return { enabled: true, freemium, premium };
}
