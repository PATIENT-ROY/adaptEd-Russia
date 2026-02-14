import { Router, Request, Response } from 'express';
import { prisma } from '../lib/database';
import { ApiResponse } from '@/types';

const router = Router();

// Получить все гайды
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, language } = req.query;
    
    const where: any = { isPublished: true };
    
    if (category) {
      where.category = category;
    }
    
    if (language) {
      where.language = language;
    }

    const guides = await prisma.guide.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: guides,
      message: 'Гайды получены успешно'
    } as ApiResponse);

  } catch (error) {
    console.error('Get guides error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    } as ApiResponse);
  }
});

// Получить конкретный гайд
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const guide = await prisma.guide.findUnique({
      where: { id },
    });

    if (!guide) {
      return res.status(404).json({
        success: false,
        error: 'Гайд не найден'
      } as ApiResponse);
    }

    // Увеличиваем количество просмотров
    await prisma.guide.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    res.json({
      success: true,
      data: guide,
      message: 'Гайд получен успешно'
    } as ApiResponse);

  } catch (error) {
    console.error('Get guide error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    } as ApiResponse);
  }
});

export default router; 