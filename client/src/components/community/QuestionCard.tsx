"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  ThumbsUp,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
  Sparkles,
  Trash2,
  CheckCircle2,
  Pencil,
  ExternalLink,
} from "lucide-react";
import type { Answer } from "@/hooks/useQuestions";
import { useTranslation } from "@/hooks/useTranslation";
import {
  formatAnswersCountLabel,
  formatRelativeTime,
} from "@/lib/community-i18n";

type QuestionCardProps = {
  id: string;
  title: string;
  description?: string;
  answersCount: number;
  likesCount: number;
  answers?: Answer[];
  author: string;
  authorId?: string;
  createdAt: number;
  isAnswered?: boolean;
  acceptedAnswerId?: string | null;
  isExpanded?: boolean;
  onToggle?: () => void;
  onLike?: () => void;
  onAddAnswer?: (content: string) => Promise<void>;
  onDelete?: () => void;
  onAcceptAnswer?: (answerId: string) => Promise<void>;
  onUpdateAnswer?: (answerId: string, content: string) => Promise<void>;
  onDeleteAnswer?: (answerId: string) => Promise<void>;
  isLiked?: boolean;
  isLoadingAnswers?: boolean;
  isOwner?: boolean;
  currentUserId?: string;
  /** When true, title is not a link (detail page) */
  hideDetailLink?: boolean;
  /** Show full description (detail page) */
  fullDescription?: boolean;
  /** Hide card title (shown in page header on detail) */
  hideTitle?: boolean;
};

function AuthorAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="inline-flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-indigo-100 text-indigo-600 text-[10px] sm:text-xs font-semibold flex-shrink-0">
      {initials}
    </span>
  );
}

