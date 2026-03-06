import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { authMiddleware } from '../lib/auth';
import { ApiResponse } from '../types/index.js';
import { getNextApiKey, markKeyAsFailed, resetKey } from '../lib/deepseek-keys';

const router = Router();

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Сообщение не может быть пустым').max(2000),
  mode: z.enum(['study', 'life', 'generator']).optional().default('study'),
});

// ── Plan-based limits ───────────────────────────────────────────────

const PLAN_CONFIG = {
  FREEMIUM: { dailyMessages: 15, maxTokens: 1500 },
  PREMIUM:  { dailyMessages: 200, maxTokens: 3000 },
} as const;

type PlanKey = keyof typeof PLAN_CONFIG;

const MODE_TEMPERATURE: Record<string, number> = {
  study: 0.4,
  life: 0.6,
  generator: 0.75,
};

const CONVERSATION_HISTORY_LIMIT = 10;

// ── Guide suggestions database ──────────────────────────────────────

interface GuideSuggestion {
  title: string;
  url: string;
  category: 'education' | 'life';
  keywords: string[];
}

const GUIDE_DATABASE: GuideSuggestion[] = [
  { title: 'Словарь студенческого сленга', url: '/education-guide', category: 'education', keywords: ['сленг', 'слова', 'термин', 'пара', 'хвост', 'автомат', 'стипуха', 'slang'] },
  { title: 'Как проходит обучение в вузе', url: '/education-guide', category: 'education', keywords: ['обучение', 'семестр', 'лекция', 'семинар', 'учебный процесс', 'пары'] },
  { title: 'Разница между экзаменом и зачётом', url: '/education-guide', category: 'education', keywords: ['экзамен', 'зачёт', 'зачет', 'оценка', 'балл', 'пятёрка'] },
  { title: 'Как подготовиться к сессии', url: '/education-guide', category: 'education', keywords: ['сессия', 'подготовка', 'готовиться', 'конспект', 'шпаргалка', 'пересдача'] },
  { title: 'Как написать курсовую работу', url: '/education-guide', category: 'education', keywords: ['курсовая', 'курсовой', 'научная работа', 'оформление', 'введение', 'заключение', 'диплом', 'дипломная'] },
  { title: 'Оформление документов для вуза', url: '/education-guide', category: 'education', keywords: ['справка', 'заявление', 'деканат', 'приёмная', 'ведомость'] },
  { title: 'Как не быть отчисленным', url: '/education-guide', category: 'education', keywords: ['отчисление', 'отчислен', 'долг', 'задолженность', 'пропуск', 'академическ'] },
  { title: 'Стипендии и гранты', url: '/education-guide', category: 'education', keywords: ['стипендия', 'грант', 'финансовая помощь', 'выплата', 'бюджет'] },
  { title: 'Расписание и учебный план', url: '/education-guide', category: 'education', keywords: ['расписание', 'график', 'учебный план', 'модуль', 'звонок'] },
  { title: 'Как зарегистрироваться в общежитии', url: '/life-guide', category: 'life', keywords: ['общежитие', 'заселение', 'комната', 'жильё', 'проживание', 'dormitory', 'общага'] },
  { title: 'Транспорт и проезд', url: '/life-guide', category: 'life', keywords: ['транспорт', 'метро', 'автобус', 'троллейбус', 'проезд', 'карта тройка', 'маршрут'] },
  { title: 'Медицинская помощь', url: '/life-guide', category: 'life', keywords: ['врач', 'больница', 'поликлиника', 'страховка', 'медицина', 'здоровье', 'аптека', 'лекарств'] },
  { title: 'Банки и финансы', url: '/life-guide', category: 'life', keywords: ['банк', 'карта', 'перевод', 'деньги', 'счёт', 'обмен', 'валюта', 'сбербанк'] },
  { title: 'SIM-карта и связь', url: '/life-guide', category: 'life', keywords: ['sim', 'телефон', 'связь', 'интернет', 'оператор', 'тариф', 'мтс', 'билайн', 'мегафон'] },
  { title: 'Регистрация и миграционный учёт', url: '/life-guide', category: 'life', keywords: ['регистрация', 'миграц', 'виза', 'патент', 'разрешение', 'мвд', 'уфмс', 'паспорт'] },
];

// ── Build contextual system prompt ──────────────────────────────────

