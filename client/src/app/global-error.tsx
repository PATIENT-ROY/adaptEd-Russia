"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global Error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
            <div className="mb-6">
              <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Критическая ошибка
              </h1>
              <p className="text-gray-600 mb-4">
                Произошла серьезная ошибка в приложении. Попробуйте
                перезагрузить страницу.
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
                <span>Перезагрузить</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
                className="w-full flex items-center justify-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>На главную</span>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
