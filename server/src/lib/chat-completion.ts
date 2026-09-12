import { DEEPSEEK_API_URL, getDeepSeekApiKey } from './deepseek';

export class ChatServiceError extends Error {
  constructor(public readonly code: 'AI_UNAVAILABLE' | 'AI_TIMEOUT', public readonly providerStatus?: number) {
    super(code);
    this.name = 'ChatServiceError';
  }
}

export interface ChatCompletionOptions {
  systemPrompt: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  userMessage: string;
  maxTokens: number;
  temperature: number;
}

export async function generateAIResponse(options: ChatCompletionOptions, dependencies: {
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
} = {}): Promise<string> {
  const apiKey = getDeepSeekApiKey();
  const request = dependencies.fetch ?? fetch;
  const sleep = dependencies.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  // One deadline covers requests, body reads and retry delay.
  const signal = AbortSignal.timeout(dependencies.timeoutMs ?? 45000);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await request(DEEPSEEK_API_URL, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: options.systemPrompt },
            ...options.conversationHistory,
            { role: 'user', content: options.userMessage },
          ],
          temperature: options.temperature,
          max_tokens: options.maxTokens,
        }),
      });
      if (!response.ok) {
        // Retry only explicitly temporary HTTP errors, never payment/auth
        // errors or ambiguous network failures which may already be billed.
        const retryable = response.status === 429 || response.status >= 500;
        await response.body?.cancel();
        if (retryable && attempt === 0) {
          await sleep(1000);
          signal.throwIfAborted();
          continue;
        }
        throw new ChatServiceError('AI_UNAVAILABLE', response.status);
      }
      const data = await response.json() as { choices?: Array<{ message?: { content?: unknown } }> };
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) throw new ChatServiceError('AI_UNAVAILABLE');
      return content;
    } catch (error) {
      if (signal.aborted) throw new ChatServiceError('AI_TIMEOUT');
      if (error instanceof ChatServiceError) throw error;
      // Do not expose provider response bodies, prompts or credentials.
      throw new ChatServiceError('AI_UNAVAILABLE');
    }
  }
  throw new ChatServiceError('AI_UNAVAILABLE');
}
