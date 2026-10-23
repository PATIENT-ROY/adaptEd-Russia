import React, { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Star as StarIcon } from "lucide-react";

interface RatingStarsProps {
  value: number;
  onChange: (val: number) => void;
  readOnly?: boolean;
  max?: number;
}

export function RatingStars({ value, onChange, readOnly = false, max = 5 }: RatingStarsProps) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState<number | null>(null);

  const handleClick = (i: number) => {
    if (readOnly) return;
    onChange(i);
  };

  const handleKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (readOnly) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(i);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: max }, (_, idx) => {
        const i = idx + 1;
        const filled = hovered !== null ? i <= hovered : i <= value;
        return (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            disabled={readOnly}
            aria-label={t("profile.review.ratingValue").replace("{n}", String(i)).replace("{max}", String(max))}
            aria-pressed={value === i}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <StarIcon
              aria-hidden
              className={`h-6 w-6 ${filled ? "text-yellow-400" : "text-gray-300"}`}
            />
          </button>
        );
      })}
    </div>
  );
}
