"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserLevel, UserProgress } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { TrendingUp, Trophy, Zap } from "lucide-react";
import Link from "next/link";

interface UserProgressProps {
  progress: UserProgress;
}

export function UserProgressComponent({ progress }: UserProgressProps) {
  const { t } = useTranslation();
  const LEVEL_CONFIG = {
    [UserLevel.NEWBIE]: {
      title: t("userProgress.level.newbie"),
      icon: "🌱",
      color: "from-blue-500 to-blue-600",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
      minXP: 0,
      maxXP: 100,
    },
    [UserLevel.ADAPTING]: {
      title: t("userProgress.level.adapting"),
      icon: "🌿",
      color: "from-green-500 to-green-600",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
      minXP: 101,
      maxXP: 300,
    },
    [UserLevel.EXPERIENCED]: {
      title: t("userProgress.level.experienced"),
      icon: "🌳",
      color: "from-purple-500 to-purple-600",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
      minXP: 301,
      maxXP: 600,
    },
    [UserLevel.EXPERT]: {
      title: t("userProgress.level.expert"),
      icon: "⭐",
      color: "from-yellow-500 to-yellow-600",
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
      minXP: 601,
      maxXP: 1000,
    },
    [UserLevel.LOCAL]: {
      title: t("userProgress.level.local"),
      icon: "👑",
      color: "from-red-500 to-red-600",
      textColor: "text-red-600",
      bgColor: "bg-red-50",
      minXP: 1001,
      maxXP: 9999,
    },
  };
  const currentLevel = LEVEL_CONFIG[progress.level];
  const xpProgress = progress.xp - currentLevel.minXP;
  const xpNeeded = currentLevel.maxXP - currentLevel.minXP;
  const progressPercentage =
    progress.level === UserLevel.LOCAL
      ? 100
      : Math.min((xpProgress / xpNeeded) * 100, 100);
  const levelNumber = Object.values(UserLevel).indexOf(progress.level) + 1;
  const levelLabel = t("userProgress.levelLabel").replace(
    "{level}",
    String(levelNumber),
  );

  // Определяем следующий уровень
  const getNextLevel = () => {
    const levels = Object.values(UserLevel);
    const currentIndex = levels.indexOf(progress.level);
    return currentIndex < levels.length - 1
      ? LEVEL_CONFIG[levels[currentIndex + 1]]
      : null;
  };

  const nextLevel = getNextLevel();

  return (
    <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-0 shadow-xl no-hover">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${currentLevel.color} flex items-center justify-center shadow-lg text-2xl sm:text-3xl`}
              >
                {currentLevel.icon}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  {currentLevel.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {levelLabel}
                </p>
              </div>
            </div>
            <Link href="/achievements">
              <Button
                variant="outline"
                size="sm"
                className="group flex items-center space-x-1 border-slate-200 text-slate-700 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200"
              >
                <Trophy className="h-4 w-4 text-yellow-500 transition-colors duration-200 group-hover:text-yellow-600" />
                <span className="hidden sm:inline">
                  {t("userProgress.achievements")}
                </span>
              </Button>
            </Link>
          </div>

          {/* XP Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {t("userProgress.xpLabel")}
              </span>
              <span className="text-xs sm:text-sm font-bold text-gray-900">
                {progress.xp} /{" "}
                {progress.level === UserLevel.LOCAL ? "∞" : currentLevel.maxXP}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden shadow-inner">
              <div
                className={`h-full bg-gradient-to-r ${currentLevel.color} transition-all duration-500 rounded-full flex items-center justify-end pr-1`}
                style={{ width: `${progressPercentage}%` }}
              >
                {progressPercentage > 10 && (
                  <Zap className="h-2 w-2 sm:h-3 sm:w-3 text-white animate-pulse" />
                )}
              </div>
            </div>
            {nextLevel && (
              <p className="text-xs text-gray-500 mt-1">
                {t("userProgress.xpToNext")
                  .replace("{xp}", String(currentLevel.maxXP - progress.xp))
                  .replace("{level}", nextLevel.title)}
              </p>
            )}
          </div>

          {/* Adaptation Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700 flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{t("userProgress.adaptationProgress")}</span>
              </span>
              <span className="text-xs sm:text-sm font-bold text-green-600">
                {progress.adaptationProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500 rounded-full"
                style={{ width: `${progress.adaptationProgress}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-2">
            <div
              className={`${currentLevel.bgColor} rounded-xl p-2 sm:p-3 text-center`}
            >
              <div
                className={`text-lg sm:text-xl font-bold ${currentLevel.textColor}`}
              >
                {progress.totalGuidesRead}
              </div>
              <div className="text-xs text-gray-600">
                {t("userProgress.stats.guides")}
              </div>
            </div>
            <div
              className={`${currentLevel.bgColor} rounded-xl p-2 sm:p-3 text-center`}
            >
              <div
                className={`text-lg sm:text-xl font-bold ${currentLevel.textColor}`}
              >
                {progress.totalAIQuestions}
              </div>
              <div className="text-xs text-gray-600">
                {t("userProgress.stats.aiQuestions")}
              </div>
            </div>
            <div
              className={`${currentLevel.bgColor} rounded-xl p-2 sm:p-3 text-center`}
            >
              <div
                className={`text-lg sm:text-xl font-bold ${currentLevel.textColor}`}
              >
                {progress.totalRemindersCompleted}
              </div>
              <div className="text-xs text-gray-600">
                {t("userProgress.stats.tasks")}
              </div>
            </div>
            <div
              className={`${currentLevel.bgColor} rounded-xl p-2 sm:p-3 text-center`}
            >
              <div
                className={`text-lg sm:text-xl font-bold ${currentLevel.textColor} flex items-center justify-center space-x-1`}
              >
                {progress.streak > 0 && (
                  <span className="text-orange-500">🔥</span>
                )}
                <span>{progress.streak}</span>
              </div>
              <div className="text-xs text-gray-600">
                {t("userProgress.stats.streakDays")}
              </div>
            </div>
          </div>

          {/* Call to Action */}
          {progress.adaptationProgress < 100 && (
            <div className="pt-2 border-t border-gray-200 relative">
              <div className="absolute -left-2 top-0 text-2xl animate-float">
                💡
              </div>
              <p className="text-xs text-gray-600 text-center mb-2 pl-6">
                {t("userProgress.cta")}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
