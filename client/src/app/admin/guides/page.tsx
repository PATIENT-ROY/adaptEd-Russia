"use client";

import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import {
  BookOpen,
  Search,
  Eye,
  Edit,
  Trash2,
  Shield,
  Plus,
  Download,
  FileText,
  Tag,
  Globe,
  CheckCircle,
  Clock,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Role } from "@/types";

const mockGuides = [
  {
    id: "1",
    title: "Как сдать сессию в российском вузе",
    category: "education",
    content:
      "Подробное руководство по подготовке и сдаче экзаменов в российских университетах...",
    language: "ru",
    tags: ["сессия", "экзамены", "подготовка"],
    status: "published",
    views: 234,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20",
    author: "Анна Петрова",
  },
  {
    id: "2",
    title: "Регистрация в миграционной службе",
    category: "life",
    content: "Пошаговая инструкция по регистрации иностранных студентов...",
    language: "ru",
    tags: ["регистрация", "миграция", "документы"],
    status: "published",
    views: 189,
    createdAt: "2024-01-10",
    updatedAt: "2024-01-18",
    author: "Анна Петрова",
  },
  {
    id: "3",
    title: "Получение ИНН и СНИЛС",
    category: "life",
    content: "Как получить налоговый номер и страховое свидетельство...",
    language: "ru",
    tags: ["ИНН", "СНИЛС", "документы"],
    status: "draft",
    views: 0,
    createdAt: "2024-01-08",
    updatedAt: "2024-01-15",
    author: "Анна Петрова",
  },
  {
    id: "4",
    title: "Структура вуза: кафедры, деканаты, ректорат",
    category: "education",
    content: "Кто есть кто в российском университете...",
    language: "ru",
    tags: ["структура", "кафедра", "деканат"],
    status: "published",
    views: 156,
    createdAt: "2024-01-05",
    updatedAt: "2024-01-12",
    author: "Анна Петрова",
  },
  {
    id: "5",
    title: "Как писать курсовую работу",
    category: "education",
    content: "Пошаговое руководство по написанию курсовой...",
    language: "ru",
    tags: ["курсовая", "написание", "исследование"],
    status: "published",
    views: 298,
    createdAt: "2024-01-08",
    updatedAt: "2024-01-15",
    author: "Анна Петрова",
  },
];

const statusColors: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-100 text-gray-700",
};

export default function AdminGuidesPage() {
  return (
    <ProtectedRoute>
      <AdminGuidesContent />
    </ProtectedRoute>
  );
}

