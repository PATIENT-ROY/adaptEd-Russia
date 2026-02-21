"use client";

import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import {
  AchievementCategory,
  AchievementStatus,
  AchievementsOverview,
  UserLevel,
} from "@/types";
import {
  Trophy,
  Lock,
  Sparkles,
  BookOpen,
  Home,
  Zap,
  Award,
  ArrowLeft,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchAchievementsOverview } from "@/lib/api";

const CATEGORY_INFO = {
  [AchievementCategory.GETTING_STARTED]: {
    title: "Начало пути",
    icon: Sparkles,
    color: "from-blue-500 to-blue-600",
  },
  [AchievementCategory.EDUCATION]: {
    title: "Учёба",
    icon: BookOpen,
    color: "from-purple-500 to-purple-600",
  },
  [AchievementCategory.LIFE]: {
    title: "Быт",
    icon: Home,
    color: "from-green-500 to-green-600",
  },
  [AchievementCategory.ACTIVITY]: {
    title: "Активность",
    icon: Zap,
    color: "from-orange-500 to-orange-600",
  },
  [AchievementCategory.EXPERT]: {
    title: "Эксперт",
    icon: Award,
    color: "from-red-500 to-red-600",
  },
};

const RARITY_CONFIG = {
  common: {
    color: "bg-gray-100 text-gray-700 border-gray-300",
    label: "Обычное",
  },
  rare: { color: "bg-blue-100 text-blue-700 border-blue-300", label: "Редкое" },
  epic: {
    color: "bg-purple-100 text-purple-700 border-purple-300",
    label: "Эпическое",
  },
  legendary: {
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    label: "Легендарное",
  },
};

const FALLBACK_OVERVIEW: AchievementsOverview = {
  achievements: [
    {
      id: "ach-1",
      name: "Первый гайд",
      description: "Прочитайте свой первый гайд",
      category: AchievementCategory.GETTING_STARTED,
      icon: "📘",
      xpReward: 50,
      requirement: "read_1_guide",
      rarity: "common",
      unlocked: true,
      progress: 1,
      progressCurrent: 1,
      progressTarget: 1,
    },
    {
      id: "ach-2",
      name: "Первые 7 дней",
      description: "Заходите в приложение 7 дней подряд",
      category: AchievementCategory.GETTING_STARTED,
      icon: "🔥",
      xpReward: 80,
      requirement: "streak_7_days",
      rarity: "rare",
      unlocked: false,
      progress: 4 / 7,
      progressCurrent: 4,
      progressTarget: 7,
    },
    {
      id: "ach-3",
      name: "Сессия под контролем",
      description: "Прочитайте 5 учебных гайдов",
      category: AchievementCategory.EDUCATION,
      icon: "🎓",
      xpReward: 120,
      requirement: "read_5_guides",
      rarity: "rare",
      unlocked: true,
      progress: 1,
      progressCurrent: 5,
      progressTarget: 5,
    },
    {
      id: "ach-4",
      name: "Документы без стресса",
      description: "Завершите 3 гайда по документам",
      category: AchievementCategory.LIFE,
      icon: "📄",
      xpReward: 100,
      requirement: "finish_doc_guides",
      rarity: "common",
      unlocked: false,
      progress: 2 / 3,
      progressCurrent: 2,
      progressTarget: 3,
    },
    {
      id: "ach-5",
      name: "Чемпион активности",
      description: "Задайте 10 вопросов в AI",
      category: AchievementCategory.ACTIVITY,
      icon: "⚡️",
      xpReward: 140,
      requirement: "ask_ai_10",
      rarity: "epic",
      unlocked: false,
      progress: 3 / 10,
      progressCurrent: 3,
      progressTarget: 10,
    },
  ],
  unlockedCount: 2,
  totalCount: 5,
  totalXP: 170,
  metrics: {
    guidesRead: 4,
    aiQuestions: 2,
    remindersCreated: 3,
    remindersCompleted: 2,
    docScanCount: 1,
    streak: 4,
    daysSinceRegistration: 12,
    grantApplications: 0,
    level: UserLevel.NEWBIE,
    xp: 170,
  },
};