function buildSystemPrompt(mode: string, userData: Record<string, unknown> | null): string {
  const base = `Ты AI-помощник платформы AdaptEd — сервис для иностранных студентов, обучающихся в России.`;

  let userCtx = '';
  if (userData) {
    const parts: string[] = [];
    if (userData.university) parts.push(`Университет: ${userData.university}`);
    if (userData.faculty) parts.push(`Факультет: ${userData.faculty}`);
    if (userData.year) parts.push(`Курс: ${userData.year}`);
    if (userData.country) parts.push(`Страна: ${userData.country}`);
    if (parts.length > 0) {
      userCtx = `\n\nИнформация о студенте:\n${parts.join('\n')}\nУчитывай эту информацию — давай персонализированные советы.`;
    }
  }

  const platformCtx = `\n\nПлатформа AdaptEd содержит:
📚 Гайды по учёбе — экзамены, сессия, курсовые, оценки, сленг, отчисление, стипендии, расписание
🏠 Гайды по быту — общежитие, транспорт, здоровье, SIM-карты, банки, регистрация
📝 Умные заметки — AI превращает заметки в напоминания с дедлайнами
📄 Шаблоны документов — заявления, письма, резюме
Если вопрос связан с этими темами, упомяни что подробный гайд есть на платформе.`;

  const modeCtx: Record<string, string> = {
    study: `\n\n🎓 РЕЖИМ: УЧЁБА
Ты специалист по: экзамены, курсовые, задачи, объяснение тем, подготовка к сессии, научные работы, оценки, академические вопросы.
Давай конкретные, практичные советы по учёбе в российских вузах.`,
    life: `\n\n🏠 РЕЖИМ: АДАПТАЦИЯ И БЫТ
Ты специалист по: документы, регистрация, общежитие, быт, культура, правила, медицина, транспорт, финансы.
Давай конкретные пошаговые инструкции по жизни в России для иностранных студентов.`,
    generator: `\n\n✍️ РЕЖИМ: ГЕНЕРАТОР ТЕКСТОВ
Ты специалист по: планы курсовых, резюме, официальные письма, переводы, эссе, рефераты.
Генерируй качественный, хорошо структурированный текст с правильным академическим форматированием.`,
  };

  const styleCtx = `\n\nПравила оформления ответов:
• Используй **жирный текст** для ключевых терминов и важных понятий
• Структурируй ответ: заголовки (##), нумерованные списки (1. 2. 3.), маркированные списки (•)
• Добавляй эмодзи для навигации: 📌 важно, ⚠️ внимание, ✅ готово, 💡 совет, 📋 список
• Начинай с краткого резюме (1-2 предложения), затем детали
• Разбивай сложные ответы на пронумерованные шаги
• В конце добавь 💡 **Совет** или 📌 **Важно**, если уместно
• Если вопрос на другом языке — отвечай на том же языке
• Будь дружелюбным, поддерживающим и конкретным`;

  return base + userCtx + platformCtx + (modeCtx[mode] || modeCtx.study) + styleCtx;
}

// ── Find related guides by keyword matching ─────────────────────────

function findRelatedGuides(
  userMessage: string,
  aiResponse: string,
): Array<{ title: string; url: string; category: string }> {
  const combined = (userMessage + ' ' + aiResponse).toLowerCase();

  const scored = GUIDE_DATABASE
    .map(guide => {
      let score = 0;
      for (const kw of guide.keywords) {
        if (combined.includes(kw)) score++;
      }
      return { ...guide, score };
    })
    .filter(g => g.score > 0);

  scored.sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const unique = scored.filter(g => {
    const key = g.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, 3).map(({ title, url, category }) => ({ title, url, category }));
}

// ── Helper: get today's start ───────────────────────────────────────

function getTodayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Helper: get usage for user ──────────────────────────────────────

async function getUserUsage(userId: string, plan: PlanKey) {
  const config = PLAN_CONFIG[plan] || PLAN_CONFIG.FREEMIUM;
  const todayUsed = await prisma.chatMessage.count({
    where: { userId, isUser: true, createdAt: { gte: getTodayStart() } },
  });
  return { used: todayUsed, limit: config.dailyMessages, plan };
}

// ── GET /messages — chat history + usage ────────────────────────────

router.get('/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const cursor = req.query.cursor as string | undefined;

    const total = await prisma.chatMessage.count({
      where: { userId: user.userId },
    });

    const messages = await prisma.chatMessage.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, -1) : messages;
    const orderedMessages = resultMessages.reverse();

    const formattedMessages = orderedMessages.map(msg => ({
      id: msg.id,
      userId: msg.userId,
      content: msg.content,
      isUser: msg.isUser,
      timestamp: msg.createdAt.toISOString(),
    }));

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { plan: true },
    });
    const plan = (userData?.plan || 'FREEMIUM') as PlanKey;
    const usage = await getUserUsage(user.userId, plan);

    res.json({
      success: true,
      data: formattedMessages,
      pagination: { total, hasMore, nextCursor: hasMore ? resultMessages[resultMessages.length - 1]?.id : null },
      usage,
      message: 'История чата получена успешно',
    } as ApiResponse);
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

