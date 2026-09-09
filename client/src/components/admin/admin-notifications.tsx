"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, HeartHandshake, MessageSquare, Star, Users } from "lucide-react";
import { fetchAdminInboxSummary, type AdminInboxSummary } from "@/lib/admin-api";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

const EMPTY_SUMMARY: AdminInboxSummary = {
  openTickets: 0,
  pendingReviews: 0,
  newBuddyApplications: 0,
  unansweredQuestions: 0,
  total: 0,
};

export function AdminNotifications() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<AdminInboxSummary>(EMPTY_SUMMARY);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      setSummary(await fetchAdminInboxSummary());
    } catch (error) {
      console.error("Failed to load admin notifications:", error);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60_000);
    const onFocus = () => void refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const items = [
    {
      href: "/admin/buddy",
      label: t("admin.dashboard.ops.newBuddyApplications"),
      count: summary.newBuddyApplications,
      icon: HeartHandshake,
    },
    {
      href: "/admin/support",
      label: t("admin.dashboard.ops.openTickets"),
      count: summary.openTickets,
      icon: MessageSquare,
    },
    {
      href: "/admin/reviews",
      label: t("admin.dashboard.ops.pendingReviews"),
      count: summary.pendingReviews,
      icon: Star,
    },
    {
      href: "/community/questions",
      label: t("community.questions.filter.unanswered"),
      count: summary.unansweredQuestions,
      icon: Users,
    },
  ];

  const countLabel = summary.total > 99 ? "99+" : String(summary.total);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          void refresh();
        }}
        className={cn(
          "relative flex h-7 w-7 items-center justify-center rounded-lg border transition-colors sm:h-8 sm:w-8 sm:rounded-xl",
          summary.total > 0
            ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
        )}
        aria-label={`${t("nav.admin")}: ${summary.total}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Bell className="h-4 w-4" />
        {summary.total > 0 && (
          <span className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-4 text-white ring-2 ring-white">
            {countLabel}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="fixed inset-x-3 top-[3.75rem] z-[70] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:mt-2 sm:w-80"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="font-semibold text-slate-900">{t("nav.admin")}</span>
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">
              {summary.total}
            </span>
          </div>
          <div className="p-2">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 font-medium">{item.label}</span>
                  <span
                    className={cn(
                      "min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs font-bold",
                      item.count > 0 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {item.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