export default function AchievementsPage() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<AchievementsOverview | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAchievements = useCallback(
    async (controller?: { cancelled: boolean }) => {
      if (!controller?.cancelled) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const data = await fetchAchievementsOverview();
        if (controller?.cancelled) return;
        setOverview(data);
      } catch (err) {
        if (controller?.cancelled) return;
        const message =
          err instanceof Error ? err.message : "Не удалось загрузить достижения";
        setError(message);
        setOverview(FALLBACK_OVERVIEW);
      } finally {
        if (!controller?.cancelled) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const controller = { cancelled: false };
    loadAchievements(controller);
    return () => {
      controller.cancelled = true;
    };
  }, [loadAchievements]);

  const achievements = useMemo(
    () => overview?.achievements ?? [],
    [overview?.achievements]
  );
  const totalCount = overview?.totalCount ?? achievements.length;
  const earnedCount =
    overview?.unlockedCount ??
    achievements.filter((achievement) => achievement.unlocked).length;
  const completionPercentage =
    totalCount === 0 ? 0 : Math.round((earnedCount / totalCount) * 100);

  const filteredAchievements = useMemo(() => {
    if (selectedCategory === "all") {
      return achievements;
    }

    return achievements.filter((achievement) => achievement.category === selectedCategory);
  }, [achievements, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<AchievementCategory, number> = {
      [AchievementCategory.GETTING_STARTED]: 0,
      [AchievementCategory.EDUCATION]: 0,
      [AchievementCategory.LIFE]: 0,
      [AchievementCategory.ACTIVITY]: 0,
      [AchievementCategory.EXPERT]: 0,
    };

    achievements.forEach((achievement) => {
      counts[achievement.category as AchievementCategory] =
        (counts[achievement.category as AchievementCategory] ?? 0) + 1;
    });

    return counts;
  }, [achievements]);

  const metrics = overview?.metrics;
  const metricItems = metrics
    ? [
        { label: "Гайды", value: metrics.guidesRead },
        { label: "Вопросы AI", value: metrics.aiQuestions },
        { label: "Создано напоминаний", value: metrics.remindersCreated },
        { label: "Завершено напоминаний", value: metrics.remindersCompleted },
        { label: "DocScan", value: metrics.docScanCount },
        { label: "Серия дней", value: metrics.streak },
      ]
    : [];

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="space-y-6 sm:space-y-8">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={`skeleton-achievement-${index}`} className="animate-pulse">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-5/6 mx-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Назад</span>
                </Button>
              </Link>
              <div className="rounded-lg bg-yellow-50 p-3 w-fit">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {t("achievements.header.title")}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  {t("achievements.header.subtitle")}
                </p>
              </div>
            </div>
          </div>

          {error && !overview && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="rounded-full bg-red-100 p-2">
                      <Lock className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-red-700">
                        Не удалось загрузить достижения
                      </h2>
                      <p className="text-sm text-red-600/80">{error}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => loadAchievements()}>
                    Повторить попытку
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {error && overview && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="rounded-full bg-yellow-100 p-2">
                      <Sparkles className="h-5 w-5 text-yellow-700" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-yellow-800">
                        Показаны демо-данные
                      </h2>
                      <p className="text-sm text-yellow-700/80">
                        API недоступен: {error}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => loadAchievements()}>
                    Повторить попытку
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Overview */}
          <Card className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-3xl sm:text-4xl shadow-lg">
                    🏆
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {earnedCount}/{totalCount}
                    </div>
                    <p className="text-sm sm:text-base text-gray-600">
                      Получено достижений
                    </p>
                  </div>
                </div>
                <div className="w-full sm:w-64">
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                    <span>Прогресс</span>
                    <span>{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
              {overview && (
                <div className="mt-4 text-sm text-gray-600">
                  Всего получено XP{" "}
                  <span className="font-semibold text-gray-900">
                    {overview.totalXP}
                  </span>
                </div>
              )}
              {metricItems.length > 0 && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {metricItems.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-white/80 border border-white/60 p-3 text-center shadow-sm"
                    >
                      <div className="text-lg sm:text-xl font-bold text-gray-900">
                        {item.value}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories Filter */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedCategory === "all"
                  ? "bg-gray-900 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              Все ({totalCount})
            </button>
            {Object.entries(CATEGORY_INFO).map(([key, info]) => {
              const count = categoryCounts[key as AchievementCategory] ?? 0;
              const Icon = info.icon;
              return (
                <button
                  key={key}
                  onClick={() =>
                    setSelectedCategory(key as AchievementCategory)
                  }
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    selectedCategory === key
                      ? `bg-gradient-to-r ${info.color} text-white shadow-lg`
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{info.title}</span>
                  <span className="opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredAchievements.map((achievement: AchievementStatus) => {
              const isEarned = achievement.unlocked;
              const rarityConfig = RARITY_CONFIG[achievement.rarity];
              const progressPercent = Math.round(achievement.progress * 100);
              const showProgress = !isEarned && achievement.progressTarget > 0;
              const displayCurrent = showProgress
                ? Math.min(
                    Math.round(achievement.progressCurrent),
                    achievement.progressTarget
                  )
                : 0;

              return (
                <Card
                  key={achievement.id}
                  className={`transition-all duration-300 ${
                    isEarned
                      ? "shadow-xl hover:shadow-2xl border-2 border-yellow-300"
                      : "opacity-60 hover:opacity-80 border-gray-200"
                  }`}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl ${
                          isEarned
                            ? "bg-gradient-to-br from-yellow-100 to-orange-100 shadow-lg"
                            : "bg-gray-100 grayscale"
                        }`}
                      >
                        {isEarned ? (
                          achievement.icon
                        ) : (
                          <Lock className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <h3
                        className={`font-bold text-base sm:text-lg ${
                          isEarned ? "text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {achievement.name}
                      </h3>
                      <p
                        className={`text-xs sm:text-sm ${
                          isEarned ? "text-gray-600" : "text-gray-400"
                        }`}
                      >
                        {achievement.description}
                      </p>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${rarityConfig.color}`}
                      >
                        {rarityConfig.label}
                      </span>
                      <div className="flex items-center space-x-1 text-sm font-bold text-yellow-600">
                        <Zap className="h-4 w-4" />
                        <span>+{achievement.xpReward} XP</span>
                      </div>
                      {isEarned ? (
                        <div className="w-full pt-2 border-t border-gray-200 relative">
                          <div className="absolute -top-1 -right-1 text-lg animate-bounce">🎉</div>
                          <div className="flex items-center justify-center space-x-1 text-xs text-green-600 font-medium">
                            <Trophy className="h-3 w-3" />
                            <span>Получено!</span>
                          </div>
                        </div>
                      ) : showProgress ? (
                        <div className="w-full pt-2 border-t border-gray-200">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Прогресс</span>
                            <span>
                              {displayCurrent}/{achievement.progressTarget}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
