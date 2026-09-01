"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyQuest, QuestType } from "@/types";
import { CheckCircle, Circle, Zap, Star, Trophy, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface DailyQuestsProps {
  quests: DailyQuest[];
}

const QUEST_I18N: Record<string, { title: string; desc: string }> = {
  [QuestType.READ_GUIDES]: {
    title: "dailyQuests.readGuides.title",
    desc: "dailyQuests.readGuides.desc",
  },
  [QuestType.ASK_AI]: {
    title: "dailyQuests.askAi.title",
    desc: "dailyQuests.askAi.desc",
  },
  [QuestType.CREATE_REMINDER]: {
    title: "dailyQuests.createReminder.title",
    desc: "dailyQuests.createReminder.desc",
  },
};

const QUEST_HREF: Partial<Record<QuestType, string>> = {
  [QuestType.READ_GUIDES]: "/education-guide",
  [QuestType.ASK_AI]: "/ai-helper",
  [QuestType.CREATE_REMINDER]: "/reminders",
  [QuestType.COMPLETE_REMINDER]: "/reminders",
  [QuestType.UPDATE_PROFILE]: "/profile",
};

export function DailyQuestsComponent({ quests }: DailyQuestsProps) {
  const { t } = useTranslation();
  const completedQuests = quests.filter((q) => q.completed).length;
  const totalQuests = quests.length;
  const completionPercentage =
    totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;

  const localizeQuest = (quest: DailyQuest) => {
    const keys = QUEST_I18N[quest.questType];
    if (!keys) return quest;
    return {
      ...quest,
      title: t(keys.title),
      description: t(keys.desc),
    };
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-yellow-50 no-hover">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
            <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
            <span>{t("dailyQuests.title")}</span>
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
              {t("dailyQuests.empty")}
            </p>
          </div>
        ) : (
          <>
            <div
              className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-2"
              role="progressbar"
              aria-valuenow={completedQuests}
              aria-valuemin={0}
              aria-valuemax={totalQuests}
              aria-label={`${completedQuests} / ${totalQuests} ${t("dailyQuests.title")}`}
            >
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            {quests.map((rawQuest) => {
              const quest = localizeQuest(rawQuest);
              const progressPercentage = Math.min(
                (quest.progress / quest.target) * 100,
                100,
              );
              const href = quest.completed
                ? undefined
                : QUEST_HREF[quest.questType];
              const cardClass = `p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 ${
                quest.completed
                  ? "bg-green-50 border-green-200"
                  : href
                    ? "bg-white border-gray-200 hover:border-yellow-400 hover:bg-yellow-50/70 active:scale-[0.99]"
                    : "bg-white border-gray-200"
              }`;

              const body = (
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

                    {!quest.completed && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>{t("dailyQuests.progress")}</span>
                          <span className="font-medium">
                            {quest.progress}/{quest.target}
                          </span>
                        </div>
                        <div
                          className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden"
                          role="progressbar"
                          aria-valuenow={quest.progress}
                          aria-valuemin={0}
                          aria-valuemax={quest.target}
                          aria-label={`${quest.title}: ${quest.progress}/${quest.target}`}
                        >
                          <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {href && (
                    <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                  )}
                </div>
              );

              return href ? (
                <Link
                  key={quest.id}
                  href={href}
                  className={`block ${cardClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500`}
                >
                  {body}
                </Link>
              ) : (
                <div key={quest.id} className={cardClass}>
                  {body}
                </div>
              );
            })}

            {completedQuests === totalQuests && totalQuests > 0 && (
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 rounded-xl text-center">
                <Trophy className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-white" />
                <p className="font-bold text-sm sm:text-base">
                  {t("dailyQuests.allCompleted.title")}
                </p>
                <p className="text-xs sm:text-sm opacity-90">
                  {t("dailyQuests.allCompleted.subtitle")}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
