import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { authMiddleware } from '../lib/auth';
import { ApiResponse } from '../types/index.js';
import {
  DEEPSEEK_API_URL,
  DeepSeekConfigurationError,
  getDeepSeekApiKey,
} from '../lib/deepseek';
import { dispatchDueReminders } from '../lib/reminder-notifications';
import { getEffectivePlan } from '../lib/effective-plan';
import { NOTES_PARSE_TAG } from '../lib/plan-limits';
import {
  AiQuotaError,
  accumulateProviderUsage,
  assertNotesParseQuota,
  logAiMeter,
  parseDeepSeekUsage,
  withUserDailyQuotaLock,
} from '../lib/ai-meter';

const router = Router();

const createNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Содержание заметки не может быть пустым'),
  tags: z.string().optional(),
});

const updateNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1).optional(),
  tags: z.string().optional(),
});

const parseNoteSchema = z.object({
  content: z.string().min(1, 'Текст заметки не может быть пустым'),
  notificationMethod: z.enum(['email', 'telegram', 'vk']).default('email'),
});

// Получить все заметки пользователя
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const notes = await prisma.note.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        reminders: {
          select: { id: true, title: true, status: true, dueDate: true },
        },
      },
    });

    const normalized = notes.map(note => ({
      ...note,
      createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt,
      updatedAt: note.updatedAt instanceof Date ? note.updatedAt.toISOString() : note.updatedAt,
      reminders: note.reminders.map(r => ({
        ...r,
        dueDate: r.dueDate instanceof Date ? r.dueDate.toISOString() : r.dueDate,
      })),
    }));

    res.json({
      success: true,
      data: normalized,
      message: 'Заметки получены успешно',
    } as ApiResponse);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

