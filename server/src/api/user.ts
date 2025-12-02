import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/database';
import { authMiddleware, getUserById } from '../lib/auth';
import { UpdateProfileRequest, ApiResponse } from '@/types';

interface ProfileStat {
  id: string;
  title: string;
  value: string;
  change?: string;
  period?: string;
  icon: string;
  color: string;
}

interface ProfileQuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
}

interface ProfileAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
}

interface ProfileActivityItem {
  id: string;
  type: 'guide' | 'reminder' | 'ai' | 'task' | 'payment';
  title: string;
  timestamp: string;
  icon: string;
  color: string;
  meta?: Record<string, unknown>;
}

interface ProfileBillingItem {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  invoiceNumber: string;
  paymentMethod?: string;
}

interface ProfileOverviewResponse {
  user: any;
  stats: ProfileStat[];
  quickActions: ProfileQuickAction[];
  achievements: ProfileAchievement[];
  recentActivity: ProfileActivityItem[];
  billingHistory: ProfileBillingItem[];
}

type UserLevelType = 'NEWBIE' | 'ADAPTING' | 'EXPERIENCED' | 'EXPERT' | 'LOCAL';
type QuestTypeType =
  | 'READ_GUIDES'
  | 'ASK_AI'
  | 'CREATE_REMINDER'
  | 'COMPLETE_REMINDER'
  | 'DAILY_LOGIN';

type AchievementCategoryType =
  | 'GETTING_STARTED'
  | 'EDUCATION'
  | 'LIFE'
  | 'ACTIVITY'
  | 'EXPERT';

type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategoryType;
  icon: string;
  xpReward: number;
  requirement: string;
  rarity: AchievementRarity;
}

interface DashboardUserProgress {
  id: string;
  userId: string;
  level: UserLevelType;
  xp: number;
  adaptationProgress: number;
  streak: number;
  lastVisit: string;
  totalGuidesRead: number;
  totalAIQuestions: number;
  totalRemindersCompleted: number;
  createdAt: string;
  updatedAt: string;
}

interface DashboardDailyQuest {
  id: string;
  userId: string;
  questType: QuestTypeType;
  title: string;
  description: string;
  target: number;
  progress: number;
  xpReward: number;
  date: string;
  completed: boolean;
}

interface DashboardOverviewResponse {
  userProgress: DashboardUserProgress;
  dailyQuests: DashboardDailyQuest[];
  lastUpdated: string;
}

interface AchievementStatus extends AchievementDefinition {
  unlocked: boolean;
  progress: number;
  progressCurrent: number;
  progressTarget: number;
}

