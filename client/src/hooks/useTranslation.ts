import { useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslations } from "@/lib/translations";
import { Language } from "@/types";

export function useTranslation() {
  const { currentLanguage } = useLanguage();

  const t = useCallback(
    (key: string): string => {
      const translations = getTranslations(currentLanguage);
      if (translations[key]) {
        return translations[key];
      }
      const ruTranslations = getTranslations(Language.RU);
      return ruTranslations[key] || key;
    },
    [currentLanguage]
  );

  return { t, currentLanguage };
}

