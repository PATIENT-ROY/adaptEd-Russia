"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Switch } from "./switch";
import { Bell, Mail, MessageCircle, Smartphone } from "lucide-react";

interface NotificationSettings {
  emailNotifications: boolean;
  telegramNotifications: boolean;
  vkNotifications: boolean;
  telegramUsername: string;
  vkId: string;
  language: string;
  timezone: string;
}

interface NotificationSettingsProps {
  userId: string;
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    telegramNotifications: false,
    vkNotifications: false,
    telegramUsername: "",
    vkId: "",
    language: "RU",
    timezone: "Europe/Moscow",
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/notifications/settings", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        setSettings(responseData.data);
      }
    } catch (error) {
      console.error("Ошибка загрузки настроек:", error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Ошибка сохранения настроек:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTestReminder = async () => {
    try {
      const response = await fetch("/api/notifications/create-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: "Тестовое напоминание",
          category: "OTHER",
        }),
      });

      if (response.ok) {
        alert(
          `Тестовое напоминание создано! Уведомление будет отправлено через 2 минуты.`
        );
      }
    } catch (error) {
      console.error("Ошибка создания тестового напоминания:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Настройки уведомлений
          </CardTitle>
          <CardDescription>
            Настройте, как вы хотите получать уведомления о напоминаниях
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email уведомления */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <Label className="text-base font-medium">
                    Email уведомления
                  </Label>
                  <p className="text-sm text-gray-600">
                    Получайте уведомления на ваш email
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    emailNotifications: checked,
                  }))
                }
              />
            </div>
          </div>

          {/* Telegram уведомления */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                <div>
                  <Label className="text-base font-medium">
                    Telegram уведомления
                  </Label>
                  <p className="text-sm text-gray-600">
                    Получайте уведомления в Telegram
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.telegramNotifications}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    telegramNotifications: checked,
                  }))
                }
              />
            </div>

            {settings.telegramNotifications && (
              <div className="ml-8 space-y-2">
                <Label htmlFor="telegram-username">Telegram username</Label>
                <Input
                  id="telegram-username"
                  placeholder="@username"
                  value={settings.telegramUsername}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      telegramUsername: e.target.value,
                    }))
                  }
                />
                <p className="text-xs text-gray-500">
                  Введите ваш Telegram username без символа @
                </p>
              </div>
            )}
          </div>

          {/* VK уведомления */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-blue-700" />
                <div>
                  <Label className="text-base font-medium">
                    VK уведомления
                  </Label>
                  <p className="text-sm text-gray-600">
                    Получайте уведомления в VK
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.vkNotifications}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, vkNotifications: checked }))
                }
              />
            </div>

            {settings.vkNotifications && (
              <div className="ml-8 space-y-2">
                <Label htmlFor="vk-id">VK ID</Label>
                <Input
                  id="vk-id"
                  placeholder="123456789"
                  value={settings.vkId}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, vkId: e.target.value }))
                  }
                />
                <p className="text-xs text-gray-500">
                  Введите ваш VK ID (цифровой идентификатор)
                </p>
              </div>
            )}
          </div>

          {/* Часовой пояс */}
          <div className="space-y-2">
            <Label htmlFor="timezone">Часовой пояс</Label>
            <select
              id="timezone"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={settings.timezone}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, timezone: e.target.value }))
              }
            >
              <option value="Europe/Moscow">Москва (UTC+3)</option>
              <option value="Europe/London">Лондон (UTC+0)</option>
              <option value="America/New_York">Нью-Йорк (UTC-5)</option>
              <option value="Asia/Tokyo">Токио (UTC+9)</option>
            </select>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={saveSettings}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Сохранение..." : "Сохранить настройки"}
            </Button>

            <Button
              variant="outline"
              onClick={createTestReminder}
              className="flex-1"
            >
              Создать тестовое напоминание
            </Button>
          </div>

          {saved && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm">
                ✅ Настройки успешно сохранены!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Информация о типах напоминаний */}
      <Card>
        <CardHeader>
          <CardTitle>Типы напоминаний</CardTitle>
          <CardDescription>
            Система автоматически отправляет уведомления для следующих типов
            напоминаний:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛂</span>
              <div>
                <p className="font-medium">Продление визы</p>
                <p className="text-sm text-gray-600">
                  Автоматические напоминания о подаче документов на продление
                  визы
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl">📚</span>
              <div>
                <p className="font-medium">Курсовые работы</p>
                <p className="text-sm text-gray-600">
                  Напоминания о сроках сдачи курсовых и дипломных работ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl">🏛️</span>
              <div>
                <p className="font-medium">Миграционная служба</p>
                <p className="text-sm text-gray-600">
                  Напоминания о регистрации в миграционной службе
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="font-medium">Другие напоминания</p>
                <p className="text-sm text-gray-600">
                  Персональные напоминания, созданные вами
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
