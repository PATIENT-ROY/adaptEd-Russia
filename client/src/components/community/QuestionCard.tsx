"use client";

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
} from "lucide-react";

type QuestionCardProps = {
  title: string;
  description?: string;
  answersCount: number;
  likesCount: number;
  answers?: string[];
  author: string;
  time: string;
  isAnswered?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onLike?: () => void;
  isLiked?: boolean;
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
  isLiked = false,
}: QuestionCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <Badge variant={isAnswered ? "success" : "info"} size="sm">
            {isAnswered ? "Есть ответ" : "Открыт"}
          </Badge>
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && (
          <CardDescription className="text-sm">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors"
            >
              <MessageSquare className="h-3 w-3" />
              {answersCount} ответов
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            <Button
              type="button"
              variant={isLiked ? "secondary" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onLike}
            >
              <ThumbsUp className="h-3 w-3 mr-1" />
              {likesCount}
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <span>{author}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {time}
            </span>
          </div>
        </div>
        {isExpanded && answers && answers.length > 0 && (
          <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 text-sm text-slate-700">
            {answers.map((answer, index) => (
              <div
                key={`${title}-${index}`}
                className="bg-slate-50 rounded-lg px-3 py-2"
              >
                {answer}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
