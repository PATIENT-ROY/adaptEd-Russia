import React, { useEffect, useRef, useState } from "react";
import { RatingStars } from "./RatingStars";
import { Review } from "@/types";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const TEXT_MIN = 20;
const TEXT_MAX = 500;
const PLACEHOLDER = "Например: Понравились гайды про сессию и напоминания…";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveError: string | null;
  onSave: (data: { text: string; rating: number; allowPublication: boolean }) => Promise<void>;
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
}: ReviewModalProps) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [allowPublication, setAllowPublication] = useState(true);
  const [ratingTouched, setRatingTouched] = useState(false);

  const tt = (key: string, fallback: string): string => {
    const value = t(key);
    return value === key ? fallback : value;
  };

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
      setRatingTouched(false);
    } else {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const textTrimmed = text.trim();
  const textValid = textTrimmed.length >= TEXT_MIN && textTrimmed.length <= TEXT_MAX;
  const ratingValid = rating >= 1 && rating <= 5;
  const canSubmit = ratingValid && textValid;

  const handleSubmit = async () => {
    setRatingTouched(true);
    if (!ratingValid || !textValid) return;
    await onSave({ text: textTrimmed, rating, allowPublication });
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
              ? tt("profile.review.modal.title.edit", "Редактировать отзыв")
              : tt("profile.review.modal.title.new", "Оставить отзыв")}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {tt("profile.review.modal.rating", "Рейтинг")}
          </label>
          <div onClick={() => setRatingTouched(true)}>
            <RatingStars value={rating} onChange={setRating} />
          </div>
          {ratingTouched && !ratingValid && (
            <p className="mt-1 text-xs text-amber-600">Выберите рейтинг</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {tt("profile.review.modal.text", "Текст отзыва")}
          </label>
          <textarea
            ref={textareaRef}
            maxLength={TEXT_MAX}
            rows={4}
            placeholder={PLACEHOLDER}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-1 flex justify-between items-center">
            {textTrimmed.length > 0 && textTrimmed.length < TEXT_MIN && (
              <p className="text-xs text-amber-600">
                Минимум {TEXT_MIN} символов
              </p>
            )}
            <span className="text-xs text-gray-500 ml-auto">
              {text.length}/{TEXT_MAX}
            </span>
          </div>
        </div>
        <div className="mb-4 flex items-start gap-2">
          <input
            id="allowPub"
            type="checkbox"
            checked={allowPublication}
            onChange={(e) => setAllowPublication(e.target.checked)}
            className="h-4 w-4 mt-0.5 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="allowPub" className="text-sm text-gray-700">
            {tt("profile.review.modal.allow", "Разрешить публикацию")}
            <span className="block text-xs text-gray-500 mt-0.5">
              {tt(
                "profile.review.modal.allowHint",
                "Ваше имя и страна могут быть показаны на сайте",
              )}
            </span>
          </label>
        </div>
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        {saveError && <div className="text-sm text-red-600 mb-2">{saveError}</div>}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={saving || loading || !canSubmit}
          >
            {saving
              ? tt("profile.review.modal.saving", "Сохранение...")
              : tt("profile.review.modal.submit", "Отправить")}
          </Button>
        </div>
      </div>
    </div>
  );
}