interface AchievementsOverviewResponse {
  achievements: AchievementStatus[];
  unlockedCount: number;
  totalCount: number;
  totalXP: number;
  metrics: {
    guidesRead: number;
    aiQuestions: number;
    remindersCreated: number;
    remindersCompleted: number;
    docScanCount: number;
    streak: number;
    daysSinceRegistration: number;
    grantApplications: number;
    level: UserLevelType;
    xp: number;
  };
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const calculateStreak = (dates: Date[]): number => {
  if (!dates.length) {
    return 0;
  }

  const uniqueDays = Array.from(
    new Set(
      dates
        .filter((date) => !Number.isNaN(date.getTime()))
        .map((date) => startOfDay(date).getTime())
    )
  ).sort((a, b) => b - a);

  if (!uniqueDays.length) {
    return 0;
  }

  let streak = 0;
  let currentDay = startOfDay(new Date()).getTime();

  for (const day of uniqueDays) {
    if (day === currentDay) {
      streak += 1;
      currentDay -= DAY_IN_MS;
    } else if (day === currentDay - DAY_IN_MS) {
      streak += 1;
      currentDay = day - DAY_IN_MS;
    } else if (day < currentDay - DAY_IN_MS) {
      break;
    }
  }

  return streak;
};

const determineUserLevel = (xp: number): UserLevelType => {
  if (xp >= 1001) return 'LOCAL';
  if (xp >= 601) return 'EXPERT';
  if (xp >= 301) return 'EXPERIENCED';
  if (xp >= 101) return 'ADAPTING';
  return 'NEWBIE';
};

const calculateAdaptationProgress = (
  guidesCount: number,
  aiCount: number,
  remindersCompleted: number,
  streak: number
): number => {
  const guideScore = Math.min(guidesCount * 6, 30);
  const aiScore = Math.min(aiCount * 3, 25);
  const reminderScore = Math.min(remindersCompleted * 5, 25);
  const streakScore = Math.min(streak * 5, 20);

  return Math.min(100, guideScore + aiScore + reminderScore + streakScore);
};

const getLastActivityDate = (dates: Date[], fallback: Date): Date => {
  const timestamps = dates
    .filter((date) => !Number.isNaN(date.getTime()))
    .map((date) => date.getTime());

  if (!timestamps.length) {
    return fallback;
  }

  return new Date(Math.max(...timestamps));
};

const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: '1',
    name: 'Первые шаги',
    description: 'Зарегистрировались на платформе',
    category: 'GETTING_STARTED',
    icon: '👋',
    xpReward: 10,
    requirement: 'register',
    rarity: 'common',
  },
  {
    id: '2',
    name: 'Любознательный',
    description: 'Прочитали первый гайд',
    category: 'GETTING_STARTED',
    icon: '📖',
    xpReward: 10,
    requirement: 'read_1_guide',
    rarity: 'common',
  },
  {
    id: '3',
    name: 'Общительный',
    description: 'Задали первый вопрос AI',
    category: 'GETTING_STARTED',
    icon: '💬',
    xpReward: 10,
    requirement: 'ask_1_ai_question',
    rarity: 'common',
  },
  {
    id: '4',
    name: 'Организованный',
    description: 'Создали первое напоминание',
    category: 'GETTING_STARTED',
    icon: '🔔',
    xpReward: 15,
    requirement: 'create_1_reminder',
    rarity: 'common',
  },
  {
    id: '4a',
    name: 'Сканер',
    description: 'Отсканировали первый документ',
    category: 'GETTING_STARTED',
    icon: '📄',
    xpReward: 15,
    requirement: 'scan_1_document',
    rarity: 'common',
  },
  {
    id: '5',
    name: 'Книжный червь',
    description: 'Прочитали 10 гайдов по учёбе',
    category: 'EDUCATION',
    icon: '📚',
    xpReward: 50,
    requirement: 'read_10_education_guides',
    rarity: 'rare',
  },
  {
    id: '6',
    name: 'Отличник',
    description: 'Изучили все гайды про сессию',
    category: 'EDUCATION',
    icon: '🎓',
    xpReward: 75,
    requirement: 'read_all_exam_guides',
    rarity: 'rare',
  },
  {
    id: '7',
    name: 'Исследователь',
    description: 'Прочитали гайд про курсовую работу',
    category: 'EDUCATION',
    icon: '📝',
    xpReward: 20,
    requirement: 'read_coursework_guide',
    rarity: 'common',
  },
  {
    id: '8',
    name: 'Стипендиат',
    description: 'Изучили раздел стипендий',
    category: 'EDUCATION',
    icon: '💰',
    xpReward: 30,
    requirement: 'explore_scholarships',
    rarity: 'common',
  },
  {
    id: '8a',
    name: 'Документалист',
    description: 'Отсканировали 10 документов',
    category: 'EDUCATION',
    icon: '📑',
    xpReward: 50,
    requirement: 'scan_10_documents',
    rarity: 'rare',
  },
  {
    id: '9',
    name: 'Житель',
    description: 'Прочитали 5 бытовых гайдов',
    category: 'LIFE',
    icon: '🏠',
    xpReward: 40,
    requirement: 'read_5_life_guides',
    rarity: 'common',
  },
  {
    id: '10',
    name: 'Здоровяк',
    description: 'Изучили все медицинские гайды',
    category: 'LIFE',
    icon: '🏥',
    xpReward: 60,
    requirement: 'read_all_health_guides',
    rarity: 'rare',
  },
  {
    id: '11',
    name: 'Документовед',
    description: 'Изучили все гайды про документы',
    category: 'LIFE',
    icon: '📄',
    xpReward: 50,
    requirement: 'read_all_document_guides',
    rarity: 'rare',
  },
  {
    id: '12',
    name: 'Путешественник',
    description: 'Прочитали гайд про транспорт',
    category: 'LIFE',
    icon: '🚇',
    xpReward: 25,
    requirement: 'read_transport_guide',
    rarity: 'common',
  },
  {
    id: '13',
    name: 'Неделька',
    description: 'Заходили 7 дней подряд',
    category: 'ACTIVITY',
    icon: '🔥',
    xpReward: 100,
    requirement: 'streak_7_days',
    rarity: 'epic',
  },
  {
    id: '14',
    name: 'Месячник',
    description: 'Заходили 30 дней подряд',
    category: 'ACTIVITY',
    icon: '⚡',
    xpReward: 300,
    requirement: 'streak_30_days',
    rarity: 'legendary',
  },
  {
    id: '15',
    name: 'Супер активный',
    description: 'Выполнили 20 напоминаний',
    category: 'ACTIVITY',
    icon: '🌟',
    xpReward: 80,
    requirement: 'complete_20_reminders',
    rarity: 'rare',
  },
  {
    id: '16',
    name: 'Целеустремлённый',
    description: 'Выполнили 50 напоминаний',
    category: 'ACTIVITY',
    icon: '💪',
    xpReward: 150,
    requirement: 'complete_50_reminders',
    rarity: 'epic',
  },
  {
    id: '17',
    name: 'Мудрец',
    description: 'Прочитали 50 гайдов',
    category: 'EXPERT',
    icon: '🦉',
    xpReward: 200,
    requirement: 'read_50_guides',
    rarity: 'epic',
  },
  {
    id: '18',
    name: 'Знаток',
    description: 'Задали 50 вопросов AI',
    category: 'EXPERT',
    icon: '🧠',
    xpReward: 150,
    requirement: 'ask_50_ai_questions',
    rarity: 'epic',
  },
  {
    id: '18a',
    name: 'Мастер сканирования',
    description: 'Отсканировали 50 документов',
    category: 'EXPERT',
    icon: '📊',
    xpReward: 200,
    requirement: 'scan_50_documents',
    rarity: 'epic',
  },
  {
    id: '19',
    name: 'Наставник',
    description: "Достигли уровня 'Местный'",
    category: 'EXPERT',
    icon: '👨‍🏫',
    xpReward: 500,
    requirement: 'reach_local_level',
    rarity: 'legendary',
  },
  {
    id: '20',
    name: 'Легенда',
    description: 'Получили все достижения',
    category: 'EXPERT',
    icon: '🏅',
    xpReward: 1000,
    requirement: 'earn_all_achievements',
    rarity: 'legendary',
  },
];

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
 