export function QuestionCard({
  id,
  title,
  description,
  answersCount,
  likesCount,
  answers,
  author,
  createdAt,
  isAnswered = false,
  acceptedAnswerId,
  isExpanded = false,
  onToggle,
  onLike,
  onAddAnswer,
  onDelete,
  onAcceptAnswer,
  onUpdateAnswer,
  onDeleteAnswer,
  isLiked = false,
  isLoadingAnswers = false,
  isOwner = false,
  currentUserId,
  hideDetailLink = false,
  fullDescription = false,
  hideTitle = false,
}: QuestionCardProps) {
  const { t, currentLanguage } = useTranslation();
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [confirmAnswerDelete, setConfirmAnswerDelete] = useState<string | null>(
    null,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [answerText]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() || !onAddAnswer) return;

    setIsSubmitting(true);
    try {
      await onAddAnswer(answerText.trim());
      setAnswerText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    onDelete?.();
  };

  const startEdit = (answer: Answer) => {
    setEditingId(answer.id);
    setEditText(answer.content);
  };

  const saveEdit = async () => {
    if (!editingId || !editText.trim() || !onUpdateAnswer) return;
    setIsSubmitting(true);
    try {
      await onUpdateAnswer(editingId, editText.trim());
      setEditingId(null);
      setEditText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    if (confirmAnswerDelete !== answerId) {
      setConfirmAnswerDelete(answerId);
      setTimeout(() => setConfirmAnswerDelete(null), 3000);
      return;
    }
    await onDeleteAnswer?.(answerId);
    setConfirmAnswerDelete(null);
  };

  const timeLabel = formatRelativeTime(createdAt, t, currentLanguage);
  const answersWord = formatAnswersCountLabel(
    answersCount,
    t,
    currentLanguage,
  );

  const sortedAnswers = answers
    ? [...answers].sort((a, b) => {
        const aBest = a.isAccepted || a.id === acceptedAnswerId;
        const bBest = b.isAccepted || b.id === acceptedAnswerId;
        return Number(bBest) - Number(aBest);
      })
    : undefined;

  return (
    <Card
      data-testid={`question-card-${id}`}
      className="relative overflow-hidden border-0 bg-white rounded-2xl sm:rounded-3xl shadow-sm"
    >
      <CardHeader className="p-3 sm:p-4 lg:p-6 pb-2 sm:pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
            <Badge
              variant={isAnswered ? "success" : "info"}
              size="sm"
              className={`text-xs ${
                isAnswered
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : "bg-amber-100 text-amber-700 border-amber-200"
              }`}
            >
              {isAnswered ? (
                <>
                  <Sparkles className="w-3 h-3 mr-0.5 sm:mr-1" />
                  {t("community.questions.badge.answered")}
                </>
              ) : (
                t("community.questions.badge.open")
              )}
            </Badge>
            {answersCount >= 3 && (
              <Badge
                variant="outline"
                size="sm"
                className="text-xs bg-purple-50 text-purple-600 border-purple-200"
              >
                {t("community.questions.badge.popular")}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!hideDetailLink && (
              <Link
                href={`/community/questions/${id}`}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title={t("community.questions.openDetail")}
                aria-label={t("community.questions.openDetail")}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
            {isOwner && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                data-testid={`question-delete-${id}`}
                className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 ${
                  confirmDelete
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                }`}
                title={
                  confirmDelete
                    ? t("community.questions.deleteConfirm")
                    : t("community.questions.delete")
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
                {confirmDelete && (
                  <span>{t("community.questions.deleteConfirmShort")}</span>
                )}
              </button>
            )}
          </div>
        </div>
        {!hideTitle && (
          <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900 leading-tight mt-1.5 sm:mt-2">
            {hideDetailLink ? (
              title
            ) : (
              <Link
                href={`/community/questions/${id}`}
                className="hover:text-indigo-700 transition-colors"
              >
                {title}
              </Link>
            )}
          </CardTitle>
        )}
        {description && (
          <CardDescription
            className={`text-xs sm:text-sm text-slate-600 ${
              hideTitle ? "mt-0" : "mt-1"
            } ${fullDescription ? "" : "line-clamp-2"}`}
          >
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            {onToggle && (
              <button
                type="button"
                onClick={onToggle}
                aria-expanded={isExpanded}
                data-testid={`question-toggle-${id}`}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium text-slate-600 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
              >
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{answersCount}</span>
                <span className="hidden xs:inline">{answersWord}</span>
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </button>
            )}
            {!onToggle && (
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium text-slate-600 bg-slate-100">
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{answersCount}</span>
                <span className="hidden xs:inline">{answersWord}</span>
              </span>
            )}
            <Button
              type="button"
              variant={isLiked ? "default" : "outline"}
              size="sm"
              data-testid={`question-like-${id}`}
              className={`h-7 sm:h-8 px-2 sm:px-3 rounded-full transition-all text-xs sm:text-sm ${
                isLiked
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-md shadow-pink-200"
                  : "hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200"
              }`}
              onClick={onLike}
            >
              <ThumbsUp
                className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${isLiked ? "fill-current" : ""}`}
              />
              {likesCount}
            </Button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-500">
            <span className="inline-flex items-center gap-1 sm:gap-1.5 font-medium">
              <AuthorAvatar name={author} />
              <span className="truncate max-w-[100px] sm:max-w-none">
                {author}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="truncate">{timeLabel}</span>
            </span>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 sm:mt-5 space-y-3 sm:space-y-4 border-t border-slate-100 pt-4 sm:pt-5">
            {isLoadingAnswers ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-indigo-600" />
                <span className="ml-2 text-xs sm:text-sm text-slate-500">
                  {t("community.questions.loading")}
                </span>
              </div>
            ) : sortedAnswers && sortedAnswers.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1.5 sm:gap-2">
                  <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500" />
                  {t("community.questions.answersTitle").replace(
                    "{n}",
                    String(sortedAnswers.length),
                  )}
                </h4>
                {sortedAnswers.map((answer) => {
                  const isBest =
                    answer.isAccepted || answer.id === acceptedAnswerId;
                  const isAnswerOwner = currentUserId === answer.authorId;
                  const canDeleteAnswer =
                    isAnswerOwner || isOwner;

                  return (
                    <div
                      key={answer.id}
                      className={`relative rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-700 border shadow-sm ${
                        isBest
                          ? "bg-gradient-to-br from-emerald-50 via-white to-indigo-50/40 border-emerald-200 shadow-emerald-100/60"
                          : "bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-100"
                      }`}
                    >
                      {isBest && (
                        <div className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-white shadow-sm shadow-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {t("community.questions.bestAnswer")}
                        </div>
                      )}
                      {editingId === answer.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs rounded-lg"
                              onClick={() => setEditingId(null)}
                            >
                              {t("community.questions.form.cancel")}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="h-7 text-xs rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-md"
                              disabled={!editText.trim() || isSubmitting}
                              onClick={saveEdit}
                            >
                              {t("community.questions.saveAnswer")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="leading-relaxed whitespace-pre-wrap">
                          {answer.content}
                        </p>
                      )}
                      <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400">
                        <AuthorAvatar name={answer.author} />
                        <span className="font-medium text-slate-500">
                          {answer.author}
                        </span>
                        <span>&middot;</span>
                        <span>
                          {formatRelativeTime(
                            answer.createdAt,
                            t,
                            currentLanguage,
                          )}
                        </span>
                        <span className="flex-1" />
                        {isOwner && onAcceptAnswer && editingId !== answer.id && (
                          <button
                            type="button"
                            onClick={() => onAcceptAnswer(answer.id)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium transition-all ${
                              isBest
                                ? "text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm shadow-emerald-200"
                                : "text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100"
                            }`}
                            title={t("community.questions.acceptAnswer")}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">
                              {isBest
                                ? t("community.questions.unacceptAnswer")
                                : t("community.questions.acceptAnswer")}
                            </span>
                          </button>
                        )}
                        {isAnswerOwner &&
                          onUpdateAnswer &&
                          editingId !== answer.id && (
                            <button
                              type="button"
                              onClick={() => startEdit(answer)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title={t("community.questions.editAnswer")}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                        {canDeleteAnswer &&
                          onDeleteAnswer &&
                          editingId !== answer.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAnswer(answer.id)}
                              className={`inline-flex items-center gap-1 p-1.5 rounded-lg text-xs transition-colors ${
                                confirmAnswerDelete === answer.id
                                  ? "bg-red-100 text-red-600"
                                  : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                              }`}
                              title={t("community.questions.deleteAnswer")}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {confirmAnswerDelete === answer.id && (
                                <span>
                                  {t("community.questions.deleteConfirmShort")}
                                </span>
                              )}
                            </button>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 sm:py-6 text-slate-400">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1.5 sm:mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">
                  {t("community.questions.noAnswers")}
                </p>
              </div>
            )}

            {onAddAnswer && (
              <form onSubmit={handleSubmitAnswer} className="mt-3 sm:mt-4">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={textareaRef}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    data-testid={`question-answer-input-${id}`}
                    placeholder={t("community.questions.answerPlaceholder")}
                    rows={1}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white placeholder:text-slate-400 transition-shadow resize-none overflow-hidden"
                    disabled={isSubmitting}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (answerText.trim()) handleSubmitAnswer(e);
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    data-testid={`question-answer-submit-${id}`}
                    disabled={!answerText.trim() || isSubmitting}
                    className="px-3 sm:px-4 h-9 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-white" />
                    ) : (
                      <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
