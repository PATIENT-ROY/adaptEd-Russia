"use client";

import { useState, useEffect } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import {
  LogOut,
  CheckCircle,
  X,
  Shield,
  User,
  Home,
  ArrowRight,
} from "lucide-react";

interface LogoutNotificationProps {
  userName: string;
  onClose: () => void;
  isVisible: boolean;
}

export function LogoutNotification({
  userName,
  onClose,
  isVisible,
}: LogoutNotificationProps) {

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (isVisible) {
      // Автоматически скрыть через 8 секунд
      const timer = setTimeout(() => {
        onClose();
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, isClient]);

  useBodyScrollLock(isClient && isVisible);

  if (!isClient || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md animate-fade-in">
      <Card className="w-full max-w-lg border-0 shadow-2xl animate-slide-in-from-top bg-gradient-to-br from-white via-slate-50 to-blue-50">
        <CardHeader className="text-center pb-6 relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 p-0 rounded-full hover:bg-slate-100 transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Logout icon with animation */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500 via-orange-500 to-red-600 flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
            <LogOut className="h-10 w-10 text-white" />
          </div>

          <CardTitle className="text-3xl font-bold text-slate-900 mb-3">
            До свидания! 👋
          </CardTitle>
          <CardDescription className="text-lg text-slate-600">
            Вы успешно вышли из аккаунта, {userName}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Success message */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-green-100 text-green-800 mb-4">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Выход выполнен успешно</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Ваша сессия завершена. Все данные сохранены и будут доступны при
              следующем входе в систему.
            </p>
          </div>

          {/* Security status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-900">
                Сессия завершена
              </p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-green-50 border border-green-100">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-900">
                Данные сохранены
              </p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-purple-50 border border-purple-100">
              <User className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-900">
                Профиль защищен
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
            <Button
              onClick={() => (window.location.href = "/")}
              className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-medium"
            >
              <Home className="mr-2 h-5 w-5" />
              На главную
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={() => (window.location.href = "/login")}
              variant="outline"
              className="flex-1 h-12 border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 font-medium"
            >
              <User className="mr-2 h-5 w-5" />
              Войти снова
            </Button>
          </div>

          {/* Auto-close info */}
          <div className="text-center">
            <p className="text-xs text-slate-500">
              Уведомление автоматически закроется через несколько секунд
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
