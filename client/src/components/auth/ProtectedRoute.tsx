"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
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
            <div className="space-y-3">
              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  Войти
                </Button>
              </Link>
              <Link href="/register">
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
