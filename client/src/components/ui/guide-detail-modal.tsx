"use client";

import { Guide } from "@/types";
import { X, Clock, Tag, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { useEffect, useState } from "react";

// Функция для обработки markdown
function formatMarkdown(text: string): string {
  if (!text) return "";
  
  let html = text;
  
  // Экранирование HTML для безопасности
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Обработка заголовков
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>');
  
  // Обработка жирного текста **текст** (должно быть до обработки списков)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  
  // Обработка списков с маркерами • (должно быть после обработки жирного)
  html = html.replace(/^• (.*$)/gim, '<li class="ml-4 mb-1">$1</li>');
  
  // Разделение на строки для обработки
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (!trimmed) {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push('');
      continue;
    }
    
    // Если это элемент списка
    if (trimmed.startsWith('<li')) {
      if (!inList) {
        processedLines.push('<ul class="list-disc ml-6 my-2 space-y-1">');
        inList = true;
      }
      processedLines.push(line);
    } 
    // Если это заголовок
    else if (trimmed.startsWith('<h')) {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(line);
    }
    // Обычный текст
    else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(`<p class="mb-3">${trimmed}</p>`);
    }
  }
  
  if (inList) {
    processedLines.push('</ul>');
  }
  
  html = processedLines.join('\n');
  
  return html;
}

function extractQuickPoints(content: string): string[] {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const bulletPoints = lines
    .filter((line) => line.startsWith("• "))
    .map((line) => line.replace(/^•\s*/, ""))
    .filter((line) => line.length > 8);

  if (bulletPoints.length > 0) {
    return bulletPoints.slice(0, 5);
  }

  const plainText = content
    .replace(/[#*_`]/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return plainText
    .split(/[.!?]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12)
    .slice(0, 4);
}

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
  const [showQuickSummary, setShowQuickSummary] = useState(true);

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

  useEffect(() => {
    if (isOpen) {
      setShowQuickSummary(true);
    }
  }, [isOpen, guide?.id]);

  if (!guide || !isOpen) return null;
  const quickPoints = extractQuickPoints(guide.content);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <Card
        className="relative z-10 w-[min(96vw,56rem)] max-w-4xl max-h-[88vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-fade-in no-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b pb-4 pt-5 px-5 sm:px-6 flex-shrink-0 bg-white sticky top-0 z-20">
          <div className="flex items-start justify-between gap-3 pr-2">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 pr-2 flex-1 break-words leading-tight">
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

        <CardContent className="space-y-5 p-5 sm:p-6 overflow-y-auto flex-1">
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{formatDate(guide.updatedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>
                {guide.category === "EDUCATION"
                  ? "Образование"
                  : guide.category === "LIFE"
                  ? "Быт"
                  : "Прочее"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span>
                {guide.difficulty === "BEGINNER"
                  ? "Начальный"
                  : guide.difficulty === "INTERMEDIATE"
                  ? "Средний"
                  : "Продвинутый"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Актуальность: материалы пересмотрены в 2026 году. Нормы, пошлины и сроки могут отличаться по региону и вузу, проверяйте официальные источники (вуз, Госуслуги, МВД, ФНС, СФР).
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Button
              type="button"
              variant="ghost"
              className="mb-2 h-auto w-full justify-between px-0 py-0 text-left hover:bg-transparent"
              onClick={() => setShowQuickSummary((prev) => !prev)}
            >
              {showQuickSummary ? (
                <>
                  <span className="text-sm font-semibold text-slate-900">
                    Кратко и понятно
                  </span>
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span className="text-sm font-semibold text-slate-900">
                    Показать краткое summary
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
            {showQuickSummary && (
              <ul className="list-disc ml-5 space-y-1.5 text-sm text-slate-800">
                {quickPoints.map((point, index) => (
                  <li key={`${guide.id}-quick-${index}`}>{point}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Content */}
          <div className="prose max-w-none prose-sm sm:prose-base">
            <div
              className="text-[15px] sm:text-base text-gray-700 leading-7 whitespace-pre-line"
              dangerouslySetInnerHTML={{
                __html: formatMarkdown(guide.content)
              }}
            />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {guide.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
