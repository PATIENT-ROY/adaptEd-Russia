import { useState, useCallback, useRef } from "react";
import { API_BASE_URL } from "@/lib/api";

export type QuestionStatusFilter = "all" | "answered" | "unanswered";

export interface Question {
  id: string;
  title: string;
  description?: string;
  answersCount: number;
  likesCount: number;
  author: string;
  authorId: string;
  isAnswered: boolean;
  acceptedAnswerId?: string | null;
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
  updatedAt?: number;
  timeLabel: string;
  isAccepted?: boolean;
}

export interface FetchQuestionsOpts {
  sort?: "popular" | "new";
  search?: string;
  page?: number;
  status?: QuestionStatusFilter;
  mine?: boolean;
}

interface PaginatedResponse<T> {
  success: boolean;
  data?: T;
  meta?: {
    total: number;
    all?: number;
    page: number;
    limit: number;
    hasMore: boolean;
    answered: number;
    unanswered: number;
  };
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
  const [answeredCount, setAnsweredCount] = useState(0);
  const [unansweredCount, setUnansweredCount] = useState(0);
  const pageRef = useRef(1);
  const filtersRef = useRef<{
    sort: "popular" | "new";
    search?: string;
    status: QuestionStatusFilter;
    mine: boolean;
  }>({ sort: "new", status: "all", mine: false });

  const getHeaders = useCallback((withAuth = false) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (withAuth && typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    return headers;
  }, []);

  const fetchQuestions = useCallback(
    async (opts: FetchQuestionsOpts = {}) => {
      const sort = opts.sort ?? filtersRef.current.sort;
      const search = opts.search ?? filtersRef.current.search;
      const status = opts.status ?? filtersRef.current.status;
      const mine = opts.mine ?? filtersRef.current.mine;
      const page = opts.page ?? 1;

      filtersRef.current = { sort, search, status, mine };

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
          status,
        });
        if (search?.trim()) params.set("search", search.trim());
        if (mine) params.set("mine", "true");

        const response = await fetch(`${API_BASE_URL}/questions?${params}`, {
          headers: getHeaders(true),
        });

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
        setTotalCount(data.meta?.all ?? data.meta?.total ?? fetched.length);
        setAnsweredCount(data.meta?.answered ?? 0);
        setUnansweredCount(data.meta?.unanswered ?? 0);
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
    [getHeaders],
  );

  const loadMore = useCallback(async () => {
    return fetchQuestions({ page: pageRef.current + 1 });
  }, [fetchQuestions]);

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
    [getHeaders],
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
          setTotalCount((c) => c + 1);
          setUnansweredCount((c) => c + 1);
        }

        return data.data || null;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Неизвестная ошибка";
        setError(message);
        return null;
      }
    },
    [getHeaders],
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
    [getHeaders],
  );

  const updateAnswer = useCallback(
    async (
      questionId: string,
      answerId: string,
      content: string,
    ): Promise<Answer | null> => {
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/questions/${questionId}/answers/${answerId}`,
          {
            method: "PATCH",
            headers: getHeaders(true),
            body: JSON.stringify({ content }),
          },
        );
        const data: ApiResponse<Answer> = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Ошибка редактирования ответа");
        }
        return data.data || null;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Неизвестная ошибка";
        setError(message);
        return null;
      }
    },
    [getHeaders],
  );

  const deleteAnswer = useCallback(
    async (questionId: string, answerId: string): Promise<boolean> => {
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/questions/${questionId}/answers/${answerId}`,
          {
            method: "DELETE",
            headers: getHeaders(true),
          },
        );
        const data: ApiResponse<{
          answersCount: number;
          isAnswered: boolean;
        }> = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Ошибка удаления ответа");
        }
        if (data.data) {
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === questionId
                ? {
                    ...q,
                    answersCount: data.data!.answersCount,
                    isAnswered: data.data!.isAnswered,
                    acceptedAnswerId:
                      q.acceptedAnswerId === answerId
                        ? null
                        : q.acceptedAnswerId,
                  }
                : q,
            ),
          );
        }
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Неизвестная ошибка";
        setError(message);
        return false;
      }
    },
    [getHeaders],
  );

  const acceptAnswer = useCallback(
    async (
      questionId: string,
      answerId: string,
    ): Promise<{ acceptedAnswerId: string | null; isAnswered: boolean } | null> => {
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/questions/${questionId}/answers/${answerId}/accept`,
          {
            method: "POST",
            headers: getHeaders(true),
          },
        );
        const data: ApiResponse<{
          acceptedAnswerId: string | null;
          isAnswered: boolean;
        }> = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Ошибка выбора лучшего ответа");
        }
        if (data.data) {
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === questionId
                ? {
                    ...q,
                    acceptedAnswerId: data.data!.acceptedAnswerId,
                    isAnswered: data.data!.isAnswered,
                  }
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
    [getHeaders],
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
                ? {
                    ...q,
                    likesCount: data.data!.likesCount,
                    isLikedByCurrentUser: data.data!.isLiked,
                  }
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
    [getHeaders],
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
                ? {
                    ...q,
                    likesCount: data.data!.likesCount,
                    isLikedByCurrentUser: data.data!.isLiked,
                  }
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
    [getHeaders],
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
    [getHeaders],
  );

  return {
    questions,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    answeredCount,
    unansweredCount,
    fetchQuestions,
    loadMore,
    fetchQuestion,
    createQuestion,
    addAnswer,
    updateAnswer,
    deleteAnswer,
    acceptAnswer,
    likeQuestion,
    unlikeQuestion,
    deleteQuestion,
    setQuestions,
  };
};
