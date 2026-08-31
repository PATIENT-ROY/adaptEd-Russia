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
  getUpcomingHoliday,
  RUSSIAN_HOLIDAYS_GUIDE_ID,
} from "@/data/russian-holidays";

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
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-row items-center gap-3 sm:gap-4">
                <Link
                  href="/profile"
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow cursor-pointer shrink-0"
                  aria-label={t("dashboard.welcome.profileAria")}
                >
                  <span className="text-white text-lg sm:text-2xl font-bold">
                    {user?.name.charAt(0).toUpperCase() || t("dashboard.welcome.initialFallback")}
                  </span>
                </Link>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-0.5 sm:mb-2 flex items-center gap-2 flex-wrap">
                    <span className="min-w-0">{welcomeMessage}</span>
                    <span
                      className="animate-wave text-2xl sm:text-3xl lg:text-4xl shrink-0"
                      role="img"
                      aria-label={t("dashboard.welcome.waveAria")}
                    >
                      👋
                    </span>
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg text-slate-600">
                    {t("dashboard.welcome.subtitle")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {upcomingHoliday && (
            <Link
              href={lifeGuidePath(RUSSIAN_HOLIDAYS_GUIDE_ID)}
              className="block"
            >
              <Card
                className={`${dashboardCardClass} hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5 cursor-pointer`}
                style={dashboardCardStyle}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-3.5 sm:gap-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-md shrink-0">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-slate-500">
                        {t(
                          upcomingHoliday.isCurrent
                            ? "dashboard.holiday.now"
                            : "dashboard.holiday.next",
                        )}
                      </p>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug mt-0.5">
                        {t(upcomingHoliday.nameKey)}
                      </h2>
                      <p className="text-sm text-slate-600 mt-1">
                        {t("dashboard.holiday.rest").replace(
                          "{range}",
                          formatHolidayRange(
                            upcomingHoliday.restStart,
                            upcomingHoliday.restEnd,
                            dateLocale,
                          ),
                        )}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        {t("dashboard.holiday.closes")}
                      </p>
                      <p className="text-sm font-medium text-blue-700 mt-2">
                        {t("dashboard.holiday.cta")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {dashboardError && (
            <Card className="border-red-200 bg-red-50 shadow-none" role="alert">
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
              <Card className={dashboardCardClass} style={dashboardCardStyle}>
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
                    className="animate-pulse"
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
                    className={`${dashboardCardClass} animate-fade-in-up`}
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      ...dashboardCardStyle,
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
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
                        <Link href="/reminders" className="shrink-0">
                          <Button variant="outline" size="sm">
                            {t("dashboard.upcomingReminders.details")}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className={dashboardCardClass} style={dashboardCardStyle}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <CalendarClock className="h-10 w-10 text-gray-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-medium text-gray-900">
                        {t("dashboard.upcomingReminders.empty.title")}
                      </h3>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {t("dashboard.upcomingReminders.empty.description")}
                      </p>
                    </div>
                    <Link href="/reminders" className="shrink-0">
                      <Button size="sm">
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
                className={`${dashboardCardClass} animate-fade-in-up`}
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
                className={`${dashboardCardClass} animate-fade-in-up`}
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
                className={`${dashboardCardClass} animate-fade-in-up`}
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
                className={`${dashboardCardClass} animate-fade-in-up`}
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
