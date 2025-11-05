"use client";

import { Guide } from "@/types";
import { X, Clock, Tag, BookOpen } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { useEffect } from "react";

interface GuideDetailModalProps {
  guide: Guide | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GuideDetailModal({
  guide,
  isOpen,
  onClose,
}: GuideDetailModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!guide || !isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-0"
      onClick={onClose}
    >
      {/* Overlay with backdrop blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <Card
        className="relative z-10 w-full h-full max-h-full flex flex-col rounded-none shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b pb-3 pt-4 flex-shrink-0 bg-white sticky top-0 z-20">
          <div className="flex items-start justify-between gap-3 pr-2">
            <CardTitle className="text-lg font-bold text-gray-900 pr-2 flex-1 break-words">
              {guide.title}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 flex-shrink-0 hover:bg-gray-100 active:bg-gray-200 transition-colors relative z-30"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4 overflow-y-auto flex-1">
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>{formatDate(guide.updatedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-3 w-3" />
              <span>
                {guide.category === "EDUCATION"
                  ? "Образование"
                  : guide.category === "LIFE"
                  ? "Быт"
                  : "Прочее"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-3 w-3" />
              <span>
                {guide.difficulty === "BEGINNER"
                  ? "Начальный"
                  : guide.difficulty === "INTERMEDIATE"
                  ? "Средний"
                  : "Продвинутый"}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="prose max-w-none prose-sm">
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {guide.content}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {guide.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
