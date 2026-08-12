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
  summary?: string;
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
  {
    title: 'Регистрация и миграционный учёт',
    url: '/life-guide',
    category: 'life',
    keywords: ['регистрация', 'миграц', 'виза', 'патент', 'разрешение', 'мвд', 'уфмс', 'учёт', 'после приезда', 'приехал', 'прибыл', 'migration'],
    summary: 'После приезда иностранный студент обычно проходит миграционный учёт (регистрацию по месту пребывания) через вуз/общежитие/принимающую сторону. Сроки и список документов уточняйте в международном отделе вуза и на официальных ресурсах МВД/Госуслуг.',
  },
  {
    title: 'Что делать после приезда',
    url: '/life-guide',
    category: 'life',
    keywords: ['после приезда', 'приехал', 'первый день', 'первые шаги', 'аэропорт', 'arrival'],
    summary: 'Чеклист после приезда: куратор/международный отдел, заселение/адрес, миграционный учёт, SIM, банк, страховка, кампус. Конкретные сроки зависят от вуза и региона.',
  },
  {
    title: 'Потеря паспорта',
    url: '/life-guide',
    category: 'life',
    keywords: ['потерял паспорт', 'потеря паспорта', 'украли паспорт', 'утеря паспорта'],
    summary: 'При потере паспорта: заявление в полицию, консульство/миграционные органы, уведомление вуза. Не путать с обычной регистрацией после приезда.',
  },
];

// ── Build contextual system prompt ──────────────────────────────────

