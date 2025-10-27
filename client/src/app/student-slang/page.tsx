"use client";

import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  Sparkles,
  TrendingUp,
  Languages,
  ArrowLeft,
} from "lucide-react";

interface SlangTerm {
  term: string;
  pronunciation?: string;
  meaning: string;
  example: string;
  category: "университет" | "быт" | "сленг" | "оценки" | "процессы";
  popularity: "🔥 Очень популярный" | "⭐ Популярный" | "📚 Базовый";
}

const slangDictionary: SlangTerm[] = [
  {
    term: "Экзамен",
    meaning: "Форма контроля знаний с оценкой 2-5 баллов",
    example: "Завтра экзамен по математике",
    category: "процессы",
    popularity: "📚 Базовый",
  },
  {
    term: "Зачёт",
    meaning: "Форма контроля знаний с оценкой зачтено/не зачтено",
    example: "Получил зачёт по философии",
    category: "процессы",
    popularity: "📚 Базовый",
  },
  {
    term: "Сессия",
    meaning: "Период сдачи экзаменов (обычно декабрь и май)",
    example: "В следующем месяце начинается сессия",
    category: "университет",
    popularity: "🔥 Очень популярный",
  },
  {
    term: "Стипуха",
    meaning: "Стипендия",
    example: "Пришла стипуха, можем пойти в кафе",
    category: "университет",
    popularity: "⭐ Популярный",
  },
  {
    term: "Дедлайн",
    meaning: "Крайний срок сдачи работы",
    example: "У меня дедлайн по курсачу в пятницу",
    category: "процессы",
    popularity: "🔥 Очень популярный",
  },
  {
    term: "Курсач",
    meaning: "Курсовая работа",
    example: "Нужно писать курсач",
    category: "университет",
    popularity: "⭐ Популярный",
  },
  {
    term: "Домашка",
    meaning: "Домашнее задание",
    example: "Много домашки по английскому",
    category: "процессы",
    popularity: "⭐ Популярный",
  },
  {
    term: "Коллоквиум",
    meaning: "Устное собеседование с преподавателем",
    example: "Завтра коллоквиум по истории",
    category: "процессы",
    popularity: "📚 Базовый",
  },
  {
    term: "Балик",
    meaning: "Балл (оценка)",
    example: "Получил хороший балик на экзамене",
    category: "оценки",
    popularity: "⭐ Популярный",
  },
  {
    term: "Пара",
    meaning: "Учебное занятие продолжительностью 1.5 часа",
    example: "У меня 3 пары сегодня",
    category: "университет",
    popularity: "🔥 Очень популярный",
  },
  {
    term: "Лекция",
    meaning: "Монолог преподавателя",
    example: "На лекции рассказывали про квантовую физику",
    category: "университет",
    popularity: "📚 Базовый",
  },
  {
    term: "Семинар",
    meaning: "Интерактивное занятие с обсуждением",
    example: "На семинаре обсуждали новую тему",
    category: "университет",
    popularity: "📚 Базовый",
  },
  {
    term: "Лабка",
    meaning: "Лабораторная работа",
    example: "Сегодня делаем лабку по химии",
    category: "университет",
    popularity: "⭐ Популярный",
  },
  {
    term: "Староста",
    meaning: "Студент-представитель группы",
    example: "Спроси у старосты о собрании",
    category: "университет",
    popularity: "📚 Базовый",
  },
  {
    term: "Деканат",
    meaning: "Административный орган факультета",
    example: "Нужно сходить в деканат за справкой",
    category: "университет",
    popularity: "📚 Базовый",
  },
  {
    term: "Ботаник",
    meaning: "Студент, который много учится",
    example: "Ты настоящий ботаник!",
    category: "сленг",
    popularity: "⭐ Популярный",
  },
  {
    term: "Хвост",
    meaning: "Несданный зачёт или экзамен",
    example: "У меня два хвоста от прошлой сессии",
    category: "сленг",
    popularity: "🔥 Очень популярный",
  },
  {
    term: "Залёт",
    meaning: "Успешная сдача экзамена без особых усилий",
    example: "Получил залёт по истории",
    category: "сленг",
    popularity: "⭐ Популярный",
  },
  {
    term: "Свалить",
    meaning: "Уйти с занятия раньше",
    example: "Давай свалим с последней пары",
    category: "сленг",
    popularity: "⭐ Популярный",
  },
  {
    term: "Шпора",
    meaning: "Шпаргалка",
    example: "Написал шпоры для экзамена",
    category: "сленг",
    popularity: "🔥 Очень популярный",
  },
  {
    term: "Госы",
    meaning: "Государственные экзамены",
    example: "Готовлюсь к госам",
    category: "процессы",
    popularity: "⭐ Популярный",
  },
  {
    term: "Дипломка",
    meaning: "Дипломная работа",
    example: "Пишу дипломку",
    category: "университет",
    popularity: "⭐ Популярный",
  },
  {
    term: "Прокачка",
    meaning: "Улучшение, развитие навыков",
    example: "Нужна прокачка английского",
    category: "сленг",
    popularity: "⭐ Популярный",
  },
  {
    term: "Автомат",
    meaning: "Автоматический зачёт или экзамен без сдачи",
    example: "Получил автомат по физре",
    category: "сленг",
    popularity: "🔥 Очень популярный",
  },
  {
    term: "Пересдача",
    meaning: "Повторная сдача экзамена",
    example: "Иду на пересдачу",
    category: "процессы",
    popularity: "📚 Базовый",
  },
  {
    term: "Стажировка",
    meaning: "Временная работа для получения опыта",
    example: "Прошёл стажировку в компании",
    category: "быт",
    popularity: "📚 Базовый",
  },
  {
    term: "Общага",
    meaning: "Общежитие",
    example: "Живу в общаге",
    category: "быт",
    popularity: "🔥 Очень популярный",
  },
  {
    term: "Стипендия",
    meaning: "Денежная выплата студентам",
    example: "Получил стипендию",
    category: "быт",
    popularity: "📚 Базовый",
  },
];

