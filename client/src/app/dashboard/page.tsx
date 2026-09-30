"use client";

import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FeaturePreviewGate } from "@/components/auth/FeaturePreviewGate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  CalendarClock,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Calendar,
  Target,
  ScanLine,
  Users,
  Home,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useReminders } from "@/hooks/useReminders";
import { useTranslation } from "@/hooks/useTranslation";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { UserProgress, DailyQuest } from "@/types";
import { Language, ReminderPriority, ReminderStatus, UserLevel } from "@/types";
import { UserProgressComponent } from "@/components/ui/user-progress";
import { DailyQuestsComponent } from "@/components/ui/daily-quests";
import { AdaptationProgress } from "@/components/ui/adaptation-progress";
import { fetchAchievementsOverview, fetchDashboardOverview } from "@/lib/api";
import { lifeGuidePath } from "@/lib/guide-routes";
import {
  daysUntilYmd,
  getUpcomingHoliday,
  RUSSIAN_HOLIDAYS_GUIDE_ID,
  type UpcomingHoliday,
} from "@/data/russian-holidays";
import { formatCountedLabel } from "@/lib/pluralize";

const dashboardCardClass = "border-0 shadow-xl";
const dashboardCardStyle = {
  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)",
  backdropFilter: "blur(10px)",
};

const DASHBOARD_VISIT_PREFIX = "adapted.dashboard.visited:";
const firstVisitThisLoad = new Map<string, boolean>();

function isFirstDashboardVisit(userId: string): boolean {
  const cached = firstVisitThisLoad.get(userId);
  if (cached !== undefined) return cached;
  const storageKey = `${DASHBOARD_VISIT_PREFIX}${userId}`;
  const first = localStorage.getItem(storageKey) !== "1";
  if (first) localStorage.setItem(storageKey, "1");
  firstVisitThisLoad.set(userId, first);
  return first;
}

function greetingKeyForLocalHour(hour: number, firstVisit: boolean): string {
  if (firstVisit) return "dashboard.welcome";
  if (hour >= 5 && hour < 12) return "dashboard.welcome.morning";
  if (hour >= 12 && hour < 17) return "dashboard.welcome.afternoon";
  return "dashboard.welcome.evening";
}

const getLevelForXP = (xp: number): UserProgress["level"] => {
  if (xp >= 1001) return UserLevel.LOCAL;
  if (xp >= 601) return UserLevel.EXPERT;
  if (xp >= 301) return UserLevel.EXPERIENCED;
  if (xp >= 101) return UserLevel.ADAPTING;
  return UserLevel.NEWBIE;
};

function formatHolidayRange(start: string, end: string, locale: string): string {
  const withYear: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  const sameYear: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);
  if (start === end) {
    return startDate.toLocaleDateString(locale, sameYear);
  }
  const needsYear = start.slice(0, 4) !== end.slice(0, 4);
  return `${startDate.toLocaleDateString(locale, needsYear ? withYear : sameYear)} – ${endDate.toLocaleDateString(locale, needsYear ? withYear : sameYear)}`;
}

type HolidayTone = {
  background: string;
  glow: string;
  stamp: string;
  kicker: string;
  pill: string;
  cta: string;
  focus: string;
};