function buildSystemPrompt(
  mode: string,
  userData: Record<string, unknown> | null,
  relatedGuides: GuideSuggestion[] = [],
): string {
  const base = `Ты AI-помощник платформы AdaptEd Russia — сервис для иностранных студентов в России.
Контекст пользователя: иностранный студент, который адаптируется к учёбе и быту в РФ.
Отвечай строго на заданный вопрос. Не уходи в посторонние темы.
Не выдумывай юридические нормы, точные сроки и штрафы. Если данные зависят от региона/вуза — скажи об этом и посоветуй проверить в международном отделе вуза, МВД/ГУВМ или на Госуслугах.`;

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
🏠 Гайды по быту — общежитие, транспорт, здоровье, SIM-карты, банки, миграционный учёт
📝 Умные заметки — AI превращает заметки в напоминания с дедлайнами
📄 Шаблоны документов — заявления, письма, резюме
Если вопрос связан с этими темами, упомяни релевантный гайд на платформе.`;

  let guideCtx = '';
  if (relatedGuides.length > 0) {
    guideCtx = `\n\nРелевантные материалы AdaptEd для этого вопроса (используй как основу ответа):
${relatedGuides
  .map(
    (g, i) =>
      `${i + 1}. ${g.title} (${g.url})${g.summary ? `\n   ${g.summary}` : ''}`,
  )
  .join('\n')}`;
  }

  const modeCtx: Record<string, string> = {
    study: `\n\n🎓 РЕЖИМ: УЧЁБА
Ты специалист по: экзамены, курсовые, задачи, объяснение тем, подготовка к сессии, научные работы, оценки, академические вопросы.
Давай конкретные, практичные советы по учёбе в российских вузах.`,
    life: `\n\n🏠 РЕЖИМ: АДАПТАЦИЯ И БЫТ
Ты специалист по: документы, миграционный учёт, общежитие, быт, культура, правила, медицина, транспорт, финансы.
Давай конкретные пошаговые инструкции по жизни в России для иностранных студентов.`,
    generator: `\n\n✍️ РЕЖИМ: ГЕНЕРАТОР ТЕКСТОВ
Ты специалист по: планы курсовых, резюме, официальные письма, переводы, эссе, рефераты.
Генерируй качественный, хорошо структурированный текст с правильным академическим форматированием.`,
  };

  const styleCtx = `\n\nПравила оформления ответов:
• Сначала 1–2 предложения по сути вопроса, затем шаги
• Используй **жирный текст** для ключевых терминов
• Структурируй ответ: заголовки (##), нумерованные списки
• Добавляй эмодзи умеренно для навигации
• Если вопрос на другом языке — отвечай на том же языке
• Для миграции/документов в конце добавь ⚠️ проверить актуальные требования официально
• Будь дружелюбным, поддерживающим и конкретным`;

  return base + userCtx + platformCtx + guideCtx + (modeCtx[mode] || modeCtx.study) + styleCtx;
}

// ── Find related guides by keyword matching ─────────────────────────

function findRelatedGuides(
  userMessage: string,
  aiResponse = '',
): GuideSuggestion[] {
  const combined = (userMessage + ' ' + aiResponse).toLowerCase();

  const scored = GUIDE_DATABASE
    .map(guide => {
      let score = 0;
      for (const kw of guide.keywords) {
        if (combined.includes(kw)) score += kw.includes(' ') ? 2 : 1;
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

  return unique.slice(0, 3);
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

    // 5. Find related guides BEFORE generation (for grounding)
    const matchedGuides = findRelatedGuides(validatedData.content);
    const systemPrompt = buildSystemPrompt(
      validatedData.mode,
      userData,
      matchedGuides,
    );

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

    // 8. Related guides for UI (prefer pre-match; enrich if empty)
    const relatedGuides = (
      matchedGuides.length > 0
        ? matchedGuides
        : findRelatedGuides(validatedData.content, aiResponseText)
    ).map(({ title, url, category }) => ({ title, url, category }));

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
  const matched = findRelatedGuides(userMessage);
  const guideHint =
    matched.length > 0
      ? `\n\n💡 **Совет:** подробнее — «${matched[0].title}» в разделе гайдов AdaptEd (${matched[0].url}).`
      : `\n\n💡 **Совет:** смотрите гайды AdaptEd в разделах «Учёба» и «Быт».`;

  if (/потерял паспорт|потеря паспорта|украли паспорт|утеря паспорта/.test(lower)) {
    return `## 📋 Потеря паспорта

Действуйте быстро:

1. **Заявление в полицию** (102/112) — получите справку
2. **Обратитесь в консульство** вашей страны и миграционные органы
3. **Уведомите международный отдел / деканат** вуза

⚠️ **Важно:** требования могут отличаться — уточните официально.${guideHint}`;
  }

  if (/после приезда|приехал|прибыл|первые шаги|первый день/.test(lower)) {
    return `## 🛬 Что делать после приезда

Базовый чеклист иностранного студента:

1. Связаться с **куратором / международным отделом** вуза
2. Решить вопрос **жилья/общежития** и адреса
3. Пройти **миграционный учёт (регистрацию)** через принимающую сторону/вуз
4. Оформить **SIM**, при необходимости **банк** и проверить **страховку**
5. Уточнить расписание и документы для учёбы

⚠️ Сроки и список документов зависят от вуза и региона — проверьте официально.${guideHint}`;
  }

  if (/регистрац|миграц|учёт|учет/.test(lower)) {
    return `## 📋 Миграционный учёт (регистрация)

После приезда иностранному студенту обычно нужно встать на **миграционный учёт** по месту пребывания.

Типичные шаги:

1. Уточнить в **международном отделе / общежитии**, кто подаёт уведомление
2. Подготовить паспорт, миграционную карту и документы по списку вуза
3. Убедиться, что регистрация оформлена в установленный срок
4. Хранить копии документов отдельно

⚠️ Не путайте это с восстановлением паспорта. Точные сроки и формы проверяйте в вузе и на официальных ресурсах МВД/Госуслуг.${guideHint}`;
  }

  if (/общежити|общага|комнат|жильё|заселен/.test(lower)) {
    return `## 🏠 Общежитие

Для заселения обычно нужно:

1. **Подать заявление** через вуз / студенческий отдел
2. Собрать документы по списку (часто: направление, медсправки, копия паспорта)
3. Получить **направление** и заселиться

📌 Сроки ограничены — уточните в своём вузе.${guideHint}`;
  }

  if (/сессия|экзамен|зачёт|зачет|подготов/.test(lower)) {
    return `## 📚 Сессия и экзамены

1. **Зимняя сессия** — обычно декабрь–январь, **летняя** — май–июнь
2. **Зачёт** — сдал/не сдал; **экзамен** — оценка
3. Начинайте готовиться заранее и ходите на консультации

⚠️ Академические задолженности могут привести к отчислению.${guideHint}`;
  }

  if (/стипенди|грант|деньги|финанс/.test(lower)) {
    return `## 💰 Стипендии и финансовая помощь

**Академическая стипендия** обычно для бюджетников без долгов.
**Гранты** и повышенные стипендии зависят от вуза и конкурсов.

Следите за дедлайнами через напоминания AdaptEd.${guideHint}`;
  }

  if (/курсов|диплом|работа.*науч|реферат/.test(lower)) {
    return `## 📝 Научные работы

Типовая структура: титул → введение → теория → практика → заключение → литература (ГОСТ вуза).

💡 Для текстов используйте режим «Генератор» на платформе.${guideHint}`;
  }

  return `## 👋 Помогу с адаптацией в России

Задайте конкретный вопрос по учёбе, документам, общежитию, транспорту или сессии — отвечу по шагам на основе материалов AdaptEd.${guideHint}`;
}

export default router;
