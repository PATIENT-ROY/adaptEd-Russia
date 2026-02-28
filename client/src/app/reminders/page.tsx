"use client";

import { useState, useMemo, useCallback } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useReminders } from "@/hooks/useReminders";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Bell,
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Reminder,
  ReminderStatus,
  ReminderPriority,
  ReminderCategory,
  Language,
} from "@/types";

// ── helpers (pure, outside component) ───────────────────────────────

const getStatusIcon = (status: Reminder["status"]) => {
  switch (status) {
    case ReminderStatus.PENDING:
      return <Clock className="h-4 w-4 text-blue-500" />;
    case ReminderStatus.COMPLETED:
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case ReminderStatus.CANCELLED:
      return <XCircle className="h-4 w-4 text-gray-500" />;
    default:
      return <Clock className="h-4 w-4 text-blue-500" />;
  }
};

const getPriorityColor = (priority: Reminder["priority"]) => {
  switch (priority) {
    case ReminderPriority.HIGH:
      return "bg-red-100 text-red-700";
    case ReminderPriority.MEDIUM:
      return "bg-yellow-100 text-yellow-700";
    case ReminderPriority.LOW:
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getTypeColor = (category: Reminder["category"]) => {
  switch (category) {
    case ReminderCategory.EDUCATION:
      return "border-l-blue-500";
    case ReminderCategory.LIFE:
      return "border-l-green-500";
    case ReminderCategory.DOCUMENTS:
      return "border-l-red-500";
    case ReminderCategory.HEALTH:
      return "border-l-purple-500";
    default:
      return "border-l-gray-500";
  }
};

const getCategoryLabel = (
  category: ReminderCategory,
  t: (key: string) => string,
): string => {
  const map: Record<string, string> = {
    [ReminderCategory.EDUCATION]: t("reminders.category.education"),
    [ReminderCategory.LIFE]: t("reminders.category.life"),
    [ReminderCategory.DOCUMENTS]: t("reminders.category.documents"),
    [ReminderCategory.HEALTH]: t("reminders.category.health"),
    [ReminderCategory.OTHER]: t("reminders.category.other"),
  };
  return map[category] ?? t("reminders.category.other");
};

const getCategoryBadgeColor = (category: ReminderCategory): string => {
  const map: Record<string, string> = {
    [ReminderCategory.EDUCATION]: "bg-blue-100 text-blue-700",
    [ReminderCategory.LIFE]: "bg-green-100 text-green-700",
    [ReminderCategory.DOCUMENTS]: "bg-red-100 text-red-700",
    [ReminderCategory.HEALTH]: "bg-purple-100 text-purple-700",
  };
  return map[category] ?? "bg-gray-100 text-gray-700";
};

const getLocaleByLanguage = (language?: Language): string => {
  const map: Record<string, string> = {
    [Language.EN]: "en-US",
    [Language.FR]: "fr-FR",
    [Language.AR]: "ar",
    [Language.ZH]: "zh-CN",
    [Language.RU]: "ru-RU",
  };
  return (language && map[language]) || "ru-RU";
};

function parseCategoryEnum(raw: unknown): ReminderCategory {
  const str = String(raw ?? "").toUpperCase();
  const map: Record<string, ReminderCategory> = {
    EDUCATION: ReminderCategory.EDUCATION,
    LIFE: ReminderCategory.LIFE,
    DOCUMENTS: ReminderCategory.DOCUMENTS,
    HEALTH: ReminderCategory.HEALTH,
    OTHER: ReminderCategory.OTHER,
  };
  return map[str] ?? ReminderCategory.OTHER;
}

function formatDueDate(
  dueDate: unknown,
  locale: string,
  fallback: string,
): string {
  try {
    if (
      !dueDate ||
      dueDate === "null" ||
      dueDate === "undefined" ||
      dueDate === ""
    )
      return fallback;

    const raw = String(dueDate).trim();
    if (!raw || raw === "null" || raw === "undefined") return fallback;

    let date: Date;
    if (raw.includes("T")) {
      date = new Date(raw);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      date = new Date(`${raw}T00:00:00Z`);
    } else {
      date = new Date(raw);
    }

    if (isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return fallback;
  }
}

// ── Calendar sub-component ──────────────────────────────────────────

const CalendarView = ({ reminders }: { reminders: Reminder[] }) => {
  const { t, currentLanguage } = useTranslation();
  const locale = getLocaleByLanguage(currentLanguage);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const remindersByDate = useMemo(() => {
    const map = new Map<string, Reminder[]>();
    reminders.forEach((reminder) => {
      if (!reminder.dueDate) return;
      try {
        const date = new Date(reminder.dueDate as string);
        if (isNaN(date.getTime())) return;
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push(reminder);
      } catch {
        // skip bad dates
      }
    });
    return map;
  }, [reminders]);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + (direction === "prev" ? -1 : 1));
      return d;
    });
  };

  const weekDays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
    const base = new Date(2021, 7, 1);
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i)),
    );
  }, [locale]);

  const getRemindersForDate = (day: number): Reminder[] => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return remindersByDate.get(key) || [];
  };

  const isToday = (day: number) => {
    const now = new Date();
    return now.getDate() === day && now.getMonth() === month && now.getFullYear() === year;
  };

  const isSelected = (day: number) =>
    selectedDate
      ? selectedDate.getDate() === day &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year
      : false;

  const selectedDateReminders = selectedDate ? getRemindersForDate(selectedDate.getDate()) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth("prev")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={t("reminders.calendar.noRemindersOnDate")}
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(year, month, 1))}{" "}
          {year}
        </h3>
        <button
          onClick={() => navigateMonth("next")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const dayReminders = getRemindersForDate(day);
          const hasReminders = dayReminders.length > 0;
          const today = isToday(day);
          const selected = isSelected(day);

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(new Date(year, month, day))}
              className={`aspect-square p-1 rounded-lg transition-all ${
                selected
                  ? "bg-purple-600 text-white"
                  : today && hasReminders
                    ? "border-2 border-purple-400 bg-purple-50 text-purple-900 font-semibold"
                    : today
                      ? "border border-gray-300 bg-gray-50 text-gray-700"
                      : hasReminders
                        ? "bg-blue-50 hover:bg-blue-100 text-gray-900"
                        : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <div className="text-xs font-medium">{day}</div>
              {hasReminders && (
                <div className="flex justify-center gap-0.5 mt-0.5">
                  {dayReminders.slice(0, 3).map((r, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        selected
                          ? "bg-white"
                          : r.priority === ReminderPriority.HIGH
                            ? "bg-red-500"
                            : r.priority === ReminderPriority.MEDIUM
                              ? "bg-yellow-500"
                              : "bg-green-500"
                      }`}
                    />
                  ))}
                  {dayReminders.length > 3 && <div className="text-[6px] font-bold">+</div>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && selectedDateReminders.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            {t("reminders.calendar.remindersOn").replace(
              "{date}",
              selectedDate.toLocaleDateString(locale, {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            )}
          </h4>
          <div className="space-y-2">
            {selectedDateReminders.map((reminder) => (
              <div key={reminder.id} className="p-2 bg-gray-50 rounded-lg text-sm">
                <div className="font-medium text-gray-900">{reminder.title}</div>
                {reminder.description && (
                  <div className="text-xs text-gray-500 mt-1">{reminder.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDate && selectedDateReminders.length === 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500 text-center">
          {t("reminders.calendar.noRemindersOnDate").replace(
            "{date}",
            selectedDate.toLocaleDateString(locale, {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
          )}
        </div>
      )}
    </div>
  );
};

// ── Notification icon helper ────────────────────────────────────────

const NotificationBadge = ({
  method,
  t,
}: {
  method: string | undefined;
  t: (key: string) => string;
}) => {
  if (method === "telegram") {
    return (
      <span className="flex items-center space-x-1">
        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
          </svg>
        </div>
        <span>{t("reminders.notification.telegram")}</span>
      </span>
    );
  }
  if (method === "vk") {
    return (
      <span className="flex items-center space-x-1">
        <div className="w-4 h-4 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[8px] font-bold leading-none">VK</span>
        </div>
        <span>{t("reminders.notification.vkShort")}</span>
      </span>
    );
  }
  return (
    <span className="flex items-center space-x-1">
      <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <span>{t("reminders.notification.email")}</span>
    </span>
  );
};

// ── Loading skeleton ────────────────────────────────────────────────

const RemindersSkeleton = () => (
  <Layout>
    <div className="space-y-8">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
            <div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div>
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl sm:rounded-3xl p-4 shadow-sm border-l-4 border-l-blue-500">
              <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </Layout>
);

// ── Main page component ─────────────────────────────────────────────

function RemindersContent() {
  const { user } = useAuth();
  const { reminders, loading, createReminder, updateReminder, deleteReminder } =
    useReminders(user?.id || "");
  const { t, currentLanguage } = useTranslation();
  const locale = getLocaleByLanguage(currentLanguage);

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    date: "",
    category: ReminderCategory.OTHER,
    priority: ReminderPriority.MEDIUM,
    notificationMethod: "email" as "email" | "telegram" | "vk",
  });

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 3000);
  }, []);

  const filteredReminders = useMemo(() => {
    if (!searchTerm) return reminders;
    const q = searchTerm.toLowerCase();
    return reminders.filter(
      (r) =>
        r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q),
    );
  }, [reminders, searchTerm]);

  const pendingReminders = useMemo(
    () =>
      filteredReminders.filter((r) => {
        const s = String(r.status ?? "").toUpperCase();
        return s === "PENDING" || s === ReminderStatus.PENDING;
      }),
    [filteredReminders],
  );

  const completedReminders = useMemo(
    () =>
      filteredReminders.filter((r) => {
        const s = String(r.status ?? "").toUpperCase();
        return s === "COMPLETED" || s === ReminderStatus.COMPLETED;
      }),
    [filteredReminders],
  );

  const handleFieldChange = useCallback(
    (field: string, value: string) => {
      setNewReminder((prev) => ({ ...prev, [field]: value }));
      if (fieldErrors[field]) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [fieldErrors],
  );

  const handleAddReminder = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      const errors: Record<string, string> = {};
      if (!newReminder.title.trim()) errors.title = t("reminders.validation.requiredFields");
      if (!newReminder.date) errors.date = t("reminders.validation.chooseDate");
      if (!Object.values(ReminderCategory).includes(newReminder.category))
        errors.category = t("reminders.validation.invalidCategory");

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        showToast(t("reminders.validation.requiredFields"), "error");
        return;
      }

      setIsSubmitting(true);
      try {
        const dateWithTime = `${newReminder.date}T00:00:00.000Z`;

        await createReminder({
          title: newReminder.title,
          description: newReminder.description || undefined,
          dueDate: dateWithTime,
          category: newReminder.category,
          priority: newReminder.priority,
          status: ReminderStatus.PENDING,
          notificationMethod: newReminder.notificationMethod || "email",
        });

        setNewReminder({
          title: "",
          description: "",
          date: "",
          category: ReminderCategory.OTHER,
          priority: ReminderPriority.MEDIUM,
          notificationMethod: "email",
        });
        setFieldErrors({});
        setShowAddForm(false);
        showToast(t("reminders.toast.created"));
      } catch (error) {
        console.error("Error creating reminder:", error);
        showToast(t("reminders.validation.createError"), "error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [newReminder, isSubmitting, createReminder, showToast, t],
  );

  const handleMarkCompleted = useCallback(
    async (reminderId: string) => {
      try {
        await updateReminder(reminderId, { status: ReminderStatus.COMPLETED });
        showToast(t("reminders.toast.completed"));
      } catch (error) {
        console.error("Error updating reminder:", error);
        showToast(t("reminders.toast.error"), "error");
      }
    },
    [updateReminder, showToast, t],
  );

  const handleDeleteReminder = useCallback(
    async (reminderId: string) => {
      if (deletingId !== reminderId) {
        setDeletingId(reminderId);
        setTimeout(() => setDeletingId(null), 3000);
        return;
      }
      try {
        await deleteReminder(reminderId);
        setDeletingId(null);
        showToast(t("reminders.toast.deleted"));
      } catch (error) {
        console.error("Error deleting reminder:", error);
        showToast(t("reminders.toast.error"), "error");
      }
    },
    [deletingId, deleteReminder, showToast, t],
  );

  if (loading) return <RemindersSkeleton />;

  return (
    <Layout>
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm transition-all ${
            toastType === "error" ? "bg-red-500" : "bg-green-500"
          }`}
          role="alert"
        >
          {toastMessage}
        </div>
      )}

      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-purple-50 p-3">
                <Bell className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {t("reminders.header.title")}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  {t("reminders.header.subtitle")}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>{t("reminders.actions.add")}</span>
            </Button>
          </div>
        </div>

        {/* Add Reminder Form */}
        {showAddForm && (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("reminders.form.title")}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setFieldErrors({});
                  }}
                  aria-label={t("reminders.actions.close")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleAddReminder} className="space-y-4">
                <fieldset disabled={isSubmitting} className="space-y-4">
                  <div>
                    <label
                      htmlFor="reminder-title"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {t("reminders.form.fields.title")}
                    </label>
                    <Input
                      id="reminder-title"
                      type="text"
                      value={newReminder.title}
                      onChange={(e) => handleFieldChange("title", e.target.value)}
                      placeholder={t("reminders.form.placeholders.title")}
                      className={fieldErrors.title ? "border-red-500" : ""}
                    />
                    {fieldErrors.title && (
                      <p className="text-xs text-red-500 mt-1" role="alert">
                        {fieldErrors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="reminder-description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {t("reminders.form.fields.description")}
                    </label>
                    <textarea
                      id="reminder-description"
                      value={newReminder.description}
                      onChange={(e) => handleFieldChange("description", e.target.value)}
                      placeholder={t("reminders.form.placeholders.description")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label
                        htmlFor="reminder-date"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {t("reminders.form.fields.date")}
                      </label>
                      <Input
                        id="reminder-date"
                        type="date"
                        value={newReminder.date}
                        onChange={(e) => handleFieldChange("date", e.target.value)}
                        className={fieldErrors.date ? "border-red-500" : ""}
                      />
                      {fieldErrors.date && (
                        <p className="text-xs text-red-500 mt-1" role="alert">
                          {fieldErrors.date}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="reminder-category"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {t("reminders.form.fields.category")}
                      </label>
                      <div className="relative">
                        <select
                          id="reminder-category"
                          value={newReminder.category}
                          onChange={(e) => handleFieldChange("category", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                        >
                          <option value={ReminderCategory.EDUCATION}>
                            {t("reminders.category.education")}
                          </option>
                          <option value={ReminderCategory.LIFE}>
                            {t("reminders.category.life")}
                          </option>
                          <option value={ReminderCategory.DOCUMENTS}>
                            {t("reminders.category.documents")}
                          </option>
                          <option value={ReminderCategory.HEALTH}>
                            {t("reminders.category.health")}
                          </option>
                          <option value={ReminderCategory.OTHER}>
                            {t("reminders.category.other")}
                          </option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="reminder-priority"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {t("reminders.form.fields.priority")}
                      </label>
                      <div className="relative">
                        <select
                          id="reminder-priority"
                          value={newReminder.priority}
                          onChange={(e) => handleFieldChange("priority", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                        >
                          <option value={ReminderPriority.LOW}>{t("reminders.priority.low")}</option>
                          <option value={ReminderPriority.MEDIUM}>{t("reminders.priority.medium")}</option>
                          <option value={ReminderPriority.HIGH}>{t("reminders.priority.high")}</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("reminders.form.fields.notificationMethod")}
                    </label>
                    <div className="space-y-2">
                      {(["email", "telegram", "vk"] as const).map((method) => (
                        <label key={method} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="notificationMethod"
                            value={method}
                            checked={newReminder.notificationMethod === method}
                            onChange={(e) => handleFieldChange("notificationMethod", e.target.value)}
                            className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                          />
                          <NotificationBadge method={method} t={t} />
                        </label>
                      ))}
                    </div>
                  </div>
                </fieldset>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setFieldErrors({});
                    }}
                    className="w-full sm:w-auto"
                  >
                    {t("reminders.actions.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center space-x-2 w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSubmitting ? "..." : t("reminders.actions.save")}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={t("reminders.search.placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              aria-label={t("reminders.search.placeholder")}
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-red-50 p-3">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{t("reminders.stats.urgent")}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {reminders.filter(
                      (r) => r.priority === ReminderPriority.HIGH && r.status === ReminderStatus.PENDING,
                    ).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-blue-50 p-3">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{t("reminders.stats.active")}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {pendingReminders.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-green-50 p-3">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{t("reminders.stats.completed")}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {completedReminders.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Reminders */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            {t("reminders.sections.active")}
            {pendingReminders.length > 0 && (
              <span className="ml-2 text-purple-600">({pendingReminders.length})</span>
            )}
          </h2>
          {pendingReminders.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("reminders.empty.active.title")}
                </h3>
                <p className="text-gray-600 mb-4">{t("reminders.empty.active.description")}</p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("reminders.actions.add")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {pendingReminders.map((reminder) => {
                const catEnum = parseCategoryEnum(reminder.category);
                return (
                  <Card key={reminder.id} className={getTypeColor(reminder.category)}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-start sm:items-center space-x-3">
                          {getStatusIcon(reminder.status as Reminder["status"])}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                              {reminder.title}
                            </h3>
                            {reminder.description && (
                              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                {reminder.description}
                              </p>
                            )}
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                              {formatDueDate(reminder.dueDate, locale, t("reminders.dateNotSpecified"))}
                            </p>
                            <div className="text-xs text-gray-400 mt-1 flex items-center space-x-2">
                              <span>{t("reminders.notification.label")}</span>
                              <NotificationBadge method={reminder.notificationMethod} t={t} />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(catEnum)}`}
                          >
                            {getCategoryLabel(catEnum, t)}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(reminder.priority as Reminder["priority"])}`}
                          >
                            {reminder.priority === ReminderPriority.HIGH
                              ? t("reminders.priorityLabels.urgent")
                              : reminder.priority === ReminderPriority.MEDIUM
                                ? t("reminders.priorityLabels.important")
                                : t("reminders.priorityLabels.normal")}
                          </span>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkCompleted(reminder.id)}
                              className="text-xs sm:text-sm"
                              aria-label={t("reminders.actions.complete")}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {t("reminders.actions.complete")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteReminder(reminder.id)}
                              className={
                                deletingId === reminder.id
                                  ? "border-red-300 text-red-600 hover:bg-red-50"
                                  : ""
                              }
                              aria-label={
                                deletingId === reminder.id
                                  ? t("reminders.actions.confirmDelete")
                                  : t("reminders.actions.delete")
                              }
                            >
                              <X className="h-3 w-3 sm:h-4 sm:w-4" />
                              {deletingId === reminder.id && (
                                <span className="ml-1 text-xs">{t("reminders.actions.confirmDelete")}</span>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Reminders */}
        {completedReminders.length > 0 && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              {t("reminders.sections.completed")}
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {completedReminders.map((reminder) => {
                const catEnum = parseCategoryEnum(reminder.category);
                return (
                  <Card key={reminder.id} className="opacity-75">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-start sm:items-center space-x-3">
                          {getStatusIcon(reminder.status as Reminder["status"])}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 line-through text-sm sm:text-base">
                              {reminder.title}
                            </h3>
                            {reminder.description && (
                              <p className="text-xs sm:text-sm text-gray-500 mt-1 line-through">
                                {reminder.description}
                              </p>
                            )}
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                              {formatDueDate(reminder.dueDate, locale, t("reminders.dateNotSpecified"))}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(catEnum)}`}>
                            {getCategoryLabel(catEnum, t)}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            {t("reminders.status.completed")}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteReminder(reminder.id)}
                            className={
                              deletingId === reminder.id
                                ? "border-red-300 text-red-600 hover:bg-red-50"
                                : ""
                            }
                            aria-label={
                              deletingId === reminder.id
                                ? t("reminders.actions.confirmDelete")
                                : t("reminders.actions.delete")
                            }
                          >
                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                            {deletingId === reminder.id && (
                              <span className="ml-1 text-xs">{t("reminders.actions.confirmDelete")}</span>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Calendar */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            {t("reminders.sections.calendar")}
          </h2>
          <Card>
            <CardContent className="p-4 sm:p-6">
              {pendingReminders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t("reminders.empty.calendar.title")}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {t("reminders.empty.calendar.description")}
                  </p>
                </div>
              ) : (
                <CalendarView reminders={pendingReminders} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default function RemindersPage() {
  return (
    <ProtectedRoute>
      <RemindersContent />
    </ProtectedRoute>
  );
}
