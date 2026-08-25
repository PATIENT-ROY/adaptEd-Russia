"use client";

import { Layout } from "@/components/layout/layout";
import { GuideCard } from "@/components/ui/guide-card";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  BookOpen,
  GraduationCap,
  FileText,
  Clock,
  Languages,
  AlertTriangle,
  ArrowRight,
  Building2,
} from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { Guide } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useGuideProgress } from "@/hooks/useGuideProgress";
import { useGuideDeeplink } from "@/hooks/useGuideDeeplink";
import { educationGuides } from "@/data/education-guides";
import { HeroBackgroundImage } from "@/components/ui/hero-background-image";

type Category = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
};

const categoriesConfig: Omit<Category, "name">[] = [
  { id: "exams", icon: GraduationCap },
  { id: "papers", icon: BookOpen },
  { id: "documents", icon: FileText },
  { id: "structure", icon: Building2 },
  { id: "expulsion-risks", icon: AlertTriangle },
];

type ToolCard = {
  id: "schedule" | "dictionary" | "translation-centers";
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
};

const articleGuides = educationGuides.filter(
  (guide) => guide.id !== "slang-dictionary",
);

const ENABLED_CATEGORY_IDS = new Set([
  "all",
  "exams",
  "papers",
  "documents",
  "structure",
  "expulsion-risks",
]);

const HERO_CATEGORY_IDS = new Set([
  "exams",
  "papers",
  "documents",
  "structure",
  "expulsion-risks",
]);

