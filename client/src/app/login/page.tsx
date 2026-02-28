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
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  BookOpen,
  Globe,
  Users,
  ArrowLeft,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"email" | "password">("email");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const stepTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { login } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError(t("login.error.emailRequired"));
      return;
    }

    const emailPattern = /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/;
    if (!emailPattern.test(email.trim())) {
      setEmailError(t("login.error.emailInvalid"));
      return;
    }

    setEmailError("");
    setIsTransitioning(true);
    const transitionDuration = 320;
    stepTimeoutRef.current = setTimeout(() => {
      setStep("password");
      requestAnimationFrame(() => {
        setIsTransitioning(false);
      });
    }, transitionDuration);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push("/dashboard");
      } else {
        setError(t("login.error.invalidCredentials"));
        setPassword("");
      }
    } catch {
      setError(t("login.error.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setPassword("");
    setError("");
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
    }
    setStep("email");
    setIsTransitioning(false);
  };

  useEffect(() => {
    return () => {
      if (stepTimeoutRef.current) {
        clearTimeout(stepTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-start sm:items-center justify-center p-4 py-6 sm:py-8 overflow-y-auto">
      <div className="w-full max-w-md my-auto">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 group">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
              AdaptEd Russia
            </span>
          </Link>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl relative">
          {/* Go Back Button */}
          <div className="absolute top-4 left-4 z-10">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all duration-200 group"
              aria-label={t("login.goHome")}
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-200" />
            </Link>
          </div>

          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <LogIn className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {t("login.welcome")}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {step === "email"
                ? t("login.subtitle")
                : t("login.subtitlePassword")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-6 relative overflow-hidden min-h-[320px] sm:min-h-[360px]">
            <AnimatePresence mode="wait">
              {step === "email" ? (
                <motion.form
                  key="email-step"
                  onSubmit={handleEmailSubmit}
                  className="space-y-4"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  style={{ minHeight: "200px" }}
                >
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700"
                >
                  {t("login.email")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("login.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        autoFocus
                    required
                  />
                </div>
                    {emailError && (
                      <p className="text-sm text-red-600">{emailError}</p>
                    )}
              </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
                  >
                    {t("login.next")}
                  </Button>
                </motion.form>
              ) : (
                <motion.div
                  key="password-step"
                  className="space-y-5"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  style={{ minHeight: "200px" }}
                >
                  <motion.div
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          {t("login.confirmedEmail")}
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleBackToEmail}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        aria-label={t("login.changeEmail")}
                      >
                        {t("login.back")}
                      </button>
                    </div>
                  </motion.div>

                  <motion.form
                    onSubmit={handlePasswordSubmit}
                    className="space-y-4"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  {t("login.password")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("login.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                          autoFocus={false}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          aria-label={
                            showPassword ? t("login.hidePassword") : t("login.showPassword")
                          }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="text-right">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {t("login.forgotPassword")}
                  </Link>
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

                    <motion.div>
              <Button
                type="submit"
                disabled={isLoading}
                        className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("login.submitting")}
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    {t("login.submit")}
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
                    className="flex items-center space-x-2 text-blue-600"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">
                      {t("login.transitioningToPassword")}
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
                <span className="px-2 bg-white text-slate-500">{t("login.or")}</span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-slate-600">
                {t("login.noAccount")}{" "}
                <Link
                  href="/register"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t("login.register")}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20">
            <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-slate-600">{t("login.feature.education")}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20">
            <Globe className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-xs text-slate-600">{t("login.feature.life")}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20">
            <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-xs text-slate-600">{t("login.feature.community")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
