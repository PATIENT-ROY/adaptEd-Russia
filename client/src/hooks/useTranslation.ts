import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslations } from "@/lib/translations";

export function useTranslation() {
  const { currentLanguage } = useLanguage();
  
  const t = (key: string): string => {
    const translations = getTranslations(currentLanguage);
    return translations[key] || key;
  };
  
  return { t, currentLanguage };
}

