import { Review } from "@/types";
import { Button } from "@/components/ui/button";
import { Check, X, Star, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";

interface Props {
  review: Review;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onToggleFeatured: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ReviewActions({ review, onApprove, onReject, onToggleFeatured, onDelete }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const handle = async (action: string, fn: (id: string) => Promise<void>) => {
    setLoading(action);
    try {
      await fn(review.id);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {review.status !== "APPROVED" && (
        <Button
          size="sm"
          variant="outline"
          className="px-2 hover:bg-green-50 hover:border-green-400 hover:text-green-600 transition-colors"
          onClick={() => handle("approve", onApprove)}
          disabled={loading !== null}
          title="Одобрить"
        >
          {loading === "approve" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      )}
      {review.status !== "REJECTED" && (
        <Button
          size="sm"
          variant="outline"
          className="px-2 hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition-colors"
          onClick={() => handle("reject", onReject)}
          disabled={loading !== null}
          title="Отклонить"
        >
          {loading === "reject" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </Button>
      )}
      <Button
        size="sm"
        variant={review.isFeatured ? "destructive" : "outline"}
        className={`px-2 transition-colors ${
          !review.isFeatured ? "hover:bg-yellow-50 hover:border-yellow-400 hover:text-yellow-600" : ""
        }`}
        onClick={() => handle("featured", onToggleFeatured)}
        disabled={loading !== null}
        title={review.isFeatured ? "Убрать из избранных" : "Добавить в избранные"}
      >
        {loading === "featured" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Star className={`h-4 w-4 ${review.isFeatured ? "fill-current" : ""}`} />
        )}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="px-2 hover:scale-105 transition-transform"
        onClick={() => {
          if (confirm("Удалить отзыв? Это действие нельзя отменить.")) {
            handle("delete", onDelete);
          }
        }}
        disabled={loading !== null}
        title="Удалить"
      >
        {loading === "delete" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
