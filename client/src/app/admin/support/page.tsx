"use client";

import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  Calendar,
  Eye,
  Reply,
  Search,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category:
    | "GENERAL"
    | "TECHNICAL"
    | "BILLING"
    | "FEATURE_REQUEST"
    | "BUG_REPORT"
    | "ACCOUNT";
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  responses: Array<{
    id: string;
    content: string;
    isAdmin: boolean;
    createdAt: string;
    admin?: {
      id: string;
      name: string;
    };
  }>;
}

export default function AdminSupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Загрузка обращений
  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/support/admin/tickets", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.data);
      }
    } catch (error) {
      console.error("Ошибка при загрузке обращений:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Фильтрация обращений
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Получение цвета для статуса
  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-red-100 text-red-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Получение цвета для приоритета
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Обновление статуса обращения
  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(
        `/api/support/admin/tickets/${ticketId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        loadTickets(); // Перезагружаем список
      }
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error);
    }
  };

  // Ответ на обращение
  const respondToTicket = async (ticketId: string, content: string) => {
    try {
      const response = await fetch(
        `/api/support/admin/tickets/${ticketId}/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      if (response.ok) {
        loadTickets(); // Перезагружаем список
        setSelectedTicket(null); // Закрываем модальное окно
      }
    } catch (error) {
      console.error("Ошибка при отправке ответа:", error);
    }
  };

  if (user?.role !== "ADMIN") {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Доступ запрещен</h2>
            <p className="text-gray-600">
              У вас нет прав для доступа к этой странице.
            </p>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Заголовок */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Управление обращениями в поддержку
            </h1>
            <p className="text-gray-600">
              Просмотр и управление обращениями пользователей
            </p>
          </div>

          {/* Фильтры и поиск */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Поиск по теме, имени или email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Все статусы</option>
                  <option value="OPEN">Открытые</option>
                  <option value="IN_PROGRESS">В работе</option>
                  <option value="RESOLVED">Решено</option>
                  <option value="CLOSED">Закрыто</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Все приоритеты</option>
                  <option value="URGENT">Срочно</option>
                  <option value="HIGH">Высокий</option>
                  <option value="MEDIUM">Средний</option>
                  <option value="LOW">Низкий</option>
                </select>

                <Button
                  onClick={loadTickets}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Обновить
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Открытые
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tickets.filter((t) => t.status === "OPEN").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      В работе
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tickets.filter((t) => t.status === "IN_PROGRESS").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Решено</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tickets.filter((t) => t.status === "RESOLVED").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Всего</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tickets.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Список обращений */}
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Загрузка обращений...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {ticket.subject}
                          </h3>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status === "OPEN" && "Открыто"}
                            {ticket.status === "IN_PROGRESS" && "В работе"}
                            {ticket.status === "RESOLVED" && "Решено"}
                            {ticket.status === "CLOSED" && "Закрыто"}
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority === "URGENT" && "Срочно"}
                            {ticket.priority === "HIGH" && "Высокий"}
                            {ticket.priority === "MEDIUM" && "Средний"}
                            {ticket.priority === "LOW" && "Низкий"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {ticket.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {ticket.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <p className="text-gray-700 mb-3 line-clamp-2">
                          {ticket.message}
                        </p>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => setSelectedTicket(ticket)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            Просмотр
                          </Button>

                          {ticket.status === "OPEN" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateTicketStatus(ticket.id, "IN_PROGRESS")
                              }
                            >
                              Взять в работу
                            </Button>
                          )}

                          {ticket.status === "IN_PROGRESS" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateTicketStatus(ticket.id, "RESOLVED")
                              }
                            >
                              Решено
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredTickets.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Обращения не найдены
                    </h3>
                    <p className="text-gray-600">
                      Попробуйте изменить фильтры или поисковый запрос
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Модальное окно для просмотра обращения */}
          {selectedTicket && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{selectedTicket.subject}</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTicket(null)}
                    >
                      ✕
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Информация об обращении */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Отправитель
                      </p>
                      <p className="text-gray-900">{selectedTicket.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Email</p>
                      <p className="text-gray-900">{selectedTicket.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Дата создания
                      </p>
                      <p className="text-gray-900">
                        {new Date(selectedTicket.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Статус
                      </p>
                      <Badge className={getStatusColor(selectedTicket.status)}>
                        {selectedTicket.status === "OPEN" && "Открыто"}
                        {selectedTicket.status === "IN_PROGRESS" && "В работе"}
                        {selectedTicket.status === "RESOLVED" && "Решено"}
                        {selectedTicket.status === "CLOSED" && "Закрыто"}
                      </Badge>
                    </div>
                  </div>

                  {/* Сообщение */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Сообщение
                    </h4>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedTicket.message}
                      </p>
                    </div>
                  </div>

                  {/* Ответы */}
                  {selectedTicket.responses.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Ответы</h4>
                      <div className="space-y-3">
                        {selectedTicket.responses.map((response) => (
                          <div
                            key={response.id}
                            className={`p-3 rounded-lg ${
                              response.isAdmin
                                ? "bg-blue-50 border-l-4 border-blue-400"
                                : "bg-gray-50 border-l-4 border-gray-400"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">
                                {response.isAdmin
                                  ? response.admin?.name || "Администратор"
                                  : selectedTicket.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(response.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-700">{response.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Форма ответа */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Ответить</h4>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const content = formData.get("response") as string;
                        if (content.trim()) {
                          respondToTicket(selectedTicket.id, content);
                        }
                      }}
                      className="space-y-3"
                    >
                      <textarea
                        name="response"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Введите ваш ответ..."
                        required
                      />
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          className="flex items-center gap-1"
                        >
                          <Reply className="h-4 w-4" />
                          Отправить ответ
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSelectedTicket(null)}
                        >
                          Отмена
                        </Button>
                      </div>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
