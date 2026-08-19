"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Reminder, ReminderCategory, ReminderStatus } from "@/types";

type ProgressItem = {
  id: string;
  label: string;
  completed: boolean;
};

type AdaptationProgressProps = {
  reminders?: Reminder[];
};

export function AdaptationProgress({ reminders = [] }: AdaptationProgressProps) {
  const { user } = useAuth();
  const { t } = useTranslation();

  const items = useMemo<ProgressItem[]>(() => {
    const hasCompleted = (category: ReminderCategory) =>
      reminders.some(
        (reminder) =>
          reminder.category === category &&
          reminder.status === ReminderStatus.COMPLETED
      );

    return [
      {
        id: "university-registration",
        label: t("dashboard.adaptation.university"),
        completed: Boolean(user?.university?.trim()),
      },
      {
        id: "migration-accounting",
        label: t("dashboard.adaptation.migration"),
        completed: hasCompleted(ReminderCategory.DOCUMENTS),
      },
      {
        id: "inn",
        label: t("dashboard.adaptation.inn"),
        completed: reminders.some(
          (reminder) =>
            reminder.status === ReminderStatus.COMPLETED &&
            /инн|inn/i.test(`${reminder.title} ${reminder.description ?? ""}`)
        ),
      },
      {
        id: "insurance",
        label: t("dashboard.adaptation.insurance"),
        completed: hasCompleted(ReminderCategory.HEALTH),
      },
    ];
  }, [reminders, user?.university, t]);

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900">
          {t("dashboard.adaptation.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-slate-400 flex-shrink-0" />
              )}
              <span
                className={`text-sm sm:text-base ${
                  item.completed ? "text-slate-900 font-medium" : "text-slate-600"
                }`}
              >
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
