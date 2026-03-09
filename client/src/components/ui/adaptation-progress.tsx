"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";

type ProgressItem = {
  id: string;
  label: string;
  completed: boolean;
};

const initialItems: ProgressItem[] = [
  { id: "university-registration", label: "Регистрация в университете", completed: true },
  { id: "migration-accounting", label: "Миграционный учет", completed: true },
  { id: "inn", label: "Получение ИНН", completed: false },
  { id: "insurance", label: "Медицинская страховка", completed: false },
];

export function AdaptationProgress() {
  const [items] = useState<ProgressItem[]>(initialItems);

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900">
          Твоя адаптация
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
