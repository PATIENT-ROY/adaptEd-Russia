"use client";

import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Eye,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Calendar,
  Plus,
  Download,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { Language, Role } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

// Моковые данные пользователей
const mockUsers = [
  {
    id: "1",
    name: "Ахмед Аль-Махмуд",
    email: "ahmed@example.com",
    country: "Египет",
    language: "ar",
    role: "student",
    status: "active",
    registeredAt: "2024-01-15",
    lastLogin: "2024-01-20",
    guidesRead: 12,
    aiQuestions: 23,
  },
  {
    id: "2",
    name: "Мария Гонсалес",
    email: "maria@example.com",
    country: "Испания",
    language: "es",
    role: "student",
    status: "active",
    registeredAt: "2024-01-14",
    lastLogin: "2024-01-19",
    guidesRead: 8,
    aiQuestions: 15,
  },
  {
    id: "3",
    name: "Чжан Вэй",
    email: "zhang@example.com",
    country: "Китай",
    language: "ZH",
    role: "student",
    status: "pending",
    registeredAt: "2024-01-13",
    lastLogin: "2024-01-18",
    guidesRead: 5,
    aiQuestions: 7,
  },
  {
    id: "4",
    name: "Анна Петрова",
    email: "anna@example.com",
    country: "Россия",
    language: "ru",
    role: "admin",
    status: "active",
    registeredAt: "2024-01-10",
    lastLogin: "2024-01-20",
    guidesRead: 45,
    aiQuestions: 12,
  },
  {
    id: "5",
    name: "Джон Смит",
    email: "john@example.com",
    country: "США",
    language: "en",
    role: "student",
    status: "blocked",
    registeredAt: "2024-01-12",
    lastLogin: "2024-01-17",
    guidesRead: 3,
    aiQuestions: 2,
  },
];

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  blocked: "bg-red-100 text-red-700",
};

