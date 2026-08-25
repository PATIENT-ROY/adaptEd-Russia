"use client";

import { Layout } from "@/components/layout/layout";
import {
  ScheduleFilter,
  ScheduleFilters,
} from "@/components/ui/schedule-filter";
import { Clock } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { BackButton } from "@/components/ui/back-button";

export default function SchedulePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const handleShowSchedule = async (filters: ScheduleFilters) => {
    setIsLoading(true);
    setShowSchedule(false);

    // Имитация загрузки (filters — когда появится API вуза)
    void filters;
    await new Promise((resolve) => setTimeout(resolve, 400));

    setIsLoading(false);
    setShowSchedule(true);
  };

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
                <div className="text-center py-12">
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

            {showSchedule && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-sm">
                <div className="text-center py-12">
                  <div className="mb-4">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t("educationGuide.schedule.notFound")}
                  </h3>
                  <p className="text-gray-600">
                    {t("educationGuide.schedule.notFoundDescription")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
