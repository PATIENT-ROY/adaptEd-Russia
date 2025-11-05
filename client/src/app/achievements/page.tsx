"use client";

import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Achievement, AchievementCategory } from "@/types";
import {
  Trophy,
  Lock,
  Sparkles,
  BookOpen,
  Home,
  Zap,
  Award,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

// Моковые данные достижений
const ACHIEVEMENTS: Achievement[] = [
  // GETTING_STARTED
  {
    id: "1",
    name: "Первые шаги",
    description: "Зарегистрировались на платформе",
    category: AchievementCategory.GETTING_STARTED,
    icon: "👋",
    xpReward: 10,
    requirement: "register",
    rarity: "common",
  },
  {
    id: "2",
    name: "Любознательный",
    description: "Прочитали первый гайд",
    category: AchievementCategory.GETTING_STARTED,
    icon: "📖",
    xpReward: 10,
    requirement: "read_1_guide",
    rarity: "common",
  },
  {
    id: "3",
    name: "Общительный",
    description: "Задали первый вопрос AI",
    category: AchievementCategory.GETTING_STARTED,
    icon: "💬",
    xpReward: 10,
    requirement: "ask_1_ai_question",
    rarity: "common",
  },
  {
    id: "4",
    name: "Организованный",
    description: "Создали первое напоминание",
    category: AchievementCategory.GETTING_STARTED,
    icon: "🔔",
    xpReward: 15,
    requirement: "create_1_reminder",
    rarity: "common",
  },
  {
    id: "4a",
    name: "Сканер",
    description: "Отсканировали первый документ",
    category: AchievementCategory.GETTING_STARTED,
    icon: "📄",
    xpReward: 15,
    requirement: "scan_1_document",
    rarity: "common",
  },

  // EDUCATION
  {
    id: "5",
    name: "Книжный червь",
    description: "Прочитали 10 гайдов по учёбе",
    category: AchievementCategory.EDUCATION,
    icon: "📚",
    xpReward: 50,
    requirement: "read_10_education_guides",
    rarity: "rare",
  },
  {
    id: "6",
    name: "Отличник",
    description: "Изучили все гайды про сессию",
    category: AchievementCategory.EDUCATION,
    icon: "🎓",
    xpReward: 75,
    requirement: "read_all_exam_guides",
    rarity: "rare",
  },
  {
    id: "7",
    name: "Исследователь",
    description: "Прочитали гайд про курсовую работу",
    category: AchievementCategory.EDUCATION,
    icon: "📝",
    xpReward: 20,
    requirement: "read_coursework_guide",
    rarity: "common",
  },
  {
    id: "8",
    name: "Стипендиат",
    description: "Изучили раздел стипендий",
    category: AchievementCategory.EDUCATION,
    icon: "💰",
    xpReward: 30,
    requirement: "explore_scholarships",
    rarity: "common",
  },
  {
    id: "8a",
    name: "Документалист",
    description: "Отсканировали 10 документов",
    category: AchievementCategory.EDUCATION,
    icon: "📑",
    xpReward: 50,
    requirement: "scan_10_documents",
    rarity: "rare",
  },

  // LIFE
  {
    id: "9",
    name: "Житель",
    description: "Прочитали 5 бытовых гайдов",
    category: AchievementCategory.LIFE,
    icon: "🏠",
    xpReward: 40,
    requirement: "read_5_life_guides",
    rarity: "common",
  },
  {
    id: "10",
    name: "Здоровяк",
    description: "Изучили все медицинские гайды",
    category: AchievementCategory.LIFE,
    icon: "🏥",
    xpReward: 60,
    requirement: "read_all_health_guides",
    rarity: "rare",
  },
  {
    id: "11",
    name: "Документовед",
    description: "Изучили все гайды про документы",
    category: AchievementCategory.LIFE,
    icon: "📄",
    xpReward: 50,
    requirement: "read_all_document_guides",
    rarity: "rare",
  },
  {
    id: "12",
    name: "Путешественник",
    description: "Прочитали гайд про транспорт",
    category: AchievementCategory.LIFE,
    icon: "🚇",
    xpReward: 25,
    requirement: "read_transport_guide",
    rarity: "common",
  },

  // ACTIVITY
  {
    id: "13",
    name: "Неделька",
    description: "Заходили 7 дней подряд",
    category: AchievementCategory.ACTIVITY,
    icon: "🔥",
    xpReward: 100,
    requirement: "streak_7_days",
    rarity: "epic",
  },
  {
    id: "14",
    name: "Месячник",
    description: "Заходили 30 дней подряд",
    category: AchievementCategory.ACTIVITY,
    icon: "⚡",
    xpReward: 300,
    requirement: "streak_30_days",
    rarity: "legendary",
  },
  {
    id: "15",
    name: "Супер активный",
    description: "Выполнили 20 напоминаний",
    category: AchievementCategory.ACTIVITY,
    icon: "🌟",
    xpReward: 80,
    requirement: "complete_20_reminders",
    rarity: "rare",
  },
  {
    id: "16",
    name: "Целеустремлённый",
    description: "Выполнили 50 напоминаний",
    category: AchievementCategory.ACTIVITY,
    icon: "💪",
    xpReward: 150,
    requirement: "complete_50_reminders",
    rarity: "epic",
  },

  // EXPERT
  {
    id: "17",
    name: "Мудрец",
    description: "Прочитали 50 гайдов",
    category: AchievementCategory.EXPERT,
    icon: "🦉",
    xpReward: 200,
    requirement: "read_50_guides",
    rarity: "epic",
  },
  {
    id: "18",
    name: "Знаток",
    description: "Задали 50 вопросов AI",
    category: AchievementCategory.EXPERT,
    icon: "🧠",
    xpReward: 150,
    requirement: "ask_50_ai_questions",
    rarity: "epic",
  },
  {
    id: "18a",
    name: "Мастер сканирования",
    description: "Отсканировали 50 документов",
    category: AchievementCategory.EXPERT,
    icon: "📊",
    xpReward: 200,
    requirement: "scan_50_documents",
    rarity: "epic",
  },
  {
    id: "19",
    name: "Наставник",
    description: "Достигли уровня 'Местный'",
    category: AchievementCategory.EXPERT,
    icon: "👨‍🏫",
    xpReward: 500,
    requirement: "reach_local_level",
    rarity: "legendary",
  },
  {
    id: "20",
    name: "Легенда",
    description: "Получили все достижения",
    category: AchievementCategory.EXPERT,
    icon: "🏅",
    xpReward: 1000,
    requirement: "earn_all_achievements",
    rarity: "legendary",
  },
];

const CATEGORY_INFO = {
  [AchievementCategory.GETTING_STARTED]: {
    title: "Начало пути",
    icon: Sparkles,
    color: "from-blue-500 to-blue-600",
  },
  [AchievementCategory.EDUCATION]: {
    title: "Учёба",
    icon: BookOpen,
    color: "from-purple-500 to-purple-600",
  },
  [AchievementCategory.LIFE]: {
    title: "Быт",
    icon: Home,
    color: "from-green-500 to-green-600",
  },
  [AchievementCategory.ACTIVITY]: {
    title: "Активность",
    icon: Zap,
    color: "from-orange-500 to-orange-600",
  },
  [AchievementCategory.EXPERT]: {
    title: "Эксперт",
    icon: Award,
    color: "from-red-500 to-red-600",
  },
};

const RARITY_CONFIG = {
  common: {
    color: "bg-gray-100 text-gray-700 border-gray-300",
    label: "Обычное",
  },
  rare: { color: "bg-blue-100 text-blue-700 border-blue-300", label: "Редкое" },
  epic: {
    color: "bg-purple-100 text-purple-700 border-purple-300",
    label: "Эпическое",
  },
  legendary: {
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    label: "Легендарное",
  },
};

export default function AchievementsPage() {
  // Моковые данные о полученных достижениях (в реальности из API)
  const [earnedAchievements] = useState<string[]>(["1", "2", "3", "4", "9"]);
  const [selectedCategory, setSelectedCategory] = useState<
    AchievementCategory | "all"
  >("all");

  const filteredAchievements =
    selectedCategory === "all"
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === selectedCategory);

  const earnedCount = ACHIEVEMENTS.filter((a) =>
    earnedAchievements.includes(a.id)
  ).length;
  const totalCount = ACHIEVEMENTS.length;
  const completionPercentage = Math.round((earnedCount / totalCount) * 100);

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Назад</span>
                </Button>
              </Link>
              <div className="rounded-lg bg-yellow-50 p-3 w-fit">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Достижения
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Отслеживайте свой прогресс и получайте награды
                </p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <Card className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-3xl sm:text-4xl shadow-lg">
                    🏆
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {earnedCount}/{totalCount}
                    </div>
                    <p className="text-sm sm:text-base text-gray-600">
                      Получено достижений
                    </p>
                  </div>
                </div>
                <div className="w-full sm:w-64">
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                    <span>Прогресс</span>
                    <span>{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories Filter */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedCategory === "all"
                  ? "bg-gray-900 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              Все ({totalCount})
            </button>
            {Object.entries(CATEGORY_INFO).map(([key, info]) => {
              const count = ACHIEVEMENTS.filter(
                (a) => a.category === key
              ).length;
              const Icon = info.icon;
              return (
                <button
                  key={key}
                  onClick={() =>
                    setSelectedCategory(key as AchievementCategory)
                  }
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    selectedCategory === key
                      ? `bg-gradient-to-r ${info.color} text-white shadow-lg`
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{info.title}</span>
                  <span className="opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredAchievements.map((achievement) => {
              const isEarned = earnedAchievements.includes(achievement.id);
              const rarityConfig = RARITY_CONFIG[achievement.rarity];

              return (
                <Card
                  key={achievement.id}
                  className={`transition-all duration-300 ${
                    isEarned
                      ? "shadow-xl hover:shadow-2xl border-2 border-yellow-300"
                      : "opacity-60 hover:opacity-80 border-gray-200"
                  }`}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      {/* Icon */}
                      <div
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl ${
                          isEarned
                            ? "bg-gradient-to-br from-yellow-100 to-orange-100 shadow-lg"
                            : "bg-gray-100 grayscale"
                        }`}
                      >
                        {isEarned ? (
                          achievement.icon
                        ) : (
                          <Lock className="h-8 w-8 text-gray-400" />
                        )}
                      </div>

                      {/* Name */}
                      <h3
                        className={`font-bold text-base sm:text-lg ${
                          isEarned ? "text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {achievement.name}
                      </h3>

                      {/* Description */}
                      <p
                        className={`text-xs sm:text-sm ${
                          isEarned ? "text-gray-600" : "text-gray-400"
                        }`}
                      >
                        {achievement.description}
                      </p>

                      {/* Rarity Badge */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${rarityConfig.color}`}
                      >
                        {rarityConfig.label}
                      </span>

                      {/* XP Reward */}
                      <div className="flex items-center space-x-1 text-sm font-bold text-yellow-600">
                        <Zap className="h-4 w-4" />
                        <span>+{achievement.xpReward} XP</span>
                      </div>

                      {/* Earned Status */}
                      {isEarned && (
                        <div className="w-full pt-2 border-t border-gray-200">
                          <div className="flex items-center justify-center space-x-1 text-xs text-green-600 font-medium">
                            <Trophy className="h-3 w-3" />
                            <span>Получено!</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
