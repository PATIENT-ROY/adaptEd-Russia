"use client";

import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  ArrowLeft,
  ScanLine,
  TrendingUp,
  Users,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useEffect, useState } from "react";
import { fetchAdminDocscanAnalytics } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";

const cardClass = "border-0 shadow-xl backdrop-blur-sm bg-white/90";

export default function DocscanAnalyticsPage() {
  return (
    <ProtectedRoute>
      <DocscanAnalyticsContent />
    </ProtectedRoute>
  );
}

function DocscanAnalyticsContent() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === Role.ADMIN;
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof fetchAdminDocscanAnalytics>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAdminDocscanAnalytics();
        if (!cancelled) setAnalytics(data);
      } catch (error) {
        console.error("Failed to load DocScan analytics:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const kpis = [
    {
      label: t("admin.docscan.kpi.totalScans"),
      value: loading ? "…" : String(analytics?.totalScans ?? 0),
      icon: ScanLine,
    },
    {
      label: t("admin.docscan.kpi.successOcr"),
      value: loading ? "…" : String(analytics?.successOcr ?? 0),
      icon: TrendingUp,
    },
    {
      label: t("admin.docscan.kpi.activeUsers"),
      value: loading ? "…" : String(analytics?.activeUsers ?? 0),
      icon: Users,
    },
    {
      label: t("admin.docscan.kpi.ocrErrors"),
      value: loading ? "…" : String(analytics?.ocrErrors ?? 0),
      icon: Activity,
    },
  ];

  const trend = analytics?.trend ?? [];
  const trendMax = Math.max(1, ...trend.map((point) => point.count));
  const funnel = analytics?.funnel ?? { upload: 0, ocr: 0, export: 0 };
  const funnelItems = [
    { label: t("admin.docscan.funnel.upload"), value: funnel.upload },
    { label: t("admin.docscan.funnel.ocr"), value: funnel.ocr },
    { label: t("admin.docscan.funnel.export"), value: funnel.export },
  ];
  const funnelMax = Math.max(1, funnel.upload, funnel.ocr, funnel.export);

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
              <div className="rounded-lg bg-indigo-50 p-3">
                <ScanLine className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {t("admin.docscan.header.title")}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  {t("admin.docscan.header.subtitle")}
                </p>
              </div>
            </div>
          </div>
        </div>

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
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className={`lg:col-span-2 ${cardClass}`}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-slate-600" />
                <span>{t("admin.docscan.trends")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-56 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 text-sm">
                  …
                </div>
              ) : trend.every((point) => point.count === 0) ? (
                <div className="h-56 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 text-sm">
                  {t("admin.docscan.trendsPlaceholder")}
                </div>
              ) : (
                <div className="flex h-56 items-end gap-1.5">
                  {trend.map((point) => (
                    <div
                      key={point.date}
                      className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                      title={`${point.date}: ${point.count}`}
                    >
                      <div
                        className="w-full rounded-t bg-indigo-500/80"
                        style={{ height: `${Math.max(4, (point.count / trendMax) * 100)}%` }}
                      />
                      <span className="text-[10px] text-slate-400">
                        {point.date.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-slate-600" />
                <span>{t("admin.docscan.funnel")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-slate-500 text-center py-4">…</p>
              ) : funnelItems.every((item) => item.value === 0) ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  {t("admin.analytics.noBreakdown")}
                </p>
              ) : (
                funnelItems.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-semibold text-slate-900">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${Math.round((item.value / funnelMax) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
