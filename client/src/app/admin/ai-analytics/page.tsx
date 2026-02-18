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
import { useEffect, useState } from "react";
import { Role } from "@/types";

const cardClass = "border-0 shadow-xl";
const cardStyle = {
  background:
    "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)",
  backdropFilter: "blur(10px)",
};

const kpis = [
  { label: "AI-сессии", value: "18 402", icon: MessageSquare },
  { label: "Решено с AI", value: "72%", icon: Sparkles },
  { label: "Средняя оценка", value: "4.6", icon: Star },
  { label: "Средний диалог", value: "4.2 мин", icon: Clock },
];

export default function AdminAiAnalyticsPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
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
          <Card className={`w-96 ${cardClass}`} style={cardStyle}>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-14 w-14 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Доступ запрещён
              </h2>
              <p className="text-slate-600 mb-6">
                У вас нет прав для просмотра AI-аналитики.
              </p>
              <Link href="/admin">
                <Button>Назад в админку</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute>
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
                    AI-аналитика
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    3 режима (Учёба, Жизнь, Генератор) + Шаблоны
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>Экспорт</span>
                </Button>
              </div>
            </div>
          </div>

          {/* KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {kpis.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className={cardClass} style={cardStyle}>
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
            <Card className={`lg:col-span-2 ${cardClass}`} style={cardStyle}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-slate-600" />
                  <span>Тренды AI</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 text-sm">
                  График сессий / успеха (placeholder)
                </div>
              </CardContent>
            </Card>

            <Card className={cardClass} style={cardStyle}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-slate-600" />
                  <span>Топ-темы</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  ["Режим: Учёба", "42%"],
                  ["Режим: Жизнь", "28%"],
                  ["Режим: Генератор", "18%"],
                  ["Шаблоны", "12%"],
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
            <Card className={`lg:col-span-2 ${cardClass}`} style={cardStyle}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-slate-600" />
                  <span>Качество ответов</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span>Средняя оценка</span>
                  <span className="font-semibold">4.6 / 5</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span>Жалобы на ответы</span>
                  <span className="font-semibold">1.4%</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span>Ручные правки</span>
                  <span className="font-semibold">9.8%</span>
                </div>
              </CardContent>
            </Card>

            <Card className={cardClass} style={cardStyle}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-slate-600" />
                  <span>Эффективность</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span>AI решил сам</span>
                  <span className="font-semibold">72%</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span>Эскалация</span>
                  <span className="font-semibold">18%</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span>Нужна проверка</span>
                  <span className="font-semibold">10%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

