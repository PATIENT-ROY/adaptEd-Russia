"use client";

import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { Role, Review, ReviewStatus, Plan } from "@/types";
import { API_BASE_URL } from "@/lib/api";
import ReviewTable from "@/components/admin/ReviewTable";
import { ChevronDown, ArrowLeft, Star } from "lucide-react";
import Link from "next/link";

export default function AdminReviewsPage() {
  return (
    <ProtectedRoute>
      <AdminReviewsContent />
    </ProtectedRoute>
  );
}

function AdminReviewsContent() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === Role.ADMIN;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<string>("all");

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (subscriptionFilter !== "all") params.append("subscription", subscriptionFilter);
    if (featuredFilter === "true" || featuredFilter === "false")
      params.append("featured", featuredFilter);
    return params.toString();
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      const qs = buildQuery();
      const res = await fetch(
        `${API_BASE_URL}/admin/reviews${qs ? `?${qs}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (res.ok) {
        const body = await res.json();
        setReviews(body.data || []);
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, statusFilter, subscriptionFilter, featuredFilter]);

  const updateLocal = (id: string, patch: Partial<Review>) => {
    setReviews((rs) =>
      rs.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  const removeLocal = (id: string) => {
    setReviews((rs) => rs.filter((r) => r.id !== id));
  };

  const handleApprove = async (id: string) => {
    updateLocal(id, { status: ReviewStatus.APPROVED });
    try {
      await fetch(`${API_BASE_URL}/admin/reviews/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      await loadReviews();
    } catch (e) {
      console.error("Approve error:", e);
      loadReviews();
    }
  };

  const handleReject = async (id: string) => {
    updateLocal(id, { status: ReviewStatus.REJECTED });
    try {
      await fetch(`${API_BASE_URL}/admin/reviews/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: ReviewStatus.REJECTED }),
      });
      await loadReviews();
    } catch (e) {
      console.error(e);
      loadReviews();
    }
  };

  const handleToggleFeatured = async (id: string) => {
    const curr = reviews.find((r) => r.id === id);
    if (!curr) return;
    updateLocal(id, { isFeatured: !curr.isFeatured });
    try {
      await fetch(`${API_BASE_URL}/admin/reviews/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ isFeatured: !curr.isFeatured }),
      });
      await loadReviews();
    } catch (e) {
      console.error(e);
      loadReviews();
    }
  };

  const handleDelete = async (id: string) => {
    const original = reviews;
    removeLocal(id);
    try {
      await fetch(`${API_BASE_URL}/admin/reviews/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      await loadReviews();
    } catch (e) {
      console.error(e);
      setReviews(original);
    }
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="p-8 text-center">
            <p>{t("admin.accessDenied.title")}</p>
            <Link href="/admin">
              <Button>{t("admin.common.back")}</Button>
            </Link>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="rounded-lg bg-yellow-50 p-3">
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {t("admin.reviews.header.title")}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  {t("admin.reviews.header.subtitle")}
                </p>
              </div>
            </div>
          </div>

          {/* filters */}
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t("admin.reviews.filters.status.all")}</option>
                <option value="PENDING">{t("admin.reviews.filters.status.pending")}</option>
                <option value="APPROVED">{t("admin.reviews.filters.status.approved")}</option>
                <option value="REJECTED">{t("admin.reviews.filters.status.rejected")}</option>
              </select>
              <ChevronDown className="h-4 w-4 text-gray-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <div className="relative">
              <select
                value={subscriptionFilter}
                onChange={(e) => setSubscriptionFilter(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все планы</option>
                <option value="FREEMIUM">FREEMIUM</option>
                <option value="PREMIUM">PREMIUM</option>
              </select>
              <ChevronDown className="h-4 w-4 text-gray-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <div className="relative">
              <select
                value={featuredFilter}
                onChange={(e) => setFeaturedFilter(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все</option>
                <option value="true">Избранные</option>
                <option value="false">Обычные</option>
              </select>
              <ChevronDown className="h-4 w-4 text-gray-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.reviews.table.title")} ({reviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>{t("admin.reviews.loading")}</p>
            ) : (
              <ReviewTable
                reviews={reviews}
                onApprove={handleApprove}
                onReject={handleReject}
                onToggleFeatured={handleToggleFeatured}
                onDelete={handleDelete}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
