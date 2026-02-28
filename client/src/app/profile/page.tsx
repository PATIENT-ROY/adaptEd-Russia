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
  Camera,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileEditForm } from "@/components/ui/profile-edit-form";
import { fetchProfileOverview, API_BASE_URL } from "@/lib/api";
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
import { useReview } from "@/hooks/useReview";
import { ReviewModal } from "@/components/ReviewModal";

interface ExtendedUser extends UserType {
  university?: string;
  faculty?: string;
  year?: string;
  phone?: string;
  gender?: string;
  city?: string;
  country?: string;
}

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
    description: "3 режима + Шаблоны для курсовых, резюме, писем",
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
  background:
    "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)",
  backdropFilter: "blur(10px)",
};

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
  Edit,
  Star,
};

const activityGradientMap: Record<string, string> = {
  "text-blue-600": "from-blue-400 to-blue-600",
  "text-purple-600": "from-purple-400 to-purple-600",
  "text-orange-600": "from-orange-400 to-orange-600",
  "text-green-600": "from-green-400 to-green-600",
  "text-red-600": "from-red-400 to-red-600",
  "text-yellow-600": "from-yellow-400 to-yellow-600",
  "text-indigo-600": "from-indigo-400 to-indigo-600",
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

function compressImage(file: File, maxDim = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > height) {
          if (width > maxDim) {
            height = (height * maxDim) / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = (width * maxDim) / height;
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function SettingsPanel({
  isOpen,
  onToggle,
  onLogout,
  showToast,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onLogout: () => void;
  showToast: (msg: string) => void;
}) {
  return (
    <Card
      className={`${profileCardClass} animate-fade-in-up`}
      style={profileCardStyle}
    >
      <CardHeader
        className="relative z-10 cursor-pointer"
        onClick={onToggle}
        role="button"
        aria-expanded={isOpen}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shadow-lg">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Настройки</span>
          </div>
          <div
            className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          >
            <ChevronDown className="h-5 w-5 text-slate-500" />
          </div>
        </CardTitle>
      </CardHeader>
      <div
        className={`relative z-10 overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <CardContent className="space-y-3 pb-6">
          <Button
            variant="outline"
            className="w-full justify-start h-12 hover:bg-slate-50 transition-all duration-300"
            onClick={() =>
              showToast("Функция уведомлений скоро будет доступна")
            }
          >
            <Bell className="mr-3 h-5 w-5" />
            Уведомления
            <ChevronRight className="ml-auto h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start h-12 hover:bg-slate-50 transition-all duration-300"
            onClick={() =>
              showToast("Функция безопасности скоро будет доступна")
            }
          >
            <Shield className="mr-3 h-5 w-5" />
            Безопасность
            <ChevronRight className="ml-auto h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start h-12 hover:bg-red-50 hover:text-red-700 transition-all duration-300 border-red-200 text-red-600"
            onClick={() =>
              showToast("Функция удаления аккаунта скоро будет доступна")
            }
          >
            <Trash2 className="mr-3 h-5 w-5" />
            Удалить аккаунт
            <ChevronRight className="ml-auto h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={onLogout}
            className="w-full justify-start h-12 hover:bg-slate-50 transition-all duration-300"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Выйти
            <ChevronRight className="ml-auto h-4 w-4" />
          </Button>
        </CardContent>
      </div>
    </Card>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditFormVisible, setIsEditFormVisible] = useState(false);
  const [isBillingHistoryOpen, setIsBillingHistoryOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [profileOverview, setProfileOverview] =
    useState<ProfileOverview | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { user, logout, updateProfile } = useAuth();
  const { t } = useTranslation();
  const {
    review,
    loading: reviewLoading,
    error: reviewError,
    saving: reviewSaving,
    saveError: reviewSaveError,
    statusMessage: reviewStatusMessage,
    createOrUpdate: saveReview,
  } = useReview();

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    router.push("/");
  }, [logout, router]);

  const loadAvatar = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/user/profile/avatar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const body = await res.json();
        if (body.data?.avatar) {
          setAvatarUrl(body.data.avatar);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);

    if (!file.type.startsWith("image/")) {
      setAvatarError("Выберите изображение (PNG, JPEG, WebP)");
      return;
    }
    if (file.size > 5_000_000) {
      setAvatarError("Файл слишком большой. Максимум 5MB.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const base64 = await compressImage(file, 256);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/user/profile/avatar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar: base64 }),
      });
      if (res.ok) {
        setAvatarUrl(base64);
        showToast("Аватар обновлён");
      } else {
        setAvatarError("Не удалось загрузить аватар");
      }
    } catch {
      setAvatarError("Ошибка при загрузке аватара");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  useEffect(() => {
    loadAvatar();
  }, [loadAvatar]);

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
          "Не удалось загрузить данные профиля. Попробуйте обновить страницу.",
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
      (overviewUser.role ?? baseUser.role) as string | undefined,
    );

    const normalizedPlan = normalizePlan(
      (overviewUser.plan ?? baseUser.plan) as string | undefined,
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

  if (!user || !mergedUser) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl sm:rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-4 sm:my-6 lg:my-8 overflow-hidden">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 py-8 sm:py-12 md:py-16 rounded-2xl sm:rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-4 sm:mt-6 mb-6 sm:mb-8 lg:mb-10">
            <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
              <div className="flex flex-col lg:flex-row items-center space-y-4 sm:space-y-6 lg:space-y-0 lg:space-x-8">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-gray-300 animate-pulse" />
                <div className="flex-1 text-center lg:text-left">
                  <div className="h-8 w-64 bg-gray-300 rounded animate-pulse mx-auto lg:mx-0 mb-3" />
                  <div className="h-5 w-96 bg-gray-300 rounded animate-pulse mx-auto lg:mx-0" />
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="lg:col-span-2 space-y-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl sm:rounded-3xl p-6"
                  >
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl sm:rounded-3xl p-6"
                  >
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
                    <div className="space-y-3">
                      <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                      <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
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

  const avatarInitial = mergedUser.name?.charAt(0)?.toUpperCase?.() ?? "A";
  const extendedUser = mergedUser;

  const statsToRender = (profileOverview?.stats ?? []).slice(0, 3);
  const quickActionsToRender =
    profileOverview?.quickActions ?? fallbackQuickActions;

  const customQuickActions = [
    ...(!review
      ? [
          {
            id: "leave-review",
            title: "Оставить отзыв",
            description: "Поделитесь своим мнением",
            href: "#",
            icon: "Star",
            color: "from-yellow-400 to-amber-500 text-white",
          },
        ]
      : []),
    ...quickActionsToRender,
  ];
  const achievementsToRender = profileOverview?.achievements ?? [];
  const recentActivityToRender = (
    profileOverview?.recentActivity ?? []
  ).slice(0, 6);
  const billingHistoryData = profileOverview?.billingHistory ?? [];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl sm:rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-4 sm:my-6 lg:my-8 overflow-hidden">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 py-5 sm:py-10 md:py-14 rounded-2xl sm:rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-4 sm:mt-6 mb-6 sm:mb-8 lg:mb-10">
          <div className="absolute inset-0 bg-black/10" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <div className="flex flex-col lg:flex-row items-center space-y-3 sm:space-y-6 lg:space-y-0 lg:space-x-8">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-18 h-18 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold shadow-2xl overflow-hidden">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Avatar"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    avatarInitial
                  )}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  aria-label="Загрузить аватар"
                  className="absolute inset-0 w-18 h-18 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-200 cursor-pointer"
                >
                  <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center border-2 border-white">
                  {isUploadingAvatar ? (
                    <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="text-center lg:text-left text-white flex-1">
                <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2">
                  {user.name}
                </h1>
                <p className="text-xs sm:text-base md:text-lg lg:text-xl text-white/80 mb-2 sm:mb-4">
                  {extendedUser.university || "Университет не указан"}
                  {extendedUser.country && (
                    <span className="ml-2 text-white/60">
                      &middot; {extendedUser.country}
                    </span>
                  )}
                  {extendedUser.city && (
                    <span className="ml-2 text-white/60">
                      &middot; {extendedUser.city}
                    </span>
                  )}
                </p>
                {avatarError && (
                  <p className="text-xs text-red-300 mb-2">{avatarError}</p>
                )}
                <div className="flex flex-wrap justify-center lg:justify-start gap-1.5 sm:gap-3 md:gap-4 text-xs sm:text-sm md:text-base">
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
              {statsToRender.length > 0 && (
                <div className="w-full lg:w-auto grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 max-w-sm lg:max-w-none">
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
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
          {profileError && (
            <div
              role="alert"
              className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700"
            >
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm sm:text-base leading-relaxed">
                {profileError}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {reviewError && (
            <div
              role="alert"
              className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm"
            >
              {reviewError}
            </div>
          )}
          {reviewStatusMessage && (
            <div
              className={`mb-4 p-3 rounded text-sm ${
                review?.status === "REJECTED"
                  ? "bg-red-50 text-red-700"
                  : review?.status === "APPROVED"
                    ? "bg-green-50 text-green-700"
                    : "bg-blue-50 text-blue-700"
              }`}
            >
              {reviewStatusMessage}
            </div>
          )}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
              Быстрые действия
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-4 lg:gap-6">
              {customQuickActions.map((action) => {
                const Icon = getIconByName(action.icon);
                const isReviewAction = action.id === "leave-review";
                const card = (
                  <Card
                    className={`${profileCardClass} cursor-pointer h-full ${
                      isProfileLoading ? "animate-pulse" : ""
                    }`}
                    style={profileCardStyle}
                  >
                    <CardContent className="p-2.5 sm:p-6 relative z-10 flex flex-col h-full">
                      <div
                        className={`w-9 h-9 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-1.5 sm:mb-4 shadow-lg flex-shrink-0`}
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
                );
                if (isReviewAction) {
                  return (
                    <button
                      key={action.id}
                      onClick={() => setIsReviewModalOpen(true)}
                      className="w-full text-left"
                    >
                      {card}
                    </button>
                  );
                }
                return (
                  <Link key={action.id} href={action.href}>
                    {card}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Review Modal */}
          <ReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            review={review}
            loading={reviewLoading}
            error={reviewError}
            saving={reviewSaving}
            saveError={reviewSaveError}
            statusMessage={reviewStatusMessage}
            onSave={async (data) => {
              await saveReview(data);
              setTimeout(() => setIsReviewModalOpen(false), 2000);
            }}
          />

          {/* Billing & Invoices */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                История платежей
              </h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  className="flex items-center justify-center space-x-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-300 text-sm sm:text-base py-2 px-3 sm:px-4"
                  onClick={() =>
                    setIsBillingHistoryOpen(!isBillingHistoryOpen)
                  }
                  aria-expanded={isBillingHistoryOpen}
                >
                  <Receipt className="h-4 w-4" />
                  <span>
                    {isBillingHistoryOpen ? "Скрыть" : "Показать"}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${
                      isBillingHistoryOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
                <Link href="/payment/test" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-300 text-sm sm:text-base py-2 px-3 sm:px-4"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span className="whitespace-nowrap">
                      Управление подпиской
                    </span>
                  </Button>
                </Link>
              </div>
            </div>

            {isBillingHistoryOpen && (
              <Card className={profileCardClass} style={profileCardStyle}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <Receipt className="h-5 w-5 text-white" />
                    </div>
                    <span>Счета и платежи</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {billingHistoryData.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Receipt className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">Нет истории платежей</p>
                      <p className="text-sm mt-1">
                        Платежи появятся здесь после оформления подписки
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {billingHistoryData.map((invoice) => (
                          <div
                            key={invoice.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all duration-300 group gap-3 sm:gap-0"
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
                                  <span className="hidden sm:inline">
                                    &middot;
                                  </span>
                                  <span className="truncate">
                                    {new Date(
                                      invoice.date,
                                    ).toLocaleDateString("ru-RU")}
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
                                    showToast(
                                      `Просмотр счёта ${invoice.invoiceNumber} скоро будет доступен`,
                                    )
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
                                      showToast(
                                        `Скачивание счёта ${invoice.invoiceNumber} скоро будет доступно`,
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
                            Всего счетов: {billingHistoryData.length}
                          </span>
                          <span>
                            Общая сумма:{" "}
                            {billingHistoryData
                              .filter((inv) => inv.status === "paid")
                              .reduce((sum, inv) => sum + inv.amount, 0)}{" "}
                            ₽
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column - Personal Info */}
            <div className="lg:col-span-1 space-y-6">
              <Card className={profileCardClass} style={profileCardStyle}>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold">
                      Личная информация
                    </span>
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
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-700 lg:hover:from-blue-700 lg:hover:to-purple-800 text-white shadow-lg transition-all duration-300 h-12 font-bold text-base"
                    onClick={() => setIsEditFormVisible(true)}
                  >
                    <Edit className="mr-3 h-5 w-5" />
                    Редактировать профиль
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Settings (Desktop) */}
              <div className="hidden lg:block">
                <SettingsPanel
                  isOpen={isSettingsOpen}
                  onToggle={() => setIsSettingsOpen(!isSettingsOpen)}
                  onLogout={handleLogout}
                  showToast={showToast}
                />
              </div>
            </div>

            {/* Right Column - Activity & Achievements */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Activity */}
              <Card className={profileCardClass} style={profileCardStyle}>
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
                  {recentActivityToRender.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Activity className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">Нет недавней активности</p>
                      <p className="text-sm mt-1">
                        Ваши действия будут отображаться здесь
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivityToRender.map((activity) => {
                        const Icon = getIconByName(activity.icon);
                        const activityTime = formatRelativeTime(
                          activity.timestamp,
                        );
                        const gradient =
                          activityGradientMap[activity.color] ??
                          "from-slate-400 to-slate-600";
                        return (
                          <div
                            key={activity.id}
                            className="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors duration-200"
                          >
                            <div
                              className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
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
                  )}
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card className={profileCardClass} style={profileCardStyle}>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold">Достижения</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  {achievementsToRender.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Award className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">
                        Достижения появятся позже
                      </p>
                      <p className="text-sm mt-1">
                        Продолжайте использовать платформу
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Settings (Mobile & Tablet) */}
              <div className="lg:hidden">
                <SettingsPanel
                  isOpen={isSettingsOpen}
                  onToggle={() => setIsSettingsOpen(!isSettingsOpen)}
                  onLogout={handleLogout}
                  showToast={showToast}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        {extendedUser && (
          <ProfileEditForm
            key={`${extendedUser.name}-${extendedUser.university}`}
            user={extendedUser}
            onSave={async (data) => {
              const ok = await updateProfile(data);
              if (ok) showToast("Профиль обновлён");
              return ok;
            }}
            onCancel={() => setIsEditFormVisible(false)}
            isVisible={isEditFormVisible}
          />
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl text-sm animate-in slide-in-from-bottom-4 duration-300 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
            {toastMessage}
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-white/60 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
