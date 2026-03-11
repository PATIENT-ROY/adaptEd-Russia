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
  enableFirstVisitHint?: boolean;
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
  enableFirstVisitHint = false,
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const currentLang = languages.find((lang) => lang.code === currentLanguage);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markHintAsSeen = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("languageHintSeen", "true");
    } catch {
      // Ignore storage access failures (private mode, blocked storage, etc.)
    }
  };

  const dismissHint = () => {
    setShowHint(false);
    markHintAsSeen();
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
  };

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

  useEffect(() => {
    if (!enableFirstVisitHint) {
      setShowHint(false);
      return;
    }

    try {
      const seen = window.localStorage.getItem("languageHintSeen") === "true";
      if (!seen) {
        setShowHint(true);
      }
    } catch {
      setShowHint(true);
    }
  }, [enableFirstVisitHint]);

  useEffect(() => {
    if (!showHint) return;

    hintTimerRef.current = setTimeout(() => {
      dismissHint();
    }, 5000);

    return () => {
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
    };
  }, [showHint]);

  return (
    <div ref={containerRef} className={cn("relative inline-flex", className)}>
      {showHint && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-[180px] sm:w-[220px]"
        >
          <div className="pointer-events-auto relative rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 shadow-xl backdrop-blur-sm sm:px-4 sm:py-3">
            <div
              aria-hidden
              className="absolute -top-1.5 right-5 h-3 w-3 rotate-45 border-l border-t border-slate-200 bg-white/95"
            />
            <div className="flex items-start justify-between gap-2">
              <div className="leading-tight">
                <p className="text-xs font-medium text-slate-800 sm:text-sm">
                  🌍 Choose your language
                </p>
                <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                  Top right corner
                </p>
              </div>
              <button
                type="button"
                onClick={dismissHint}
                className="rounded-md p-0.5 text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Close language hint"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const nextOpen = !isOpen;
          setIsOpen(nextOpen);
          if (nextOpen && showHint) {
            dismissHint();
          }
        }}
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
