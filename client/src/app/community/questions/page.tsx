"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FeaturePreviewGate } from "@/components/auth/FeaturePreviewGate";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { QuestionCard } from "@/components/community/QuestionCard";
import {
  useQuestions,
  type Answer,
  type QuestionStatusFilter,
} from "@/hooks/useQuestions";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Plus,
  MessageCircle,
  TrendingUp,
  Clock,
  Search,
  Sparkles,
  Users,
  Loader2,
  AlertCircle,
  X,
  Pin,
  UserRound,
} from "lucide-react";

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-5 w-20 bg-gray-200 rounded-full" />
      </div>
      <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-1/2 bg-gray-100 rounded mb-4" />
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="h-7 w-16 bg-gray-100 rounded-full" />
          <div className="h-7 w-12 bg-gray-100 rounded-full" />
        </div>
        <div className="flex gap-2">
          <div className="h-4 w-20 bg-gray-100 rounded" />
          <div className="h-4 w-16 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function CommunityQuestionsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const {
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
    likeQuestion,
    unlikeQuestion,
    deleteQuestion,
    updateAnswer,
    deleteAnswer,
    acceptAnswer,
  } = useQuestions();

  const [activeSort, setActiveSort] = useState<"popular" | "new">("new");
  const [statusFilter, setStatusFilter] =
    useState<QuestionStatusFilter>("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(
    null,
  );
  const [likedQuestions, setLikedQuestions] = useState<
    Record<string, boolean>
  >({});
  const [expandedAnswers, setExpandedAnswers] = useState<
    Record<string, Answer[]>
  >({});
  const [loadingAnswers, setLoadingAnswers] = useState<
    Record<string, boolean>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didInitSearchRef = useRef(false);

  useEffect(() => {
    const liked: Record<string, boolean> = {};
    for (const q of questions) {
      liked[q.id] = q.isLikedByCurrentUser;
    }
    setLikedQuestions(liked);
  }, [questions]);

  const reload = useCallback(() => {
    fetchQuestions({
      sort: activeSort,
      search: searchQuery || undefined,
      status: statusFilter,
      mine: mineOnly,
      page: 1,
    });
  }, [fetchQuestions, activeSort, searchQuery, statusFilter, mineOnly]);

  useEffect(() => {
    reload();
  }, [activeSort, statusFilter, mineOnly, reload]);

  useEffect(() => {
    if (!didInitSearchRef.current) {
      didInitSearchRef.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      reload();
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, reload]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      reload();
    }, 45_000);

    return () => clearInterval(intervalId);
  }, [reload]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = formData.title.trim();
    const description = formData.description.trim();
    if (!title) return;

    setIsSubmitting(true);
    const newQuestion = await createQuestion(title, description || undefined);
    setIsSubmitting(false);

    if (newQuestion) {
      setFormData({ title: "", description: "" });
      setIsFormVisible(false);
      setActiveSort("new");
    }
  };

  const handleToggleAnswers = useCallback(
    async (questionId: string) => {
      if (expandedQuestionId === questionId) {
        setExpandedQuestionId(null);
        return;
      }

      setExpandedQuestionId(questionId);

      if (!expandedAnswers[questionId]) {
        setLoadingAnswers((prev) => ({ ...prev, [questionId]: true }));
        const detail = await fetchQuestion(questionId);
        if (detail) {
          setExpandedAnswers((prev) => ({
            ...prev,
            [questionId]: detail.answers,
          }));
          if (user && detail.likedByUserIds.includes(user.id)) {
            setLikedQuestions((prev) => ({ ...prev, [questionId]: true }));
          }
        }
        setLoadingAnswers((prev) => ({ ...prev, [questionId]: false }));
      }
    },
    [expandedQuestionId, expandedAnswers, fetchQuestion, user],
  );

  const handleLike = useCallback(
    async (questionId: string) => {
      const isCurrentlyLiked = likedQuestions[questionId];
      setLikedQuestions((prev) => ({
        ...prev,
        [questionId]: !isCurrentlyLiked,
      }));

      const result = isCurrentlyLiked
        ? await unlikeQuestion(questionId)
        : await likeQuestion(questionId);

      if (!result) {
        setLikedQuestions((prev) => ({
          ...prev,
          [questionId]: isCurrentlyLiked,
        }));
      }
    },
    [likedQuestions, likeQuestion, unlikeQuestion],
  );

  const handleAddAnswer = useCallback(
    async (questionId: string, content: string) => {
      const answer = await addAnswer(questionId, content);
      if (answer) {
        setExpandedAnswers((prev) => ({
          ...prev,
          [questionId]: [...(prev[questionId] || []), answer],
        }));
      }
    },
    [addAnswer],
  );

  const handleAcceptAnswer = useCallback(
    async (questionId: string, answerId: string) => {
      const result = await acceptAnswer(questionId, answerId);
      if (!result) return;
      setExpandedAnswers((prev) => ({
        ...prev,
        [questionId]: (prev[questionId] || []).map((a) => ({
          ...a,
          isAccepted: a.id === result.acceptedAnswerId,
        })),
      }));
    },
    [acceptAnswer],
  );

  const handleUpdateAnswer = useCallback(
    async (questionId: string, answerId: string, content: string) => {
      const updated = await updateAnswer(questionId, answerId, content);
      if (!updated) return;
      setExpandedAnswers((prev) => ({
        ...prev,
        [questionId]: (prev[questionId] || []).map((a) =>
          a.id === answerId ? { ...a, ...updated } : a,
        ),
      }));
    },
    [updateAnswer],
  );

  const handleDeleteAnswer = useCallback(
    async (questionId: string, answerId: string) => {
      const ok = await deleteAnswer(questionId, answerId);
      if (!ok) return;
      setExpandedAnswers((prev) => ({
        ...prev,
        [questionId]: (prev[questionId] || []).filter((a) => a.id !== answerId),
      }));
    },
    [deleteAnswer],
  );

  const handleDelete = useCallback(
    async (questionId: string) => {
      await deleteQuestion(questionId);
      if (expandedQuestionId === questionId) setExpandedQuestionId(null);
    },
    [deleteQuestion, expandedQuestionId],
  );

  const handleLoadMore = () => {
    loadMore();
  };

  const setFilterFromStat = (next: QuestionStatusFilter) => {
    setMineOnly(false);
    setStatusFilter((prev) => (prev === next && next !== "all" ? "all" : next));
  };

  const stats = {
    total: totalCount,
    answered: answeredCount,
    unanswered: unansweredCount,
  };

  const pinnedTopics = [
    {
      title: t("community.questions.pinned.visa"),
      href: "/life-guide",
    },
    {
      title: t("community.questions.pinned.fail"),
      href: "/education-guide",
    },
    {
      title: t("community.questions.pinned.dorm"),
      href: "/life-guide",
    },
  ];

  return (
    <ProtectedRoute
      fallback={
        <FeaturePreviewGate
          featureName={t("community.questions.featureName")}
          previewTitle={t("community.questions.previewTitle")}
          previewText={t("community.questions.previewText")}
        />
      }
    >
      <Layout>
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header — как AI Helper / Achievements */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <BackButton label={t("templates.back")} />

              <div className="flex flex-row items-center gap-3">
                <div className="rounded-lg bg-indigo-50 p-2.5 sm:p-3 shrink-0">
                  <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                    {t("community.questions.title")}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-0.5">
                    {t("community.questions.subtitle")}
                  </p>
                </div>
                <Button
                  data-testid="open-question-form"
                  onClick={() => {
                    setIsFormVisible(true);
                    requestAnimationFrame(() => {
                      formRef.current?.scrollIntoView({ behavior: "smooth" });
                    });
                  }}
                  className="hidden sm:inline-flex bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md rounded-xl h-10 px-4 shrink-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("community.questions.ask")}
                </Button>
              </div>

              <Button
                data-testid="open-question-form-mobile"
                onClick={() => {
                  setIsFormVisible(true);
                  requestAnimationFrame(() => {
                    formRef.current?.scrollIntoView({ behavior: "smooth" });
                  });
                }}
                className="sm:hidden w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md rounded-xl h-10"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("community.questions.ask")}
              </Button>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMineOnly(false);
                    setStatusFilter("all");
                  }}
                  className={`rounded-xl border-2 px-2 sm:px-4 py-2.5 sm:py-3 text-center transition-all ${
                    statusFilter === "all" && !mineOnly
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="text-lg sm:text-2xl font-bold text-gray-900">
                    {stats.total}
                  </div>
                  <div className="text-[11px] sm:text-xs text-gray-500">
                    {t("community.questions.stats.total")}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterFromStat("answered")}
                  className={`rounded-xl border-2 px-2 sm:px-4 py-2.5 sm:py-3 text-center transition-all ${
                    statusFilter === "answered" && !mineOnly
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="text-lg sm:text-2xl font-bold text-emerald-700">
                    {stats.answered}
                  </div>
                  <div className="text-[11px] sm:text-xs text-gray-500">
                    {t("community.questions.stats.answered")}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterFromStat("unanswered")}
                  className={`rounded-xl border-2 px-2 sm:px-4 py-2.5 sm:py-3 text-center transition-all ${
                    statusFilter === "unanswered" && !mineOnly
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="text-lg sm:text-2xl font-bold text-amber-700">
                    {stats.unanswered}
                  </div>
                  <div className="text-[11px] sm:text-xs text-gray-500">
                    {t("community.questions.stats.waiting")}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Search + filters */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("community.questions.searchPlaceholder")}
                aria-label={t("community.questions.searchAria")}
                data-testid="questions-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-10 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-shadow"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label={t("community.questions.clearSearch")}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div
                role="tablist"
                aria-label={t("community.questions.filterAria")}
                className="flex flex-1 min-w-0 overflow-x-auto gap-2"
              >
                {(
                  [
                    ["all", "community.questions.filter.all"],
                    ["answered", "community.questions.filter.answered"],
                    ["unanswered", "community.questions.filter.unanswered"],
                  ] as const
                ).map(([value, key]) => {
                  const active = statusFilter === value && !mineOnly;
                  return (
                    <button
                      key={value}
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setMineOnly(false);
                        setStatusFilter(value);
                      }}
                      className={`px-3 py-2 rounded-xl border-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                        active
                          ? "bg-indigo-50 text-indigo-700 border-indigo-400"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {t(key)}
                    </button>
                  );
                })}
                <button
                  role="tab"
                  aria-selected={mineOnly}
                  onClick={() => {
                    setMineOnly(true);
                    setStatusFilter("all");
                  }}
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                    mineOnly
                      ? "bg-indigo-50 text-indigo-700 border-indigo-400"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <UserRound className="h-3.5 w-3.5" />
                  {t("community.questions.filter.mine")}
                </button>
              </div>

              <div
                role="tablist"
                aria-label={t("community.questions.sortAria")}
                className="flex gap-2"
              >
                <button
                  role="tab"
                  aria-selected={activeSort === "popular"}
                  onClick={() => setActiveSort("popular")}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs sm:text-sm font-medium transition-all ${
                    activeSort === "popular"
                      ? "bg-blue-50 text-blue-700 border-blue-400"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">
                    {t("community.questions.sort.popular")}
                  </span>
                  <span className="xs:hidden">
                    {t("community.questions.sort.popularShort")}
                  </span>
                </button>
                <button
                  role="tab"
                  aria-selected={activeSort === "new"}
                  onClick={() => setActiveSort("new")}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs sm:text-sm font-medium transition-all ${
                    activeSort === "new"
                      ? "bg-blue-50 text-blue-700 border-blue-400"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">
                    {t("community.questions.sort.new")}
                  </span>
                  <span className="xs:hidden">
                    {t("community.questions.sort.newShort")}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Pinned */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Pin className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                {t("community.questions.pinnedTitle")}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {pinnedTopics.map((topic) => (
                <Link
                  key={topic.title}
                  href={topic.href}
                  className="block rounded-xl border-2 border-indigo-100 bg-indigo-50/60 p-3.5 sm:p-4 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                >
                  <div className="text-sm sm:text-base font-medium text-gray-900">
                    📌 {topic.title}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {isFormVisible && (
            <div
              ref={formRef}
              className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm animate-in slide-in-from-top-4 duration-300"
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />
                    {t("community.questions.form.title")}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {t("community.questions.form.subtitle")}
                  </p>
                </div>
                <button
                  onClick={() => setIsFormVisible(false)}
                  aria-label={t("community.questions.form.close")}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label
                    htmlFor="q-title"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5"
                  >
                    {t("community.questions.form.titleLabel")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="q-title"
                    name="title"
                    data-testid="question-form-title"
                    value={formData.title}
                    onChange={handleFormChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t(
                      "community.questions.form.titlePlaceholder",
                    )}
                    required
                    minLength={5}
                    maxLength={200}
                  />
                  <div className="mt-1 text-right text-xs text-gray-400">
                    {formData.title.length}/200
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="q-desc"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5"
                  >
                    {t("community.questions.form.descLabel")}{" "}
                    <span className="text-gray-400">
                      {t("community.questions.form.optional")}
                    </span>
                  </label>
                  <textarea
                    id="q-desc"
                    name="description"
                    data-testid="question-form-description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder={t(
                      "community.questions.form.descPlaceholder",
                    )}
                    maxLength={2000}
                  />
                  <div className="mt-1 text-right text-xs text-gray-400">
                    {formData.description.length}/2000
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 sm:gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFormVisible(false)}
                    className="rounded-xl"
                  >
                    {t("community.questions.form.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    data-testid="question-form-submit"
                    disabled={isSubmitting || !formData.title.trim()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-4 sm:px-6 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("community.questions.form.submitting")}
                      </>
                    ) : (
                      t("community.questions.form.submit")
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {!isLoading && (
            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 shadow-sm text-center">
                  <Users className="h-14 w-14 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {searchQuery
                      ? t("community.questions.emptySearch.title")
                      : mineOnly || statusFilter !== "all"
                        ? t("community.questions.emptySearch.title")
                        : t("community.questions.empty.title")}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchQuery || mineOnly || statusFilter !== "all"
                      ? t("community.questions.emptySearch.desc")
                      : t("community.questions.empty.desc")}
                  </p>
                  {!searchQuery && statusFilter === "all" && !mineOnly && (
                    <Button
                      onClick={() => setIsFormVisible(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("community.questions.askFirst")}
                    </Button>
                  )}
                </div>
              ) : (
                questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    id={question.id}
                    title={question.title}
                    description={question.description}
                    answers={expandedAnswers[question.id]}
                    answersCount={question.answersCount}
                    likesCount={question.likesCount}
                    author={question.author}
                    authorId={question.authorId}
                    createdAt={question.createdAt}
                    isAnswered={question.isAnswered}
                    acceptedAnswerId={question.acceptedAnswerId}
                    isExpanded={expandedQuestionId === question.id}
                    onToggle={() => handleToggleAnswers(question.id)}
                    onLike={() => handleLike(question.id)}
                    onAddAnswer={(content) =>
                      handleAddAnswer(question.id, content)
                    }
                    onDelete={() => handleDelete(question.id)}
                    onAcceptAnswer={(answerId) =>
                      handleAcceptAnswer(question.id, answerId)
                    }
                    onUpdateAnswer={(answerId, content) =>
                      handleUpdateAnswer(question.id, answerId, content)
                    }
                    onDeleteAnswer={(answerId) =>
                      handleDeleteAnswer(question.id, answerId)
                    }
                    isLiked={!!likedQuestions[question.id]}
                    isLoadingAnswers={loadingAnswers[question.id]}
                    isOwner={user?.id === question.authorId}
                    currentUserId={user?.id}
                  />
                ))
              )}
            </div>
          )}

          {!isLoading && hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                data-testid="questions-load-more"
                className="rounded-xl px-8"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("community.questions.loading")}
                  </>
                ) : (
                  t("community.questions.loadMore")
                )}
              </Button>
            </div>
          )}

          {!isLoading && questions.length > 0 && (
            <p className="text-center text-sm text-gray-400">
              {t("community.questions.tip")}
            </p>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
