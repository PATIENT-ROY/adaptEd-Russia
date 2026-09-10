"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type UserNotification,
} from "@/lib/notifications-api";

export function UserNotifications() {
  const router = useRouter();
  const [items, setItems] = useState<UserNotification[]>([]);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchNotifications(1, 5);
      setItems(data.items);
      setCount(data.unreadCount);
    } catch (error) {
      console.error("Failed to load user notifications:", error);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60_000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const openItem = async (item: UserNotification) => {
    const href = item.link || "/notifications";
    setOpen(false);
    if (item.readAt) {
      router.push(href);
      return;
    }
    try {
      setItems((current) => current.map((entry) =>
        entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry,
      ));
      setCount((current) => Math.max(0, current - 1));
      await markNotificationRead(item.id);
    } catch {
      void refresh();
    } finally {
      router.push(href);
    }
  };

  const readAll = async () => {
    try {
      await markAllNotificationsRead();
      setCount(0);
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
    } catch (error) {
      console.error("Failed to mark notifications read:", error);
    }
  };

  // Keep the header uncluttered when there is nothing requiring attention.
  // The bell appears as soon as the unread count reaches one.
  if (count < 1) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((value) => !value); void refresh(); }}
        className="relative flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 sm:h-8 sm:w-8 sm:rounded-xl"
        aria-label={`Непрочитанные уведомления: ${count}`}
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-blue-600 px-1 text-center text-[10px] font-bold leading-4 text-white ring-2 ring-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-3 right-3 top-16 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="font-semibold text-slate-900">Уведомления</p>
              <p className="text-xs text-slate-500">Новых: {count}</p>
            </div>
            {count > 0 && (
              <button type="button" onClick={() => void readAll()} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                <CheckCheck className="h-4 w-4" /> Все прочитаны
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">Новых сообщений пока нет</p>
            ) : items.map((item) => (
              <Link
                key={item.id}
                href={item.link || "/notifications"}
                onClick={(event) => { event.preventDefault(); void openItem(item); }}
                className={`block border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50 ${item.readAt ? "bg-white" : "bg-blue-50/60"}`}
              >
                <div className="flex gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.readAt ? "bg-slate-200" : "bg-blue-600"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-600">{item.message}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString("ru-RU")}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="block px-4 py-3 text-center text-sm font-semibold text-blue-600 hover:bg-slate-50">
            Показать все уведомления
          </Link>
        </div>
      )}
    </div>
  );
}
