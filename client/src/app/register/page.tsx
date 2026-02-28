"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
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
  ArrowLeft,
} from "lucide-react";
import { Role, Plan, Language } from "@/types";

const STEP_TRANSITION_DURATION = 0.35; // seconds
const STEP_TRANSITION_MS = STEP_TRANSITION_DURATION * 1000;

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
  const [detailsError, setDetailsError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"details" | "security">("details");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const stepTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { register } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsError("");

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      formData.email.trim()
    );
    if (!formData.name.trim() || !isValidEmail || !formData.country) {
      setDetailsError(t("register.error.detailsRequired"));
      return;
    }

    setIsTransitioning(true);
    stepTimeoutRef.current = setTimeout(() => {
      setStep("security");
      setIsTransitioning(false);
    }, STEP_TRANSITION_MS);
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError(t("register.error.passwordMismatch"));
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
      return;
    }

    if (formData.password.length < 6) {
      setError(t("register.error.passwordTooShort"));
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
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
        setError(t("register.error.emailExists"));
      }
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.toLowerCase().includes("network")
      ) {
        setError(t("register.error.networkError"));
      } else {
        setError(t("register.error.generic"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToDetails = () => {
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
    }
    setStep("details");
    setIsTransitioning(false);
    setError("");
    setDetailsError("");
  };

  useEffect(() => {
    return () => {
      if (stepTimeoutRef.current) {
        clearTimeout(stepTimeoutRef.current);
      }
    };
  }, []);

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
        <Card className="border-0 shadow-2xl relative">
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
              {t("register.title")}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {t("register.subtitle")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 relative overflow-hidden min-h-[360px]">
            <AnimatePresence mode="wait">
              {step === "details" ? (
                <motion.form
                  key="details-step"
                  onSubmit={handleDetailsSubmit}
                  className="space-y-4"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{
                    duration: STEP_TRANSITION_DURATION,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  layout
                >
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="text-sm font-medium text-slate-700"
                    >
                      {t("register.name")}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder={t("register.namePlaceholder")}
                        value={formData.name}
                        onChange={handleChange}
                        className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-slate-700"
                    >
                      {t("register.email")}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder={t("register.emailPlaceholder")}
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="country"
                      className="text-sm font-medium text-slate-700"
                    >
                      {t("register.country")}
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
                        <option value="">{t("register.countryPlaceholder")}</option>
                        {countries.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {detailsError && (
                    <motion.div
                      className="flex items-center space-x-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{detailsError}</span>
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                  >
                    {t("register.next")}
                  </Button>
                </motion.form>
              ) : (
                <motion.div
                  key="security-step"
                  className="space-y-5"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{
                    duration: STEP_TRANSITION_DURATION,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  layout
                  style={{ minHeight: "220px" }}
                >
                  <motion.div
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    layout
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          {t("register.step1Complete")}
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formData.name ? formData.name : t("register.nameNotProvided")}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formData.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleBackToDetails}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {t("register.edit")}
                      </button>
                    </div>
                  </motion.div>

                  <motion.form
                    onSubmit={handleSecuritySubmit}
                    className="space-y-4"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    layout
                  >
                    <div className="space-y-2">
                      <label
                        htmlFor="password"
                        className="text-sm font-medium text-slate-700"
                      >
                        {t("register.password")}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={t("register.passwordPlaceholder")}
                          value={formData.password}
                          onChange={handleChange}
                          className="pl-10 pr-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                          autoFocus={!isTransitioning}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          aria-label={
                            showPassword ? t("register.hidePassword") : t("register.showPassword")
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="confirmPassword"
                        className="text-sm font-medium text-slate-700"
                      >
                        {t("register.confirmPassword")}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder={t("register.confirmPasswordPlaceholder")}
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="pl-10 pr-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          aria-label={
                            showConfirmPassword
                              ? t("register.hideConfirmPassword")
                              : t("register.showConfirmPassword")
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          className="flex items-center space-x-2 p-3 rounded-lg bg-red-50 border border-red-200"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2 }}
                        >
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600">{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.div layout>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("register.submitting")}
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            {t("register.submit")}
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.form>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isTransitioning && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="flex items-center space-x-2 text-emerald-600"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">
                      {t("register.preparingNextStep")}
                    </span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">{t("register.or")}</span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-slate-600">
                {t("register.hasAccount")}{" "}
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t("register.login")}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
