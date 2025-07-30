"use client";

import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  Calendar,
  Crown,
  Settings,
  Bell,
  MessageSquare,
  FileText,
  Zap,
  Award,
  Shield,
  Target,
  Edit,
  Trash2,
  Languages,
  Activity,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  LogOut,
  BookOpen,
  MapPin,
  Phone,
  GraduationCap,
  Home,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileEditForm } from "@/components/ui/profile-edit-form";

// Расширенный тип для пользователя с дополнительными полями
interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  language: string;
  role: string;
  university?: string;
  faculty?: string;
  year?: string;
  plan?: string;
  phone?: string;
  country?: string;
  gender?: string;
  registeredAt?: string;
}

// Моковые данные для демонстрации (дополнительная информация)
const additionalUserInfo = {
  plan: "freemium" as "freemium" | "premium",
  notificationsUsed: 1,
  notificationsLimit: 2,
};

const stats = [
  {
    title: "Изучено гайдов",
    value: "12",
    icon: FileText,
    color: "from-blue-500 to-blue-600",
    change: "+3",
    period: "за месяц",
  },
  {
    title: "Дней в России",
    value: "45",
    icon: Calendar,
    color: "from-green-500 to-green-600",
    change: "+15",
    period: "за месяц",
  },
  {
    title: "Активных задач",
    value: "8",
    icon: Target,
    color: "from-purple-500 to-purple-600",
    change: "-2",
    period: "за неделю",
  },
  {
    title: "Вопросов к AI",
    value: "23",
    icon: MessageSquare,
    color: "from-orange-500 to-orange-600",
    change: "+7",
    period: "за неделю",
  },
];

const recentActivity = [
  {
    type: "guide",
    title: "Изучен гайд по регистрации",
    time: "2 часа назад",
    icon: FileText,
    color: "text-blue-600",
  },
  {
    type: "reminder",
    title: "Напоминание о медосмотре",
    time: "1 день назад",
    icon: Bell,
    color: "text-purple-600",
  },
  {
    type: "ai",
    title: "Вопрос к AI о транспорте",
    time: "2 дня назад",
    icon: MessageSquare,
    color: "text-orange-600",
  },
  {
    type: "task",
    title: "Завершена задача по документам",
    time: "3 дня назад",
    icon: CheckCircle,
    color: "text-green-600",
  },
];

const quickActions = [
  {
    title: "Новый гайд",
    description: "Изучить новый материал",
    icon: BookOpen,
    color: "from-blue-500 to-blue-600",
    href: "/education-guide",
  },
  {
    title: "AI Помощник",
    description: "Задать вопрос",
    icon: MessageSquare,
    color: "from-purple-500 to-purple-600",
    href: "/ai-helper",
  },
  {
    title: "Напоминания",
    description: "Управление задачами",
    icon: Bell,
    color: "from-orange-500 to-orange-600",
    href: "/reminders",
  },
  {
    title: "Жизненный гайд",
    description: "Бытовые советы",
    icon: Home,
    color: "from-green-500 to-green-600",
    href: "/life-guide",
  },
];

const achievements = [
  {
    title: "Первые шаги",
    description: "Завершил 5 гайдов",
    icon: Award,
    color: "from-yellow-400 to-orange-500",
    unlocked: true,
  },
  {
    title: "Активный студент",
    description: "30 дней в России",
    icon: GraduationCap,
    color: "from-blue-400 to-blue-600",
    unlocked: true,
  },
  {
    title: "AI Эксперт",
    description: "50 вопросов к AI",
    icon: MessageSquare,
    color: "from-purple-400 to-purple-600",
    unlocked: false,
  },
  {
    title: "Мастер адаптации",
    description: "100 дней в России",
    icon: Crown,
    color: "from-yellow-500 to-orange-600",
    unlocked: false,
  },
];

