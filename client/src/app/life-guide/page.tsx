"use client";

import { Layout } from "@/components/layout/layout";
import { GuideCard } from "@/components/ui/guide-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Filter,
  Home,
  Building,
  Bus,
  FileText,
  Shield,
  Phone,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Guide, GuideCategory, Language, Difficulty } from "@/types";

// Моковые данные бытовых гайдов
const lifeGuides: Guide[] = [
  {
    id: "1",
    title: "Как зарегистрироваться в общежитии",
    category: GuideCategory.LIFE,
    content: "Пошаговая инструкция по регистрации в студенческом общежитии...",
    language: Language.RU,
    tags: ["общежитие", "регистрация", "документы"],
    difficulty: Difficulty.BEGINNER,
    isPublished: true,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20",
  },
  {
    id: "2",
    title: "Получение ИНН и СНИЛС",
    category: GuideCategory.LIFE,
    content: "Как получить налоговый номер и страховое свидетельство...",
    language: Language.RU,
    tags: ["ИНН", "СНИЛС", "документы"],
    difficulty: Difficulty.INTERMEDIATE,
    isPublished: true,
    createdAt: "2024-01-10",
    updatedAt: "2024-01-18",
  },
  {
    id: "3",
    title: "Что делать при потере паспорта",
    category: GuideCategory.LIFE,
    content: "Алгоритм действий при утере или краже паспорта...",
    language: Language.RU,
    tags: ["паспорт", "потеря", "замена"],
    difficulty: Difficulty.ADVANCED,
    isPublished: true,
    createdAt: "2024-01-05",
    updatedAt: "2024-01-12",
  },
  {
    id: "4",
    title: "Как вызвать врача в России",
    category: GuideCategory.LIFE,
    content: "Получение медицинской помощи и вызов врача на дом...",
    language: Language.RU,
    tags: ["медицина", "врач", "здоровье"],
    difficulty: Difficulty.INTERMEDIATE,
    isPublished: true,
    createdAt: "2024-01-08",
    updatedAt: "2024-01-15",
  },
  {
    id: "5",
    title: "Транспорт в России: метро, автобусы, такси",
    category: GuideCategory.LIFE,
    content:
      "Как пользоваться общественным транспортом в российских городах...",
    language: Language.RU,
    tags: ["транспорт", "метро", "карты"],
    difficulty: Difficulty.BEGINNER,
    isPublished: true,
    createdAt: "2024-01-12",
    updatedAt: "2024-01-19",
  },
  {
    id: "6",
    title: "Аренда квартиры: права и обязанности",
    category: GuideCategory.LIFE,
    content: "Всё об аренде жилья: договоры, оплата, коммунальные услуги...",
    language: Language.RU,
    tags: ["аренда", "квартира", "договор"],
    difficulty: Difficulty.ADVANCED,
    isPublished: true,
    createdAt: "2024-01-03",
    updatedAt: "2024-01-10",
  },
  {
    id: "7",
    title: "Проверка миграционной карты",
    category: GuideCategory.LIFE,
    content: "Что проверяют при контроле миграционной карты...",
    language: Language.RU,
    tags: ["миграция", "карта", "контроль"],
    difficulty: Difficulty.ADVANCED,
    isPublished: true,
    createdAt: "2024-01-07",
    updatedAt: "2024-01-14",
  },
  {
    id: "8",
    title: "Банковские карты и оплата услуг",
    category: GuideCategory.LIFE,
    content: "Как открыть счёт, пользоваться картой и оплачивать услуги...",
    language: Language.RU,
    tags: ["банк", "карта", "платежи"],
    difficulty: Difficulty.INTERMEDIATE,
    isPublished: true,
    createdAt: "2024-01-09",
    updatedAt: "2024-01-16",
  },
  {
    id: "9",
    title: "Как получить полис ОМС",
    category: GuideCategory.LIFE,
    content:
      "Пошаговая инструкция по получению обязательного медицинского страхования. Где получить, какие документы нужны, сроки оформления и что покрывает полис ОМС.",
    language: Language.RU,
    tags: ["медицина", "полис", "ОМС", "страховка"],
    difficulty: Difficulty.INTERMEDIATE,
    isPublished: true,
    createdAt: "2024-01-20",
    updatedAt: "2024-01-20",
  },
  {
    id: "10",
    title: "Как записаться к врачу",
    category: GuideCategory.LIFE,
    content:
      "Способы записи к врачу: через интернет, по телефону, в регистратуре. Как выбрать специалиста, подготовиться к приёму и что взять с собой.",
    language: Language.RU,
    tags: ["медицина", "врач", "запись", "приём"],
    difficulty: Difficulty.BEGINNER,
    isPublished: true,
    createdAt: "2024-01-20",
    updatedAt: "2024-01-20",
  },
  {
    id: "11",
    title: "Стоматология в России",
    category: GuideCategory.LIFE,
    content:
      "Как найти стоматолога, что входит в ОМС, платные услуги. Подготовка к визиту, стоимость лечения и профилактика.",
    language: Language.RU,
    tags: ["медицина", "стоматология", "зубы", "лечение"],
    difficulty: Difficulty.INTERMEDIATE,
    isPublished: true,
    createdAt: "2024-01-20",
    updatedAt: "2024-01-20",
  },
  {
    id: "12",
    title: "Аптеки и лекарства",
    category: GuideCategory.LIFE,
    content:
      "Как найти аптеку, рецептурные и безрецептурные лекарства. Российские аналоги, цены и правила покупки медикаментов.",
    language: Language.RU,
    tags: ["медицина", "аптека", "лекарства", "рецепт"],
    difficulty: Difficulty.BEGINNER,
    isPublished: true,
    createdAt: "2024-01-20",
    updatedAt: "2024-01-20",
  },
  {
    id: "13",
    title: "Экстренная медицинская помощь",
    category: GuideCategory.LIFE,
    content:
      "Что делать в экстренных случаях, когда вызывать скорую, как описать симптомы. Первая помощь до приезда врачей.",
    language: Language.RU,
    tags: ["медицина", "скорая", "экстренная", "помощь"],
    difficulty: Difficulty.ADVANCED,
    isPublished: true,
    createdAt: "2024-01-20",
    updatedAt: "2024-01-20",
  },
  {
    id: "14",
    title: "Медицинские анализы",
    category: GuideCategory.LIFE,
    content:
      "Где сдать анализы, подготовка к исследованиям, сроки готовности. Бесплатные и платные анализы, расшифровка результатов.",
    language: Language.RU,
    tags: ["медицина", "анализы", "лаборатория", "исследования"],
    difficulty: Difficulty.INTERMEDIATE,
    isPublished: true,
    createdAt: "2024-01-20",
    updatedAt: "2024-01-20",
  },
];

