"use client";

import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  MapPin,
  Clock,
  Phone,
  Map,
  ArrowLeft,
  ChevronDown,
  Star,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";

interface TranslationCenter {
  id: string;
  name: string;
  address: string;
  services: string[];
  workingHours: string;
  phone: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  city: string;
  rating?: number;
  reviewsCount?: number;
  isVerified?: boolean;
}

// Моковые данные центров перевода
const mockCenters: TranslationCenter[] = [
  {
    id: "1",
    name: "Lingua Pro",
    address: "ул. Тверская, 12",
    services: ["Нотариальные переводы", "Технические переводы"],
    workingHours: "Пн–Пт 9:00–19:00",
    phone: "+7 (495) 123-45-67",
    coordinates: { lat: 55.7558, lon: 37.6173 },
    city: "Москва",
    rating: 4.8,
    reviewsCount: 120,
    isVerified: true,
  },
  {
    id: "2",
    name: "Переводческий центр",
    address: "пр. Невский, 28",
    services: ["Нотариальные переводы", "Медицинские переводы"],
    workingHours: "Пн–Сб 10:00–20:00",
    phone: "+7 (812) 234-56-78",
    coordinates: { lat: 59.9343, lon: 30.3351 },
    city: "Санкт-Петербург",
    rating: 4.6,
    reviewsCount: 89,
    isVerified: true,
  },
  {
    id: "3",
    name: "Центр Переводчикъ",
    address: "ул. Ленина, 50",
    services: ["Нотариальные переводы", "Срочные переводы", "Апостилирование"],
    workingHours: "Пн–Пт 9:00–18:00",
    phone: "+7 (343) 123-45-67",
    coordinates: { lat: 56.8431, lon: 60.6454 },
    city: "Екатеринбург",
    rating: 4.8,
    reviewsCount: 33,
    isVerified: true,
  },
  {
    id: "4",
    name: "Бюро переводов Екатеринбург",
    address: "пр. Ленина, 24",
    services: ["Нотариальные переводы", "Технические переводы", "Медицинские переводы"],
    workingHours: "Пн–Сб 10:00–19:00",
    phone: "+7 (343) 234-56-78",
    coordinates: { lat: 56.8380, lon: 60.5973 },
    city: "Екатеринбург",
    rating: 4.3,
    reviewsCount: 127,
    isVerified: true,
  },
  {
    id: "5",
    name: "Глобус-М - Казанский центр переводов",
    address: "ул. Баумана, 58",
    services: ["Письменные переводы", "Устные переводы", "Нотариальные переводы"],
    workingHours: "Пн–Пт 9:00–18:00",
    phone: "+7 (843) 123-45-67",
    coordinates: { lat: 55.7961, lon: 49.1064 },
    city: "Казань",
    rating: 4.7,
    reviewsCount: 48,
    isVerified: true,
  },
  {
    id: "6",
    name: "Бюро переводов Казань",
    address: "ул. Кремлёвская, 35",
    services: ["Нотариальные переводы", "Технические переводы", "Юридические переводы"],
    workingHours: "Пн–Сб 10:00–20:00",
    phone: "+7 (843) 234-56-78",
    coordinates: { lat: 55.7986, lon: 49.1067 },
    city: "Казань",
    rating: 4.5,
    reviewsCount: 85,
    isVerified: true,
  },
];

// Основные города России (отсортированы по алфавиту)
const cities = [
  "Абакан",
  "Альметьевск",
  "Ангарск",
  "Арзамас",
  "Армавир",
  "Архангельск",
  "Астрахань",
  "Ачинск",
  "Балаково",
  "Балашиха",
  "Барнаул",
  "Белгород",
  "Бийск",
  "Благовещенск",
  "Братск",
  "Брянск",
  "Великий Новгород",
  "Владивосток",
  "Владикавказ",
  "Владимир",
  "Волгоград",
  "Волгодонск",
  "Волжский",
  "Волжск",
  "Воронеж",
  "Глазов",
  "Грозный",
  "Дербент",
  "Дзержинск",
  "Димитровград",
  "Домодедово",
  "Евпатория",
  "Екатеринбург",
  "Елабуга",
  "Елец",
  "Ессентуки",
  "Железнодорожный",
  "Жуковский",
  "Златоуст",
  "Иваново",
  "Ижевск",
  "Иркутск",
  "Йошкар-Ола",
  "Казань",
  "Калининград",
  "Калуга",
  "Каменск-Уральский",
  "Каспийск",
  "Кемерово",
  "Киров",
  "Киселёвск",
  "Кисловодск",
  "Комсомольск-на-Амуре",
  "Копейск",
  "Королёв",
  "Кострома",
  "Красногорск",
  "Краснодар",
  "Красноярск",
  "Курган",
  "Курск",
  "Кызыл",
  "Липецк",
  "Люберцы",
  "Магадан",
  "Магнитогорск",
  "Махачкала",
  "Миасс",
  "Москва",
  "Мурманск",
  "Мытищи",
  "Набережные Челны",
  "Назрань",
  "Нальчик",
  "Находка",
  "Невинномысск",
  "Нефтекамск",
  "Нефтеюганск",
  "Нижневартовск",
  "Нижний Новгород",
  "Нижний Тагил",
  "Новоалтайск",
  "Новокузнецк",
  "Новокуйбышевск",
  "Новомосковск",
  "Новороссийск",
  "Новосибирск",
  "Новочебоксарск",
  "Новошахтинск",
  "Новоуральск",
  "Ногинск",
  "Норильск",
  "Обнинск",
  "Одинцово",
  "Октябрьский",
  "Омск",
  "Орёл",
  "Оренбург",
  "Орехово-Зуево",
  "Орск",
  "Отрадное",
  "Пенза",
  "Первоуральск",
  "Пермь",
  "Петрозаводск",
  "Петропавловск-Камчатский",
  "Подольск",
  "Прокопьевск",
  "Псков",
  "Пятигорск",
  "Раменское",
  "Реутов",
  "Ростов-на-Дону",
  "Рыбинск",
  "Рязань",
  "Самара",
  "Саранск",
  "Саратов",
  "Севастополь",
  "Северодвинск",
  "Серпухов",
  "Симферополь",
  "Смоленск",
  "Сочи",
  "Ставрополь",
  "Старый Оскол",
  "Стерлитамак",
  "Сургут",
  "Сызрань",
  "Сыктывкар",
  "Тамбов",
  "Тверь",
  "Тольятти",
  "Томск",
  "Тула",
  "Тюмень",
  "Улан-Удэ",
  "Ульяновск",
  "Уссурийск",
  "Уфа",
  "Ухта",
  "Хабаровск",
  "Хасавюрт",
  "Химки",
  "Чебоксары",
  "Челябинск",
  "Череповец",
  "Черкесск",
  "Чита",
  "Шахты",
  "Элиста",
  "Энгельс",
  "Южно-Сахалинск",
  "Юрга",
  "Якутск",
  "Ярославль",
].sort();

