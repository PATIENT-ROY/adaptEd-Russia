"use client";

import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
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
  Activity,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  LogOut,
  BookOpen,
  Phone,
  GraduationCap,
  CreditCard,
  Receipt,
  Download,
  Eye,
  Clock,
  ScanLine,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileEditForm } from "@/components/ui/profile-edit-form";
import { fetchProfileOverview } from "@/lib/api";
import {
  User as UserType,
  Plan,
  ProfileOverview,
  ProfileStat,
  ProfileQuickAction,
  ProfileAchievement,
  ProfileActivityItem,
  ProfileBillingItem,
  Role,
} from "@/types";

// Расширенный тип для пользователя с дополнительными полями
interface ExtendedUser extends UserType {
  university?: string;
  faculty?: string;
  year?: string;
  phone?: string;
  gender?: string;
  city?: string;
  country?: string;
}

const fallbackStats: ProfileStat[] = [
  {
    id: "guides-viewed",
    title: "Изучено гайдов",
    value: "12",
    icon: "FileText",
    color: "from-blue-500 to-blue-600",
    change: "+3",
    period: "за месяц",
  },
  {
    id: "active-reminders",
    title: "Активных задач",
    value: "8",
    icon: "Target",
    color: "from-purple-500 to-purple-600",
    change: "-2",
    period: "за неделю",
  },
  {
    id: "ai-questions",
    title: "Вопросов к AI",
    value: "23",
    icon: "MessageSquare",
    color: "from-orange-500 to-orange-600",
    change: "+7",
    period: "за неделю",
  },
];

const fallbackRecentActivity: ProfileActivityItem[] = [
  {
    id: "fallback-guide-1",
    type: "guide",
    title: "Изучен гайд по регистрации",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    icon: "FileText",
    color: "text-blue-600",
  },
  {
    id: "fallback-reminder-1",
    type: "reminder",
    title: "Напоминание о медосмотре",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    icon: "Bell",
    color: "text-purple-600",
  },
  {
    id: "fallback-ai-1",
    type: "ai",
    title: "Вопрос к AI о транспорте",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    icon: "MessageSquare",
    color: "text-orange-600",
  },
  {
    id: "fallback-task-1",
    type: "task",
    title: "Завершена задача по документам",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    icon: "CheckCircle",
    color: "text-green-600",
  },
];

// Функция для получения истории платежей на основе плана пользователя
const getBillingHistory = (userPlan: Plan): ProfileBillingItem[] => {
  if (userPlan === Plan.PREMIUM) {
    // Для Premium пользователей показываем реальные платежи
    return [
      {
        id: "inv_001",
        date: "2024-01-15T10:00:00.000Z",
        amount: 2990,
        currency: "RUB",
        status: "paid",
        description: "Premium подписка - 1 месяц",
        invoiceNumber: "INV-2024-001",
      },
      {
        id: "inv_002",
        date: "2024-01-01T10:00:00.000Z",
        amount: 2990,
        currency: "RUB",
        status: "paid",
        description: "Premium подписка - 1 месяц",
        invoiceNumber: "INV-2024-002",
      },
      {
        id: "inv_003",
        date: "2023-12-15T10:00:00.000Z",
        amount: 2990,
        currency: "RUB",
        status: "paid",
        description: "Premium подписка - 1 месяц",
        invoiceNumber: "INV-2023-003",
      },
    ];
  } else {
    // Для Freemium пользователей показываем только бесплатные планы
    return [
      {
        id: "inv_001",
        date: "2024-01-01T10:00:00.000Z",
        amount: 0,
        currency: "RUB",
        status: "free",
        description: "Freemium план",
        invoiceNumber: "INV-2024-001",
      },
    ];
  }
};

const fallbackQuickActions: ProfileQuickAction[] = [
  {
    id: "education-guide",
    title: "Образовательный навигатор",
    description: "Гайды по образовательной системе",
    icon: "BookOpen",
    color: "from-blue-500 to-blue-600",
    href: "/education-guide",
  },
  {
    id: "smart-reminders",
    title: "Умные напоминания",
    description: "Управление задачами и сроками",
    icon: "Bell",
    color: "from-purple-500 to-purple-600",
    href: "/reminders",
  },
  {
    id: "ai-assistant",
    title: "AI Помощник",
    description: "Задавайте вопросы на родном языке",
    icon: "MessageSquare",
    color: "from-orange-500 to-orange-600",
    href: "/ai-helper",
  },
  {
    id: "docscan",
    title: "DocScan",
    description: "OCR из PDF и фото, перевод и экспорт",
    icon: "ScanLine",
    color: "from-indigo-500 to-indigo-600",
    href: "/docscan",
  },
  {
    id: "support",
    title: "Поддержка",
    description: "Помощь и консультации",
    icon: "HelpCircle",
    color: "from-green-500 to-green-600",
    href: "/support",
  },
];

