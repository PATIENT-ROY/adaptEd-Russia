"use client";

import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import {
  ArrowLeft,
  Award,
  Sparkles,
  Star,
  Trophy,
  TrendingUp,
  Users,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";

const cardClass = "border-0 shadow-xl backdrop-blur-sm bg-white/90";

export default function AdminAchievementsPage() {
  return (
    <ProtectedRoute>
      <AchievementsContent />
    </ProtectedRoute>
  );
}

function AchievementsContent() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === Role.ADMIN;

  const kpis = [
    { label: t("admin.achievements.kpi.total"), value: "64", icon: Trophy },
    { label: t("admin.achievements.kpi.avgProgress"), value: "41%", icon: TrendingUp },
    { label: t("admin.achievements.kpi.activeUsers"), value: "3 248", icon: Users },
    { label: t("admin.achievements.kpi.newMonth"), value: "+8", icon: Sparkles },
  ];

  const categories = [
    { label: t("admin.achievements.categories.start"), value: "18", color: "bg-blue-100 text-blue-700" },
    { label: t("admin.achievements.categories.study"), value: "16", color: "bg-purple-100 text-purple-700" },
    { label: t("admin.achievements.categories.life"), value: "12", color: "bg-green-100 text-green-700" },
    { label: t("admin.achievements.categories.activity"), value: "10", color: "bg-orange-100 text-orange-700" },
    { label: t("admin.achievements.categories.expert"), value: "8", color: "bg-red-100 text-red-700" },
  ];

  const recentAchievements = [
    {
      title: t("admin.achievements.recent.readyForExams"),
      category: t("admin.achievements.categories.study"),
      rarity: t("admin.achievements.rarity.rare"),
    },
    {
      title: t("admin.achievements.recent.firstSevenDays"),
      category: t("admin.achievements.categories.start"),
      rarity: t("admin.achievements.rarity.common"),
    },
    {
      title: t("admin.achievements.recent.docGuru"),
      category: t("admin.achievements.categories.expert"),
      rarity: t("admin.achievements.rarity.epic"),
    },
  ];

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className={`w-96 ${cardClass}`}>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-14 w-14 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {t("admin.accessDenied.title")}
              </h2>
              <p className="text-slate-600 mb-6">
                {t("admin.accessDenied.description")}
              </p>
              <Link href="/admin">
                <Button>{t("admin.common.back")}</Button>
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
              <Link
                href="/admin"
                className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="rounded-lg bg-amber-50 p-3">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {t("admin.achievements.header.title")}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  {t("admin.achievements.header.subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span>{t("admin.achievements.actions.export")}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {kpis.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className={cardClass}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        {item.label}
                      </p>
                      <p className="text-2xl font-bold text-slate-900">
                        {item.value}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Categories + Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className={`lg:col-span-2 ${cardClass}`}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-slate-600" />
                <span>{t("admin.achievements.categories")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <span>{item.label}</span>
                  <span className={`rounded-full px-2 py-1 text-xs ${item.color}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-slate-600" />
                <span>{t("admin.achievements.recent")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {recentAchievements.map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg bg-slate-50 px-3 py-2"
                >
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{item.category}</span>
                    <span>{item.rarity}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
