import { prisma } from './database';
import { ACHIEVEMENT_CATALOG } from '../api/user';

const EXAM_GUIDE_IDS = ['0', '1', '5'];
const HEALTH_GUIDE_IDS = ['4', 'insurance-dms', 'medical-checkup'];
const DOCUMENT_GUIDE_IDS = ['migration-card', '7', '3'];

type CountMap = Map<string, number>;
type IdSet = Set<string>;

function toCountMap(
  rows: Array<{ userId: string; _count: { _all: number } }>,
): CountMap {
  const map: CountMap = new Map();
  for (const row of rows) map.set(row.userId, row._count._all);
  return map;
}

function countAtLeast(map: CountMap, target: number): number {
  let n = 0;
  for (const value of map.values()) if (value >= target) n += 1;
  return n;
}

function usersWithAllGuides(
  rows: Array<{ userId: string; guideId: string }>,
  requiredIds: string[],
): number {
  const byUser = new Map<string, Set<string>>();
  for (const row of rows) {
    const set = byUser.get(row.userId) ?? new Set<string>();
    set.add(row.guideId);
    byUser.set(row.userId, set);
  }
  let n = 0;
  for (const set of byUser.values()) {
    if (requiredIds.every((id) => set.has(id))) n += 1;
  }
  return n;
}

export async function buildAchievementsAnalytics() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalUsers,
    newUsersMonth,
    guideCounts,
    educationCounts,
    lifeCounts,
    examReads,
    healthReads,
    documentReads,
    courseworkReads,
    structureReads,
    transportReads,
    aiCounts,
    reminderCreated,
    reminderCompleted,
    scanCounts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { registeredAt: { gte: thirtyDaysAgo } } }),
    prisma.guideRead.groupBy({ by: ['userId'], _count: { _all: true } }),
    prisma.guideRead.groupBy({
      by: ['userId'],
      where: { guideType: 'education' },
      _count: { _all: true },
    }),
    prisma.guideRead.groupBy({
      by: ['userId'],
      where: { guideType: 'life' },
      _count: { _all: true },
    }),
    prisma.guideRead.findMany({
      where: { guideType: 'education', guideId: { in: EXAM_GUIDE_IDS } },
      select: { userId: true, guideId: true },
      distinct: ['userId', 'guideId'],
    }),
    prisma.guideRead.findMany({
      where: { guideType: 'life', guideId: { in: HEALTH_GUIDE_IDS } },
      select: { userId: true, guideId: true },
      distinct: ['userId', 'guideId'],
    }),
    prisma.guideRead.findMany({
      where: { guideType: 'life', guideId: { in: DOCUMENT_GUIDE_IDS } },
      select: { userId: true, guideId: true },
      distinct: ['userId', 'guideId'],
    }),
    prisma.guideRead.findMany({
      where: { guideType: 'education', guideId: '4' },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.guideRead.findMany({
      where: { guideType: 'education', guideId: '3' },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.guideRead.findMany({
      where: { guideType: 'life', guideId: '5' },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.chatMessage.groupBy({
      by: ['userId'],
      where: { isUser: true },
      _count: { _all: true },
    }),
    prisma.reminder.groupBy({ by: ['userId'], _count: { _all: true } }),
    prisma.reminder.groupBy({
      by: ['userId'],
      where: { status: 'COMPLETED' },
      _count: { _all: true },
    }),
    prisma.docScanUsage.groupBy({
      by: ['userId'],
      where: { scanCount: { gt: 0 } },
      _sum: { scanCount: true },
    }),
  ]);

  const guides = toCountMap(guideCounts);
  const education = toCountMap(educationCounts);
  const life = toCountMap(lifeCounts);
  const ai = toCountMap(aiCounts);
  const remindersMade = toCountMap(reminderCreated);
  const remindersDone = toCountMap(reminderCompleted);
  const scans: CountMap = new Map();
  for (const row of scanCounts) {
    scans.set(row.userId, row._sum.scanCount ?? 0);
  }

  const readers: IdSet = new Set(guides.keys());
  const aiUsers: IdSet = new Set(ai.keys());
  const engagedUsers: IdSet = new Set([...readers, ...aiUsers, ...remindersMade.keys(), ...scans.keys()]);

  const unlockCounts: Record<string, number> = {
    register: totalUsers,
    read_1_guide: countAtLeast(guides, 1),
    ask_1_ai_question: countAtLeast(ai, 1),
    create_1_reminder: countAtLeast(remindersMade, 1),
    scan_1_document: countAtLeast(scans, 1),
    read_10_education_guides: countAtLeast(education, 10),
    read_exam_guides: usersWithAllGuides(examReads, EXAM_GUIDE_IDS),
    read_coursework_guide: courseworkReads.length,
    read_structure_guide: structureReads.length,
    scan_10_documents: countAtLeast(scans, 10),
    read_5_life_guides: countAtLeast(life, 5),
    read_health_guides: usersWithAllGuides(healthReads, HEALTH_GUIDE_IDS),
    read_document_guides: usersWithAllGuides(documentReads, DOCUMENT_GUIDE_IDS),
    read_transport_guide: transportReads.length,
    streak_7_days: 0,
    streak_30_days: 0,
    complete_20_reminders: countAtLeast(remindersDone, 20),
    complete_50_reminders: countAtLeast(remindersDone, 50),
    read_25_guides: countAtLeast(guides, 25),
    ask_50_ai_questions: countAtLeast(ai, 50),
    scan_50_documents: countAtLeast(scans, 50),
    reach_local_level: 0,
    earn_all_achievements: 0,
  };

  const categories = (['GETTING_STARTED', 'EDUCATION', 'LIFE', 'ACTIVITY', 'EXPERT'] as const).map(
    (key) => {
      const items = ACHIEVEMENT_CATALOG.filter((item) => item.category === key);
      const unlockedUsers = items.reduce(
        (max, item) => Math.max(max, unlockCounts[item.requirement] ?? 0),
        0,
      );
      return {
        key,
        catalog: items.length,
        unlockedUsers,
        share: totalUsers > 0 ? Math.round((unlockedUsers / totalUsers) * 100) : 0,
      };
    },
  );

  const recent = ACHIEVEMENT_CATALOG
    .map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      rarity: item.rarity,
      unlockedUsers: unlockCounts[item.requirement] ?? 0,
    }))
    .filter((item) => item.unlockedUsers > 0 && item.id !== '1')
    .sort((a, b) => b.unlockedUsers - a.unlockedUsers)
    .slice(0, 6);

  return {
    totalAchievements: ACHIEVEMENT_CATALOG.length,
    engagedShare: totalUsers > 0 ? Math.round((engagedUsers.size / totalUsers) * 100) : 0,
    activeUsers: engagedUsers.size,
    newUsersMonth,
    categories,
    recent,
  };
}