const profileCardClass = "border-0 shadow-xl";
const profileCardStyle = {
  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)",
  backdropFilter: "blur(10px)",
};

const fallbackAchievements: ProfileAchievement[] = [
  {
    id: "first-steps",
    title: "Первые шаги",
    description: "Завершил 5 гайдов",
    icon: "Award",
    color: "from-yellow-400 to-orange-500",
    unlocked: true,
  },
  {
    id: "active-student",
    title: "Активный студент",
    description: "30 дней в России",
    icon: "GraduationCap",
    color: "from-blue-400 to-blue-600",
    unlocked: true,
  },
  {
    id: "ai-expert",
    title: "AI Эксперт",
    description: "50 вопросов к AI",
    icon: "MessageSquare",
    color: "from-purple-400 to-purple-600",
    unlocked: false,
  },
  {
    id: "adaptation-master",
    title: "Мастер адаптации",
    description: "100 дней в России",
    icon: "Crown",
    color: "from-yellow-500 to-orange-600",
    unlocked: false,
  },
];

const iconMap = {
  FileText,
  Target,
  MessageSquare,
  BookOpen,
  Bell,
  ScanLine,
  HelpCircle,
  Award,
  GraduationCap,
  Crown,
  CheckCircle,
  CreditCard,
  Clock,
  Activity,
};

const getIconByName = (iconName: string) =>
  iconMap[iconName as keyof typeof iconMap] ?? Activity;

const relativeTimeFormatter = new Intl.RelativeTimeFormat("ru", {
  numeric: "auto",
});

const formatRelativeTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const diffInMinutes = Math.round(diffInSeconds / 60);
  const diffInHours = Math.round(diffInMinutes / 60);
  const diffInDays = Math.round(diffInHours / 24);

  if (Math.abs(diffInSeconds) < 60) {
    return relativeTimeFormatter.format(diffInSeconds, "second");
  }
  if (Math.abs(diffInMinutes) < 60) {
    return relativeTimeFormatter.format(diffInMinutes, "minute");
  }
  if (Math.abs(diffInHours) < 24) {
    return relativeTimeFormatter.format(diffInHours, "hour");
  }
  if (Math.abs(diffInDays) < 7) {
    return relativeTimeFormatter.format(diffInDays, "day");
  }

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeRole = (role?: string): Role => {
  switch ((role ?? "").toUpperCase()) {
    case "ADMIN":
      return Role.ADMIN;
    case "GUEST":
      return Role.GUEST;
    default:
      return Role.STUDENT;
  }
};

const normalizePlan = (plan?: string): Plan =>
  plan === Plan.PREMIUM ? Plan.PREMIUM : Plan.FREEMIUM;

