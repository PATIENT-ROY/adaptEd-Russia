import React, { useState, useEffect } from "react";
import { Star as StarIcon } from "lucide-react";

interface RatingStarsProps {
  value: number;
  onChange: (val: number) => void;
  readOnly?: boolean;
  max?: number;
}

export function RatingStars({ value, onChange, readOnly = false, max = 5 }: RatingStarsProps) {
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
            aria-label={`${i} звезд`}
            className="focus:outline-none"
          >
            <StarIcon
              className={`h-6 w-6 ${filled ? "text-yellow-400" : "text-gray-300"}`}
            />
          </button>
        );
      })}
    </div>
  );
}
