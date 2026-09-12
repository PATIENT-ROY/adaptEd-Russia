import { z } from 'zod';

export const CHAT_INPUT_LIMIT = 2000;
export const GENERATOR_INPUT_LIMIT = 12000;

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Сообщение не может быть пустым'),
  mode: z.enum(['study', 'life', 'generator']).optional().default('study'),
}).superRefine((data, context) => {
  const limit = data.mode === 'generator' ? GENERATOR_INPUT_LIMIT : CHAT_INPUT_LIMIT;
  if (data.content.length > limit) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['content'],
      message: data.mode === 'generator' ? 'AI_INPUT_TOO_LONG' : 'CHAT_INPUT_TOO_LONG' });
  }
});
