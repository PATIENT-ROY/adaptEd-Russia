import React, { useEffect, useRef, useState } from "react";
import { RatingStars } from "./RatingStars";
import { Review } from "@/types";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveError: string | null;
  onSave: (data: { text: string; rating: number; allowPublication: boolean }) => Promise<void>;
  statusMessage: string | null;
}

export function ReviewModal({
  isOpen,
  onClose,
  review,
  loading,
  error,
  saving,
  saveError,
  onSave,
  statusMessage,
}: ReviewModalProps) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [allowPublication, setAllowPublication] = useState(true);

  useEffect(() => {
    if (review) {
      setText(review.text);
      setRating(review.rating);
      setAllowPublication(review.allowPublication ?? true);
    }
  }, [review]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setText("");
      setRating(0);
      setAllowPublication(true);
    } else {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (text.trim() === "" || rating < 1 || rating > 5) {
      return;
    }
    await onSave({ text, rating, allowPublication });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            {review
              ? t("profile.review.modal.title.edit")
              : t("profile.review.modal.title.new")}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {statusMessage && (
          <div className="mb-3 text-sm text-blue-700 bg-blue-100 p-2 rounded">
            {statusMessage}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("profile.review.modal.rating")}
          </label>
          <RatingStars value={rating} onChange={setRating} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("profile.review.modal.text")}
          </label>
          <textarea
            ref={textareaRef}
            maxLength={500}
            rows={4}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="text-xs text-gray-500 text-right">
            {text.length}/500
          </div>
        </div>
        <div className="mb-4 flex items-center">
          <input
            id="allowPub"
            type="checkbox"
            checked={allowPublication}
            onChange={(e) => setAllowPublication(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="allowPub" className="ml-2 text-sm text-gray-700">
            {t("profile.review.modal.allow")}
          </label>
        </div>
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        {saveError && <div className="text-sm text-red-600 mb-2">{saveError}</div>}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={saving || loading || rating < 1 || text.trim() === ""}
          >
            {saving ? t("profile.review.modal.saving") : t("profile.review.modal.submit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
