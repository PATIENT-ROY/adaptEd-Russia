import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  accumulateProviderUsage,
  assertNotesParseQuota,
  chatQuotaDebitsForRequest,
  countsTowardChatQuota,
  parseDeepSeekUsage,
  reserveDailySlotsSerialized,
  tryReserveDailySlot,
} from './ai-meter';
import { getNotesParseQuotaConfig, NOTES_PARSE_TAG, PLAN_CONFIG } from './plan-limits';

describe('ai-parse vs chat quota', () => {
  it('does not count notes parse rows toward chat 15/200', () => {
    assert.equal(
      countsTowardChatQuota({ source: 'note', tags: NOTES_PARSE_TAG }),
      false,
    );
    assert.equal(
      countsTowardChatQuota({ source: 'chat', isUser: true }),
      true,
    );
    assert.equal(
      countsTowardChatQuota({ source: 'chat', isUser: false }),
      false,
    );
  });

  it('leaves parse quota off, so parse cannot debit chat limits', async () => {
    delete process.env.AI_NOTES_PARSE_QUOTA;
    delete process.env.AI_NOTES_PARSE_DAILY_FREEMIUM;
    delete process.env.AI_NOTES_PARSE_DAILY_PREMIUM;

    const result = await assertNotesParseQuota('user-parse-off', 'FREEMIUM');

    assert.equal(getNotesParseQuotaConfig().enabled, false);
    assert.equal(result, null);
    assert.equal(PLAN_CONFIG.FREEMIUM.dailyMessages, 15);
    assert.equal(PLAN_CONFIG.PREMIUM.dailyMessages, 200);
    assert.equal(
      countsTowardChatQuota({ source: 'note', tags: NOTES_PARSE_TAG, isUser: true }),
      false,
    );
  });
});

describe('parallel chat reservation at quota edge', () => {
  it('accepts only the remaining slots when serialized', () => {
    const edge = reserveDailySlotsSerialized(14, PLAN_CONFIG.FREEMIUM.dailyMessages, 3);
    assert.deepEqual(edge, { used: 15, accepted: 1, rejected: 2 });
  });

  it('rejects once the limit is already reached', () => {
    assert.deepEqual(tryReserveDailySlot(15, 15), { ok: false, used: 15, limit: 15 });
    assert.deepEqual(tryReserveDailySlot(199, 200), { ok: true, used: 200 });
    assert.deepEqual(
      reserveDailySlotsSerialized(199, PLAN_CONFIG.PREMIUM.dailyMessages, 4),
      { used: 200, accepted: 1, rejected: 3 },
    );
  });
});

describe('provider retries vs quota debit', () => {
  it('debits one chat slot per HTTP request, not per DeepSeek attempt', () => {
    assert.equal(
      chatQuotaDebitsForRequest({ httpRequests: 1, providerAttempts: 3 }),
      1,
    );
    assert.equal(
      chatQuotaDebitsForRequest({ httpRequests: 2, providerAttempts: 6 }),
      2,
    );
  });
});

describe('accumulateProviderUsage', () => {
  it('sums usage from every attempt that returned tokens', () => {
    const first = parseDeepSeekUsage({ usage: { prompt_tokens: 10, completion_tokens: 4 } });
    const emptyBody = parseDeepSeekUsage({ choices: [] });
    const retry = parseDeepSeekUsage({ usage: { prompt_tokens: 12, completion_tokens: 8 } });
    const failedJson = parseDeepSeekUsage({ usage: { prompt_tokens: 5, completion_tokens: 1 } });

    assert.deepEqual(emptyBody, {});
    assert.deepEqual(
      accumulateProviderUsage([first, emptyBody, retry, failedJson]),
      { promptTokens: 27, completionTokens: 13 },
    );
  });

  it('ignores attempts without usage', () => {
    assert.deepEqual(
      accumulateProviderUsage([{}, parseDeepSeekUsage({ error: { message: 'rate limit' } })]),
      {},
    );
  });
});
