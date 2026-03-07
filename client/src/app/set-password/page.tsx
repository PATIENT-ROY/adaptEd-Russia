"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";

export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const email = useMemo(() => searchParams.get("email") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Ссылка недействительна: отсутствует токен.");
      setIsChecking(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/auth/set-password/verify?token=${encodeURIComponent(token)}`
        );
        const data = await res.json();
        if (!res.ok || !data?.success) {
          setError(data?.error || "Ссылка недействительна или истекла.");
          setIsValidToken(false);
        } else {
          setIsValidToken(true);
        }
      } catch {
        setError("Ошибка проверки ссылки. Попробуйте ещё раз.");
      } finally {
        setIsChecking(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        setError(data?.error || "Не удалось установить пароль.");
        return;
      }

      setSuccess("Пароль установлен. Теперь вы можете войти в аккаунт.");
      setTimeout(() => router.push("/login"), 1200);
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center space-x-2 text-slate-800 font-semibold">
            <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">A</span>
            <span>AdaptEd Russia</span>
          </Link>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Установите пароль</CardTitle>
            <CardDescription>
              {email ? `Для аккаунта ${email}` : "Завершите активацию аккаунта"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isChecking ? (
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Проверяем ссылку...
              </div>
            ) : !isValidToken ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span className="text-sm">{error || "Ссылка недействительна или истекла."}</span>
                </div>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Перейти ко входу
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} method="post" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="password">
                    Новый пароль
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      placeholder="Минимум 8 символов, A-z и цифры"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="confirmPassword">
                    Подтвердите пароль
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700">
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
                {success && (
                  <div className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 mt-0.5" />
                    <span className="text-sm">{success}</span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Сохраняем...
                    </>
                  ) : (
                    "Установить пароль"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

