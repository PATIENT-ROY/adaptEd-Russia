"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyQuest } from "@/types";
import { CheckCircle, Circle, Zap, Star } from "lucide-react";

interface DailyQuestsProps {
  quests: DailyQuest[];
}

export function DailyQuestsComponent({ quests }: DailyQuestsProps) {
  const completedQuests = quests.filter((q) => q.completed).length;
  const totalQuests = quests.length;
  const completionPercentage =
    totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-yellow-50 no-hover">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
            <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
            <span>Сегодняшние квесты</span>
          </CardTitle>
          <div className="text-xs sm:text-sm font-semibold text-yellow-700 bg-yellow-100 px-2 sm:px-3 py-1 rounded-full">
            {completedQuests}/{totalQuests}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {quests.length === 0 ? (
          <div className="text-center py-6">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Сегодня нет активных квестов
            </p>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            {/* Quests List */}
            {quests.map((quest) => {
              const progressPercentage = Math.min(
                (quest.progress / quest.target) * 100,
                100
              );

              return (
                <div
                  key={quest.id}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 ${
                    quest.completed
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-200 hover:border-yellow-300"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="pt-0.5">
                      {quest.completed ? (
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                        <h4
                          className={`text-sm sm:text-base font-semibold ${
                            quest.completed
                              ? "text-green-700 line-through"
                              : "text-gray-900"
                          }`}
                        >
                          {quest.title}
                        </h4>
                        <span className="text-xs sm:text-sm font-bold text-yellow-600 flex items-center space-x-1">
                          <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>+{quest.xpReward} XP</span>
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {quest.description}
                      </p>

                      {/* Progress */}
                      {!quest.completed && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Прогресс</span>
                            <span className="font-medium">
                              {quest.progress}/{quest.target}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-300"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Completion Bonus */}
            {completedQuests === totalQuests && totalQuests > 0 && (
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 rounded-xl text-center relative overflow-hidden">
                <div className="absolute top-2 left-2 text-2xl animate-bounce delay-100">✨</div>
                <div className="absolute top-2 right-2 text-2xl animate-bounce delay-200">⭐</div>
                <div className="absolute bottom-2 left-4 text-2xl animate-bounce delay-300">🎊</div>
                <div className="absolute bottom-2 right-4 text-2xl animate-bounce delay-400">💫</div>
                <div className="text-4xl sm:text-5xl mb-2 animate-bounce relative z-10">🎉</div>
                <p className="font-bold text-sm sm:text-base relative z-10">
                  Все квесты выполнены!
                </p>
                <p className="text-xs sm:text-sm opacity-90 relative z-10">
                  Возвращайтесь завтра за новыми заданиями
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
