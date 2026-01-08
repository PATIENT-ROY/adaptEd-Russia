"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-2xl sm:rounded-3xl shadow-lg max-w-md mx-4">
        <div className="mb-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Что-то пошло не так
          </h1>
          <p className="text-gray-600 mb-4">
            Произошла ошибка при загрузке страницы. Попробуйте обновить
            страницу.
          </p>
          {error.digest && (
            <p className="text-xs text-gray-500 mb-4">
              Код ошибки: {error.digest}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full flex items-center justify-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Попробовать снова</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="w-full"
          >
            Вернуться на главную
          </Button>
        </div>
      </div>
    </div>
  );
}
