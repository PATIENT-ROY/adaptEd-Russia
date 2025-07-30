import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { authMiddleware, getUserById } from '../lib/auth';
import { UpdateProfileRequest, ApiResponse } from '@/types';

const router = Router();

// Схема валидации для обновления профиля
const updateProfileSchema = z.object({
  university: z.string().optional(),
  faculty: z.string().optional(),
  year: z.string().optional(),
  phone: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
});

// Получить профиль пользователя
router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userData = await getUserById(user.userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: userData,
      message: 'Профиль получен успешно'
    } as ApiResponse);

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    } as ApiResponse);
  }
});

// Обновить профиль пользователя
router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const validatedData = updateProfileSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        language: true,
        country: true,
        university: true,
        faculty: true,
        year: true,
        plan: true,
        phone: true,
        gender: true,
        registeredAt: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Профиль обновлен успешно'
    } as ApiResponse);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors
      } as ApiResponse);
    }

    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    } as ApiResponse);
  }
});

export default router; 