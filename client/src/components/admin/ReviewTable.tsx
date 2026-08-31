"use client";

import { Review } from "@/types";
import { format } from "date-fns";
import { ReviewActions } from "./ReviewActions";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface Props {
  reviews: Review[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onToggleFeatured: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function statusClass(status: string) {
  return status === "PENDING"
    ? "bg-yellow-100 text-yellow-800"
    : status === "APPROVED"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
}

export default function ReviewTable({ reviews, onApprove, onReject, onToggleFeatured, onDelete }: Props) {
  const { t } = useTranslation();
  const [openReview, setOpenReview] = useState<Review | null>(null);
  useBodyScrollLock(openReview !== null);

  useEffect(() => {
    if (!openReview) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenReview(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openReview]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4">{t("admin.reviews.table.author")}</th>
            <th className="text-left py-3 px-4">{t("admin.reviews.table.plan")}</th>
            <th className="text-left py-3 px-4">{t("admin.reviews.table.rating")}</th>
            <th className="text-left py-3 px-4">{t("admin.reviews.table.text")}</th>
            <th className="text-left py-3 px-4">{t("admin.reviews.table.status")}</th>
            <th className="text-left py-3 px-4">{t("admin.reviews.table.created")}</th>
            <th className="text-left py-3 px-4">{t("admin.reviews.table.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((r) => (
            <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {r.user.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{r.user.name}</p>
                    <p className="text-sm text-gray-600">
                      {r.user.university || r.user.country || "-"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {r.user.subscriptionStatus || "-"}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    r.user.plan === "PREMIUM"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {r.user.plan === "PREMIUM" ? "PREMIUM" : "FREE"}
                </span>
              </td>
              <td className="py-3 px-4">{r.rating}</td>
              <td className="py-3 px-4 max-w-xs">
                <button
                  type="button"
                  onClick={() => setOpenReview(r)}
                  className="text-left w-full group"
                >
                  <p className="text-sm text-gray-800 line-clamp-2 group-hover:text-blue-700">
                    {r.text}
                  </p>
                  <span className="mt-1 inline-block text-xs font-medium text-blue-600 group-hover:underline">
                    {t("admin.reviews.readFull")}
                  </span>
                </button>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusClass(r.status)}`}
                >
                  {r.status}
                </span>
              </td>
              <td className="py-3 px-4">
                {format(new Date(r.createdAt), "yyyy-MM-dd")}
              </td>
              <td className="py-3 px-4">
                <ReviewActions
                  review={r}
                  onApprove={onApprove}
                  onReject={onReject}
                  onToggleFeatured={onToggleFeatured}
                  onDelete={onDelete}
                />
              </td>
            </tr>
          ))}
          {reviews.length === 0 && (
            <tr>
              <td colSpan={7} className="py-6 text-center text-gray-500">
                {t("admin.reviews.empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {openReview
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
              onClick={() => setOpenReview(null)}
            >
              <div className="absolute inset-0 bg-black/50" />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-review-dialog-title"
                className="relative z-10 w-full max-w-lg max-h-[88vh] overflow-y-auto overscroll-contain rounded-2xl bg-white p-6 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2
                      id="admin-review-dialog-title"
                      className="text-lg font-semibold text-gray-900"
                    >
                      {openReview.user.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {openReview.user.country || "—"} · {openReview.rating}/5 ·{" "}
                      {format(new Date(openReview.createdAt), "yyyy-MM-dd")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenReview(null)}
                    className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    aria-label={t("admin.reviews.close")}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold mb-4 ${statusClass(openReview.status)}`}
                >
                  {openReview.status}
                </span>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                  {openReview.text}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