export default function ProfilePage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditFormVisible, setIsEditFormVisible] = useState(false);
  const { user, logout, updateProfile } = useAuth();

  // Если пользователь не загружен, показываем загрузку
  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Загрузка профиля...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Получаем первую букву имени для аватара
  const avatar = user.name.charAt(0).toUpperCase();

  // Получаем количество дней в России (примерно)
  const extendedUser = user as ExtendedUser;
  const joinDate = extendedUser.registeredAt
    ? new Date(extendedUser.registeredAt)
    : new Date();
  const daysInRussia = Math.floor(
    (new Date().getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 py-8 sm:py-12 md:py-16">
          <div className="absolute inset-0 bg-black/10"></div>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>

          <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <div className="flex flex-col lg:flex-row items-center space-y-4 sm:space-y-6 lg:space-y-0 lg:space-x-8">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold shadow-2xl">
                  {avatar}
                </div>
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center border-2 border-white">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </div>

              {/* User Info */}
              <div className="text-center lg:text-left text-white">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                  {user.name}
                </h1>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 mb-3 sm:mb-4">
                  {extendedUser.university || "Университет не указан"}
                </p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm md:text-base">
                  <span className="inline-flex items-center px-2 sm:px-3 md:px-4 py-1 md:py-2 rounded-full bg-white/20 backdrop-blur-sm">
                    <GraduationCap className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                    {extendedUser.faculty || "Факультет не указан"}
                  </span>
                  <span className="inline-flex items-center px-2 sm:px-3 md:px-4 py-1 md:py-2 rounded-full bg-white/20 backdrop-blur-sm">
                    <Calendar className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                    {extendedUser.year || "Курс не указан"}
                  </span>
                  {(extendedUser.plan || additionalUserInfo.plan) ===
                  "premium" ? (
                    <span className="inline-flex items-center px-2 sm:px-3 md:px-4 py-1 md:py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
                      <Crown className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      Премиум
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 sm:px-3 md:px-4 py-1 md:py-2 rounded-full bg-white/20 backdrop-blur-sm">
                      <Zap className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      Freemium
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="w-full lg:w-auto grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 max-w-md lg:max-w-none">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  // Обновляем значение "Дней в России" на реальное
                  const displayValue =
                    stat.title === "Дней в России"
                      ? daysInRussia.toString()
                      : stat.value;
                  return (
                    <div
                      key={stat.title}
                      className="text-center p-2 sm:p-3 md:p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20"
                    >
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-1 sm:mb-2 shadow-lg`}
                      >
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                      </div>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                        {displayValue}
                      </p>
                      <p className="text-xs sm:text-sm md:text-base text-white/80 leading-tight">
                        {stat.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
          {/* Quick Actions */}
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
              Быстрые действия
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={action.title} href={action.href}>
                    <Card
                      className="group hover:scale-105 transition-all duration-500 animate-fade-in-up border-0 shadow-xl hover:shadow-2xl overflow-hidden cursor-pointer"
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        background:
                          "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <CardContent className="p-4 sm:p-6 relative z-10">
                        <div
                          className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                          {action.title}
                        </h3>
                        <p className="text-sm sm:text-base text-slate-600">
                          {action.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column - Personal Info (Desktop only) */}
            <div className="lg:col-span-1 space-y-6">
              {/* Personal Information */}
              <Card
                className="group hover:scale-105 transition-all duration-500 animate-fade-in-up border-0 shadow-xl hover:shadow-2xl overflow-hidden"
                style={{
                  animationDelay: "0.2s",
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold">Личная информация</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50">
                      <Mail className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500">Email</p>
                        <p className="font-medium text-slate-900">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50">
                      <Phone className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500">Телефон</p>
                        <p className="font-medium text-slate-900">
                          {extendedUser.phone || "Телефон не указан"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50">
                      <MapPin className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500">Страна</p>
                        <p className="font-medium text-slate-900">
                          {extendedUser.country || "Страна не указана"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50">
                      <Languages className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500">Язык</p>
                        <p className="font-medium text-slate-900">
                          {user.language === "RU"
                            ? "Русский"
                            : user.language === "EN"
                            ? "English"
                            : user.language === "FR"
                            ? "Français"
                            : user.language === "AR"
                            ? "العربية"
                            : user.language}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50">
                      <User className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500">Пол</p>
                        <p className="font-medium text-slate-900">
                          {extendedUser.gender === "male"
                            ? "Мужской"
                            : extendedUser.gender === "female"
                            ? "Женский"
                            : "Не указан"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50">
                      <Calendar className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500">
                          Дата регистрации
                        </p>
                        <p className="font-medium text-slate-900">
                          {extendedUser.registeredAt
                            ? new Date(
                                extendedUser.registeredAt
                              ).toLocaleDateString("ru-RU")
                            : "Не указана"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-700 lg:hover:from-blue-700 lg:hover:to-purple-800 text-white shadow-lg lg:hover:shadow-xl transform lg:hover:scale-105 transition-all duration-300 h-12 font-bold text-base"
                    onClick={() => setIsEditFormVisible(true)}
                  >
                    <Edit className="mr-3 h-5 w-5" />
                    Редактировать профиль
                    <ChevronRight className="ml-auto h-4 w-4 lg:group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </CardContent>
              </Card>

              {/* Settings (Desktop only) */}
              <div className="hidden lg:block">
                <Card
                  className="group hover:scale-105 transition-all duration-500 animate-fade-in-up border-0 shadow-xl hover:shadow-2xl overflow-hidden"
                  style={{
                    animationDelay: "0.3s",
                    background:
                      "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader
                    className="relative z-10 cursor-pointer"
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shadow-lg">
                          <Settings className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold">Настройки</span>
                      </div>
                      <div
                        className={`transition-transform duration-300 ${
                          isSettingsOpen ? "rotate-180" : ""
                        }`}
                      >
                        <ChevronDown className="h-5 w-5 text-slate-500" />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <div
                    className={`relative z-10 overflow-hidden transition-all duration-300 ${
                      isSettingsOpen
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <CardContent className="space-y-3 pb-6">
                      <Button
                        variant="outline"
                        className="w-full justify-start h-12 hover:bg-slate-50 hover:scale-105 transition-all duration-300"
                        onClick={() =>
                          alert("Функция уведомлений в разработке")
                        }
                      >
                        <Bell className="mr-3 h-5 w-5" />
                        Уведомления
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-12 hover:bg-slate-50 hover:scale-105 transition-all duration-300"
                        onClick={() =>
                          alert("Функция безопасности в разработке")
                        }
                      >
                        <Shield className="mr-3 h-5 w-5" />
                        Безопасность
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-12 hover:bg-slate-50 hover:scale-105 transition-all duration-300"
                        onClick={() =>
                          alert("Функция языка и региона в разработке")
                        }
                      >
                        <Languages className="mr-3 h-5 w-5" />
                        Язык и регион
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-12 hover:bg-red-50 hover:text-red-700 hover:scale-105 transition-all duration-300 border-red-200 text-red-600"
                        onClick={() => {
                          if (
                            confirm(
                              "Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить."
                            )
                          ) {
                            alert("Функция удаления аккаунта в разработке");
                          }
                        }}
                      >
                        <Trash2 className="mr-3 h-5 w-5" />
                        Удалить аккаунт
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          logout();
                          window.location.href = "/";
                        }}
                        className="w-full justify-start h-12 hover:bg-slate-50 hover:scale-105 transition-all duration-300"
                      >
                        <LogOut className="mr-3 h-5 w-5" />
                        Выйти
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Button>
                    </CardContent>
                  </div>
                </Card>
              </div>
            </div>

            {/* Right Column - Activity & Achievements */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Activity */}
              <Card
                className="group hover:scale-105 transition-all duration-500 animate-fade-in-up border-0 shadow-xl hover:shadow-2xl overflow-hidden"
                style={{
                  animationDelay: "0.4s",
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold">
                      Последняя активность
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    {recentActivity.map((activity) => {
                      const Icon = activity.icon;
                      return (
                        <div
                          key={activity.title}
                          className="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors duration-200"
                        >
                          <div
                            className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${activity.color
                              .replace("text-", "from-")
                              .replace("-600", "-400")} to-${activity.color
                              .replace("text-", "")
                              .replace(
                                "-600",
                                "-600"
                              )} flex items-center justify-center`}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">
                              {activity.title}
                            </p>
                            <p className="text-sm text-slate-500">
                              {activity.time}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card
                className="group hover:scale-105 transition-all duration-500 animate-fade-in-up border-0 shadow-xl hover:shadow-2xl overflow-hidden"
                style={{
                  animationDelay: "0.5s",
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold">Достижения</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    {achievements.map((achievement) => {
                      const Icon = achievement.icon;
                      return (
                        <div
                          key={achievement.title}
                          className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                            achievement.unlocked
                              ? "border-green-200 bg-green-50 hover:bg-green-100"
                              : "border-slate-200 bg-slate-50 opacity-60"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${
                                achievement.color
                              } flex items-center justify-center shadow-lg ${
                                achievement.unlocked ? "" : "grayscale"
                              }`}
                            >
                              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3
                                className={`font-semibold text-sm sm:text-base ${
                                  achievement.unlocked
                                    ? "text-slate-900"
                                    : "text-slate-500"
                                }`}
                              >
                                {achievement.title}
                              </h3>
                              <p
                                className={`text-xs sm:text-sm ${
                                  achievement.unlocked
                                    ? "text-slate-600"
                                    : "text-slate-400"
                                }`}
                              >
                                {achievement.description}
                              </p>
                            </div>
                            {achievement.unlocked && (
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Settings (Mobile & Tablet only) */}
              <div className="lg:hidden">
                <Card
                  className="group hover:scale-105 transition-all duration-500 animate-fade-in-up border-0 shadow-xl hover:shadow-2xl overflow-hidden"
                  style={{
                    animationDelay: "0.6s",
                    background:
                      "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader
                    className="relative z-10 cursor-pointer"
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shadow-lg">
                          <Settings className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold">Настройки</span>
                      </div>
                      <div
                        className={`transition-transform duration-300 ${
                          isSettingsOpen ? "rotate-180" : ""
                        }`}
                      >
                        <ChevronDown className="h-5 w-5 text-slate-500" />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <div
                    className={`relative z-10 overflow-hidden transition-all duration-300 ${
                      isSettingsOpen
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <CardContent className="space-y-3 pb-6">
                      <Button
                        variant="outline"
                        className="w-full justify-start h-12 hover:bg-slate-50 hover:scale-105 transition-all duration-300"
                        onClick={() =>
                          alert("Функция уведомлений в разработке")
                        }
                      >
                        <Bell className="mr-3 h-5 w-5" />
                        Уведомления
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-12 hover:bg-slate-50 hover:scale-105 transition-all duration-300"
                        onClick={() =>
                          alert("Функция безопасности в разработке")
                        }
                      >
                        <Shield className="mr-3 h-5 w-5" />
                        Безопасность
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-12 hover:bg-slate-50 hover:scale-105 transition-all duration-300"
                        onClick={() =>
                          alert("Функция языка и региона в разработке")
                        }
                      >
                        <Languages className="mr-3 h-5 w-5" />
                        Язык и регион
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-12 hover:bg-red-50 hover:text-red-700 hover:scale-105 transition-all duration-300 border-red-200 text-red-600"
                        onClick={() => {
                          if (
                            confirm(
                              "Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить."
                            )
                          ) {
                            alert("Функция удаления аккаунта в разработке");
                          }
                        }}
                      >
                        <Trash2 className="mr-3 h-5 w-5" />
                        Удалить аккаунт
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          logout();
                          window.location.href = "/";
                        }}
                        className="w-full justify-start h-12 hover:bg-slate-50 hover:scale-105 transition-all duration-300"
                      >
                        <LogOut className="mr-3 h-5 w-5" />
                        Выйти
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Button>
                    </CardContent>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        {user && (
          <ProfileEditForm
            user={user}
            onSave={updateProfile}
            onCancel={() => setIsEditFormVisible(false)}
            isVisible={isEditFormVisible}
          />
        )}
      </div>
    </Layout>
  );
}
