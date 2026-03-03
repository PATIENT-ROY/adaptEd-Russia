"use client";

import { TrustStats as TrustStatsType } from "@/types";
import { Users, GraduationCap, Globe, Star } from "lucide-react";

interface TrustStatsProps {
  stats: TrustStatsType;
  starsLabel: string;
  studentsLabel: string;
  universitiesLabel: string;
  countriesLabel: string;
  /** "light" for white section, "dark" for gradient background */
  variant?: "light" | "dark";
}

export function TrustStats({
  stats,
  starsLabel,
  studentsLabel,
  universitiesLabel,
  countriesLabel,
  variant = "light",
}: TrustStatsProps) {
  const isDark = variant === "dark";
  const items = [
    { icon: Users, value: stats.totalStudents.toLocaleString(), label: studentsLabel },
    { icon: GraduationCap, value: stats.totalUniversities.toLocaleString(), label: universitiesLabel },
    { icon: Globe, value: stats.totalCountries.toLocaleString(), label: countriesLabel },
    { icon: Star, value: stats.averageRating.toFixed(1), label: starsLabel },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
      {items.map(({ icon: Icon, value, label }) => (
        <div
          key={label}
          className={`text-center p-3 sm:p-4 rounded-xl sm:rounded-2xl ${
            isDark
              ? "bg-white/10 backdrop-blur-sm border border-white/20"
              : "bg-slate-100/80 border border-slate-200/80"
          }`}
        >
          <div className={`flex justify-center mb-1.5 sm:mb-2 ${isDark ? "text-white" : "text-slate-600"}`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
          </div>
          <div className={`text-lg sm:text-xl md:text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            {value}
          </div>
          <div className={`text-xs sm:text-sm leading-tight ${isDark ? "text-white/90" : "text-slate-600"}`}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
