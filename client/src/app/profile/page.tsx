"use client";

import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { PREMIUM_CHECKOUT_PATH } from "@/constants/routes";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FeaturePreviewGate } from "@/components/auth/FeaturePreviewGate";
import {
  User,
  Mail,
  Calendar,
  CalendarClock,
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
  Sparkles,
  Home,
  Users,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchProfileOverview,
  API_BASE_URL,
  getPayment,
} from "@/lib/api";
import {
  User as UserType,
  Plan,
  PaymentStatus,
  ProfileOverview,
  ProfileQuickAction,
  ProfileBillingItem,
  ProfileActivityItem,
  Role,
  Language,
} from "@/types";
import { useReview } from "@/hooks/useReview";
import { ProfileAccountSettings } from "@/components/ui/profile-account-settings";
import { ProfileEditForm } from "@/components/ui/profile-edit-form";
import { ReviewModal } from "@/components/ReviewModal";
import { localizePaymentDescription } from "@/lib/payment-i18n";
import { guideArticlePath, guidePathBySection } from "@/lib/guide-routes";
import { educationGuides } from "@/data/education-guides";
import { lifeGuides } from "@/data/life-guides";

interface ExtendedUser extends UserType {
  university?: string;
  faculty?: string;
  year?: string;
  phone?: string;
  gender?: string;
  city?: string;
  country?: string;
}

const getLocaleByLanguage = (language?: Language): string => {
  const map: Record<string, string> = {
    [Language.EN]: "en-US",
    [Language.FR]: "fr-FR",
    [Language.AR]: "ar",
    [Language.ZH]: "zh-CN",
    [Language.RU]: "ru-RU",
  };
  return (language && map[language]) || "ru-RU";
};

