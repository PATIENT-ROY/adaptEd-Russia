import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, renderDeadlineEmail, renderWelcomeEmail } from './email-templates';

describe('email-templates', () => {
  it('escapes html in reminder titles', () => {
    const rendered = renderDeadlineEmail({
      name: 'Ann',
      title: '<script>x</script>',
      dueDate: new Date('2026-09-05T12:00:00.000Z'),
      appUrl: 'https://adaptedrussia.ru',
      upcoming: true,
    });
    assert.equal(rendered.html.includes('<script>'), false);
    assert.equal(rendered.html.includes('&lt;script&gt;'), true);
    assert.match(rendered.subject, /Скоро срок/);
  });

  it('renders a welcome letter', () => {
    const rendered = renderWelcomeEmail({
      name: 'Pat',
      appUrl: 'https://adaptedrussia.ru',
      language: 'RU',
    });
    assert.match(rendered.subject, /AdaptEd/);
    assert.match(rendered.html, /Открыть AdaptEd/);
    assert.equal(escapeHtml('<a>'), '&lt;a&gt;');
  });
});
