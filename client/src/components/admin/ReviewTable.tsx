import { Review } from "@/types";
import { format } from "date-fns";
import { ReviewActions } from "./ReviewActions";
import React from "react";

interface Props {
  reviews: Review[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onToggleFeatured: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function ReviewTable({ reviews, onApprove, onReject, onToggleFeatured, onDelete }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4">Автор</th>
            <th className="text-left py-3 px-4">Рейтинг</th>
            <th className="text-left py-3 px-4">Текст</th>
            <th className="text-left py-3 px-4">Статус</th>
            <th className="text-left py-3 px-4">Создан</th>
            <th className="text-left py-3 px-4">Действия</th>
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
              <td className="py-3 px-4">{r.rating}</td>
              <td className="py-3 px-4">
                <p className="text-sm text-gray-800 line-clamp-2">{r.text}</p>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold  ${{
                    PENDING: "bg-yellow-100 text-yellow-800",
                    APPROVED: "bg-green-100 text-green-800",
                    REJECTED: "bg-red-100 text-red-800",
                  }[r.status]}`}
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
              <td colSpan={6} className="py-6 text-center text-gray-500">
                Нет отзывов
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
