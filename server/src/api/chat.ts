import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { authMiddleware } from '../lib/auth';
import { ApiResponse } from '@/types';
import { getNextApiKey, markKeyAsFailed, resetKey } from '../lib/deepseek-keys';

const router = Router();

// Схема валидации для отправки сообщения
const sendMessageSchema = z.object({
  content: z.string().min(1, 'Сообщение не может быть пустым'),
});

// Получить историю чата с пагинацией
router.get('/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Параметры пагинации
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // макс 100
    const cursor = req.query.cursor as string | undefined;
    
    // Получаем общее количество сообщений для информации
    const total = await prisma.chatMessage.count({
      where: { userId: user.userId },
    });

    // Запрос с курсорной пагинацией (более эффективно для чатов)
    const messages = await prisma.chatMessage.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' }, // Сначала новые
      take: limit + 1, // +1 чтобы узнать есть ли ещё
      ...(cursor ? {
        cursor: { id: cursor },
        skip: 1, // Пропустить курсор
      } : {}),
    });

    // Проверяем, есть ли ещё сообщения
    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, -1) : messages;
    
    // Реверсируем для правильного порядка (старые → новые)
    const orderedMessages = resultMessages.reverse();

    // Преобразуем формат для клиента
    const formattedMessages = orderedMessages.map(msg => ({
      id: msg.id,
      userId: msg.userId,
      content: msg.content,
      isUser: msg.isUser,
      timestamp: msg.createdAt.toISOString(),
    }));

    res.json({
      success: true,
      data: formattedMessages,
      pagination: {
        total,
        hasMore,
        nextCursor: hasMore ? resultMessages[resultMessages.length - 1]?.id : null,
      },
      message: 'История чата получена успешно'
    } as ApiResponse);

  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    } as ApiResponse);
  }
});

// Отправить сообщение
router.post('/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const validatedData = sendMessageSchema.parse(req.body);

    // Сохраняем сообщение пользователя
    const userMessage = await prisma.chatMessage.create({
      data: {
        userId: user.userId,
        content: validatedData.content,
        isUser: true,
      },
    });

    // Генерируем ответ AI (пока моковый)
    const aiResponse = await generateAIResponse(validatedData.content);

    // Сохраняем ответ AI
    const aiMessage = await prisma.chatMessage.create({
      data: {
        userId: user.userId,
        content: aiResponse,
        isUser: false,
      },
    });

    // Преобразуем формат для клиента (createdAt -> timestamp)
    const formattedUserMessage = {
      id: userMessage.id,
      userId: userMessage.userId,
      content: userMessage.content,
      isUser: userMessage.isUser,
      timestamp: userMessage.createdAt.toISOString(),
    };

    const formattedAiMessage = {
      id: aiMessage.id,
      userId: aiMessage.userId,
      content: aiMessage.content,
      isUser: aiMessage.isUser,
      timestamp: aiMessage.createdAt.toISOString(),
    };

    res.status(201).json({
      success: true,
      data: {
        userMessage: formattedUserMessage,
        aiMessage: formattedAiMessage,
      },
      message: 'Сообщение отправлено успешно'
    } as ApiResponse);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors
      } as ApiResponse);
    }

    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    } as ApiResponse);
  }
});

