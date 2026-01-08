import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { Button } from "./button";
import { ArrowRight, BookOpen, Home, Clock, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Guide, GuideCategory } from "@/types";
import { formatDate } from "@/lib/date-utils";
import { useRouter } from "next/navigation";
import { GuideDetailModal } from "./guide-detail-modal";

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

const categoryColors = {
  [GuideCategory.EDUCATION]: "border-blue-200 bg-blue-50 text-blue-700",
  [GuideCategory.LIFE]: "border-green-200 bg-green-50 text-green-700",
  [GuideCategory.DOCUMENTS]: "border-red-200 bg-red-50 text-red-700",
  [GuideCategory.CULTURE]: "border-purple-200 bg-purple-50 text-purple-700",
  [GuideCategory.LEGAL]: "border-orange-200 bg-orange-50 text-orange-700",
  [GuideCategory.OTHER]: "border-gray-200 bg-gray-50 text-gray-700",
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
      <Card
        className={cn(
          "cursor-pointer transition-all duration-300 hover:shadow-md h-full flex flex-col bg-white",
          className
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-3 p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Квадратная иконка с закругленными углами - цвет зависит от категории */}
            <div className={cn(
              "rounded-xl flex-shrink-0 h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center shadow-sm",
              guide.category === GuideCategory.EDUCATION && "bg-blue-600",
              guide.category === GuideCategory.LIFE && "bg-green-600",
              guide.category === GuideCategory.DOCUMENTS && "bg-red-600",
              guide.category === GuideCategory.CULTURE && "bg-purple-600",
              guide.category === GuideCategory.LEGAL && "bg-orange-600",
              (!guide.category || guide.category === GuideCategory.OTHER) && "bg-gray-600"
            )}>
              <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            
            {/* Заголовок и категория */}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-bold leading-tight mb-1 line-clamp-2">
                {guide.title}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-500">
                {categoryLabel}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6 flex-1 flex flex-col min-h-0">
          {/* Превью контента (как на эскизе) - фиксированная высота */}
          <div className="flex-1 mb-4 min-h-0 overflow-hidden">
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
              {previewText}
            </p>
          </div>

          {/* Нижняя часть: дата слева, кнопка справа - всегда внизу */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-shrink-0 mt-auto">
            {/* Дата слева */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span>©</span>
              <span>{formatDate(guide.updatedAt)}</span>
            </div>

            {/* Кнопка "Читать далее->" */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReadMore}
              className="h-auto p-0 text-blue-600 hover:text-blue-700 text-sm font-medium group transition-all duration-300"
            >
              Читать далее
              <ArrowRight className="ml-1 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Модальное окно для деталей гайда */}
      <GuideDetailModal
        guide={guide}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
