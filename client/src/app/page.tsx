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
  MessageSquare,
  Sparkles,
  CalendarClock,
  ArrowUp,
  Crown,
  CreditCard,
  Zap,
  Star,
  Users,
  Rocket,
  ScanLine,
  ArrowRight,
  CheckCircle2,
  Quote,
  Home,
  ChevronLeft,
  ChevronRight,
  Bot,
  FileText,
  GraduationCap,
  MessageCircle,
  Send,
  Plus,
  Building2,
  Bus,
  HeartPulse,
  Plane,
  UserPlus,
  AlertTriangle,
  HeartHandshake,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  StructuredData,
  websiteStructuredData,
  organizationStructuredData,
} from "@/components/seo/structured-data";
import { useTranslation } from "@/hooks/useTranslation";
import { useEffect, useRef, useState, useMemo } from "react";
import { API_BASE_URL } from "@/lib/api";
import { PublicReview, TrustStats as TrustStatsType } from "@/types";
import { HeroTypewriter } from "@/components/home/HeroTypewriter";
import { TrustStats } from "@/components/home/TrustStats";
import { AdaptationHeroSection } from "@/components/home/AdaptationHeroSection";
import { LanguageMarquee } from "@/components/home/LanguageMarquee";
import { ReviewCard } from "@/components/home/ReviewCard";
import {
  TestimonialCardSkeleton,
  TrustStatsSkeleton,
} from "@/components/ui/skeleton";
import { useAdaptationCta } from "@/hooks/useAdaptationCta";
import { HomeFeatureCard } from "@/components/home/HomeFeatureCard";
import { BuddyProgramSection } from "@/components/home/BuddyProgramSection";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { StaggerReveal, StaggerItem } from "@/components/home/StaggerReveal";
import { HeroBackgroundImage } from "@/components/ui/hero-background-image";
import { motion } from "framer-motion";
import {
  TOTAL_GUIDES_COUNT,
  EDUCATION_GUIDES_COUNT,
  LIFE_GUIDES_COUNT,
  SUPPORTED_LANGUAGES_COUNT,
} from "@/constants/content-stats";
import { formatCountedLabel } from "@/lib/pluralize";
import { PREMIUM_CHECKOUT_PATH } from "@/constants/routes";
import { buddyT } from "@/lib/buddy-i18n";

function HowItWorksCardLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      {children}
    </Link>
  );
}

const PREMIUM_FEATURES_VISIBLE = 6;

