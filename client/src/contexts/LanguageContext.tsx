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
  const [currentLanguage, setCurrentLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return Language.RU;
    try {
      const savedLanguage = window.localStorage.getItem("language");
      if (
        savedLanguage &&
        Object.values(Language).includes(savedLanguage as Language)
      ) {
        return savedLanguage as Language;
      }
    } catch {
      // ignore
    }
    return Language.RU;
  });

  // Синхронизация при монтировании (на случай внешнего изменения storage)
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem("language");
      if (
        savedLanguage &&
        Object.values(Language).includes(savedLanguage as Language) &&
        savedLanguage !== currentLanguage
      ) {
        setCurrentLanguageState(savedLanguage as Language);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
