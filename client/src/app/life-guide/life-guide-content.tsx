"use client";

import { Layout } from "@/components/layout/layout";
import { GuideCard } from "@/components/ui/guide-card";
import { GuideDetailModal } from "@/components/ui/guide-detail-modal";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  Home,
  Bus,
  Phone,
  HeartPulse,
  FileText,
  Plane,
  ChevronRight,
} from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Guide } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useGuideProgress } from "@/hooks/useGuideProgress";
import { lifeGuides } from "@/data/life-guides";
import { HeroBackgroundImage } from "@/components/ui/hero-background-image";

type ArrivalStep = {
  id: string;
  labelKey: string;
  guideId?: string;
  categoryId?: string;
  href?: string;
};

type ArrivalPhase = {
  id: string;
  titleKey: string;
  steps: ArrivalStep[];
};

/** Чеклист для новичков — шаги ведут в гайды / категории Быта */
const arrivalPhases: ArrivalPhase[] = [
  {
    id: "first24h",
    titleKey: "lifeGuide.arrival.phases.first24h",
    steps: [
      { id: "migration-card", labelKey: "lifeGuide.arrival.steps.migrationCard", guideId: "migration-card" },
      { id: "contact-uni", labelKey: "lifeGuide.arrival.steps.contactUniversity", guideId: "contact-university" },
      { id: "housing", labelKey: "lifeGuide.arrival.steps.housing", guideId: "1" },
    ],
  },
  {
    id: "first3days",
    titleKey: "lifeGuide.arrival.phases.first3days",
    steps: [
      { id: "migration-reg", labelKey: "lifeGuide.arrival.steps.migrationReg", guideId: "7" },
      { id: "insurance", labelKey: "lifeGuide.arrival.steps.insurance", guideId: "insurance-dms" },
      { id: "medical-docs", labelKey: "lifeGuide.arrival.steps.medicalDocs", guideId: "medical-checkup" },
    ],
  },
  {
    id: "firstWeek",
    titleKey: "lifeGuide.arrival.phases.firstWeek",
    steps: [
      { id: "dorm", labelKey: "lifeGuide.arrival.steps.dorm", guideId: "1" },
      { id: "sim", labelKey: "lifeGuide.arrival.steps.sim", guideId: "sim-card" },
      { id: "bank", labelKey: "lifeGuide.arrival.steps.bank", guideId: "8" },
      { id: "transport", labelKey: "lifeGuide.arrival.steps.transport", guideId: "5" },
    ],
  },
  {
    id: "firstMonth",
    titleKey: "lifeGuide.arrival.phases.firstMonth",
    steps: [
      { id: "docs", labelKey: "lifeGuide.arrival.steps.documents", categoryId: "documents" },
      { id: "university", labelKey: "lifeGuide.arrival.steps.university", href: "/education-guide" },
      { id: "daily", labelKey: "lifeGuide.arrival.steps.dailyLife", guideId: "daily-life" },
      { id: "social", labelKey: "lifeGuide.arrival.steps.social", guideId: "social-adapt" },
    ],
  },
];

const categoriesConfig = [
  { id: "documents", icon: FileText },
  { id: "housing", icon: Home },
  { id: "transport", icon: Bus },
  { id: "health", icon: HeartPulse },
  { id: "services", icon: Phone },
];

const emergencyContacts = [
  { id: "police", number: "102" },
  { id: "ambulance", number: "103" },
  { id: "fire", number: "101" },
  { id: "rescue", number: "112" },
];

