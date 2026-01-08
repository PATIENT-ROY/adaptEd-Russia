"use client";

import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export function HtmlLang() {
  const { currentLanguage } = useLanguage();

  useEffect(() => {
    // Обновляем атрибут lang в html элементе
    const html = document.documentElement;

    const langMap: Record<string, string> = {
      RU: "ru",
      EN: "en",
      FR: "fr",
      AR: "ar",
      ZH: "zh",
    };

    const langCode = langMap[currentLanguage] || "ru";

    if (html.lang !== langCode) {
      html.lang = langCode;
    }
  }, [currentLanguage]);

  return null;
}
