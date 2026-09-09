"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, HeartHandshake, LifeBuoy, MessageCircle, Star } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type UserNotification,
} from "@/lib/notifications-api";

const TYPE_LABELS: Record<UserNotification["type"], string> = {
  SUPPORT: "Поддержка",
  BUDDY: "AdaptEd Buddy",
  COMMUNITY: "Сообщество",
  REVIEW: "Отзывы",
  SYSTEM: "Система",
};

const TYPE_ICONS = {
  SUPPORT: LifeBuoy,
  BUDDY: HeartHandshake,
  COMMUNITY: MessageCircle,
  REVIEW: Star,
  SYSTEM: Bell,
};

export default function NotificationsPage() {
  return <ProtectedRoute><NotificationsContent /></ProtectedRoute>;
}

function NotificationsContent() {
  const router = useRouter();
  const [items, setItems] = useState<UserNotification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextPage = 1, append = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNotifications(nextPage, 20, unreadOnly);
      setItems((current) => append ? [...current, ...data.items] : data.items);
      setPage(data.page);
      setHasMore(data.hasMore);
      setUnreadCount(data.unreadCount);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить уведомления");
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => { void load(); }, [load]);

  const openItem = async (item: UserNotification) => {
    const href = item.link || "/notifications";
    if (item.readAt) {
      router.push(href);
      return;
    }
    setItems((current) => current.map((entry) =>
      entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry,
    ));
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await markNotificationRead(item.id);
    } catch {
      void load();
    } finally {
      router.push(href);
    }
  };

  const readAll = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      if (unreadOnly) setItems([]);
      else setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Не удалось обновить уведомления");
    }
  };

  return (
    <Layout>
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Уведомления</h1>
            <p className="mt-1 text-sm text-slate-600">Ответы и изменения по вашим обращениям</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={() => void readAll()} className="gap-2 self-start">
              <CheckCheck className="h-4 w-4" /> Отметить всё прочитанным
            </Button>
          )}
        </div>

        <div className="mb-4 flex rounded-xl bg-slate-100 p-1">
          <button type="button" onClick={() => setUnreadOnly(false)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${!unreadOnly ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>Все</button>
          <button type="button" onClick={() => setUnreadOnly(true)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${unreadOnly ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>Непрочитанные ({unreadCount})</button>
        </div>

        {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {items.map((item) => {
            const Icon = TYPE_ICONS[item.type] || Bell;
            return (
              <Link key={item.id} href={item.link || "/notifications"} onClick={(event) => { event.preventDefault(); void openItem(item); }} className={`flex gap-3 border-b border-slate-100 p-4 transition last:border-0 hover:bg-slate-50 sm:p-5 ${item.readAt ? "bg-white" : "bg-blue-50/50"}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><Icon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-blue-700">{TYPE_LABELS[item.type]}</p>
                      <h2 className="mt-0.5 font-semibold text-slate-900">{item.title}</h2>
                    </div>
                    {!item.readAt && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" aria-label="Не прочитано" />}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p>
                  <p className="mt-2 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString("ru-RU")}</p>
                </div>
              </Link>
            );
          })}
          {!loading && items.length === 0 && <div className="px-4 py-14 text-center"><Bell className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-medium text-slate-700">Уведомлений пока нет</p><p className="mt-1 text-sm text-slate-500">Здесь появятся ответы поддержки и изменения ваших заявок.</p></div>}
          {loading && items.length === 0 && <p className="px-4 py-12 text-center text-sm text-slate-500">Загрузка…</p>}
        </div>

        {hasMore && <div className="mt-5 text-center"><Button variant="outline" disabled={loading} onClick={() => void load(page + 1, true)}>{loading ? "Загрузка…" : "Показать ещё"}</Button></div>}
      </main>
    </Layout>
  );
}
