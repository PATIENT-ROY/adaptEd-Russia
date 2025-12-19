"use client";

import { useState, useEffect } from "react";
import { Button } from "./button";

// Иконка печенья с откушенным кусочком в цветах сайта
const CookieIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Основной круг печенья - синий */}
    <circle
      cx="32"
      cy="32"
      r="24"
      fill="#3B82F6"
      stroke="#2563EB"
      strokeWidth="1.5"
    />
    {/* Откушенный кусок справа - создаем вырез (светло-синий) */}
    <path
      d="M48 32C48 40.8366 40.8366 48 32 48C23.1634 48 16 40.8366 16 32C16 23.1634 23.1634 16 32 16C40.8366 16 48 23.1634 48 32Z"
      fill="#DBEAFE"
      stroke="#93C5FD"
      strokeWidth="1"
    />
    {/* Внутренний контур откушенного куска - темно-синий */}
    <path
      d="M44 28C44 30.2091 42.2091 32 40 32C37.7909 32 36 30.2091 36 28C36 25.7909 37.7909 24 40 24C42.2091 24 44 25.7909 44 28Z"
      fill="#1E40AF"
    />
    {/* Крошки - темно-синие точки */}
    <circle cx="20" cy="20" r="2.5" fill="#1E3A8A" />
    <circle cx="28" cy="18" r="2" fill="#1E3A8A" />
    <circle cx="18" cy="28" r="2.5" fill="#1E3A8A" />
    <circle cx="26" cy="30" r="2" fill="#1E3A8A" />
    <circle cx="36" cy="22" r="2.5" fill="#1E3A8A" />
    <circle cx="38" cy="36" r="2" fill="#1E3A8A" />
    <circle cx="24" cy="40" r="2.5" fill="#1E3A8A" />
    <circle cx="18" cy="38" r="2" fill="#1E3A8A" />
    <circle cx="42" cy="28" r="2.5" fill="#1E3A8A" />
    <circle cx="30" cy="44" r="2" fill="#1E3A8A" />
  </svg>
);

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Проверяем, было ли уже дано согласие
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Показываем баннер через небольшую задержку для лучшего UX
      const timer = setTimeout(() => {
        setShowConsent(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 animate-slide-in-from-bottom">
      <div
        className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4"
        style={{ width: "auto", height: "159px" }}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <CookieIcon className="w-8 h-8" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-sm text-gray-900 leading-tight font-medium">
                Оставаясь на сайте,
              </p>
              <p className="text-sm text-gray-900 leading-tight mt-1 font-medium">
                вы соглашаетесь на обработку
              </p>
              <p className="text-sm text-gray-900 leading-tight mt-1">
                <span className="text-gray-500">файлов куки</span>
              </p>
            </div>
          </div>
          <Button
            onClick={handleAccept}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors duration-200 text-sm"
          >
            Принять
          </Button>
        </div>
      </div>
    </div>
  );
}
