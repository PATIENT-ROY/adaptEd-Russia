"use client";

import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  Sparkles,
  Bell,
  Shield,
  Activity,
  Award,
  Star,
  ScanLine,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminDashboard,
  type AdminDashboardData,
} from "@/lib/admin-api";
import { lookupCatalogGuide } from "@/lib/admin-guide-catalog";
import { TOTAL_GUIDES_COUNT } from "@/constants/content-stats";

const cardClass = "border-0 shadow-xl backdrop-blur-sm bg-white/90";

export function AdminContent() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === Role.ADMIN;
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAdminDashboard();
        if (!cancelled) setDashboard(data);
      } catch (error) {
        console.error("Failed to load admin dashboard:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const stats = dashboard?.stats;
  const adminStats = [
    {
      title: t("admin.dashboard.stats.users"),
      value: loading ? "…" : String(stats?.users?.value ?? 0),
      change: stats?.users?.change ?? "0%",
      period: t("admin.dashboard.stats.perMonth"),
      icon: Users,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: t("admin.dashboard.stats.guides"),
      value: String(TOTAL_GUIDES_COUNT),
      change: stats?.guides?.change ?? "0%",
      period: t("admin.dashboard.stats.updated"),
      icon: BookOpen,
      color: "from-green-500 to-green-600",
    },
    {
      title: t("admin.dashboard.stats.ai"),
      value: loading ? "…" : String(stats?.ai?.value ?? 0),
      change: stats?.ai?.change ?? "0%",
      period: t("admin.dashboard.stats.perWeek"),
      icon: Sparkles,
      color: "from-violet-500 to-indigo-600",
    },
    {
      title: t("admin.dashboard.stats.guideReads"),
      value: loading ? "…" : String(stats?.guideReads?.value ?? 0),
      change: stats?.guideReads?.change ?? "0%",
      period: t("admin.dashboard.stats.perWeek"),
      icon: BookOpen,
      color: "from-indigo-500 to-indigo-600",
    },
  ];

  const recentUsers = dashboard?.recentUsers ?? [];
  const recentGuides = useMemo(() => {
    const fromReads = (dashboard?.topReads ?? []).map((row) => {
      const type = row.guideType === "education" ? "education" : "life";
      const catalog = lookupCatalogGuide(type, row.guideId);
      return {
        id: `${type}:${row.guideId}`,
        title: catalog?.title ?? row.guideId,
        category: type,
        views: row.count,
        status: catalog && !catalog.isPublished ? "draft" : "published",
        createdAt: catalog?.updatedAt ?? "",
      };
    });
    if (fromReads.length > 0) return fromReads;
    return dashboard?.recentGuides ?? [];
  }, [dashboard]);
  const ops = dashboard?.ops;

  const opsItems = [
    {
      label: t("admin.dashboard.ops.openTickets"),
      value: loading ? "…" : String(ops?.openTickets ?? 0),
      href: "/admin/support",
      tone: (ops?.openTickets ?? 0) > 0 ? "amber" : "green",
    },
    {
      label: t("admin.dashboard.ops.pendingReviews"),
      value: loading ? "…" : String(ops?.pendingReviews ?? 0),
      href: "/admin/reviews",
      tone: (ops?.pendingReviews ?? 0) > 0 ? "amber" : "green",
    },
    {
      label: t("admin.dashboard.ops.guideReadsWeek"),
      value: loading ? "…" : String(ops?.guideReadsWeek ?? 0),
      href: "/admin/docscan/analytics",
      tone: "green",
    },
    {
      label: t("admin.dashboard.ops.aiMessagesWeek"),
      value: loading ? "…" : String(ops?.aiMessagesWeek ?? 0),
      href: "/admin/ai-analytics",
      tone: "green",
    },
  ];

  const adminActions = [
    { title: t("admin.dashboard.actions.users"), description: t("admin.dashboard.actions.usersDesc"), icon: Users, href: "/admin/users", color: "from-blue-500 to-blue-600" },
    { title: t("admin.dashboard.actions.guides"), description: t("admin.dashboard.actions.guidesDesc"), icon: BookOpen, href: "/admin/guides", color: "from-green-500 to-green-600" },
    { title: t("admin.dashboard.actions.support"), description: t("admin.dashboard.actions.supportDesc"), icon: Bell, href: "/admin/support", color: "from-red-500 to-red-600" },
    { title: t("admin.dashboard.actions.ai"), description: t("admin.dashboard.actions.aiDesc"), icon: Sparkles, href: "/admin/ai-analytics", color: "from-violet-500 to-indigo-600" },
    { title: t("admin.dashboard.actions.docscan"), description: t("admin.dashboard.actions.docscanDesc"), icon: ScanLine, href: "/admin/docscan/analytics", color: "from-indigo-500 to-indigo-600" },
    { title: t("admin.dashboard.actions.community"), description: t("admin.dashboard.actions.communityDesc"), icon: Users, href: "/community/questions", color: "from-pink-500 to-rose-600" },
    { title: t("admin.dashboard.actions.reviews"), description: t("admin.dashboard.actions.reviewsDesc"), icon: Star, href: "/admin/reviews", color: "from-yellow-500 to-orange-500" },
    { title: t("admin.dashboard.actions.achievements"), description: t("admin.dashboard.actions.achievementsDesc"), icon: Award, href: "/admin/achievements", color: "from-amber-500 to-orange-500" },
  ];

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className={`w-96 ${cardClass}`}>
            <CardContent className="p-8 text-center">
              <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{t("admin.accessDenied.title")}</h2>
              <p className="text-slate-600 mb-6">{t("admin.accessDenied.description")}</p>
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
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-red-50 p-3">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t("admin.dashboard.title")}</h1>
                <p className="text-sm sm:text-base text-gray-600">{t("admin.dashboard.subtitle")}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  {t("nav.home")}
                </Button>
              </Link>
              <Link href="/achievements">
                <Button variant="outline" size="sm">
                  {t("nav.achievements")}
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  {t("nav.profile")}
                </Button>
              </Link>
              <span className="text-sm text-gray-500 ml-1">{t("admin.dashboard.adminLabel")}</span>
              <span className="font-medium text-gray-900">{user?.name}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {adminStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className={cardClass}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-green-600">{stat.change} {stat.period}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t("admin.dashboard.quickActions")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {adminActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} href={action.href} className="h-full block">
                  <Card className={`${cardClass} cursor-pointer h-full`}>
                    <CardContent className="p-4 sm:p-6 h-full flex flex-col">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 flex-shrink-0`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 flex-shrink-0">{action.title}</h3>
                      <p className="text-sm text-gray-600 mt-auto">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

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
                {recentUsers.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">
                    {loading ? "…" : t("admin.dashboard.noUsers")}
                  </p>
                ) : (
                recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">{u.name.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-sm text-gray-600">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {u.status === "active" ? t("admin.dashboard.userActive") : t("admin.dashboard.userPending")}
                      </span>
                    </div>
                  </div>
                ))
                )}
              </div>
              <div className="mt-4">
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full">{t("admin.dashboard.viewAllUsers")}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>{t("admin.dashboard.recentGuidesTitle")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentGuides.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">
                    {loading ? "…" : t("admin.dashboard.noGuides")}
                  </p>
                ) : (
                recentGuides.map((guide) => (
                  <div key={guide.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{guide.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${guide.category === "education" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                          {guide.category === "education" ? t("admin.dashboard.categoryEducation") : t("admin.dashboard.categoryLife")}
                        </span>
                        <span className="text-xs text-gray-500">{guide.views} {t("admin.dashboard.viewsLabel")}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${guide.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {guide.status === "published" ? t("admin.dashboard.guidePublished") : t("admin.dashboard.guideDraft")}
                      </span>
                    </div>
                  </div>
                ))
                )}
              </div>
              <div className="mt-4">
                <Link href="/admin/guides">
                  <Button variant="outline" className="w-full">{t("admin.dashboard.manageGuides")}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>{t("admin.dashboard.opsTitle")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {opsItems.map((item) => (
                <Link key={item.label} href={item.href} className="block">
                  <div
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      item.tone === "amber" ? "bg-amber-50" : "bg-green-50"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        item.tone === "amber" ? "bg-amber-500" : "bg-green-500"
                      }`}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-600">{item.value}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
