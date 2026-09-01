"use client";

import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import {
  Search,
  BookOpen,
  Sparkles,
  TrendingUp,
  Languages,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { BackButton } from "@/components/ui/back-button";
import {
  slangDictionary,
  pickLocalized,
  type SlangCategory,
} from "@/data/student-slang";

export default function StudentSlangPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | SlangCategory
  >("all");
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();

  const filteredTerms = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return slangDictionary.filter((term) => {
      const meaning = pickLocalized(term.meaning, currentLanguage);
      const example = pickLocalized(term.example, currentLanguage);
      const meaningRu = term.meaning[Language.RU];
      const exampleRu = term.example[Language.RU];

      const matchesSearch =
        !query ||
        term.term.toLowerCase().includes(query) ||
        meaning.toLowerCase().includes(query) ||
        example.toLowerCase().includes(query) ||
        meaningRu.toLowerCase().includes(query) ||
        exampleRu.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "all" || term.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory, currentLanguage]);

  const categories: { value: "all" | SlangCategory; labelKey: string }[] = [
    { value: "all", labelKey: "studentSlang.categories.all" },
    { value: "university", labelKey: "studentSlang.categories.university" },
    { value: "life", labelKey: "studentSlang.categories.life" },
    { value: "slang", labelKey: "studentSlang.categories.slang" },
    { value: "grades", labelKey: "studentSlang.categories.grades" },
    { value: "processes", labelKey: "studentSlang.categories.processes" },
  ];

  const phoneticLanguageMap: Record<Language, string> = {
    [Language.RU]: "ru",
    [Language.EN]: "en",
    [Language.FR]: "fr",
    [Language.AR]: "ar",
    [Language.ZH]: "zh",
  };

  const activePhoneticCode = phoneticLanguageMap[currentLanguage] ?? "en";

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton
            href="/education-guide"
            label={t("studentSlang.back")}
            className="mb-6"
          />

          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t("studentSlang.title")}
            </h1>
            <p className="text-xl text-gray-600">
              {t("studentSlang.subtitle")}
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={t("studentSlang.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === category.value
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {t(category.labelKey)}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-gray-500">
                  {t("studentSlang.pronunciationInfo")}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {slangDictionary.length}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t("studentSlang.stats.terms")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Sparkles className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {
                        slangDictionary.filter((term) => term.popularity === "hot")
                          .length
                      }
                    </p>
                    <p className="text-sm text-gray-600">
                      {t("studentSlang.stats.popular")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredTerms.length}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t("studentSlang.stats.found")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTerms.map((term) => (
              <Card
                key={term.term}
                className="hover:shadow-lg transition-shadow duration-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{term.term}</CardTitle>
                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                      {t(`studentSlang.popularity.${term.popularity}`)}
                    </span>
                  </div>
                  {term.pronunciation?.[activePhoneticCode] && (
                    <p className="text-sm text-gray-500 italic">
                      [{term.pronunciation[activePhoneticCode]}]
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {t("studentSlang.meaning")}
                    </p>
                    <p className="text-sm text-gray-600">
                      {pickLocalized(term.meaning, currentLanguage)}
                    </p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-3 bg-blue-50 rounded">
                    <p className="text-sm italic text-gray-700">
                      &ldquo;{pickLocalized(term.example, currentLanguage)}&rdquo;
                    </p>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <Languages className="h-3 w-3 mr-1" />
                      {t(`studentSlang.categories.${term.category}`)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTerms.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("studentSlang.empty.title")}
                </h3>
                <p className="text-gray-600">
                  {t("studentSlang.empty.description")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
