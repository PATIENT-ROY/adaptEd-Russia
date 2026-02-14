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
});

// Получить все напоминания пользователя
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const reminders = await prisma.reminder.findMany({
      where: { userId: user.userId },
      orderBy: { dueDate: 'asc' },
    });

    console.log('Raw reminders from DB (count):', reminders.length);
    
    // Проверяем каждое напоминание на наличие обязательных полей
    const remindersWithoutDate = reminders.filter(r => !r.dueDate || r.dueDate === null);
    const remindersWithoutCategory = reminders.filter(r => !r.category || r.category === null || r.category === '');
    
    if (remindersWithoutDate.length > 0) {
      console.warn(`⚠️ WARNING: Found ${remindersWithoutDate.length} reminders without dueDate:`, 
        remindersWithoutDate.map(r => ({ id: r.id, title: r.title })));
    }
    
    if (remindersWithoutCategory.length > 0) {
      console.warn(`⚠️ WARNING: Found ${remindersWithoutCategory.length} reminders without category:`, 
        remindersWithoutCategory.map(r => ({ id: r.id, title: r.title, category: r.category })));
    }
    
    if (reminders.length > 0) {
      console.log('First reminder raw from DB:', {
        id: reminders[0].id,
        title: reminders[0].title,
        dueDate: reminders[0].dueDate,
        dueDateType: typeof reminders[0].dueDate,
        dueDateIsNull: reminders[0].dueDate === null,
        dueDateIsUndefined: reminders[0].dueDate === undefined,
        category: reminders[0].category,
        categoryType: typeof reminders[0].category,
        categoryIsNull: reminders[0].category === null,
        categoryIsEmpty: reminders[0].category === '',
        priority: reminders[0].priority,
        status: reminders[0].status,
        allFields: Object.keys(reminders[0]),
      });
    }

    // Нормализуем данные перед отправкой
    const normalizedReminders = reminders.map(reminder => {
      const rawDueDate = reminder.dueDate;
      
      console.log('Processing reminder dueDate:', {
        id: reminder.id,
        rawDueDate,
        rawDueDateType: typeof rawDueDate,
        isDate: rawDueDate instanceof Date,
        isNull: rawDueDate === null,
        isUndefined: rawDueDate === undefined,
      });
      
      let normalizedDueDate: string | null = null;
      
      if (rawDueDate !== null && rawDueDate !== undefined) {
        try {
          if (rawDueDate instanceof Date) {
            normalizedDueDate = rawDueDate.toISOString();
          } else {
            const dateObj = new Date(rawDueDate);
            if (!isNaN(dateObj.getTime())) {
              normalizedDueDate = dateObj.toISOString();
            } else {
              console.warn('Invalid date value:', rawDueDate);
            }
          }
        } catch (e) {
          console.error('Error converting dueDate:', e, rawDueDate);
        }
      } else {
        console.warn('dueDate is null or undefined for reminder:', reminder.id);
      }

      // Нормализуем категорию
      let normalizedCategory = 'OTHER';
      const rawCategory = reminder.category;
      
      console.log('Processing reminder category:', {
        id: reminder.id,
        rawCategory,
        rawCategoryType: typeof rawCategory,
        rawCategoryIsNull: rawCategory === null,
        rawCategoryIsUndefined: rawCategory === undefined,
        rawCategoryIsEmpty: rawCategory === '',
      });
      
      if (rawCategory && rawCategory !== null && rawCategory !== undefined && rawCategory !== '') {
        const catUpper = String(rawCategory).toUpperCase().trim();
        console.log('Category after upper case:', catUpper);
        
        // Проверяем, что категория валидна
        if (catUpper === 'EDUCATION' || catUpper === 'LIFE' || catUpper === 'DOCUMENTS' || catUpper === 'HEALTH' || catUpper === 'OTHER') {
          normalizedCategory = catUpper;
          console.log('✅ Valid category:', normalizedCategory);
        } else {
          console.warn('⚠️ Invalid category value:', catUpper, 'using OTHER');
          normalizedCategory = 'OTHER';
        }
      } else {
        console.warn('⚠️ Category is null/undefined/empty, using OTHER');
        normalizedCategory = 'OTHER';
      }
      
      const normalized = {
        ...reminder,
        dueDate: normalizedDueDate,
        category: normalizedCategory, // Явно указываем категорию
        priority: (reminder.priority || 'MEDIUM').toUpperCase(),
        status: (reminder.status || 'PENDING').toUpperCase(),
        notificationMethod: reminder.notificationMethod || 'email',
      };
      
      console.log('Mapped reminder:', {
        id: normalized.id,
        title: normalized.title,
        rawDueDate,
        normalizedDueDate,
        rawCategory: reminder.category,
        normalizedCategory: normalized.category,
        priority: normalized.priority,
        status: normalized.status,
      });
      
      return normalized;
    });

    // Проверяем финальные данные перед отправкой
    console.log('Final normalized reminders to send:', normalizedReminders.length);
    
    // Проверяем категории всех напоминаний
    const remindersWithWrongCategory = normalizedReminders.filter(r => 
      !r.category || r.category === 'OTHER' || r.category === ''
    );
    if (remindersWithWrongCategory.length > 0) {
      console.warn(`⚠️ WARNING: ${remindersWithWrongCategory.length} reminders with missing/wrong category:`, 
        remindersWithWrongCategory.map(r => ({ 
          id: r.id, 
          title: r.title, 
          category: r.category 
        })));
    }
    
    // Проверяем категории всех напоминаний - должны быть EDUCATION, LIFE, DOCUMENTS, HEALTH или OTHER
    normalizedReminders.forEach(r => {
      if (r.category && r.category !== 'EDUCATION' && r.category !== 'LIFE' && 
          r.category !== 'DOCUMENTS' && r.category !== 'HEALTH' && r.category !== 'OTHER') {
        console.warn(`⚠️ WARNING: Unknown category value for reminder ${r.id}:`, r.category);
      }
    });
    
    if (normalizedReminders.length > 0) {
      console.log('First normalized reminder before JSON:', {
        id: normalizedReminders[0].id,
        title: normalizedReminders[0].title,
        dueDate: normalizedReminders[0].dueDate,
        dueDateType: typeof normalizedReminders[0].dueDate,
        category: normalizedReminders[0].category,
        categoryType: typeof normalizedReminders[0].category,
        fullReminder: JSON.stringify(normalizedReminders[0], null, 2),
      });
      
      // Проверяем все напоминания
      console.log('All reminders categories:', 
        normalizedReminders.map(r => ({ 
          id: r.id, 
          title: r.title, 
          category: r.category 
        })));
    }

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
  // Принудительно выводим логи сразу при получении запроса
  console.log('=== REMINDER POST REQUEST START ===');
  console.log('POST /reminders - Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const user = (req as any).user;
    console.log('POST /reminders - User ID:', user?.userId || 'NO USER');
    
    let validatedData;
    try {
      validatedData = createReminderSchema.parse(req.body);
      console.log('Zod validation passed:', JSON.stringify(validatedData, null, 2));
    } catch (zodError: any) {
      console.error('Zod validation failed:', JSON.stringify(zodError.errors || zodError, null, 2));
      console.error('Request body that failed:', JSON.stringify(req.body, null, 2));
      throw zodError;
    }

    // Логируем данные перед созданием
    console.log('Creating reminder with data:', {
      title: validatedData.title,
      dueDate: validatedData.dueDate,
      category: validatedData.category,
      priority: validatedData.priority,
      status: validatedData.status,
      notificationMethod: validatedData.notificationMethod,
    });

    // Проверяем и конвертируем дату
    const dateForDB = new Date(validatedData.dueDate);
    console.log('Date for DB:', {
      input: validatedData.dueDate,
      dateObject: dateForDB,
      isValid: !isNaN(dateForDB.getTime()),
      isoString: dateForDB.toISOString(),
    });

    if (isNaN(dateForDB.getTime())) {
      console.error('Invalid date provided:', validatedData.dueDate);
      return res.status(400).json({
        success: false,
        error: 'Некорректная дата'
      } as ApiResponse);
    }

    // Проверяем категорию перед сохранением
    console.log('Category before DB save:', {
      validatedCategory: validatedData.category,
      validatedCategoryType: typeof validatedData.category,
      willUse: validatedData.category || 'OTHER',
    });

    // ВАЖНО: Проверяем, что category и dueDate действительно есть
    console.log('Before creating dbData:');
    console.log('  validatedData.category:', validatedData.category, 'type:', typeof validatedData.category);
    console.log('  dateForDB:', dateForDB, 'type:', typeof dateForDB, 'isDate:', dateForDB instanceof Date);
    
    const dbData = {
      title: validatedData.title,
      description: validatedData.description || null,
      userId: user.userId,
      dueDate: dateForDB,
      status: (validatedData.status || 'PENDING').toUpperCase() as any,
      category: validatedData.category.toUpperCase() as any, // Преобразуем в верхний регистр
      priority: (validatedData.priority || 'MEDIUM').toUpperCase() as any,
      notificationMethod: validatedData.notificationMethod || 'email',
    };
    
    // Проверяем, что все данные на месте перед сохранением
    console.log('dbData object:', {
      hasTitle: !!dbData.title,
      hasDueDate: !!dbData.dueDate,
      dueDateType: typeof dbData.dueDate,
      hasCategory: !!dbData.category,
      categoryValue: dbData.category,
      categoryType: typeof dbData.category,
      fullDbData: dbData,
    });
    
    console.log('Data to save to DB (serialized):', JSON.stringify({
      ...dbData,
      dueDate: dbData.dueDate instanceof Date ? dbData.dueDate.toISOString() : dbData.dueDate,
    }, null, 2));

    console.log('About to save to DB - raw dbData:', dbData);
    
    // ВАЖНО: Проверяем, что данные действительно передаются в Prisma
    console.log('About to call Prisma.create with:', {
      title: dbData.title,
      dueDate: dbData.dueDate,
      dueDateType: typeof dbData.dueDate,
      category: dbData.category,
      categoryType: typeof dbData.category,
      priority: dbData.priority,
      status: dbData.status,
    });
    
    let reminder;
    try {
      reminder = await prisma.reminder.create({
        data: {
          title: dbData.title,
          description: dbData.description,
          userId: dbData.userId,
          dueDate: dbData.dueDate, // Явно указываем все поля
          category: dbData.category,
          priority: dbData.priority,
          status: dbData.status,
          notificationMethod: dbData.notificationMethod,
        },
      });
      console.log('✅ Successfully created reminder in DB');
    } catch (dbError: any) {
      console.error('❌ Prisma create error:', dbError);
      console.error('❌ Error message:', dbError.message);
      console.error('❌ Error code:', dbError.code);
      console.error('❌ Error meta:', JSON.stringify(dbError.meta || {}, null, 2));
      throw dbError;
    }

    console.log('Created reminder from DB:', {
      id: reminder.id,
      title: reminder.title,
      dueDate: reminder.dueDate,
      dueDateType: typeof reminder.dueDate,
      dueDateInstanceOfDate: reminder.dueDate instanceof Date,
      dueDateIsNull: reminder.dueDate === null,
      dueDateIsUndefined: reminder.dueDate === undefined,
      dueDateValue: reminder.dueDate,
      category: reminder.category,
      categoryType: typeof reminder.category,
      categoryIsNull: reminder.category === null,
      categoryIsUndefined: reminder.category === undefined,
      categoryIsEmpty: reminder.category === '',
      categoryValue: reminder.category,
      expectedCategory: dbData.category,
      categoryMatches: reminder.category === dbData.category,
      priority: reminder.priority,
      status: reminder.status,
      notificationMethod: reminder.notificationMethod,
      allFields: Object.keys(reminder),
      fullReminder: JSON.stringify(reminder, null, 2),
    });
    
    // ВАЖНО: Проверяем, что категория сохранилась правильно
    if (!reminder.category || reminder.category !== dbData.category) {
      console.error('❌ CRITICAL: Category mismatch!');
      console.error('  Expected:', dbData.category);
      console.error('  Got from DB:', reminder.category);
      console.error('  Reminder object:', reminder);
    } else {
      console.log('✅ Category saved correctly in DB:', reminder.category);
    }

    // Нормализуем данные перед отправкой
    const rawDueDateForNormalize = reminder.dueDate;
    console.log('Normalizing dueDate:', {
      rawDueDate: rawDueDateForNormalize,
      rawDueDateType: typeof rawDueDateForNormalize,
      isDate: rawDueDateForNormalize instanceof Date,
      isNull: rawDueDateForNormalize === null,
      isUndefined: rawDueDateForNormalize === undefined,
      truthy: !!rawDueDateForNormalize,
    });
    
    let normalizedDueDate: string | null = null;
    
    if (rawDueDateForNormalize !== null && rawDueDateForNormalize !== undefined) {
      try {
        if (rawDueDateForNormalize instanceof Date) {
          normalizedDueDate = rawDueDateForNormalize.toISOString();
          console.log('Converted Date to ISO:', normalizedDueDate);
        } else {
          const date = new Date(rawDueDateForNormalize);
          if (!isNaN(date.getTime())) {
            normalizedDueDate = date.toISOString();
            console.log('Converted string to Date to ISO:', normalizedDueDate);
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
    
    // ВАЖНО: Проверяем, что данные из БД действительно есть
    console.log('Before normalization - reminder from DB:', {
      id: reminder.id,
      title: reminder.title,
      dueDate: reminder.dueDate,
      category: reminder.category,
      priority: reminder.priority,
      status: reminder.status,
      notificationMethod: reminder.notificationMethod,
    });
    
    // Создаем объект с явным указанием всех полей
    const normalizedReminder = {
      id: reminder.id,
      userId: reminder.userId,
      title: reminder.title,
      description: reminder.description,
      dueDate: normalizedDueDate, // Используем нормализованную дату
      category: reminder.category ? String(reminder.category).toUpperCase() : 'OTHER', // Явно преобразуем в строку
      priority: reminder.priority ? String(reminder.priority).toUpperCase() : 'MEDIUM',
      status: reminder.status ? String(reminder.status).toUpperCase() : 'PENDING',
      notificationMethod: reminder.notificationMethod || 'email',
      createdAt: reminder.createdAt instanceof Date ? reminder.createdAt.toISOString() : reminder.createdAt,
      updatedAt: reminder.updatedAt instanceof Date ? reminder.updatedAt.toISOString() : reminder.updatedAt,
    };
    
    console.log('Category normalization:', {
      dbCategory: reminder.category,
      dbCategoryType: typeof reminder.category,
      normalizedCategory: normalizedReminder.category,
    });
    
    console.log('Normalized reminder to send:', {
      id: normalizedReminder.id,
      rawDueDate: rawDueDateForNormalize,
      normalizedDueDate: normalizedReminder.dueDate,
      category: normalizedReminder.category,
      priority: normalizedReminder.priority,
      status: normalizedReminder.status,
      fullReminder: JSON.stringify(normalizedReminder, null, 2),
    });

    console.log('=== SENDING RESPONSE ===');
    console.log('Response data:', JSON.stringify(normalizedReminder, null, 2));
    
    res.status(201).json({
      success: true,
      data: normalizedReminder,
      message: 'Напоминание создано успешно'
    } as ApiResponse);
    
    console.log('=== REMINDER POST REQUEST END ===');

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