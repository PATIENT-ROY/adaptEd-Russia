"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/community/QuestionCard";
import { ArrowLeft, Plus } from "lucide-react";

type Question = {
  id: string;
  title: string;
  description?: string;
  answers?: string[];
  answersCount: number;
  likesCount: number;
  author: string;
  timeLabel: string;
  createdAt: number;
  isAnswered?: boolean;
};

const initialQuestions: Question[] = [
  {
    id: "q-1",
    title: "Какие шаги для продления регистрации?",
    description: "Нужен список документов и сроки подачи.",
    answers: [
      "Сначала уточните срок действия регистрации и подготовьте копии паспорта, миграционной карты и договора.",
      "В некоторых вузах есть международный отдел, который помогает с подачей.",
    ],
    answersCount: 3,
    likesCount: 12,
    author: "Алина",
    timeLabel: "2 часа назад",
    createdAt: Date.now() - 1000 * 60 * 120,
    isAnswered: true,
  },
  {
    id: "q-2",
    title: "Как перевестись в другой вуз внутри города?",
    description: "Интересует перевод на 2 курс.",
    answers: [
      "Нужно согласие двух вузов, академическая справка и заявление на перевод.",
    ],
    answersCount: 1,
    likesCount: 5,
    author: "Сергей",
    timeLabel: "вчера",
    createdAt: Date.now() - 1000 * 60 * 60 * 28,
  },
  {
    id: "q-3",
    title: "Что делать при угрозе отчисления?",
    description: "Не успел сдать экзамен, нужна инструкция.",
    answers: [],
    answersCount: 0,
    likesCount: 2,
    author: "Мина",
    timeLabel: "сегодня",
    createdAt: Date.now() - 1000 * 60 * 45,
  },
  {
    id: "q-4",
    title: "Как оформить ИНН быстрее?",
    description: "Есть ли онлайн запись?",
    answers: [
      "Запишитесь через Госуслуги или сайт ФНС, так быстрее попасть в окно.",
      "Если у вас есть регистрация, очередь обычно быстрее.",
    ],
    answersCount: 2,
    likesCount: 8,
    author: "Карим",
    timeLabel: "3 дня назад",
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
  },
  {
    id: "q-5",
    title: "Можно ли работать по студенческой визе?",
    description: "Какие ограничения по часам?",
    answers: [
      "Да, но только при наличии разрешения и без нарушений статуса.",
      "Часы зависят от условий вуза и законодательства, уточните в международном отделе.",
    ],
    answersCount: 4,
    likesCount: 15,
    author: "Жак",
    timeLabel: "5 часов назад",
    createdAt: Date.now() - 1000 * 60 * 300,
    isAnswered: true,
  },
];

export default function CommunityQuestionsPage() {
  const router = useRouter();
  const [activeSort, setActiveSort] = useState<"popular" | "new">("popular");
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(
    null
  );
  const [likedQuestions, setLikedQuestions] = useState<Record<string, boolean>>(
    {}
  );
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const formRef = useRef<HTMLDivElement | null>(null);

  const filteredQuestions = useMemo(() => {
    return [...questions].sort((a, b) => {
      if (activeSort === "popular") {
        return b.likesCount - a.likesCount;
      }
      return b.createdAt - a.createdAt;
    });
  }, [activeSort, questions]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const title = formData.title.trim();
    const description = formData.description.trim();
    if (!title) return;

    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      title,
      description: description || undefined,
      answers: [],
      answersCount: 0,
      likesCount: 0,
      author: "Вы",
      timeLabel: "только что",
      createdAt: Date.now(),
    };

    setQuestions((prev) => [newQuestion, ...prev]);
    setFormData({ title: "", description: "" });
    setIsFormVisible(false);
    setExpandedQuestionId(null);
  };

  const handleToggleAnswers = (questionId: string) => {
    setExpandedQuestionId((prev) => (prev === questionId ? null : questionId));
  };

  const handleLike = (questionId: string) => {
    setLikedQuestions((prev) => {
      const nextLiked = !prev[questionId];
      setQuestions((questionList) =>
        questionList.map((question) =>
          question.id === questionId
            ? {
                ...question,
                likesCount: question.likesCount + (nextLiked ? 1 : -1),
              }
            : question
        )
      );
      return { ...prev, [questionId]: nextLiked };
    });
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            className="hover:bg-blue-100"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <Button
            onClick={() => {
              setIsFormVisible(true);
              requestAnimationFrame(() => {
                formRef.current?.scrollIntoView({ behavior: "smooth" });
              });
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            К форме вопроса
          </Button>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Сообщество / живое общение
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Пишите любой вопрос — отвечают студенты, кураторы и администрация.
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Можно общаться свободно: отвечать, уточнять, спорить по делу.
          </p>
        </div>

        {isFormVisible && (
          <div
            ref={formRef}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8"
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Форма вопроса
              </h2>
              <p className="text-sm text-slate-600">
                Любой вопрос — студенты, кураторы и администрация подключатся.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Заголовок *
                </label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Кратко сформулируйте вопрос"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Детали, контекст, что уже пробовали"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full sm:w-auto">
                  Опубликовать
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="grid gap-6">
          {filteredQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              title={question.title}
              description={question.description}
              answers={question.answers}
              answersCount={question.answersCount}
              likesCount={question.likesCount}
              author={question.author}
              time={question.timeLabel}
              isAnswered={question.isAnswered}
              isExpanded={expandedQuestionId === question.id}
              onToggle={() => handleToggleAnswers(question.id)}
              onLike={() => handleLike(question.id)}
              isLiked={!!likedQuestions[question.id]}
            />
          ))}
        </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

