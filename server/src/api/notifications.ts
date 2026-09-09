import { Router, Request } from 'express';
import { z } from 'zod';
import { authMiddleware, JWTPayload } from '../lib/auth';
import { prisma } from '../lib/database';

interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

const router = Router();
router.use(authMiddleware);

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  unread: z.enum(['true', 'false']).optional(),
});

router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { page, limit, unread } = listQuerySchema.parse(req.query);
    const where = {
      userId: req.user!.userId,
      ...(unread === 'true' ? { readAt: null } : {}),
    };
    const [items, total, unreadCount] = await Promise.all([
      prisma.userNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userNotification.count({ where }),
      prisma.userNotification.count({
        where: { userId: req.user!.userId, readAt: null },
      }),
    ]);
    return res.json({
      success: true,
      data: { items, unreadCount, page, limit, total, hasMore: page * limit < total },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({ success: false, error: 'Неверные параметры' });
    }
    console.error('Notifications list error:', error);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
});

router.get('/unread-count', async (req: AuthenticatedRequest, res) => {
  try {
    const count = await prisma.userNotification.count({
      where: { userId: req.user!.userId, readAt: null },
    });
    return res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Notification counter error:', error);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
});

router.post('/read-all', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await prisma.userNotification.updateMany({
      where: { userId: req.user!.userId, readAt: null },
      data: { readAt: new Date() },
    });
    return res.json({ success: true, data: { updated: result.count } });
  } catch (error) {
    console.error('Notification read-all error:', error);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
});

router.post('/:id/read', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await prisma.userNotification.updateMany({
      where: { id: req.params.id, userId: req.user!.userId, readAt: null },
      data: { readAt: new Date() },
    });
    if (result.count === 0) {
      const exists = await prisma.userNotification.count({
        where: { id: req.params.id, userId: req.user!.userId },
      });
      if (!exists) return res.status(404).json({ success: false, error: 'Уведомление не найдено' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Notification read error:', error);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
});

export default router;
