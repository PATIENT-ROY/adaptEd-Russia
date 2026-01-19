"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn } from "lucide-react";
import Link from "next/link";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      setIsRedirecting(true);
      const timeoutId = window.setTimeout(() => {
        router.push("/login");
      }, 1200);
      return () => window.clearTimeout(timeoutId);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Card className="w-96 border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Загрузка...
            </h2>
            <p className="text-slate-600">Проверяем авторизацию</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Card className="w-96 border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <LogIn className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Требуется авторизация
            </h2>
            <p className="text-slate-600 mb-6">
              Для доступа к этой странице необходимо войти в систему
            </p>
            {isRedirecting && (
              <div className="mb-6 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
                Сейчас перенаправим на страницу входа…
              </div>
            )}
            <div>
              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  Войти
                </Button>
              </Link>
              <Link href="/register" className="block mt-3">
                <Button variant="outline" className="w-full">
                  Зарегистрироваться
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