const formatRelativeTime = (timestamp: string, locale: string) => {
  const relativeTimeFormatter = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
  });
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

  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
};
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
  CalendarClock,
  BookOpen,
  Bell,
  ScanLine,
  HelpCircle,
  Award,
  Trophy,
  Home,
  Users,
  GraduationCap,
  Crown,
  Sparkles,
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
  t,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onLogout: () => void;
  t: (key: string) => string;
}) {
  return (
    <Card
      className={`${profileCardClass} animate-fade-in-up overflow-hidden`}
      style={profileCardStyle}
    >
      <CardHeader
        className="relative z-10 cursor-pointer select-none px-4 py-4 sm:px-6 sm:py-5"
        onClick={onToggle}
        role="button"
        aria-expanded={isOpen}
      >
        <CardTitle className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white sm:h-10 sm:w-10 sm:rounded-2xl">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-base font-bold tracking-tight text-slate-900 sm:text-xl">
                {t("profile.settings.title")}
              </span>
            </div>
          </div>
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            <ChevronDown className="h-4 w-4 text-slate-600" />
          </div>
        </CardTitle>
      </CardHeader>
      <div
        className={`relative z-10 overflow-hidden transition-all duration-300 ease-out ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <CardContent className="space-y-4 px-4 pb-5 pt-0 sm:space-y-5 sm:px-6 sm:pb-6">
          <ProfileAccountSettings onLogout={onLogout} t={t} />

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
            <div className="divide-y divide-slate-100 p-2 sm:p-2.5">
              <Button
                variant="ghost"
                onClick={onLogout}
                className="h-11 w-full justify-start rounded-xl px-3 text-sm font-medium text-slate-800 shadow-none hover:bg-slate-50"
              >
                <LogOut className="mr-2.5 h-4 w-4 text-slate-500" />
                {t("profile.settings.logout")}
                <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
              </Button>
              <Button
                variant="ghost"
                disabled
                title={t("profile.settings.comingSoon")}
                className="h-11 w-full justify-start rounded-xl px-3 text-sm font-medium text-red-600 opacity-55 shadow-none cursor-not-allowed"
              >
                <Trash2 className="mr-2.5 h-4 w-4" />
                {t("profile.settings.deleteAccount")}
                <span className="ml-auto text-[11px] font-medium text-slate-400">
                  {t("profile.settings.comingSoon")}
                </span>
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function resolveGuideFromActivity(item: {
  meta?: Record<string, unknown>;
}) {
  const type = item.meta?.guideType;
  const id = item.meta?.guideId;
  if (typeof type !== "string" || typeof id !== "string") {
    return null;
  }
  const list = type === "life" ? lifeGuides : educationGuides;
  return list.find((guide) => guide.id === id) ?? null;
}

function activityGuideHref(activity: ProfileActivityItem): string {
  const type = activity.meta?.guideType;
  const id = activity.meta?.guideId;
  const guide = resolveGuideFromActivity(activity);
  if (guide) return guideArticlePath(guide);
  if ((type === "life" || type === "education") && typeof id === "string") {
    return guidePathBySection(type, id);
  }
  return type === "life" ? "/life-guide" : "/education-guide";
}

function ProfilePreviewFallback() {
  const { t } = useTranslation();
  return (
    <FeaturePreviewGate
      featureName={t("profile.preview.feature")}
      previewTitle={t("profile.preview.title")}
      previewText={t("profile.preview.text")}
    />
  );
}

function ProfileContent() {
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditFormVisible, setIsEditFormVisible] = useState(false);
  const [isBillingHistoryOpen, setIsBillingHistoryOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<ProfileBillingItem | null>(
    null,
  );
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  useBodyScrollLock(!!viewingInvoice);
  const [deferBelowFold, setDeferBelowFold] = useState(false);
  const [profileOverview, setProfileOverview] =
    useState<ProfileOverview | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const paymentSyncAttemptedRef = useRef(false);
  const { user, logout, updateProfile, syncUser } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const {
    review,
    loading: reviewLoading,
    error: reviewError,
    saving: reviewSaving,
    saveError: reviewSaveError,
    createOrUpdate: saveReview,
  } = useReview();

  const locale = getLocaleByLanguage(currentLanguage);

  const fallbackQuickActions = useMemo<ProfileQuickAction[]>(
    () => [
      {
        id: "dashboard",
        title: t("profile.quickAction.dashboard.title"),
        description: t("profile.quickAction.dashboard.desc"),
        icon: "Home",
        color: "from-slate-500 to-slate-700",
        href: "/dashboard",
      },
      {
        id: "achievements",
        title: t("profile.quickAction.achievements.title"),
        description: t("profile.quickAction.achievements.desc"),
        icon: "Trophy",
        color: "from-amber-500 to-orange-500",
        href: "/achievements",
      },
      {
        id: "education-guide",
        title: t("profile.quickAction.educationGuide.title"),
        description: t("profile.quickAction.educationGuide.desc"),
        icon: "BookOpen",
        color: "from-blue-500 to-blue-600",
        href: "/education-guide",
      },
      {
        id: "life-guide",
        title: t("profile.quickAction.lifeGuide.title"),
        description: t("profile.quickAction.lifeGuide.desc"),
        icon: "Home",
        color: "from-emerald-500 to-teal-600",
        href: "/life-guide",
      },
      {
        id: "smart-reminders",
        title: t("profile.quickAction.reminders.title"),
        description: t("profile.quickAction.reminders.desc"),
        icon: "CalendarClock",
        color: "from-purple-500 to-indigo-600",
        href: "/reminders",
      },
      {
        id: "ai-assistant",
        title: t("profile.quickAction.ai.title"),
        description: t("profile.quickAction.ai.desc"),
        icon: "Sparkles",
        color: "from-violet-500 to-indigo-600",
        href: "/ai-helper",
      },
      {
        id: "docscan",
        title: t("profile.quickAction.docscan.title"),
        description: t("profile.quickAction.docscan.desc"),
        icon: "ScanLine",
        color: "from-indigo-500 to-indigo-600",
        href: "/docscan",
      },
      {
        id: "community",
        title: t("dashboard.quickActions.community.title"),
        description: t("dashboard.quickActions.community.description"),
        icon: "Users",
        color: "from-pink-500 to-rose-600",
        href: "/community/questions",
      },
      {
        id: "support",
        title: t("profile.quickAction.support.title"),
        description: t("profile.quickAction.support.desc"),
        icon: "HelpCircle",
        color: "from-green-500 to-green-600",
        href: "/support",
      },
    ],
    [t],
  );

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const invoiceStatusLabel = useCallback(
    (status: string) => {
      if (status === "paid") return t("profile.billing.status.paid");
      if (status === "free") return t("profile.billing.status.active");
      return t("profile.billing.status.pending");
    },
    [t],
  );

  const downloadInvoiceReceipt = useCallback(
    (invoice: ProfileBillingItem) => {
      const desc = localizePaymentDescription(invoice.description, t);
      const status = invoiceStatusLabel(invoice.status);
      const amount =
        invoice.status === "free"
          ? t("profile.billing.amount.free")
          : `${invoice.amount} ${invoice.currency || "RUB"}`;
      const date = new Date(invoice.date).toLocaleDateString(locale);
      const method = invoice.paymentMethod || "—";
      const html = `<!DOCTYPE html>
<html lang="${currentLanguage?.toLowerCase?.() || "ru"}">
<head><meta charset="utf-8"/><title>${invoice.invoiceNumber}</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:40px auto;padding:24px;color:#0f172a}
  h1{font-size:20px;margin:0 0 8px} .muted{color:#64748b;font-size:14px}
  .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e2e8f0}
  .amount{font-size:24px;font-weight:700;margin-top:16px}
</style></head>
<body>
  <h1>AdaptEd Russia</h1>
  <p class="muted">${t("profile.billing.invoice.receipt")}</p>
  <div class="row"><span>${t("profile.billing.invoice.number")}</span><strong>${invoice.invoiceNumber}</strong></div>
  <div class="row"><span>${t("profile.billing.invoice.date")}</span><strong>${date}</strong></div>
  <div class="row"><span>${t("profile.billing.invoice.description")}</span><strong>${desc}</strong></div>
  <div class="row"><span>${t("profile.billing.invoice.status")}</span><strong>${status}</strong></div>
  <div class="row"><span>${t("profile.billing.invoice.method")}</span><strong>${method}</strong></div>
  <p class="amount">${amount}</p>
</body></html>`;
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoiceNumber}.html`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t("profile.billing.invoice.downloaded"));
    },
    [t, locale, currentLanguage, invoiceStatusLabel, showToast],
  );

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
      setAvatarError(t("profile.avatar.invalidType"));
      return;
    }
    if (file.size > 5_000_000) {
      setAvatarError(t("profile.avatar.tooLarge"));
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
        showToast(t("profile.avatar.updated"));
      } else {
        setAvatarError(t("profile.avatar.uploadFailed"));
      }
    } catch {
      setAvatarError(t("profile.avatar.uploadError"));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  useEffect(() => {
    loadAvatar();
  }, [loadAvatar]);

  // Отложенный рендер блоков под сгибом — улучшает Performance (меньше DOM при первой отрисовке)
  useEffect(() => {
    const id = requestAnimationFrame(() => setDeferBelowFold(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const loadProfileOverview = useCallback(async () => {
    if (!user) return;
    setIsProfileLoading(true);
    setProfileError(null);
    try {
      const data = await fetchProfileOverview();
      setProfileOverview(data);
      const nextPlan = normalizePlan(data?.user?.plan);
      const currentPlan = normalizePlan(user.plan);
      if (nextPlan !== currentPlan) {
        syncUser({ plan: nextPlan });
      }

      if (
        !paymentSyncAttemptedRef.current &&
        nextPlan !== Plan.PREMIUM
      ) {
        const pendingPayment = data.billingHistory?.find(
          (invoice) => invoice.status === "pending",
        );
        if (pendingPayment) {
          paymentSyncAttemptedRef.current = true;
          const latestPayment = await getPayment(pendingPayment.id);
          if (latestPayment.status === PaymentStatus.SUCCEEDED) {
            const refreshed = await fetchProfileOverview();
            setProfileOverview(refreshed);
            const refreshedPlan = normalizePlan(refreshed?.user?.plan);
            if (refreshedPlan !== currentPlan) {
              syncUser({ plan: refreshedPlan });
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load profile overview:", error);
      setProfileError(t("profile.error.loadFailed"));
    } finally {
      setIsProfileLoading(false);
    }
  }, [user, syncUser, t]);

  useEffect(() => {
    loadProfileOverview();
  }, [loadProfileOverview]);

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

  if (!mergedUser) {
    return (
        <Layout>
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
          </div>
        </Layout>
    );
  }

  const avatarInitial = mergedUser.name?.charAt(0)?.toUpperCase?.() ?? "A";
  const extendedUser = mergedUser;

  const STAT_I18N: Record<string, { title: string; period: string }> = {
    "guides-viewed": {
      title: "profile.stat.guidesViewed.title",
      period: "profile.stat.guidesViewed.period",
    },
    "active-reminders": {
      title: "profile.stat.activeReminders.title",
      period: "profile.stat.activeReminders.period",
    },
    "ai-questions": {
      title: "profile.stat.aiQuestions.title",
      period: "profile.stat.aiQuestions.period",
    },
  };

  const ACHIEVEMENT_I18N: Record<string, { title: string; desc: string }> = {
    "first-steps": {
      title: "profile.achievement.firstSteps.title",
      desc: "profile.achievement.firstSteps.desc",
    },
    "active-student": {
      title: "profile.achievement.activeStudent.title",
      desc: "profile.achievement.activeStudent.desc",
    },
    "ai-expert": {
      title: "profile.achievement.aiExpert.title",
      desc: "profile.achievement.aiExpert.desc",
    },
    "adaptation-master": {
      title: "profile.achievement.adaptationMaster.title",
      desc: "profile.achievement.adaptationMaster.desc",
    },
  };

  const localizeActivityTitle = (item: {
    type: string;
    title: string;
    meta?: Record<string, unknown>;
  }): string => {
    const prefixes: Record<string, { key: string; ru: string[] }> = {
      task: {
        key: "profile.activity.taskDone",
        ru: ["Завершена задача: "],
      },
      reminder: {
        key: "profile.activity.reminder",
        ru: ["Напоминание: "],
      },
      ai: {
        key: "profile.activity.ai",
        ru: ["Вопрос к AI: "],
      },
      payment: {
        key: "profile.activity.payment",
        ru: ["Платёж: ", "Платеж: "],
      },
      guide: {
        key: "profile.activity.guide",
        ru: ["Прочитан гайд: "],
      },
    };
    const cfg = prefixes[item.type];
    if (!cfg) return item.title;
    let subject = item.title;
    for (const p of cfg.ru) {
      if (subject.startsWith(p)) {
        subject = subject.slice(p.length);
        break;
      }
    }
    if (item.type === "guide") {
      subject = resolveGuideFromActivity(item)?.title ?? subject;
    }
    return t(cfg.key).replace("{title}", subject);
  };

  const statsToRender = (profileOverview?.stats ?? []).slice(0, 3).map((stat) => {
    const keys = STAT_I18N[stat.id];
    if (!keys) return stat;
    return {
      ...stat,
      title: t(keys.title),
      period: t(keys.period),
    };
  });

  // Always translate on client — API hardcodes RU titles
  const quickActionsToRender = fallbackQuickActions;

  const reviewCardTitle = review
    ? t("profile.quickAction.editReview")
    : t("profile.quickAction.leaveReview");
  const reviewCardDescription = !review
    ? t("profile.quickAction.reviewDesc.new")
    : review.status === "PENDING"
      ? t("profile.quickAction.reviewDesc.pending")
      : review.status === "APPROVED"
        ? t("profile.quickAction.reviewDesc.approved")
        : t("profile.quickAction.reviewDesc.rejected");

  const customQuickActions = [
    {
      id: "leave-review",
      title: reviewCardTitle,
      description: reviewCardDescription,
      href: "#",
      icon: "Star",
      color: "from-yellow-400 to-amber-500 text-white",
      reviewStatus: review?.status,
    },
    ...quickActionsToRender,
  ];
  const achievementsToRender = (profileOverview?.achievements ?? []).map(
    (achievement) => {
      const keys = ACHIEVEMENT_I18N[achievement.id];
      if (!keys) return achievement;
      return {
        ...achievement,
        title: t(keys.title),
        description: t(keys.desc),
      };
    },
  );
  const recentActivityToRender = (profileOverview?.recentActivity ?? [])
    .slice(0, 6)
    .map((item) => ({
      ...item,
      title: localizeActivityTitle(item),
    }));
  const billingHistoryData = profileOverview?.billingHistory ?? [];

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 py-5 sm:py-10 md:py-14 rounded-2xl sm:rounded-3xl mt-4 sm:mt-6 mb-6 sm:mb-8">
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
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold shadow-2xl overflow-hidden">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={t("profile.avatar.alt")}
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
                  aria-label={t("profile.avatar.uploadAria")}
                  className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-200 cursor-pointer"
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
                  {extendedUser.name}
                </h1>
                <p className="text-xs sm:text-base md:text-lg lg:text-xl text-white/80 mb-2 sm:mb-4">
                  {extendedUser.university || t("profile.hero.universityMissing")}
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
                    {extendedUser.faculty || t("profile.hero.facultyMissing")}
                  </span>
                  <span className="inline-flex items-center px-2 sm:px-3 md:px-4 py-1 md:py-2 rounded-full bg-white/20 backdrop-blur-sm">
                    <Calendar className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                    {extendedUser.year || t("profile.hero.yearMissing")}
                  </span>
                  {extendedUser.plan === Plan.PREMIUM ? (
                    <span className="inline-flex items-center px-2 sm:px-3 md:px-4 py-1 md:py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
                      <Crown className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      {t("home.pricing.premium")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex items-center px-2 sm:px-3 md:px-4 py-1 md:py-2 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30">
                        <Zap className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                        {t("home.pricing.freemium")}
                      </span>
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

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl sm:rounded-3xl">
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
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
              {t("profile.quickActions.title")}
            </h2>
            <div className="grid auto-rows-fr grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {customQuickActions.map((action) => {
                const Icon = getIconByName(action.icon);
                const isReviewAction = action.id === "leave-review";
                const reviewStatus = "reviewStatus" in action ? (action as { reviewStatus?: string }).reviewStatus : undefined;
                const statusBadge =
                  reviewStatus === "PENDING"
                    ? {
                        label: t("profile.review.badge.pending"),
                        className: "bg-amber-100 text-amber-800",
                      }
                    : reviewStatus === "APPROVED"
                      ? {
                          label: t("profile.review.badge.approved"),
                          className: "bg-green-100 text-green-800",
                        }
                      : reviewStatus === "REJECTED"
                        ? {
                            label: t("profile.review.badge.rejected"),
                            className: "bg-red-100 text-red-800",
                          }
                        : null;
                const card = (
                  <Card
                    className={`${profileCardClass} cursor-pointer h-full hover:-translate-y-0.5 transition-transform ${
                      isProfileLoading ? "animate-pulse" : ""
                    }`}
                    style={profileCardStyle}
                  >
                    <CardContent className="p-4 sm:p-5 relative z-10">
                      {statusBadge && (
                        <span
                          className={`absolute top-2.5 right-2.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </span>
                      )}
                      <div className="flex items-start gap-3.5 sm:gap-4">
                        <div
                          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md shrink-0`}
                        >
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="min-w-0 pr-12">
                          <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug line-clamp-2">
                            {action.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600 leading-snug line-clamp-2">
                            {action.description}
                          </p>
                        </div>
                      </div>
                      {review?.status === "APPROVED" && isReviewAction && (
                        <p className="mt-2 text-xs sm:text-sm text-green-700 bg-green-50 rounded-lg px-2 py-1">
                          {t("profile.review.status.approved")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
                if (isReviewAction) {
                  return (
                    <button
                      key={action.id}
                      onClick={() => setIsReviewModalOpen(true)}
                      className="h-full w-full text-left"
                    >
                      {card}
                    </button>
                  );
                }
                return (
                  <Link key={action.id} href={action.href} className="block h-full">
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
            onSave={async (data) => {
              await saveReview(data);
              showToast(t("profile.review.submitted"));
              setTimeout(() => setIsReviewModalOpen(false), 800);
            }}
          />

          {deferBelowFold && (
          <>
          {/* Billing & Invoices */}
          <div id="profile-billing-section">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {t("profile.billing.title")}
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
                    {isBillingHistoryOpen
                      ? t("profile.billing.hide")
                      : t("profile.billing.show")}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${
                      isBillingHistoryOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
                <Link href={PREMIUM_CHECKOUT_PATH} className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-300 text-sm sm:text-base py-2 px-3 sm:px-4"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span className="whitespace-nowrap">
                      {t("profile.billing.manageSubscription")}
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
                    <span>{t("profile.billing.invoicesTitle")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {billingHistoryData.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Receipt className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">{t("profile.billing.empty.title")}</p>
                      <p className="text-sm mt-1">
                        {t("profile.billing.empty.desc")}
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
                                  {localizePaymentDescription(
                                    invoice.description,
                                    t,
                                  )}
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-slate-600">
                                  <span className="truncate">
                                    {invoice.invoiceNumber}
                                  </span>
                                  <span className="hidden sm:inline">
                                    &middot;
                                  </span>
                                  <span className="truncate">
                                    {new Date(invoice.date).toLocaleDateString(locale)}
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
                                    ? t("profile.billing.amount.free")
                                    : `${invoice.amount} ₽`}
                                </p>
                                <p className="text-xs sm:text-sm text-slate-500 capitalize">
                                  {invoice.status === "paid"
                                    ? t("profile.billing.status.paid")
                                    : invoice.status === "free"
                                      ? t("profile.billing.status.active")
                                      : t("profile.billing.status.pending")}
                                </p>
                              </div>

                              <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  aria-label={t("profile.billing.invoice.view")}
                                  title={t("profile.billing.invoice.view")}
                                  onClick={() => setViewingInvoice(invoice)}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-slate-200"
                                >
                                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                                {invoice.status === "paid" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    aria-label={t(
                                      "profile.billing.invoice.download",
                                    )}
                                    title={t("profile.billing.invoice.download")}
                                    onClick={() =>
                                      downloadInvoiceReceipt(invoice)
                                    }
                                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-slate-200"
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
                            {t("profile.billing.totalInvoices")}{" "}
                            {billingHistoryData.length}
                          </span>
                          <span>
                            {t("profile.billing.totalAmount")}{" "}
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
                      {t("profile.personalInfo.title")}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50">
                      <Mail className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500">{t("profile.personalInfo.email")}</p>
                        <p className="font-medium text-slate-900">
                          {extendedUser.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50">
                      <Phone className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500">{t("profile.personalInfo.phone")}</p>
                        <p className="font-medium text-slate-900">
                          {extendedUser.phone || t("profile.personalInfo.phoneMissing")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50">
                      <User className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500">{t("profile.personalInfo.gender")}</p>
                        <p className="font-medium text-slate-900">
                          {extendedUser.gender === "male"
                            ? t("profile.personalInfo.gender.male")
                            : extendedUser.gender === "female"
                              ? t("profile.personalInfo.gender.female")
                              : t("profile.personalInfo.gender.unspecified")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-700 lg:hover:from-blue-700 lg:hover:to-purple-800 text-white shadow-lg transition-all duration-300 h-12 font-bold text-base"
                    onClick={() => setIsEditFormVisible(true)}
                  >
                    <Edit className="mr-3 h-5 w-5" />
                    {t("profile.personalInfo.edit")}
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
                  t={t}
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
                      {t("profile.activity.title")}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  {recentActivityToRender.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Activity className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">{t("profile.activity.empty.title")}</p>
                      <p className="text-sm mt-1">
                        {t("profile.activity.empty.desc")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivityToRender.map((activity) => {
                        const Icon = getIconByName(activity.icon);
                        const activityTime = formatRelativeTime(
                          activity.timestamp,
                          locale,
                        );
                        const gradient =
                          activityGradientMap[activity.color] ??
                          "from-slate-400 to-slate-600";

                        const href =
                          activity.type === "ai"
                            ? "/ai-helper"
                            : activity.type === "reminder" ||
                                activity.type === "task"
                              ? "/reminders"
                              : activity.type === "guide"
                                ? activityGuideHref(activity)
                                : activity.type === "payment"
                                  ? null
                                  : "/dashboard";

                        const openPaymentActivity = () => {
                          const paymentId = activity.id.replace(
                            /^payment-/,
                            "",
                          );
                          const invoice = billingHistoryData.find(
                            (inv) => inv.id === paymentId,
                          );
                          setIsBillingHistoryOpen(true);
                          if (invoice) {
                            setViewingInvoice(invoice);
                          } else {
                            // scroll billing into view after expand
                            requestAnimationFrame(() => {
                              document
                                .getElementById("profile-billing-section")
                                ?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                });
                            });
                          }
                        };

                        const rowClassName =
                          "flex w-full items-center space-x-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors duration-200 cursor-pointer text-left";

                        const rowInner = (
                          <>
                            <div
                              className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
                            >
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 truncate">
                                {activity.title}
                              </p>
                              <p className="text-sm text-slate-500">
                                {activityTime}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          </>
                        );

                        if (activity.type === "payment") {
                          return (
                            <button
                              key={activity.id}
                              type="button"
                              onClick={openPaymentActivity}
                              className={rowClassName}
                            >
                              {rowInner}
                            </button>
                          );
                        }

                        return (
                          <Link
                            key={activity.id}
                            href={href || "/dashboard"}
                            className={rowClassName}
                          >
                            {rowInner}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card className={profileCardClass} style={profileCardStyle}>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center justify-between gap-3">
                    <Link
                      href="/achievements"
                      className="flex items-center space-x-3 group"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                        <Award className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-xl font-bold group-hover:text-amber-700 transition-colors">
                        {t("profile.achievements.title")}
                      </span>
                    </Link>
                    <Link
                      href="/achievements"
                      className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800"
                    >
                      {t("profile.achievements.viewAll")}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  {achievementsToRender.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Award className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">
                        {t("profile.achievements.empty.title")}
                      </p>
                      <p className="text-sm mt-1">
                        {t("profile.achievements.empty.desc")}
                      </p>
                      <Link
                        href="/achievements"
                        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800"
                      >
                        {t("profile.achievements.viewAll")}
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {achievementsToRender.map((achievement) => {
                        const Icon = getIconByName(achievement.icon);
                        return (
                          <Link
                            key={achievement.id}
                            href={`/achievements#${achievement.id}`}
                            className={`block p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                              achievement.unlocked
                                ? "border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 hover:shadow-md"
                                : "border-slate-200 bg-slate-50 opacity-60 hover:opacity-80 hover:bg-slate-100"
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
                              <div className="flex-1 min-w-0">
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
                              {achievement.unlocked ? (
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                              )}
                            </div>
                          </Link>
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
                  t={t}
                />
              </div>
            </div>
          </div>
          </>
          )}

        </div>

        {/* Profile Edit Form */}
        {extendedUser && (
          <ProfileEditForm
            key={`${extendedUser.name}-${extendedUser.university}`}
            user={extendedUser}
            onSave={async (data) => {
              const ok = await updateProfile(data);
              if (ok) showToast(t("profile.profileUpdated"));
              return ok;
            }}
            onCancel={() => setIsEditFormVisible(false)}
            isVisible={isEditFormVisible}
          />
        )}

        {/* Invoice detail modal */}
        {viewingInvoice && (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-modal-title"
            onClick={() => setViewingInvoice(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl overscroll-contain"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3
                    id="invoice-modal-title"
                    className="text-lg font-bold text-slate-900"
                  >
                    {t("profile.billing.invoice.details")}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {viewingInvoice.invoiceNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingInvoice(null)}
                  aria-label={t("profile.billing.invoice.close")}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                  <span className="text-slate-500">
                    {t("profile.billing.invoice.description")}
                  </span>
                  <span className="font-medium text-right text-slate-900">
                    {localizePaymentDescription(viewingInvoice.description, t)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                  <span className="text-slate-500">
                    {t("profile.billing.invoice.date")}
                  </span>
                  <span className="font-medium text-slate-900">
                    {new Date(viewingInvoice.date).toLocaleDateString(locale)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                  <span className="text-slate-500">
                    {t("profile.billing.invoice.status")}
                  </span>
                  <span className="font-medium text-slate-900">
                    {invoiceStatusLabel(viewingInvoice.status)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                  <span className="text-slate-500">
                    {t("profile.billing.invoice.method")}
                  </span>
                  <span className="font-medium text-slate-900">
                    {viewingInvoice.paymentMethod || "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4 pt-1">
                  <span className="text-slate-500">
                    {t("profile.billing.invoice.amount")}
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    {viewingInvoice.status === "free"
                      ? t("profile.billing.amount.free")
                      : `${viewingInvoice.amount} ₽`}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                {viewingInvoice.status === "paid" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => downloadInvoiceReceipt(viewingInvoice)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t("profile.billing.invoice.download")}
                  </Button>
                )}
                <Button type="button" onClick={() => setViewingInvoice(null)}>
                  {t("profile.billing.invoice.close")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="fixed left-1/2 top-20 z-[110] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 animate-in items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm text-white shadow-2xl slide-in-from-top-4 duration-300">
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

export default function ProfilePage() {
  return (
    <ProtectedRoute fallback={<ProfilePreviewFallback />}>
      <ProfileContent />
    </ProtectedRoute>
  );
}