export default function TranslationCentersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState<string>("Москва");
  const [isUsingProfileCity, setIsUsingProfileCity] = useState(false);
  const [centers, setCenters] = useState<TranslationCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Инициализация города из профиля пользователя
  useEffect(() => {
    if (user?.city) {
      const userCity = user.city;
      // Проверяем, есть ли город в списке доступных городов
      if (cities.includes(userCity)) {
        setSelectedCity(userCity);
        setIsUsingProfileCity(true);
      }
    }
  }, [user]);

  useEffect(() => {
    // Имитация загрузки данных
    setIsLoading(true);
    setTimeout(() => {
      const filteredCenters = mockCenters.filter(
        (center) => center.city === selectedCity
      );
      setCenters(filteredCenters);
      setIsLoading(false);
    }, 500);
  }, [selectedCity]);

  // Отслеживаем, когда пользователь меняет город вручную
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    // Если пользователь выбрал город, отличный от города в профиле, сбрасываем флаг
    if (user?.city && city !== user.city) {
      setIsUsingProfileCity(false);
    } else if (user?.city && city === user.city) {
      setIsUsingProfileCity(true);
    }
  };

  const handleShowOnMap = (center: TranslationCenter) => {
    // Открыть Yandex Maps с координатами центра
    // Используем Yandex Maps API для открытия карты с меткой
    const url = `https://yandex.ru/maps/?pt=${center.coordinates.lon},${center.coordinates.lat}&z=15&l=map`;
    window.open(url, "_blank");
  };

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <Link href="/education-guide">
              <Button variant="ghost" size="sm" className="mb-2 sm:mb-0">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("translationCenters.back")}
              </Button>
            </Link>
            <div className="rounded-lg bg-blue-50 p-3 w-fit">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {user
                  ? `${t("translationCenters.titleInCity")} ${selectedCity}`
                  : t("translationCenters.titleGuest")}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {user
                  ? t("translationCenters.subtitleUser")
                  : t("translationCenters.subtitleGuest")}
              </p>
            </div>
          </div>
        </div>

        {/* City Selector */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="text-base sm:text-lg font-semibold text-gray-900">
                {selectedCity}
              </span>
            </div>
            <div className="relative flex-1 sm:flex-initial sm:min-w-[200px]">
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer hover:border-gray-400 transition-colors"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Centers List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 w-64 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : centers.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="max-w-md mx-auto">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {t("translationCenters.empty.title")}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6">
                  {t("translationCenters.empty.description")}
                </p>
                <div className="flex flex-col sm:flex-row sm:justify-center gap-4 sm:gap-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Можно добавить модальное окно для выбора города
                      // Пока просто фокус на селектор города
                      const citySelector = document.querySelector('select');
                      citySelector?.focus();
                    }}
                    className="w-full sm:w-auto"
                  >
                    {t("translationCenters.empty.changeCity")}
                  </Button>
                  <Link href="/docscan" className="block sm:inline-block">
                    <Button variant="default" className="w-full sm:w-auto">
                      {t("translationCenters.empty.useDocScan")}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {centers.map((center) => (
              <Card
                key={center.id}
                className="hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                    {/* Main Info */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                          {center.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3">
                          {center.isVerified && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded-md">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-xs sm:text-sm font-medium text-green-700">
                                {t("translationCenters.verified")}
                              </span>
                            </div>
                          )}
                          {center.rating && (
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <span className="ml-1 text-sm sm:text-base font-semibold text-gray-900">
                                  {center.rating}
                                </span>
                              </div>
                              {center.reviewsCount && (
                                <span className="text-xs sm:text-sm text-gray-500">
                                  ({center.reviewsCount} {t("translationCenters.reviews")})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm sm:text-base text-gray-600">
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                          <span>{center.address}</span>
                        </div>

                        <div className="flex items-start">
                          <FileText className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                          <div>
                            {center.services.map((service, idx) => (
                              <span key={idx}>
                                {service}
                                {idx < center.services.length - 1 && ", "}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-start">
                          <Clock className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                          <span>{center.workingHours}</span>
                        </div>

                        <div className="flex items-start">
                          <Phone className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                          <a
                            href={`tel:${center.phone}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {center.phone}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Map Button */}
                    <div className="flex items-start lg:items-center">
                      <Button
                        variant="outline"
                        onClick={() => handleShowOnMap(center)}
                        className="w-full sm:w-auto"
                      >
                        <Map className="h-4 w-4 mr-2" />
                        {t("translationCenters.showOnMap")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

