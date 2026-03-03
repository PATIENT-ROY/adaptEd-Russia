"use client";

import { Navigation } from "./navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { currentLanguage, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-slate-900 focus:rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none font-semibold"
      >
        Перейти к основному контенту
      </a>
      <Navigation
        currentLanguage={currentLanguage}
        onLanguageChange={setLanguage}
      />
      <main id="main-content" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10 md:pb-12 lg:pb-16">
        {children}
      </main>
    </div>
  );
}