const roleColors: Record<string, string> = {
  student: "bg-blue-100 text-blue-700",
  admin: "bg-purple-100 text-purple-700",
  guest: "bg-gray-100 text-gray-700",
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    country: "",
    language: Language.RU,
    role: "student",
    status: "active",
  });
  const [formError, setFormError] = useState<string>("");
  const { t } = useTranslation();

  useEffect(() => {
    if (user?.role === Role.ADMIN) {
      setIsAdmin(true);
    }
  }, [user]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.country.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;
      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  if (!user) {
    return (
      <ProtectedRoute>
        <div>Loading...</div>
      </ProtectedRoute>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-96 border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {t("admin.accessDenied.title")}
              </h2>
              <p className="text-slate-600 mb-6">
                {t("admin.accessDenied.description")}
              </p>
              <Link href="/dashboard">
                <Button>{t("admin.accessDenied.action")}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // const handleStatusChange = (userId: string, newStatus: string) => {
  //   setUsers(
  //     users.map((user) =>
  //       user.id === userId
  //         ? { ...user, status: newStatus as "active" | "pending" | "blocked" }
  //         : user
  //     )
  //   );
  // };

  // const handleRoleChange = (userId: string, newRole: string) => {
  //   setUsers(
  //     users.map((user) =>
  //       user.id === userId
  //         ? { ...user, role: newRole as "student" | "admin" | "guest" }
  //         : user
  //     )
  //   );
  // };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter((user) => user.id !== userId));
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id));
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const resetNewUserForm = () => {
    setNewUser({
      name: "",
      email: "",
      country: "",
      language: Language.RU,
      role: "student",
      status: "active",
    });
    setFormError("");
  };

  const handleAddUserSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.country) {
      setFormError(t("admin.users.formError"));
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newUser.email.trim())) {
      setFormError(t("admin.users.formEmailError"));
      return;
    }

    const createdUser = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      country: newUser.country,
      language: newUser.language,
      role: newUser.role,
      status: newUser.status,
      registeredAt: new Date().toISOString().split("T")[0],
      lastLogin: new Date().toISOString().split("T")[0],
      guidesRead: 0,
      aiQuestions: 0,
    } as typeof mockUsers[number];

    setUsers([createdUser, ...users]);
    setIsAddUserOpen(false);
    resetNewUserForm();
  };

  const closeAddUserModal = () => {
    setIsAddUserOpen(false);
    resetNewUserForm();
  };

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="rounded-lg bg-blue-50 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Управление пользователями
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Просмотр и управление всеми пользователями платформы
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Экспорт</span>
              </Button>
              <Button
                className="flex items-center space-x-2"
                onClick={() => setIsAddUserOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span>Добавить пользователя</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Поиск по имени, email или стране..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 pr-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все статусы</option>
                <option value="active">Активные</option>
                <option value="pending">Ожидающие</option>
                <option value="blocked">Заблокированные</option>
              </select>
                <ChevronDown className="h-4 w-4 text-gray-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <div className="relative w-full sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 pr-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все роли</option>
                <option value="student">Студенты</option>
                <option value="admin">Администраторы</option>
                <option value="guest">Гости</option>
              </select>
                <ChevronDown className="h-4 w-4 text-gray-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Пользователи ({filteredUsers.length})</span>
              {selectedUsers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Выбрано: {selectedUsers.length}
                  </span>
                  <Button variant="outline" size="sm">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Активировать
                  </Button>
                  <Button variant="outline" size="sm">
                    <UserX className="h-4 w-4 mr-2" />
                    Заблокировать
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">
                      <input
                        type="checkbox"
                        checked={
                          selectedUsers.length === filteredUsers.length &&
                          filteredUsers.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Пользователь
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Роль
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Статус
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Активность
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {user.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.country}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            roleColors[user.role]
                          }`}
                        >
                          {user.role === "student"
                            ? "Студент"
                            : user.role === "admin"
                            ? "Администратор"
                            : "Гость"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            statusColors[user.status]
                          }`}
                        >
                          {user.status === "active"
                            ? "Активен"
                            : user.status === "pending"
                            ? "Ожидает"
                            : "Заблокирован"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p className="text-gray-900">
                            {user.guidesRead} гайдов
                          </p>
                          <p className="text-gray-600">
                            {user.aiQuestions} AI вопросов
                          </p>
                          <p className="text-gray-500 text-xs">
                            Последний вход: {user.lastLogin}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            title="Просмотр"
                            aria-label="Просмотр пользователя"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Редактировать"
                            aria-label="Редактировать пользователя"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Удалить"
                            aria-label="Удалить пользователя"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Активные</p>
                  <p className="text-xl font-bold text-gray-900">
                    {users.filter((u) => u.status === "active").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Ожидающие</p>
                  <p className="text-xl font-bold text-gray-900">
                    {users.filter((u) => u.status === "pending").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <UserX className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Заблокированные
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {users.filter((u) => u.status === "blocked").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Администраторы
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {users.filter((u) => u.role === "admin").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Новый пользователь</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleAddUserSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Имя
                  </label>
                  <Input
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Имя и фамилия"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Страна
                  </label>
                  <Input
                    value={newUser.country}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        country: e.target.value,
                      }))
                    }
                    placeholder="Страна проживания"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Роль
                    </label>
                    <div className="relative">
                      <select
                        value={newUser.role}
                        onChange={(e) =>
                          setNewUser((prev) => ({
                            ...prev,
                            role: e.target.value,
                          }))
                        }
                        className="w-full appearance-none px-3 py-2 pr-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="student">Студент</option>
                        <option value="admin">Администратор</option>
                        <option value="guest">Гость</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-gray-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Статус
                    </label>
                    <div className="relative">
                      <select
                        value={newUser.status}
                        onChange={(e) =>
                          setNewUser((prev) => ({
                            ...prev,
                            status: e.target.value,
                          }))
                        }
                        className="w-full appearance-none px-3 py-2 pr-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="active">Активен</option>
                        <option value="pending">Ожидает</option>
                        <option value="blocked">Заблокирован</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-gray-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
                {formError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {formError}
                  </p>
                )}
                <div className="flex items-center justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={closeAddUserModal}>
                    Отмена
                  </Button>
                  <Button type="submit" className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Создать</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  );
}
