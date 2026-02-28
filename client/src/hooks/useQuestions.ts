import { useState, useCallback, useRef } from "react";
import { API_BASE_URL } from "@/lib/api";

export interface Question {
  id: string;
  title: string;
  description?: string;
  answersCount: number;
  likesCount: number;
  author: string;
  authorId: string;
  isAnswered: boolean;
  isLikedByCurrentUser: boolean;
  createdAt: number;
  timeLabel: string;
}

export interface QuestionDetail extends Question {
  likedByUserIds: string[];
  answers: Answer[];
}

export interface Answer {
  id: string;
  content: string;
  author: string;
  authorId: string;
  createdAt: number;
  timeLabel: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data?: T;
  meta?: { total: number; page: number; limit: number; hasMore: boolean };
  message?: string;
  errors?: unknown[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown[];
}

export const useQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const pageRef = useRef(1);

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  const getHeaders = (withAuth = false) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (withAuth) {
      const token = getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    return headers;
  };

  const fetchQuestions = useCallback(
    async (
      sort: "popular" | "new" = "popular",
      search?: string,
      page = 1,
    ) => {
      const isAppend = page > 1;
      if (isAppend) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams({
          sort,
          page: String(page),
          limit: "20",
        });
        if (search?.trim()) params.set("search", search.trim());

        const response = await fetch(
          `${API_BASE_URL}/questions?${params}`,
          { headers: getHeaders(true) },
        );

        const data: PaginatedResponse<Question[]> = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Ошибка загрузки вопросов");
        }

        const fetched = data.data || [];
        if (isAppend) {
          setQuestions((prev) => [...prev, ...fetched]);
        } else {
          setQuestions(fetched);
        }

        pageRef.current = page;
        setHasMore(data.meta?.hasMore ?? false);
        setTotalCount(data.meta?.total ?? fetched.length);
        return fetched;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Неизвестная ошибка";
        setError(message);
        return [];
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  const loadMore = useCallback(
    async (sort: "popular" | "new", search?: string) => {
      return fetchQuestions(sort, search, pageRef.current + 1);
    },
    [fetchQuestions],
  );

  const fetchQuestion = useCallback(
    async (id: string): Promise<QuestionDetail | null> => {
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/questions/${id}`, {
          headers: getHeaders(true),
        });

        const data: ApiResponse<QuestionDetail> = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Вопрос не найден");
        }

        return data.data || null;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Неизвестная ошибка";
        setError(message);
        return null;
      }
    },
    [],
  );

  const createQuestion = useCallback(
    async (
      title: string,
      description?: string,
    ): Promise<Question | null> => {
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/questions`, {
          method: "POST",
          headers: getHeaders(true),
          body: JSON.stringify({ title, description }),
        });

        const data: ApiResponse<Question> = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Ошибка создания вопроса");
        }

        if (data.data) {
          setQuestions((prev) => [data.data!, ...prev]);
        }

        return data.data || null;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Неизвестная ошибка";
        setError(message);
        return null;
      }
    },
    [],
  );

  const addAnswer = useCallback(
    async (
      questionId: string,
      content: string,
    ): Promise<Answer | null> => {
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/questions/${questionId}/answers`,
          {
            method: "POST",
            headers: getHeaders(true),
            body: JSON.stringify({ content }),
          },
        );

        const data: ApiResponse<Answer> = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Ошибка добавления ответа");
        }

        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? { ...q, answersCount: q.answersCount + 1, isAnswered: true }
              : q,
          ),
        );

        return data.data || null;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Неизвестная ошибка";
        setError(message);
        return null;
      }
    },
    [],
  );

  const likeQuestion = useCallback(
    async (
      questionId: string,
    ): Promise<{ likesCount: number; isLiked: boolean } | null> => {
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/questions/${questionId}/like`,
          {
            method: "POST",
            headers: getHeaders(true),
          },
        );

        const data: ApiResponse<{ likesCount: number; isLiked: boolean }> =
          await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Ошибка");
        }

        if (data.data) {
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === questionId
                ? { ...q, likesCount: data.data!.likesCount }
                : q,
            ),
          );
        }

        return data.data || null;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Неизвестная ошибка";
        setError(message);
        return null;
      }
    },
    [],
  );

  const unlikeQuestion = useCallback(
    async (
      questionId: string,
    ): Promise<{ likesCount: number; isLiked: boolean } | null> => {
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/questions/${questionId}/like`,
          {
            method: "DELETE",
            headers: getHeaders(true),
          },
        );

        const data: ApiResponse<{ likesCount: number; isLiked: boolean }> =
          await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Ошибка");
        }

        if (data.data) {
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === questionId
                ? { ...q, likesCount: data.data!.likesCount }
                : q,
            ),
          );
        }

        return data.data || null;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Неизвестная ошибка";
        setError(message);
        return null;
      }
    },
    [],
  );

  const deleteQuestion = useCallback(
    async (questionId: string): Promise<boolean> => {
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/questions/${questionId}`,
          {
            method: "DELETE",
            headers: getHeaders(true),
          },
        );

        const data: ApiResponse<void> = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Ошибка удаления");
        }

        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Неизвестная ошибка";
        setError(message);
        return false;
      }
    },
    [],
  );

  return {
    questions,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    fetchQuestions,
    loadMore,
    fetchQuestion,
    createQuestion,
    addAnswer,
    likeQuestion,
    unlikeQuestion,
    deleteQuestion,
    setQuestions,
  };
};