export async function buildDocscanAnalytics() {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setHours(0, 0, 0, 0);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

  const [totalScans, successOcr, ocrErrors, exports, uniqueUsers, recent] = await Promise.all([
    prisma.docScanUsage.aggregate({ _sum: { scanCount: true } }),
    prisma.docScanUsage.count({ where: { success: true, exported: false, scanCount: { gt: 0 } } }),
    prisma.docScanUsage.count({ where: { success: false } }),
    prisma.docScanUsage.count({ where: { exported: true } }),
    prisma.docScanUsage.groupBy({
      by: ['userId'],
      where: { scanCount: { gt: 0 } },
    }),
    prisma.docScanUsage.findMany({
      where: { createdAt: { gte: fourteenDaysAgo }, scanCount: { gt: 0 } },
      select: { createdAt: true, scanCount: true },
    }),
  ]);

  const byDay = new Map<string, number>();
  for (let i = 0; i < 14; i += 1) {
    const day = new Date(fourteenDaysAgo);
    day.setDate(fourteenDaysAgo.getDate() + i);
    byDay.set(day.toISOString().slice(0, 10), 0);
  }
  for (const row of recent) {
    const key = row.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + row.scanCount);
  }

  const scans = totalScans._sum.scanCount ?? 0;

  return {
    totalScans: scans,
    successOcr,
    ocrErrors,
    activeUsers: uniqueUsers.length,
    funnel: {
      upload: scans,
      ocr: successOcr,
      export: exports,
    },
    trend: [...byDay.entries()].map(([date, count]) => ({ date, count })),
  };
}
