import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sendMessageSchema, GENERATOR_INPUT_LIMIT, CHAT_INPUT_LIMIT } from '../src/lib/chat-input';
import { AI_TOOLS_INPUT_LIMIT } from '../../client/src/lib/ai-tools-limits';

test('client and server tool length limits agree', () => {
  assert.equal(AI_TOOLS_INPUT_LIMIT, GENERATOR_INPUT_LIMIT);
});

for (const mode of ['study', 'life', 'generator'] as const) {
  const limit = mode === 'generator' ? GENERATOR_INPUT_LIMIT : CHAT_INPUT_LIMIT;
  test(`${mode} accepts exactly its limit, rejects one character over it`, () => {
    assert.equal(sendMessageSchema.parse({ content: 'a'.repeat(limit), mode }).content.length, limit);
    const result = sendMessageSchema.safeParse({ content: 'a'.repeat(limit + 1), mode });
    assert.equal(result.success, false);
    if (!result.success) assert.equal(result.error.issues[0].message, mode === 'generator' ? 'AI_INPUT_TOO_LONG' : 'CHAT_INPUT_TOO_LONG');
  });
}

test('missing mode keeps the normal chat limit and trims whitespace', () => {
  assert.equal(sendMessageSchema.parse({ content: '  hello  ' }).content, 'hello');
  assert.equal(sendMessageSchema.safeParse({ content: 'a'.repeat(2001) }).success, false);
  assert.equal(sendMessageSchema.safeParse({ content: '   ', mode: 'generator' }).success, false);
});

test('long lecture text is accepted by tools without truncation', () => {
  const content = 'Lecture text. '.repeat(500);
  assert.equal(sendMessageSchema.parse({ content, mode: 'generator' }).content, content.trim());
});
