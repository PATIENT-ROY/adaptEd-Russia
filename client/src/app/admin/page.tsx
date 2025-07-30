"use client";

import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  MessageSquare,
  Bell,
  Settings,
  Shield,
  Activity,
  Edit,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Role } from "@/types";

// Моковые данные для админ-панели
const adminStats = [
  {
    title: "Всего пользователей",
    value: "1,247",
    change: "+12%",
    period: "за месяц",
    icon: Users,
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "Активных гайдов",
    value: "156",
    change: "+8%",
    period: "за месяц",
    icon: BookOpen,
    color: "from-green-500 to-green-600",
  },
  {
    title: "AI запросов",
    value: "3,421",
    change: "+23%",
    period: "за неделю",
    icon: MessageSquare,
    color: "from-purple-500 to-purple-600",
  },
  {
    title: "Обращений в поддержку",
    value: "23",
    change: "+15%",
    period: "за неделю",
    icon: Bell,
    color: "from-red-500 to-red-600",
  },
];

const recentUsers = [
  {
    id: "1",
    name: "Ахмед Аль-Махмуд",
    email: "ahmed@example.com",
    country: "Египет",
    status: "active",
    joinDate: "2024-01-15",
  },
  {
    id: "2",
    name: "Мария Гонсалес",
    email: "maria@example.com",
    country: "Испания",
    status: "active",
    joinDate: "2024-01-14",
  },
  {
    id: "3",
    name: "Чжан Вэй",
    email: "zhang@example.com",
    country: "Китай",
    status: "pending",
    joinDate: "2024-01-13",
  },
];

const recentGuides = [
  {
    id: "1",
    title: "Как сдать сессию в российском вузе",
    category: "education",
    views: 234,
    status: "published",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    title: "Регистрация в миграционной службе",
    category: "life",
    views: 189,
    status: "published",
    createdAt: "2024-01-14",
  },
  {
    id: "3",
    title: "Получение ИНН и СНИЛС",
    category: "life",
    views: 156,
    status: "draft",
    createdAt: "2024-01-13",
  },
];

const adminActions = [
  {
    title: "Управление пользователями",
    description: "Просмотр, редактирование и блокировка пользователей",
    icon: Users,
    href: "/admin/users",
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "Управление гайдами",
    description: "Создание, редактирование и публикация гайдов",
    icon: BookOpen,
    href: "/admin/guides",
    color: "from-green-500 to-green-600",
  },
  {
    title: "Обращения в поддержку",
    description: "Просмотр и ответы на обращения пользователей",
    icon: MessageSquare,
    href: "/admin/support",
    color: "from-red-500 to-red-600",
  },
  {
    title: "AI аналитика",
    description: "Статистика запросов и популярные вопросы",
    icon: MessageSquare,
    href: "/admin/ai-analytics",
    color: "from-purple-500 to-purple-600",
  },
  {
    title: "Системные настройки",
    description: "Настройки платформы и уведомлений",
    icon: Settings,
    href: "/admin/settings",
    color: "from-gray-500 to-gray-600",
  },
];

export default function AdminPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Проверяем, является ли пользователь админом
    if (user?.role === Role.ADMIN) {
      setIsAdmin(true);
    }
  }, [user]);

  if (!user) {
    return (
      <ProtectedRoute>
        <div>Loading...</div>
      </ProtectedRoute>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-96 border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Доступ запрещен
              </h2>
              <p className="text-slate-600 mb-6">
                У вас нет прав для доступа к админ-панели
              </p>
              <Link href="/dashboard">
                <Button>Вернуться на главную</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-red-50 p-3">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Админ-панель
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Управление платформой AdaptEd Russia
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Администратор:</span>
              <span className="font-medium text-gray-900">{user.name}</span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {adminStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      <p className="text-xs text-green-600">
                        {stat.change} {stat.period}
                      </p>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Admin Actions */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
            Быстрые действия
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {adminActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} href={action.href}>
                  <Card
                    className="group hover:scale-105 transition-all duration-300 animate-fade-in-up cursor-pointer"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Последние пользователи</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {user.status === "active" ? "Активен" : "Ожидает"}
                      </span>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full">
                    Просмотреть всех пользователей
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Guides */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Последние гайды</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentGuides.map((guide) => (
                  <div
                    key={guide.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {guide.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            guide.category === "education"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {guide.category === "education"
                            ? "Образование"
                            : "Быт"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {guide.views} просмотров
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          guide.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {guide.status === "published"
                          ? "Опубликован"
                          : "Черновик"}
                      </span>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link href="/admin/guides">
                  <Button variant="outline" className="w-full">
                    Управление гайдами
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Статус системы</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Сервер</p>
                  <p className="text-sm text-gray-600">Работает</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">База данных</p>
                  <p className="text-sm text-gray-600">Подключена</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">AI сервис</p>
                  <p className="text-sm text-gray-600">Активен</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Уведомления</p>
                  <p className="text-sm text-gray-600">Работают</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
