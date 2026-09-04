import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSocialLinks,
  parseStartPayload,
  parseTelegramChatId,
  serializeSocialLinks,
  verifyTelegramWebhookSecret,
} from './telegram';

describe('parseStartPayload', () => {
  it('reads deep-link tokens and ignores junk', () => {
    assert.equal(parseStartPayload('/start'), '');
    assert.equal(parseStartPayload('/start@AdaptEdBot abcdefghijklmnop'), 'abcdefghijklmnop');
    assert.equal(parseStartPayload('/start deadbeefdeadbeefdeadbeefdeadbeef'), 'deadbeefdeadbeefdeadbeefdeadbeef');
    assert.equal(parseStartPayload('/help'), null);
    assert.equal(parseStartPayload('/start <script>'), '');
  });
});

describe('socialLinks', () => {
  it('reads telegramChatId aliases', () => {
    assert.equal(parseTelegramChatId(JSON.stringify({ telegram_chat_id: '42' })), '42');
    assert.equal(parseTelegramChatId(JSON.stringify({ telegramChatId: '99' })), '99');
    assert.equal(parseTelegramChatId('not-json'), null);
  });

  it('drops empty fields on serialize', () => {
    const raw = serializeSocialLinks({ telegramChatId: '1', telegramUsername: 'ann' });
    assert.deepEqual(parseSocialLinks(raw), { telegramChatId: '1', telegramUsername: 'ann' });
  });
});

describe('verifyTelegramWebhookSecret', () => {
  it('rejects missing header when secret is set', () => {
    process.env.TELEGRAM_WEBHOOK_SECRET = 'secret_token_1';
    process.env.NODE_ENV = 'test';
    assert.equal(verifyTelegramWebhookSecret(undefined), false);
    assert.equal(verifyTelegramWebhookSecret('secret_token_1'), true);
    assert.equal(verifyTelegramWebhookSecret('nope'), false);
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
  });
});
