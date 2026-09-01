"use client";

import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import {
  Building2,
  Clock,
  Search,
  ChevronDown,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  SCHEDULE_CITIES,
  ScheduleSearchType,
  ScheduleUniversityId,
} from "@/lib/schedule-api";

interface ScheduleFilterProps {
  onShowSchedule: (filters: ScheduleFilters) => void;
  hideTitle?: boolean;
}

export interface ScheduleFilters {
  city: string;
  university: ScheduleUniversityId;
  dateFrom: string;
  dateTo: string;
  type: ScheduleSearchType;
  value: string;
}

export function ScheduleFilter({
  onShowSchedule,
  hideTitle = false,
}: ScheduleFilterProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<ScheduleFilters>({
    city: "saint-petersburg",
    university: "spbstu",
    dateFrom: new Date().toISOString().split("T")[0],
    dateTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    type: "group",
    value: "",
  });

  const handleInputChange = (field: keyof ScheduleFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleShowSchedule = () => {
    onShowSchedule(filters);
  };

  const selectedCity =
    SCHEDULE_CITIES.find((city) => city.id === filters.city) || SCHEDULE_CITIES[0];
  const selectedUniversity =
    selectedCity.universities.find((university) => university.id === filters.university) ||
    selectedCity.universities[0];

  const handleCityChange = (cityId: string) => {
    const city = SCHEDULE_CITIES.find((item) => item.id === cityId) || SCHEDULE_CITIES[0];
    const university = city.universities[0];
    setFilters((previous) => ({
      ...previous,
      city: city.id,
      university: university.id,
      type: university.searchTypes[0],
      value: "",
    }));
  };

  const handleUniversityChange = (universityId: ScheduleUniversityId) => {
    const university = selectedCity.universities.find((item) => item.id === universityId);
    if (!university) return;
    setFilters((previous) => ({
      ...previous,
      university: university.id,
      type: university.searchTypes.includes(previous.type)
        ? previous.type
        : university.searchTypes[0],
      value: "",
    }));
  };

  const typeLabel =
    filters.type === "group"
      ? t("schedulePage.kind.group")
      : filters.type === "teacher"
        ? t("schedulePage.kind.teacher")
        : t("schedulePage.kind.room");

  const getPlaceholder = () => {
    switch (filters.type) {
      case "group":
        return t("schedulePage.placeholder.group");
      case "teacher":
        return t("schedulePage.placeholder.teacher");
      case "room":
        return t("schedulePage.placeholder.room");
      default:
        return "";
    }
  };

  return (
    <Card className="w-full min-w-0 overflow-hidden">
      {!hideTitle && (
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="text-xl font-bold">{t("schedulePage.title")}</span>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="min-w-0 space-y-4 overflow-hidden">
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("schedulePage.city")}
            </label>
            <div className="relative min-w-0">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600" />
              <select
                value={filters.city}
                onChange={(event) => handleCityChange(event.target.value)}
                className="min-h-11 w-full min-w-0 appearance-none rounded-md border border-blue-200 bg-blue-50 py-2 pl-10 pr-9 font-medium text-blue-950 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {SCHEDULE_CITIES.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600" />
            </div>
          </div>
          <div className="min-w-0 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("schedulePage.university")}
            </label>
            <div className="relative min-w-0">
              <select
                value={filters.university}
                onChange={(event) => handleUniversityChange(event.target.value as ScheduleUniversityId)}
                className="min-h-11 w-full min-w-0 appearance-none rounded-md border border-blue-200 bg-blue-50 py-2 pl-3 pr-9 font-medium text-blue-950 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {selectedCity.universities.map((university) => (
                  <option key={university.id} value={university.id}>{university.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("schedulePage.from")}
            </label>
            <Input
              type="date"
              lang="en-CA"
              value={filters.dateFrom}
              onChange={(e) => handleInputChange("dateFrom", e.target.value)}
            />
          </div>
          <div className="min-w-0 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("schedulePage.to")}
            </label>
            <Input
              type="date"
              lang="en-CA"
              value={filters.dateTo}
              onChange={(e) => handleInputChange("dateTo", e.target.value)}
            />
          </div>
        </div>

        {/* Type and Value */}
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="min-w-0 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("schedulePage.kind")}
            </label>
            <div className="relative min-w-0">
              <select
                value={filters.type}
                onChange={(e) =>
                  handleInputChange(
                    "type",
                    e.target.value as ScheduleSearchType,
                  )
                }
                className="min-h-11 w-full min-w-0 appearance-none rounded-md border border-gray-300 p-2 pr-8 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              >
                <option value="group" disabled={!selectedUniversity.searchTypes.includes("group")}>{t("schedulePage.kind.group")}</option>
                <option value="teacher" disabled={!selectedUniversity.searchTypes.includes("teacher")}>
                  {t("schedulePage.kind.teacher")}
                </option>
                <option value="room" disabled={!selectedUniversity.searchTypes.includes("room")}>{t("schedulePage.kind.room")}</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <div className="min-w-0 space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              {typeLabel}
            </label>
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={getPlaceholder()}
                value={filters.value}
                onChange={(e) => handleInputChange("value", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Show Schedule Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleShowSchedule}
            disabled={filters.value.trim().length < 2}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            {t("schedulePage.show")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