// Расширенный профиль пользователя с дополнительной информацией
router.get('/profile/overview', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;

    const [userData, reminders, payments, chatMessages] = await Promise.all([
      getUserById(authUser.userId),
      prisma.reminder.findMany({
        where: { userId: authUser.userId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      prisma.payment.findMany({
        where: { userId: authUser.userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.chatMessage.findMany({
        where: { userId: authUser.userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден',
      } as ApiResponse);
    }

    const activeReminders = reminders.filter(
      (reminder) => reminder.status === 'PENDING' || reminder.status === 'ACTIVE'
    );

    const completedReminders = reminders.filter((reminder) => reminder.status === 'COMPLETED');

    const guidesCompletedCount = Math.max(completedReminders.length, 0);
    const displayedGuidesCount = Math.max(guidesCompletedCount, 5);
    const aiQuestionsCount = chatMessages.length;
    const registeredAt = userData.registeredAt ? new Date(userData.registeredAt) : new Date();
    const daysSinceRegistration = Math.max(
      Math.floor((Date.now() - registeredAt.getTime()) / (1000 * 60 * 60 * 24)),
      0
    );

    const stats: ProfileStat[] = [
      {
        id: 'guides-viewed',
        title: 'Изучено гайдов',
        value: `${displayedGuidesCount}`,
        change: guidesCompletedCount > 0 ? `+${guidesCompletedCount}` : '+0',
        period: 'за месяц',
        icon: 'FileText',
        color: 'from-blue-500 to-blue-600',
      },
      {
        id: 'active-reminders',
        title: 'Активных задач',
        value: `${activeReminders.length}`,
        change: `${activeReminders.length >= reminders.length ? '+0' : `-${reminders.length - activeReminders.length}`}`,
        period: 'сейчас',
        icon: 'Target',
        color: 'from-purple-500 to-purple-600',
      },
      {
        id: 'ai-questions',
        title: 'Вопросов к AI',
        value: `${aiQuestionsCount}`,
        change: aiQuestionsCount > 0 ? `+${Math.min(aiQuestionsCount, 7)}` : '+0',
        period: 'за неделю',
        icon: 'MessageSquare',
        color: 'from-orange-500 to-orange-600',
      },
    ];

    const quickActions: ProfileQuickAction[] = [
      {
        id: 'education-guide',
        title: 'Образовательный навигатор',
        description: 'Гайды по образовательной системе',
        icon: 'BookOpen',
        color: 'from-blue-500 to-blue-600',
        href: '/education-guide',
      },
      {
        id: 'smart-reminders',
        title: 'Умные напоминания',
        description: 'Управление задачами и сроками',
        icon: 'Bell',
        color: 'from-purple-500 to-purple-600',
        href: '/reminders',
      },
      {
        id: 'ai-assistant',
        title: 'AI Помощник',
        description: 'Задавайте вопросы на родном языке',
        icon: 'MessageSquare',
        color: 'from-orange-500 to-orange-600',
        href: '/ai-helper',
      },
      {
        id: 'docscan',
        title: 'DocScan',
        description: 'OCR из PDF и фото, перевод и экспорт',
        icon: 'ScanLine',
        color: 'from-indigo-500 to-indigo-600',
        href: '/docscan',
      },
      {
        id: 'support',
        title: 'Поддержка',
        description: 'Помощь и консультации',
        icon: 'HelpCircle',
        color: 'from-green-500 to-green-600',
        href: '/support',
      },
    ];

    const achievements: ProfileAchievement[] = [
      {
        id: 'first-steps',
        title: 'Первые шаги',
        description: 'Завершил 5 гайдов',
        icon: 'Award',
        color: 'from-yellow-400 to-orange-500',
        unlocked: displayedGuidesCount >= 5,
      },
      {
        id: 'active-student',
        title: 'Активный студент',
        description: '30 дней в России',
        icon: 'GraduationCap',
        color: 'from-blue-400 to-blue-600',
        unlocked: daysSinceRegistration >= 30,
      },
      {
        id: 'ai-expert',
        title: 'AI Эксперт',
        description: '50 вопросов к AI',
        icon: 'MessageSquare',
        color: 'from-purple-400 to-purple-600',
        unlocked: aiQuestionsCount >= 50,
      },
      {
        id: 'adaptation-master',
        title: 'Мастер адаптации',
        description: '100 дней в России',
        icon: 'Crown',
        color: 'from-yellow-500 to-orange-600',
        unlocked: daysSinceRegistration >= 100,
      },
    ];

    const recentActivity: ProfileActivityItem[] = [
      ...reminders.slice(0, 5).map((reminder) => ({
        id: `reminder-${reminder.id}`,
        type: reminder.status === 'COMPLETED' ? 'task' : 'reminder',
        title:
          reminder.status === 'COMPLETED'
            ? `Завершена задача: ${reminder.title}`
            : `Напоминание: ${reminder.title}`,
        timestamp: reminder.updatedAt.toISOString(),
        icon: reminder.status === 'COMPLETED' ? 'CheckCircle' : 'Bell',
        color: reminder.status === 'COMPLETED' ? 'text-green-600' : 'text-purple-600',
        meta: {
          dueDate: reminder.dueDate.toISOString(),
          status: reminder.status,
        },
      })),
      ...chatMessages.slice(0, 3).map((message) => ({
        id: `chat-${message.id}`,
        type: 'ai' as const,
        title: `Вопрос к AI: ${message.content.substring(0, 48)}${
          message.content.length > 48 ? '…' : ''
        }`,
        timestamp: message.createdAt.toISOString(),
        icon: 'MessageSquare',
        color: 'text-orange-600',
      })),
      ...payments.slice(0, 3).map((payment) => ({
        id: `payment-${payment.id}`,
        type: 'payment' as const,
        title: `Платёж: ${payment.description}`,
        timestamp: payment.createdAt.toISOString(),
        icon: payment.status === 'SUCCEEDED' ? 'CreditCard' : 'Clock',
        color: payment.status === 'SUCCEEDED' ? 'text-emerald-600' : 'text-slate-500',
        meta: {
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
        },
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    const billingHistory: ProfileBillingItem[] = payments.map((payment, index) => ({
      id: payment.id,
      date: payment.createdAt.toISOString(),
      amount: payment.amount,
      currency: payment.currency,
      status:
        payment.status === 'SUCCEEDED'
          ? 'paid'
          : payment.status === 'PENDING'
          ? 'pending'
          : payment.status === 'FAILED'
          ? 'failed'
          : payment.status.toLowerCase(),
      description: payment.description,
      invoiceNumber: `INV-${new Date(payment.createdAt)
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '')}-${index + 1}`,
      paymentMethod: payment.paymentMethod,
    }));

    const responsePayload: ProfileOverviewResponse = {
      user: {
        ...userData,
      },
      stats,
      quickActions,
      achievements,
      recentActivity,
      billingHistory,
    };

    res.json({
      success: true,
      data: responsePayload,
      message: 'Профиль получен успешно',
    } as ApiResponse<ProfileOverviewResponse>);
  } catch (error) {
    console.error('Get profile overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
    } as ApiResponse);
  }
});

// Данные для дашборда пользователя
router.get('/dashboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;

    const [userData, reminders, payments, chatMessages] = await Promise.all([
      getUserById(authUser.userId),
      prisma.reminder.findMany({
        where: { userId: authUser.userId },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
      prisma.payment.findMany({
        where: { userId: authUser.userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.chatMessage.findMany({
        where: { userId: authUser.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден',
      } as ApiResponse);
    }

    const now = new Date();
    const todayStart = startOfDay(now);

    const completedReminders = reminders.filter(
      (reminder) => reminder.status === 'COMPLETED'
    );
    const completedRemindersToday = completedReminders.filter((reminder) =>
      isSameDay(new Date(reminder.updatedAt), now)
    ).length;
    const remindersCreatedToday = reminders.filter((reminder) =>
      isSameDay(new Date(reminder.createdAt), now)
    ).length;

    const aiQuestionsCount = chatMessages.length;
    const aiQuestionsToday = chatMessages.filter((message) =>
      isSameDay(new Date(message.createdAt), now)
    ).length;

    const guidesCompletedCount = Math.max(
      completedReminders.length,
      Math.ceil(aiQuestionsCount / 4)
    );

    const guidesReadToday = Math.min(
      completedRemindersToday + Math.ceil(aiQuestionsToday / 2),
      3
    );

    const activityDates: Date[] = [
      ...reminders.map((reminder) => new Date(reminder.updatedAt)),
      ...reminders.map((reminder) => new Date(reminder.createdAt)),
      ...chatMessages.map((message) => new Date(message.createdAt)),
      ...payments.map((payment) => new Date(payment.createdAt)),
    ].filter((date) => !Number.isNaN(date.getTime()));

    const streak = calculateStreak(activityDates);
    const lastVisit = getLastActivityDate(
      activityDates,
      new Date(userData.registeredAt)
    );

    const xpFromGuides = guidesCompletedCount * 20;
    const xpFromAI = aiQuestionsCount * 5;
    const xpFromReminders = completedReminders.length * 10;
    const xpFromStreak = streak * 15;

    const totalXP = xpFromGuides + xpFromAI + xpFromReminders + xpFromStreak;
    const userLevel = determineUserLevel(totalXP);
    const adaptationProgress = calculateAdaptationProgress(
      guidesCompletedCount,
      aiQuestionsCount,
      completedReminders.length,
      streak
    );

    const userProgress: DashboardUserProgress = {
      id: `progress-${userData.id}`,
      userId: userData.id,
      level: userLevel,
      xp: totalXP,
      adaptationProgress,
      streak,
      lastVisit: lastVisit.toISOString(),
      totalGuidesRead: guidesCompletedCount,
      totalAIQuestions: aiQuestionsCount,
      totalRemindersCompleted: completedReminders.length,
      createdAt: new Date(userData.registeredAt).toISOString(),
      updatedAt: now.toISOString(),
    };

    const dailyQuests: DashboardDailyQuest[] = [
      {
        id: `quest-read-guides-${userData.id}-${todayStart.toISOString()}`,
        userId: userData.id,
        questType: 'READ_GUIDES',
        title: 'Прочитать 3 гайда',
        description: 'Изучите 3 новых гайда сегодня, чтобы ускорить адаптацию',
        target: 3,
        progress: Math.min(guidesReadToday, 3),
        xpReward: 30,
        date: now.toISOString(),
        completed: guidesReadToday >= 3,
      },
      {
        id: `quest-ask-ai-${userData.id}-${todayStart.toISOString()}`,
        userId: userData.id,
        questType: 'ASK_AI',
        title: 'Задать 2 вопроса AI',
        description: 'Используйте AI-помощника для решения повседневных задач',
        target: 2,
        progress: Math.min(aiQuestionsToday, 2),
        xpReward: 20,
        date: now.toISOString(),
        completed: aiQuestionsToday >= 2,
      },
      {
        id: `quest-create-reminder-${userData.id}-${todayStart.toISOString()}`,
        userId: userData.id,
        questType: 'CREATE_REMINDER',
        title: 'Создать напоминание',
        description: 'Добавьте новое напоминание, чтобы ничего не пропустить',
        target: 1,
        progress: Math.min(remindersCreatedToday, 1),
        xpReward: 15,
        date: now.toISOString(),
        completed: remindersCreatedToday >= 1,
      },
    ];

    const responsePayload: DashboardOverviewResponse = {
      userProgress,
      dailyQuests,
      lastUpdated: now.toISOString(),
    };

    res.json({
      success: true,
      data: responsePayload,
      message: 'Данные дашборда получены успешно',
    } as ApiResponse<DashboardOverviewResponse>);
  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
    } as ApiResponse);
  }
});

// Достижения пользователя
router.get('/achievements', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;

    const [userData, reminders, payments, chatMessages, docScanAggregate, grantApplicationsCount] =
      await Promise.all([
        getUserById(authUser.userId),
        prisma.reminder.findMany({
          where: { userId: authUser.userId },
          orderBy: { updatedAt: 'desc' },
          take: 100,
        }),
        prisma.payment.findMany({
          where: { userId: authUser.userId },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        prisma.chatMessage.findMany({
          where: { userId: authUser.userId },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
        prisma.docScanUsage.aggregate({
          where: { userId: authUser.userId },
          _sum: { scanCount: true },
        }),
        prisma.userGrantApplication.count({
          where: { userId: authUser.userId },
        }),
      ]);

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден',
      } as ApiResponse);
    }

    const now = new Date();
    const completedReminders = reminders.filter((reminder) => reminder.status === 'COMPLETED');
    const aiQuestionsCount = chatMessages.length;
    const docScanCount = docScanAggregate._sum?.scanCount ?? 0;
    const remindersCreatedCount = reminders.length;
    const remindersCompletedCount = completedReminders.length;
    const daysSinceRegistration = Math.max(
      Math.floor(
        (now.getTime() - new Date(userData.registeredAt ?? now).getTime()) / DAY_IN_MS
      ),
      0
    );

    const activityDates: Date[] = [
      ...reminders.map((reminder) => new Date(reminder.updatedAt)),
      ...reminders.map((reminder) => new Date(reminder.createdAt)),
      ...chatMessages.map((message) => new Date(message.createdAt)),
      ...payments.map((payment) => new Date(payment.createdAt)),
    ].filter((date) => !Number.isNaN(date.getTime()));

    const streak = calculateStreak(activityDates);

    const guidesCompletedCount = Math.max(
      remindersCompletedCount,
      Math.ceil(aiQuestionsCount / 4)
    );

    const xpFromGuides = guidesCompletedCount * 20;
    const xpFromAI = aiQuestionsCount * 5;
    const xpFromReminders = remindersCompletedCount * 10;
    const xpFromStreak = streak * 15;
    const totalXP = xpFromGuides + xpFromAI + xpFromReminders + xpFromStreak;
    const userLevel = determineUserLevel(totalXP);

    const thresholdProgress = (current: number, target: number): AchievementStatus => ({
      id: '',
      name: '',
      description: '',
      category: 'GETTING_STARTED',
      icon: '',
      xpReward: 0,
      requirement: '',
      rarity: 'common',
      unlocked: current >= target,
      progress: target <= 0 ? 1 : Math.min(current / target, 1),
      progressCurrent: current,
      progressTarget: target,
    });

    const booleanProgress = (
      unlocked: boolean,
      currentValue: number,
      targetValue: number = 1
    ): AchievementStatus => ({
      id: '',
      name: '',
      description: '',
      category: 'GETTING_STARTED',
      icon: '',
      xpReward: 0,
      requirement: '',
      rarity: 'common',
      unlocked,
      progress: unlocked
        ? 1
        : targetValue <= 0
        ? 0
        : Math.min(currentValue / targetValue, 1),
      progressCurrent: unlocked ? targetValue : currentValue,
      progressTarget: targetValue,
    });

    const requirementEvaluators: Record<string, () => AchievementStatus> = {
      register: () => booleanProgress(true, 1),
      read_1_guide: () => thresholdProgress(guidesCompletedCount, 1),
      ask_1_ai_question: () => thresholdProgress(aiQuestionsCount, 1),
      create_1_reminder: () => thresholdProgress(remindersCreatedCount, 1),
      scan_1_document: () => thresholdProgress(docScanCount, 1),
      read_10_education_guides: () => thresholdProgress(guidesCompletedCount, 10),
      read_all_exam_guides: () => thresholdProgress(guidesCompletedCount, 25),
      read_coursework_guide: () => thresholdProgress(guidesCompletedCount, 5),
      explore_scholarships: () =>
        booleanProgress(grantApplicationsCount > 0, grantApplicationsCount, 1),
      scan_10_documents: () => thresholdProgress(docScanCount, 10),
      read_5_life_guides: () => thresholdProgress(guidesCompletedCount, 5),
      read_all_health_guides: () => thresholdProgress(guidesCompletedCount, 15),
      read_all_document_guides: () => thresholdProgress(guidesCompletedCount, 20),
      read_transport_guide: () => thresholdProgress(guidesCompletedCount, 2),
      streak_7_days: () => thresholdProgress(streak, 7),
      streak_30_days: () => thresholdProgress(streak, 30),
      complete_20_reminders: () => thresholdProgress(remindersCompletedCount, 20),
      complete_50_reminders: () => thresholdProgress(remindersCompletedCount, 50),
      read_50_guides: () => thresholdProgress(guidesCompletedCount, 50),
      ask_50_ai_questions: () => thresholdProgress(aiQuestionsCount, 50),
      scan_50_documents: () => thresholdProgress(docScanCount, 50),
      reach_local_level: () => {
        const targetXP = 1001;
        const isUnlocked = userLevel === 'LOCAL';
        const progressValue = Math.min(totalXP / targetXP, 1);
        return {
          id: '',
          name: '',
          description: '',
          category: 'GETTING_STARTED',
          icon: '',
          xpReward: 0,
          requirement: '',
          rarity: 'common',
          unlocked: isUnlocked,
          progress: progressValue,
          progressCurrent: Math.min(totalXP, targetXP),
          progressTarget: targetXP,
        };
      },
    };

    const achievementStatuses: AchievementStatus[] = ACHIEVEMENTS.map((achievement) => {
      const evaluator = requirementEvaluators[achievement.requirement];
      const baseStatus = evaluator ? evaluator() : thresholdProgress(0, 1);

      return {
        ...achievement,
        unlocked: baseStatus.unlocked,
        progress: baseStatus.progress,
        progressCurrent: baseStatus.progressCurrent,
        progressTarget: baseStatus.progressTarget,
      };
    });

    const legendIndex = achievementStatuses.findIndex(
      (achievement) => achievement.requirement === 'earn_all_achievements'
    );
    const achievementsWithoutLegend = achievementStatuses.filter(
      (achievement) => achievement.requirement !== 'earn_all_achievements'
    );
    const unlockedWithoutLegend = achievementsWithoutLegend.filter(
      (achievement) => achievement.unlocked
    ).length;
    const allUnlockedExceptLegend =
      achievementsWithoutLegend.length > 0 &&
      unlockedWithoutLegend === achievementsWithoutLegend.length;

    if (legendIndex >= 0) {
      const target = achievementsWithoutLegend.length || 1;
      achievementStatuses[legendIndex] = {
        ...achievementStatuses[legendIndex],
        unlocked: allUnlockedExceptLegend,
        progress: Math.min(unlockedWithoutLegend / target, 1),
        progressCurrent: unlockedWithoutLegend,
        progressTarget: target,
      };
    }

    const unlockedCount = achievementStatuses.filter((achievement) => achievement.unlocked).length;
    const totalCount = achievementStatuses.length;
    const totalUnlockedXP = achievementStatuses
      .filter((achievement) => achievement.unlocked)
      .reduce((sum, achievement) => sum + achievement.xpReward, 0);

    const responsePayload: AchievementsOverviewResponse = {
      achievements: achievementStatuses,
      unlockedCount,
      totalCount,
      totalXP: totalUnlockedXP,
      metrics: {
        guidesRead: guidesCompletedCount,
        aiQuestions: aiQuestionsCount,
        remindersCreated: remindersCreatedCount,
        remindersCompleted: remindersCompletedCount,
        docScanCount,
        streak,
        daysSinceRegistration,
        grantApplications: grantApplicationsCount,
        level: userLevel,
        xp: totalXP,
      },
    };

    res.json({
      success: true,
      data: responsePayload,
      message: 'Достижения получены успешно',
    } as ApiResponse<AchievementsOverviewResponse>);
  } catch (error) {
    console.error('Get achievements overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
    } as ApiResponse);
  }
});

export default router; 