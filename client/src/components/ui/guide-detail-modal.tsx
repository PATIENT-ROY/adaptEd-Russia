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
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-6 md:p-8"
      onClick={onClose}
    >
      {/* Overlay with backdrop blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <Card
        className="relative z-10 w-full h-full sm:h-auto sm:max-w-[88%] md:max-w-[80%] lg:max-w-4xl xl:max-w-5xl max-h-full sm:max-h-[85vh] md:max-h-[88vh] overflow-y-auto rounded-none sm:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b pb-3 pt-4 sm:pt-6 md:pt-8">
          <div className="flex items-start justify-between gap-3 pr-2 sm:pr-0">
            <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 pr-2 sm:pr-4 flex-1 break-words">
              {guide.title}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 md:space-y-8 p-4 sm:p-6 md:p-8 lg:p-10">
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm md:text-base text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              <span>{formatDate(guide.updatedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              <span>
                {guide.category === "EDUCATION"
                  ? "Образование"
                  : guide.category === "LIFE"
                  ? "Быт"
                  : "Прочее"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
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
          <div className="prose max-w-none prose-sm sm:prose-base md:prose-lg">
            <div className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed whitespace-pre-line">
              {guide.content}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 md:gap-3">
            {guide.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 sm:px-3 md:px-4 py-1 md:py-2 rounded-full bg-blue-50 text-blue-700 text-xs sm:text-sm md:text-base font-medium hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <Tag className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
