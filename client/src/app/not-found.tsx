"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Search, Home } from "lucide-react";
import { Layout } from "@/components/layout/layout";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-4 max-w-md rounded-2xl bg-white p-8 text-center shadow-lg sm:rounded-3xl">
          <div className="mb-6">
            <Search className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Страница не найдена
            </h1>
            <p className="mb-4 text-gray-600">
              Запрашиваемая страница не существует или была перемещена.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/">
              <Button className="flex w-full items-center justify-center space-x-2">
                <Home className="h-4 w-4" />
                <span>На главную</span>
              </Button>
            </Link>

            <BackButton href="/" label="Назад" className="w-full justify-center" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
