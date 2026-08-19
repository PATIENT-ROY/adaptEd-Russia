"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  label: string;
  className?: string;
  onClick?: () => void;
}

export function BackButton({ label, className, onClick }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick ?? (() => router.back())}
      className={cn(
        // Mobile — компактнее
        "h-6 min-h-0 w-fit gap-0.5 rounded-md border border-slate-300 bg-white px-1.5 py-0 text-[10px] font-medium leading-none text-slate-700 shadow-none",
        // Desktop — как сейчас (нормальный размер)
        "sm:h-8 sm:gap-1 sm:rounded-lg sm:px-2.5 sm:text-xs",
        "hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 hover:shadow-none",
        className,
      )}
    >
      <ArrowLeft className="h-2.5 w-2.5 shrink-0 sm:h-3.5 sm:w-3.5" />
      {label}
    </Button>
  );
}