const HOLIDAY_TONES: Record<string, HolidayTone> = {
  winter: {
    background:
      "radial-gradient(140px 90px at 100% 0%, rgba(129, 140, 248, 0.35), transparent 70%), linear-gradient(135deg, #eef2ff 0%, #ffffff 46%, #e0f2fe 100%)",
    glow: "bg-indigo-300/50",
    stamp: "from-indigo-500 to-blue-700",
    kicker: "text-indigo-700/80",
    pill: "bg-indigo-100 text-indigo-900",
    cta: "text-indigo-700",
    focus: "focus-visible:ring-indigo-500",
  },
  steel: {
    background:
      "radial-gradient(140px 90px at 100% 0%, rgba(148, 163, 184, 0.45), transparent 70%), linear-gradient(135deg, #f8fafc 0%, #ffffff 46%, #e2e8f0 100%)",
    glow: "bg-slate-300/60",
    stamp: "from-slate-600 to-slate-800",
    kicker: "text-slate-600",
    pill: "bg-slate-200 text-slate-800",
    cta: "text-slate-700",
    focus: "focus-visible:ring-slate-500",
  },
  rose: {
    background:
      "radial-gradient(140px 90px at 100% 0%, rgba(251, 113, 133, 0.35), transparent 70%), linear-gradient(135deg, #fff1f2 0%, #ffffff 46%, #ffe4e6 100%)",
    glow: "bg-rose-300/50",
    stamp: "from-rose-500 to-pink-600",
    kicker: "text-rose-700/80",
    pill: "bg-rose-100 text-rose-900",
    cta: "text-rose-700",
    focus: "focus-visible:ring-rose-500",
  },
  spring: {
    background:
      "radial-gradient(140px 90px at 100% 0%, rgba(52, 211, 153, 0.35), transparent 70%), linear-gradient(135deg, #ecfdf5 0%, #ffffff 46%, #d1fae5 100%)",
    glow: "bg-emerald-300/50",
    stamp: "from-emerald-500 to-teal-600",
    kicker: "text-emerald-800/80",
    pill: "bg-emerald-100 text-emerald-900",
    cta: "text-emerald-700",
    focus: "focus-visible:ring-emerald-500",
  },
  crimson: {
    background:
      "radial-gradient(140px 90px at 100% 0%, rgba(248, 113, 113, 0.32), transparent 70%), linear-gradient(135deg, #fef2f2 0%, #ffffff 46%, #fee2e2 100%)",
    glow: "bg-red-300/45",
    stamp: "from-red-600 to-rose-800",
    kicker: "text-red-800/75",
    pill: "bg-red-100 text-red-900",
    cta: "text-red-700",
    focus: "focus-visible:ring-red-500",
  },
  azure: {
    background:
      "radial-gradient(140px 90px at 100% 0%, rgba(56, 189, 248, 0.35), transparent 70%), linear-gradient(135deg, #f0f9ff 0%, #ffffff 46%, #e0f2fe 100%)",
    glow: "bg-sky-300/50",
    stamp: "from-sky-500 to-blue-700",
    kicker: "text-sky-800/80",
    pill: "bg-sky-100 text-sky-900",
    cta: "text-sky-700",
    focus: "focus-visible:ring-sky-500",
  },
  autumn: {
    background:
      "radial-gradient(140px 90px at 100% 0%, rgba(251, 146, 60, 0.38), transparent 70%), linear-gradient(135deg, #fff7ed 0%, #ffffff 46%, #ffedd5 100%)",
    glow: "bg-orange-300/50",
    stamp: "from-orange-500 to-rose-600",
    kicker: "text-orange-800/80",
    pill: "bg-orange-100 text-orange-950",
    cta: "text-orange-700",
    focus: "focus-visible:ring-orange-500",
  },
};

const WELCOME_TONE = {
  background:
    "radial-gradient(160px 100px at 100% 0%, rgba(99, 102, 241, 0.28), transparent 70%), linear-gradient(135deg, #eff6ff 0%, #ffffff 48%, #eef2ff 100%)",
  glow: "bg-indigo-300/40",
  stamp: "from-blue-500 to-indigo-600",
  pill: "bg-blue-100 text-blue-950",
  cta: "text-blue-700",
  focus: "focus-visible:ring-blue-500",
} as const;

function holidayTone(id: string): HolidayTone {
  if (id.startsWith("new-year")) return HOLIDAY_TONES.winter;
  if (id.startsWith("defender")) return HOLIDAY_TONES.steel;
  if (id.startsWith("women")) return HOLIDAY_TONES.rose;
  if (id.startsWith("labour")) return HOLIDAY_TONES.spring;
  if (id.startsWith("victory")) return HOLIDAY_TONES.crimson;
  if (id.startsWith("russia")) return HOLIDAY_TONES.azure;
  return HOLIDAY_TONES.autumn;
}

function holidayStamp(start: string, locale: string): { day: string; month: string } {
  const date = new Date(`${start}T12:00:00`);
  const month = date
    .toLocaleDateString(locale, { month: "short" })
    .replace(/\./g, "");
  return { day: String(date.getDate()), month };
}

