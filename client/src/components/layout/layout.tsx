"use client";

import { useState } from "react";
import { Navigation } from "./navigation";
import { Language } from "@/types";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(Language.RU);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
