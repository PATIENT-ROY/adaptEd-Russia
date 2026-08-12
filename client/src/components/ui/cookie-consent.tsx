"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const STORAGE_KEY = "cookie-consent";

export function CookieConsent() {
  const { t } = useTranslation();
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setShowConsent(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const save = (value: "accepted" | "necessary") => {
    localStorage.setItem(STORAGE_KEY, value);
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-md z-50 p-3 sm:p-0">
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200/80 sm:rounded-xl shadow-lg sm:shadow-2xl">
        <div className="px-4 sm:px-5 py-4 relative">
          <button
            onClick={() => save("necessary")}
            className="absolute top-2 right-2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label={t("cookie.close")}
          >
            <X className="w-4 h-4" />
          </button>

          <p className="text-sm font-semibold text-gray-900 mb-1.5 pr-8">
            {t("cookie.title")}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
            {t("cookie.message")}{" "}
            <Link
              href="/privacy-policy"
              className="text-blue-600 hover:text-blue-700 underline font-medium"
            >
              {t("cookie.policyLink")}
            </Link>
            .
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => save("accepted")}
              className="inline-flex justify-center items-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 transition-colors"
            >
              {t("cookie.accept")}
            </button>
            <button
              onClick={() => save("necessary")}
              className="inline-flex justify-center items-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2.5 transition-colors"
            >
              {t("cookie.necessary")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
