"use client";

import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Calendar, Clock, Search, ChevronDown } from "lucide-react";

interface ScheduleFilterProps {
  onShowSchedule: (filters: ScheduleFilters) => void;
}

export interface ScheduleFilters {
  dateFrom: string;
  dateTo: string;
  type: "group" | "teacher" | "room";
  value: string;
}

export function ScheduleFilter({ onShowSchedule }: ScheduleFilterProps) {
  const [filters, setFilters] = useState<ScheduleFilters>({
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

  const getPlaceholder = () => {
    switch (filters.type) {
      case "group":
        return "Номер группы (ИУ-2023)";
      case "teacher":
        return "ФИО преподавателя";
      case "room":
        return "Номер аудитории";
      default:
        return "";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <span className="text-xl font-bold">Расписание</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">с</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleInputChange("dateFrom", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">по</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleInputChange("dateTo", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Type and Value */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">вид</label>
            <div className="relative">
              <select
                value={filters.type}
                onChange={(e) =>
                  handleInputChange(
                    "type",
                    e.target.value as "group" | "teacher" | "room"
                  )
                }
                className="w-full p-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="group">Группа</option>
                <option value="teacher">Преподаватель</option>
                <option value="room">Аудитория</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {filters.type === "group"
                ? "Группа"
                : filters.type === "teacher"
                ? "Преподаватель"
                : "Аудитория"}
            </label>
            <div className="relative">
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

        {/* Current Classes Filter */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Button
                variant="default"
                className="bg-yellow-500 hover:bg-yellow-600 text-white w-full sm:w-auto"
              >
                Текущие пары
              </Button>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Пара:</span>
                <select className="text-sm border-none bg-transparent focus:ring-0">
                  <option>Текущая</option>
                  <option>Следующая</option>
                  <option>Предыдущая</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Show Schedule Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleShowSchedule}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            Показать расписание
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
