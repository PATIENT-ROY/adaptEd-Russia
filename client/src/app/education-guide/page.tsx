"use client";

import { Layout } from "@/components/layout/layout";
import { GuideCard } from "@/components/ui/guide-card";
import { Button } from "@/components/ui/button";
import {
  ScheduleFilter,
  ScheduleFilters,
} from "@/components/ui/schedule-filter";
import {
  Search,
  Filter,
  BookOpen,
  GraduationCap,
  Calendar,
  FileText,
  Clock,
  Award,
  DollarSign,
  Globe,
  Building,
  Star,
  Heart,
  Share2,
  Eye,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState, useMemo } from "react";
import {
  Guide,
  GuideCategory,
  Language,
  Difficulty,
  Grant,
  GrantType,
  GrantStatus,
  GrantLevel,
  GrantCategory,
} from "@/types";

// Моковые данные гайдов
const educationGuides: Guide[] = [
  {
    id: "0-main",
    title:
      "Как проходит обучение в российском вузе: полный гид для иностранных студентов",
    category: GuideCategory.EDUCATION,
    content:
      "Пошаговое руководство по учебному процессу в России. 1️⃣ Семестры: учебный год делится на 2 семестра (сентябрь-декабрь и февраль-май). 2️⃣ Лекции и семинары: посещение обязательно, ведётся учёт. 3️⃣ Контрольные точки: в течение семестра сдаёте контрольные работы и тесты. 4️⃣ Сессия: в конце семестра сдаёте зачёты и экзамены. 5️⃣ Оценки: используется 5-балльная система (5-отлично, 4-хорошо, 3-удовлетворительно, 2-неудовлетворительно). 6️⃣ Каникулы: летние (2 месяца) и зимние (2 недели). 7️⃣ Курсовые работы: пишете научные работы по специальности. 8️⃣ Практика: проходите производственную практику. 9️⃣ Дипломная работа: в конце обучения защищаете выпускную квалификационную работу.",
    language: Language.RU,
    tags: ["обучение", "процесс", "семестр", "для новичков", "начало"],
    difficulty: Difficulty.BEGINNER,
    isPublished: true,
    createdAt: "2024-01-21",
    updatedAt: "2024-01-21",
  },
  {
    id: "0",
    title: "Разница между экзамен и зачёт",
    category: GuideCategory.EDUCATION,
    content:
      "Основные отличия между экзаменом и зачётом в российской системе образования. Экзамен - это более серьёзная форма контроля с оценками от 2 до 5, требующая глубокой подготовки. Зачёт - это упрощённая форма с оценками 'зачтено' или 'не зачтено'...",
    language: Language.RU,
    tags: ["экзамены", "зачёт", "сессия", "оценки"],
    difficulty: Difficulty.BEGINNER,
    isPublished: true,
    createdAt: "2024-01-20",
    updatedAt: "2024-01-20",
  },
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
  {
    id: "7",
    title: "Словарь студенческого сленга",
    category: GuideCategory.EDUCATION,
    content: `Расшифровка популярных студенческих слов и выражений:

📚 УЧЁБА:
• Препод = Преподаватель
• Пара = Учебная пара (2 академических часа, 90 минут)
• Зачётка = Зачётная книжка
• Автомат = Автоматический зачёт (без экзамена)
• Хвост = Несданный экзамен или зачёт
• Шпора / Шпаргалка = Подсказка на экзамене
• Курсач = Курсовая работа
• Диплом = Дипломная работа
• Неуд = Неудовлетворительная оценка (2)
• Пересдача = Повторная сдача экзамена

🏫 УНИВЕРСИТЕТ:
• Вуз = Высшее учебное заведение
• Универ = Университет
• Общага = Общежитие
• Столовка = Столовая
• Библиотека = Часто просто "библиотека" 😊
• Кампус = Университетский городок
• Декан = Руководитель факультета
• Ректор = Руководитель университета
• Кафедра = Структурное подразделение факультета

⏰ ВРЕМЯ:
• Пара = Занятие (2 часа)
• Академ = Академический час (45 минут)
• Сессия = Период экзаменов
• Каникулы = Перерыв между семестрами
• Семестр = Половина учебного года

🎓 ОЦЕНКИ И ДОСТИЖЕНИЯ:
• Отлично = 5 баллов
• Хорошо = 4 балла
• Удовл = Удовлетворительно (3 балла)
• Неуд = Неудовлетворительно (2 балла)
• Зачёт = Положительная оценка без баллов
• Красный диплом = Диплом с отличием

💬 РАЗГОВОРНОЕ:
• Ботаник = Очень прилежный студент
• Халява = Лёгкий экзамен или задание
• Завалить = Не сдать экзамен
• Сдать = Успешно пройти экзамен
• Прогулять = Пропустить занятие`,
    language: Language.RU,
    tags: ["сленг", "словарь", "термины", "выражения"],
    difficulty: Difficulty.BEGINNER,
    isPublished: true,
    createdAt: "2024-01-21",
    updatedAt: "2024-01-21",
  },
];

