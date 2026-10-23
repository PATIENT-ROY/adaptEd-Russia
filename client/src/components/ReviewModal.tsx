import React, { useEffect, useState } from "react";
import { RatingStars } from "./RatingStars";
import { Review } from "@/types";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { ProfileDialog } from "@/components/ui/profile-dialog";

const TEXT_MIN = 20;
const TEXT_MAX = 500;

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
  const [allowPublication, setAllowPublication] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [ratingTouched, setRatingTouched] = useState(false);

  const tt = (key: string, fallback: string): string => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  useEffect(() => {
    if (review) {
      setText(review.text);
      setRating(review.rating);
      setAllowPublication(review.allowPublication ?? false);
      setPrivacyConsent(true);
    }
  }, [review]);


  useEffect(() => {
    if (!isOpen) {
      setText("");
      setRating(0);
      setAllowPublication(false);
      setPrivacyConsent(false);
      setRatingTouched(false);
    }
  }, [isOpen]);

  const textTrimmed = text.trim();
  const textValid = textTrimmed.length >= TEXT_MIN && textTrimmed.length <= TEXT_MAX;
  const ratingValid = rating >= 1 && rating <= 5;
  const canSubmit = ratingValid && textValid && privacyConsent;

  const handleSubmit = async () => {
    setRatingTouched(true);
    if (!ratingValid || !textValid || !privacyConsent) return;
    await onSave({ text: textTrimmed, rating, allowPublication });
  };

  if (!isOpen) return null;

  return (
    <ProfileDialog open={isOpen} onClose={onClose} title={t(review ? "profile.review.modal.title.edit" : "profile.review.modal.title.new")}>
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            {review
              ? tt("profile.review.modal.title.edit", "Редактировать отзыв")
              : tt("profile.review.modal.title.new", "Оставить отзыв")}
          </h2>
          <button type="button" onClick={onClose} aria-label={t("profile.billing.invoice.close")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-slate-100 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500">
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
            <p className="mt-1 text-xs text-amber-600">{tt("profile.review.modal.ratingRequired", "Выберите рейтинг")}</p>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="review-text" className="block text-sm font-medium text-gray-700 mb-1">
            {tt("profile.review.modal.text", "Текст отзыва")}
          </label>
          <textarea
            id="review-text"
            maxLength={TEXT_MAX}
            rows={4}
            placeholder={tt("profile.review.modal.placeholder", "Например: Понравились гайды про сессию и напоминания…")}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-1 flex justify-between items-center">
            {textTrimmed.length > 0 && textTrimmed.length < TEXT_MIN && (
              <p className="text-xs text-amber-600">
                {tt("profile.review.modal.minChars", "Минимум {n} символов").replace("{n}", String(TEXT_MIN))}
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
        <div className="mb-4 flex items-start gap-2">
          <input
            id="review-privacy-consent"
            type="checkbox"
            checked={privacyConsent}
            onChange={(e) => setPrivacyConsent(e.target.checked)}
            className="h-4 w-4 mt-0.5 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="review-privacy-consent" className="text-sm text-gray-700">
            {tt("review.privacyConsent", "Я согласен(на) с")}{" "}
            <a
              href="/personal-data-consent"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {tt("review.consentLink", "согласием на обработку персональных данных")}
            </a>
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
    </ProfileDialog>
  );
}
