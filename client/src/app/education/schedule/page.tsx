"use client";

import { Layout } from "@/components/layout/layout";
import {
  ScheduleFilter,
  ScheduleFilters,
} from "@/components/ui/schedule-filter";
import { BackButton } from "@/components/ui/back-button";
import {
  AlertCircle,
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import {
  fetchSchedule,
  ScheduleItem,
  ScheduleResult,
} from "@/lib/schedule-api";
import { Language } from "@/types";

const localeByLanguage: Record<Language, string> = {
  [Language.RU]: "ru-RU",
  [Language.EN]: "en-US",
  [Language.FR]: "fr-FR",
  [Language.AR]: "ar",
  [Language.ZH]: "zh-CN",
};

function groupByDate(items: ScheduleItem[]): Array<[string, ScheduleItem[]]> {
  const grouped = new Map<string, ScheduleItem[]>();
  for (const item of items) {
    grouped.set(item.date, [...(grouped.get(item.date) || []), item]);
  }
  return Array.from(grouped.entries());
}

export default function SchedulePage() {
  const { t, currentLanguage } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groupedSchedule = useMemo(
    () => groupByDate(result?.items || []),
    [result],
  );

  const handleShowSchedule = async (filters: ScheduleFilters) => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      setResult(await fetchSchedule(filters));
    } catch (requestError) {
      setError(
        requestError instanceof Error && requestError.message !== "SCHEDULE_REQUEST_FAILED"
          ? requestError.message
          : t("schedulePage.error.description"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat(localeByLanguage[currentLanguage], {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date(`${date}T12:00:00`));

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton
            label={t("schedulePage.back")}
            className="mb-6"
            onClick={() => router.push("/education-guide")}
          />

          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-4">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t("schedulePage.title")}
            </h1>
            <p className="text-xl text-gray-600">
              {t("schedulePage.subtitle")}
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <ScheduleFilter onShowSchedule={handleShowSchedule} hideTitle />

            {isLoading && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-sm">
                <div className="text-center py-12" role="status">
                  <div className="animate-spin mb-4">
                    <Clock className="h-12 w-12 text-blue-600 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t("educationGuide.schedule.searching")}
                  </h3>
                  <p className="text-gray-600">
                    {t("educationGuide.schedule.pleaseWait")}
                  </p>
                </div>
              </div>
            )}

            {error && !isLoading && (
              <div
                className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900"
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <h2 className="font-semibold">{t("schedulePage.error.title")}</h2>
                    <p className="mt-1 text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {result && !isLoading && (
              <section className="space-y-5" aria-live="polite">
                <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">
                        {result.universityName}
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-gray-950">
                        {result.query?.resolvedValue ||
                          result.query?.value ||
                          ""}
                      </h2>
                      <p className="mt-1 text-sm text-gray-600">
                        {t("schedulePage.resultsCount").replace(
                          "{count}",
                          String(result.items?.length ?? 0),
                        )}
                      </p>
                    </div>
                    <a
                      href={result.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-400 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {t("schedulePage.source")}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {groupedSchedule.length === 0 ? (
                  <div className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-sm">
                    <div className="text-center py-12">
                      <CalendarDays className="mb-4 h-12 w-12 text-gray-400 mx-auto" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {t("educationGuide.schedule.notFound")}
                      </h3>
                      <p className="text-gray-600">
                        {t("educationGuide.schedule.notFoundDescription")}
                      </p>
                    </div>
                  </div>
                ) : (
                  groupedSchedule.map(([date, lessons]) => (
                    <div
                      key={date}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                    >
                      <h3 className="border-b border-gray-100 bg-gray-50 px-5 py-4 text-lg font-bold capitalize text-gray-950">
                        {formatDate(date)}
                      </h3>
                      <div className="divide-y divide-gray-100">
                        {lessons.map((lesson) => (
                          <article
                            key={lesson.id}
                            className="grid gap-4 p-5 sm:grid-cols-[8rem_1fr]"
                          >
                            <div className="flex items-center gap-2 font-semibold text-blue-700 sm:items-start">
                              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                              <span>
                                {lesson.timeStart || "—"}
                                {lesson.timeEnd ? `–${lesson.timeEnd}` : ""}
                              </span>
                            </div>
                            <div>
                              <div className="flex flex-wrap items-start gap-2">
                                <h4 className="text-base font-bold text-gray-950 sm:text-lg">
                                  {lesson.subject}
                                </h4>
                                {lesson.lessonType && (
                                  <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                                    {lesson.lessonType}
                                  </span>
                                )}
                              </div>
                              <dl className="mt-3 grid gap-2 text-sm text-gray-600 md:grid-cols-2">
                                {lesson.teachers.length > 0 && (
                                  <div className="flex gap-2">
                                    <UserRound className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>{lesson.teachers.join(", ")}</span>
                                  </div>
                                )}
                                {lesson.rooms.length > 0 && (
                                  <div className="flex gap-2">
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>{lesson.rooms.join(", ")}</span>
                                  </div>
                                )}
                                {lesson.groups.length > 0 && (
                                  <div className="flex gap-2 md:col-span-2">
                                    <UsersRound className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>{lesson.groups.join(", ")}</span>
                                  </div>
                                )}
                              </dl>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
