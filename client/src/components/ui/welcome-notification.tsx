"use client";

import { useState, useEffect } from "react";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import {
  PartyPopper,
  CheckCircle,
  X,
  Sparkles,
  Heart,
  Star,
} from "lucide-react";

interface WelcomeNotificationProps {
  userName: string;
  onClose: () => void;
  isVisible: boolean;
}

export function WelcomeNotification({
  userName,
  onClose,
  isVisible,
}: WelcomeNotificationProps) {

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

  if (!isClient || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-md border-0 shadow-2xl animate-slide-in-from-top bg-gradient-to-br from-white to-blue-50">
        <CardHeader className="text-center pb-4 relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Celebration icons */}
          <div className="flex justify-center space-x-2 mb-4">
            <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
            <PartyPopper className="h-6 w-6 text-pink-500 animate-bounce" />
            <Heart className="h-6 w-6 text-red-500 animate-pulse" />
            <Star className="h-6 w-6 text-blue-500 animate-bounce" />
          </div>

          <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
            Добро пожаловать! 🎉
          </CardTitle>
          <CardDescription className="text-slate-600">
            Поздравляем с успешной регистрацией в AdaptEd Russia
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Welcome message */}
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-800 mb-2">
              Привет, {userName}! 👋
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Теперь вы часть нашего сообщества иностранных студентов. Мы
              поможем вам адаптироваться к жизни и учёбе в России!
            </p>
          </div>

          {/* What's next */}
          <div className="bg-blue-50 rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-blue-900 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
              Что дальше?
            </h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Изучите образовательные гайды
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Ознакомьтесь с бытовыми советами
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Настройте напоминания
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                Задайте вопросы AI-помощнику
              </li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3 pt-2">
            <Button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Начать путешествие! 🚀
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
