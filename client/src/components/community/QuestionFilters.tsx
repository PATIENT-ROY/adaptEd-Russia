"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";

type FiltersProps = {
  categories: string[];
  activeCategory: string;
  activeSort: "popular" | "new";
  onCategoryChange: (value: string) => void;
  onSortChange: (value: "popular" | "new") => void;
};

export function QuestionFilters({
  categories,
  activeCategory,
  activeSort,
  onCategoryChange,
  onSortChange,
}: FiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge size="sm">{t("community.questions.filters.categories")}</Badge>
        {categories.map((category) => (
          <Button
            key={category}
            size="sm"
            variant={activeCategory === category ? "default" : "outline"}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Badge size="sm">{t("community.questions.filters.sort")}</Badge>
        <Button
          size="sm"
          variant={activeSort === "popular" ? "default" : "outline"}
          onClick={() => onSortChange("popular")}
        >
          {t("community.questions.sort.popular")}
        </Button>
        <Button
          size="sm"
          variant={activeSort === "new" ? "default" : "outline"}
          onClick={() => onSortChange("new")}
        >
          {t("community.questions.sort.new")}
        </Button>
      </div>
    </div>
  );
}
