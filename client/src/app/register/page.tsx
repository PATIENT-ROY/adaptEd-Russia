"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  User,
  Globe,
  BookOpen,
  Home,
  Bell,
  ArrowLeft,
} from "lucide-react";
import { Role, Plan, Language } from "@/types";

// Список стран
const countries = [
  "Россия",
  "Казахстан",
  "Узбекистан",
  "Азербайджан",
  "Армения",
  "Белоруссия",
  "Кыргызстан",
  "Таджикистан",
  "Туркменистан",
  "Молдова",
  "Украина",
  "Грузия",
  "Китай",
  "Вьетнам",
  "Индонезия",
  "Индия",
  "Бангладеш",
  "Пакистан",
  "Иран",
  "Египет",
  "Нигерия",
  "Эфиопия",
  "Кения",
  "Марокко",
  "Тунис",
  "Алжир",
  "Гана",
  "Сенегал",
  "Бразилия",
  "Мексика",
  "Аргентина",
  "Колумбия",
  "Чили",
  "Перу",
  "Боливия",
  "США",
  "Канада",
  "Великобритания",
  "Германия",
  "Франция",
  "Италия",
  "Испания",
  "Польша",
  "Чехия",
  "Венгрия",
  "Румыния",
  "Болгария",
  "Греция",
  "Португалия",
  "Нидерланды",
  "Бельгия",
  "Австрия",
  "Швейцария",
  "Швеция",
  "Норвегия",
  "Дания",
  "Финляндия",
  "Ирландия",
  "Исландия",
  "Люксембург",
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    language: Language.RU,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (formData.password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }

    setIsLoading(true);

    try {
      const success = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        country: formData.country,
        language: formData.language,
        role: Role.STUDENT,
        plan: Plan.FREEMIUM,
      });

      if (success) {
        router.push("/dashboard");
      } else {
        setError("Ошибка при регистрации");
      }
    } catch {
      setError("Произошла ошибка при регистрации");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 group">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
              AdaptEd Russia
            </span>
          </Link>
        </div>

        {/* Register Card */}
        <Card className="border-0 shadow-2xl animate-fade-in-up relative">
          {/* Go Back Button - positioned in top-left corner */}
          <div className="absolute top-4 left-4 z-10">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all duration-200 group"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-200" />
            </Link>
          </div>

          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Присоединяйтесь к нам!
            </CardTitle>
            <CardDescription className="text-slate-600">
              Создайте аккаунт и начните адаптацию к жизни в России
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
                  Полное имя
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Ваше полное имя"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Country */}
              <div className="space-y-2">
                <label
                  htmlFor="country"
                  className="text-sm font-medium text-slate-700"
                >
                  Страна
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full pl-10 h-12 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 appearance-none"
                    required
                  >
                    <option value="">Выберите страну</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Минимум 6 символов"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-slate-700"
                >
                  Подтвердите пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Повторите пароль"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Регистрация...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Зарегистрироваться
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">или</span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-slate-600">
                Уже есть аккаунт?{" "}
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Войти
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20">
            <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-slate-600">Образовательные гайды</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20">
            <Home className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-xs text-slate-600">Бытовые советы</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20">
            <Bell className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-xs text-slate-600">Умные напоминания</p>
          </div>
        </div>
      </div>
    </div>
  );
}
