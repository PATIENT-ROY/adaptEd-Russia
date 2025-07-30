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
  const Icon = categoryIcons[guide.category];
  const colorClass = categoryColors[guide.category];

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 hover:shadow-lg h-full flex flex-col",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={cn("rounded-lg p-1.5 sm:p-2", colorClass)}>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">
                {guide.title}
              </CardTitle>
              <CardDescription className="mt-1 text-xs sm:text-sm">
                {guide.category === GuideCategory.EDUCATION
                  ? "Образование"
                  : "Быт и право"}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 p-4 sm:p-6 flex-1 flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{new Date(guide.updatedAt).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {guide.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs text-gray-600"
              >
                <Tag className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {tag}
              </span>
            ))}
            {guide.tags.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{guide.tags.length - 2}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 sm:mt-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-blue-600 hover:text-blue-700 text-sm sm:text-base"
          >
            Читать далее
            <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
