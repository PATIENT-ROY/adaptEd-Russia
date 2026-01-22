import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./card";
import { cn } from "@/lib/utils";

type GuideMetaItem = {
  icon?: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
};

interface GuideCardBaseProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  description?: string;
  meta?: GuideMetaItem[];
  tags?: string[];
  footerActions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function GuideCardBase({
  icon,
  title,
  subtitle,
  badges,
  description,
  meta,
  tags,
  footerActions,
  onClick,
  className,
}: GuideCardBaseProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 hover:shadow-md h-full flex flex-col bg-white",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3 p-4 sm:p-6 flex-shrink-0">
        <div className="flex items-start gap-3 sm:gap-4">
          {icon && (
            <div className="rounded-xl flex-shrink-0 h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center shadow-sm">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg font-bold leading-tight mb-1 line-clamp-2">
              {title}
            </CardTitle>
            {subtitle && (
              <div className="text-xs sm:text-sm text-gray-500 line-clamp-1">
                {subtitle}
              </div>
            )}
            {badges && <div className="mt-2 flex flex-wrap gap-2">{badges}</div>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6 flex-1 flex flex-col min-h-0 space-y-4">
        {description && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
            {description}
          </p>
        )}

        {meta && meta.length > 0 && (
          <div className="space-y-2">
            {meta.map((item) => (
              <div
                key={`${item.label}-${item.value}`}
                className="flex items-center justify-between gap-3 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2 text-gray-600">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <span className={cn("font-medium text-gray-800", item.valueClassName)}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>

      {footerActions && (
        <CardFooter className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="flex items-center justify-between w-full gap-3">
            {footerActions}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

