"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge size="sm">Категории</Badge>
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
        <Badge size="sm">Сортировка</Badge>
        <Button
          size="sm"
          variant={activeSort === "popular" ? "default" : "outline"}
          onClick={() => onSortChange("popular")}
        >
          Популярные
        </Button>
        <Button
          size="sm"
          variant={activeSort === "new" ? "default" : "outline"}
          onClick={() => onSortChange("new")}
        >
          Новые
        </Button>
      </div>
    </div>
  );
}

