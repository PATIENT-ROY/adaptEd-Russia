"use client";

import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Home,
  Bell,
  MessageSquare,
  AlertCircle,
  Calendar,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useReminders } from "@/hooks/useReminders";
import { useState, useEffect } from "react";
import type { Reminder } from "@/types";

const quickActions = [
  {
    title: "Моя учёба",
    description: "Гайды по образовательной системе",
    icon: BookOpen,
    href: "/education-guide",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    title: "Бытовые инструкции",
    description: "Регистрация, документы, транспорт",
    icon: Home,
    href: "/life-guide",
    gradient: "from-green-500 to-green-600",
  },
  {
    title: "Мои напоминания",
    description: "Управление задачами и сроками",
    icon: Bell,
    href: "/reminders",
    gradient: "from-purple-500 to-purple-600",
  },
  {
    title: "AI Помощник",
    description: "Задать вопрос консультанту",
    icon: MessageSquare,
    href: "/ai-helper",
    gradient: "from-orange-500 to-orange-600",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { reminders, loading } = useReminders(user?.id || "");
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);

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
                    А
                  </span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">
                    Добро пожаловать, {user?.name.split(" ")[0]}! 👋
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg text-slate-600">
                    Вот что происходит с вашей учёбой и бытом в России
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
              Быстрые действия
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={action.title} href={action.href}>
                    <Card
                      className="group hover:scale-105 transition-all duration-300 animate-fade-in-up cursor-pointer"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CardContent className="p-4 sm:p-6 text-center">
                        <div
                          className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">
                          {action.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600">
                          {action.description}
                        </p>
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
