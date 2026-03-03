"use client";

import { useState } from "react";
import { Star, Crown, BadgeCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PublicReview } from "@/types";

const TRUNCATE_LENGTH = 320;

interface ReviewCardProps {
  review: PublicReview;
  starsLabel: string;
  showMoreLabel: string;
  showLessLabel: string;
  publishedLabel: string;
}

export function ReviewCard({
  review,
  starsLabel,
  showMoreLabel,
  showLessLabel,
  publishedLabel,
}: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncate = review.text.length > TRUNCATE_LENGTH;
  const displayText =
    needsTruncate && !expanded
      ? `${review.text.slice(0, TRUNCATE_LENGTH)}…`
      : review.text;

  const createdAtDate = new Date(review.createdAt);
  const formattedDate = createdAtDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const initialLetter =
    review.user.avatar && review.user.avatar.length > 0
      ? undefined
      : review.user.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <Card className="border-0 shadow-xl h-full backdrop-blur-sm bg-white/90">
      <CardContent className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
        <div
          className="flex items-center mb-3 sm:mb-4"
          role="img"
          aria-label={`${review.rating} ${starsLabel}`}
        >
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 sm:h-5 sm:w-5 ${
                i < review.rating
                  ? "text-yellow-400 fill-current"
                  : "text-slate-200"
              }`}
              aria-hidden
            />
          ))}
        </div>

        <p className="text-slate-700 text-sm sm:text-base lg:text-lg leading-relaxed mb-4 sm:mb-6 italic flex-1">
          &ldquo;{displayText}&rdquo;
        </p>
        {needsTruncate && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 mb-4 sm:mb-6 text-left"
          >
            {expanded ? showLessLabel : showMoreLabel}
          </button>
        )}

        <div className="flex items-center mt-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-lg mr-3 sm:mr-4 flex-shrink-0 overflow-hidden">
            {review.user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={review.user.avatar}
                alt={review.user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              initialLetter
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-semibold text-slate-900 text-sm sm:text-base">
                {review.user.name}
              </span>
              {review.user.emailVerified && (
                <BadgeCheck
                  className="h-4 w-4 text-blue-500 flex-shrink-0"
                  aria-label="Verified"
                />
              )}
              {review.isPremium && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                  <Crown className="h-3 w-3 mr-0.5" />
                  Premium
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 text-slate-600 text-xs sm:text-sm mt-0.5">
              <span className="inline-flex items-center gap-1">
                <span aria-hidden>{review.countryFlag}</span>
                {review.user.country && <span>{review.user.country}</span>}
              </span>
              {review.user.university && (
                <>
                  <span className="text-slate-400">·</span>
                  <span className="truncate">{review.user.university}</span>
                </>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              {formattedDate}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {publishedLabel}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
