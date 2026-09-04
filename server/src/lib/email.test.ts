import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SKIP_RESERVED_EMAIL, isDeliverableEmail, sendEmail } from './email';

describe('isDeliverableEmail', () => {
  it('blocks reserved test hosts', () => {
    assert.equal(isDeliverableEmail('user@example.com'), false);
    assert.equal(isDeliverableEmail('user@EXAMPLE.ORG'), false);
    assert.equal(isDeliverableEmail('not-an-email'), false);
    assert.equal(isDeliverableEmail('you@adaptedrussia.ru'), true);
  });
});

describe('sendEmail reserved', () => {
  it('does not call Resend for example.com', async () => {
    const result = await sendEmail({
      to: 'demo@example.com',
      subject: 'x',
      html: '<p>x</p>',
    });
    assert.equal(result.sent, false);
    assert.equal(result.error, SKIP_RESERVED_EMAIL);
  });
});
