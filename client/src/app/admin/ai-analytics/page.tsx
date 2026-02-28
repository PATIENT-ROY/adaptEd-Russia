"use client";

import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Clock,
  MessageSquare,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

const cardClass = "border-0 shadow-xl backdrop-blur-sm bg-white/90";

export default function AdminAiAnalyticsPage() {
  return (
    <ProtectedRoute>
      <AiAnalyticsContent />
    </ProtectedRoute>
  );
}

function AiAnalyticsContent() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === Role.ADMIN;

  const kpis = [
    { label: t("admin.aiAnalytics.kpi.sessions"), value: "18 402", icon: MessageSquare },
    { label: t("admin.aiAnalytics.kpi.solved"), value: "72%", icon: Sparkles },
    { label: t("admin.aiAnalytics.kpi.avgRating"), value: "4.6", icon: Star },
    { label: t("admin.aiAnalytics.kpi.avgDialog"), value: "4.2 мин", icon: Clock },
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
              <div className="rounded-lg bg-purple-50 p-3">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {t("admin.aiAnalytics.header.title")}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  {t("admin.aiAnalytics.header.subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>{t("admin.common.export")}</span>
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
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trends + Topics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className={`lg:col-span-2 ${cardClass}`}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-slate-600" />
                <span>{t("admin.aiAnalytics.trends")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 text-sm">
                {t("admin.aiAnalytics.trendsPlaceholder")}
              </div>
            </CardContent>
          </Card>

          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-slate-600" />
                <span>{t("admin.aiAnalytics.topTopics")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                [t("admin.aiAnalytics.topics.study"), "42%"],
                [t("admin.aiAnalytics.topics.life"), "28%"],
                [t("admin.aiAnalytics.topics.generator"), "18%"],
                [t("admin.aiAnalytics.topics.templates"), "12%"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                >
                  <span>{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quality + Efficiency */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className={`lg:col-span-2 ${cardClass}`}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-slate-600" />
                <span>{t("admin.aiAnalytics.quality")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{t("admin.aiAnalytics.quality.avgRating")}</span>
                <span className="font-semibold">4.6 / 5</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{t("admin.aiAnalytics.quality.complaints")}</span>
                <span className="font-semibold">1.4%</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{t("admin.aiAnalytics.quality.edits")}</span>
                <span className="font-semibold">9.8%</span>
              </div>
            </CardContent>
          </Card>

          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-slate-600" />
                <span>{t("admin.aiAnalytics.efficiency")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{t("admin.aiAnalytics.efficiency.aiSolved")}</span>
                <span className="font-semibold">72%</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{t("admin.aiAnalytics.efficiency.escalation")}</span>
                <span className="font-semibold">18%</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{t("admin.aiAnalytics.efficiency.needReview")}</span>
                <span className="font-semibold">10%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
