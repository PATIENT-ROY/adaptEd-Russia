import { Router, Request } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database.js';
import { authMiddleware, JWTPayload } from '../lib/auth.js';
import { ApiResponse, ReviewStatus } from '@/types';

interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

const router = Router();

// --------------------------- validation schemas ---------------------------
const createReviewSchema = z.object({
  text: z.string().min(1, 'Текст отзыва не может быть пустым'),
  rating: z.number().int().min(1, 'Рейтинг должен быть от 1 до 5').max(5, 'Рейтинг должен быть от 1 до 5'),
  allowPublication: z.boolean().default(true),
});

const getReviewsQuerySchema = z.object({
  featured: z
    .preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
  limit: z.coerce.number().int().min(1).max(100).default(6),
  sort: z.enum(['latest']).default('latest'),
});

const adminUpdateSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  isFeatured: z.boolean().optional(),
  allowPublication: z.boolean().optional(),
});

// --------------------------- public/user endpoints --------------------------

// POST /api/reviews  (create review, one per user)
router.post('/reviews', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { text, rating, allowPublication } = createReviewSchema.parse(req.body);

    const existing = await prisma.review.findUnique({ where: { userId } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Вы уже оставили отзыв',
      } as ApiResponse);
    }

    const review = await prisma.review.create({
      data: {
        userId,
        text,
        rating,
        allowPublication,
        status: ReviewStatus.PENDING,
      },
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Отзыв был сохранён',
    } as ApiResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors,
      } as ApiResponse);
    }

    console.error('Error creating/updating review:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
    } as ApiResponse);
  }
});

// GET /api/reviews/me - fetch current user's review (any status)
router.get('/reviews/me', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      console.error('reviews/me called without userId on request', req.user);
      return res.status(400).json({ success: false, error: 'Пользователь не определён' } as ApiResponse);
    }
    const review = await prisma.review.findUnique({
      where: { userId },
    });
    res.json({ success: true, data: review } as ApiResponse);
  } catch (error) {
    console.error('Error fetching own review:', error);
    // include message in dev mode
    const message = (error as any)?.message || 'Внутренняя ошибка сервера';
    res.status(500).json({ success: false, error: message } as ApiResponse);
  }
});

// GET /api/reviews  (public list, only approved reviews)
router.get('/reviews', async (req, res) => {
  try {
    const { featured, limit, sort } = getReviewsQuerySchema.parse(req.query);

    const where: any = { status: ReviewStatus.APPROVED };
    if (featured === true) {
      where.isFeatured = true;
    }

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            university: true,
            country: true,
            plan: true,
            profile: {
              select: { avatar: true },
            },
          },
        },
      },
    });

    res.json({ success: true, data: reviews } as ApiResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // unlikely since query parsing, but handle
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации параметров',
        details: error.errors,
      } as ApiResponse);
    }

    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

// --------------------------- admin endpoints -------------------------------

// GET /api/admin/reviews - list for moderation
router.get('/admin/reviews', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Доступ запрещён' } as ApiResponse);
    }

    const { status, subscription, featured } = req.query;
    const where: any = {};

    if (status && typeof status === 'string') {
      where.status = status;
    }
    if (featured === 'true' || featured === 'false') {
      where.isFeatured = featured === 'true';
    }
    const include: any = {
      user: {
        select: {
          id: true,
          name: true,
          university: true,
          country: true,
          plan: true,
          profile: {
            select: { avatar: true },
          },
        },
      },
    };
    if (subscription && typeof subscription === 'string' && subscription !== 'all') {
      where.user = { plan: subscription };
    }

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include,
    });

    res.json({ success: true, data: reviews } as ApiResponse);
  } catch (error) {
    console.error('Error listing reviews (admin):', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

// PATCH /api/admin/reviews/:id  (update status or feature flag)
router.patch('/admin/reviews/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Доступ запрещён',
      } as ApiResponse);
    }

    const data = adminUpdateSchema.parse(req.body);
    const { id } = req.params;

    const review = await prisma.review.update({
      where: { id },
      data,
    });

    res.json({ success: true, data: review, message: 'Отзыв обновлён' } as ApiResponse);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors,
      } as ApiResponse);
    }

    // Prisma error when record not found
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Отзыв не найден' } as ApiResponse);
    }

    console.error('Error updating review (admin):', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

// DELETE /api/admin/reviews/:id - remove review
router.delete('/admin/reviews/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Доступ запрещён' } as ApiResponse);
    }
    const { id } = req.params;
    await prisma.review.delete({ where: { id } });
    res.json({ success: true, message: 'Отзыв удалён' } as ApiResponse);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Отзыв не найден' } as ApiResponse);
    }
    console.error('Error deleting review (admin):', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

export default router;