function HowItWorksStepHeader({
  step,
  title,
  caption,
}: {
  step: string;
  title: string;
  caption: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm">
          {step}
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{caption}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { t, currentLanguage } = useTranslation();
  const { href: adaptationCtaHref, label: adaptationCtaLabel } =
    useAdaptationCta();
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [scrollIndicatorSlow, setScrollIndicatorSlow] = useState(false);
  const [showScrollTopButton, setShowScrollTopButton] = useState(false);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [trustStats, setTrustStats] = useState<TrustStatsType | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [premiumFeaturesExpanded, setPremiumFeaturesExpanded] = useState(false);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const reviewCarouselRef = useRef<HTMLDivElement>(null);
  const reviewCardRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollIndicator(window.scrollY === 0);
      setShowScrollTopButton(window.scrollY > 500);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setScrollIndicatorSlow(true), 12000);
    return () => window.clearTimeout(timer);
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

  const showTrustBar =
    Boolean(trustStats) && !reviewsLoading && reviews.length >= 3;

  const showContentProof = !reviewsLoading && !showTrustBar;

  const scrollToReview = (index: number) => {
    const reviewCount = reviews.length;
    if (reviewCount === 0) return;

    const nextIndex = (index + reviewCount) % reviewCount;
    reviewCardRefs.current[nextIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
    setActiveReviewIndex(nextIndex);
  };

  const updateActiveReview = () => {
    const carousel = reviewCarouselRef.current;
    if (!carousel || reviewCardRefs.current.length === 0) return;

    const viewportCenter = carousel.scrollLeft + carousel.clientWidth / 2;
    const nearestIndex = reviewCardRefs.current.reduce(
      (closestIndex, card, index) => {
        if (!card) return closestIndex;
        const closestCard = reviewCardRefs.current[closestIndex];
        if (!closestCard) return index;

        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const closestCenter = closestCard.offsetLeft + closestCard.offsetWidth / 2;
        return Math.abs(cardCenter - viewportCenter) <
          Math.abs(closestCenter - viewportCenter)
          ? index
          : closestIndex;
      },
      0,
    );

    setActiveReviewIndex(nearestIndex);
  };

  const pricingTeaser = useMemo(
    () =>
      `${t("home.pricing.freemium.price")} · ${t("home.pricing.premium")} ${t("home.pricing.premium.price")}`,
    [t],
  );

  const contentProofItems = useMemo(
    () => [
      formatCountedLabel(
        TOTAL_GUIDES_COUNT,
        currentLanguage,
        t,
        "home.guidesCount",
      ),
      t("home.contentProof.languages").replace(
        "{count}",
        String(SUPPORTED_LANGUAGES_COUNT),
      ),
      t("home.contentProof.ai"),
    ],
    [t, currentLanguage],
  );

  const features = useMemo(
    () => [
      {
        id: "education",
        icon: BookOpen,
        title: t("home.features.navigator"),
        description: t("home.features.navigator.desc"),
        stat: formatCountedLabel(
          EDUCATION_GUIDES_COUNT,
          currentLanguage,
          t,
          "home.guidesCount",
        ),
        iconClassName: "bg-gradient-to-br from-blue-500 to-blue-600",
        href: "/education-guide",
      },
      {
        id: "life",
        icon: Home,
        title: t("home.features.guide"),
        description: t("home.features.guide.desc"),
        stat: t("home.section.features.stats.instructions").replace(
          "{count}",
          String(LIFE_GUIDES_COUNT),
        ),
        iconClassName: "bg-gradient-to-br from-emerald-500 to-teal-600",
        href: "/life-guide",
      },
      {
        id: "ai",
        icon: Sparkles,
        title: t("home.features.ai"),
        description: t("home.features.ai.desc"),
        stat: t("home.section.features.stats.ai"),
        iconClassName: "bg-gradient-to-br from-violet-500 to-indigo-600",
        href: "/ai-helper",
      },
      {
        id: "reminders",
        icon: CalendarClock,
        title: t("home.features.reminders"),
        description: t("home.features.reminders.desc"),
        stat: t("home.section.features.stats.notifications"),
        iconClassName: "bg-gradient-to-br from-purple-500 to-indigo-600",
        href: "/reminders",
      },
      {
        id: "docscan",
        icon: ScanLine,
        title: t("home.features.docscan"),
        description: t("home.features.docscan.card"),
        stat: t("home.features.docscan.stats"),
        iconClassName: "bg-gradient-to-br from-indigo-500 to-indigo-600",
        href: "/docscan",
      },
      {
        id: "community",
        icon: Users,
        title: t("home.features.community"),
        description: t("home.features.community.desc"),
        stat: t("home.section.features.stats.community"),
        iconClassName: "bg-gradient-to-br from-pink-500 to-rose-600",
        href: "/community/questions",
      },
    ],
    [t, currentLanguage],
  );

  const pricingPlans = useMemo(
    () => [
      {
        id: "freemium",
        name: t("home.pricing.freemium"),
        price: t("home.pricing.freemium.price"),
        description: t("home.pricing.freemium.description"),
        features: [
          t("home.pricing.feature.free.guides"),
          t("home.pricing.feature.free.community"),
          t("home.pricing.feature.free.docscan"),
          t("home.pricing.feature.free.remindersCreate"),
          t("home.pricing.feature.free.reminders"),
          t("home.pricing.feature.free.templates"),
          t("home.pricing.feature.free.email"),
        ],
        popular: false,
        buttonText: t("home.pricing.button.freemium"),
        buttonHref: adaptationCtaHref,
      },
      {
        id: "premium",
        name: t("home.pricing.premium"),
        price: t("home.pricing.premium.price"),
        description: t("home.pricing.premium.description"),
        features: [
          t("home.pricing.feature.premium.all"),
          t("home.pricing.feature.premium.ai"),
          t("home.pricing.feature.premium.unlimited"),
        ],
        popular: true,
        buttonText: t("home.pricing.button.premium"),
        buttonHref: PREMIUM_CHECKOUT_PATH,
      },
    ],
    [t, adaptationCtaHref],
  );

  const slogans = useMemo(
    () => [
      t("home.slogan.1"),
      t("home.slogan.2"),
      t("home.slogan.3"),
      t("home.slogan.4"),
    ],
    [t],
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
            aria-label={t("home.scrollTop")}
            className="fixed bottom-5 right-5 z-50 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-purple-700 hover:shadow-blue-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <ArrowUp className="h-5 w-5" aria-hidden />
          </button>
        )}

        {/* Hero */}
        <div className="relative mt-3 mb-5 overflow-hidden rounded-2xl bg-slate-200 pt-8 pb-14 sm:mt-6 sm:mb-8 sm:rounded-3xl sm:pt-14 sm:pb-20 md:pt-20 md:pb-24">
          <HeroBackgroundImage
            src="/image-banner/image-Home-page.png"
            imageClassName="object-cover object-center scale-105 blur-[3px]"
          />
          <div className="absolute inset-0 bg-black/35" aria-hidden />

          <div className="relative mx-auto max-w-4xl px-3 text-center sm:px-6 lg:px-8">
            <h1 className="mb-3 text-[1.75rem] leading-tight font-bold tracking-tight text-white sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl">
              {t("home.title")}
            </h1>
            <p className="mx-auto mb-3 max-w-2xl text-[15px] leading-relaxed text-white/90 sm:mb-6 sm:text-lg md:text-xl">
              {t("home.subtitle")}
            </p>

            <HeroTypewriter slogans={slogans} />

            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 pb-1 sm:max-w-none sm:flex-row sm:gap-4 sm:pb-0">
              <Link
                href={adaptationCtaHref}
                className="inline-flex w-full min-w-0 items-center justify-center rounded-xl bg-white px-4 py-3 text-sm leading-tight font-semibold text-indigo-700 shadow-lg transition-all hover:bg-white/95 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600 focus-visible:outline-none sm:w-auto sm:px-6 sm:py-3.5 sm:text-base"
              >
                <Rocket className="mr-2 h-5 w-5" aria-hidden />
                {adaptationCtaLabel}
              </Link>
              <Link
                href="/education-guide"
                className="inline-flex w-full min-w-0 items-center justify-center rounded-xl border-2 border-white/40 px-4 py-3 text-sm leading-tight font-semibold text-white transition-all hover:bg-white/15 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600 focus-visible:outline-none sm:w-auto sm:px-6 sm:py-3.5 sm:text-base"
              >
                <BookOpen className="mr-2 h-5 w-5" aria-hidden />
                {t("home.guides")}
              </Link>
            </div>
          </div>

          {showScrollIndicator && (
            <div
              className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 sm:bottom-7"
              aria-hidden
            >
              <div
                className={`${scrollIndicatorSlow ? "hero-scroll-gentle" : "motion-safe:animate-bounce"} transition-transform duration-1000 ease-out`}
              >
                <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
                  <div className="w-1.5 h-3 bg-white/90 rounded-full mt-1.5" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Social proof — loading / trust stats / content proof */}
        {reviewsLoading ? (
          <section
            aria-busy="true"
            aria-label={t("home.contentProof.title")}
            className="py-8 sm:py-10 bg-white rounded-2xl sm:rounded-3xl mb-6 sm:mb-8"
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <TrustStatsSkeleton />
            </div>
          </section>
        ) : showTrustBar && trustStats ? (
          <section
            aria-label={t("home.section.testimonials.title")}
            className="py-8 sm:py-10 bg-white rounded-2xl sm:rounded-3xl mb-6 sm:mb-8"
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <TrustStats
                stats={trustStats}
                variant="light"
                starsLabel={t("home.trustStats.averageRating")}
                studentsLabel={t("home.trustStats.students")}
                universitiesLabel={t("home.trustStats.universities")}
                countriesLabel={t("home.trustStats.countries")}
              />
            </div>
          </section>
        ) : showContentProof ? (
          <section
            aria-label={t("home.contentProof.title")}
            className="py-5 sm:py-6 bg-white rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 border border-slate-100"
          >
            <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
              <p className="text-sm sm:text-base font-medium text-slate-600">
                {contentProofItems.join(" · ")}{" "}
                <span className="text-slate-300" aria-hidden>
                  ·
                </span>{" "}
                <Link
                  href="#home-pricing"
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-sm"
                >
                  {pricingTeaser}
                </Link>
              </p>
            </div>
          </section>
        ) : null}

        <AdaptationHeroSection />

        {/* Multilingual ticker — mid-page break like edurussia marquees */}
        <LanguageMarquee />

        {/* How it works */}
        <section
          aria-label={t("home.section.howItWorks.title")}
          className="home-how-it-works py-12 sm:py-16 md:py-20 bg-white rounded-2xl sm:rounded-3xl my-6 sm:my-8"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                {t("home.section.howItWorks.title")}
              </h2>
              <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto">
                {t("home.section.howItWorks.subtitle")}
              </p>
            </ScrollReveal>

            <StaggerReveal className="home-how-it-works-grid grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              <StaggerItem>
                <HowItWorksCardLink
                  href="/education-guide"
                  label={t("educationGuide.header.title")}
                >
                <Card className="no-hover border border-slate-200 shadow-sm h-full bg-gradient-to-b from-white to-slate-50 transition-shadow hover:shadow-md">
                  <CardContent className="p-5 h-full flex flex-col">
                    <HowItWorksStepHeader
                      step="01"
                      title={t("educationGuide.header.title")}
                      caption={t("home.section.howItWorks.step1.caption")}
                    />
                    <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex-1 flex flex-col">
                      <div className="h-8 bg-slate-900 flex items-center px-3 gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                      </div>
                      <div className="p-3 space-y-2 flex-1">
                        <div className="rounded-2xl bg-white p-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                              <GraduationCap className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900">
                                {t("educationGuide.header.title")}
                              </p>
                              <p className="text-[11px] text-slate-500 line-clamp-1">
                                {t("educationGuide.header.subtitle")}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-1.5">
                          {(
                            [
                              { key: "exams", icon: GraduationCap, active: true },
                              { key: "papers", icon: BookOpen },
                              { key: "documents", icon: FileText },
                              { key: "structure", icon: Building2 },
                              { key: "admission", icon: UserPlus },
                              { key: "expulsion-risks", icon: AlertTriangle },
                            ] as const
                          ).map((item) => {
                            const Icon = item.icon;
                            return (
                              <div
                                key={item.key}
                                className={
                                  item.active
                                    ? "flex items-center gap-1.5 rounded-xl border-2 border-indigo-400 bg-indigo-50 px-2 py-1.5"
                                    : "flex items-center gap-1.5 rounded-xl border-2 border-gray-200 bg-gray-50 px-2 py-1.5"
                                }
                              >
                                <Icon
                                  className={`h-3.5 w-3.5 shrink-0 ${
                                    item.active ? "text-indigo-600" : "text-slate-500"
                                  }`}
                                />
                                <span
                                  className={`text-[10px] font-semibold leading-tight line-clamp-1 ${
                                    item.active ? "text-indigo-700" : "text-slate-700"
                                  }`}
                                >
                                  {t(`educationGuide.categories.${item.key}`)}
                                </span>
                              </div>
                            );
                          })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </HowItWorksCardLink>
              </StaggerItem>

              <StaggerItem>
                <HowItWorksCardLink
                  href="/life-guide"
                  label={t("lifeGuide.header.title")}
                >
                <Card className="no-hover border border-slate-200 shadow-sm h-full bg-gradient-to-b from-white to-slate-50 transition-shadow hover:shadow-md">
                  <CardContent className="p-5 h-full flex flex-col">
                    <HowItWorksStepHeader
                      step="02"
                      title={t("lifeGuide.header.title")}
                      caption={t("home.section.howItWorks.step2.caption")}
                    />
                    <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex-1 flex flex-col">
                      <div className="h-8 bg-slate-900 flex items-center px-3 gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                      </div>
                      <div className="p-3 space-y-2 flex-1">
                        <div className="rounded-2xl bg-white p-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                              <Home className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900">
                                {t("lifeGuide.header.title")}
                              </p>
                              <p className="text-[11px] text-slate-500 line-clamp-1">
                                {t("lifeGuide.header.subtitle")}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                            <Plane className="h-3 w-3" />
                            {t("lifeGuide.arrival.cta")}
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-1.5">
                          {(
                            [
                              { key: "housing", icon: Home, active: true },
                              { key: "documents", icon: FileText },
                              { key: "transport", icon: Bus },
                              { key: "health", icon: HeartPulse },
                            ] as const
                          ).map((item) => {
                            const Icon = item.icon;
                            return (
                              <div
                                key={item.key}
                                className={
                                  item.active
                                    ? "flex items-center gap-1.5 rounded-xl border-2 border-indigo-400 bg-indigo-50 px-2 py-1.5"
                                    : "flex items-center gap-1.5 rounded-xl border-2 border-gray-200 bg-gray-50 px-2 py-1.5"
                                }
                              >
                                <Icon
                                  className={`h-3.5 w-3.5 shrink-0 ${
                                    item.active ? "text-indigo-600" : "text-slate-500"
                                  }`}
                                />
                                <span
                                  className={`text-[10px] font-semibold leading-tight line-clamp-1 ${
                                    item.active ? "text-indigo-700" : "text-slate-700"
                                  }`}
                                >
                                  {t(`lifeGuide.categories.${item.key}`)}
                                </span>
                              </div>
                            );
                          })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </HowItWorksCardLink>
              </StaggerItem>

              <StaggerItem>
                <HowItWorksCardLink href="/ai-helper" label="AdaptEd AI">
                <Card className="no-hover border border-slate-200 shadow-sm h-full bg-gradient-to-b from-white to-slate-50 transition-shadow hover:shadow-md">
                  <CardContent className="p-5 h-full flex flex-col">
                    <HowItWorksStepHeader
                      step="03"
                      title="AdaptEd AI"
                      caption={t("home.section.howItWorks.step3.caption")}
                    />
                    <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex-1 flex flex-col">
                      <div className="h-8 bg-slate-900 flex items-center px-3 gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                      </div>
                      <div className="p-3 space-y-2 flex-1">
                        <div className="rounded-2xl bg-white p-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                              <GraduationCap className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900">
                                AdaptEd AI — {t("aiHelper.mode.study")}
                              </p>
                              <p className="text-[11px] text-slate-500 line-clamp-1">
                                {t("aiHelper.mode.study.desc")}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-xl border-2 border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-600">
                              <GraduationCap className="h-3 w-3" />
                              {t("aiHelper.mode.study")}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-xl border-2 border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600">
                              <Home className="h-3 w-3" />
                              {t("aiHelper.mode.life")}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-xl border-2 border-purple-200 bg-purple-50 px-2 py-1 text-[11px] font-medium text-purple-700">
                              <FileText className="h-3 w-3" />
                              {t("aiHelper.templates")}
                            </span>
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-2">
                          <div className="mb-2 flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                              <Bot className="h-3 w-3 text-white" />
                            </div>
                            <p className="text-[11px] font-semibold text-slate-800">
                              AI {t("aiHelper.mode.study")}
                            </p>
                          </div>
                          <div className="ml-auto max-w-[90%] rounded-2xl bg-blue-500 px-3 py-2 text-[11px] text-white">
                            {t("aiHelper.quickQuestions.study.1")}
                          </div>
                          <div className="mt-2 max-w-[92%] rounded-2xl bg-gray-100 px-3 py-2 text-[11px] text-slate-800">
                            {t("aiHelper.tips.study.2")}
                          </div>
                          <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5">
                            <span className="flex-1 text-[11px] text-slate-400">
                              {t("aiHelper.input.placeholder")}
                            </span>
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                              <Send className="h-3 w-3 text-white" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </HowItWorksCardLink>
              </StaggerItem>

              <StaggerItem>
                <HowItWorksCardLink
                  href="/community/questions"
                  label={t("home.features.community")}
                >
                <Card className="no-hover border border-slate-200 shadow-sm h-full bg-gradient-to-b from-white to-slate-50 transition-shadow hover:shadow-md">
                  <CardContent className="p-5 h-full flex flex-col">
                    <HowItWorksStepHeader
                      step="04"
                      title={t("home.features.community")}
                      caption={t("home.section.howItWorks.step4.caption")}
                    />
                    <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex-1 flex flex-col">
                      <div className="h-8 bg-slate-900 flex items-center px-3 gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                      </div>
                      <div className="p-3 space-y-2 flex-1">
                        <div className="rounded-2xl bg-white p-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                              <MessageCircle className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900">
                                {t("community.questions.title")}
                              </p>
                              <p className="text-[11px] text-slate-500 line-clamp-1">
                                {t("community.questions.subtitle")}
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-2 py-1 text-[10px] font-semibold text-white">
                              <Plus className="h-3 w-3" />
                              {t("community.questions.ask")}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-1.5">
                            <div className="rounded-xl border-2 border-indigo-500 bg-indigo-50 px-1.5 py-1.5 text-center">
                              <p className="text-sm font-bold text-slate-900">24</p>
                              <p className="text-[9px] text-slate-500 leading-tight">
                                {t("community.questions.stats.total")}
                              </p>
                            </div>
                            <div className="rounded-xl border-2 border-gray-100 bg-gray-50 px-1.5 py-1.5 text-center">
                              <p className="text-sm font-bold text-emerald-700">18</p>
                              <p className="text-[9px] text-slate-500 leading-tight">
                                {t("community.questions.stats.answered")}
                              </p>
                            </div>
                            <div className="rounded-xl border-2 border-gray-100 bg-gray-50 px-1.5 py-1.5 text-center">
                              <p className="text-sm font-bold text-amber-700">6</p>
                              <p className="text-[9px] text-slate-500 leading-tight">
                                {t("community.questions.stats.waiting")}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-50 to-emerald-50 p-2 ring-1 ring-indigo-100">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 text-white">
                            <HeartHandshake className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-slate-900">
                              {buddyT(currentLanguage, "name")}
                            </p>
                            <p className="text-[9px] leading-tight text-slate-500 line-clamp-1">
                              {buddyT(currentLanguage, "subtitle")} ·{" "}
                              {buddyT(currentLanguage, "free")}
                            </p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-0.5 text-[9px] font-semibold text-indigo-700">
                            {buddyT(currentLanguage, "openForm")}
                            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="rounded-xl border-2 border-indigo-400 bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-700">
                            {t("community.questions.filter.all")}
                          </span>
                          <span className="rounded-xl border-2 border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-600">
                            {t("community.questions.filter.answered")}
                          </span>
                          <span className="rounded-xl border-2 border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-600">
                            {t("community.questions.filter.unanswered")}
                          </span>
                        </div>
                        <div className="rounded-2xl bg-white p-2.5 shadow-sm">
                          <p className="text-[11px] font-semibold text-slate-900 line-clamp-2">
                            {t("community.questions.pinned.visa")}
                          </p>
                          <p className="mt-1.5 text-[10px] text-slate-500">
                            {t("home.mock.community.meta")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </HowItWorksCardLink>
              </StaggerItem>
            </StaggerReveal>
          </div>
        </section>

        {/* Features — reference card layout */}
        <section
          aria-label={t("home.section.features.title")}
          className="home-features-section py-12 sm:py-16 md:py-20 bg-slate-50 rounded-2xl sm:rounded-3xl my-6 sm:my-8"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {t("home.section.features.title")}
              </h2>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                {t("home.section.features.subtitle")}
              </p>
            </ScrollReveal>

            <StaggerReveal className="home-features-grid grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {features.map((feature) => (
                <StaggerItem key={feature.id} className="h-full">
                  <HomeFeatureCard
                    href={feature.href}
                    title={feature.title}
                    description={feature.description}
                    stat={feature.stat}
                    icon={feature.icon}
                    iconClassName={feature.iconClassName}
                    learnMore={t("common.learnMore")}
                  />
                </StaggerItem>
              ))}
            </StaggerReveal>
          </div>
        </section>

        <BuddyProgramSection />

        {/* Pricing — moved up for visibility */}
        <section
          id="home-pricing"
          aria-label={t("home.section.pricing.title")}
          className="below-fold scroll-mt-28 py-12 sm:py-16 md:py-20 bg-white rounded-2xl sm:rounded-3xl my-6 sm:my-8"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {t("home.section.pricing.title")}
              </h2>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                {t("home.section.pricing.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {pricingPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`no-hover relative flex flex-col bg-white ${
                    plan.popular
                      ? "ring-2 ring-blue-500 shadow-xl"
                      : "border border-slate-200 shadow-sm"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-semibold flex items-center shadow-md">
                        <Star className="mr-1.5 h-3.5 w-3.5" />
                        {t("home.pricing.popular")}
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center pt-8">
                    <div className="flex items-center justify-center mb-3">
                      {plan.popular ? (
                        <Crown className="h-8 w-8 text-yellow-600 mr-2" />
                      ) : (
                        <Zap className="h-8 w-8 text-blue-600 mr-2" />
                      )}
                      <CardTitle className="text-2xl font-bold">
                        {plan.name}
                      </CardTitle>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {plan.price}
                    </div>
                    <CardDescription className="text-base">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col flex-grow">
                    {(() => {
                      const isPremium = plan.popular;
                      const hiddenCount = isPremium
                        ? Math.max(
                            0,
                            plan.features.length - PREMIUM_FEATURES_VISIBLE,
                          )
                        : 0;
                      const visibleFeatures =
                        isPremium && !premiumFeaturesExpanded
                          ? plan.features.slice(0, PREMIUM_FEATURES_VISIBLE)
                          : plan.features;

                      return (
                        <>
                          <ul className="space-y-3 mb-4 flex-grow">
                            {visibleFeatures.map((feature) => (
                              <li
                                key={feature}
                                className="flex items-start gap-3"
                              >
                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                                  <div className="w-2 h-2 rounded-full bg-green-500" />
                                </div>
                                <span className="text-sm sm:text-base text-slate-700">
                                  {feature}
                                </span>
                              </li>
                            ))}
                          </ul>
                          {isPremium && hiddenCount > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setPremiumFeaturesExpanded((prev) => !prev)
                              }
                              className="mb-6 text-sm font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-md"
                            >
                              {premiumFeaturesExpanded
                                ? t("home.pricing.hideExtraFeatures")
                                : t("home.pricing.showAllFeatures").replace(
                                    "{count}",
                                    String(hiddenCount),
                                  )}
                            </button>
                          )}
                        </>
                      );
                    })()}
                    <Link
                      href={plan.buttonHref}
                      className={`inline-flex items-center justify-center w-full py-3.5 rounded-xl font-semibold text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                        plan.popular
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
                          : "bg-white text-slate-700 border-2 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {plan.popular && (
                        <CreditCard className="mr-2 h-5 w-5" aria-hidden />
                      )}
                      {plan.buttonText}
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Mid CTA */}
        <section
          aria-label={t("home.cta.title")}
          className="home-mid-cta relative overflow-hidden py-12 sm:py-16 rounded-2xl sm:rounded-3xl my-6 sm:my-8 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "linear-gradient(to bottom right, rgba(30, 64, 175, 0.72), rgba(109, 40, 217, 0.74)), url(/images/illustration/adaptation-cta-v2.png)",
          }}
        >
          <ScrollReveal className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              {t("home.cta.title")}
            </h2>
            <p className="text-base sm:text-lg text-white/90 mb-8">
              {t("home.cta.subtitle")}
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={adaptationCtaHref}
                className="cta-wave-button inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-8 py-3.5 text-base sm:text-lg font-semibold text-indigo-700 shadow-lg hover:bg-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
              >
                <span className="relative z-10">{adaptationCtaLabel}</span>
              </Link>
            </motion.div>
            <p className="mt-4 text-sm text-white/70">
              {t("home.cta.feeNote")}
            </p>
          </ScrollReveal>
        </section>

        {/* About */}
        <section
          id="home-about"
          aria-label={t("home.section.about.title")}
          className="below-fold scroll-mt-28 bg-white py-12 sm:py-16 md:py-20 rounded-2xl sm:rounded-3xl my-6 sm:my-8"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 sm:mb-10">
              <div className="mb-4 h-1 w-12 rounded-full bg-blue-600" />
              <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {t("home.section.about.heading")}
              </h2>
            </div>

            <Card className="border border-slate-200 bg-white shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]">
              <CardContent className="p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-center">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-4 ring-blue-50 sm:h-24 sm:w-24">
                    <Image
                      src="/founder-image/IMG_0654.jpeg"
                      alt={t("home.about.avatarAlt")}
                      width={160}
                      height={160}
                      className="h-full w-full scale-125 object-cover object-[center_30%]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-bold text-slate-950 sm:text-2xl">
                      {t("home.section.about.author.title")}
                    </p>
                    <p className="mt-1 text-sm font-medium text-blue-600 sm:text-base">
                      {t("home.section.about.author.subtitle")}
                    </p>
                    <div className="mt-3 flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:gap-5">
                      <span>{t("home.section.about.author.fact1")}</span>
                      <span className="hidden text-slate-300 sm:inline">•</span>
                      <span>{t("home.section.about.author.fact2")}</span>
                    </div>
                  </div>
                </div>

                <div className="py-8 sm:py-10">
                  <div className="flex items-start gap-4">
                    <Quote className="mt-1 h-7 w-7 shrink-0 text-blue-500" aria-hidden />
                    <p className="text-base leading-relaxed text-slate-700 sm:text-xl">
                    {t("home.section.about.summary")}
                    </p>
                  </div>
                </div>

                <ul className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                  {["bullet1", "bullet2", "bullet3", "bullet4"].map(
                    (bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-3 text-sm leading-relaxed text-slate-700 sm:text-base"
                      >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                        </span>
                        <span>{t(`home.section.about.purpose.${bullet}`)}</span>
                      </li>
                    ),
                  )}
                </ul>

                <div className="mt-8 rounded-xl bg-blue-50 px-5 py-4 sm:px-6">
                  <p className="text-base font-semibold italic text-blue-950 sm:text-lg">
                    {t("home.section.about.closing")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Reviews */}
        <section
          aria-label={t("home.section.testimonials.title")}
          className="below-fold py-12 sm:py-16 md:py-20 bg-slate-50 rounded-2xl sm:rounded-3xl my-6 sm:my-8"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8 text-center sm:mb-10 sm:flex sm:items-end sm:justify-between sm:gap-8 sm:text-left">
              <div>
                <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl md:text-4xl">
                  {t("home.section.testimonials.title")}
                </h2>
                <p className="mx-auto max-w-2xl text-base text-slate-600 sm:mx-0 sm:text-lg">
                  {t("home.section.testimonials.subtitle")}
                </p>
              </div>

              {!reviewsLoading && reviews.length > 1 && (
                <div className="hidden shrink-0 items-center gap-4 sm:flex">
                  <button
                    type="button"
                    onClick={() => scrollToReview(activeReviewIndex - 1)}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    aria-label="Previous review"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToReview(activeReviewIndex + 1)}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    aria-label="Next review"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden />
                  </button>
                </div>
              )}
            </div>

            {reviewsLoading ? (
              <div
                aria-busy="true"
                aria-label={t("home.section.testimonials.title")}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {Array.from({ length: 3 }).map((_, index) => (
                  <TestimonialCardSkeleton key={index} />
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <>
                <div
                  ref={reviewCarouselRef}
                  onScroll={updateActiveReview}
                  className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 pt-1 sm:-mx-6 sm:gap-6 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  aria-label={t("home.section.testimonials.title")}
                >
                  {reviews.map((review, index) => (
                    <div
                      key={review.id}
                      ref={(element) => {
                        reviewCardRefs.current[index] = element;
                      }}
                      className="w-[calc(100%-2.75rem)] shrink-0 snap-center sm:w-[42%] lg:w-[30%]"
                    >
                    <ReviewCard
                      review={review}
                      starsLabel={t("home.section.testimonials.stars")}
                      showMoreLabel={t("home.review.showMore")}
                      showLessLabel={t("home.review.showLess")}
                      publishedLabel={t("home.review.publishedAfterModeration")}
                      premiumLabel={t("home.pricing.premium")}
                    />
                    </div>
                  ))}
                </div>

                {reviews.length > 1 && (
                  <div className="mt-5 flex items-center justify-center gap-4 sm:hidden">
                    <button
                      type="button"
                      onClick={() => scrollToReview(activeReviewIndex - 1)}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      aria-label="Previous review"
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToReview(activeReviewIndex + 1)}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      aria-label="Next review"
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="mx-auto max-w-xl rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 py-10 sm:px-8 sm:py-12 text-center shadow-sm">
                <div
                  className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                  aria-hidden
                >
                  <Star className="h-7 w-7 fill-current" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  {t("home.section.testimonials.empty")}
                </p>
                <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                  {t("home.section.testimonials.emptyDescription")}
                </p>
                <Link
                  href="/profile"
                  className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:shadow-blue-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <MessageSquare className="mr-2 h-5 w-5" aria-hidden />
                  {t("home.section.testimonials.emptyCta")}
                </Link>
              </div>
            )}
          </div>
        </section>
      </Layout>
    </>
  );
}
