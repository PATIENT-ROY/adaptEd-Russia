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
      <Navigation
        currentLanguage={currentLanguage}
        onLanguageChange={setLanguage}
      />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10 md:pb-12 lg:pb-16">
        {children}
      </main>
    </div>
  );
}