export default function StudentSlangPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("все");

  const filteredTerms = useMemo(() => {
    return slangDictionary.filter((term) => {
      const matchesSearch =
        term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.example.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "все" || term.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const categories = [
    "все",
    "университет",
    "быт",
    "сленг",
    "оценки",
    "процессы",
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link href="/education-guide">
            <Button variant="ghost" className="mb-6 hover:bg-blue-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к гайдам
            </Button>
          </Link>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Словарь студенческого сленга
            </h1>
            <p className="text-xl text-gray-600">
              Понимай студентов России и говори как свой! 🇷🇺
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Поиск термина или значения..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === category
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {slangDictionary.length}
                    </p>
                    <p className="text-sm text-gray-600">Терминов</p>
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
                        slangDictionary.filter((t) =>
                          t.popularity.includes("Очень популярный")
                        ).length
                      }
                    </p>
                    <p className="text-sm text-gray-600">Самых популярных</p>
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
                    <p className="text-sm text-gray-600">Найдено</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dictionary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTerms.map((term, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow duration-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{term.term}</CardTitle>
                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                      {term.popularity}
                    </span>
                  </div>
                  {term.pronunciation && (
                    <p className="text-sm text-gray-500 italic">
                      [{term.pronunciation}]
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Значение:
                    </p>
                    <p className="text-sm text-gray-600">{term.meaning}</p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-3 bg-blue-50 rounded">
                    <p className="text-sm italic text-gray-700">
                      "{term.example}"
                    </p>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <Languages className="h-3 w-3 mr-1" />
                      {term.category}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredTerms.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Ничего не найдено
                </h3>
                <p className="text-gray-600">
                  Попробуйте изменить поисковый запрос или фильтр
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
