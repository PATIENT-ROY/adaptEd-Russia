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

export type GuideReadCount = {
  guideId: string;
  guideType: string;
  count: number;
};

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
    newBuddyApplications: number;
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
  topReads: GuideReadCount[];
};

const emptyMetric = (): StatMetric => ({ value: 0, change: '0%' });

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value !== null && typeof value === 'object' ? (value as UnknownRecord) : {};
}

function asMetric(value: unknown): StatMetric {
  const metric = asRecord(value);
  return {
    value: Number(metric.value ?? 0),
    change: String(metric.change ?? '0%'),
  };
}

function normalizeDashboard(raw: unknown): AdminDashboardData {
  const data = asRecord(raw);
  const stats = asRecord(data.stats);
  const ops = asRecord(data.ops);
  const guideReads = stats.guideReads ?? stats.docscan ?? emptyMetric();
  return {
    stats: {
      users: asMetric(stats.users),
      guides: asMetric(stats.guides),
      ai: asMetric(stats.ai),
      guideReads: asMetric(guideReads),
    },
    ops: {
      openTickets: Number(ops.openTickets ?? 0),
      pendingReviews: Number(ops.pendingReviews ?? 0),
      newBuddyApplications: Number(ops.newBuddyApplications ?? 0),
      guideReadsWeek: Number(ops.guideReadsWeek ?? 0),
      aiMessagesWeek: Number(ops.aiMessagesWeek ?? 0),
    },
    recentUsers: Array.isArray(data.recentUsers)
      ? (data.recentUsers as AdminDashboardData['recentUsers'])
      : [],
    recentGuides: Array.isArray(data.recentGuides)
      ? (data.recentGuides as AdminDashboardData['recentGuides'])
      : [],
    topReads: Array.isArray(data.topReads)
      ? (data.topReads as GuideReadCount[])
      : [],
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
  invitePending?: boolean;
  registeredAt: string;
  lastLogin: string;
  guidesRead: number;
  aiQuestions: number;
};

export type AdminGuideRow = {
  id: string;
  rowKey?: string;
  href?: string;
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

export type AdminGuidesPayload = {
  dbGuides: AdminGuideRow[];
  reads: GuideReadCount[];
};

export async function fetchAdminDashboard() {
  const raw = await adminFetch<unknown>('/dashboard');
  return normalizeDashboard(raw);
}

export function fetchAdminUsers() {
  return adminFetch<AdminUserRow[]>('/users');
}

async function adminMutate<T>(
  path: string,
  method: 'POST' | 'DELETE',
  body?: unknown,
): Promise<{ data: T; message?: string }> {
  const res = await fetch(`${API_BASE_URL}/admin${path}`, {
    method,
    headers: {
      ...authHeaders(),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: T;
    error?: string;
    message?: string;
  };
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Admin API error: ${res.status}`);
  }
  return { data: json.data as T, message: json.message };
}

export function revokeAdminInvite(userId: string) {
  return adminMutate<{ deleted: boolean; id?: string; user?: AdminUserRow }>(
    `/users/${encodeURIComponent(userId)}/revoke-invite`,
    'POST',
  );
}

export function demoteAdminUser(userId: string) {
  return adminMutate<{ user: AdminUserRow }>(
    `/users/${encodeURIComponent(userId)}/demote`,
    'POST',
  );
}

export function deleteAdminUser(userId: string, confirmEmail: string) {
  return adminMutate<{ deleted: boolean; id: string }>(
    `/users/${encodeURIComponent(userId)}`,
    'DELETE',
    { confirmEmail },
  );
}

export function fetchAdminGuideStats() {
  return adminFetch<AdminGuidesPayload>('/guides');
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
  const raw = asRecord(await adminFetch<unknown>('/analytics/docscan'));
  return {
    totalReads: Number(raw.totalReads ?? raw.totalScans ?? 0),
    activeReaders: Number(raw.activeReaders ?? raw.activeUsers ?? 0),
  };
}

export async function fetchAdminAchievementsAnalytics() {
  const raw = asRecord(await adminFetch<unknown>('/analytics/achievements'));
  return {
    totalAchievements: Number(raw.totalAchievements ?? 0),
    engagedShare: Number(raw.engagedShare ?? raw.avgProgress ?? 0),
    activeUsers: Number(raw.activeUsers ?? 0),
    newUsersMonth: Number(raw.newUsersMonth ?? 0),
  };
}
