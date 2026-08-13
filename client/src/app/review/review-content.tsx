"use client";

import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Scale,
  ShieldCheck,
  Target,
  Users,
  Languages,
} from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EDUCATION_GUIDES_COUNT,
  LIFE_GUIDES_COUNT,
  TOTAL_GUIDES_COUNT,
} from "@/constants/content-stats";
import { getPluralCategory } from "@/lib/pluralize";
import { Language } from "@/types";

function ruGuideUnit(count: number): string {
  const category = getPluralCategory(count, Language.RU);
  if (category === "one") return "гайд";
  if (category === "few") return "гайда";
  return "гайдов";
}

const reviewers = [
  {
    icon: GraduationCap,
    title: "Сотрудники университетов",
    note: "Приоритет",
    description:
      "Деканаты, отделы по работе с иностранными студентами, кураторы — видят реальные процессы вуза и типичные ошибки.",
  },
  {
    icon: Scale,
    title: "Юрист по миграционному праву",
    description:
      "Проверка формулировок по регистрации, визе, учёту и другим юридически чувствительным темам.",
  },
  {
    icon: Users,
    title: "Специалист по работе с иностранными студентами",
    description:
      "Практика адаптации: что реально работает, что устарело, чего не хватает новичкам.",
  },
  {
    icon: BookOpen,
    title: "Иностранные студенты",
    description:
      "Проверка понятности: язык, структура, полезность с точки зрения того, кто уже прошёл этот путь.",
  },
  {
    icon: Languages,
    title: "Преподаватель РКИ",
    description:
      "Ясность русского языка для иностранцев, термины, тон и доступность объяснений.",
  },
];

const checkPoints = [
  "Фактическая точность: нет ли ошибок или устаревших правил",
  "Понятность для иностранного студента без лишнего канцелярита",
  "Полнота: чего не хватает на практике",
  "Формулировки, которые могут ввести в заблуждение",
  "Любые замечания по структуре или примерам",
];

export function ReviewPageContent() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-10 sm:py-14">
        <div className="mb-10 sm:mb-12">
          <p className="text-sm font-semibold tracking-wide text-blue-700 mb-3">
            AdaptEd Russia · Экспертная проверка
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            Помогите проверить наши гайды
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Мы приглашаем специалистов и студентов кратко проверить материалы
            платформы. Это займёт примерно{" "}
            <span className="font-semibold text-slate-800">10–15 минут</span>.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="h-5 w-5 text-blue-600" />
                Цель AdaptEd Russia
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-700 space-y-3 leading-relaxed">
              <p>
                AdaptEd Russia помогает иностранным студентам адаптироваться к
                учёбе и жизни в российских вузах: понятные гайды, практические
                инструкции и сопровождение без воды.
              </p>
              <p>
                Наша задача — давать материалы, на которые можно опираться в
                реальных ситуациях: сессия, документы, общежитие, медицина,
                миграционные вопросы.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Почему нужна экспертная проверка
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-700 space-y-3 leading-relaxed">
              <p>
                Материалы создаются на основе официальных источников и проходят
                внутреннюю проверку перед публикацией. Но внутренний взгляд не
                заменяет опыт тех, кто работает со студентами каждый день.
              </p>
              <p>
                Внешняя проверка помогает убрать неточности, усилить практическую
                пользу и сделать тексты безопаснее и понятнее для иностранцев.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                Какие материалы уже готовы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700 leading-relaxed">
                Сейчас на платформе {TOTAL_GUIDES_COUNT}{" "}
                {ruGuideUnit(TOTAL_GUIDES_COUNT)}: {EDUCATION_GUIDES_COUNT} по
                учёбе и {LIFE_GUIDES_COUNT} по быту.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Link
                  href="/education-guide"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-semibold text-slate-900">
                    Образовательные гайды
                  </div>
                  <div className="text-sm text-slate-600 mt-1">
                    Сессия, курсовые, структура вуза, академические риски
                  </div>
                </Link>
                <Link
                  href="/life-guide"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-semibold text-slate-900">Бытовые гайды</div>
                  <div className="text-sm text-slate-600 mt-1">
                    Общежитие, ИНН/СНИЛС, транспорт, медицина, аренда
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                Что именно просим проверить
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {checkPoints.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-slate-600 text-sm leading-relaxed">
                Достаточно выбрать 1–2 гайда по вашей экспертизе. Полный разбор
                всех материалов не нужен.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="h-5 w-5 text-amber-600" />
                Сколько времени это займёт
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-700 leading-relaxed">
              <p>
                Обычно{" "}
                <span className="font-semibold text-slate-900">10–15 минут</span>:
                открыть гайд, прочитать ключевые блоки и коротко написать, что
                верно, что устарело и что лучше уточнить.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-teal-600" />
                Кого мы приглашаем к проверке
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviewers.map(({ icon: Icon, title, description, note }) => (
                <div
                  key={title}
                  className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200">
                    <Icon className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{title}</h3>
                      {note ? (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          {note}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
