import React from "react";
import { Button } from "./button";
import { ArrowRight, BookOpen, Home, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Guide, GuideCategory } from "@/types";
import { formatDate } from "@/lib/date-utils";
import { useRouter } from "next/navigation";
import { GuideDetailModal } from "./guide-detail-modal";
import { GuideCardBase } from "./guide-card-base";

interface GuideCardProps {
  guide: Guide;
  onClick?: () => void;
  className?: string;
}

const categoryIcons = {
  [GuideCategory.EDUCATION]: BookOpen,
  [GuideCategory.LIFE]: Home,
  [GuideCategory.DOCUMENTS]: Clock,
  [GuideCategory.CULTURE]: Home,
  [GuideCategory.LEGAL]: Clock,
  [GuideCategory.OTHER]: BookOpen,
};

export function GuideCard({ guide, onClick, className }: GuideCardProps) {
  const router = useRouter();
  const [showModal, setShowModal] = React.useState(false);
  const Icon = categoryIcons[guide.category];

  const handleReadMore = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Проверяем если это словарь студенческого сленга
    if (
      guide.title.toLowerCase().includes("сленг") ||
      guide.tags.some((tag) => tag.toLowerCase().includes("сленг"))
    ) {
      router.push("/student-slang");
    } else {
      // Для остальных гайдов открываем модальное окно
      setShowModal(true);
    }
  };

  // Обрезаем контент для превью (как на эскизе "Тут будет подсказка что в нутри...")
  // Убираем markdown синтаксис из превью
  const cleanContent = guide.content 
    ? guide.content.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^#+\s+/gm, '').replace(/^•\s+/gm, '')
    : "";
  const previewText = cleanContent
    ? cleanContent.length > 100 
      ? cleanContent.substring(0, 100) + "..." 
      : cleanContent
    : "Тут будет подсказка что в нутри...";

  const categoryLabel = guide.category === GuideCategory.EDUCATION
    ? "Образование"
    : guide.category === GuideCategory.LIFE
    ? "Быт"
    : guide.category === GuideCategory.DOCUMENTS
    ? "Документы"
    : guide.category === GuideCategory.CULTURE
    ? "Культура"
    : guide.category === GuideCategory.LEGAL
    ? "Право"
    : "Другое";

  return (
    <>
      <GuideCardBase
        className={className}
        onClick={onClick}
        icon={
          <div
            className={cn(
              "rounded-xl flex-shrink-0 h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center shadow-sm",
              guide.category === GuideCategory.EDUCATION && "bg-blue-600",
              guide.category === GuideCategory.LIFE && "bg-green-600",
              guide.category === GuideCategory.DOCUMENTS && "bg-red-600",
              guide.category === GuideCategory.CULTURE && "bg-purple-600",
              guide.category === GuideCategory.LEGAL && "bg-orange-600",
              (!guide.category || guide.category === GuideCategory.OTHER) && "bg-gray-600"
            )}
          >
            <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
        }
        title={guide.title}
        subtitle={categoryLabel}
        description={previewText}
        footerActions={
          <>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span>©</span>
              <span>{formatDate(guide.updatedAt)}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReadMore}
              className="h-auto p-0 text-blue-600 hover:text-blue-700 text-sm font-medium group transition-all duration-300"
            >
              Читать далее
              <ArrowRight className="ml-1 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </>
        }
      />

      {/* Модальное окно для деталей гайда */}
      <GuideDetailModal
        guide={guide}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
