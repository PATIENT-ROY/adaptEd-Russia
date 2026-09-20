import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { authMiddleware } from '../lib/auth';
import { ApiResponse } from '../types/index.js';
import { DeepSeekConfigurationError, getDeepSeekApiKey } from '../lib/deepseek';
import { ChatServiceError, generateAIResponse } from '../lib/chat-completion';
import { findRelatedGuides, GuideSuggestion } from '../lib/chat-guides';
import { chatUsageDay, getChatUsage, reserveChatQuota, releaseChatQuota } from '../lib/chat-quota';
import { sendMessageSchema } from '../lib/chat-input';
import { getEffectivePlan } from '../lib/premium';

const router = Router();

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

// ── Helper: get usage for user ──────────────────────────────────────

async function getUserUsage(userId: string, plan: PlanKey) {
  const config = PLAN_CONFIG[plan] || PLAN_CONFIG.FREEMIUM;
  const todayUsed = await getChatUsage(userId);
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

    const plan = (await getEffectivePlan(user.userId)) as PlanKey;
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
  const user = (req as any).user;
  const usageDay = chatUsageDay();
  let reserved = false;
  try {
    const validatedData = sendMessageSchema.parse(req.body);

    // 1. Fetch user profile + effective Premium (subscription endDate, not stale plan flag)
    const [userData, plan] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.userId },
        select: { university: true, faculty: true, year: true, country: true },
      }),
      getEffectivePlan(user.userId) as Promise<PlanKey>,
    ]);

    const config = PLAN_CONFIG[plan] || PLAN_CONFIG.FREEMIUM;

    // Validate configuration before consuming quota.
    getDeepSeekApiKey();
    reserved = await reserveChatQuota(user.userId, config.dailyMessages, usageDay);
    if (!reserved) {
      return res.status(429).json({
        success: false,
        error: plan === 'FREEMIUM' ? 'LIMIT_FREEMIUM' : 'LIMIT_PREMIUM',
        usage: { used: await getChatUsage(user.userId, usageDay), limit: config.dailyMessages, plan },
      } as ApiResponse);
    }

    // Fetch history without persisting a message that may fail.
    const recentMessages = await prisma.chatMessage.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: CONVERSATION_HISTORY_LIMIT,
    });

    const conversationHistory = recentMessages
      .reverse()
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

    // Persist the pair atomically only after a real provider response.
    const [userMessage, aiMessage] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: { userId: user.userId, content: validatedData.content, isUser: true },
      }),
      prisma.chatMessage.create({
        data: { userId: user.userId, content: aiResponseText, isUser: false },
      }),
    ]);
    reserved = false; // Successful usage must survive history deletion.
    const relatedGuides = matchedGuides.map(({ title, url, category }) => ({ title, url, category }));

    // Return response
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
        usage: { used: await getChatUsage(user.userId), limit: config.dailyMessages, plan },
      },
      message: 'Сообщение отправлено успешно',
    } as ApiResponse);
  } catch (error) {
    if (reserved) {
      try {
        await releaseChatQuota(user.userId, usageDay);
      } catch {
        console.error('[AI] Failed to release chat quota reservation');
      }
    }
    if (error instanceof ChatServiceError) {
      console.warn('[AI] Request failed', { code: error.code, status: error.providerStatus });
      return res.status(error.code === 'AI_TIMEOUT' ? 504 : 503).json({
        success: false,
        error: error.code,
      } as ApiResponse);
    }
    if (error instanceof z.ZodError) {
      const lengthError = error.issues.find(issue =>
        issue.message === 'AI_INPUT_TOO_LONG' || issue.message === 'CHAT_INPUT_TOO_LONG');
      if (lengthError) {
        return res.status(400).json({ success: false, error: lengthError.message } as ApiResponse);
      }
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors,
      } as ApiResponse);
    }
    if (error instanceof DeepSeekConfigurationError) {
      console.error('[AI] DeepSeek is not configured on the server');
      return res.status(503).json({
        success: false,
        error: 'AI_SERVICE_NOT_CONFIGURED',
        message: 'DeepSeek API is not configured on the server',
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

export default router;
