export const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export class DeepSeekConfigurationError extends Error {
  constructor() {
    super('DEEPSEEK_API_KEY is not configured on the server');
    this.name = 'DeepSeekConfigurationError';
  }
}

export function getDeepSeekApiKey(): string {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();

  if (!apiKey) {
    throw new DeepSeekConfigurationError();
  }

  return apiKey;
}
