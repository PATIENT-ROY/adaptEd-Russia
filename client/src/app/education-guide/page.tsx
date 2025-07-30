"use client";

import { Layout } from "@/components/layout/layout";
import { GuideCard } from "@/components/ui/guide-card";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  BookOpen,
  GraduationCap,
  Calendar,
  FileText,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Guide, GuideCategory, Language, Difficulty } from "@/types";

// Моковые данные гайдов
const educationGuides: Guide[] = [
  {
    id: "1",
    title: "Как сдать сессию в российском вузе",
    category: GuideCategory.EDUCATION,
    content: "Подробное руководство по подготовке и сдаче экзаменов...",
    language: Language.RU,
    tags: ["сессия", "экзамены", "подготовка"],
    difficulty: Difficulty.INTERMEDIATE,
    isPublished: true,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20",
  },
  {
    id: "2",
    title: "Что такое ГОСТ и как его использовать",
    category: GuideCategory.EDUCATION,
    content: "Объяснение системы ГОСТ и её применения в учёбе...",
    language: Language.RU,
    tags: ["ГОСТ", "стандарты", "оформление"],
    difficulty: Difficulty.BEGINNER,
    isPublished: true,
    createdAt: "2024-01-10",
    updatedAt: "2024-01-18",
  },
  {
    id: "3",
    title: "Структура вуза: кафедры, деканаты, ректорат",
    category: GuideCategory.EDUCATION,
    content: "Кто есть кто в российском университете...",
    language: Language.RU,
    tags: ["структура", "кафедра", "деканат"],
    difficulty: Difficulty.BEGINNER,
    isPublished: true,
    createdAt: "2024-01-05",
    updatedAt: "2024-01-12",
  },
  {
    id: "4",
    title: "Как писать курсовую работу",
    category: GuideCategory.EDUCATION,
    content: "Пошаговое руководство по написанию курсовой...",
    language: Language.RU,
    tags: ["курсовая", "написание", "исследование"],
    difficulty: Difficulty.INTERMEDIATE,
    isPublished: true,
    createdAt: "2024-01-08",
    updatedAt: "2024-01-15",
  },
  {
    id: "5",
    title: "Что делать при незачёте",
    category: GuideCategory.EDUCATION,
    content: "Алгоритм действий при получении незачёта...",
    language: Language.RU,
    tags: ["незачёт", "пересдача", "проблемы"],
    difficulty: Difficulty.INTERMEDIATE,
    isPublished: true,
    createdAt: "2024-01-12",
    updatedAt: "2024-01-19",
  },
  {
    id: "6",
    title: "Академический отпуск: когда и как",
    category: GuideCategory.EDUCATION,
    content: "Всё об академическом отпуске и его оформлении...",
    language: Language.RU,
    tags: ["академ", "отпуск", "оформление"],
    difficulty: Difficulty.ADVANCED,
    isPublished: true,
    createdAt: "2024-01-03",
    updatedAt: "2024-01-10",
  },
];

const categories = [
  { id: "all", name: "Все", icon: BookOpen },
  { id: "exams", name: "Экзамены", icon: GraduationCap },
  { id: "papers", name: "Работы", icon: FileText },
  { id: "structure", name: "Структура вуза", icon: Calendar },
];

export default function EducationGuidePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Фильтрация гайдов
  const filteredGuides = useMemo(() => {
    let filtered = educationGuides;

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
          case "exams":
            return guide.tags.some((tag) =>
              ["сессия", "экзамены", "незачёт", "пересдача"].includes(tag)
            );
          case "papers":
            return guide.tags.some((tag) =>
              ["курсовая", "написание", "исследование", "оформление"].includes(
                tag
              )
            );
          case "structure":
            return guide.tags.some((tag) =>
              ["структура", "кафедра", "деканат", "ГОСТ"].includes(tag)
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
        {/* Header */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="rounded-lg bg-blue-50 p-3 w-fit">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Образовательный навигатор
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Понятные гайды по системе образования в России
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-colors duration-300" />
              <input
                type="text"
                placeholder="Поиск по гайдам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-400"
              />
            </div>
            <Button
              variant="outline"
              className="flex items-center space-x-2 w-full sm:w-auto transition-all duration-300 hover:bg-gray-50 hover:shadow-md"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
            >
              <Filter className="h-4 w-4 transition-all duration-300" />
              <span>Сбросить</span>
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            Категории
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              return (
                <Button
                  key={category.id}
                  variant={isActive ? "default" : "outline"}
                  className={`flex flex-col items-center space-y-2 h-auto p-3 sm:p-4 text-sm sm:text-base transition-all duration-300 ease-out ${
                    isActive
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                      : "hover:bg-gray-50 hover:shadow-md"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <Icon
                    className={`h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300 ${
                      isActive ? "text-white" : "text-gray-600"
                    }`}
                  />
                  <span className="font-medium">{category.name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Guides Grid */}
        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 transition-all duration-300">
              {filteredGuides.length === 0
                ? "Гайды не найдены"
                : `Найдено гайдов: ${filteredGuides.length}`}
            </h2>
            {(searchQuery || selectedCategory !== "all") && (
              <Button
                variant="outline"
                size="sm"
                className="transition-all duration-300 hover:bg-gray-50"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                Показать все
              </Button>
            )}
          </div>
          <div className="transition-all duration-500 ease-out">
            {filteredGuides.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredGuides.map((guide, index) => (
                  <div
                    key={`guide-${guide.id}`}
                    className="h-[280px] animate-fade-in"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animationFillMode: "both",
                    }}
                  >
                    <GuideCard guide={guide} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 animate-fade-in">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4 transition-all duration-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Гайды не найдены
                </h3>
                <p className="text-gray-600">
                  Попробуйте изменить поисковый запрос или фильтры
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