// Моковые данные грантов и стипендий
const mockGrants: Grant[] = [
  {
    id: "1",
    title: "Стипендия Правительства РФ для иностранных студентов",
    description:
      "Полная стипендия для обучения в российских университетах по программам бакалавриата, магистратуры и аспирантуры.",
    amount: 150000,
    currency: "RUB",
    type: "GOVERNMENT" as GrantType,
    status: "ACTIVE" as GrantStatus,
    level: "ALL" as GrantLevel,
    category: "ACADEMIC" as GrantCategory,
    organization: "Министерство науки и высшего образования РФ",
    website: "https://education-in-russia.com",
    applicationDeadline: "2024-12-31",
    startDate: "2024-09-01",
    endDate: "2025-06-30",
    requirements: [
      "Возраст 18-35 лет",
      "Хорошая успеваемость (GPA 4.0+)",
      "Владение русским языком (B1+)",
      "Мотивационное письмо",
      "Рекомендательные письма",
    ],
    documents: [
      "Заявление",
      "Копия паспорта",
      "Аттестат/диплом",
      "Медицинская справка",
      "Сертификат о знании русского языка",
    ],
    benefits: [
      "Полное покрытие стоимости обучения",
      "Ежемесячная стипендия 150,000 ₽",
      "Бесплатное проживание в общежитии",
      "Медицинская страховка",
      "Компенсация проезда",
    ],
    eligibility: {
      countries: ["Все страны"],
      ageRange: { min: 18, max: 35 },
      gpa: 4.0,
      languageLevel: "B1+",
      studyField: ["Все направления"],
    },
    applicationProcess:
      "Онлайн подача заявки через портал education-in-russia.com",
    contactInfo: {
      email: "grants@minobrnauki.gov.ru",
      phone: "+7 (495) 123-45-67",
    },
    tags: ["правительство", "полная стипендия", "все уровни"],
    isFeatured: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "2",
    title: "Грант МГУ имени М.В. Ломоносова",
    description:
      "Стипендия для талантливых иностранных студентов, поступающих в Московский государственный университет.",
    amount: 80000,
    currency: "RUB",
    type: "UNIVERSITY" as GrantType,
    status: "ACTIVE" as GrantStatus,
    level: "MASTER" as GrantLevel,
    category: "MERIT_BASED" as GrantCategory,
    organization: "МГУ имени М.В. Ломоносова",
    website: "https://www.msu.ru",
    applicationDeadline: "2024-11-15",
    startDate: "2024-09-01",
    endDate: "2026-06-30",
    requirements: [
      "Диплом бакалавра с отличием",
      "Портфолио достижений",
      "Исследовательский проект",
      "Свободное владение русским языком",
    ],
    documents: [
      "Заявление",
      "Диплом бакалавра",
      "Портфолио",
      "Исследовательский проект",
      "Сертификат ТРКИ-2",
    ],
    benefits: [
      "Скидка 50% на обучение",
      "Ежемесячная стипендия 80,000 ₽",
      "Участие в научных конференциях",
      "Стажировки в ведущих компаниях",
    ],
    eligibility: {
      countries: ["Все страны"],
      gpa: 4.5,
      languageLevel: "B2+",
      studyField: ["Математика", "Физика", "Химия", "Биология", "Информатика"],
    },
    applicationProcess: "Подача документов через приемную комиссию МГУ",
    contactInfo: {
      email: "international@msu.ru",
      phone: "+7 (495) 939-10-00",
    },
    tags: ["МГУ", "магистратура", "наука"],
    isFeatured: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "3",
    title: "Стипендия Россотрудничества",
    description:
      "Государственная стипендия для граждан стран СНГ, обучающихся в российских вузах.",
    amount: 120000,
    currency: "RUB",
    type: "GOVERNMENT" as GrantType,
    status: "ACTIVE" as GrantStatus,
    level: "ALL" as GrantLevel,
    category: "ACADEMIC" as GrantCategory,
    organization: "Россотрудничество",
    website: "https://rs.gov.ru",
    applicationDeadline: "2024-10-31",
    startDate: "2024-09-01",
    endDate: "2025-06-30",
    requirements: [
      "Гражданство стран СНГ",
      "Хорошая успеваемость",
      "Знание русского языка",
      "Мотивационное письмо",
    ],
    documents: [
      "Заявление",
      "Копия паспорта",
      "Аттестат/диплом",
      "Медицинская справка",
      "Сертификат о знании русского языка",
    ],
    benefits: [
      "Полное покрытие обучения",
      "Ежемесячная стипендия 120,000 ₽",
      "Проживание в общежитии",
      "Медицинская страховка",
    ],
    eligibility: {
      countries: [
        "Азербайджан",
        "Армения",
        "Беларусь",
        "Казахстан",
        "Кыргызстан",
        "Молдова",
        "Таджикистан",
        "Туркменистан",
        "Узбекистан",
      ],
      ageRange: { min: 17, max: 30 },
      gpa: 3.8,
      languageLevel: "B1+",
    },
    applicationProcess:
      "Подача через представительства Россотрудничества в странах СНГ",
    contactInfo: {
      email: "grants@rs.gov.ru",
      phone: "+7 (495) 981-56-80",
    },
    tags: ["СНГ", "государственная", "все уровни"],
    isFeatured: false,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
];

const categories = [
  { id: "all", name: "Все", icon: BookOpen },
  { id: "grants", name: "Стипендия", icon: Award },
  { id: "schedule", name: "Расписание", icon: Clock },
  { id: "exams", name: "Экзамены", icon: GraduationCap },
  { id: "papers", name: "Работы", icon: FileText },
  { id: "structure", name: "Структура вуза", icon: Calendar },
  { id: "dictionary", name: "Словарь сленга", icon: BookOpen },
];

export default function EducationGuidePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showSchedule, setShowSchedule] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [grants] = useState<Grant[]>(mockGrants);
  const [grantSearchTerm, setGrantSearchTerm] = useState("");
  const [showGrantFilters, setShowGrantFilters] = useState(false);
  const [grantFilters, setGrantFilters] = useState<{
    type?: GrantType[];
    status?: GrantStatus[];
    level?: GrantLevel[];
    category?: GrantCategory[];
  }>({});
  const [favorites, setFavorites] = useState<string[]>([]);

  const handleShowSchedule = async (filters: ScheduleFilters) => {
    console.log("Показать расписание с фильтрами:", filters);
    setIsLoading(true);
    setShowSchedule(false);

    // Имитация загрузки данных
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsLoading(false);
    setShowSchedule(true);
    // Пока нет API ВУЗа, всегда показываем "Ничего не найдено"
  };

  // Функции для работы с грантами
  const toggleFavorite = (grantId: string) => {
    setFavorites((prev) =>
      prev.includes(grantId)
        ? prev.filter((id) => id !== grantId)
        : [...prev, grantId]
    );
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: currency === "RUB" ? "RUB" : "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: GrantStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "COMING_SOON":
        return "bg-blue-100 text-blue-800";
      case "EXPIRED":
        return "bg-gray-100 text-gray-800";
      case "CLOSED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: GrantType) => {
    switch (type) {
      case "GOVERNMENT":
        return <Building className="h-4 w-4" />;
      case "UNIVERSITY":
        return <GraduationCap className="h-4 w-4" />;
      case "PRIVATE":
        return <Award className="h-4 w-4" />;
      case "INTERNATIONAL":
        return <Globe className="h-4 w-4" />;
      case "RESEARCH":
        return <BookOpen className="h-4 w-4" />;
      case "EXCHANGE":
        return <Users className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  // Фильтрация грантов
  const filteredGrants = useMemo(() => {
    let filtered = grants;

    // Search filter
    if (grantSearchTerm) {
      filtered = filtered.filter(
        (grant) =>
          grant.title.toLowerCase().includes(grantSearchTerm.toLowerCase()) ||
          grant.description
            .toLowerCase()
            .includes(grantSearchTerm.toLowerCase()) ||
          grant.organization
            .toLowerCase()
            .includes(grantSearchTerm.toLowerCase()) ||
          grant.tags.some((tag) =>
            tag.toLowerCase().includes(grantSearchTerm.toLowerCase())
          )
      );
    }

    // Type filter
    if (grantFilters.type && grantFilters.type.length > 0) {
      filtered = filtered.filter((grant) =>
        grantFilters.type!.includes(grant.type)
      );
    }

    // Status filter
    if (grantFilters.status && grantFilters.status.length > 0) {
      filtered = filtered.filter((grant) =>
        grantFilters.status!.includes(grant.status)
      );
    }

    // Level filter
    if (grantFilters.level && grantFilters.level.length > 0) {
      filtered = filtered.filter((grant) =>
        grantFilters.level!.includes(grant.level)
      );
    }

    // Category filter
    if (grantFilters.category && grantFilters.category.length > 0) {
      filtered = filtered.filter((grant) =>
        grantFilters.category!.includes(grant.category)
      );
    }

    return filtered;
  }, [grants, grantSearchTerm, grantFilters]);

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
          case "schedule":
            return guide.tags.some((tag) =>
              ["расписание", "пары", "занятия", "время"].includes(tag)
            );
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
          case "dictionary":
            return guide.tags.some((tag) =>
              ["сленг", "словарь", "термины", "выражения"].includes(tag)
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

        {/* Content based on selected category */}
        {selectedCategory === "grants" ? (
          <div className="space-y-6">
            {/* Grants Search and Filters */}
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Поиск стипендий..."
                      value={grantSearchTerm}
                      onChange={(e) => setGrantSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Filter Toggle */}
                <Button
                  variant="outline"
                  onClick={() => setShowGrantFilters(!showGrantFilters)}
                  className="px-6 py-3"
                >
                  <Filter className="h-5 w-5 mr-2" />
                  Фильтры
                </Button>
              </div>

              {/* Filters Panel */}
              {showGrantFilters && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Type Filter */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Тип стипендии
                      </h4>
                      <div className="space-y-2">
                        {Object.values(GrantType).map((type) => (
                          <label
                            key={type}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={
                                grantFilters.type?.includes(type) || false
                              }
                              onChange={(e) => {
                                setGrantFilters((prev) => ({
                                  ...prev,
                                  type: e.target.checked
                                    ? [...(prev.type || []), type]
                                    : prev.type?.filter((t) => t !== type) ||
                                      [],
                                }));
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">
                              {type}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Level Filter */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Уровень образования
                      </h4>
                      <div className="space-y-2">
                        {Object.values(GrantLevel).map((level) => (
                          <label
                            key={level}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={
                                grantFilters.level?.includes(level) || false
                              }
                              onChange={(e) => {
                                setGrantFilters((prev) => ({
                                  ...prev,
                                  level: e.target.checked
                                    ? [...(prev.level || []), level]
                                    : prev.level?.filter((l) => l !== level) ||
                                      [],
                                }));
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">
                              {level}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Категория
                      </h4>
                      <div className="space-y-2">
                        {Object.values(GrantCategory).map((category) => (
                          <label
                            key={category}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={
                                grantFilters.category?.includes(category) ||
                                false
                              }
                              onChange={(e) => {
                                setGrantFilters((prev) => ({
                                  ...prev,
                                  category: e.target.checked
                                    ? [...(prev.category || []), category]
                                    : prev.category?.filter(
                                        (c) => c !== category
                                      ) || [],
                                }));
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">
                              {category}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Статус
                      </h4>
                      <div className="space-y-2">
                        {Object.values(GrantStatus).map((status) => (
                          <label
                            key={status}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={
                                grantFilters.status?.includes(status) || false
                              }
                              onChange={(e) => {
                                setGrantFilters((prev) => ({
                                  ...prev,
                                  status: e.target.checked
                                    ? [...(prev.status || []), status]
                                    : prev.status?.filter(
                                        (s) => s !== status
                                      ) || [],
                                }));
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">
                              {status}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results Count */}
            <div className="mb-4">
              <p className="text-gray-600">
                Найдено стипендий: {filteredGrants.length}
              </p>
            </div>

            {/* Grants Grid */}
            <div
              className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
              style={{ gridAutoRows: "1fr" }}
            >
              {filteredGrants.map((grant) => (
                <div
                  key={grant.id}
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-0 flex flex-col"
                >
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(grant.type)}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            grant.status
                          )}`}
                        >
                          {grant.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(grant.id)}
                          className="p-1 h-8 w-8"
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              favorites.includes(grant.id)
                                ? "fill-red-500 text-red-500"
                                : "text-gray-400"
                            }`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-8 w-8"
                        >
                          <Share2 className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>

                    <div className="h-6 mb-2">
                      {grant.isFeatured && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs sm:text-sm text-yellow-600 font-medium">
                            Рекомендуемый
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="h-16 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                        {grant.title}
                      </h3>
                    </div>

                    <div className="h-6 mb-3">
                      <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-600">
                        <Building className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="line-clamp-1">
                          {grant.organization}
                        </span>
                      </div>
                    </div>

                    <div className="h-12 mb-4">
                      <p className="text-gray-600 text-xs sm:text-sm leading-5 line-clamp-2">
                        {grant.description}
                      </p>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-gray-600 w-20 sm:w-24">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">Сумма:</span>
                        </div>
                        <span className="font-semibold text-green-600 text-right text-xs sm:text-sm">
                          {formatAmount(grant.amount, grant.currency)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-gray-600 w-20 sm:w-24">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">Дедлайн:</span>
                        </div>
                        <span className="font-medium text-red-600 text-right text-xs sm:text-sm">
                          {new Date(
                            grant.applicationDeadline
                          ).toLocaleDateString("ru-RU")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-gray-600 w-20 sm:w-24">
                          <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">Уровень:</span>
                        </div>
                        <span className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs font-medium bg-gray-100 text-gray-700 text-right">
                          {grant.level}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {grant.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                        >
                          {tag}
                        </span>
                      ))}
                      {grant.tags.length > 3 && (
                        <span className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          +{grant.tags.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-2 mt-auto">
                      <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs sm:text-sm">
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Подробнее
                      </Button>
                      <Button variant="outline" className="px-2 sm:px-3">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredGrants.length === 0 && (
              <div className="text-center py-12">
                <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Стипендии не найдены
                </h3>
                <p className="text-gray-600 mb-4">
                  Попробуйте изменить параметры поиска или фильтры
                </p>
                <Button
                  onClick={() => {
                    setGrantSearchTerm("");
                    setGrantFilters({});
                  }}
                >
                  Сбросить фильтры
                </Button>
              </div>
            )}
          </div>
        ) : selectedCategory === "schedule" ? (
          <div className="space-y-6">
            <ScheduleFilter onShowSchedule={handleShowSchedule} />
            {isLoading && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-center py-12">
                  <div className="animate-spin mb-4">
                    <Clock className="h-12 w-12 text-blue-600 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Поиск расписания...
                  </h3>
                  <p className="text-gray-600">
                    Пожалуйста, подождите, мы ищем ваше расписание
                  </p>
                </div>
              </div>
            )}
            {showSchedule && (
              <div className="bg-white rounded-lg p-6 shadow-sm animate-fade-in-up">
                <div className="text-center py-12">
                  <div className="animate-bounce mb-4">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2 animate-fade-in">
                    Ничего не найдено
                  </h3>
                  <p
                    className="text-gray-600 animate-fade-in"
                    style={{ animationDelay: "0.2s" }}
                  >
                    По вашему запросу расписание не найдено. Попробуйте изменить
                    параметры поиска.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
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
        )}
      </div>
    </Layout>
  );
}