// Создать заметку
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = createNoteSchema.parse(req.body);

    const note = await prisma.note.create({
      data: {
        userId: user.userId,
        title: data.title || null,
        content: data.content,
        tags: data.tags || null,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...note,
        createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt,
        updatedAt: note.updatedAt instanceof Date ? note.updatedAt.toISOString() : note.updatedAt,
      },
      message: 'Заметка создана успешно',
    } as ApiResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Ошибка валидации', details: error.errors } as ApiResponse);
    }
    console.error('Create note error:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

// Обновить заметку
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const data = updateNoteSchema.parse(req.body);

    const existing = await prisma.note.findFirst({ where: { id, userId: user.userId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Заметка не найдена' } as ApiResponse);
    }

    const note = await prisma.note.update({ where: { id }, data });

    res.json({
      success: true,
      data: {
        ...note,
        createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt,
        updatedAt: note.updatedAt instanceof Date ? note.updatedAt.toISOString() : note.updatedAt,
      },
      message: 'Заметка обновлена успешно',
    } as ApiResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Ошибка валидации', details: error.errors } as ApiResponse);
    }
    console.error('Update note error:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

// Удалить заметку
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const existing = await prisma.note.findFirst({ where: { id, userId: user.userId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Заметка не найдена' } as ApiResponse);
    }

    await prisma.note.delete({ where: { id } });
    res.json({ success: true, message: 'Заметка удалена успешно' } as ApiResponse);
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

// AI-парсинг заметки → создание напоминаний
router.post('/parse', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { content, notificationMethod } = parseNoteSchema.parse(req.body);
    getDeepSeekApiKey();

    const plan = await getEffectivePlan(user.userId);
    let note;
    try {
      note = await withUserDailyQuotaLock(user.userId, async (tx) => {
        await assertNotesParseQuota(user.userId, plan, tx);
        return tx.note.create({
          data: {
            userId: user.userId,
            content,
            title: content.substring(0, 60).trim() + (content.length > 60 ? '...' : ''),
            tags: NOTES_PARSE_TAG,
          },
        });
      });
    } catch (error) {
      if (error instanceof AiQuotaError) {
        return res.status(429).json({
          success: false,
          error: error.code,
          usage: { used: error.used, limit: error.limit, plan: error.plan },
        } as ApiResponse);
      }
      throw error;
    }

    // 2. Отправляем в DeepSeek для парсинга
    const today = new Date().toISOString().split('T')[0];
    const aiResult = await parseNoteWithAI(content, today);
    logAiMeter({
      kind: 'notes_parse',
      plan,
      ok: !aiResult.fallback,
      attempts: aiResult.attempts,
      promptTokens: aiResult.usage.promptTokens,
      completionTokens: aiResult.usage.completionTokens,
      fallback: aiResult.fallback,
    });

    // 3. Создаём напоминания из AI-результата
    const validPriorities = new Set(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
    const validCategories = new Set(['EDUCATION', 'LIFE', 'DOCUMENTS', 'HEALTH', 'OTHER']);

    const createdReminders = [];
    for (const item of aiResult.reminders) {
      try {
        const dueDate = new Date(item.dueDate);
        if (isNaN(dueDate.getTime())) continue;
        if (!item.title || typeof item.title !== 'string') continue;

        const priority = validPriorities.has(item.priority) ? item.priority : 'MEDIUM';
        const category = validCategories.has(item.category) ? item.category : 'OTHER';

        const reminder = await prisma.reminder.create({
          data: {
            userId: user.userId,
            noteId: note.id,
            title: item.title.slice(0, 200),
            description: item.description?.slice(0, 500) || null,
            dueDate,
            priority,
            category,
            status: 'PENDING',
            notificationMethod,
          },
        });

        createdReminders.push({
          ...reminder,
          dueDate: reminder.dueDate instanceof Date ? reminder.dueDate.toISOString() : reminder.dueDate,
          createdAt: reminder.createdAt instanceof Date ? reminder.createdAt.toISOString() : reminder.createdAt,
          updatedAt: reminder.updatedAt instanceof Date ? reminder.updatedAt.toISOString() : reminder.updatedAt,
        });
      } catch (e) {
        console.error('Error creating reminder from AI parse:', e);
      }
    }

    // 4. Сохраняем AI-саммари в заметку
    if (aiResult.summary) {
      await prisma.note.update({
        where: { id: note.id },
        data: { aiSummary: aiResult.summary },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        note: {
          ...note,
          aiSummary: aiResult.summary || null,
          createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt,
          updatedAt: note.updatedAt instanceof Date ? note.updatedAt.toISOString() : note.updatedAt,
        },
        reminders: createdReminders,
        summary: aiResult.summary || '',
      },
      message: `Создано ${createdReminders.length} напоминаний из заметки`,
    } as ApiResponse);

    if (createdReminders.some((item) => new Date(item.dueDate).getTime() <= Date.now())) {
      dispatchDueReminders().catch((error) => {
        console.error('[notes] dispatch after parse failed:', error);
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Ошибка валидации', details: error.errors } as ApiResponse);
    }
    if (error instanceof DeepSeekConfigurationError) {
      console.error('[Notes AI] DeepSeek is not configured on the server');
      return res.status(503).json({
        success: false,
        error: 'AI_SERVICE_NOT_CONFIGURED',
        message: 'DeepSeek API is not configured on the server',
      } as ApiResponse);
    }
    console.error('Parse note error:', error);
    res.status(500).json({ success: false, error: 'Ошибка при обработке заметки' } as ApiResponse);
  }
});

interface AIParseResult {
  reminders: Array<{
    title: string;
    description?: string;
    dueDate: string;
    priority: string;
    category: string;
  }>;
  summary: string;
}

async function parseNoteWithAI(noteContent: string, today: string): Promise<AIParseResult & {
  usage: { promptTokens?: number; completionTokens?: number };
  attempts: number;
  fallback: boolean;
}> {
  const MAX_RETRIES = 3;
  const apiKey = getDeepSeekApiKey();

  const systemPrompt = `Ты AI-ассистент, который анализирует текст заметки студента и извлекает из него задачи, дедлайны и напоминания.

Сегодняшняя дата: ${today}

Ответь СТРОГО в формате JSON (без markdown, без \`\`\`):
{
  "reminders": [
    {
      "title": "краткое название задачи",
      "description": "описание, если есть",
      "dueDate": "YYYY-MM-DDT00:00:00.000Z",
      "priority": "LOW|MEDIUM|HIGH|URGENT",
      "category": "EDUCATION|LIFE|DOCUMENTS|HEALTH|OTHER"
    }
  ],
  "summary": "краткое резюме заметки в 1-2 предложениях"
}

Правила:
- Если дата указана как "завтра", вычисли от ${today}
- Если "через неделю" — прибавь 7 дней
- Если "15 марта" — используй текущий или следующий год
- Если дата не указана — поставь завтра
- Определи категорию: учёба=EDUCATION, быт/покупки=LIFE, документы/визы=DOCUMENTS, здоровье=HEALTH
- Определи приоритет по срочности и важности
- Извлекай ВСЕ задачи, даже неявные
- Если в тексте нет задач — верни пустой массив reminders и только summary`;

  let lastError: Error | null = null;
  let usage = accumulateProviderUsage([]);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: noteContent },
          ],
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (data) {
        usage = accumulateProviderUsage([usage, parseDeepSeekUsage(data)]);
      }

      if (!response.ok) {
        const status = response.status;
        if (status === 401 || status === 403) {
          lastError = new Error(`Auth error (${status})`);
          break;
        }
        if (status === 402 || status === 429) {
          lastError = new Error(`Rate/payment error (${status})`);
          continue;
        }
        lastError = new Error(`API error (${status})`);
        continue;
      }

      const raw = (data as {
        choices?: Array<{ message?: { content?: string } }>;
      } | null)?.choices?.[0]?.message?.content || '';

      // Чистим от markdown-обёртки если есть
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      try {
        const parsed = JSON.parse(cleaned) as AIParseResult;
        return {
          reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
          summary: parsed.summary || '',
          usage,
          attempts: attempt + 1,
          fallback: false,
        };
      } catch (parseErr) {
        console.error('[Notes AI] JSON parse error:', parseErr);
        lastError = new Error('Failed to parse AI response');
        continue;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[Notes AI] Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, error);
    }
  }

  console.error('[Notes AI] All attempts failed:', lastError);
  return { ...fallbackParse(noteContent, today), usage, attempts: MAX_RETRIES, fallback: true };
}

function fallbackParse(content: string, today: string): AIParseResult {
  const reminders: AIParseResult['reminders'] = [];
  const lines = content.split(/[.!?\n]+/).map(l => l.trim()).filter(Boolean);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (const line of lines) {
    if (line.length < 5) continue;

    let category = 'OTHER';
    const lower = line.toLowerCase();
    if (/учёб|экзамен|курсов|лекци|семинар|сессия|зачёт|диплом/.test(lower)) category = 'EDUCATION';
    else if (/виза|паспорт|регистрац|документ|справка/.test(lower)) category = 'DOCUMENTS';
    else if (/врач|здоровь|лекарств|больниц|аптек/.test(lower)) category = 'HEALTH';
    else if (/купить|магазин|убрать|стирк|готов|такси/.test(lower)) category = 'LIFE';

    let priority = 'MEDIUM';
    if (/срочно|urgent|важно|обязательно|немедленно/.test(lower)) priority = 'HIGH';

    let dueDate = tomorrow.toISOString();
    if (/завтра/.test(lower)) {
      dueDate = tomorrow.toISOString();
    } else {
      const dateMatch = lower.match(/(\d{1,2})\s*(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/);
      if (dateMatch) {
        const months: Record<string, number> = {
          'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
          'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11,
        };
        const day = parseInt(dateMatch[1]);
        const month = months[dateMatch[2]];
        if (month !== undefined) {
          const year = new Date(today).getFullYear();
          const d = new Date(year, month, day);
          if (d < new Date(today)) d.setFullYear(year + 1);
          dueDate = d.toISOString();
        }
      }
    }

    reminders.push({
      title: line.length > 80 ? line.substring(0, 77) + '...' : line,
      dueDate,
      priority,
      category,
    });
  }

  return {
    reminders: reminders.slice(0, 10),
    summary: `Извлечено ${reminders.length} задач из заметки`,
  };
}

export default router;
