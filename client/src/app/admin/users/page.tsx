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
import { useState, useMemo } from "react";
import { Language, Role } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

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
  return (
    <ProtectedRoute>
      <AdminUsersContent />
    </ProtectedRoute>
  );
}

function AdminUsersContent() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === Role.ADMIN;

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
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
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
                  {t("admin.users.header.title")}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  {t("admin.users.header.subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>{t("admin.users.export")}</span>
              </Button>
              <Button
                className="flex items-center space-x-2"
                onClick={() => setIsAddUserOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span>{t("admin.users.addUser")}</span>
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
                  placeholder={t("admin.users.search.placeholder")}
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
                <option value="all">{t("admin.users.filters.status.all")}</option>
                <option value="active">{t("admin.users.filters.status.active")}</option>
                <option value="pending">{t("admin.users.filters.status.pending")}</option>
                <option value="blocked">{t("admin.users.filters.status.blocked")}</option>
              </select>
                <ChevronDown className="h-4 w-4 text-gray-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <div className="relative w-full sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 pr-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t("admin.users.filters.role.all")}</option>
                <option value="student">{t("admin.users.filters.role.student")}</option>
                <option value="admin">{t("admin.users.filters.role.admin")}</option>
                <option value="guest">{t("admin.users.filters.role.guest")}</option>
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
              <span>{t("admin.users.table.title")} ({filteredUsers.length})</span>
              {selectedUsers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {t("admin.users.table.selected")} {selectedUsers.length}
                  </span>
                  <Button variant="outline" size="sm">
                    <UserCheck className="h-4 w-4 mr-2" />
                    {t("admin.users.table.activate")}
                  </Button>
                  <Button variant="outline" size="sm">
                    <UserX className="h-4 w-4 mr-2" />
                    {t("admin.users.table.block")}
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
                      {t("admin.users.table.user")}
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      {t("admin.users.table.role")}
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      {t("admin.users.table.status")}
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      {t("admin.users.table.activity")}
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      {t("admin.users.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(u.id)}
                          onChange={() => handleSelectUser(u.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {u.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {u.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              {u.country}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            roleColors[u.role]
                          }`}
                        >
                          {u.role === "student"
                            ? t("admin.users.roles.student")
                            : u.role === "admin"
                            ? t("admin.users.roles.admin")
                            : t("admin.users.roles.guest")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            statusColors[u.status]
                          }`}
                        >
                          {u.status === "active"
                            ? t("admin.users.statuses.active")
                            : u.status === "pending"
                            ? t("admin.users.statuses.pending")
                            : t("admin.users.statuses.blocked")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p className="text-gray-900">
                            {u.guidesRead} {t("admin.users.activity.guides")}
                          </p>
                          <p className="text-gray-600">
                            {u.aiQuestions} {t("admin.users.activity.aiQuestions")}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {t("admin.users.activity.lastLogin")}: {u.lastLogin}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={t("admin.common.view")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={t("admin.common.edit")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-600 hover:text-red-700"
                            aria-label={t("admin.common.delete")}
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
                  <p className="text-sm font-medium text-gray-600">{t("admin.users.stats.active")}</p>
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
                  <p className="text-sm font-medium text-gray-600">{t("admin.users.stats.pending")}</p>
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
                    {t("admin.users.stats.blocked")}
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
                    {t("admin.users.stats.admins")}
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
                <span>{t("admin.users.modal.title")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleAddUserSubmit}>
                <div className="space-y-2">
                  <label htmlFor="new-user-name" className="text-sm font-medium text-gray-700">
                    {t("admin.users.modal.name")}
                  </label>
                  <Input
                    id="new-user-name"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder={t("admin.users.modal.namePlaceholder")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-user-email" className="text-sm font-medium text-gray-700">
                    {t("admin.users.modal.email")}
                  </label>
                  <Input
                    id="new-user-email"
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
                  <label htmlFor="new-user-country" className="text-sm font-medium text-gray-700">
                    {t("admin.users.modal.country")}
                  </label>
                  <Input
                    id="new-user-country"
                    value={newUser.country}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        country: e.target.value,
                      }))
                    }
                    placeholder={t("admin.users.modal.countryPlaceholder")}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="new-user-role" className="text-sm font-medium text-gray-700">
                      {t("admin.users.modal.role")}
                    </label>
                    <div className="relative">
                      <select
                        id="new-user-role"
                        value={newUser.role}
                        onChange={(e) =>
                          setNewUser((prev) => ({
                            ...prev,
                            role: e.target.value,
                          }))
                        }
                        className="w-full appearance-none px-3 py-2 pr-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="student">{t("admin.users.roles.student")}</option>
                        <option value="admin">{t("admin.users.roles.admin")}</option>
                        <option value="guest">{t("admin.users.roles.guest")}</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-gray-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="new-user-status" className="text-sm font-medium text-gray-700">
                      {t("admin.users.modal.status")}
                    </label>
                    <div className="relative">
                      <select
                        id="new-user-status"
                        value={newUser.status}
                        onChange={(e) =>
                          setNewUser((prev) => ({
                            ...prev,
                            status: e.target.value,
                          }))
                        }
                        className="w-full appearance-none px-3 py-2 pr-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="active">{t("admin.users.statuses.active")}</option>
                        <option value="pending">{t("admin.users.statuses.pending")}</option>
                        <option value="blocked">{t("admin.users.statuses.blocked")}</option>
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
                    {t("admin.common.cancel")}
                  </Button>
                  <Button type="submit" className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>{t("admin.common.create")}</span>
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
