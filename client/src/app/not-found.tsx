"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-2xl sm:rounded-3xl shadow-lg max-w-md mx-4">
        <div className="mb-6">
          <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Страница не найдена
          </h1>
          <p className="text-gray-600 mb-4">
            Запрашиваемая страница не существует или была перемещена.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/">
            <Button className="w-full flex items-center justify-center space-x-2">
              <Home className="h-4 w-4" />
              <span>На главную</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Назад</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