// ── POST /messages — send message with plan limits ──────────────────

router.post('/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const validatedData = sendMessageSchema.parse(req.body);

    // 1. Fetch user profile
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { plan: true, university: true, faculty: true, year: true, country: true },
    });

    const plan = (userData?.plan || 'FREEMIUM') as PlanKey;
    const config = PLAN_CONFIG[plan] || PLAN_CONFIG.FREEMIUM;

    // 2. Check daily limit
    const todayUsed = await prisma.chatMessage.count({
      where: { userId: user.userId, isUser: true, createdAt: { gte: getTodayStart() } },
    });

    if (todayUsed >= config.dailyMessages) {
      return res.status(429).json({
        success: false,
        error: plan === 'FREEMIUM'
          ? 'LIMIT_FREEMIUM'
          : 'LIMIT_PREMIUM',
        usage: { used: todayUsed, limit: config.dailyMessages, plan },
      } as ApiResponse);
    }

    // 3. Save user message
    const userMessage = await prisma.chatMessage.create({
      data: { userId: user.userId, content: validatedData.content, isUser: true },
    });

    // 4. Fetch conversation history for context
    const recentMessages = await prisma.chatMessage.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: CONVERSATION_HISTORY_LIMIT,
    });

    const conversationHistory = recentMessages
      .reverse()
      .filter(m => m.id !== userMessage.id)
      .map(msg => ({
        role: msg.isUser ? 'user' as const : 'assistant' as const,
        content: msg.content,
      }));

    // 5. Build context-aware system prompt
    const systemPrompt = buildSystemPrompt(validatedData.mode, userData);

    // 6. Generate AI response
    const aiResponseText = await generateAIResponse({
      systemPrompt,
      conversationHistory,
      userMessage: validatedData.content,
      maxTokens: config.maxTokens,
      temperature: MODE_TEMPERATURE[validatedData.mode] ?? 0.5,
    });

    // 7. Save AI message
    const aiMessage = await prisma.chatMessage.create({
      data: { userId: user.userId, content: aiResponseText, isUser: false },
    });

    // 8. Find related guides
    const relatedGuides = findRelatedGuides(validatedData.content, aiResponseText);

    // 9. Return response
    res.status(201).json({
      success: true,
      data: {
        userMessage: {
          id: userMessage.id,
          userId: userMessage.userId,
          content: userMessage.content,
          isUser: userMessage.isUser,
          timestamp: userMessage.createdAt.toISOString(),
        },
        aiMessage: {
          id: aiMessage.id,
          userId: aiMessage.userId,
          content: aiMessage.content,
          isUser: aiMessage.isUser,
          timestamp: aiMessage.createdAt.toISOString(),
        },
        relatedGuides,
        usage: { used: todayUsed + 1, limit: config.dailyMessages, plan },
      },
      message: 'Сообщение отправлено успешно',
    } as ApiResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors,
      } as ApiResponse);
    }
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

// ── DELETE /messages ─────────────────────────────────────────────────

