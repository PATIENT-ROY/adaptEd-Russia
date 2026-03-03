import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslations } from "@/lib/translations";
import { Language } from "@/types";

export function useTranslation() {
  const { currentLanguage } = useLanguage();
  
  const t = (key: string): string => {
    const translations = getTranslations(currentLanguage);
    if (translations[key]) {
      return translations[key];
    }

    // Fallback: если в текущем языке нет ключа, пробуем русский,
    // чтобы никогда не показывать «сырой» ключ пользователю.
    const ruTranslations = getTranslations(Language.RU);
    return ruTranslations[key] || key;
  };
  
  return { t, currentLanguage };
}

