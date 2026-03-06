import { Router, Request } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database.js';
import { authMiddleware, JWTPayload } from '../lib/auth.js';
import { ApiResponse, ReviewStatus } from '../types/index.js';

interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

const router = Router();

// Automatic country -> flag resolution for all 249 countries in any language
import countries from 'i18n-iso-countries';

countries.registerLocale(require('i18n-iso-countries/langs/ru.json'));
countries.registerLocale(require('i18n-iso-countries/langs/en.json'));
countries.registerLocale(require('i18n-iso-countries/langs/fr.json'));
countries.registerLocale(require('i18n-iso-countries/langs/ar.json'));
countries.registerLocale(require('i18n-iso-countries/langs/zh.json'));

const SEARCH_LOCALES = ['ru', 'en', 'fr', 'ar', 'zh'];

function countryToFlag(country: string | null | undefined): string {
  if (!country || typeof country !== 'string') return '🌍';
  const input = country.trim();
  if (!input) return '🌍';

  // 1. Direct ISO alpha-2 code (e.g. "KZ", "RU")
  const upper = input.toUpperCase();
  if (upper.length === 2 && countries.isValid(upper)) {
    return codeToEmoji(upper);
  }

  // 2. Search across all registered languages
  for (const locale of SEARCH_LOCALES) {
    const code = countries.getAlpha2Code(input, locale);
    if (code) return codeToEmoji(code);
  }

  return '🌍';
}

function codeToEmoji(code: string): string {
  const regional = (c: string) => 0x1F1E6 - 65 + c.charCodeAt(0);
  return String.fromCodePoint(regional(code[0]), regional(code[1]));
}

// --------------------------- validation schemas ---------------------------
const REVIEW_TEXT_MIN = 20;
const REVIEW_TEXT_MAX = 500;

const createReviewSchema = z.object({
  text: z
    .string()
    .min(REVIEW_TEXT_MIN, `Текст отзыва не менее ${REVIEW_TEXT_MIN} символов`)
    .max(REVIEW_TEXT_MAX, `Текст отзыва не более ${REVIEW_TEXT_MAX} символов`),
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
      message: 'Отзыв отправлен на модерацию',
    } as ApiResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors,
      } as ApiResponse);
    }

    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
    } as ApiResponse);
  }
});

// PUT /api/reviews  (update own review, create-or-update; sets status to PENDING)
router.put('/reviews', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { text, rating, allowPublication } = createReviewSchema.parse(req.body);

    const existing = await prisma.review.findUnique({ where: { userId } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Отзыв не найден',
      } as ApiResponse);
    }

    const review = await prisma.review.update({
      where: { userId },
      data: {
        text,
        rating,
        allowPublication,
        status: ReviewStatus.PENDING,
      },
    });

    res.json({
      success: true,
      data: review,
      message: 'Отзыв отправлен на модерацию',
    } as ApiResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors,
      } as ApiResponse);
    }

    console.error('Error updating review:', error);
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

// GET /api/reviews  (public list: APPROVED + allowPublication, with TrustStats)
const PUBLIC_REVIEWS_LIMIT = 6;

router.get('/reviews', async (_req, res) => {
  try {
    const reviewWhere = {
      status: ReviewStatus.APPROVED,
      allowPublication: true,
    };

    const [reviewsRaw, totalStudents, usersForStats, avgResult] = await Promise.all([
      prisma.review.findMany({
        where: reviewWhere,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        take: PUBLIC_REVIEWS_LIMIT,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              country: true,
              university: true,
              plan: true,
              profile: { select: { avatar: true } },
            },
          },
        },
      }),
      prisma.user.count(),
      prisma.user.findMany({
        select: {
          university: true,
          country: true,
        },
      }),
      prisma.review.aggregate({
        where: reviewWhere,
        _avg: { rating: true },
      }),
    ]);

    const universities = new Set(
      usersForStats
        .map((u) => (u.university ?? '').trim())
        .filter((u) => u.length > 1),
    );
    const countries = new Set(
      usersForStats
        .map((u) => (u.country ?? '').trim())
        .filter((c) => c.length > 1),
    );

    const stats = {
      totalStudents,
      totalUniversities: universities.size,
      totalCountries: countries.size,
      averageRating:
        avgResult._avg.rating != null
          ? Math.round(avgResult._avg.rating * 10) / 10
          : 0,
    };

    const reviews = reviewsRaw.map((r) => {
      const user = r.user as {
        name: string;
        country: string | null;
        university: string | null;
        plan: string;
        profile?: { avatar: string | null } | null;
      };
      return {
        id: r.id,
        text: r.text,
        rating: r.rating,
        isPremium: user.plan === 'PREMIUM',
        countryFlag: countryToFlag(user.country),
        createdAt: r.createdAt.toISOString(),
        user: {
          name: user.name,
          country: user.country,
          university: user.university,
          emailVerified: false,
          avatar: user.profile?.avatar ?? null,
        },
      };
    });

    res.json({ reviews, stats });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Ошибка валидации параметров',
        details: error.errors,
      });
    }

    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
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

const MAX_FEATURED_REVIEWS = 6;

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

    if (data.isFeatured === true) {
      const featuredCount = await prisma.review.count({ where: { isFeatured: true } });
      const current = await prisma.review.findUnique({ where: { id }, select: { isFeatured: true } });
      const willBecomeFeatured = current?.isFeatured !== true;
      if (willBecomeFeatured && featuredCount >= MAX_FEATURED_REVIEWS) {
        return res.status(400).json({
          success: false,
          error: 'Можно выбрать максимум 6 избранных отзывов',
        } as ApiResponse);
      }
    }

    const review = await prisma.review.update({
      where: { id },
      data,
    });

    res.json({ success: true, data: review, message: 'Отзыв обновлён' } as ApiResponse);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors,
      } as ApiResponse);
    }

    const err = error as { code?: string };
    if (err.code === 'P2025') {
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
