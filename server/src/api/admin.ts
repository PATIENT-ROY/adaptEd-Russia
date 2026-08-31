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
      guideReadGroups,
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
      prisma.guideRead.groupBy({
        by: ['guideId', 'guideType'],
        _count: { _all: true },
      }),
    ]);

    const topReads = [...guideReadGroups]
      .sort((a, b) => b._count._all - a._count._all)
      .slice(0, 5)
      .map((row) => ({
        guideId: row.guideId,
        guideType: row.guideType,
        count: row._count._all,
      }));

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
        topReads,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

const adminUserListSelect = {
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
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: { createdAt: true },
  },
  passwordSetupTokens: {
    select: { usedAt: true, expiresAt: true, createdAt: true },
  },
};

type AdminUserListRecord = {
  id: string;
  name: string;
  email: string;
  country: string;
  language: string;
  role: string;
  registeredAt: Date;
  _count: { guideReads: number; chatMessages: number };
  chatMessages: Array<{ createdAt: Date }>;
  passwordSetupTokens: Array<{
    usedAt: Date | null;
    expiresAt: Date;
    createdAt: Date;
  }>;
};

function toAdminUserRow(u: AdminUserListRecord) {
  const unusedInvites = u.passwordSetupTokens.filter((token) => token.usedAt === null);
  const invitePending = unusedInvites.length > 0;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    country: u.country,
    language: u.language.toLowerCase(),
    role: u.role.toLowerCase(),
    status: invitePending ? 'pending' : 'active',
    invitePending,
    registeredAt: u.registeredAt.toISOString().slice(0, 10),
    lastLogin: invitePending
      ? '—'
      : (u.chatMessages[0]?.createdAt.toISOString().slice(0, 10) ??
        u.registeredAt.toISOString().slice(0, 10)),
    guidesRead: u._count.guideReads,
    aiQuestions: u._count.chatMessages,
  };
}

async function loadAdminUserRow(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: adminUserListSelect,
  });
  return user ? toAdminUserRow(user) : null;
}

async function countAdmins() {
  return prisma.user.count({ where: { role: 'ADMIN' } });
}

// GET /api/admin/users
router.get('/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { registeredAt: 'desc' },
      select: adminUserListSelect,
    });

    res.json({
      success: true,
      data: users.map(toAdminUserRow),
    } as ApiResponse);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

