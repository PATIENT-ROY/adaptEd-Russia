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
    <div className="h-full overflow-hidden rounded-3xl border-0 bg-white p-4 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.22)] sm:p-6 lg:p-8">
      <div className="mb-3 flex items-center gap-2 sm:mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-4 rounded-full sm:h-5 sm:w-5" />
        ))}
      </div>

      <div className="mb-6 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[92%]" />
        <Skeleton className="h-4 w-[80%]" />
        <Skeleton className="h-4 w-[68%]" />
      </div>

      <div className="mt-auto flex items-center rounded-2xl bg-slate-50/80 px-3 py-3">
        <Skeleton className="mr-3 h-10 w-10 rounded-full sm:mr-4 sm:h-12 sm:w-12" />
        <div className="min-w-0 flex-1">
          <Skeleton className="mb-2 h-4 w-32 sm:w-40" />
          <Skeleton className="h-3.5 w-24 sm:w-32" />
        </div>
      </div>
    </div>
  );
}
