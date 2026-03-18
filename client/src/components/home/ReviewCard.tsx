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
  const formattedDate = createdAtDate.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

  const initialLetter =
    review.user.avatar && review.user.avatar.length > 0
      ? undefined
      : review.user.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <Card className="group relative h-full overflow-hidden rounded-3xl border-0 bg-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.28)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_28px_60px_-26px_rgba(37,99,235,0.28)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] rounded-b-3xl bg-gradient-to-t from-blue-600 via-violet-600/90 to-transparent opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
      />
      <CardContent className="relative z-10 flex h-full flex-col p-4 sm:p-6 lg:p-8">
        <div
          className="mb-3 flex items-center sm:mb-4"
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

        <p className="mb-4 flex-1 text-sm leading-relaxed italic text-slate-700 sm:mb-6 sm:text-base lg:text-lg">
          &ldquo;{displayText}&rdquo;
        </p>
        {needsTruncate && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mb-4 text-left text-sm font-medium text-blue-600 transition-colors duration-300 hover:text-blue-700 sm:mb-6"
          >
            {expanded ? showLessLabel : showMoreLabel}
          </button>
        )}

        <div className="mt-auto rounded-2xl px-1 py-1 transition-colors duration-300 ease-out group-hover:bg-white/10">
          <div className="flex items-center">
            <div className="mr-3 h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white sm:mr-4 sm:h-12 sm:w-12 sm:text-lg">
              <div className="flex h-full w-full items-center justify-center">
                {review.user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={review.user.avatar}
                    alt={review.user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initialLetter
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-sm font-semibold text-slate-900 transition-colors duration-300 ease-out group-hover:text-white sm:text-base">
                  {review.user.name}
                </span>
                {review.user.emailVerified && (
                  <BadgeCheck
                    className="h-4 w-4 flex-shrink-0 text-blue-500 transition-colors duration-300 ease-out group-hover:text-blue-100"
                    aria-label="Verified"
                  />
                )}
                {review.isPremium && (
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-amber-800 transition-colors duration-300 ease-out bg-amber-100/90 group-hover:bg-white/20 group-hover:text-white">
                    <Crown className="mr-0.5 h-3 w-3" />
                    Premium
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-600 transition-colors duration-300 ease-out group-hover:text-blue-50 sm:text-sm">
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden>{review.countryFlag}</span>
                  {review.user.country && <span>{review.user.country}</span>}
                </span>
                {review.user.university && (
                  <>
                    <span className="text-slate-400 transition-colors duration-300 ease-out group-hover:text-blue-200/80">
                      ·
                    </span>
                    <span className="truncate">{review.user.university}</span>
                  </>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-500 transition-colors duration-300 ease-out group-hover:text-blue-100">
                {formattedDate}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400 transition-colors duration-300 ease-out group-hover:text-blue-100/80">
                {publishedLabel}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
