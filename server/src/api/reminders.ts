import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { authMiddleware } from '../lib/auth';
import { ApiResponse } from '../types/index.js';
import { dispatchDueReminders, getReminderQuota } from '../lib/reminder-notifications';

const router = Router();

// Схема валидации для создания напоминания
const createReminderSchema = z.object({
  title: z.string().min(1, 'Заголовок обязателен'),
  description: z.string().optional(),
  dueDate: z.string().datetime(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  category: z.enum(['EDUCATION', 'LIFE', 'DOCUMENTS', 'HEALTH', 'OTHER']),
  notificationMethod: z.enum(['email', 'telegram', 'vk']).default('email'),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).default('PENDING'),
});

// Схема валидации для обновления напоминания
const updateReminderSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  category: z.enum(['EDUCATION', 'LIFE', 'DOCUMENTS', 'HEALTH', 'OTHER']).optional(),
  notificationMethod: z.enum(['email', 'telegram', 'vk']).optional(),
});

router.get('/quota', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const quota = await getReminderQuota(user.userId);
    res.json({
      success: true,
      data: quota,
    } as ApiResponse);
  } catch (error) {
    console.error('Get reminder quota error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
    } as ApiResponse);
  }
});

// Получить все напоминания пользователя
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const reminders = await prisma.reminder.findMany({
      where: { userId: user.userId },
      orderBy: { dueDate: 'asc' },
    });

    const validCategories = new Set(['EDUCATION', 'LIFE', 'DOCUMENTS', 'HEALTH', 'OTHER']);

    const normalizedReminders = reminders.map((reminder) => {
      let normalizedDueDate: string | null = null;
      if (reminder.dueDate != null) {
        const dateObj = reminder.dueDate instanceof Date ? reminder.dueDate : new Date(reminder.dueDate);
        if (!isNaN(dateObj.getTime())) {
          normalizedDueDate = dateObj.toISOString();
        }
      }

      const catUpper = String(reminder.category ?? '').toUpperCase().trim();
      const normalizedCategory = validCategories.has(catUpper) ? catUpper : 'OTHER';

      return {
        ...reminder,
        dueDate: normalizedDueDate,
        category: normalizedCategory,
        priority: (reminder.priority || 'MEDIUM').toUpperCase(),
        status: (reminder.status || 'PENDING').toUpperCase(),
        notificationMethod: reminder.notificationMethod || 'email',
      };
    });

    res.json({
      success: true,
      data: normalizedReminders,
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
    
    let validatedData;
    try {
      validatedData = createReminderSchema.parse(req.body);
    } catch (zodError: any) {
      console.error('Zod validation failed:', JSON.stringify(zodError.errors || zodError, null, 2));
      console.error('Request body that failed:', JSON.stringify(req.body, null, 2));
      throw zodError;
    }

    const dateForDB = new Date(validatedData.dueDate);

    if (isNaN(dateForDB.getTime())) {
      console.error('Invalid date provided:', validatedData.dueDate);
      return res.status(400).json({
        success: false,
        error: 'Некорректная дата'
      } as ApiResponse);
    }

    const dbData = {
      title: validatedData.title,
      description: validatedData.description || null,
      userId: user.userId,
      dueDate: dateForDB,
      status: (validatedData.status || 'PENDING').toUpperCase() as any,
      category: validatedData.category.toUpperCase() as any,
      priority: (validatedData.priority || 'MEDIUM').toUpperCase() as any,
      notificationMethod: validatedData.notificationMethod || 'email',
    };
    
    let reminder;
    try {
      reminder = await prisma.reminder.create({
        data: {
          title: dbData.title,
          description: dbData.description,
          userId: dbData.userId,
          dueDate: dbData.dueDate,
          category: dbData.category,
          priority: dbData.priority,
          status: dbData.status,
          notificationMethod: dbData.notificationMethod,
        },
      });
    } catch (dbError: any) {
      console.error('❌ Prisma create error:', dbError);
      console.error('❌ Error message:', dbError.message);
      console.error('❌ Error code:', dbError.code);
      console.error('❌ Error meta:', JSON.stringify(dbError.meta || {}, null, 2));
      throw dbError;
    }

    if (!reminder.category || reminder.category !== dbData.category) {
      console.error('❌ CRITICAL: Category mismatch!');
      console.error('  Expected:', dbData.category);
      console.error('  Got from DB:', reminder.category);
      console.error('  Reminder object:', reminder);
    }

    const rawDueDateForNormalize = reminder.dueDate;
    
    let normalizedDueDate: string | null = null;
    
    if (rawDueDateForNormalize !== null && rawDueDateForNormalize !== undefined) {
      try {
        if (rawDueDateForNormalize instanceof Date) {
          normalizedDueDate = rawDueDateForNormalize.toISOString();
        } else {
          const date = new Date(rawDueDateForNormalize);
          if (!isNaN(date.getTime())) {
            normalizedDueDate = date.toISOString();
          } else {
            console.error('Invalid date value:', rawDueDateForNormalize);
          }
        }
      } catch (e) {
        console.error('Error converting dueDate:', e);
      }
    } else {
      console.warn('dueDate is null or undefined - cannot normalize');
    }
    
    const normalizedReminder = {
      id: reminder.id,
      userId: reminder.userId,
      title: reminder.title,
      description: reminder.description,
      dueDate: normalizedDueDate,
      category: reminder.category ? String(reminder.category).toUpperCase() : 'OTHER',
      priority: reminder.priority ? String(reminder.priority).toUpperCase() : 'MEDIUM',
      status: reminder.status ? String(reminder.status).toUpperCase() : 'PENDING',
      notificationMethod: reminder.notificationMethod || 'email',
      createdAt: reminder.createdAt instanceof Date ? reminder.createdAt.toISOString() : reminder.createdAt,
      updatedAt: reminder.updatedAt instanceof Date ? reminder.updatedAt.toISOString() : reminder.updatedAt,
    };
    
    res.status(201).json({
      success: true,
      data: normalizedReminder,
      message: 'Напоминание создано успешно'
    } as ApiResponse);

    if (dateForDB.getTime() <= Date.now()) {
      dispatchDueReminders().catch((error) => {
        console.error('[reminders] dispatch after create failed:', error);
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', JSON.stringify(error.errors, null, 2));
      console.error('Request body was:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors
      } as ApiResponse);
    }

    console.error('Create reminder error:', error);
    console.error('Error stack:', (error as Error).stack);
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

    // Нормализуем данные перед отправкой
    const normalizedReminder = {
      ...reminder,
      dueDate: reminder.dueDate ? reminder.dueDate.toISOString() : null,
      category: reminder.category || 'OTHER',
      priority: reminder.priority || 'MEDIUM',
      status: reminder.status || 'PENDING',
      notificationMethod: reminder.notificationMethod || 'email',
    };

    res.json({
      success: true,
      data: normalizedReminder,
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