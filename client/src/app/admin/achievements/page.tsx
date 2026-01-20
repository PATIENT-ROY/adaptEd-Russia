"use client";

import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useEffect, useState } from "react";
import { Role } from "@/types";

const cardClass = "border-0 shadow-xl";
const cardStyle = {
  background:
    "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)",
  backdropFilter: "blur(10px)",
};

const kpis = [
  { label: "Всего достижений", value: "64", icon: Trophy },
  { label: "Средний прогресс", value: "41%", icon: TrendingUp },
  { label: "Активные участники", value: "3 248", icon: Users },
  { label: "Новые за месяц", value: "+8", icon: Sparkles },
];

const categories = [
  { label: "Начало пути", value: "18", color: "bg-blue-100 text-blue-700" },
  { label: "Учёба", value: "16", color: "bg-purple-100 text-purple-700" },
  { label: "Быт", value: "12", color: "bg-green-100 text-green-700" },
  { label: "Активность", value: "10", color: "bg-orange-100 text-orange-700" },
  { label: "Эксперт", value: "8", color: "bg-red-100 text-red-700" },
];

const recentAchievements = [
  { title: "Готов к сессии", category: "Учёба", rarity: "Редкое" },
  { title: "Первые 7 дней", category: "Начало пути", rarity: "Обычное" },
  { title: "Гуру документов", category: "Эксперт", rarity: "Эпическое" },
];

export default function AdminAchievementsPage() {
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
                У вас нет прав для просмотра раздела достижений.
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
                <div className="rounded-lg bg-amber-50 p-3">
                  <Award className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Достижения — аналитика
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Награды, прогресс и вовлечённость
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
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
            <Card className={`lg:col-span-2 ${cardClass}`} style={cardStyle}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-slate-600" />
                  <span>Категории достижений</span>
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

            <Card className={cardClass} style={cardStyle}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-slate-600" />
                  <span>Новые достижения</span>
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
    </ProtectedRoute>
  );
}

