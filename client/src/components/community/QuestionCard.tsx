"use client";

import { useState } from "react";
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
  User,
  Sparkles,
} from "lucide-react";
import type { Answer } from "@/hooks/useQuestions";

type QuestionCardProps = {
  id: string;
  title: string;
  description?: string;
  answersCount: number;
  likesCount: number;
  answers?: Answer[];
  author: string;
  time: string;
  isAnswered?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onLike?: () => void;
  onAddAnswer?: (content: string) => Promise<void>;
  isLiked?: boolean;
  isLoadingAnswers?: boolean;
};

export function QuestionCard({
  title,
  description,
  answersCount,
  likesCount,
  answers,
  author,
  time,
  isAnswered = false,
  isExpanded = false,
  onToggle,
  onLike,
  onAddAnswer,
  isLiked = false,
  isLoadingAnswers = false,
}: QuestionCardProps) {
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <Card className="relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50">
      
      <CardHeader className="p-3 sm:p-4 lg:p-6 pb-2 sm:pb-3">
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          <Badge 
            variant={isAnswered ? "success" : "info"} 
            size="sm"
            className={`text-[10px] sm:text-xs ${isAnswered 
              ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
              : "bg-amber-100 text-amber-700 border-amber-200"
            }`}
          >
            {isAnswered ? (
              <>
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                Есть ответ
              </>
            ) : (
              "Открыт"
            )}
          </Badge>
          {answersCount >= 3 && (
            <Badge variant="outline" size="sm" className="text-[10px] sm:text-xs bg-purple-50 text-purple-600 border-purple-200">
              🔥 Популярный
            </Badge>
          )}
        </div>
        <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900 leading-tight mt-1.5 sm:mt-2">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
        {/* Actions row - stack on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium text-slate-600 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
            >
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{answersCount}</span>
              <span className="hidden xs:inline">
                {answersCount === 1 ? "ответ" : answersCount < 5 ? "ответа" : "ответов"}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </button>
            <Button
              type="button"
              variant={isLiked ? "default" : "outline"}
              size="sm"
              className={`h-7 sm:h-8 px-2 sm:px-3 rounded-full transition-all text-xs sm:text-sm ${
                isLiked 
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-md shadow-pink-200" 
                  : "hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200"
              }`}
              onClick={onLike}
            >
              <ThumbsUp className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
              {likesCount}
            </Button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-500">
            <span className="inline-flex items-center gap-1 sm:gap-1.5 font-medium">
              <User className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-400" />
              <span className="truncate max-w-[80px] sm:max-w-none">{author}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="truncate">{time}</span>
            </span>
          </div>
        </div>

        {/* Expanded section with answers */}
        {isExpanded && (
          <div className="mt-4 sm:mt-5 space-y-3 sm:space-y-4 border-t border-slate-100 pt-4 sm:pt-5">
            {isLoadingAnswers ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-indigo-600" />
                <span className="ml-2 text-xs sm:text-sm text-slate-500">Загрузка...</span>
              </div>
            ) : answers && answers.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1.5 sm:gap-2">
                  <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500" />
                  Ответы ({answers.length})
                </h4>
                {answers.map((answer) => (
                  <div
                    key={answer.id}
                    className="relative bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-700 border border-slate-100"
                  >
                    <p className="leading-relaxed">{answer.content}</p>
                    <div className="mt-1.5 sm:mt-2 flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-400">
                      <span className="font-medium text-slate-500">{answer.author}</span>
                      <span>•</span>
                      <span>{answer.timeLabel}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 sm:py-6 text-slate-400">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1.5 sm:mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">Пока нет ответов. Будьте первым!</p>
              </div>
            )}

            {/* Answer form */}
            {onAddAnswer && (
              <form onSubmit={handleSubmitAnswer} className="mt-3 sm:mt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Напишите ответ..."
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white placeholder:text-slate-400 transition-shadow"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!answerText.trim() || isSubmitting}
                    className="px-3 sm:px-4 h-9 sm:h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg sm:rounded-xl shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