export default function ProfilePage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditFormVisible, setIsEditFormVisible] = useState(false);
  const [isBillingHistoryOpen, setIsBillingHistoryOpen] = useState(false);
  const [profileOverview, setProfileOverview] =
    useState<ProfileOverview | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const { user, logout, updateProfile } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    let isMounted = true;

    const loadProfileOverview = async () => {
      if (!user) return;

      setIsProfileLoading(true);
      setProfileError(null);

      try {
        const data = await fetchProfileOverview();
        if (!isMounted) return;
        setProfileOverview(data);
      } catch (error) {
        console.error("Failed to load profile overview:", error);
        if (!isMounted) return;
        setProfileError(
          "Не удалось загрузить данные профиля. Попробуйте обновить страницу."
        );
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    };

    loadProfileOverview();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const mergedUser = useMemo<ExtendedUser | null>(() => {
  if (!user) {
      return null;
    }

    const baseUser = user as ExtendedUser;
    const overviewUser = (profileOverview?.user ?? {}) as Partial<ExtendedUser>;

    const genderSource = overviewUser.gender ?? baseUser.gender;
    const normalizedGender =
      genderSource === "MALE"
        ? "male"
        : genderSource === "FEMALE"
        ? "female"
        : genderSource;

    const normalizedRole = normalizeRole(
      (overviewUser.role ?? baseUser.role) as string | undefined
    );

    const normalizedPlan = normalizePlan(
      (overviewUser.plan ?? baseUser.plan) as string | undefined
    );

    return {
      ...baseUser,
      ...overviewUser,
      role: normalizedRole,
      plan: normalizedPlan,
      gender: normalizedGender,
      city: overviewUser.city ?? baseUser.city,
    };
  }, [user, profileOverview]);

  // Если пользователь не загружен, показываем skeleton
  if (!user || !mergedUser) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl sm:rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-4 sm:my-6 lg:my-8 overflow-hidden">
          {/* Hero Skeleton */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 py-8 sm:py-12 md:py-16 rounded-2xl sm:rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-4 sm:mt-6 mb-6 sm:mb-8 lg:mb-10">
            <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
              <div className="flex flex-col lg:flex-row items-center space-y-4 sm:space-y-6 lg:space-y-0 lg:space-x-8">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-gray-300 animate-pulse"></div>
                <div className="flex-1 text-center lg:text-left">
                  <div className="h-8 w-64 bg-gray-300 rounded animate-pulse mx-auto lg:mx-0 mb-3"></div>
                  <div className="h-5 w-96 bg-gray-300 rounded animate-pulse mx-auto lg:mx-0"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl sm:rounded-3xl p-6">
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-2xl sm:rounded-3xl p-6">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const avatar = mergedUser.name?.charAt(0)?.toUpperCase?.() ?? "A";

  const extendedUser = mergedUser;

  const statsToRender = (profileOverview?.stats ?? fallbackStats).slice(0, 3);
  const quickActionsToRender =
    profileOverview?.quickActions ?? fallbackQuickActions;
  const achievementsToRender =
    profileOverview?.achievements ?? fallbackAchievements;
  const recentActivityToRender = (
    profileOverview?.recentActivity?.length
      ? profileOverview.recentActivity
      : fallbackRecentActivity
  ).slice(0, 6);

  const userPlan = normalizePlan(extendedUser.plan as string | undefined);

  const billingHistoryData =
    profileOverview?.billingHistory && profileOverview.billingHistory.length > 0
      ? profileOverview.billingHistory
      : getBillingHistory(userPlan);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl sm:rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-4 sm:my-6 lg:my-8 overflow-hidden">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 py-8 sm:py-12 md:py-16 rounded-2xl sm:rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-4 sm:mt-6 mb-6 sm:mb-8 lg:mb-10">
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
                  {extendedUser.country && (
                    <span className="ml-2 text-white/60">
                      • {extendedUser.country}
                    </span>
                  )}
                  {extendedUser.city && (
                    <span className="ml-2 text-white/60">
                      • {extendedUser.city}
                    </span>
                  )}
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
                  {user.plan === Plan.PREMIUM ? (
                    <span className="inline-flex items-center px-2 sm:px-3 md:px-4 py-1 md:py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
                      <Crown className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      {t("home.pricing.premium")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 sm:px-3 md:px-4 py-1 md:py-2 rounded-full bg-red-500 text-white border-2 border-red-600">
                      <Zap className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      {t("home.pricing.freemium")}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="w-full lg:w-auto grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 max-w-md lg:max-w-none">
                {statsToRender.map((stat) => {
                  const Icon = getIconByName(stat.icon);
                  return (
                    <div
                      key={stat.id}
                      className={`text-center p-2 sm:p-3 md:p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 ${
                        isProfileLoading ? "animate-pulse" : ""
                      }`}
                    >
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-1 sm:mb-2 shadow-lg`}
                      >
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                      </div>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                        {stat.value}
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
          {profileError && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm sm:text-base leading-relaxed">
                {profileError}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
              Быстрые действия
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-4 lg:gap-6">
              {quickActionsToRender.map((action, index) => {
                const Icon = getIconByName(action.icon);
                return (
                  <Link key={action.id} href={action.href}>
                    <Card
                      className={`${profileCardClass} animate-fade-in-up cursor-pointer h-full ${
                        isProfileLoading ? "animate-pulse" : ""
                      }`}
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        ...profileCardStyle,
                      }}
                    >
                      <CardContent className="p-2.5 sm:p-6 relative z-10 flex flex-col h-full">
                        <div
                          className={`w-9 h-9 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-1.5 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
                        >
                          <Icon className="h-4 w-4 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                        </div>
                        <h3 className="text-xs sm:text-lg lg:text-xl font-bold text-slate-900 mb-1 sm:mb-2 flex-shrink-0 leading-tight line-clamp-2">
                          {action.title}
                        </h3>
                        <p className="text-[11px] sm:text-sm lg:text-base text-slate-600 flex-grow overflow-hidden line-clamp-4 sm:line-clamp-none leading-snug">
                          {action.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Billing & Invoices Section */}
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                История платежей
              </h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  className="flex items-center justify-center space-x-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-300 text-sm sm:text-base py-2 sm:py-2 px-3 sm:px-4"
                  onClick={() => setIsBillingHistoryOpen(!isBillingHistoryOpen)}
                >
                  <Receipt className="h-4 w-4 sm:h-4 sm:w-4" />
                  <span>{isBillingHistoryOpen ? "Скрыть" : "Показать"}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${
                      isBillingHistoryOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
                <Link href="/payment/test" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-300 text-sm sm:text-base py-2 sm:py-2 px-3 sm:px-4"
                  >
                    <CreditCard className="h-4 w-4 sm:h-4 sm:w-4" />
                    <span className="whitespace-nowrap">
                      Управление подпиской
                    </span>
                  </Button>
                </Link>
              </div>
            </div>

            {isBillingHistoryOpen && (
              <Card
                className={`${profileCardClass} no-hover animate-fade-in-up`}
                style={profileCardStyle}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <Receipt className="h-5 w-5 text-white" />
                    </div>
                    <span>Счета и платежи</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {billingHistoryData.map((invoice, index) => (
                      <div
                        key={invoice.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all duration-300 group gap-3 sm:gap-0"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              invoice.status === "paid"
                                ? "bg-green-100 text-green-600"
                                : invoice.status === "free"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-yellow-100 text-yellow-600"
                            }`}
                          >
                            {invoice.status === "paid" ? (
                              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                            ) : invoice.status === "free" ? (
                              <Crown className="h-5 w-5 sm:h-6 sm:w-6" />
                            ) : (
                              <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                              {invoice.description}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-slate-600">
                              <span className="truncate">
                                {invoice.invoiceNumber}
                              </span>
                              <span className="hidden sm:inline">•</span>
                              <span className="truncate">
                                {new Date(invoice.date).toLocaleDateString(
                                  "ru-RU"
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 sm:flex-shrink-0">
                          <div className="text-left sm:text-right">
                            <p
                              className={`font-bold text-base sm:text-lg ${
                                invoice.status === "paid"
                                  ? "text-green-600"
                                  : invoice.status === "free"
                                  ? "text-blue-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {invoice.status === "free"
                                ? "Бесплатно"
                                : `${invoice.amount} ₽`}
                            </p>
                            <p className="text-xs sm:text-sm text-slate-500 capitalize">
                              {invoice.status === "paid"
                                ? "Оплачено"
                                : invoice.status === "free"
                                ? "Активен"
                                : "В ожидании"}
                            </p>
                          </div>

                          <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-slate-200"
                              onClick={() =>
                                alert(`Просмотр счета ${invoice.invoiceNumber}`)
                              }
                            >
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                            {invoice.status === "paid" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-slate-200"
                                onClick={() =>
                                  alert(
                                    `Скачивание счета ${invoice.invoiceNumber}`
                                  )
                                }
                              >
                                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>
                        Всего счетов: {getBillingHistory(user.plan).length}
                      </span>
                      <span>
                        Общая сумма:{" "}
                        {getBillingHistory(user.plan)
                          .filter((inv) => inv.status === "paid")
                          .reduce((sum, inv) => sum + inv.amount, 0)}{" "}
                        ₽
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column - Personal Info (Desktop only) */}
            <div className="lg:col-span-1 space-y-6">
              {/* Personal Information */}
              <Card
                className={`${profileCardClass} no-hover animate-fade-in-up`}
                style={{ animationDelay: "0.2s", ...profileCardStyle }}
              >
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
                  className={`${profileCardClass} animate-fade-in-up`}
                  style={{ animationDelay: "0.3s", ...profileCardStyle }}
                >
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
                className={`${profileCardClass} no-hover animate-fade-in-up`}
                style={{ animationDelay: "0.4s", ...profileCardStyle }}
              >
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
                    {recentActivityToRender.map((activity, index) => {
                      const Icon = getIconByName(activity.icon);
                      const activityTime = formatRelativeTime(
                        activity.timestamp
                      );
                      return (
                        <div
                          key={activity.id}
                          className="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors duration-200"
                          style={{ animationDelay: `${index * 0.05}s` }}
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
                              {activityTime}
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
                className={`${profileCardClass} no-hover animate-fade-in-up`}
                style={{ animationDelay: "0.5s", ...profileCardStyle }}
              >
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
                    {achievementsToRender.map((achievement) => {
                      const Icon = getIconByName(achievement.icon);
                      return (
                        <div
                          key={achievement.id}
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
                              <div className="relative">
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                <span className="absolute -top-2 -right-2 text-xs animate-bounce">⭐</span>
                              </div>
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
                  className={`${profileCardClass} animate-fade-in-up`}
                  style={{ animationDelay: "0.6s", ...profileCardStyle }}
                >
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
        {extendedUser && (
          <ProfileEditForm
            user={extendedUser}
            onSave={updateProfile}
            onCancel={() => setIsEditFormVisible(false)}
            isVisible={isEditFormVisible}
          />
        )}
      </div>
    </Layout>
  );
}
