"use client";

import { useState, useEffect } from "react";
import { Button } from "./button";

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
        style={{ width: "259px", height: "159px" }}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 flex flex-col justify-center mb-3">
            <p className="text-sm text-gray-900 leading-tight text-center font-medium">
              Оставаясь на сайте,
            </p>
            <p className="text-sm text-gray-900 leading-tight text-center mt-1 font-medium">
              вы соглашаетесь на обработку
            </p>
            <p className="text-sm text-gray-900 leading-tight text-center mt-1">
              <span className="text-gray-500">файлов куки</span>
            </p>
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
