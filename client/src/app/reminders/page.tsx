"use client";

import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useReminders } from "@/hooks/useReminders";
import {
  Bell,
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  X,
  Save,
} from "lucide-react";
import {
  Reminder,
  ReminderStatus,
  ReminderPriority,
  ReminderCategory,
} from "@/types";

const getStatusIcon = (status: Reminder["status"]) => {
  switch (status) {
    case ReminderStatus.PENDING:
      return <Clock className="h-4 w-4 text-blue-500" />;
    case ReminderStatus.COMPLETED:
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case ReminderStatus.CANCELLED:
      return <XCircle className="h-4 w-4 text-gray-500" />;
    default:
      return <Clock className="h-4 w-4 text-blue-500" />;
  }
};

const getPriorityColor = (priority: Reminder["priority"]) => {
  switch (priority) {
    case ReminderPriority.HIGH:
      return "bg-red-100 text-red-700";
    case ReminderPriority.MEDIUM:
      return "bg-yellow-100 text-yellow-700";
    case ReminderPriority.LOW:
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getTypeColor = (category: Reminder["category"]) => {
  switch (category) {
    case ReminderCategory.EDUCATION:
      return "border-l-blue-500";
    case ReminderCategory.LIFE:
      return "border-l-green-500";
    case ReminderCategory.DOCUMENTS:
      return "border-l-red-500";
    case ReminderCategory.HEALTH:
      return "border-l-purple-500";
    default:
      return "border-l-gray-500";
  }
};

export default function RemindersPage() {
  const { user } = useAuth();
  const { reminders, loading, createReminder, updateReminder, deleteReminder } =
    useReminders(user?.id || "");
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    date: "",
    category: ReminderCategory.OTHER,
    priority: ReminderPriority.MEDIUM,
  });

  const pendingReminders = reminders.filter(
    (r) => r.status === ReminderStatus.PENDING
  );
  const completedReminders = reminders.filter(
    (r) => r.status === ReminderStatus.COMPLETED
  );

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newReminder.title || !newReminder.date || !user?.id) {
      return;
    }

    try {
      await createReminder({
        userId: user.id,
        title: newReminder.title,
        description: newReminder.description,
        dueDate: new Date(newReminder.date).toISOString(),
        category: newReminder.category,
        priority: newReminder.priority,
        status: ReminderStatus.PENDING,
      });

      setNewReminder({
        title: "",
        description: "",
        date: "",
        category: ReminderCategory.OTHER,
        priority: ReminderPriority.MEDIUM,
      });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error creating reminder:", error);
    }
  };

  const handleMarkCompleted = async (reminderId: string) => {
    try {
      await updateReminder(reminderId, { status: ReminderStatus.COMPLETED });
    } catch (error) {
      console.error("Error updating reminder:", error);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await deleteReminder(reminderId);
    } catch (error) {
      console.error("Error deleting reminder:", error);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Необходима авторизация
            </h2>
            <p className="text-gray-600">
              Войдите в аккаунт для управления напоминаниями
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-purple-50 p-3">
                <Bell className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Мои напоминания
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Управляйте задачами и важными датами
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Добавить напоминание</span>
            </Button>
          </div>
        </div>

        {/* Add Reminder Form */}
        {showAddForm && (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Добавить напоминание
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleAddReminder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название *
                  </label>
                  <Input
                    type="text"
                    value={newReminder.title}
                    onChange={(e) =>
                      setNewReminder((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Введите название напоминания"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={newReminder.description}
                    onChange={(e) =>
                      setNewReminder((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Дополнительная информация"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Дата *
                    </label>
                    <Input
                      type="date"
                      value={newReminder.date}
                      onChange={(e) =>
                        setNewReminder((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Тип
                    </label>
                    <div className="relative">
                      <select
                        value={newReminder.category}
                        onChange={(e) =>
                          setNewReminder((prev) => ({
                            ...prev,
                            category: e.target.value as ReminderCategory,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                      >
                        <option value="academic">Учёба</option>
                        <option value="life">Быт</option>
                        <option value="legal">Документы</option>
                        <option value="custom">Другое</option>
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg
                          className="h-4 w-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Приоритет
                    </label>
                    <div className="relative">
                      <select
                        value={newReminder.priority}
                        onChange={(e) =>
                          setNewReminder((prev) => ({
                            ...prev,
                            priority: e.target.value as Reminder["priority"],
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                      >
                        <option value="low">Низкий</option>
                        <option value="medium">Средний</option>
                        <option value="high">Высокий</option>
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg
                          className="h-4 w-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="w-full sm:w-auto"
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    className="flex items-center space-x-2 w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4" />
                    <span>Сохранить</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по напоминаниям..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <Button
              variant="outline"
              className="flex items-center space-x-2 w-full sm:w-auto"
            >
              <Filter className="h-4 w-4" />
              <span>Фильтры</span>
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-red-50 p-3">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Срочные</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {
                      reminders.filter(
                        (r) =>
                          r.priority === ReminderPriority.HIGH &&
                          r.status === ReminderStatus.PENDING
                      ).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-blue-50 p-3">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Активные</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {pendingReminders.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-green-50 p-3">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Выполнено</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {completedReminders.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Загрузка напоминаний...</p>
          </div>
        )}

        {/* Active Reminders */}
        {!loading && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              Активные напоминания
            </h2>
            {pendingReminders.length === 0 ? (
              <Card>
                <CardContent className="p-6 sm:p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Нет активных напоминаний
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Создайте первое напоминание, чтобы начать
                  </p>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить напоминание
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {pendingReminders.map((reminder) => (
                  <Card
                    key={reminder.id}
                    className={`${getTypeColor(reminder.category)}`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-start sm:items-center space-x-3">
                          {getStatusIcon(reminder.status as Reminder["status"])}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                              {reminder.title}
                            </h3>
                            {reminder.description && (
                              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                {reminder.description}
                              </p>
                            )}
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                              {new Date(reminder.dueDate).toLocaleDateString(
                                "ru-RU"
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                              reminder.priority as Reminder["priority"]
                            )}`}
                          >
                            {reminder.priority === ReminderPriority.HIGH
                              ? "Срочно"
                              : reminder.priority === ReminderPriority.MEDIUM
                              ? "Важно"
                              : "Обычно"}
                          </span>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkCompleted(reminder.id)}
                              className="text-xs sm:text-sm"
                            >
                              Выполнить
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteReminder(reminder.id)}
                            >
                              <X className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Completed Reminders */}
        {!loading && completedReminders.length > 0 && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              Выполненные задачи
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {completedReminders.map((reminder) => (
                <Card key={reminder.id} className="opacity-75">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                      <div className="flex items-start sm:items-center space-x-3">
                        {getStatusIcon(reminder.status as Reminder["status"])}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 line-through text-sm sm:text-base">
                            {reminder.title}
                          </h3>
                          {reminder.description && (
                            <p className="text-xs sm:text-sm text-gray-500 mt-1 line-through">
                              {reminder.description}
                            </p>
                          )}
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            {new Date(reminder.dueDate).toLocaleDateString(
                              "ru-RU"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Выполнено
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteReminder(reminder.id)}
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Calendar Preview */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Календарь
          </h2>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Calendar className="h-5 w-5 text-gray-600" />
                <span className="text-gray-600">
                  Предварительный просмотр календаря
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Здесь будет отображаться календарь с важными датами и
                напоминаниями. Интеграция с календарём в разработке.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
