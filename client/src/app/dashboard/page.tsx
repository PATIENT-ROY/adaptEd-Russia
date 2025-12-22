"use client";

import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Bell,
  MessageSquare,
  AlertCircle,
  Calendar,
  Target,
  ScanLine,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useReminders } from "@/hooks/useReminders";
import { useState, useEffect, useCallback } from "react";
import type { Reminder, UserProgress, DailyQuest } from "@/types";
import { UserProgressComponent } from "@/components/ui/user-progress";
import { DailyQuestsComponent } from "@/components/ui/daily-quests";
import { fetchDashboardOverview } from "@/lib/api";

const quickActions = [
  {
    title: "Образовательный навигатор",
    description: "Гайды по образовательной системе",
    icon: BookOpen,
    href: "/education-guide",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    title: "Умные напоминания",
    description: "Управление задачами и сроками",
    icon: Bell,
    href: "/reminders",
    gradient: "from-purple-500 to-purple-600",
  },
  {
    title: "AI Помощник",
    description: "Задавайте вопросы на родном языке",
    icon: MessageSquare,
    href: "/ai-helper",
    gradient: "from-orange-500 to-orange-600",
  },
  {
    title: "DocScan",
    description: "OCR из PDF и фото, перевод и экспорт",
    icon: ScanLine,
    href: "/docscan",
    gradient: "from-indigo-500 to-indigo-600",
  },
];

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { reminders, loading } = useReminders(user?.id || "");
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setUserProgress(null);
      setDailyQuests([]);
      setIsInitialLoading(false);
      return;
    }

    setIsInitialLoading(true);
    setDashboardError(null);

    try {
      const data = await fetchDashboardOverview();
      setUserProgress(data.userProgress);
      setDailyQuests(data.dailyQuests);
    } catch (error) {
      console.error("Failed to load dashboard overview:", error);
      let message = "Не удалось загрузить данные дашборда";
      
      if (error instanceof Error) {
        if (error.name === 'ConnectionError' || error.message.includes('Failed to fetch')) {
          message = "Сервер недоступен. Проверьте подключение.";
          if (process.env.NODE_ENV === 'development') {
            console.warn('Development mode: API server may not be running on port 3003');
          }
        } else {
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

  useEffect(() => {
    if (authLoading) return;
    fetchDashboardData();
  }, [authLoading, fetchDashboardData]);

  useEffect(() => {
    if (reminders.length > 0) {
      // Фильтруем только активные напоминания и сортируем по дате
      const activeReminders = reminders
        .filter((reminder) => reminder.status === "PENDING")
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        )
        .slice(0, 3); // Берем только первые 3

      setUpcomingReminders(activeReminders);
    }
  }, [reminders]);

  // Skeleton при загрузке
  if (authLoading || isInitialLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="space-y-6 sm:space-y-8">
            {/* Header Skeleton */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 sm:p-6 lg:p-8 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gray-200 animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-6 sm:h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 sm:h-5 w-96 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Progress & Quests Skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
              <div className="xl:col-span-2">
                <div className="bg-white rounded-lg p-6 shadow-sm">
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
                <div className="bg-white rounded-lg p-6 shadow-sm">
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
                    className="bg-white rounded-lg p-4 sm:p-6 shadow-sm"
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
                    className="bg-white rounded-lg p-4 sm:p-6 shadow-sm"
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
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6 sm:space-y-8 animate-fade-in-up">
          {/* Welcome Header */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg sm:text-2xl font-bold">
                    {user?.name.charAt(0).toUpperCase() || "А"}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 text-3xl sm:text-4xl animate-float">
                    ✨
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">
                    Добро пожаловать, {user?.name.split(" ")[0]}! <span className="animate-wave inline-block">👋</span>
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg text-slate-600">
                    Вот что происходит с вашей учёбой и бытом в России
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {dashboardError && (
            <Card className="border-red-200 bg-red-50 shadow-none">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="rounded-full bg-red-100 p-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-red-700">
                        Не удалось загрузить данные дашборда
                      </h2>
                      <p className="text-sm text-red-600/80">
                        {dashboardError}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={fetchDashboardData}>
                    Повторить попытку
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
            <Card>
              <CardContent className="p-6 text-center">
                {dashboardError ? (
                  <p className="text-red-600">
                    Попробуйте обновить страницу или повторить попытку позже.
                  </p>
                ) : (
                <p className="text-gray-600">Загрузка данных...</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
              Быстрые действия
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:gap-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={action.title} href={action.href}>
                    <Card
                      className="group hover:scale-105 transition-all duration-300 animate-fade-in-up cursor-pointer h-full"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CardContent className="p-2.5 sm:p-6 text-center h-full flex flex-col justify-between min-h-[160px] sm:min-h-0">
                        <div className="flex-grow flex flex-col">
                          <div
                            className={`w-9 h-9 sm:w-16 sm:h-16 rounded-lg sm:rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mx-auto mb-1.5 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
                          >
                            <Icon className="h-4 w-4 sm:h-8 sm:w-8 text-white" />
                          </div>
                          <h3 className="text-xs sm:text-base lg:text-lg font-semibold text-slate-900 mb-1 sm:mb-2 flex-shrink-0 leading-tight line-clamp-2">
                            {action.title}
                          </h3>
                          <p className="text-[11px] sm:text-sm text-slate-600 flex-grow overflow-hidden line-clamp-4 sm:line-clamp-none leading-snug">
                            {action.description}
                          </p>
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
              Ближайшие напоминания
            </h2>
            {loading ? (
              <div className="space-y-3 sm:space-y-4">
                {[1, 2, 3].map((index) => (
                  <Card key={index} className="animate-pulse">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-xl"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : upcomingReminders.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {upcomingReminders.map((reminder, index) => (
                  <Card
                    key={reminder.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                              reminder.priority === "HIGH"
                                ? "bg-red-100 text-red-600"
                                : reminder.priority === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-green-100 text-green-600"
                            }`}
                          >
                            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                              {reminder.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600">
                              {new Date(reminder.dueDate).toLocaleDateString(
                                "ru-RU"
                              )}
                            </p>
                          </div>
                        </div>
                        <Link href="/reminders">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            Подробнее
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <Bell className="h-12 w-12 text-gray-400" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        Нет активных напоминаний
                      </h3>
                      <p className="text-sm text-gray-600">
                        Создайте первое напоминание, чтобы не пропустить важные
                        дела
                      </p>
                    </div>
                    <Link href="/reminders">
                      <Button className="mt-2">Создать напоминание</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Statistics */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
              Ваша статистика
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card
                className="animate-fade-in-up"
                style={{ animationDelay: "0.1s" }}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-600">
                        Изучено гайдов
                      </p>
                      <p className="text-lg sm:text-xl font-bold text-slate-900">
                        12
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="animate-fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        Дней в России
                      </p>
                      <p className="text-2xl font-bold text-slate-900">45</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="animate-fade-in-up"
                style={{ animationDelay: "0.3s" }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        Активных задач
                      </p>
                      <p className="text-2xl font-bold text-slate-900">
                        {reminders.filter((r) => r.status === "PENDING").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="animate-fade-in-up"
                style={{ animationDelay: "0.4s" }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        Вопросов к AI
                      </p>
                      <p className="text-2xl font-bold text-slate-900">23</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
