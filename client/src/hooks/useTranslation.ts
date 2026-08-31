import { useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslations } from "@/lib/translations";
import { Language } from "@/types";

export function useTranslation() {
  const { currentLanguage } = useLanguage();

  const t = useCallback(
    (key: string): string => {
      const dict = getTranslations(currentLanguage);
      if (dict[key]) {
        return dict[key];
      }
      return getTranslations(Language.RU)[key] || key;
    },
    [currentLanguage]
  );

  return { t, currentLanguage };
}

