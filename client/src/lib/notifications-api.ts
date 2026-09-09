import { API_BASE_URL } from "@/lib/api";

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
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Не удалось загрузить уведомления");
  return body.data as T;
}

export async function fetchNotifications(page = 1, limit = 20, unreadOnly = false) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (unreadOnly) query.set("unread", "true");
  const response = await fetch(`${API_BASE_URL}/notifications?${query}`, {
    headers: authHeaders(),
  });
  return parseResponse<NotificationPage>(response);
}

export async function fetchUnreadNotificationCount() {
  const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
    headers: authHeaders(),
  });
  return (await parseResponse<{ count: number }>(response)).count;
}

export async function markNotificationRead(id: string) {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: "POST",
    headers: authHeaders(),
  });
  await parseResponse<unknown>(response);
}

export async function markAllNotificationsRead() {
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: "POST",
    headers: authHeaders(),
  });
  await parseResponse<unknown>(response);
}
