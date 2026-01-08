"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  ChevronLeft,
  ChevronRight,
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

const getCategoryLabel = (category: ReminderCategory): string => {
  switch (category) {
    case ReminderCategory.EDUCATION:
      return "Учёба";
    case ReminderCategory.LIFE:
      return "Быт";
    case ReminderCategory.DOCUMENTS:
      return "Документы";
    case ReminderCategory.HEALTH:
      return "Здоровье";
    case ReminderCategory.OTHER:
      return "Другое";
    default:
      return "Другое";
  }
};

const getCategoryBadgeColor = (category: ReminderCategory): string => {
  switch (category) {
    case ReminderCategory.EDUCATION:
      return "bg-blue-100 text-blue-700";
    case ReminderCategory.LIFE:
      return "bg-green-100 text-green-700";
    case ReminderCategory.DOCUMENTS:
      return "bg-red-100 text-red-700";
    case ReminderCategory.HEALTH:
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

// Компонент календаря
const CalendarView = ({ reminders }: { reminders: Reminder[] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Получаем первый день месяца и количество дней
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Получаем напоминания для каждой даты
  const remindersByDate = useMemo(() => {
    const map = new Map<string, Reminder[]>();
    reminders.forEach((reminder) => {
      if (!reminder.dueDate) return;
      try {
        const date = new Date(reminder.dueDate);
        if (isNaN(date.getTime())) return;
        const dateKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(reminder);
      } catch (error) {
        console.error(
          `Error processing date for reminder ${reminder.id}:`,
          error
        );
      }
    });
    return map;
  }, [reminders]);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];
  const weekDays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

  const getRemindersForDate = (day: number): Reminder[] => {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    return remindersByDate.get(dateKey) || [];
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  const selectedDateReminders = selectedDate
    ? getRemindersForDate(selectedDate.getDate())
    : [];

  return (
    <div>
      {/* Заголовок календаря с навигацией */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth("prev")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[month]} {year}
        </h3>
        <button
          onClick={() => navigateMonth("next")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Дни недели */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Календарная сетка */}
      <div className="grid grid-cols-7 gap-1">
        {/* Пустые ячейки в начале месяца */}
        {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
          <div key={`empty-${idx}`} className="aspect-square" />
        ))}

        {/* Дни месяца */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const dayReminders = getRemindersForDate(day);
          const hasReminders = dayReminders.length > 0;
          const today = isToday(day);
          const selected = isSelected(day);

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(new Date(year, month, day))}
              className={`aspect-square p-1 rounded-lg transition-all ${
                selected
                  ? "bg-purple-600 text-white"
                  : today && hasReminders
                  ? "border-2 border-purple-400 bg-purple-50 text-purple-900 font-semibold"
                  : today && !hasReminders
                  ? "border border-gray-300 bg-gray-50 text-gray-700"
                  : hasReminders
                  ? "bg-blue-50 hover:bg-blue-100 text-gray-900"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <div className="text-xs font-medium">{day}</div>
              {hasReminders ? (
                <div className="flex justify-center gap-0.5 mt-0.5">
                  {dayReminders.slice(0, 3).map((reminder, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        selected
                          ? "bg-white"
                          : reminder.priority === ReminderPriority.HIGH
                          ? "bg-red-500"
                          : reminder.priority === ReminderPriority.MEDIUM
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                    />
                  ))}
                  {dayReminders.length > 3 && (
                    <div className="text-[6px] font-bold">+</div>
                  )}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Напоминания выбранной даты */}
      {selectedDate && selectedDateReminders.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Напоминания на{" "}
            {selectedDate.toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h4>
          <div className="space-y-2">
            {selectedDateReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="p-2 bg-gray-50 rounded-lg text-sm"
              >
                <div className="font-medium text-gray-900">
                  {reminder.title}
                </div>
                {reminder.description && (
                  <div className="text-xs text-gray-500 mt-1">
                    {reminder.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDate && selectedDateReminders.length === 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500 text-center">
          На{" "}
          {selectedDate.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          нет напоминаний
        </div>
      )}
    </div>
  );
};

export default function RemindersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { reminders, loading, createReminder, updateReminder, deleteReminder } =
    useReminders(user?.id || "");

  // Автоматическое перенаправление на /login если не авторизован
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    date: "",
    category: ReminderCategory.OTHER,
    priority: ReminderPriority.MEDIUM,
    notificationMethod: "email" as "email" | "telegram" | "vk",
  });

  const filteredReminders = useMemo(() => {
    return reminders.filter((r) => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          r.title.toLowerCase().includes(searchLower) ||
          r.description?.toLowerCase().includes(searchLower) ||
          false
        );
      }
      return true;
    });
  }, [reminders, searchTerm]);

  // Фильтруем активные напоминания
  const pendingReminders = filteredReminders.filter((r) => {
    if (!r.status) return false;
    const status = String(r.status).toUpperCase();
    return status === "PENDING" || status === ReminderStatus.PENDING;
  });

  const completedReminders = filteredReminders.filter((r) => {
    const status = String(r.status || "").toUpperCase();
    return status === "COMPLETED" || status === ReminderStatus.COMPLETED;
  });

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("handleAddReminder called");
    console.log("Form state:", {
      title: newReminder.title,
      date: newReminder.date,
      category: newReminder.category,
      priority: newReminder.priority,
      user: user?.id,
    });

    if (!newReminder.title || !newReminder.date || !user?.id) {
      console.warn("Validation failed:", {
        hasTitle: !!newReminder.title,
        hasDate: !!newReminder.date,
        hasUser: !!user?.id,
      });
      alert("Пожалуйста, заполните все обязательные поля (название и дата)");
      return;
    }

    try {
      // Формируем дату правильно - добавляем время, чтобы получить корректную ISO строку
      const dateInput = newReminder.date; // Формат: YYYY-MM-DD
      const dateWithTime = dateInput
        ? `${dateInput}T00:00:00.000Z`
        : new Date().toISOString();

      console.log("Creating reminder with:", {
        title: newReminder.title,
        dateInput,
        dateWithTime,
        category: newReminder.category,
        priority: newReminder.priority,
        notificationMethod: newReminder.notificationMethod,
      });

      // Проверяем, что категория и дата заполнены
      if (!newReminder.category) {
        alert("Пожалуйста, выберите категорию");
        return;
      }

      if (!dateInput) {
        alert("Пожалуйста, укажите дату");
        return;
      }

      // НЕ отправляем userId - сервер берёт его из токена
      const reminderData: Omit<
        Reminder,
        "id" | "createdAt" | "updatedAt" | "userId"
      > = {
        title: newReminder.title,
        description: newReminder.description || undefined,
        dueDate: dateWithTime,
        category: newReminder.category,
        priority: newReminder.priority,
        status: ReminderStatus.PENDING,
        notificationMethod: newReminder.notificationMethod || "email",
      };

      console.log(
        "Reminder data being sent:",
        JSON.stringify(reminderData, null, 2)
      );
      console.log("Category value:", newReminder.category);
      console.log("Category type:", typeof newReminder.category);
      console.log("Date value:", dateInput);
      console.log("Date with time:", dateWithTime);
      console.log("Date with time type:", typeof dateWithTime);
      console.log("Full reminder state:", JSON.stringify(newReminder, null, 2));

      // Проверяем, что категория - это строка enum
      if (
        !Object.values(ReminderCategory).includes(
          newReminder.category as ReminderCategory
        )
      ) {
        console.error("Invalid category:", newReminder.category);
        alert("Ошибка: неверная категория");
        return;
      }

      // Проверяем, что дата валидна
      if (!dateWithTime || dateWithTime === "") {
        console.error("Invalid date:", dateWithTime);
        alert("Ошибка: неверная дата");
        return;
      }

      try {
        const createdReminder = await createReminder(reminderData);

        console.log(
          "Created reminder response:",
          JSON.stringify(createdReminder, null, 2)
        );
        console.log("Response category:", createdReminder?.category);
        console.log("Response dueDate:", createdReminder?.dueDate);
      } catch (error) {
        console.error("Error creating reminder:", error);
        alert(
          "Ошибка при создании напоминания. Проверьте консоль для деталей."
        );
        return;
      }

      setNewReminder({
        title: "",
        description: "",
        date: "",
        category: ReminderCategory.OTHER,
        priority: ReminderPriority.MEDIUM,
        notificationMethod: "email",
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

  // Показываем скелетон загрузки, если идет загрузка авторизации или напоминаний
  if (authLoading || loading) {
    return (
      <Layout>
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                <div>
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Search and Filters Skeleton */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Statistics Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reminders Skeleton */}
          <div>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-3 sm:space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl sm:rounded-3xl p-4 shadow-sm border-l-4 border-l-blue-500"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex-1 min-w-0">
                      <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-3">
                    <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Skeleton */}
          <div>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-8 bg-gray-200 rounded animate-pulse"
                    ></div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gray-200 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Показываем загрузку пока проверяем авторизацию или перенаправляем
  if (authLoading || !user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Проверка авторизации...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
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
                        <option value={ReminderCategory.EDUCATION}>
                          Учёба
                        </option>
                        <option value={ReminderCategory.LIFE}>Быт</option>
                        <option value={ReminderCategory.DOCUMENTS}>
                          Документы
                        </option>
                        <option value={ReminderCategory.HEALTH}>
                          Здоровье
                        </option>
                        <option value={ReminderCategory.OTHER}>Другое</option>
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
                        <option value={ReminderPriority.LOW}>Низкий</option>
                        <option value={ReminderPriority.MEDIUM}>Средний</option>
                        <option value={ReminderPriority.HIGH}>Высокий</option>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Способ уведомления
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="notificationMethod"
                        value="email"
                        checked={newReminder.notificationMethod === "email"}
                        onChange={(e) =>
                          setNewReminder((prev) => ({
                            ...prev,
                            notificationMethod: e.target.value as
                              | "email"
                              | "telegram"
                              | "vk",
                          }))
                        }
                        className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-700">Email</span>
                      </div>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="notificationMethod"
                        value="telegram"
                        checked={newReminder.notificationMethod === "telegram"}
                        onChange={(e) =>
                          setNewReminder((prev) => ({
                            ...prev,
                            notificationMethod: e.target.value as
                              | "email"
                              | "telegram"
                              | "vk",
                          }))
                        }
                        className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-700">Telegram</span>
                      </div>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="notificationMethod"
                        value="vk"
                        checked={newReminder.notificationMethod === "vk"}
                        onChange={(e) =>
                          setNewReminder((prev) => ({
                            ...prev,
                            notificationMethod: e.target.value as
                              | "email"
                              | "telegram"
                              | "vk",
                          }))
                        }
                        className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            VK
                          </span>
                        </div>
                        <span className="text-sm text-gray-700">ВКонтакте</span>
                      </div>
                    </label>
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
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
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

        {/* Active Reminders */}
        {!authLoading && !loading && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              Активные напоминания
              {pendingReminders.length > 0 && (
                <span className="ml-2 text-purple-600">
                  ({pendingReminders.length})
                </span>
              )}
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
                              {(() => {
                                try {
                                  const dueDateValue = reminder.dueDate;
                                  console.log(
                                    "Formatting date for reminder:",
                                    reminder.id,
                                    "dueDate:",
                                    dueDateValue,
                                    "type:",
                                    typeof dueDateValue
                                  );

                                  if (
                                    !dueDateValue ||
                                    dueDateValue === null ||
                                    dueDateValue === undefined ||
                                    dueDateValue === "null" ||
                                    dueDateValue === ""
                                  ) {
                                    console.log("No dueDate value");
                                    return "Дата не указана";
                                  }

                                  let date: Date;
                                  if (typeof dueDateValue === "string") {
                                    // Проверяем пустую строку
                                    if (
                                      dueDateValue.trim() === "" ||
                                      dueDateValue === "null" ||
                                      dueDateValue === "undefined"
                                    ) {
                                      return "Дата не указана";
                                    }
                                    if (dueDateValue.includes("T")) {
                                      date = new Date(dueDateValue);
                                    } else if (
                                      dueDateValue.match(/^\d{4}-\d{2}-\d{2}$/)
                                    ) {
                                      date = new Date(
                                        `${dueDateValue}T00:00:00Z`
                                      );
                                    } else {
                                      date = new Date(dueDateValue);
                                    }
                                  } else {
                                    // Пробуем создать дату из любого значения
                                    date = new Date(String(dueDateValue));
                                  }

                                  if (isNaN(date.getTime())) {
                                    console.log("Invalid date:", dueDateValue);
                                    return "Дата не указана";
                                  }

                                  const formatted = date.toLocaleDateString(
                                    "ru-RU",
                                    {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    }
                                  );
                                  console.log("Formatted date:", formatted);
                                  return formatted;
                                } catch (error) {
                                  console.error(
                                    "Date formatting error:",
                                    error,
                                    "dueDate:",
                                    reminder.dueDate
                                  );
                                  return "Дата не указана";
                                }
                              })()}
                            </p>
                            <div className="text-xs text-gray-400 mt-1 flex items-center space-x-2">
                              <span>Уведомление:</span>
                              {reminder.notificationMethod === "email" ? (
                                <span className="flex items-center space-x-1">
                                  <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg
                                      className="w-2.5 h-2.5 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </div>
                                  <span>Email</span>
                                </span>
                              ) : reminder.notificationMethod === "telegram" ? (
                                <span className="flex items-center space-x-1">
                                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg
                                      className="w-2.5 h-2.5 text-white"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
                                    </svg>
                                  </div>
                                  <span>Telegram</span>
                                </span>
                              ) : reminder.notificationMethod === "vk" ? (
                                <span className="flex items-center space-x-1">
                                  <div className="w-4 h-4 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-[8px] font-bold leading-none">
                                      VK
                                    </span>
                                  </div>
                                  <span>VK</span>
                                </span>
                              ) : (
                                <span className="flex items-center space-x-1">
                                  <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg
                                      className="w-2.5 h-2.5 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </div>
                                  <span>Email</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                          {(() => {
                            // Отладочная информация
                            console.log("Rendering category for reminder:", {
                              id: reminder.id,
                              title: reminder.title,
                              category: reminder.category,
                              categoryType: typeof reminder.category,
                              fullReminder: reminder,
                            });

                            // Безопасное получение категории
                            const rawCategory = reminder.category;

                            // Если категория отсутствует или пустая, пытаемся найти её в других полях
                            let category = rawCategory;
                            const rawCategoryStr = String(
                              rawCategory || ""
                            ).toUpperCase();
                            if (
                              !category ||
                              rawCategoryStr === "OTHER" ||
                              rawCategoryStr === ""
                            ) {
                              // Проверяем, может быть категория в другом поле
                              console.warn(
                                "⚠️ Category is missing or OTHER, checking reminder object:",
                                reminder
                              );

                              // Если категория отсутствует, используем OTHER как fallback
                              category = ReminderCategory.OTHER;
                            }

                            const catStr = String(category).toUpperCase();
                            console.log("Processing category string:", {
                              rawCategory,
                              category,
                              catStr,
                            });

                            // Маппинг строки к enum
                            let catEnum: ReminderCategory =
                              ReminderCategory.OTHER;
                            if (catStr === "EDUCATION") {
                              catEnum = ReminderCategory.EDUCATION;
                            } else if (catStr === "LIFE") {
                              catEnum = ReminderCategory.LIFE;
                            } else if (catStr === "DOCUMENTS") {
                              catEnum = ReminderCategory.DOCUMENTS;
                            } else if (catStr === "HEALTH") {
                              catEnum = ReminderCategory.HEALTH;
                            } else if (catStr === "OTHER") {
                              catEnum = ReminderCategory.OTHER;
                            } else {
                              console.warn(
                                "⚠️ Unknown category value:",
                                catStr,
                                "using OTHER as fallback"
                              );
                              catEnum = ReminderCategory.OTHER;
                            }

                            const categoryLabel = getCategoryLabel(catEnum);

                            console.log("Category mapping result:", {
                              rawCategory,
                              category,
                              catStr,
                              catEnum,
                              categoryLabel,
                              reminderKeys: Object.keys(reminder),
                            });

                            return (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(
                                  catEnum
                                )}`}
                                title={`Raw category: ${
                                  rawCategory || "undefined"
                                }`}
                              >
                                {categoryLabel}
                              </span>
                            );
                          })()}
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
                          <div className="flex space-x-2 relative">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkCompleted(reminder.id)}
                              className="text-xs sm:text-sm relative group"
                            >
                              <span className="absolute -top-1 -right-1 text-sm opacity-0 group-hover:opacity-100 transition-opacity animate-bounce">✅</span>
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
                            {(() => {
                              try {
                                if (!reminder.dueDate) {
                                  return "Дата не указана";
                                }
                                let date: Date;
                                const dueDateValue = reminder.dueDate;
                                if (typeof dueDateValue === "string") {
                                  if (dueDateValue.includes("T")) {
                                    date = new Date(dueDateValue);
                                  } else if (
                                    dueDateValue.match(/^\d{4}-\d{2}-\d{2}$/)
                                  ) {
                                    date = new Date(
                                      `${dueDateValue}T00:00:00Z`
                                    );
                                  } else {
                                    date = new Date(dueDateValue);
                                  }
                                } else {
                                  date = new Date(String(dueDateValue));
                                }
                                if (isNaN(date.getTime())) {
                                  return "Дата не указана";
                                }
                                return date.toLocaleDateString("ru-RU", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                });
                              } catch {
                                return "Дата не указана";
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {(() => {
                          // Отладочная информация
                          console.log(
                            "Rendering category for completed reminder:",
                            {
                              id: reminder.id,
                              title: reminder.title,
                              category: reminder.category,
                              categoryType: typeof reminder.category,
                            }
                          );

                          // Безопасное получение категории
                          const rawCategory = reminder.category;
                          const category =
                            rawCategory || ReminderCategory.OTHER;
                          const catStr = String(category).toUpperCase();

                          // Маппинг строки к enum
                          let catEnum: ReminderCategory =
                            ReminderCategory.OTHER;
                          if (catStr === "EDUCATION")
                            catEnum = ReminderCategory.EDUCATION;
                          else if (catStr === "LIFE")
                            catEnum = ReminderCategory.LIFE;
                          else if (catStr === "DOCUMENTS")
                            catEnum = ReminderCategory.DOCUMENTS;
                          else if (catStr === "HEALTH")
                            catEnum = ReminderCategory.HEALTH;
                          else if (catStr === "OTHER")
                            catEnum = ReminderCategory.OTHER;

                          const categoryLabel = getCategoryLabel(catEnum);

                          console.log("Category mapping result (completed):", {
                            rawCategory,
                            catStr,
                            catEnum,
                            categoryLabel,
                          });

                          return (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(
                                catEnum
                              )}`}
                            >
                              {categoryLabel}
                            </span>
                          );
                        })()}
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
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            Календарь
          </h2>
          <Card>
            <CardContent className="p-4 sm:p-6">
              {pendingReminders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Нет активных напоминаний
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Создайте напоминание, чтобы увидеть его в календаре
                  </p>
                </div>
              ) : (
                <CalendarView reminders={pendingReminders} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
