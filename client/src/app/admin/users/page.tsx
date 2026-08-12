"use client";

import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Shield,
  Plus,
  ChevronDown,
  ArrowLeft,
  Copy,
  CheckCircle2,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo, useEffect } from "react";
import { Language, Role } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { API_BASE_URL } from "@/lib/api";
import { countrySuggestions } from "@/constants/countries";
import { fetchAdminUsers, type AdminUserRow } from "@/lib/admin-api";

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

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
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
  const [inviteLink, setInviteLink] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string>("");

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.country.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      setUsersLoading(true);
      try {
        const data = await fetchAdminUsers();
        if (!cancelled) setUsers(data);
      } catch (error) {
        console.error("Failed to load admin users:", error);
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

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
    setInviteLink("");
    setInviteStatus("");
    setCopiedInvite(false);
  };

  const handleAddUserSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    setInviteLink("");
    setInviteStatus("");

    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.country) {
      setFormError(t("admin.users.formError"));
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newUser.email.trim())) {
      setFormError(t("admin.users.formEmailError"));
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setFormError("Не найден токен администратора. Выполните вход заново.");
      return;
    }

    setIsSubmitting(true);
    try {
      const roleMap: Record<string, "STUDENT" | "ADMIN" | "GUEST"> = {
        student: "STUDENT",
        admin: "ADMIN",
        guest: "GUEST",
      };

      const response = await fetch(`${API_BASE_URL}/auth/admin/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newUser.name.trim(),
          email: newUser.email.trim().toLowerCase(),
          country: newUser.country.trim(),
          language: newUser.language,
          role: roleMap[newUser.role] || "STUDENT",
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        setFormError(payload?.error || "Не удалось создать приглашение");
        return;
      }

      const createdUser: AdminUserRow = {
        id: payload.data.user.id,
        name: payload.data.user.name,
        email: payload.data.user.email,
        country: payload.data.user.country,
        language: String(payload.data.user.language || "RU").toLowerCase(),
        role: String(payload.data.user.role || "STUDENT").toLowerCase(),
        status: "pending",
        registeredAt: new Date().toISOString().split("T")[0],
        lastLogin: "—",
        guidesRead: 0,
        aiQuestions: 0,
      };

      setUsers((prev) => [createdUser, ...prev]);
      setInviteLink(payload.data.setupLink || "");
      setInviteStatus(
        payload.data.emailSent
          ? "Письмо с приглашением отправлено автоматически."
          : "Письмо не отправлено автоматически. Скопируйте ссылку и отправьте вручную."
      );
    } catch {
      setFormError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeAddUserModal = () => {
    setIsAddUserOpen(false);
    resetNewUserForm();
  };

  const handleCopyInvite = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 1500);
    } catch {
      setFormError("Не удалось скопировать ссылку");
    }
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
            <CardTitle>
              {t("admin.users.table.title")} ({usersLoading ? "…" : filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
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
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{t("admin.users.stats.total")}</p>
                  <p className="text-xl font-bold text-gray-900">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{t("admin.users.stats.withGuides")}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {users.filter((u) => u.guidesRead > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{t("admin.users.stats.withAi")}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {users.filter((u) => u.aiQuestions > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
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
                    list="country-suggestions"
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        country: e.target.value,
                      }))
                    }
                    placeholder={t("admin.users.modal.countryPlaceholder")}
                    required
                  />
                  <datalist id="country-suggestions">
                    {countrySuggestions.map((country) => (
                      <option key={country} value={country} />
                    ))}
                  </datalist>
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
                {inviteLink && (
                  <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-sm font-medium text-emerald-700">{inviteStatus || "Приглашение создано."}</p>
                    <div className="rounded bg-white px-2 py-1 text-xs text-slate-700 break-all border">
                      {inviteLink}
                    </div>
                    <Button type="button" variant="outline" onClick={handleCopyInvite}>
                      {copiedInvite ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                          Скопировано
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Скопировать ссылку
                        </>
                      )}
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={closeAddUserModal}>
                    {t("admin.common.cancel")}
                  </Button>
                  <Button type="submit" className="flex items-center space-x-2" disabled={isSubmitting}>
                    <Plus className="h-4 w-4" />
                    <span>{isSubmitting ? "Создание..." : t("admin.common.create")}</span>
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
