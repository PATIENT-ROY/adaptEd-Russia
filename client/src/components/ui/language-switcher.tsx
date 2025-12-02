"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Language } from "@/types";

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  className?: string;
}

const languages: { code: Language; name: string; flag: string }[] = [
  { code: Language.RU, name: "Русский", flag: "🇷🇺" },
  { code: Language.EN, name: "English", flag: "🇺🇸" },
  { code: Language.FR, name: "Français", flag: "🇫🇷" },
  { code: Language.AR, name: "العربية", flag: "🇸🇦" },
  { code: Language.ZH, name: "中文", flag: "🇨🇳" },
];

export function LanguageSwitcher({
  currentLanguage,
  onLanguageChange,
  className,
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentLang = languages.find((lang) => lang.code === currentLanguage);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative inline-flex", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-2 p-1 sm:px-2 sm:py-1 h-6 sm:h-7 lg:h-8 rounded-lg sm:rounded-xl"
      >
        <Globe className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
        <span className="text-sm sm:text-base">{currentLang?.flag}</span>
        <span className="hidden sm:inline text-xs sm:text-sm font-medium">
          {currentLang?.name}
        </span>
        <ChevronDown
          className={cn(
            "h-2.5 w-2.5 sm:h-3 sm:w-3 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </Button>

      {isOpen && (
        <div className="absolute left-1/2 top-full z-50 mt-2 min-w-[140px] sm:min-w-[160px] -translate-x-1/2 overflow-hidden rounded-lg sm:rounded-xl border border-slate-200 bg-white shadow-lg p-1 sm:p-1.5">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                onLanguageChange(language.code);
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-left hover:bg-slate-50 transition-colors duration-200 text-sm sm:text-base rounded-md",
                currentLanguage === language.code &&
                  "bg-blue-50 text-blue-600 font-medium"
              )}
            >
              <span className="text-sm sm:text-base">{language.flag}</span>
              <span className="font-medium">{language.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