function holidayWhenLabel(
  days: number,
  language: Language,
  translate: (key: string) => string,
): string | null {
  if (days <= 0) return null;
  if (days === 1) return translate("dashboard.holiday.tomorrow");
  const when = formatCountedLabel(days, language, translate, "dashboard.holiday.day");
  return translate("dashboard.holiday.in").replace("{when}", when);
}

function HolidayAnnounce({
  holiday,
  locale,
  language,
  translate,
}: {
  holiday: UpcomingHoliday;
  locale: string;
  language: Language;
  translate: (key: string) => string;
}) {
  const tone = holidayTone(holiday.id);
  const stamp = holidayStamp(holiday.restStart, locale);
  const kicker = translate(
    holiday.isCurrent ? "dashboard.holiday.now" : "dashboard.holiday.next",
  );
  const when = holiday.isCurrent
    ? null
    : holidayWhenLabel(daysUntilYmd(holiday.restStart), language, translate);
  const name = translate(holiday.nameKey);
  const range = formatHolidayRange(holiday.restStart, holiday.restEnd, locale);
  const guideHref = lifeGuidePath(RUSSIAN_HOLIDAYS_GUIDE_ID);
  const guideLabel = `${kicker}: ${name}. ${when ? `${when}. ` : ""}${translate("dashboard.holiday.closes")}`;
  const guideClass = `group shrink-0 items-center gap-1 rounded-lg text-sm font-semibold transition hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${tone.cta} ${tone.focus}`;

  return (
      <Card
        className="relative overflow-hidden border-0 shadow-xl no-hover hover:!shadow-xl"
        style={{ background: tone.background }}
      >
        <div
          className={`pointer-events-none absolute -end-8 -top-12 h-28 w-28 rounded-full blur-2xl ${tone.glow}`}
          aria-hidden
        />
        <CardContent className="relative p-4 sm:p-5">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div
              className={`flex h-[4.5rem] w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md ${tone.stamp}`}
            >
              <span className="text-[1.7rem] font-bold leading-none tabular-nums">
                {stamp.day}
              </span>
              <span className="mt-1 max-w-full truncate px-1 text-[11px] font-semibold uppercase tracking-wide text-white/90">
                {stamp.month}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className={`text-[11px] font-semibold uppercase tracking-wide sm:text-xs ${tone.kicker}`}>
                  {kicker}
                </p>
                {when && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone.pill}`}>
                    {when}
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-base font-semibold leading-snug text-slate-900 sm:text-lg">
                {name}
              </h2>
              <p className="mt-0.5 text-sm text-slate-600">
                {translate("dashboard.holiday.rest").replace("{range}", range)}
              </p>
            </div>
            <Link
              href={guideHref}
              aria-label={guideLabel}
              className={`hidden sm:inline-flex ${guideClass}`}
            >
              {translate("dashboard.holiday.cta")}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={guideHref}
              aria-label={guideLabel}
              className={`inline-flex sm:hidden ${guideClass}`}
            >
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/80 px-2.5 py-1 text-xs text-slate-700 ring-1 ring-black/5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden />
              <span className="font-semibold text-rose-700">
                {translate("dashboard.holiday.closedTag")}
              </span>
              {translate("dashboard.holiday.closed")}
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/80 px-2.5 py-1 text-xs text-slate-700 ring-1 ring-black/5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              <span className="font-semibold text-emerald-700">
                {translate("dashboard.holiday.openTag")}
              </span>
              {translate("dashboard.holiday.open")}
            </span>
          </div>
        </CardContent>
      </Card>
  );
}

function reminderPriorityClass(priority: ReminderPriority): string {
  if (priority === ReminderPriority.URGENT) {
    return "bg-red-200 text-red-800";
  }
  if (priority === ReminderPriority.HIGH) {
    return "bg-red-100 text-red-600";
  }
  if (priority === ReminderPriority.MEDIUM) {
    return "bg-yellow-100 text-yellow-600";
  }
  return "bg-green-100 text-green-600";
}

function DashboardPreviewFallback() {
  const { t } = useTranslation();
  return (
    <FeaturePreviewGate
      featureName={t("dashboard.preview.feature")}
      previewTitle={t("dashboard.preview.title")}
      previewText={t("dashboard.preview.text")}
    />
  );
}

function DashboardContent() {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const { reminders, loading } = useReminders(userId || "");
  const { t, currentLanguage } = useTranslation();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const firstName = user?.name?.split(" ")[0] || t("dashboard.welcome.defaultName");
  const [greetingReady, setGreetingReady] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [localHour, setLocalHour] = useState(12);

  useEffect(() => {
    if (!userId) return;
    setIsFirstVisit(isFirstDashboardVisit(userId));
    setLocalHour(new Date().getHours());
    setGreetingReady(true);
  }, [userId]);

  const welcomeMessage = useMemo(() => {
    const key = greetingReady
      ? greetingKeyForLocalHour(localHour, isFirstVisit)
      : "dashboard.welcome";
    return t(key).replace("{name}", firstName);
  }, [t, firstName, greetingReady, localHour, isFirstVisit]);
  
  const daysInRussia = useMemo(() => {
    if (!user?.registeredAt) return null;
    return Math.floor((Date.now() - new Date(user.registeredAt).getTime()) / (1000 * 60 * 60 * 24));
  }, [user?.registeredAt]);

  const upcomingHoliday = useMemo(() => getUpcomingHoliday(), []);

  const dateLocale = useMemo(() => {
    const localeByLanguage: Record<Language, string> = {
      [Language.RU]: "ru-RU",
      [Language.EN]: "en-US",
      [Language.FR]: "fr-FR",
      [Language.AR]: "ar",
      [Language.ZH]: "zh-CN",
      [Language.ES]: "es-ES",
    };
    return localeByLanguage[currentLanguage] ?? "ru-RU";
  }, [currentLanguage]);

  const quickActions = useMemo(() => [
    {
      title: t("dashboard.quickActions.education.title"),
      description: t("dashboard.quickActions.education.description"),
      icon: BookOpen,
      href: "/education-guide",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: t("dashboard.quickActions.life.title"),
      description: t("dashboard.quickActions.life.description"),
      icon: Home,
      href: "/life-guide",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      title: t("dashboard.quickActions.reminders.title"),
      description: t("dashboard.quickActions.reminders.description"),
      icon: CalendarClock,
      href: "/reminders",
      gradient: "from-purple-500 to-indigo-600",
    },
    {
      title: t("dashboard.quickActions.aiHelper.title"),
      description: t("dashboard.quickActions.aiHelper.description"),
      icon: Sparkles,
      href: "/ai-helper",
      gradient: "from-violet-500 to-indigo-600",
    },
    {
      title: t("dashboard.quickActions.docscan.title"),
      description: t("dashboard.quickActions.docscan.description"),
      icon: ScanLine,
      href: "/docscan",
      gradient: "from-indigo-500 to-indigo-600",
    },
    {
      title: t("dashboard.quickActions.community.title"),
      description: t("dashboard.quickActions.community.description"),
      icon: Users,
      href: "/community/questions",
      gradient: "from-pink-500 to-rose-600",
    },
  ], [t]);

  const upcomingReminders = useMemo(() => {
    const now = Date.now();
    return reminders
      .filter(
        (reminder) =>
          reminder.status === ReminderStatus.PENDING &&
          new Date(reminder.dueDate).getTime() >= now,
      )
      .sort(
        (a, b) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      )
      .slice(0, 3);
  }, [reminders]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    
    setIsInitialLoading(true);
    setDashboardError(null);

    try {
      const [data, achievements] = await Promise.all([
        fetchDashboardOverview(),
        fetchAchievementsOverview(),
      ]);
      setUserProgress({
        ...data.userProgress,
        xp: achievements.totalXP,
        level: getLevelForXP(achievements.totalXP),
      });
      setDailyQuests(data.dailyQuests);
    } catch (error) {
      console.error("Failed to load dashboard overview:", error);
      let message = error instanceof Error ? error.message : "Unknown error";
      
      if (error instanceof Error) {
        if (error.name === 'ConnectionError' || error.message.includes('Failed to fetch')) {
          message = error.message;
        }
      }
      
      setDashboardError(message);
      setUserProgress(null);
      setDailyQuests([]);
    } finally {
      setIsInitialLoading(false);
    }
  }, [user]);

  const fetchedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setUserProgress(null);
      setDailyQuests([]);
      setIsInitialLoading(false);
      return;
    }

    if (fetchedForUserRef.current === user.id) return;
    fetchedForUserRef.current = user.id;
    fetchDashboardData();
  }, [authLoading, user, fetchDashboardData]);

  if (authLoading || isInitialLoading || (userId && !greetingReady)) {
    return (
        <Layout>
          <div className="space-y-6 sm:space-y-8">
            {/* Header Skeleton */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg">
              <div className="flex flex-row items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gray-200 animate-pulse shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-6 sm:h-8 w-48 sm:w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 sm:h-5 w-full max-w-sm bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Progress & Quests Skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
              <div className="xl:col-span-2">
                <div className="bg-white rounded-2xl sm:rounded-3xl p-6">
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
                  <div className="space-y-4">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="bg-white rounded-2xl sm:rounded-3xl p-6">
                  <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-20 bg-gray-200 rounded animate-pulse"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Skeleton */}
            <div>
              <div className="h-6 sm:h-8 w-48 bg-gray-200 rounded animate-pulse mb-4 sm:mb-6"></div>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-4 lg:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gray-200 animate-pulse mx-auto mb-3 sm:mb-4"></div>
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reminders Skeleton */}
            <div>
              <div className="h-6 sm:h-8 w-56 bg-gray-200 rounded animate-pulse mb-4 sm:mb-6"></div>
              <div className="space-y-3 sm:space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Layout>
    );
  }

  return (
      <Layout>
        <div className="space-y-6 sm:space-y-8 animate-fade-in-up">
          {/* Welcome Header */}
          {(() => {
            const tone = WELCOME_TONE;
            const initial =
              user?.name.charAt(0).toUpperCase() || t("dashboard.welcome.initialFallback");
            return (
              <Card
                className="relative overflow-hidden border-0 shadow-xl no-hover hover:!shadow-xl"
                style={{ background: tone.background }}
              >
                <div
                  className={`pointer-events-none absolute -end-8 -top-12 h-28 w-28 rounded-full blur-2xl ${tone.glow}`}
                  aria-hidden
                />
                <CardContent className="relative p-4 sm:p-5">
                  <div className="flex items-center gap-3.5 sm:gap-4">
                    <Link
                      href="/profile"
                      className={`flex h-[4.5rem] w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${tone.stamp} ${tone.focus}`}
                      aria-label={t("dashboard.welcome.profileAria")}
                    >
                      {initial}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
                        {welcomeMessage}{" "}
                        <span
                          className="animate-wave inline-block text-2xl sm:text-3xl"
                          role="img"
                          aria-label={t("dashboard.welcome.waveAria")}
                        >
                          👋
                        </span>
                      </h1>
                      <p className="mt-0.5 text-sm text-slate-600 sm:text-base">
                        {t("dashboard.welcome.subtitle")}
                      </p>
                      {daysInRussia != null && (
                        <p className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone.pill}`}>
                          {t("dashboard.stats.daysInRussia")} · {daysInRussia}
                        </p>
                      )}
                    </div>
                    <Link
                      href="/profile"
                      className={`hidden shrink-0 items-center gap-1 rounded-lg text-sm font-semibold transition hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:inline-flex ${tone.cta} ${tone.focus}`}
                    >
                      {t("dashboard.welcome.profileAria")}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/profile"
                      className={`inline-flex shrink-0 rounded-lg transition hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:hidden ${tone.cta} ${tone.focus}`}
                      aria-label={t("dashboard.welcome.profileAria")}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {upcomingHoliday && (
            <HolidayAnnounce
              holiday={upcomingHoliday}
              locale={dateLocale}
              language={currentLanguage}
              translate={t}
            />
          )}

          {dashboardError && (
            <Card className="border-red-200 bg-red-50 shadow-none no-hover hover:!shadow-none" role="alert">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="rounded-full bg-red-100 p-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-red-700">
                        {t("dashboard.error.title")}
                      </h2>
                      <p className="text-sm text-red-600/80">
                        {dashboardError}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={fetchDashboardData}>
                    {t("dashboard.error.retry")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <AdaptationProgress reminders={reminders} />

          {/* User Progress & Daily Quests */}
          {userProgress ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
              <div className="xl:col-span-2">
                <UserProgressComponent progress={userProgress} />
              </div>
              <div>
                <DailyQuestsComponent quests={dailyQuests} />
              </div>
            </div>
          ) : (
            !dashboardError && (
              <Card className={`${dashboardCardClass} no-hover hover:!shadow-xl`} style={dashboardCardStyle}>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600">{t("dashboard.error.loading")}</p>
                </CardContent>
              </Card>
            )
          )}

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
              {t("dashboard.quickActions.title")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href} className="block h-full">
                    <Card
                      className={`${dashboardCardClass} transition-all duration-300 animate-fade-in-up cursor-pointer h-full hover:-translate-y-0.5`}
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        ...dashboardCardStyle,
                      }}
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start gap-3.5 sm:gap-4">
                          <div
                            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md shrink-0`}
                          >
                            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug line-clamp-2">
                              {action.title}
                            </h3>
                            <p className="mt-1 text-sm text-slate-600 leading-snug line-clamp-2">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Upcoming Reminders */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
              {t("dashboard.upcomingReminders.title")}
            </h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((index) => (
                  <Card
                    key={`skeleton-reminder-${index}`}
                    className="animate-pulse no-hover hover:!shadow-xl"
                    style={dashboardCardStyle}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 bg-gray-200 rounded-xl"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3.5 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : upcomingReminders.length > 0 ? (
              <div className="space-y-3">
                {upcomingReminders.map((reminder, index) => (
                  <Card
                    key={reminder.id}
                    className={`${dashboardCardClass} animate-fade-in-up no-hover hover:!shadow-xl`}
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      ...dashboardCardStyle,
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="flex min-w-0 items-center gap-3.5">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${reminderPriorityClass(reminder.priority)}`}
                          >
                            <AlertCircle className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 text-base leading-snug truncate">
                              {reminder.title}
                            </h3>
                            <p className="text-sm text-slate-600 mt-0.5">
                              {new Date(reminder.dueDate).toLocaleDateString(
                                dateLocale,
                              )}
                            </p>
                          </div>
                        </div>
                        <Link href="/reminders" className="w-full sm:w-auto sm:shrink-0">
                          <Button variant="outline" size="sm" className="min-h-11 w-full sm:w-auto">
                            {t("dashboard.upcomingReminders.details")}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className={`${dashboardCardClass} no-hover hover:!shadow-xl`} style={dashboardCardStyle}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 items-start gap-3.5">
                      <CalendarClock className="h-10 w-10 shrink-0 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-medium text-gray-900">
                          {t("dashboard.upcomingReminders.empty.title")}
                        </h3>
                        <p className="mt-0.5 text-sm leading-relaxed text-gray-600">
                          {t("dashboard.upcomingReminders.empty.description")}
                        </p>
                      </div>
                    </div>
                    <Link href="/reminders" className="w-full sm:w-auto sm:shrink-0">
                      <Button size="sm" className="min-h-11 w-full sm:w-auto">
                        {t("dashboard.upcomingReminders.empty.cta")}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Statistics */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
              {t("dashboard.stats.title")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <Card
                className={`${dashboardCardClass} animate-fade-in-up no-hover hover:!shadow-xl`}
                style={{ animationDelay: "0.1s", ...dashboardCardStyle }}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">
                        {t("dashboard.stats.guides")}
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900">
                        {userProgress?.totalGuidesRead ?? "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`${dashboardCardClass} animate-fade-in-up no-hover hover:!shadow-xl`}
                style={{ animationDelay: "0.2s", ...dashboardCardStyle }}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">
                        {t("dashboard.stats.daysInRussia")}
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900">
                        {daysInRussia ?? "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`${dashboardCardClass} animate-fade-in-up no-hover hover:!shadow-xl`}
                style={{ animationDelay: "0.3s", ...dashboardCardStyle }}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">
                        {t("dashboard.stats.activeTasks")}
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900">
                        {reminders.filter((r) => r.status === "PENDING").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`${dashboardCardClass} animate-fade-in-up no-hover hover:!shadow-xl`}
                style={{ animationDelay: "0.4s", ...dashboardCardStyle }}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">
                        {t("dashboard.stats.aiQuestions")}
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900">
                        {userProgress?.totalAIQuestions ?? "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute fallback={<DashboardPreviewFallback />}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
