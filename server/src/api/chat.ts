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

// Функция для генерации ответа AI (пока моковая)
async function generateAIResponse(userMessage: string): Promise<string> {
  // Здесь будет интеграция с реальным AI
  // Пока возвращаем моковый ответ
  
  const responses = [
    "Спасибо за ваш вопрос! Я помогу вам с адаптацией в России.",
    "Это интересный вопрос. Давайте разберем его подробнее.",
    "Для решения этой проблемы рекомендую обратиться к соответствующим гайдам на нашей платформе.",
    "Я понимаю вашу ситуацию. Вот несколько полезных советов...",
    "Этот вопрос часто задают иностранные студенты. Вот что нужно знать...",
  ];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  // Имитируем задержку обработки
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return randomResponse;
}

export default router; 