export function EducationGuideContent() {
  const { t } = useTranslation();
  const urlQuery = useGuideDeeplink("education-guide-search");
  const [typedQuery, setTypedQuery] = useState<string | null>(null);
  const searchQuery = typedQuery ?? urlQuery;
  const setSearchQuery = useCallback((value: string) => {
    setTypedQuery(value);
  }, []);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { isRead, markAsRead } = useGuideProgress(
    "education",
    articleGuides.length,
  );

  const handleMarkRead = useCallback(
    (guideId: string) => {
      markAsRead(guideId);
    },
    [markAsRead],
  );
  const [guidesVisibleCount, setGuidesVisibleCount] = useState(12);

  const categories: Category[] = categoriesConfig
    .filter((category) => ENABLED_CATEGORY_IDS.has(category.id))
    .map((category) => ({
      ...category,
      name: t(`educationGuide.categories.${category.id}`),
    }));
  const heroCategories = categories.filter((category) =>
    HERO_CATEGORY_IDS.has(category.id),
  );
  const toolCards: ToolCard[] = [
    {
      id: "schedule",
      name: t("educationGuide.categories.schedule"),
      description: t("educationGuide.tools.scheduleDescription"),
      icon: Clock,
      href: "/education/schedule",
    },
    {
      id: "dictionary",
      name: t("educationGuide.categories.dictionary"),
      description: t("educationGuide.tools.dictionaryDescription"),
      icon: BookOpen,
      href: "/education/student-slang",
    },
    {
      id: "translation-centers",
      name: t("educationGuide.categories.translation-centers"),
      description: t("educationGuide.tools.translationCentersDescription"),
      icon: Languages,
      href: "/education/translation-centers",
    },
  ];
  const safeSelectedCategory = ENABLED_CATEGORY_IDS.has(selectedCategory)
    ? selectedCategory
    : "all";

  // Сброс пагинации при смене фильтров (улучшает Performance — меньше DOM при первой отрисовке)
  useEffect(() => {
    setGuidesVisibleCount(12);
  }, [searchQuery, selectedCategory]);

  // Любая неизвестная/устаревшая категория сбрасывается на "all".
  useEffect(() => {
    if (!ENABLED_CATEGORY_IDS.has(selectedCategory)) {
      setSelectedCategory("all");
    }
  }, [selectedCategory]);

  // Фильтрация гайдов
  const filteredGuides = useMemo(() => {
    let filtered = articleGuides.filter((guide) => guide.isPublished);

    // Фильтр по поиску
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (guide) =>
          guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guide.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guide.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    // Фильтр по категории
    if (safeSelectedCategory !== "all") {
      filtered = filtered.filter((guide) => {
        switch (safeSelectedCategory) {
          case "exams":
            return guide.tags.some((tag) =>
              ["сессия", "экзамены", "незачёт", "зачёт", "пересдача"].includes(
                tag,
              ),
            );
          case "papers":
            return guide.tags.some((tag) =>
              [
                "курсовая",
                "написание",
                "исследование",
                "научная работа",
                "ГОСТ",
              ].includes(tag),
            );
          case "documents":
            // Только учебные документы вуза — миграция/виза/РВПО живут в «Быт»
            return guide.tags.some((tag) =>
              [
                "учебные документы",
                "справка",
                "зачётка",
                "студенческий",
                "выписка",
                "справка-вызов",
                "академический отпуск",
              ].includes(tag),
            );
          case "structure":
            return guide.tags.some((tag) =>
              ["структура", "кафедра", "ректорат", "для новичков"].includes(
                tag,
              ),
            );
          case "expulsion-risks":
            return guide.tags.some((tag) =>
              [
                "отчисление",
                "риски",
                "неуспеваемость",
                "посещаемость",
                "долги",
                "хвосты",
                "восстановление",
                "дисциплина",
                "пропуски",
              ].includes(tag),
            );
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [searchQuery, safeSelectedCategory]);

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8">
        {/* Hero — compact height; crop biased so student peeks in on the right */}
        <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden mb-6 sm:mb-8 min-h-[340px] sm:min-h-[420px] lg:min-h-[460px] bg-slate-200">
          <HeroBackgroundImage
            src="/image-banner/image-education-guide.png"
            imageClassName="object-cover object-top lg:object-[72%_58%]"
          />
          <div className="absolute inset-0 bg-black/40 lg:bg-black/32" aria-hidden />
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-transparent lg:from-black/50 lg:via-black/22 lg:to-black/5"
            aria-hidden
          />

          <div className="relative z-10 mx-auto flex h-full min-h-[340px] sm:min-h-[420px] lg:min-h-[460px] max-w-7xl items-center px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="w-full max-w-xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 shadow-sm">
                <GraduationCap
                  className="h-3.5 w-3.5 text-indigo-600"
                  aria-hidden
                />
                <span className="text-xs sm:text-sm font-medium text-indigo-700">
                  {t("educationGuide.header.title")}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-3 sm:mb-4">
                {t("educationGuide.header.title")}
              </h1>
              <p className="text-base sm:text-lg text-white/90 mb-7 sm:mb-8 leading-relaxed max-w-md">
                {t("educationGuide.header.subtitle")}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {heroCategories.map((category) => {
                  const Icon = category.icon;
                  const isActive = safeSelectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory((prev) =>
                          prev === category.id ? "all" : category.id,
                        );
                        document
                          .getElementById("education-guide-guides")
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                      }}
                      className={`flex min-w-0 items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-all border ${
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
                      <span className="min-w-0 flex-1 leading-snug break-words">
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Tools */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-blue-100">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                {t("educationGuide.tools.title")}
              </h2>
              <p className="text-sm text-gray-600">
                {t("educationGuide.tools.subtitle")}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {toolCards.map((tool) => {
              const Icon = tool.icon;

              const cardContent = (
                <div className="h-full rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-all duration-300 hover:bg-white hover:shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500">
                      {t("educationGuide.tools.separate")}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-gray-900">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-gray-600 min-h-[40px]">
                      {tool.description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center text-sm font-medium text-blue-700">
                    <span>{t("educationGuide.tools.goTo")}</span>
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </div>
              );

              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="block h-full"
                  data-tool={tool.id}
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Search and Filters */}
        <div
          id="education-guide-search"
          className="scroll-mt-24 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all duration-300"
        >
          <div className="mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              {t("educationGuide.learn.title")}
            </h2>
            <p className="text-sm text-gray-600">
              {t("educationGuide.learn.subtitle")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-colors duration-300" />
              <input
                id="education-guide-search-input"
                type="text"
                placeholder={t("educationGuide.search.placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-400"
              />
            </div>
            {(searchQuery || safeSelectedCategory !== "all") && (
              <Button
                variant="outline"
                className="flex items-center space-x-2 w-full sm:w-auto transition-all duration-300 hover:bg-gray-50 hover:shadow-md"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                <Filter className="h-4 w-4 transition-all duration-300" />
                <span>{t("educationGuide.search.reset")}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Guides */}
        <div
          id="education-guide-guides"
          className="scroll-mt-24 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 transition-all duration-300">
              {filteredGuides.length === 0
                ? t("educationGuide.guidesNotFound")
                : t("educationGuide.guidesFound").replace(
                    "{count}",
                    String(filteredGuides.length),
                  )}
            </h2>
            {(searchQuery || safeSelectedCategory !== "all") && (
              <Button
                variant="outline"
                size="sm"
                className="transition-all duration-300 hover:bg-gray-50"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                {t("educationGuide.showAll")}
              </Button>
            )}
          </div>
          {filteredGuides.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 transition-all duration-500 ease-out">
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
                    className="min-w-[200px]"
                  >
                    {t("educationGuide.showMore")}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4 transition-all duration-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("educationGuide.guides.notFound")}
              </h3>
              <p className="text-gray-600">
                {t("educationGuide.guides.tryChangeSearch")}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
