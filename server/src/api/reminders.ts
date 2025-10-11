import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { authMiddleware } from '../lib/auth';
import { ApiResponse } from '@/types';

const router = Router();

// Схема валидации для создания напоминания
const createReminderSchema = z.object({
  title: z.string().min(1, 'Заголовок обязателен'),
  description: z.string().optional(),
  dueDate: z.string().datetime(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  category: z.enum(['EDUCATION', 'LIFE', 'DOCUMENTS', 'HEALTH', 'OTHER']),
  notificationMethod: z.enum(['email', 'telegram', 'vk']).default('email'),
});

// Схема валидации для обновления напоминания
const updateReminderSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  category: z.enum(['EDUCATION', 'LIFE', 'DOCUMENTS', 'HEALTH', 'OTHER']).optional(),
});

// Получить все напоминания пользователя
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const reminders = await prisma.reminder.findMany({
      where: { userId: user.userId },
      orderBy: { dueDate: 'asc' },
    });

    res.json({
      success: true,
      data: reminders,
      message: 'Напоминания получены успешно'
    } as ApiResponse);

  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    } as ApiResponse);
  }
});

// Создать новое напоминание
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const validatedData = createReminderSchema.parse(req.body);

    const reminder = await prisma.reminder.create({
      data: {
        ...validatedData,
        userId: user.userId,
        dueDate: new Date(validatedData.dueDate),
      },
    });

    res.status(201).json({
      success: true,
      data: reminder,
      message: 'Напоминание создано успешно'
    } as ApiResponse);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors
      } as ApiResponse);
    }

    console.error('Create reminder error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    } as ApiResponse);
  }
});

// Обновить напоминание
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const validatedData = updateReminderSchema.parse(req.body);

    // Проверяем, что напоминание принадлежит пользователю
    const existingReminder = await prisma.reminder.findFirst({
      where: { id, userId: user.userId },
    });

    if (!existingReminder) {
      return res.status(404).json({
        success: false,
        error: 'Напоминание не найдено'
      } as ApiResponse);
    }

    const updateData: any = { ...validatedData };
    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate);
    }

    const reminder = await prisma.reminder.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: reminder,
      message: 'Напоминание обновлено успешно'
    } as ApiResponse);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors
      } as ApiResponse);
    }

    console.error('Update reminder error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    } as ApiResponse);
  }
});

// Удалить напоминание
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Проверяем, что напоминание принадлежит пользователю
    const existingReminder = await prisma.reminder.findFirst({
      where: { id, userId: user.userId },
    });

    if (!existingReminder) {
      return res.status(404).json({
        success: false,
        error: 'Напоминание не найдено'
      } as ApiResponse);
    }

    await prisma.reminder.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Напоминание удалено успешно'
    } as ApiResponse);

  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    } as ApiResponse);
  }
});

export default router; 