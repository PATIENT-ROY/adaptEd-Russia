"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "./button";
import { Input } from "./input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import {
  User,
  GraduationCap,
  Calendar,
  Save,
  X,
  Loader2,
  Phone,
  MapPin,
  ChevronDown,
} from "lucide-react";
import type { User as UserType } from "@/types";
import { RUSSIAN_CITIES } from "@/constants/russianCities";
import { RUSSIAN_UNIVERSITIES } from "@/constants/universities";

const POPULAR_RUSSIAN_CITIES = [
  "Москва",
  "Санкт-Петербург",
  "Екатеринбург",
  "Казань",
  "Новосибирск",
  "Нижний Новгород",
  "Краснодар",
  "Ростов-на-Дону",
];

const POPULAR_RUSSIAN_UNIVERSITIES = [
  "МГУ имени М.В. Ломоносова",
  "СПбГУ",
  "НИУ ВШЭ",
  "МФТИ",
  "МГТУ им. Н.Э. Баумана",
  "МГИМО",
  "РУДН",
  "КФУ",
];

interface ExtendedUser extends UserType {
  university?: string;
  faculty?: string;
  year?: string;
  phone?: string;
  gender?: string;
  city?: string;
}

interface ProfileEditFormProps {
  user: ExtendedUser;
  onSave: (updatedUser: Partial<ExtendedUser>) => Promise<boolean>;
  onCancel: () => void;
  isVisible: boolean;
}