function AdminGuidesContent() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === Role.ADMIN;

  const [guides, setGuides] = useState(mockGuides);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedGuides, setSelectedGuides] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGuide, setNewGuide] = useState({
    title: "",
    category: "education",
    status: "draft",
  });

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

  const filteredGuides = guides.filter((guide) => {
    const matchesSearch =
      guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" || guide.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || guide.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleDeleteGuide = (guideId: string) => {
    setGuides(guides.filter((guide) => guide.id !== guideId));
  };

  const handleSelectAll = () => {
    if (selectedGuides.length === filteredGuides.length) {
      setSelectedGuides([]);
    } else {
      setSelectedGuides(filteredGuides.map((guide) => guide.id));
    }
  };

  const handleSelectGuide = (guideId: string) => {
    setSelectedGuides((prev) =>
      prev.includes(guideId)
        ? prev.filter((id) => id !== guideId)
        : [...prev, guideId]
    );
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
              <div className="rounded-lg bg-green-50 p-3">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {t("admin.guides.header.title")}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  {t("admin.guides.header.subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>{t("admin.guides.export")}</span>
              </Button>
              <Button
                className="flex items-center space-x-2"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span>{t("admin.guides.create")}</span>
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
                  placeholder={t("admin.guides.search.placeholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 pr-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">{t("admin.guides.filters.status.all")}</option>
                <option value="published">{t("admin.guides.filters.status.published")}</option>
                <option value="draft">{t("admin.guides.filters.status.draft")}</option>
                <option value="archived">{t("admin.guides.filters.status.archived")}</option>
              </select>
                <ChevronDown className="h-4 w-4 text-gray-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
              <div className="relative w-full sm:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 pr-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">{t("admin.guides.filters.category.all")}</option>
                <option value="education">{t("admin.guides.filters.category.education")}</option>
                <option value="life">{t("admin.guides.filters.category.life")}</option>
              </select>
                <ChevronDown className="h-4 w-4 text-gray-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guides Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("admin.guides.table.title")} ({filteredGuides.length})</span>
              {selectedGuides.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {t("admin.guides.table.selected")} {selectedGuides.length}
                  </span>
                  <Button variant="outline" size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t("admin.guides.table.publish")}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    {t("admin.guides.table.toDraft")}
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
                          selectedGuides.length === filteredGuides.length &&
                          filteredGuides.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      {t("admin.guides.table.guide")}
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      {t("admin.guides.table.category")}
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      {t("admin.guides.table.status")}
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      {t("admin.guides.table.stats")}
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      {t("admin.guides.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuides.map((guide) => (
                    <tr
                      key={guide.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedGuides.includes(guide.id)}
                          onChange={() => handleSelectGuide(guide.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {guide.title}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {guide.content.substring(0, 60)}...
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              {guide.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-600"
                                >
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </span>
                              ))}
                              {guide.tags.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{guide.tags.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            statusColors[guide.status]
                          }`}
                        >
                          {guide.status === "published"
                            ? t("admin.guides.statuses.published")
                            : guide.status === "draft"
                            ? t("admin.guides.statuses.draft")
                            : t("admin.guides.statuses.archived")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p className="text-gray-900">
                            {guide.views} {t("admin.guides.activity.views")}
                          </p>
                          <p className="text-gray-600">
                            {t("admin.guides.activity.author")}: {guide.author}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {t("admin.guides.activity.updated")}: {guide.updatedAt}
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
                            onClick={() => handleDeleteGuide(guide.id)}
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
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("admin.guides.stats.published")}
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {guides.filter((g) => g.status === "published").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{t("admin.guides.stats.drafts")}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {guides.filter((g) => g.status === "draft").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("admin.guides.stats.totalViews")}
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {guides.reduce((sum, guide) => sum + guide.views, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{t("admin.guides.stats.languages")}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {new Set(guides.map((g) => g.language)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>{t("admin.guides.modal.title")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  setGuides([
                    {
                      id: Date.now().toString(),
                      title: newGuide.title || "Новый гайд",
                      category: newGuide.category as "education" | "life",
                      content: "Новый гайд...",
                      language: "ru",
                      tags: [],
                      status: newGuide.status as "published" | "draft" | "archived",
                      views: 0,
                      createdAt: new Date().toISOString().split("T")[0],
                      updatedAt: new Date().toISOString().split("T")[0],
                      author: user?.name || "Администратор",
                    },
                    ...guides,
                  ]);
                  setIsCreateOpen(false);
                  setNewGuide({ title: "", category: "education", status: "draft" });
                }}
              >
                <div className="space-y-2">
                  <label htmlFor="new-guide-name" className="text-sm font-medium text-gray-700">
                    {t("admin.guides.modal.name")}
                  </label>
                  <Input
                    id="new-guide-name"
                    value={newGuide.title}
                    onChange={(e) =>
                      setNewGuide((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder={t("admin.guides.modal.namePlaceholder")}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="new-guide-category" className="text-sm font-medium text-gray-700">
                      {t("admin.guides.modal.category")}
                    </label>
                    <div className="relative">
                      <select
                        id="new-guide-category"
                        value={newGuide.category}
                        onChange={(e) =>
                          setNewGuide((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                        className="w-full appearance-none px-3 py-2 pr-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="education">{t("admin.guides.filters.category.education")}</option>
                        <option value="life">{t("admin.guides.filters.category.life")}</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-gray-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="new-guide-status" className="text-sm font-medium text-gray-700">
                      {t("admin.guides.modal.status")}
                    </label>
                    <div className="relative">
                      <select
                        id="new-guide-status"
                        value={newGuide.status}
                        onChange={(e) =>
                          setNewGuide((prev) => ({
                            ...prev,
                            status: e.target.value,
                          }))
                        }
                        className="w-full appearance-none px-3 py-2 pr-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="draft">{t("admin.guides.statuses.draft")}</option>
                        <option value="published">{t("admin.guides.statuses.published")}</option>
                        <option value="archived">{t("admin.guides.statuses.archived")}</option>
                      </select>
                      <ChevronDown className="h-4 w-4 text-gray-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
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
