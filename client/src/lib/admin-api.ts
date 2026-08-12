import { API_BASE_URL } from '@/lib/api';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function adminFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}/admin${path}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Admin API error: ${res.status}`);
  }
  const body = await res.json();
  return body.data as T;
}

type StatMetric = { value: number; change: string };

export type AdminDashboardData = {
  stats: {
    users: StatMetric;
    guides: StatMetric;
    ai: StatMetric;
    guideReads: StatMetric;
  };
  ops: {
    openTickets: number;
    pendingReviews: number;
    guideReadsWeek: number;
    aiMessagesWeek: number;
  };
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    country: string;
    status: string;
    joinDate: string;
  }>;
  recentGuides: Array<{
    id: string;
    title: string;
    category: string;
    views: number;
    status: string;
    createdAt: string;
  }>;
};

const emptyMetric = (): StatMetric => ({ value: 0, change: '0%' });

function normalizeDashboard(raw: any): AdminDashboardData {
  const stats = raw?.stats ?? {};
  const guideReads = stats.guideReads ?? stats.docscan ?? emptyMetric();
  return {
    stats: {
      users: stats.users ?? emptyMetric(),
      guides: stats.guides ?? emptyMetric(),
      ai: stats.ai ?? emptyMetric(),
      guideReads: {
        value: Number(guideReads?.value ?? 0),
        change: String(guideReads?.change ?? '0%'),
      },
    },
    ops: {
      openTickets: Number(raw?.ops?.openTickets ?? 0),
      pendingReviews: Number(raw?.ops?.pendingReviews ?? 0),
      guideReadsWeek: Number(raw?.ops?.guideReadsWeek ?? 0),
      aiMessagesWeek: Number(raw?.ops?.aiMessagesWeek ?? 0),
    },
    recentUsers: Array.isArray(raw?.recentUsers) ? raw.recentUsers : [],
    recentGuides: Array.isArray(raw?.recentGuides) ? raw.recentGuides : [],
  };
}

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  country: string;
  language: string;
  role: string;
  status: string;
  registeredAt: string;
  lastLogin: string;
  guidesRead: number;
  aiQuestions: number;
};

export type AdminGuideRow = {
  id: string;
  title: string;
  category: string;
  content: string;
  language: string;
  tags: string[];
  status: string;
  views: number;
  createdAt: string;
  updatedAt: string;
  author: string;
};

export async function fetchAdminDashboard() {
  const raw = await adminFetch<any>('/dashboard');
  return normalizeDashboard(raw);
}

export function fetchAdminUsers() {
  return adminFetch<AdminUserRow[]>('/users');
}

export function fetchAdminGuides() {
  return adminFetch<AdminGuideRow[]>('/guides');
}

export function fetchAdminAiAnalytics() {
  return adminFetch<{
    sessions: number;
    solvedRate: number;
    uniqueUsers: number;
    avgRating: number | null;
    avgDialogMinutes: number | null;
  }>('/analytics/ai');
}

export async function fetchAdminDocscanAnalytics() {
  const raw = await adminFetch<any>('/analytics/docscan');
  return {
    totalReads: Number(raw?.totalReads ?? raw?.totalScans ?? 0),
    activeReaders: Number(raw?.activeReaders ?? raw?.activeUsers ?? 0),
  };
}

export async function fetchAdminAchievementsAnalytics() {
  const raw = await adminFetch<any>('/analytics/achievements');
  return {
    totalAchievements: Number(raw?.totalAchievements ?? 0),
    engagedShare: Number(raw?.engagedShare ?? raw?.avgProgress ?? 0),
    activeUsers: Number(raw?.activeUsers ?? 0),
    newUsersMonth: Number(raw?.newUsersMonth ?? 0),
  };
}
