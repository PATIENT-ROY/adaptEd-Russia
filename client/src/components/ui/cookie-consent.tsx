"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => {
        setShowConsent(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-md z-50">
      <div className="bg-white/95 backdrop-blur-sm border-t sm:border border-gray-200/50 sm:rounded-xl shadow-lg sm:shadow-2xl">
        <div className="px-4 sm:px-5 py-3 sm:py-4">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Компактная иконка */}
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-5 h-5 text-white"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>

            {/* Текст */}
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                Мы используем файлы cookie для улучшения вашего опыта на сайте.
                <button
                  onClick={handleAccept}
                  className="ml-1 sm:ml-2 text-blue-600 hover:text-blue-700 font-medium underline inline-flex items-center"
                >
                  Принять
                </button>
              </p>
            </div>

            {/* Кнопка закрытия */}
            <button
              onClick={handleAccept}
              className="flex-shrink-0 -mt-1 -mr-1 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
