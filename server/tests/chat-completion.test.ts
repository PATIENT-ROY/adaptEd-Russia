import assert from 'node:assert/strict';
import { test, before, after } from 'node:test';
import { generateAIResponse, ChatServiceError } from '../src/lib/chat-completion';
import { DeepSeekConfigurationError } from '../src/lib/deepseek';

const previousKey = process.env.DEEPSEEK_API_KEY;
before(() => { process.env.DEEPSEEK_API_KEY = 'test-only-not-a-real-key'; });
after(() => {
  if (previousKey === undefined) delete process.env.DEEPSEEK_API_KEY;
  else process.env.DEEPSEEK_API_KEY = previousKey;
});
const options = { systemPrompt: 'Test', conversationHistory: [], userMessage: 'Translate hello', maxTokens: 30, temperature: 0.4 };

test('returns a real completion and bounds the provider request', async () => {
  const result = await generateAIResponse(options, { fetch: async (_url, init) => {
    assert.ok(init?.signal);
    const body = JSON.parse(String(init?.body));
    assert.equal(body.max_tokens, 30);
    assert.equal(body.messages.at(-1).content, options.userMessage);
    return Response.json({ choices: [{ message: { content: 'Hola' } }] });
  } });
  assert.equal(result, 'Hola');
});

for (const status of [400, 401, 402, 403, 404]) {
  test(`HTTP ${status} fails once without a fake success`, async () => {
    let calls = 0;
    await assert.rejects(generateAIResponse(options, { fetch: async () => {
      calls++;
      return new Response('private provider error', { status });
    } }), (error: unknown) => error instanceof ChatServiceError && error.code === 'AI_UNAVAILABLE' && error.providerStatus === status);
    assert.equal(calls, 1);
  });
}

for (const status of [429, 500, 503]) {
  test(`HTTP ${status} retries once after a delay`, async () => {
    let calls = 0;
    const delays: number[] = [];
    await assert.rejects(generateAIResponse(options, {
      fetch: async () => { calls++; return new Response('', { status }); },
      sleep: async ms => { delays.push(ms); },
    }), ChatServiceError);
    assert.equal(calls, 2);
    assert.deepEqual(delays, [1000]);
  });
}

test('temporary failure can recover', async () => {
  let calls = 0;
  const result = await generateAIResponse(options, {
    fetch: async () => ++calls === 1 ? new Response('', { status: 503 }) : Response.json({ choices: [{ message: { content: 'Recovered' } }] }),
    sleep: async () => {},
  });
  assert.equal(result, 'Recovered');
});

for (const data of [{}, { choices: [{ message: { content: '  ' } }] }, { choices: [{ message: { content: 42 } }] }]) {
  test(`rejects an invalid completion: ${JSON.stringify(data)}`, async () => {
    await assert.rejects(generateAIResponse(options, { fetch: async () => Response.json(data) }), ChatServiceError);
  });
}

test('network failures do not retry potentially billed requests', async () => {
  let calls = 0;
  await assert.rejects(generateAIResponse(options, { fetch: async () => { calls++; throw new TypeError('network'); } }), ChatServiceError);
  assert.equal(calls, 1);
});

test('deadline aborts a stalled request', async () => {
  await assert.rejects(generateAIResponse(options, {
    timeoutMs: 10,
    fetch: async (_url, init) => new Promise((_resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('test watchdog')), 1000);
      init!.signal!.addEventListener('abort', () => { clearTimeout(timer); reject(init!.signal!.reason); }, { once: true });
    }),
  }), (error: unknown) => error instanceof ChatServiceError && error.code === 'AI_TIMEOUT');
});

test('missing configuration makes no provider request', async () => {
  delete process.env.DEEPSEEK_API_KEY;
  try {
    await assert.rejects(generateAIResponse(options, { fetch: async () => { throw new Error('must not run'); } }), DeepSeekConfigurationError);
  } finally { process.env.DEEPSEEK_API_KEY = 'test-only-not-a-real-key'; }
});