// POST /api/admin/users/:id/revoke-invite
router.post('/users/:id/revoke-invite', async (req: AuthedRequest, res) => {
  try {
    const targetId = String(req.params.id);
    if (targetId === req.user?.userId) {
      return res.status(400).json({
        success: false,
        error: 'Нельзя отозвать приглашение у себя',
      } as ApiResponse);
    }

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        registeredAt: true,
        role: true,
        passwordSetupTokens: {
          select: { id: true, usedAt: true, createdAt: true },
        },
        _count: {
          select: {
            guideReads: true,
            chatMessages: true,
            questions: true,
            reviews: true,
            payments: true,
            notes: true,
            reminders: true,
          },
        },
      },
    });

    if (!target) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' } as ApiResponse);
    }

    const unused = target.passwordSetupTokens.filter((token) => token.usedAt === null);
    if (unused.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Нет активного приглашения',
      } as ApiResponse);
    }

    const usedCount = target.passwordSetupTokens.filter((token) => token.usedAt !== null).length;
    const firstInviteAt = unused.reduce(
      (min, token) => (token.createdAt < min ? token.createdAt : min),
      unused[0].createdAt,
    );
    const createdWithInvite =
      Math.abs(target.registeredAt.getTime() - firstInviteAt.getTime()) < 2 * 60 * 1000;
    const noActivity =
      target._count.guideReads === 0 &&
      target._count.chatMessages === 0 &&
      target._count.questions === 0 &&
      target._count.reviews === 0 &&
      target._count.payments === 0 &&
      target._count.notes === 0 &&
      target._count.reminders === 0;
    const isStub = usedCount === 0 && createdWithInvite && noActivity;

    if (isStub && target.role === 'ADMIN' && (await countAdmins()) <= 1) {
      return res.status(400).json({
        success: false,
        error: 'Нельзя удалить последнего администратора',
      } as ApiResponse);
    }

    const now = new Date();
    await prisma.passwordSetupToken.updateMany({
      where: { userId: target.id, usedAt: null },
      data: { usedAt: now },
    });

    if (isStub) {
      await prisma.user.delete({ where: { id: target.id } });
      return res.json({
        success: true,
        data: { deleted: true, id: target.id },
        message: 'Приглашение отозвано, черновик аккаунта удалён',
      } as ApiResponse);
    }

    const row = await loadAdminUserRow(target.id);
    return res.json({
      success: true,
      data: { deleted: false, user: row },
      message: 'Приглашение отозвано',
    } as ApiResponse);
  } catch (error) {
    console.error('Admin revoke invite error:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

// POST /api/admin/users/:id/demote
router.post('/users/:id/demote', async (req: AuthedRequest, res) => {
  try {
    const targetId = String(req.params.id);
    if (targetId === req.user?.userId) {
      return res.status(400).json({
        success: false,
        error: 'Нельзя снять права у себя',
      } as ApiResponse);
    }

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, role: true },
    });
    if (!target) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' } as ApiResponse);
    }
    if (target.role !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        error: 'Пользователь не администратор',
      } as ApiResponse);
    }
    if ((await countAdmins()) <= 1) {
      return res.status(400).json({
        success: false,
        error: 'Нельзя снять последнего администратора',
      } as ApiResponse);
    }

    await prisma.user.update({
      where: { id: target.id },
      data: { role: 'STUDENT', tokenVersion: { increment: 1 } },
    });

    const row = await loadAdminUserRow(target.id);
    return res.json({
      success: true,
      data: { user: row },
      message: 'Права администратора сняты',
    } as ApiResponse);
  } catch (error) {
    console.error('Admin demote error:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req: AuthedRequest, res) => {
  try {
    const targetId = String(req.params.id);
    if (targetId === req.user?.userId) {
      return res.status(400).json({
        success: false,
        error: 'Нельзя удалить свой аккаунт',
      } as ApiResponse);
    }

    const confirmEmail = String(
      (req.body as { confirmEmail?: unknown } | undefined)?.confirmEmail ?? '',
    )
      .trim()
      .toLowerCase();

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, email: true, role: true },
    });
    if (!target) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' } as ApiResponse);
    }
    if (target.role === 'ADMIN') {
      return res.status(400).json({
        success: false,
        error: 'Сначала снимите права администратора',
      } as ApiResponse);
    }
    if (!confirmEmail || confirmEmail !== target.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Введите email пользователя для подтверждения',
      } as ApiResponse);
    }

    await prisma.user.delete({ where: { id: target.id } });
    return res.json({
      success: true,
      data: { deleted: true, id: target.id },
      message: 'Пользователь удалён',
    } as ApiResponse);
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' } as ApiResponse);
  }
});

function adminGuideSection(category: string): 'education' | 'life' {
  return category.toLowerCase() === 'education' ? 'education' : 'life';
}

function parseGuideTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

// GET /api/admin/guides — static catalog is on the client; here: DB extras + read counts
router.get('/guides', async (_req, res) => {
  try {
    const [guides, grouped] = await Promise.all([
      prisma.guide.findMany({
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.guideRead.groupBy({
        by: ['guideId', 'guideType'],
        _count: { _all: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        dbGuides: guides.map((g) => {
          const category = adminGuideSection(g.category);
          return {
            id: g.id,
            rowKey: `${category}:${g.id}`,
            href: `/guides/${category}/${encodeURIComponent(g.id)}`,
            title: g.title,
            category,
            content: g.content,
            language: g.language.toLowerCase(),
            tags: parseGuideTags(g.tags),
            status: g.isPublished ? 'published' : 'draft',
            views: g.views,
            createdAt: g.createdAt.toISOString().slice(0, 10),
            updatedAt: g.updatedAt.toISOString().slice(0, 10),
            author: 'AdaptEd Russia',
          };
        }),
        reads: grouped.map((row) => ({
          guideId: row.guideId,
          guideType: row.guideType,
          count: row._count._all,
        })),
      },
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
