import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database.js';
import { authMiddleware } from '../lib/auth.js';

const router = Router();

router.use(authMiddleware);

const markReadSchema = z.object({
  guideId: z.string().min(1).max(100),
  guideType: z.enum(['education', 'life']),
});

// GET / — все прочитанные гайды пользователя (опционально ?type=education|life)
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const guideType = req.query.type as string | undefined;

    const where: any = { userId };
    if (guideType === 'education' || guideType === 'life') {
      where.guideType = guideType;
    }

    const reads = await prisma.guideRead.findMany({
      where,
      select: { guideId: true, guideType: true, readAt: true },
      orderBy: { readAt: 'desc' },
    });

    res.json({ success: true, data: reads });
  } catch (error) {
    console.error('Error fetching guide progress:', error);
    res.status(500).json({ error: 'Ошибка при загрузке прогресса' });
  }
});

// POST / — отметить гайд как прочитанный
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { guideId, guideType } = markReadSchema.parse(req.body);

    const read = await prisma.guideRead.upsert({
      where: {
        userId_guideId_guideType: { userId, guideId, guideType },
      },
      update: { readAt: new Date() },
      create: { userId, guideId, guideType },
    });

    res.json({ success: true, data: read });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Неверные данные', details: error.errors });
    }
    console.error('Error marking guide as read:', error);
    res.status(500).json({ error: 'Ошибка при сохранении прогресса' });
  }
});

// DELETE /:guideId — убрать отметку о прочтении
router.delete('/:guideId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { guideId } = req.params;
    const guideType = req.query.type as string;

    if (guideType !== 'education' && guideType !== 'life') {
      return res.status(400).json({ error: 'Параметр type обязателен (education | life)' });
    }

    await prisma.guideRead.deleteMany({
      where: { userId, guideId, guideType },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing guide read:', error);
    res.status(500).json({ error: 'Ошибка при удалении прогресса' });
  }
});

export default router;