export function LifeGuideContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [guidesVisibleCount, setGuidesVisibleCount] = useState(12);
  const [activeGuide, setActiveGuide] = useState<Guide | null>(null);

  const { isRead, markAsRead } = useGuideProgress("life", lifeGuides.length);
  const handleMarkRead = useCallback((guideId: string) => {
    markAsRead(guideId);
  }, [markAsRead]);

  const openArrivalStep = useCallback(
    (step: ArrivalStep) => {
      if (step.href) {
        router.push(step.href);
        return;
      }
      if (step.guideId) {
        const guide = lifeGuides.find(
          (g) => g.id === step.guideId && g.isPublished,
        );
        if (guide) {
          setActiveGuide(guide);
          return;
        }
      }
      if (step.categoryId) {
        setSelectedCategory(step.categoryId === "all" ? "all" : step.categoryId);
        setSearchQuery("");
        document
          .getElementById("life-guide-guides")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [router],
  );

  const categories = categoriesConfig.map((category) => ({
    ...category,
    name: t(`lifeGuide.categories.${category.id}`),
  }));

  useEffect(() => {
    setGuidesVisibleCount(12);
  }, [searchQuery, selectedCategory]);

  // Фильтрация гайдов
  const filteredGuides = useMemo(() => {
    let filtered = lifeGuides.filter((guide) => guide.isPublished);

    // Фильтр по поиску
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (guide) =>
          guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guide.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guide.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Фильтр по категории
    if (selectedCategory !== "all") {
      filtered = filtered.filter((guide) => {
        switch (selectedCategory) {
          case "documents":
            return guide.tags.some((tag) =>
              [
                "ИНН",
                "СНИЛС",
                "документы",
                "паспорт",
                "потеря",
                "замена",
                "миграция",
                "регистрация",
                "РВП",
                "РВПО",
                "ВНЖ",
                "виза",
                "учёт",
                "расходы",
                "госпошлина",
              ].includes(tag)
            );
          case "housing":
            return guide.tags.some((tag) =>
              [
                "общежитие",
                "регистрация",
                "аренда",
                "квартира",
                "договор",
              ].includes(tag)
            );
          case "transport":
            return guide.tags.some((tag) =>
              ["транспорт", "метро", "карты"].includes(tag)
            );
          case "health":
            return guide.tags.some((tag) =>
              [
                "медицина",
                "врач",
                "здоровье",
                "полис",
                "ОМС",
                "страховка",
                "запись",
                "приём",
                "стоматология",
                "зубы",
                "лечение",
                "аптека",
                "лекарства",
                "рецепт",
                "скорая",
                "экстренная",
                "помощь",
                "анализы",
                "лаборатория",
                "исследования",
              ].includes(tag)
            );
          case "services":
            return guide.tags.some((tag) =>
              [
                "банк",
                "карта",
                "платежи",
                "расходы",
                "госпошлина",
                "SIM",
                "связь",
                "телефон",
                "услуги",
                "быт",
                "магазины",
                "адаптация",
                "общение",
              ].includes(tag)
            );
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8">
        {/* Hero — compact; crop so the person stays a bit visible on lg+ */}
        <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden mb-6 sm:mb-8 min-h-[340px] sm:min-h-[420px] lg:min-h-[460px] bg-slate-200">
          <HeroBackgroundImage
            src="/image-banner/image-life-guide.png"
            imageClassName="object-cover object-top lg:object-[70%_40%]"
          />
          <div className="absolute inset-0 bg-black/40 lg:bg-black/32" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent lg:from-black/48 lg:via-black/20 lg:to-black/5" aria-hidden />

          <div className="relative z-10 mx-auto flex h-full min-h-[340px] sm:min-h-[420px] lg:min-h-[460px] max-w-7xl items-center px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="w-full max-w-xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 shadow-sm">
                <Home className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                <span className="text-xs sm:text-sm font-medium text-emerald-700">
                  {t("lifeGuide.header.title")}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-3 sm:mb-4">
                {t("lifeGuide.header.title")}
              </h1>
              <p className="text-base sm:text-lg text-white/90 mb-5 sm:mb-6 leading-relaxed max-w-md">
                {t("lifeGuide.header.subtitle")}
              </p>

              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("life-guide-arrival")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="mb-7 sm:mb-8 inline-flex items-center gap-2 rounded-xl border border-white/35 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/25 transition-all"
              >
                <Plane className="h-4 w-4" aria-hidden />
                {t("lifeGuide.arrival.cta")}
              </button>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory((prev) =>
                          prev === category.id ? "all" : category.id,
                        );
                        document
                          .getElementById("life-guide-guides")
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all border ${
                        isActive
                          ? "bg-white text-indigo-700 border-white shadow-lg"
                          : "bg-white/15 text-white border-white/30 hover:bg-white/25"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 flex-shrink-0 ${
                          isActive ? "text-indigo-600" : "text-white"
                        }`}
                      />
                      <span className="truncate">{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Arrival checklist — «Я только приехал» */}
        <section
          id="life-guide-arrival"
          className="scroll-mt-20 rounded-2xl sm:rounded-3xl bg-white border border-slate-100 p-4 sm:p-6 shadow-sm"
        >
          <div className="mb-5 sm:mb-6">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-emerald-700 mb-1.5">
              {t("lifeGuide.header.title")}
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t("lifeGuide.arrival.title")}
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 max-w-2xl">
              {t("lifeGuide.arrival.subtitle")}
            </p>
          </div>

          <div className="space-y-5 sm:space-y-6">
            {arrivalPhases.map((phase, phaseIndex) => (
              <div key={phase.id}>
                <div className="flex items-baseline gap-2.5 mb-2.5">
                  <span className="text-xs font-bold tabular-nums text-emerald-600">
                    {String(phaseIndex + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                    {t(phase.titleKey)}
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {phase.steps.map((step) => (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => openArrivalStep(step)}
                      className="group flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-left text-sm font-medium text-slate-800 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                    >
                      <span className="min-w-0 flex-1 break-words leading-snug">
                        {t(step.labelKey)}
                      </span>
                      <ChevronRight
                        className="h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-emerald-600"
                        aria-hidden
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Emergency */}
        <section className="rounded-2xl sm:rounded-3xl border border-red-200 bg-red-50 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                <Phone className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-red-900">
                {t("lifeGuide.emergencyContacts.title")}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
              {emergencyContacts.map((contact) => (
                <a
                  key={contact.id}
                  href={`tel:${contact.number}`}
                  className="flex min-w-0 items-center justify-between gap-2 rounded-xl bg-white px-3 py-2.5 border border-red-100 shadow-sm hover:border-red-300 hover:shadow transition-all"
                >
                  <span className="min-w-0 flex-1 text-xs sm:text-sm text-red-900/80 leading-snug break-words">
                    {t(`lifeGuide.emergencyContacts.${contact.id}.title`)}
                  </span>
                  <span className="flex-shrink-0 text-base sm:text-lg font-bold tabular-nums text-red-600">
                    {contact.number}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Search */}
        <section
          id="life-guide-search"
          className="scroll-mt-20 rounded-2xl sm:rounded-3xl bg-white border border-slate-100 p-4 sm:p-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="life-guide-search-input"
                type="text"
                placeholder={t("lifeGuide.search.placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            {(searchQuery || selectedCategory !== "all") && (
              <Button
                variant="outline"
                className="h-11 rounded-xl flex items-center gap-2"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                <Filter className="h-4 w-4" />
                <span>{t("lifeGuide.search.reset")}</span>
              </Button>
            )}
          </div>
        </section>

        {/* Guides */}
        <section
          id="life-guide-guides"
          className="scroll-mt-20 rounded-2xl sm:rounded-3xl bg-white border border-slate-100 p-4 sm:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              {filteredGuides.length === 0
                ? t("lifeGuide.guidesNotFound")
                : t("lifeGuide.guidesFound").replace(
                    "{count}",
                    String(filteredGuides.length),
                  )}
            </h2>
            {(searchQuery || selectedCategory !== "all") && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                {t("lifeGuide.showAll")}
              </Button>
            )}
          </div>

          {filteredGuides.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredGuides.slice(0, guidesVisibleCount).map((guide) => (
                  <GuideCard
                    key={`guide-${guide.id}`}
                    guide={guide}
                    isRead={isRead(guide.id)}
                    onRead={handleMarkRead}
                  />
                ))}
              </div>
              {filteredGuides.length > guidesVisibleCount && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setGuidesVisibleCount((n) => n + 12)}
                    className="min-w-[200px] rounded-xl"
                  >
                    {t("lifeGuide.showMore")}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Home className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {t("lifeGuide.guides.empty.title")}
              </h3>
              <p className="text-slate-600">
                {t("lifeGuide.guides.empty.description")}
              </p>
            </div>
          )}
        </section>

        <GuideDetailModal
          guide={activeGuide}
          isOpen={!!activeGuide}
          onClose={() => {
            if (activeGuide) handleMarkRead(activeGuide.id);
            setActiveGuide(null);
          }}
        />
      </div>
    </Layout>
  );
}
