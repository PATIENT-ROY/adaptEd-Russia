"use client";

import { Guide } from "@/types";
import { X, Clock, Tag, BookOpen } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { useEffect } from "react";

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
            <div 
              className="text-sm text-gray-700 leading-relaxed whitespace-pre-line"
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
