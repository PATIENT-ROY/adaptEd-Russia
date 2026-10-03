import { API_BASE_URL, emitAuthInvalid } from "@/lib/api";

export type UserNotification = {
  id: string;
  type: "SUPPORT" | "BUDDY" | "COMMUNITY" | "REVIEW" | "SYSTEM";
  title: string;
  message: string;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
};

export type NotificationPage = {
  items: UserNotification[];
  unreadCount: number;
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) emitAuthInvalid();
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Не удалось загрузить уведомления");
  return body.data as T;
}

export async function fetchNotifications(page = 1, limit = 20, unreadOnly = false) {
  const headers = authHeaders();
  if (!headers) return { items: [], unreadCount: 0, page, limit, total: 0, hasMore: false };
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (unreadOnly) query.set("unread", "true");
  const response = await fetch(`${API_BASE_URL}/notifications?${query}`, { headers });
  return parseResponse<NotificationPage>(response);
}

export async function fetchUnreadNotificationCount() {
  const headers = authHeaders();
  if (!headers) return 0;
  const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, { headers });
  return (await parseResponse<{ count: number }>(response)).count;
}

export async function markNotificationRead(id: string) {
  const headers = authHeaders();
  if (!headers) return;
  const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: "POST",
    headers,
  });
  await parseResponse<unknown>(response);
}

export async function markAllNotificationsRead() {
  const headers = authHeaders();
  if (!headers) return;
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: "POST",
    headers,
  });
  await parseResponse<unknown>(response);
}
