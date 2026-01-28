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
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge 
              variant={isAnswered ? "success" : "info"} 
              size="sm"
              className={isAnswered 
                ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                : "bg-amber-100 text-amber-700 border-amber-200"
              }
            >
              {isAnswered ? (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  Есть ответ
                </>
              ) : (
                "Открыт"
              )}
            </Badge>
            {answersCount >= 3 && (
              <Badge variant="outline" size="sm" className="bg-purple-50 text-purple-600 border-purple-200">
                🔥 Популярный
              </Badge>
            )}
          </div>
        </div>
        <CardTitle className="text-xl font-semibold text-slate-900 leading-tight mt-2">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-sm text-slate-600 mt-1 line-clamp-2">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-slate-600 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              {answersCount} {answersCount === 1 ? "ответ" : answersCount < 5 ? "ответа" : "ответов"}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <Button
              type="button"
              variant={isLiked ? "default" : "outline"}
              size="sm"
              className={`h-8 px-3 rounded-full transition-all ${
                isLiked 
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-md shadow-pink-200" 
                  : "hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200"
              }`}
              onClick={onLike}
            >
              <ThumbsUp className={`h-4 w-4 mr-1.5 ${isLiked ? "fill-current" : ""}`} />
              {likesCount}
            </Button>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <User className="h-4 w-4 text-indigo-400" />
              {author}
            </span>
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              {time}
            </span>
          </div>
        </div>

        {/* Expanded section with answers */}
        {isExpanded && (
          <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
            {isLoadingAnswers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
                <span className="ml-2 text-slate-500">Загрузка ответов...</span>
              </div>
            ) : answers && answers.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-500" />
                  Ответы ({answers.length})
                </h4>
                {answers.map((answer) => (
                  <div
                    key={answer.id}
                    className="relative bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl px-4 py-3 text-sm text-slate-700 border border-slate-100"
                  >
                    <p className="leading-relaxed">{answer.content}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                      <span className="font-medium text-slate-500">{answer.author}</span>
                      <span>•</span>
                      <span>{answer.timeLabel}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Пока нет ответов. Будьте первым!</p>
              </div>
            )}

            {/* Answer form */}
            {onAddAnswer && (
              <form onSubmit={handleSubmitAnswer} className="mt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Напишите свой ответ..."
                    className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white placeholder:text-slate-400 transition-shadow"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="submit"
                    disabled={!answerText.trim() || isSubmitting}
                    className="px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Send className="h-4 w-4" />
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