export function ProfileEditForm({
  user,
  onSave,
  onCancel,
  isVisible,
}: ProfileEditFormProps) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    university: user.university || "",
    faculty: user.faculty || "",
    year: user.year || "",
    phone: user.phone || "",
    gender: user.gender || "",
    city: user.city || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [activeCityIndex, setActiveCityIndex] = useState(-1);
  const [showUniversitySuggestions, setShowUniversitySuggestions] = useState(false);
  const [activeUniversityIndex, setActiveUniversityIndex] = useState(-1);
  const cityFieldRef = useRef<HTMLDivElement | null>(null);
  const universityFieldRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setFormData({
      name: user.name || "",
      university: user.university || "",
      faculty: user.faculty || "",
      year: user.year || "",
      phone: user.phone || "",
      gender: user.gender || "",
      city: user.city || "",
    });
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cityFieldRef.current &&
        !cityFieldRef.current.contains(event.target as Node)
      ) {
        setShowCitySuggestions(false);
        setActiveCityIndex(-1);
      }

      if (
        universityFieldRef.current &&
        !universityFieldRef.current.contains(event.target as Node)
      ) {
        setShowUniversitySuggestions(false);
        setActiveUniversityIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const citySuggestions = useMemo(() => {
    const query = formData.city
      .trim()
      .toLocaleLowerCase("ru")
      .replace(/ё/g, "е");
    const source = query
      ? RUSSIAN_CITIES.filter((city) =>
          city
            .toLocaleLowerCase("ru")
            .replace(/ё/g, "е")
            .includes(query),
        )
      : POPULAR_RUSSIAN_CITIES;
    return source.slice(0, 8);
  }, [formData.city]);

  const universitySuggestions = useMemo(() => {
    const query = formData.university
      .trim()
      .toLocaleLowerCase("ru")
      .replace(/ё/g, "е");

    if (!query) {
      return Array.from(new Set(POPULAR_RUSSIAN_UNIVERSITIES))
        .sort((a, b) => a.localeCompare(b, "ru"))
        .slice(0, 8);
    }

    const exactMatches: string[] = [];
    const startsWithMatches: string[] = [];
    const includesMatches: string[] = [];

    for (const university of RUSSIAN_UNIVERSITIES) {
      const normalized = university.toLocaleLowerCase("ru").replace(/ё/g, "е");
      if (normalized === query) {
        exactMatches.push(university);
      } else if (normalized.startsWith(query)) {
        startsWithMatches.push(university);
      } else if (normalized.includes(query)) {
        includesMatches.push(university);
      }
    }

    const ordered = [...exactMatches, ...startsWithMatches, ...includesMatches];
    return Array.from(new Set(ordered)).slice(0, 8);
  }, [formData.university]);

  const applyCity = (city: string) => {
    setFormData((prev) => ({ ...prev, city }));
    setShowCitySuggestions(false);
    setActiveCityIndex(-1);
  };

  const applyUniversity = (university: string) => {
    setFormData((prev) => ({ ...prev, university }));
    setShowUniversitySuggestions(false);
    setActiveUniversityIndex(-1);
  };

  const shouldShowCitySuggestions = showCitySuggestions;
  const shouldShowUniversitySuggestions = showUniversitySuggestions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await onSave({
        name: formData.name,
        university: formData.university,
        faculty: formData.faculty,
        year: formData.year,
        phone: formData.phone,
        gender: formData.gender as "male" | "female" | undefined,
        city: formData.city,
      });

      if (success) {
        onCancel();
      } else {
        setError("Ошибка при сохранении профиля");
      }
    } catch {
      setError("Произошла ошибка при сохранении");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto border-0 shadow-2xl animate-slide-in-from-top">
        <CardHeader className="text-center pb-4 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <User className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Редактировать профиль
          </CardTitle>
          <CardDescription className="text-slate-600">
            Добавьте информацию об университете
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-slate-700"
              >
                Имя
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Ваше имя"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* University */}
            <div className="space-y-2">
              <label
                htmlFor="university"
                className="text-sm font-medium text-slate-700"
              >
                Университет
              </label>
              <div className="relative" ref={universityFieldRef}>
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="university"
                  name="university"
                  type="text"
                  placeholder="Название университета"
                  value={formData.university}
                  onChange={(e) => {
                    handleChange(e);
                    setShowUniversitySuggestions(true);
                    setActiveUniversityIndex(-1);
                  }}
                  onFocus={() => setShowUniversitySuggestions(true)}
                  onKeyDown={(e) => {
                    if (
                      !showUniversitySuggestions ||
                      universitySuggestions.length === 0
                    ) {
                      return;
                    }

                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActiveUniversityIndex((prev) =>
                        prev < universitySuggestions.length - 1 ? prev + 1 : 0,
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveUniversityIndex((prev) =>
                        prev > 0 ? prev - 1 : universitySuggestions.length - 1,
                      );
                    } else if (e.key === "Enter" && activeUniversityIndex >= 0) {
                      e.preventDefault();
                      applyUniversity(universitySuggestions[activeUniversityIndex]);
                    } else if (e.key === "Escape") {
                      setShowUniversitySuggestions(false);
                      setActiveUniversityIndex(-1);
                    }
                  }}
                  className="pl-10 pr-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  autoComplete="off"
                />
                <button
                  type="button"
                  aria-label="Показать университеты"
                  onClick={() => setShowUniversitySuggestions((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showUniversitySuggestions ? "rotate-180" : ""}`}
                  />
                </button>
                {shouldShowUniversitySuggestions &&
                  universitySuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-slate-200 bg-white shadow-lg max-h-56 overflow-y-auto">
                      {universitySuggestions.map((university, index) => (
                        <button
                          key={university}
                          type="button"
                          onMouseEnter={() => setActiveUniversityIndex(index)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            applyUniversity(university);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm ${
                            index === activeUniversityIndex
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          {university}
                        </button>
                      ))}
                    </div>
                  )}
                {shouldShowUniversitySuggestions &&
                  universitySuggestions.length === 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-slate-200 bg-white shadow-lg px-3 py-2 text-sm text-slate-500">
                      Университет не найден
                    </div>
                  )}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="text-sm font-medium text-slate-700"
              >
                Телефон
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+7 (999) 123-45-67"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* City */}
            <div className="space-y-2">
              <label
                htmlFor="city"
                className="text-sm font-medium text-slate-700"
              >
                Город
              </label>
              <div className="relative" ref={cityFieldRef}>
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="Москва, Санкт-Петербург..."
                  value={formData.city}
                  onChange={(e) => {
                    handleChange(e);
                    setShowCitySuggestions(true);
                    setActiveCityIndex(-1);
                  }}
                  onFocus={() => setShowCitySuggestions(true)}
                  onKeyDown={(e) => {
                    if (!showCitySuggestions || citySuggestions.length === 0) return;
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActiveCityIndex((prev) =>
                        prev < citySuggestions.length - 1 ? prev + 1 : 0,
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveCityIndex((prev) =>
                        prev > 0 ? prev - 1 : citySuggestions.length - 1,
                      );
                    } else if (e.key === "Enter" && activeCityIndex >= 0) {
                      e.preventDefault();
                      applyCity(citySuggestions[activeCityIndex]);
                    } else if (e.key === "Escape") {
                      setShowCitySuggestions(false);
                      setActiveCityIndex(-1);
                    }
                  }}
                  className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  autoComplete="off"
                />
                <button
                  type="button"
                  aria-label="Показать города"
                  onClick={() => setShowCitySuggestions((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showCitySuggestions ? "rotate-180" : ""}`}
                  />
                </button>
                {shouldShowCitySuggestions && citySuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-slate-200 bg-white shadow-lg max-h-56 overflow-y-auto">
                    {citySuggestions.map((city, index) => (
                      <button
                        key={city}
                        type="button"
                        onMouseEnter={() => setActiveCityIndex(index)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applyCity(city);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm ${
                          index === activeCityIndex
                            ? "bg-blue-50 text-blue-700"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
                {shouldShowCitySuggestions && citySuggestions.length === 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-slate-200 bg-white shadow-lg px-3 py-2 text-sm text-slate-500">
                    Город не найден
                  </div>
                )}
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label
                htmlFor="gender"
                className="text-sm font-medium text-slate-700"
              >
                Пол
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 h-12 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 bg-white appearance-none"
                >
                  <option value="">Выберите пол</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    className="h-4 w-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Faculty */}
            <div className="space-y-2">
              <label
                htmlFor="faculty"
                className="text-sm font-medium text-slate-700"
              >
                Факультет
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="faculty"
                  name="faculty"
                  type="text"
                  placeholder="Название факультета"
                  value={formData.faculty}
                  onChange={handleChange}
                  className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Year */}
            <div className="space-y-2">
              <label
                htmlFor="year"
                className="text-sm font-medium text-slate-700"
              >
                Курс
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="year"
                  name="year"
                  type="text"
                  placeholder="Например: 1 курс, 2 курс"
                  value={formData.year}
                  onChange={handleChange}
                  className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <X className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 h-12"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Сохранить
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
