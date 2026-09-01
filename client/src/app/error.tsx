"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Layout } from "@/components/layout/layout";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Error:", error);
  }, [error]);

  return (
    <Layout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-4 max-w-md rounded-2xl bg-white p-8 text-center shadow-lg sm:rounded-3xl">
          <div className="mb-6">
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Что-то пошло не так
            </h1>
            <p className="mb-4 text-gray-600">
              Произошла ошибка при загрузке страницы. Попробуйте обновить
              страницу.
            </p>
            {error.digest && (
              <p className="mb-4 text-xs text-gray-500">
                Код ошибки: {error.digest}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={reset}
              className="flex w-full items-center justify-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Попробовать снова</span>
            </Button>

            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                Вернуться на главную
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
