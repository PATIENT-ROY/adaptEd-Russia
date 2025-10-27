import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { authMiddleware } from '../lib/auth';
import { ApiResponse } from '@/types';

const router = Router();

// Схема валидации для отправки сообщения
const sendMessageSchema = z.object({
  content: z.string().min(1, 'Сообщение не может быть пустым'),
});

// Получить историю чата
router.get('/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const messages = await prisma.chatMessage.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      data: messages,
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

    res.status(201).json({
      success: true,
      data: {
        userMessage,
        aiMessage,
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

// Функция для генерации ответа AI через DeepSeek API
async function generateAIResponse(userMessage: string): Promise<string> {
  try {
    // Используем DeepSeek API (бесплатный вариант)
    const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
    
    // Если нет API ключа, возвращаем моковый ответ
    if (!DEEPSEEK_API_KEY) {
      return generateMockResponse(userMessage);
    }

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Ты AI-помощник для иностранных студентов в России. Помогаешь с адаптацией, учёбой и бытовыми вопросами. Отвечай кратко, понятно и дружелюбно на русском языке.'
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error('AI Response error:', error);
    // В случае ошибки возвращаем моковый ответ
    return generateMockResponse(userMessage);
  }
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