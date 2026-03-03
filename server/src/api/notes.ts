import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { authMiddleware } from '../lib/auth';
import { ApiResponse } from '@/types';
import { getNextApiKey, markKeyAsFailed, resetKey } from '../lib/deepseek-keys';

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

    // 1. Сохраняем заметку
    const note = await prisma.note.create({
      data: {
        userId: user.userId,
        content,
        title: content.substring(0, 60).trim() + (content.length > 60 ? '...' : ''),
      },
    });

    // 2. Отправляем в DeepSeek для парсинга
    const today = new Date().toISOString().split('T')[0];
    const aiResult = await parseNoteWithAI(content, today);

    // 3. Создаём напоминания из AI-результата
    const createdReminders = [];
    for (const item of aiResult.reminders) {
      try {
        const dueDate = new Date(item.dueDate);
        if (isNaN(dueDate.getTime())) continue;

        const reminder = await prisma.reminder.create({
          data: {
            userId: user.userId,
            noteId: note.id,
            title: item.title,
            description: item.description || null,
            dueDate,
            priority: item.priority || 'MEDIUM',
            category: item.category || 'OTHER',
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Ошибка валидации', details: error.errors } as ApiResponse);
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

async function parseNoteWithAI(noteContent: string, today: string): Promise<AIParseResult> {
  const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
  const MAX_RETRIES = 3;

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

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const apiKey = getNextApiKey();
    if (!apiKey) break;

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

      if (!response.ok) {
        const status = response.status;
        if (status === 401 || status === 403) {
          markKeyAsFailed(apiKey);
          continue;
        }
        if (status === 402 || status === 429) continue;
        markKeyAsFailed(apiKey);
        continue;
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      resetKey(apiKey);

      const raw = data.choices?.[0]?.message?.content || '';
      console.log('[Notes AI] Raw response:', raw.substring(0, 300));

      // Чистим от markdown-обёртки если есть
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      try {
        const parsed = JSON.parse(cleaned) as AIParseResult;
        return {
          reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
          summary: parsed.summary || '',
        };
      } catch (parseErr) {
        console.error('[Notes AI] JSON parse error:', parseErr, 'Raw:', cleaned.substring(0, 200));
        lastError = new Error('Failed to parse AI response');
        continue;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[Notes AI] Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, error);
    }
  }

  console.error('[Notes AI] All attempts failed:', lastError);
  return fallbackParse(noteContent, today);
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
