"use client";

import { Layout } from "@/components/layout/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Bell,
  MessageSquare,
  Sparkles,
  ArrowUp,
  Crown,
  CreditCard,
  Zap,
  Star,
  Users,
  GraduationCap,
  Globe,
  FileText,
  BookOpenCheck,

  Shield,
  Rocket,
  ScanLine,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  StructuredData,
  websiteStructuredData,
  organizationStructuredData,
} from "@/components/seo/structured-data";
import { useTranslation } from "@/hooks/useTranslation";
import { useEffect, useState, useMemo } from "react";
import { API_BASE_URL } from "@/lib/api";
import { PublicReview, TrustStats as TrustStatsType } from "@/types";
import { HeroTypewriter } from "@/components/home/HeroTypewriter";
import { TrustStats } from "@/components/home/TrustStats";
import { ReviewCard } from "@/components/home/ReviewCard";

export default function HomePage() {
  const { t } = useTranslation();
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [showScrollTopButton, setShowScrollTopButton] = useState(false);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [trustStats, setTrustStats] = useState<TrustStatsType | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollIndicator(window.scrollY === 0);
      setShowScrollTopButton(window.scrollY > 500);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setReviewsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/reviews`);
        if (!res.ok || cancelled) return;
        const body = await res.json();
        if (cancelled) return;
        setReviews(Array.isArray(body.reviews) ? body.reviews : []);
        setTrustStats(body.stats ?? null);
      } catch {
        if (!cancelled) {
          setReviews([]);
          setTrustStats(null);
        }
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const features = useMemo(
    () => [
      {
        icon: BookOpen,
        title: t("home.features.navigator"),
        description: t("home.features.navigator.desc"),
        color: "text-blue-600 bg-blue-50",
        gradient: "from-blue-500 to-blue-600",
        stats: t("home.section.features.stats"),
        href: "/education-guide",
      },
      {
        icon: Sparkles,
        title: t("home.features.reminders"),
        description: t("home.features.reminders.desc"),
        color: "text-purple-600 bg-purple-50",
        gradient: "from-purple-500 to-indigo-600",
        stats: t("home.section.features.stats.notifications"),
        href: "/reminders",
      },
      {
        icon: MessageSquare,
        title: t("home.features.ai"),
        description: t("home.features.ai.desc"),
        color: "text-orange-600 bg-orange-50",
        gradient: "from-orange-500 to-orange-600",
        stats: t("home.section.features.stats.ai"),
        href: "/ai-helper",
      },
      {
        icon: ScanLine,
        title: t("home.features.docscan"),
        description: t("home.features.docscan.desc"),
        color: "text-indigo-600 bg-indigo-50",
        gradient: "from-indigo-500 to-indigo-600",
        stats: t("home.features.docscan.stats"),
        href: "/docscan",
      },
      {
        icon: Users,
        title: t("home.features.community"),
        description: t("home.features.community.desc"),
        color: "text-pink-600 bg-pink-50",
        gradient: "from-pink-500 to-rose-600",
        stats: t("home.section.features.stats.community"),
        href: "/community/questions",
      },
    ],
    [t]
  );

  const benefits = useMemo(
    () => [
      {
        icon: BookOpen,
        title: "Пошаговые инструкции",
        description: "Гайды по учебе, документам и правилам вузов.",
      },
      {
        icon: Bell,
        title: "Умные напоминания",
        description: "Не пропускайте важные даты: регистрация, экзамены, документы.",
      },
      {
        icon: MessageSquare,
        title: "AI-помощник 24/7",
        description: "Получайте быстрые ответы об учебе и жизни в России.",
      },
      {
        icon: Shield,
        title: "Проверенные материалы",
        description: "Гайды основаны на реальном опыте иностранных студентов в российских вузах.",
      },
    ],
    []
  );

  const pricingPlans = useMemo(
    () => [
      {
        name: t("home.pricing.freemium"),
        price: t("home.pricing.freemium.price"),
        description: t("home.pricing.freemium.description"),
        features: [
          t("home.pricing.feature.free.guides"),
          t("home.pricing.feature.free.reminders"),
          t("home.pricing.feature.free.templates"),
          t("home.pricing.feature.free.email"),
          t("home.pricing.feature.free.docscan"),
          t("home.pricing.feature.free.docscan.photo"),
        ],
        popular: false,
        buttonText: t("home.pricing.button.freemium"),
        buttonVariant: "outline" as const,
      },
      {
        name: t("home.pricing.premium"),
        price: t("home.pricing.premium.price"),
        description: t("home.pricing.premium.description"),
        features: [
          t("home.pricing.feature.premium.all"),
          t("home.pricing.feature.premium.unlimited"),
          t("home.pricing.feature.premium.ai"),
          t("home.pricing.feature.premium.templates"),
          t("home.pricing.feature.premium.support"),
          t("home.pricing.feature.premium.plan"),
          t("home.pricing.feature.premium.exclusive"),
          t("home.pricing.feature.premium.docscan.unlimited"),
          t("home.pricing.feature.premium.docscan.ocr"),
          t("home.pricing.feature.premium.docscan.export"),
          t("home.pricing.feature.premium.docscan.merge"),
          t("home.pricing.feature.premium.docscan.cloud"),
          t("home.pricing.feature.premium.docscan.noWatermark"),
        ],
        popular: true,
        buttonText: t("home.pricing.button.premium"),
        buttonVariant: "default" as const,
      },
    ],
    [t]
  );

  const quickStartItems = useMemo(
    () => [
      {
        icon: BookOpen,
        title: t("home.gettingStarted.card1.title"),
        description: t("home.gettingStarted.card1.description"),
        cta: t("home.gettingStarted.card1.cta"),
        href: "/education-guide",
      },
      {
        icon: MessageSquare,
        title: t("home.gettingStarted.card2.title"),
        description: t("home.gettingStarted.card2.description"),
        cta: t("home.gettingStarted.card2.cta"),
        href: "/ai-helper",
      },
      {
        icon: Users,
        title: t("home.gettingStarted.card3.title"),
        description: t("home.gettingStarted.card3.description"),
        cta: t("home.gettingStarted.card3.cta"),
        href: "/community/questions",
      },
    ],
    [t]
  );

  const slogans = useMemo(
    () => [
      t("home.slogan.1"),
      t("home.slogan.2"),
      t("home.slogan.3"),
      t("home.slogan.4"),
    ],
    [t]
  );

  // Typewriter state moved to HeroTypewriter component

  const testimonials = useMemo(
    () => [
      {
        name: t("home.testimonial.1.name"),
        country: t("home.testimonial.1.country"),
        university: "УРГЭУ",
        text: t("home.testimonial.1.text"),
        rating: 5,
        avatarUrl: "https://i.pravatar.cc/120?img=12",
      },
      {
        name: t("home.testimonial.2.name"),
        country: t("home.testimonial.2.country"),
        university: "ТУСУР",
        text: t("home.testimonial.2.text"),
        rating: 5,
        avatarUrl: "https://i.pravatar.cc/120?img=55",
      },
      {
        name: t("home.testimonial.3.name"),
        country: t("home.testimonial.3.country"),
        university: "РУДН",
        text: t("home.testimonial.3.text"),
        rating: 5,
        avatarUrl: "https://i.pravatar.cc/120?img=33",
      },
    ],
    [t]
  );

  return (
    <>
      <StructuredData data={websiteStructuredData} />
      <StructuredData data={organizationStructuredData} />
      <Layout>
        {showScrollTopButton && (
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Наверх"
            className="fixed bottom-5 right-5 z-50 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-purple-700 hover:shadow-blue-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <ArrowUp className="h-5 w-5" aria-hidden />
          </button>
        )}

        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 py-8 sm:py-12 md:py-24 rounded-2xl sm:rounded-3xl mt-4 sm:mt-6 mb-6 sm:mb-8 lg:mb-10">
          <div className="absolute inset-0 bg-black/10" aria-hidden="true" />
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>

          <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white mb-4 sm:mb-6 px-4">
                {t("home.title")}
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4">
                {t("home.subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 max-w-2xl mx-auto">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center w-full sm:w-auto text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-2 bg-white/20 border-white/40 text-white rounded-xl font-semibold sm:hover:bg-white/30 sm:hover:border-white/50 active:bg-white/35 active:scale-95 shadow-lg sm:hover:shadow-xl active:shadow-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                >
                  <Rocket className="mr-2 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  {t("home.start")}
                </Link>
                <Link
                  href="/education-guide"
                  className="inline-flex items-center justify-center w-full sm:w-auto text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-2 border-white/40 text-white bg-white/15 rounded-xl font-semibold sm:hover:bg-white/90 sm:hover:text-indigo-700 sm:hover:border-white active:bg-white/35 active:scale-95 shadow-lg sm:hover:shadow-xl active:shadow-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                >
                  <BookOpen className="mr-2 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  {t("home.guides")}
                </Link>
              </div>

              {/* Animated Slogan — isolated to prevent parent re-renders */}
              <HeroTypewriter slogans={slogans} />

              {/* Main Features - Compact Version */}
              <div className="mt-8 sm:mt-12 max-w-5xl mx-auto px-2 sm:px-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <Link
                        key={index}
                        href={feature.href}
                        className="group"
                      >
                        <div className="bg-white/20 border border-white/25 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:bg-white/30 hover:border-white/40 transition-all duration-300 h-full flex flex-col items-center text-center">
                          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-white/25 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                            <Icon className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                          </div>
                          <h3 className="text-xs sm:text-sm lg:text-base font-bold text-white mb-1 sm:mb-2 flex-shrink-0 leading-tight">
                            {feature.title}
                          </h3>
                          {feature.stats && (
                            <div className="text-[11px] sm:text-xs text-white font-medium mt-auto flex-shrink-0 leading-tight">
                              {feature.stats}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          {showScrollIndicator && (
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 motion-safe:animate-bounce" aria-hidden="true">
              <div className="w-6 h-10 sm:w-7 sm:h-12 border-2 border-white/60 rounded-full flex justify-center shadow-[0_0_12px_rgba(255,255,255,0.35)]">
                <div className="w-1.5 h-3 sm:h-4 bg-white/90 rounded-full mt-1.5 sm:mt-2"></div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Start Section */}
        <section
          aria-label={t("home.gettingStarted.title")}
          className="py-10 sm:py-12 md:py-16 bg-white rounded-2xl sm:rounded-3xl my-6 sm:my-8 lg:my-10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
                {t("home.gettingStarted.title")}
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-3xl mx-auto">
                {t("home.gettingStarted.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {quickStartItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.href} className="border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-5 sm:p-6 h-full flex flex-col">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                        <Icon className="h-6 w-6" aria-hidden />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed mb-5 flex-grow">
                        {item.description}
                      </p>
                      <Link
                        href={item.href}
                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 hover:bg-slate-800 transition-colors"
                      >
                        {item.cta}
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <div className="flex flex-col">
        {/* Features Section - Detailed */}
        <section
          aria-label={t("home.section.features.title")}
          className="order-3 py-12 sm:py-16 md:py-24 bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-2xl sm:rounded-3xl my-6 sm:my-8 lg:my-10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-xs sm:text-sm font-semibold text-blue-700 mb-4">
                <Sparkles className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {t("home.section.features.badge")}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
                {t("home.section.features.title")}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto px-4">
                {t("home.section.features.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:gap-4 lg:gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={index}
                    className="border-0 shadow-xl h-full bg-white"
                  >
                    <CardContent className="p-2.5 sm:p-6 lg:p-8 relative z-10 flex flex-col min-h-[200px] sm:min-h-0 h-full">
                      <div
                        className={`w-9 h-9 sm:w-16 sm:h-16 rounded-lg sm:rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-1.5 sm:mb-6 shadow-lg flex-shrink-0`}
                      >
                        <Icon className="h-4 w-4 sm:h-8 sm:w-8 text-white" />
                      </div>
                      <h3 className="text-xs sm:text-lg lg:text-xl font-bold text-slate-900 mb-1 sm:mb-3 flex-shrink-0 leading-tight line-clamp-2">
                        {feature.title}
                      </h3>
                      <p className="text-[11px] sm:text-sm lg:text-base text-slate-600 mb-1 sm:mb-4 leading-snug sm:leading-relaxed flex-grow overflow-hidden line-clamp-5 sm:line-clamp-none">
                        {feature.description}
                      </p>
                      {feature.stats && (
                        <div className="text-[10px] sm:text-sm text-slate-500 font-medium mt-auto flex-shrink-0">
                          {feature.stats}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section
          aria-label={t("home.section.benefits.title")}
          className="order-1 below-fold py-12 sm:py-16 md:py-24 relative overflow-hidden rounded-2xl sm:rounded-3xl my-6 sm:my-8 lg:my-10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center rounded-full bg-white/20 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white mb-6 sm:mb-8 shadow-lg border border-white/20">
                <Sparkles className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {t("home.section.benefits.badge")}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                {t("home.section.benefits.title")}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white max-w-3xl mx-auto px-4">
                {t("home.section.benefits.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="p-4 sm:p-6 lg:p-8 rounded-2xl bg-white/15 border border-white/20"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4 sm:mb-6">
                      <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-sm sm:text-base text-white leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Product In Action */}
        <section
          aria-label={t("home.section.howItWorks.title")}
          className="order-2 py-12 sm:py-16 md:py-20 bg-white rounded-2xl sm:rounded-3xl my-6 sm:my-8 lg:my-10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
                ⭐ {t("home.section.howItWorks.title")}
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-3xl mx-auto">
                {t("home.section.howItWorks.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card className="group border border-slate-200 shadow-sm h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 bg-gradient-to-b from-white to-slate-50">
                <CardContent className="p-4 sm:p-5 h-full flex flex-col">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 min-h-[28px]">
                    AI помощник
                  </h3>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex-1 transition-colors duration-300 group-hover:border-slate-300">
                    <div className="h-8 bg-slate-900 flex items-center px-3 gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                    </div>
                    <div className="p-3 space-y-2.5">
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <p className="text-[11px] font-semibold text-slate-900">AI Помощник — Учёба</p>
                        <div className="mt-1 flex gap-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500 text-white">Учёба</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">Жизнь</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">Генератор</span>
                        </div>
                      </div>
                      <div className="ml-auto max-w-[85%] rounded-lg bg-blue-500 text-white text-[11px] p-2">
                        Помоги подготовиться к экзамену
                      </div>
                      <div className="max-w-[90%] rounded-lg bg-white border border-slate-200 text-[11px] p-2 text-slate-700">
                        Сессия: повторите темы за месяц, уточните формат зачёта, запишитесь на консультацию.
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] px-2 py-1 rounded-md bg-blue-100 text-blue-700">Быстрые вопросы</span>
                        <span className="text-[10px] px-2 py-1 rounded-md bg-purple-100 text-purple-700">Шаблоны</span>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 px-2 py-1.5">
                        <p className="text-[10px] text-slate-400">Задайте вопрос...</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group border border-slate-200 shadow-sm h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 bg-gradient-to-b from-white to-slate-50">
                <CardContent className="p-4 sm:p-5 h-full flex flex-col">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 min-h-[28px]">
                    Страница гайда
                  </h3>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex-1 transition-colors duration-300 group-hover:border-slate-300">
                    <div className="h-8 bg-slate-900 flex items-center px-3 gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                    </div>
                    <div className="p-3 space-y-2.5">
                      <div className="rounded-lg bg-white border border-slate-200 px-2 py-1.5">
                        <p className="text-[11px] text-slate-400">Поиск по гайдам...</p>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <span className="text-[10px] px-2 py-1 rounded-md bg-blue-500 text-white text-center">Все</span>
                        <span className="text-[10px] px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-center">Экзамены</span>
                        <span className="text-[10px] px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-center">Документы</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="rounded-md bg-white border border-slate-200 p-2">
                          <p className="text-[11px] font-medium text-slate-800 line-clamp-1">Как проходит обучение в России</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Пошаговое руководство • 9 минут</p>
                        </div>
                        <div className="rounded-md bg-white border border-slate-200 p-2">
                          <p className="text-[11px] font-medium text-slate-800 line-clamp-1">Словарь студенческого сленга</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Часто используемые термины</p>
                        </div>
                        <div className="rounded-md bg-white border border-slate-200 p-2">
                          <p className="text-[11px] font-medium text-slate-800 line-clamp-1">Миграционный учет: пошагово</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Документы, сроки и подача заявления</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group border border-slate-200 shadow-sm h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 bg-gradient-to-b from-white to-slate-50">
                <CardContent className="p-4 sm:p-5 h-full flex flex-col">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 min-h-[28px]">
                    Community
                  </h3>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex-1 transition-colors duration-300 group-hover:border-slate-300">
                    <div className="h-8 bg-slate-900 flex items-center px-3 gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                    </div>
                    <div className="p-3 space-y-2.5">
                      <div className="rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white p-2">
                        <p className="text-[11px] font-semibold">Сообщество</p>
                        <div className="mt-1 flex gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/25">181</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20">8</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20">173</span>
                        </div>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 px-2 py-1.5">
                        <p className="text-[10px] text-slate-400">Поиск вопросов...</p>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="text-[10px] px-2 py-1 rounded-md bg-indigo-600 text-white">Популярные</span>
                        <span className="text-[10px] px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600">Новые</span>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <p className="text-[11px] font-medium text-slate-900">Что делать при незачёте?</p>
                        <p className="text-[10px] text-slate-500 mt-1">12 ответов • 24 лайка</p>
                      </div>
                      <div className="rounded-lg bg-slate-100 p-2">
                        <p className="text-[10px] text-slate-700">Ответ: уточни пересдачу у преподавателя и деканата.</p>
                      </div>
                      <div className="rounded-lg bg-slate-100 p-2">
                        <p className="text-[10px] text-slate-700">Ответ: подготовь план и попроси консультацию.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section
          aria-label={t("home.cta.title")}
          className="order-2 relative isolate overflow-hidden py-12 sm:py-16 md:py-20 rounded-2xl sm:rounded-3xl my-6 sm:my-8 lg:my-10 border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
          >
            <div className="cta-glow cta-glow-primary" />
            <div className="cta-glow cta-glow-secondary" />
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1]"
          >
            <div className="cta-float-icon cta-float-icon-globe">
              <Globe className="h-[1.5rem] w-[1.5rem] sm:h-[1.95rem] sm:w-[1.95rem] text-blue-600/50" />
            </div>
            <div className="cta-float-icon cta-float-icon-book">
              <BookOpenCheck className="h-[1.5rem] w-[1.5rem] sm:h-[1.95rem] sm:w-[1.95rem] text-sky-600/50" />
            </div>
            <div className="cta-float-icon cta-float-icon-cap">
              <GraduationCap className="h-[1.5rem] w-[1.5rem] sm:h-[1.95rem] sm:w-[1.95rem] text-indigo-600/50" />
            </div>
            <div className="cta-float-icon cta-float-icon-doc">
              <FileText className="h-[1.5rem] w-[1.5rem] sm:h-[1.95rem] sm:w-[1.95rem] text-violet-600/50" />
            </div>
          </div>

          <div className="relative z-[2] max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
              {t("home.cta.title")}
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-6 sm:mb-8">
              {t("home.cta.subtitle")}
            </p>
            <Link
              href="/register"
              draggable={false}
              className="cta-primary-button inline-flex min-h-14 select-text items-center justify-center rounded-full bg-gradient-to-r from-[#2f67e8] via-[#5a56ea] to-[#8b3fe8] px-8 sm:px-12 py-3.5 text-base sm:text-[2rem] font-semibold tracking-[-0.02em] text-white shadow-[0_18px_40px_rgba(79,95,234,0.26)] transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <span className="cta-primary-button-label cursor-text select-text">
                {t("home.cta.start")}
              </span>
            </Link>
            <p className="mt-3 text-xs sm:text-sm text-slate-500">
              {t("home.cta.feeNote")}
            </p>
          </div>
        </section>
        </div>

        {/* About Section */}
        <section
          aria-label={t("home.section.about.title")}
          className="below-fold py-12 sm:py-16 md:py-20 bg-gradient-to-br from-slate-50 via-white to-indigo-50 rounded-2xl sm:rounded-3xl my-6 sm:my-8 lg:my-10"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <Card className="relative border border-slate-200 shadow-sm bg-white overflow-visible">
              <CardContent className="p-5 sm:p-7 lg:p-8">
                <div
                  className="founder-sticker absolute -top-4 left-6 text-2xl select-none"
                  aria-hidden
                >
                  ✍️
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-5">
                  {t("home.section.about.heading")}
                </h2>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 sm:p-5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-white">
                      <Image
                        src="/images/founder-avatar.svg"
                        alt="Аватар основателя"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-semibold text-slate-900">
                        {t("home.section.about.author.title")}
                      </p>
                      <p className="text-sm sm:text-base text-slate-600">
                        {t("home.section.about.author.subtitle")}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs sm:text-sm text-slate-700">
                          🎓 учился в российском университете
                        </p>
                        <p className="text-xs sm:text-sm text-slate-700">
                          📍 прошёл путь от прилёта до диплома
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg sm:text-xl font-extrabold tracking-wide text-slate-900 uppercase mb-4">
                  {t("home.section.about.experience.title")}
                </h3>
                <div className="space-y-3 text-base sm:text-lg text-slate-800">
                  <p>{t("home.section.about.experience.p1")}</p>
                  <p>
                    {t("home.section.about.experience.p2.prefix")}{" "}
                    <span className="font-bold text-indigo-700">
                      {t("home.section.about.experience.highlight")}
                    </span>
                    {t("home.section.about.experience.p2.suffix")}
                  </p>
                  <p>{t("home.section.about.experience.p3")}</p>
                </div>

                <div className="h-px bg-slate-200 my-6" />

                <h3 className="text-lg sm:text-xl font-extrabold tracking-wide text-slate-900 uppercase mb-4">
                  {t("home.section.about.purpose.title")}
                </h3>
                <p className="text-base sm:text-lg text-slate-800 mb-4">
                  {t("home.section.about.purpose.intro")}
                </p>
                <ul className="space-y-2.5 text-base sm:text-lg text-slate-800">
                  <li>🧭 {t("home.section.about.purpose.bullet1")}</li>
                  <li>⏰ {t("home.section.about.purpose.bullet2")}</li>
                  <li>📄 {t("home.section.about.purpose.bullet3")}</li>
                  <li>🌍 {t("home.section.about.purpose.bullet4")}</li>
                </ul>

                <p className="text-base sm:text-lg text-slate-800 mt-5">
                  {t("home.section.about.purpose.support")}
                </p>

                <p className="mt-7 text-xl sm:text-2xl font-semibold italic text-slate-900">
                  {t("home.section.about.closing")}
                </p>

                <div
                  className="absolute -bottom-4 right-6 flex items-center gap-2 text-3xl select-none"
                  aria-hidden
                >
                  <GraduationCap className="h-8 w-8 text-slate-800" />
                  <span>🇷🇺</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Testimonials / Reviews Section */}
        <section
          aria-label={t("home.section.testimonials.title")}
          className="below-fold py-12 sm:py-16 md:py-24 bg-white rounded-2xl sm:rounded-3xl my-6 sm:my-8 lg:my-10"
        >
          <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-slate-900 mb-4 sm:mb-6">
                {t("home.section.testimonials.title")}
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto px-2">
                {t("home.section.testimonials.subtitle")}
              </p>
            </div>

            {trustStats && !reviewsLoading && (
              <TrustStats
                stats={trustStats}
                variant="light"
                starsLabel={t("home.trustStats.averageRating")}
                studentsLabel={t("home.trustStats.students")}
                universitiesLabel={t("home.trustStats.universities")}
                countriesLabel={t("home.trustStats.countries")}
              />
            )}

            {!reviewsLoading && reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    starsLabel={t("home.section.testimonials.stars")}
                    showMoreLabel={t("home.review.showMore")}
                    showLessLabel={t("home.review.showLess")}
                    publishedLabel={t("home.review.publishedAfterModeration")}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {testimonials.map((testimonial, index) => (
                  <Card
                    key={index}
                    className="border-0 shadow-xl h-full bg-white"
                  >
                    <CardContent className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
                      <div className="flex items-center mb-3 sm:mb-4" role="img" aria-label={`${testimonial.rating} ${t("home.section.testimonials.stars")}`}>
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current"
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                      <p className="text-slate-700 text-sm sm:text-base lg:text-lg leading-relaxed mb-4 sm:mb-6 italic flex-1">
                        &ldquo;{testimonial.text}&rdquo;
                      </p>
                      <div className="flex items-center mt-auto">
                        {testimonial.avatarUrl ? (
                          <Image
                            src={testimonial.avatarUrl}
                            alt={testimonial.name}
                            width={48}
                            height={48}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mr-3 sm:mr-4 border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-lg mr-3 sm:mr-4">
                            {testimonial.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900 text-sm sm:text-base">
                            {testimonial.name}
                          </div>
                          <div className="text-slate-600 text-sm sm:text-base font-medium tracking-wide uppercase">
                            {testimonial.country} • {testimonial.university}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Pricing Section */}
        <section
          aria-label={t("home.section.pricing.title")}
          className="below-fold py-12 sm:py-16 md:py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl sm:rounded-3xl my-6 sm:my-8 lg:my-10 overflow-visible"
        >
          <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6">
            <div className="text-center mb-12 sm:mb-16 lg:mb-20">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-slate-900 mb-4 sm:mb-6">
                {t("home.section.pricing.title")}
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto px-2">
                {t("home.section.pricing.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 max-w-5xl mx-auto overflow-visible">
              {pricingPlans.map((plan, index) => (
                <Card
                  key={index}
                  className={`relative flex flex-col bg-white ${
                    plan.popular
                      ? "ring-4 ring-blue-500 shadow-2xl"
                      : "shadow-xl"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 sm:px-6 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center shadow-lg">
                        <Star className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        {t("home.pricing.popular")}
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center pt-6 sm:pt-8">
                    <div className="flex items-center justify-center mb-3 sm:mb-4">
                      {plan.popular ? (
                        <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-600 mr-2 sm:mr-3" />
                      ) : (
                        <Zap className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 mr-2 sm:mr-3" />
                      )}
                      <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
                        {plan.name}
                      </CardTitle>
                    </div>
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">
                      {plan.price}
                    </div>
                    <CardDescription className="text-sm sm:text-base lg:text-lg">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 lg:p-8 flex flex-col justify-between h-full">
                    <div>
                      <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                        {plan.features.map((feature, featureIndex) => (
                          <li
                            key={featureIndex}
                            className="flex items-start space-x-3 sm:space-x-4"
                          >
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                            </div>
                            <span className="text-slate-700 text-sm sm:text-base lg:text-lg">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      href={plan.popular ? "/payment/test" : "/register"}
                      className={`inline-flex items-center justify-center w-full text-sm sm:text-base lg:text-lg py-3 sm:py-4 h-12 rounded-xl font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                        plan.popular
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl"
                          : "bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-300"
                      }`}
                    >
                      {plan.popular && (
                        <CreditCard className="mr-2 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                      )}
                      {plan.buttonText}
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

      </Layout>
    </>
  );
}
