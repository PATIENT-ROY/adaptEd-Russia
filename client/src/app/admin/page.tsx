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
  Shield,
  Activity,
  Edit,
  Eye,
  ScanLine,
  Award,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

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

const cardClass = "border-0 shadow-xl backdrop-blur-sm bg-white/90";

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminContent />
    </ProtectedRoute>
  );
}

function AdminContent() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === Role.ADMIN;

  const adminStats = [
    {
      title: t("admin.dashboard.stats.users"),
      value: "12 480",
      change: "+4%",
      period: t("admin.dashboard.stats.perMonth"),
      icon: Users,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: t("admin.dashboard.stats.guides"),
      value: "512",
      change: "+12%",
      period: t("admin.dashboard.stats.updated"),
      icon: BookOpen,
      color: "from-green-500 to-green-600",
    },
    {
      title: t("admin.dashboard.stats.ai"),
      value: "8 642",
      change: "+19%",
      period: t("admin.dashboard.stats.perWeek"),
      icon: MessageSquare,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: t("admin.dashboard.stats.docscan"),
      value: "1 204",
      change: "+27%",
      period: t("admin.dashboard.stats.perWeek"),
      icon: ScanLine,
      color: "from-indigo-500 to-indigo-600",
    },
  ];

  const adminActions = [
    {
      title: t("admin.dashboard.actions.users"),
      description: t("admin.dashboard.actions.usersDesc"),
      icon: Users,
      href: "/admin/users",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: t("admin.dashboard.actions.guides"),
      description: t("admin.dashboard.actions.guidesDesc"),
      icon: BookOpen,
      href: "/admin/guides",
      color: "from-green-500 to-green-600",
    },
    {
      title: t("admin.dashboard.actions.support"),
      description: t("admin.dashboard.actions.supportDesc"),
      icon: Bell,
      href: "/admin/support",
      color: "from-red-500 to-red-600",
    },
    {
      title: t("admin.dashboard.actions.ai"),
      description: t("admin.dashboard.actions.aiDesc"),
      icon: Activity,
      href: "/admin/ai-analytics",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: t("admin.dashboard.actions.docscan"),
      description: t("admin.dashboard.actions.docscanDesc"),
      icon: ScanLine,
      href: "/admin/docscan/analytics",
      color: "from-indigo-500 to-indigo-600",
    },
    {
      title: t("admin.dashboard.actions.community"),
      description: t("admin.dashboard.actions.communityDesc"),
      icon: Users,
      href: "/community/questions",
      color: "from-pink-500 to-rose-600",
    },
    {
      title: t("admin.dashboard.actions.reviews"),
      description: t("admin.dashboard.actions.reviewsDesc"),
      icon: Star,
      href: "/admin/reviews",
      color: "from-yellow-500 to-orange-500",
    },
    {
      title: t("admin.dashboard.actions.achievements"),
      description: t("admin.dashboard.actions.achievementsDesc"),
      icon: Award,
      href: "/admin/achievements",
      color: "from-amber-500 to-orange-500",
    },
  ];

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className={`w-96 ${cardClass}`}>
            <CardContent className="p-8 text-center">
              <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {t("admin.accessDenied.title")}
              </h2>
              <p className="text-slate-600 mb-6">
                {t("admin.accessDenied.description")}
              </p>
              <Link href="/dashboard">
                <Button>{t("admin.accessDenied.action")}</Button>
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
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-red-50 p-3">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {t("admin.dashboard.title")}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  {t("admin.dashboard.subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {t("admin.dashboard.adminLabel")}
              </span>
              <span className="font-medium text-gray-900">{user?.name}</span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {adminStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className={cardClass}>
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
            {t("admin.dashboard.quickActions")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {adminActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="h-full block"
                >
                  <Card
                    className={`${cardClass} cursor-pointer h-full`}
                  >
                    <CardContent className="p-4 sm:p-6 h-full flex flex-col">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 flex-shrink-0`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 flex-shrink-0">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-auto">
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
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>{t("admin.dashboard.recentUsersTitle")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-sm text-gray-600">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {u.status === "active"
                          ? t("admin.dashboard.userActive")
                          : t("admin.dashboard.userPending")}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={t("admin.common.view")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full">
                    {t("admin.dashboard.viewAllUsers")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Guides */}
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>{t("admin.dashboard.recentGuidesTitle")}</span>
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
                            ? t("admin.dashboard.categoryEducation")
                            : t("admin.dashboard.categoryLife")}
                        </span>
                        <span className="text-xs text-gray-500">
                          {guide.views} {t("admin.dashboard.viewsLabel")}
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
                          ? t("admin.dashboard.guidePublished")
                          : t("admin.dashboard.guideDraft")}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={t("admin.common.edit")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link href="/admin/guides">
                  <Button variant="outline" className="w-full">
                    {t("admin.dashboard.manageGuides")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>{t("admin.dashboard.systemStatusTitle")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">
                    {t("admin.dashboard.statusServer")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("admin.dashboard.statusOperational")}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">
                    {t("admin.dashboard.statusDatabase")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("admin.dashboard.statusOperational")}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">
                    {t("admin.dashboard.statusAI")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("admin.dashboard.statusOperational")}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">
                    {t("admin.dashboard.statusNotifications")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("admin.dashboard.statusOperational")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
