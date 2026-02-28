"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
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
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";
import { API_BASE_URL } from "@/lib/api";

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
  return (
    <ProtectedRoute>
      <AdminSupportContent />
    </ProtectedRoute>
  );
}

function AdminSupportContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === Role.ADMIN;

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/support/admin/tickets`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.data);
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadTickets();
  }, [isAdmin]);

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "OPEN":
        return t("admin.support.ticket.status.open");
      case "IN_PROGRESS":
        return t("admin.support.ticket.status.inProgress");
      case "RESOLVED":
        return t("admin.support.ticket.status.resolved");
      case "CLOSED":
        return t("admin.support.ticket.status.closed");
      default:
        return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return t("admin.support.ticket.priority.urgent");
      case "HIGH":
        return t("admin.support.ticket.priority.high");
      case "MEDIUM":
        return t("admin.support.ticket.priority.medium");
      case "LOW":
        return t("admin.support.ticket.priority.low");
      default:
        return priority;
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/support/admin/tickets/${ticketId}/status`,
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
        loadTickets();
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
    }
  };

  const respondToTicket = async (ticketId: string, content: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/support/admin/tickets/${ticketId}/respond`,
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
        loadTickets();
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error("Error sending response:", error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("admin.accessDenied.title")}</h2>
          <p className="text-gray-600">
            {t("admin.common.accessDeniedGeneric")}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="rounded-lg bg-blue-50 p-3">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {t("admin.support.header.title")}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {t("admin.support.header.subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t("admin.support.search.placeholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 pr-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t("admin.support.filters.status.all")}</option>
                <option value="OPEN">{t("admin.support.filters.status.open")}</option>
                <option value="IN_PROGRESS">{t("admin.support.filters.status.inProgress")}</option>
                <option value="RESOLVED">{t("admin.support.filters.status.resolved")}</option>
                <option value="CLOSED">{t("admin.support.filters.status.closed")}</option>
              </select>
                <ChevronDown className="h-4 w-4 text-gray-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 pr-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t("admin.support.filters.priority.all")}</option>
                <option value="URGENT">{t("admin.support.filters.priority.urgent")}</option>
                <option value="HIGH">{t("admin.support.filters.priority.high")}</option>
                <option value="MEDIUM">{t("admin.support.filters.priority.medium")}</option>
                <option value="LOW">{t("admin.support.filters.priority.low")}</option>
              </select>
                <ChevronDown className="h-4 w-4 text-gray-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              <Button
                onClick={loadTickets}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {t("admin.support.refresh")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t("admin.support.stats.open")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tickets.filter((tk) => tk.status === "OPEN").length}
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
                    {t("admin.support.stats.inProgress")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tickets.filter((tk) => tk.status === "IN_PROGRESS").length}
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
                  <p className="text-sm font-medium text-gray-600">{t("admin.support.stats.resolved")}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tickets.filter((tk) => tk.status === "RESOLVED").length}
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
                  <p className="text-sm font-medium text-gray-600">{t("admin.support.stats.total")}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tickets.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ticket list */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>{t("admin.support.loading")}</p>
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
                          {getStatusLabel(ticket.status)}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {getPriorityLabel(ticket.priority)}
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
                          aria-label={t("admin.support.ticket.view")}
                        >
                          <Eye className="h-4 w-4" />
                          {t("admin.support.ticket.view")}
                        </Button>

                        {ticket.status === "OPEN" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateTicketStatus(ticket.id, "IN_PROGRESS")
                            }
                            aria-label={t("admin.support.ticket.takeWork")}
                          >
                            {t("admin.support.ticket.takeWork")}
                          </Button>
                        )}

                        {ticket.status === "IN_PROGRESS" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateTicketStatus(ticket.id, "RESOLVED")
                            }
                            aria-label={t("admin.support.ticket.markResolved")}
                          >
                            {t("admin.support.ticket.markResolved")}
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
                    {t("admin.support.empty.title")}
                  </h3>
                  <p className="text-gray-600">
                    {t("admin.support.empty.description")}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Ticket detail modal */}
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
                    aria-label={t("admin.common.close")}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Ticket info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("admin.support.modal.sender")}
                    </p>
                    <p className="text-gray-900">{selectedTicket.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <p className="text-gray-900">{selectedTicket.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("admin.support.modal.createdAt")}
                    </p>
                    <p className="text-gray-900">
                      {new Date(selectedTicket.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("admin.support.modal.status")}
                    </p>
                    <Badge className={getStatusColor(selectedTicket.status)}>
                      {getStatusLabel(selectedTicket.status)}
                    </Badge>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {t("admin.support.modal.message")}
                  </h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedTicket.message}
                    </p>
                  </div>
                </div>

                {/* Responses */}
                {selectedTicket.responses.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{t("admin.support.modal.responses")}</h4>
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

                {/* Reply form */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{t("admin.support.modal.reply")}</h4>
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
                      placeholder={t("admin.support.modal.replyPlaceholder")}
                      required
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        className="flex items-center gap-1"
                      >
                        <Reply className="h-4 w-4" />
                        {t("admin.support.modal.send")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedTicket(null)}
                      >
                        {t("admin.common.cancel")}
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
  );
}
