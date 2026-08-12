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

export type AdminDashboardData = {
  stats: {
    users: { value: number; change: string };
    guides: { value: number; change: string };
    ai: { value: number; change: string };
    guideReads: { value: number; change: string };
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

export function fetchAdminDashboard() {
  return adminFetch<AdminDashboardData>('/dashboard');
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

export function fetchAdminDocscanAnalytics() {
  return adminFetch<{
    totalReads: number;
    activeReaders: number;
  }>('/analytics/docscan');
}

export function fetchAdminAchievementsAnalytics() {
  return adminFetch<{
    totalAchievements: number;
    engagedShare: number;
    activeUsers: number;
    newUsersMonth: number;
  }>('/analytics/achievements');
}
