"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Language } from "@/types";

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always start with RU so SSR HTML matches the first client render.
  // localStorage is applied after mount (avoids hydration mismatch).
  const [currentLanguage, setCurrentLanguageState] = useState<Language>(
    Language.RU,
  );

  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem("language");
      if (
        savedLanguage &&
        Object.values(Language).includes(savedLanguage as Language)
      ) {
        setCurrentLanguageState(savedLanguage as Language);
      }
    } catch {
      // ignore
    }
  }, []);

  // Сохраняем язык в localStorage при изменении
  const setLanguage = useCallback((language: Language) => {
    setCurrentLanguageState(language);
    localStorage.setItem("language", language);
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
