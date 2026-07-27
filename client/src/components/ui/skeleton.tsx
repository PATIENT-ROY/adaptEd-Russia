import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  );
}

// Skeleton для карточек напоминаний
export function ReminderCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-l-blue-500">
      <div className="flex items-start space-x-3">
        <Skeleton className="h-4 w-4 rounded" />
        <div className="flex-1 min-w-0">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="flex items-center space-x-2 mt-3">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-8 w-24 rounded" />
      </div>
    </div>
  );
}

// Skeleton для карточек гайдов
export function GuideCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-start space-x-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-6 w-3/4 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-4" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton для статистики
export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-12" />
        </div>
      </div>
    </div>
  );
}

// Skeleton для календаря
export function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function TestimonialCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8"
    >
      <div className="mb-3 flex items-center gap-1.5 sm:mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-4 rounded-full sm:h-5 sm:w-5" />
        ))}
      </div>

      <div className="mb-4 flex-1 space-y-2.5 sm:mb-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[94%]" />
        <Skeleton className="h-4 w-[82%]" />
        <Skeleton className="hidden h-4 w-[70%] sm:block" />
      </div>

      <div className="mt-auto flex items-center rounded-2xl bg-slate-50 px-2 py-2 sm:px-3 sm:py-3">
        <Skeleton className="mr-3 h-10 w-10 shrink-0 rounded-full sm:mr-4 sm:h-12 sm:w-12" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-32 sm:w-40" />
          <Skeleton className="h-3 w-24 sm:w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

/** Homepage trust stats grid (matches TrustStats layout) */
export function TrustStatsSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200/80 bg-slate-100/80 p-3 text-center sm:rounded-2xl sm:p-4"
        >
          <Skeleton className="mx-auto mb-2 h-5 w-5 rounded-md sm:h-6 sm:w-6" />
          <Skeleton className="mx-auto mb-2 h-7 w-14 sm:h-8 sm:w-16" />
          <Skeleton className="mx-auto h-3 w-16 sm:w-20" />
        </div>
      ))}
    </div>
  );
}

/** Homepage content proof strip under hero */
export function ContentProofSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-wrap items-center justify-center gap-3 sm:gap-5"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 rounded-full ${i === 0 ? "w-24" : i === 1 ? "w-20 sm:w-24" : "w-28 sm:w-32"}`}
        />
      ))}
    </div>
  );
}
