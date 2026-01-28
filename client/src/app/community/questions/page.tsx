"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/community/QuestionCard";
import { useQuestions, type Answer } from "@/hooks/useQuestions";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
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
} from "lucide-react";

export default function CommunityQuestionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    questions,
    isLoading,
    error,
    fetchQuestions,
    fetchQuestion,
    createQuestion,
    addAnswer,
    likeQuestion,
    unlikeQuestion,
  } = useQuestions();

  const [activeSort, setActiveSort] = useState<"popular" | "new">("popular");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [likedQuestions, setLikedQuestions] = useState<Record<string, boolean>>({});
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, Answer[]>>({});
  const [loadingAnswers, setLoadingAnswers] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement | null>(null);

  // Загрузка вопросов при монтировании и смене сортировки
  useEffect(() => {
    fetchQuestions(activeSort);
  }, [activeSort, fetchQuestions]);

  // Фильтрация по поиску
  const filteredQuestions = questions.filter((q) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      q.title.toLowerCase().includes(query) ||
      q.description?.toLowerCase().includes(query) ||
      q.author.toLowerCase().includes(query)
    );
  });

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
      setActiveSort("new"); // Переключаемся на новые чтобы увидеть свой вопрос
    }
  };

  const handleToggleAnswers = useCallback(async (questionId: string) => {
    if (expandedQuestionId === questionId) {
      setExpandedQuestionId(null);
      return;
    }

    setExpandedQuestionId(questionId);

    // Загружаем ответы если ещё не загружены
    if (!expandedAnswers[questionId]) {
      setLoadingAnswers((prev) => ({ ...prev, [questionId]: true }));
      const detail = await fetchQuestion(questionId);
      if (detail) {
        setExpandedAnswers((prev) => ({ ...prev, [questionId]: detail.answers }));
        // Проверяем лайки пользователя
        if (user && detail.likedByUserIds.includes(user.id)) {
          setLikedQuestions((prev) => ({ ...prev, [questionId]: true }));
        }
      }
      setLoadingAnswers((prev) => ({ ...prev, [questionId]: false }));
    }
  }, [expandedQuestionId, expandedAnswers, fetchQuestion, user]);

  const handleLike = useCallback(async (questionId: string) => {
    const isCurrentlyLiked = likedQuestions[questionId];

    // Оптимистичное обновление UI
    setLikedQuestions((prev) => ({ ...prev, [questionId]: !isCurrentlyLiked }));

    const result = isCurrentlyLiked
      ? await unlikeQuestion(questionId)
      : await likeQuestion(questionId);

    // Откатываем если ошибка
    if (!result) {
      setLikedQuestions((prev) => ({ ...prev, [questionId]: isCurrentlyLiked }));
    }
  }, [likedQuestions, likeQuestion, unlikeQuestion]);

  const handleAddAnswer = useCallback(async (questionId: string, content: string) => {
    const answer = await addAnswer(questionId, content);
    if (answer) {
      setExpandedAnswers((prev) => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), answer],
      }));
    }
  }, [addAnswer]);

  const stats = {
    total: questions.length,
    answered: questions.filter((q) => q.isAnswered).length,
    unanswered: questions.filter((q) => !q.isAnswered).length,
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl sm:rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-4 sm:my-6 lg:my-8 overflow-hidden">
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl sm:rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-4 sm:mt-6 mb-6 sm:mb-8 lg:mb-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NCAwLTE4IDguMDYtMTggMThzOC4wNiAxOCAxOCAxOCAxOC04LjA2IDE4LTE4LTguMDYtMTgtMTgtMTh6bTAgMzJjLTcuNzMyIDAtMTQtNi4yNjgtMTQtMTRzNi4yNjgtMTQgMTQtMTQgMTQgNi4yNjggMTQgMTQtNi4yNjggMTQtMTQgMTR6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-30" />
            <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-8 sm:py-12">
              <Button
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10 mb-6"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>

              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <MessageCircle className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white">
                      Сообщество
                    </h1>
                  </div>
                  <p className="text-lg text-white/80 max-w-xl">
                    Задавайте вопросы, делитесь опытом и помогайте друг другу.
                    Студенты, кураторы и администрация всегда готовы помочь.
                  </p>
                </div>

                {/* Stats cards */}
                <div className="flex gap-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[80px]">
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                    <div className="text-xs text-white/70">вопросов</div>
                  </div>
                  <div className="bg-emerald-500/30 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[80px]">
                    <div className="text-2xl font-bold text-white">{stats.answered}</div>
                    <div className="text-xs text-white/70">с ответами</div>
                  </div>
                  <div className="bg-amber-500/30 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[80px]">
                    <div className="text-2xl font-bold text-white">{stats.unanswered}</div>
                    <div className="text-xs text-white/70">ждут ответа</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Поиск вопросов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Sort tabs */}
              <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                <button
                  onClick={() => setActiveSort("popular")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeSort === "popular"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  Популярные
                </button>
                <button
                  onClick={() => setActiveSort("new")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeSort === "new"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  Новые
                </button>
              </div>

              {/* Ask question button */}
              <Button
                onClick={() => {
                  setIsFormVisible(true);
                  requestAnimationFrame(() => {
                    formRef.current?.scrollIntoView({ behavior: "smooth" });
                  });
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 rounded-xl px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Задать вопрос
              </Button>
            </div>

            {/* Question Form */}
            {isFormVisible && (
              <div
                ref={formRef}
                className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 mb-8 animate-in slide-in-from-top-4 duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-500" />
                      Новый вопрос
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Опишите свой вопрос — сообщество обязательно поможет!
                    </p>
                  </div>
                  <button
                    onClick={() => setIsFormVisible(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Заголовок <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                      placeholder="Кратко сформулируйте вопрос"
                      required
                      minLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Описание <span className="text-slate-400">(опционально)</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-shadow"
                      placeholder="Добавьте детали, контекст, что уже пробовали..."
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsFormVisible(false)}
                      className="rounded-xl"
                    >
                      Отмена
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !formData.title.trim()}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-200 rounded-xl px-6 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Публикуем...
                        </>
                      ) : (
                        "Опубликовать"
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <span className="ml-3 text-slate-600">Загрузка вопросов...</span>
              </div>
            )}

            {/* Questions List */}
            {!isLoading && (
              <div className="space-y-4">
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">
                      {searchQuery ? "Ничего не найдено" : "Пока нет вопросов"}
                    </h3>
                    <p className="text-slate-500 mb-6">
                      {searchQuery
                        ? "Попробуйте изменить поисковый запрос"
                        : "Станьте первым, кто задаст вопрос сообществу!"}
                    </p>
                    {!searchQuery && (
                      <Button
                        onClick={() => setIsFormVisible(true)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Задать первый вопрос
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredQuestions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      id={question.id}
                      title={question.title}
                      description={question.description}
                      answers={expandedAnswers[question.id]}
                      answersCount={question.answersCount}
                      likesCount={question.likesCount}
                      author={question.author}
                      time={question.timeLabel}
                      isAnswered={question.isAnswered}
                      isExpanded={expandedQuestionId === question.id}
                      onToggle={() => handleToggleAnswers(question.id)}
                      onLike={() => handleLike(question.id)}
                      onAddAnswer={(content) => handleAddAnswer(question.id, content)}
                      isLiked={!!likedQuestions[question.id]}
                      isLoadingAnswers={loadingAnswers[question.id]}
                    />
                  ))
                )}
              </div>
            )}

            {/* Footer hint */}
            {!isLoading && filteredQuestions.length > 0 && (
              <p className="text-center text-sm text-slate-400 mt-8">
                💡 Совет: отвечайте на вопросы других — это помогает всему сообществу!
              </p>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