// Функция для генерации ответа AI через DeepSeek API с ротацией ключей
async function generateAIResponse(userMessage: string): Promise<string> {
  const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
  const MAX_RETRIES = 3; // Максимальное количество попыток с разными ключами
  
  console.log('[AI] Генерация ответа для сообщения:', userMessage.substring(0, 50) + '...');
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const apiKey = getNextApiKey();
    
    if (!apiKey) {
      console.error('[AI] Нет доступных DeepSeek API ключей. Добавьте ключи в server/src/lib/deepseek-keys.ts');
      break;
    }

    console.log(`[AI] Попытка ${attempt + 1}/${MAX_RETRIES} с DeepSeek ключом: ${apiKey.substring(0, 10)}...`);

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
            {
              role: 'system',
              content: 'Ты AI-помощник для иностранных студентов в России. Помогаешь с адаптацией, учёбой и бытовыми вопросами. Отвечай кратко, понятно и дружелюбно на русском языке. Если вопрос задан на другом языке, отвечай на том же языке, но можешь добавить перевод на русский.'
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const statusText = response.statusText;
        const status = response.status;
        
        // Если ошибка связана с API ключом (401, 403), помечаем ключ как нерабочий
        if (status === 401 || status === 403) {
          markKeyAsFailed(apiKey);
          lastError = new Error(`DeepSeek API authentication error (${status}): ${statusText}`);
          console.warn(`DeepSeek API ключ не прошел аутентификацию, пробуем следующий...`);
          continue; // Пробуем следующий ключ
        }
        
        // Ошибка 402 - Payment Required (недостаточно средств на балансе)
        if (status === 402) {
          console.warn(`⚠️ DeepSeek API: Недостаточно средств на балансе (402). Нужно пополнить баланс на https://platform.deepseek.com`);
          // Не помечаем как failed, так как это можно исправить пополнением баланса
          lastError = new Error(`DeepSeek API payment required (402): Недостаточно средств на балансе. Пополните баланс на https://platform.deepseek.com`);
          continue; // Пробуем следующий ключ (если есть)
        }
        
        // Для других ошибок (429 - rate limit, 500 и т.д.) тоже пробуем следующий ключ
        if (status === 429) {
          console.warn(`Rate limit для DeepSeek ключа, пробуем следующий...`);
          // Не помечаем как failed, так как это временная проблема
          lastError = new Error(`DeepSeek API rate limit error: ${statusText}`);
          continue;
        }
        
        // Для других ошибок помечаем ключ как нерабочий и пробуем следующий
        markKeyAsFailed(apiKey);
        lastError = new Error(`DeepSeek API error (${status}): ${statusText}`);
        continue;
      }

      const data = await response.json() as {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
      };
      
      // Если успешно, сбрасываем статус ключа (если он был помечен как failed)
      resetKey(apiKey);
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        throw new Error('Неверный формат ответа от DeepSeek API');
      }
      
      const aiResponse = data.choices[0].message.content;
      console.log('[AI] ✅ Успешно получен ответ от DeepSeek:', aiResponse.substring(0, 100) + '...');
      return aiResponse;

    } catch (error) {
      // Ошибки сети или парсинга - помечаем ключ и пробуем следующий
      if (error instanceof Error) {
        lastError = error;
        // Для сетевых ошибок не помечаем ключ как failed сразу
        if (!error.message.includes('fetch')) {
          markKeyAsFailed(apiKey);
        }
      } else {
        lastError = new Error(String(error));
      }
      
      console.warn(`Ошибка при использовании API ключа (попытка ${attempt + 1}/${MAX_RETRIES}):`, error);
      
      // Если это последняя попытка, выходим из цикла
      if (attempt === MAX_RETRIES - 1) {
        break;
      }
    }
  }

  // Если все попытки не удались, возвращаем моковый ответ
  console.error('[AI] ❌ Не удалось получить ответ от DeepSeek API после всех попыток:', lastError);
  console.log('[AI] ⚠️ Используется моковый ответ');
  return generateMockResponse(userMessage);
}

// Резервная функция для моковых ответов
function generateMockResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  // Контекстуальные ответы
  if (lowerMessage.includes('паспорт') || lowerMessage.includes('документ')) {
    return "При потере паспорта нужно обратиться в миграционную службу МВД (ГУВМ МВД России). Необходимо подать заявление о замене паспорта и временно использовать справку о регистрации. Обычно процедура занимает несколько недель.";
  }
  
  if (lowerMessage.includes('общежитие') || lowerMessage.includes('общежития')) {
    return "Для регистрации в общежитии нужно подать заявление в деканат вашего университета. Обычно требуются: справка о поступлении, медицинская справка, копия паспорта. За подробной информацией обратитесь в администрацию общежития.";
  }
  
  if (lowerMessage.includes('сессия') || lowerMessage.includes('экзамен')) {
    return "Зимняя сессия проходит в декабре-январе, летняя - в мае-июне. Перед сессией важно посетить все консультации, собрать материалы и составить план подготовки. Рекомендую начать готовиться за месяц до начала сессии.";
  }
  
  if (lowerMessage.includes('стипендия') || lowerMessage.includes('стипуха')) {
    return "Академическая стипендия выплачивается студентам, успешно сдавшим сессию без троек. Для получения нужно учиться на бюджете и не иметь задолженностей. Размер стипендии зависит от университета, обычно 2000-4000 рублей в месяц.";
  }
  
  // Общий ответ
  return "Спасибо за ваш вопрос! Я помогу вам с адаптацией в России. На нашей платформе есть подробные гайды по различным темам - рекомендую их изучить. Если нужна дополнительная помощь, задавайте конкретные вопросы.";
}

export default router; 