const categories = [
  { id: "all", name: "Все", icon: Home },
  { id: "documents", name: "Документы", icon: FileText },
  { id: "housing", name: "Жильё", icon: Building },
  { id: "transport", name: "Транспорт", icon: Bus },
  { id: "health", name: "Здоровье", icon: Shield },
  { id: "services", name: "Услуги", icon: Phone },
];

const emergencyContacts = [
  { name: "Полиция", number: "102", description: "Экстренная помощь" },
  { name: "Скорая помощь", number: "103", description: "Медицинская помощь" },
  { name: "Пожарная служба", number: "101", description: "Пожар и ЧС" },
  {
    name: "Единая служба спасения",
    number: "112",
    description: "Общий номер экстренных служб",
  },
];

export default function LifeGuidePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Фильтрация гайдов
  const filteredGuides = useMemo(() => {
    let filtered = lifeGuides;

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
                "карта",
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
              ["банк", "карта", "платежи"].includes(tag)
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
            <div className="rounded-lg bg-green-50 p-3 w-fit">
              <Home className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Бытовой гид
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Пошаговые инструкции для жизни в России
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-4">
            Экстренные контакты
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {emergencyContacts.map((contact) => (
              <Card key={contact.name} className="border-red-200">
                <CardContent className="p-4">
                  <h3 className="font-medium text-red-900">{contact.name}</h3>
                  <p className="text-2xl font-bold text-red-600">
                    {contact.number}
                  </p>
                  <p className="text-sm text-red-700">{contact.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-colors duration-300" />
              <input
                type="text"
                placeholder="Поиск по инструкциям..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:border-gray-400"
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              return (
                <Button
                  key={category.id}
                  variant={isActive ? "default" : "outline"}
                  className={`flex flex-col items-center space-y-2 h-auto p-3 sm:p-4 text-sm sm:text-base transition-all duration-300 ease-out ${
                    isActive
                      ? "bg-green-600 text-white hover:bg-green-700 shadow-lg"
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
                ? "Инструкции не найдены"
                : `Найдено инструкций: ${filteredGuides.length}`}
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
                <Home className="h-12 w-12 text-gray-400 mx-auto mb-4 transition-all duration-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Инструкции не найдены
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
