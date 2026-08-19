"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FeaturePreviewGate } from "@/components/auth/FeaturePreviewGate";
import { BackButton } from "@/components/ui/back-button";
import { QuestionCard } from "@/components/community/QuestionCard";
import {
  useQuestions,
  type QuestionDetail,
} from "@/hooks/useQuestions";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { AlertCircle, Loader2, MessageCircle } from "lucide-react";

export default function QuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const { user } = useAuth();
  const { t } = useTranslation();
  const {
    fetchQuestion,
    addAnswer,
    likeQuestion,
    unlikeQuestion,
    deleteQuestion,
    updateAnswer,
    deleteAnswer,
    acceptAnswer,
    error,
  } = useQuestions();

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    const detail = await fetchQuestion(id);
    setQuestion(detail);
    if (detail) {
      setIsLiked(detail.isLikedByCurrentUser);
    }
    setIsLoading(false);
  }, [id, fetchQuestion]);

  useEffect(() => {
    load();
  }, [load]);

  const handleLike = async () => {
    if (!question) return;
    const prev = isLiked;
    setIsLiked(!prev);
    const result = prev
      ? await unlikeQuestion(question.id)
      : await likeQuestion(question.id);
    if (!result) {
      setIsLiked(prev);
      return;
    }
    setQuestion((q) =>
      q
        ? {
            ...q,
            likesCount: result.likesCount,
            isLikedByCurrentUser: result.isLiked,
          }
        : q,
    );
  };

  const handleAddAnswer = async (content: string) => {
    if (!question) return;
    const answer = await addAnswer(question.id, content);
    if (!answer) return;
    setQuestion((q) =>
      q
        ? {
            ...q,
            answers: [...q.answers, { ...answer, isAccepted: false }],
            answersCount: q.answersCount + 1,
            isAnswered: true,
          }
        : q,
    );
  };

  const handleAcceptAnswer = async (answerId: string) => {
    if (!question) return;
    const result = await acceptAnswer(question.id, answerId);
    if (!result) return;
    setQuestion((q) =>
      q
        ? {
            ...q,
            acceptedAnswerId: result.acceptedAnswerId,
            isAnswered: result.isAnswered,
            answers: q.answers.map((a) => ({
              ...a,
              isAccepted: a.id === result.acceptedAnswerId,
            })),
          }
        : q,
    );
  };

  const handleUpdateAnswer = async (answerId: string, content: string) => {
    if (!question) return;
    const updated = await updateAnswer(question.id, answerId, content);
    if (!updated) return;
    setQuestion((q) =>
      q
        ? {
            ...q,
            answers: q.answers.map((a) =>
              a.id === answerId ? { ...a, ...updated } : a,
            ),
          }
        : q,
    );
  };

  const handleDeleteAnswer = async (answerId: string) => {
    if (!question) return;
    const ok = await deleteAnswer(question.id, answerId);
    if (!ok) return;
    setQuestion((q) => {
      if (!q) return q;
      const answers = q.answers.filter((a) => a.id !== answerId);
      return {
        ...q,
        answers,
        answersCount: answers.length,
        isAnswered: answers.length > 0,
        acceptedAnswerId:
          q.acceptedAnswerId === answerId ? null : q.acceptedAnswerId,
      };
    });
  };

  const handleDelete = async () => {
    if (!question) return;
    const ok = await deleteQuestion(question.id);
    if (ok) router.push("/community/questions");
  };

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
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
            <BackButton
              label={t("community.questions.backToList")}
              className="mb-3 sm:mb-4"
              onClick={() => router.push("/community/questions")}
            />
            <div className="flex flex-row items-center gap-3">
              <div className="rounded-lg bg-indigo-50 p-2.5 sm:p-3 shrink-0">
                <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight min-w-0">
                {isLoading
                  ? t("community.questions.loading")
                  : question?.title || t("community.questions.title")}
              </h1>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-16 text-gray-500 bg-white rounded-2xl sm:rounded-3xl shadow-sm">
              <Loader2 className="h-6 w-6 animate-spin mr-2 text-indigo-600" />
              {t("community.questions.loading")}
            </div>
          )}

          {!isLoading && (error || !question) && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error || t("community.questions.notFound")}</p>
            </div>
          )}

          {!isLoading && question && (
            <QuestionCard
              id={question.id}
              title={question.title}
              description={question.description}
              answers={question.answers}
              answersCount={question.answersCount}
              likesCount={question.likesCount}
              author={question.author}
              authorId={question.authorId}
              createdAt={question.createdAt}
              isAnswered={question.isAnswered}
              acceptedAnswerId={question.acceptedAnswerId}
              isExpanded
              hideDetailLink
              fullDescription
              hideTitle
              onLike={handleLike}
              onAddAnswer={handleAddAnswer}
              onDelete={handleDelete}
              onAcceptAnswer={handleAcceptAnswer}
              onUpdateAnswer={handleUpdateAnswer}
              onDeleteAnswer={handleDeleteAnswer}
              isLiked={isLiked}
              isOwner={user?.id === question.authorId}
              currentUserId={user?.id}
            />
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