router.delete('/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await prisma.chatMessage.deleteMany({ where: { userId: user.userId } });
    res.json({ success: true, data: null, message: 'История чата очищена' } as ApiResponse);
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

// ── AI Generation with conversation history ─────────────────────────

interface AIOptions {
  systemPrompt: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  userMessage: string;
  maxTokens: number;
  temperature: number;
}

async function generateAIResponse(options: AIOptions): Promise<string> {
  const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
  const MAX_RETRIES = 3;

  console.log('[AI] Generating response, history:', options.conversationHistory.length, 'messages');
  let lastError: Error | null = null;

  const messages = [
    { role: 'system', content: options.systemPrompt },
    ...options.conversationHistory,
    { role: 'user', content: options.userMessage },
  ];

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const apiKey = getNextApiKey();
    if (!apiKey) {
      console.error('[AI] No available DeepSeek API keys');
      break;
    }

    console.log(`[AI] Attempt ${attempt + 1}/${MAX_RETRIES} with key: ${apiKey.substring(0, 10)}...`);

    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
        }),
      });

      if (!response.ok) {
        const status = response.status;

        if (status === 401 || status === 403) {
          markKeyAsFailed(apiKey);
          lastError = new Error(`Auth error (${status})`);
          continue;
        }
        if (status === 402 || status === 429) {
          lastError = new Error(`Rate/payment error (${status})`);
          continue;
        }
        markKeyAsFailed(apiKey);
        lastError = new Error(`API error (${status})`);
        continue;
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      resetKey(apiKey);

      const aiResponse = data.choices?.[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('Empty AI response');
      }

      console.log('[AI] Success:', aiResponse.substring(0, 100) + '...');
      return aiResponse;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (error instanceof Error && !error.message.includes('fetch')) {
        markKeyAsFailed(apiKey);
      }
      console.warn(`[AI] Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, error);
    }
  }

  console.error('[AI] All attempts failed:', lastError);
  return generateMockResponse(options.userMessage);
}

// ── Improved fallback responses ─────────────────────────────────────

function generateMockResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (/паспорт|документ|виза|регистрац/.test(lower)) {
    return `## 📋 Документы и регистрация

При вопросах о документах в России важно действовать быстро:

1. **При потере паспорта** — обратитесь в миграционную службу МВД (ГУВМ МВД России)
2. **Подайте заявление** о замене и получите временную справку
3. **Уведомите деканат** вашего университета

⚠️ **Важно:** Всегда носите копию паспорта отдельно от оригинала.

💡 **Совет:** Подробная инструкция доступна в разделе «Гайды по быту» на платформе.`;
  }

  if (/общежити|общага|комнат|жильё|заселен/.test(lower)) {
    return `## 🏠 Общежитие

Для заселения в общежитие нужно:

1. **Подать заявление** в деканат вашего университета
2. **Собрать документы:** справка о поступлении, медицинская справка, копия паспорта
3. **Получить направление** и заселиться

📌 **Важно:** Сроки подачи заявления ограничены — уточните в деканате.

💡 **Совет:** Полный гайд по общежитиям есть в разделе «Быт» на платформе.`;
  }

  if (/сессия|экзамен|зачёт|зачет|подготов/.test(lower)) {
    return `## 📚 Сессия и экзамены

Ключевая информация:

1. **Зимняя сессия** — декабрь-январь, **летняя** — май-июнь
2. **Зачёт** — сдал/не сдал, **экзамен** — оценка по 5-балльной шкале
3. **Начинайте готовиться** за месяц до начала сессии
4. **Посещайте консультации** — преподаватели дают подсказки

⚠️ **Важно:** Задолженности по сессии могут привести к отчислению.

💡 **Совет:** Используйте умные заметки на платформе для отслеживания дедлайнов.`;
  }

  if (/стипенди|грант|деньги|финанс/.test(lower)) {
    return `## 💰 Стипендии и финансовая помощь

**Академическая стипендия:**
- Для студентов на бюджете без задолженностей
- Обычно 2000–4000 ₽/мес
- Повышенная — за отличную учёбу

**Гранты:** проверьте доступные на платформе в разделе «Стипендии и гранты».

💡 **Совет:** Следите за дедлайнами подачи заявок через наши умные напоминания!`;
  }

  if (/курсов|диплом|работа.*науч|реферат/.test(lower)) {
    return `## 📝 Научные работы

Структура курсовой/дипломной работы:

1. **Титульный лист** — по ГОСТу вашего вуза
2. **Введение** — актуальность, цели, задачи
3. **Теоретическая часть** — обзор литературы
4. **Практическая часть** — исследование
5. **Заключение** — выводы
6. **Список литературы** — ГОСТ Р 7.0.5-2008

💡 **Совет:** Используйте режим «Генератор» для помощи с текстами!`;
  }

  return `## 👋 Спасибо за вопрос!

Я помогу вам с адаптацией в России. Вот что я могу:

- **🎓 Учёба** — объяснение тем, подготовка к экзаменам, курсовые
- **🏠 Быт** — документы, общежитие, транспорт, медицина
- **✍️ Тексты** — письма, резюме, планы работ

Задайте конкретный вопрос, и я дам подробный ответ!

💡 **Совет:** Используйте быстрые вопросы в боковой панели для начала.`;
}

export default router;
