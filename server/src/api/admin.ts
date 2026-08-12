import { Router, Request, Response } from 'express';
import { authMiddleware } from '../lib/auth';
import { prisma } from '../lib/database';
import { ApiResponse } from '../types/index.js';
import { ACHIEVEMENT_CATALOG_SIZE } from './user';

const router = Router();

type AuthedRequest = Request & { user?: { userId: string; role: string } };

function requireAdmin(req: AuthedRequest, res: Response, next: () => void) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Доступ запрещён' } as ApiResponse);
  }
  next();
}

router.use(authMiddleware, requireAdmin);

function pctChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const delta = Math.round(((current - previous) / previous) * 100);
  return `${delta >= 0 ? '+' : ''}${delta}%`;
}

// GET /api/admin/dashboard
router.get('/dashboard', async (_req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const [
      totalUsers,
      usersLastMonth,
      usersPrevMonth,
      totalGuides,
      totalAiMessages,
      aiMessagesLastWeek,
      aiMessagesPrevWeek,
      guideReadsTotal,
      guideReadsLastWeek,
      guideReadsPrevWeek,
      openTickets,
      pendingReviews,
      recentUsers,
      recentGuides,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { registeredAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({
        where: { registeredAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
      prisma.guide.count(),
      prisma.chatMessage.count({ where: { isUser: true } }),
      prisma.chatMessage.count({
        where: { isUser: true, createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.chatMessage.count({
        where: { isUser: true, createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
      }),
      prisma.guideRead.count(),
      prisma.guideRead.count({ where: { readAt: { gte: sevenDaysAgo } } }),
      prisma.guideRead.count({
        where: { readAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
      }),
      prisma.supportTicket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      prisma.review.count({ where: { status: 'PENDING' } }),
      prisma.user.findMany({
        orderBy: { registeredAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          country: true,
          role: true,
          registeredAt: true,
        },
      }),
      prisma.guide.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          category: true,
          views: true,
          isPublished: true,
          updatedAt: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          users: {
            value: totalUsers,
            change: pctChange(usersLastMonth, usersPrevMonth),
          },
          guides: {
            value: totalGuides,
            change: pctChange(guideReadsLastWeek, guideReadsPrevWeek),
          },
          ai: {
            value: totalAiMessages,
            change: pctChange(aiMessagesLastWeek, aiMessagesPrevWeek),
          },
          guideReads: {
            value: guideReadsTotal,
            change: pctChange(guideReadsLastWeek, guideReadsPrevWeek),
          },
        },
        ops: {
          openTickets,
          pendingReviews,
          guideReadsWeek: guideReadsLastWeek,
          aiMessagesWeek: aiMessagesLastWeek,
        },
        recentUsers: recentUsers.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          country: u.country,
          status: 'active',
          joinDate: u.registeredAt.toISOString().slice(0, 10),
        })),
        recentGuides: recentGuides.map((g) => ({
          id: g.id,
          title: g.title,
          category: g.category.toLowerCase(),
          views: g.views,
          status: g.isPublished ? 'published' : 'draft',
          createdAt: g.updatedAt.toISOString().slice(0, 10),
        })),
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

// GET /api/admin/users
router.get('/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { registeredAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        country: true,
        language: true,
        role: true,
        registeredAt: true,
        university: true,
        plan: true,
        _count: {
          select: {
            guideReads: true,
            chatMessages: true,
          },
        },
        chatMessages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    res.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        country: u.country,
        language: u.language.toLowerCase(),
        role: u.role.toLowerCase(),
        status: 'active',
        registeredAt: u.registeredAt.toISOString().slice(0, 10),
        lastLogin:
          u.chatMessages[0]?.createdAt.toISOString().slice(0, 10) ??
          u.registeredAt.toISOString().slice(0, 10),
        guidesRead: u._count.guideReads,
        aiQuestions: u._count.chatMessages,
      })),
    } as ApiResponse);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

// GET /api/admin/guides — all guides including drafts
router.get('/guides', async (_req, res) => {
  try {
    const guides = await prisma.guide.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      data: guides.map((g) => ({
        id: g.id,
        title: g.title,
        category: g.category.toLowerCase(),
        content: g.content,
        language: g.language.toLowerCase(),
        tags: JSON.parse(g.tags || '[]') as string[],
        status: g.isPublished ? 'published' : 'draft',
        views: g.views,
        createdAt: g.createdAt.toISOString().slice(0, 10),
        updatedAt: g.updatedAt.toISOString().slice(0, 10),
        author: 'AdaptEd Russia',
      })),
    } as ApiResponse);
  } catch (error) {
    console.error('Admin guides error:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

// GET /api/admin/analytics/ai
router.get('/analytics/ai', async (_req, res) => {
  try {
    const [userMessages, aiMessages, uniqueUsers] = await Promise.all([
      prisma.chatMessage.count({ where: { isUser: true } }),
      prisma.chatMessage.count({ where: { isUser: false } }),
      prisma.chatMessage.groupBy({
        by: ['userId'],
        where: { isUser: true },
      }),
    ]);

    const solvedRate =
      userMessages > 0
        ? Math.min(100, Math.round((aiMessages / userMessages) * 100))
        : 0;

    res.json({
      success: true,
      data: {
        sessions: userMessages,
        solvedRate,
        uniqueUsers: uniqueUsers.length,
        avgRating: null,
        avgDialogMinutes: null,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Admin AI analytics error:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

// GET /api/admin/analytics/docscan — guide-read engagement (no DocScan model yet)
router.get('/analytics/docscan', async (_req, res) => {
  try {
    const [totalReads, uniqueUsers] = await Promise.all([
      prisma.guideRead.count(),
      prisma.guideRead.groupBy({ by: ['userId'] }),
    ]);

    res.json({
      success: true,
      data: {
        totalReads,
        activeReaders: uniqueUsers.length,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Admin guide-read analytics error:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

// GET /api/admin/analytics/achievements
router.get('/analytics/achievements', async (_req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalUsers, newUsersMonth, guideReaders, aiUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { registeredAt: { gte: thirtyDaysAgo } } }),
      prisma.guideRead.groupBy({ by: ['userId'] }),
      prisma.chatMessage.groupBy({
        by: ['userId'],
        where: { isUser: true },
      }),
    ]);

    const engagedUsers = new Set([
      ...guideReaders.map((g) => g.userId),
      ...aiUsers.map((a) => a.userId),
    ]).size;

    // % of users with guide/AI activity (not unlock progress — no unlock table yet)
    const engagedShare =
      totalUsers > 0 ? Math.round((engagedUsers / totalUsers) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalAchievements: ACHIEVEMENT_CATALOG_SIZE,
        engagedShare,
        activeUsers: engagedUsers,
        newUsersMonth,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Admin achievements analytics error:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

export default router;
