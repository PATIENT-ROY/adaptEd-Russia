import { useState, useEffect, useCallback } from "react";
import { Review, ReviewStatus } from "@/types";
import { API_BASE_URL } from "@/lib/api";

export interface UseReviewResult {
  review: Review | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveError: string | null;
  statusMessage: string | null;
  createOrUpdate: (payload: {
    text: string;
    rating: number;
    allowPublication: boolean;
  }) => Promise<void>;
}

export function useReview(): UseReviewResult {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchReview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('reviews/me returned non-ok:', res.status, text);
        throw new Error(`HTTP ${res.status}`);
      }
      const body = await res.json();
      setReview(body.data || null);
    } catch (e: unknown) {
      console.error("Failed to fetch review:", e);
      setError("Не удалось загрузить отзыв");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReview();

    const onFocus = () => fetchReview();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchReview]);

  const createOrUpdate = useCallback(
    async ({
      text,
      rating,
      allowPublication,
    }: {
      text: string;
      rating: number;
      allowPublication: boolean;
    }) => {
      setSaving(true);
      setSaveError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/reviews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ text, rating, allowPublication }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        setReview(body.data);
      } catch (e) {
        console.error("Failed to save review:", e);
        setSaveError("Не удалось сохранить отзыв");
      } finally {
        setSaving(false);
      }
    },
    []
  );

  let statusMessage: string | null = null;
  if (review) {
    if (review.status === ReviewStatus.PENDING) {
      statusMessage = "Ваш отзыв ожидает модерации";
    } else if (review.status === ReviewStatus.APPROVED) {
      statusMessage = "Ваш отзыв опубликован";
    } else if (review.status === ReviewStatus.REJECTED) {
      statusMessage = "Ваш отзыв отклонён модератором. Вы можете отредактировать и отправить снова.";
    }
  }

  return {
    review,
    loading,
    error,
    saving,
    saveError,
    statusMessage,
    createOrUpdate,
  };
}
